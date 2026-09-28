#!/usr/bin/env node
/**
 * 다이어그램 근거 점검 — 고정된 커밋(repository.revision)과 지금 운영 기준 브랜치를 비교한다.
 *
 * 다이어그램은 커밋에 고정돼 있어 archify validate 는 계속 통과한다. 그래서 운영 코드가 바뀌어도
 * 그림이 조용히 낡는다(2026-09-28 care-web NEWCARE-649 폴더 개명 때 실제로 그랬다).
 * 이 스크립트는 sources 의 path·line 을 운영 기준 ref 에서 다시 찾아 어긋난 곳만 알려준다.
 * 고치지는 않는다 — 고칠지·다시 그릴지는 사람이 정한다.
 *
 *   node scripts/check-diagrams.mjs            # 전체 점검, 마크다운 보고
 *   node scripts/check-diagrams.mjs --strict   # 어긋남이 있으면 exit 1
 *   node scripts/check-diagrams.mjs --repin    # 근거가 그대로인 장만 revision 을 기준 ref 로 올린다
 *                                              (HTML 은 다시 만들어야 한다 — docs/diagrams/AUTHORING.md)
 *
 * 기준 ref 는 hermes.config.json 의 branch (bznav-web 은 sources 경로의 앱으로 prd-<앱>).
 * sync 1단계에서 fetch 한 origin/<branch> 를 읽는다. 로컬 작업 트리는 읽지 않는다.
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIAGRAM_DIR = join(ROOT, 'docs/diagrams')
const config = JSON.parse(readFileSync(join(ROOT, 'hermes.config.json'), 'utf8'))
const strict = process.argv.includes('--strict')
const repin = process.argv.includes('--repin')
const repinned = []

const git = (repoDir, args) => {
  try {
    return execFileSync('git', ['-C', repoDir, ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}

const listJson = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return name === 'bundle' ? [] : listJson(full)
    return name.endsWith('.json') ? [full] : []
  })

const collectSources = (node, found = []) => {
  if (Array.isArray(node)) node.forEach((child) => collectSources(child, found))
  else if (node && typeof node === 'object') {
    if (Array.isArray(node.sources)) found.push(...node.sources.filter((source) => source && source.path))
    Object.values(node).forEach((child) => collectSources(child, found))
  }
  return found
}

// 이 다이어그램이 봐야 할 운영 기준 브랜치
const targetBranch = (repoConfig, sources) => {
  if (!repoConfig.apps) return repoConfig.branch
  const appMatch = sources.map((source) => source.path.match(/^apps\/([^/]+)\//)).find(Boolean)
  const app = appMatch && repoConfig.apps[appMatch[1]]
  return app ? app.branch : repoConfig.branch
}

const fileCache = new Map()
const readAt = (repoDir, ref, path) => {
  const key = `${repoDir}\0${ref}\0${path}`
  if (!fileCache.has(key)) {
    const text = git(repoDir, ['show', `${ref}:${path}`])
    fileCache.set(key, text === null ? null : text.split('\n'))
  }
  return fileCache.get(key)
}

// 고정 커밋 → 기준 ref 사이의 이름 변경 (한 쌍당 한 번만 계산)
const renameCache = new Map()
const renamesBetween = (repoDir, fromRef, toRef) => {
  const key = `${repoDir}\0${fromRef}\0${toRef}`
  if (!renameCache.has(key)) {
    const renames = new Map()
    const out = git(repoDir, ['diff', '-M', '--name-status', '--diff-filter=R', fromRef, toRef]) ?? ''
    for (const row of out.split('\n')) {
      const [status, oldPath, newPath] = row.split('\t')
      if (status?.startsWith('R') && oldPath && newPath) renames.set(oldPath, newPath)
    }
    renameCache.set(key, renames)
  }
  return renameCache.get(key)
}

// 옛 줄의 내용을 새 파일에서 가장 가까운 위치로 다시 찾는다
const relocateLine = (oldLines, newLines, line) => {
  if (!oldLines || !newLines || !line || line > oldLines.length) return { status: 'unknown' }
  const text = oldLines[line - 1].trim()
  if (!text) return { status: 'same' }
  if (newLines[line - 1]?.trim() === text) return { status: 'same' }
  const candidates = newLines.flatMap((candidate, index) => (candidate.trim() === text ? [index + 1] : []))
  if (!candidates.length) return { status: 'gone', text }
  const nearest = candidates.reduce((best, candidate) => (Math.abs(candidate - line) < Math.abs(best - line) ? candidate : best))
  return { status: 'moved', to: nearest }
}

const results = []
for (const file of listJson(DIAGRAM_DIR)) {
  let diagram
  try {
    diagram = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    continue
  }
  const repository = diagram.meta?.repository ?? diagram.repository
  const revision = repository?.revision
  const sources = collectSources(diagram)
  if (!revision || !sources.length) continue

  const name = relative(DIAGRAM_DIR, file)
  const repoName = String(repository.url ?? '').split('/').pop()
  const repoConfig = config.repos.find((repo) => repo.name === repoName)
  const repoDir = join(ROOT, 'repos', repoName)
  if (!repoConfig || !existsSync(repoDir)) {
    results.push({ name, verdict: '⚠️ 레포 없음', issues: [`${repoName} 를 config·repos/ 에서 찾지 못했다`] })
    continue
  }

  const branch = targetBranch(repoConfig, sources)
  const target = git(repoDir, ['rev-parse', `origin/${branch}`])?.trim()
  if (!target) {
    results.push({ name, repoName, branch, verdict: '⚠️ 기준 ref 없음', issues: [`origin/${branch} 가 없다 — sync 1단계 fetch 확인`] })
    continue
  }

  const base = { name, repoName, branch, revision: revision.slice(0, 7), target: target.slice(0, 7), sources: sources.length }
  if (target.startsWith(revision) || revision.startsWith(target)) {
    results.push({ ...base, verdict: '✅ 최신', issues: [] })
    continue
  }

  const issues = []
  const onBranch = git(repoDir, ['merge-base', '--is-ancestor', revision, target]) !== null
  if (!onBranch) issues.push(`고정 커밋 ${revision.slice(0, 7)} 가 origin/${branch} 에 없다 (운영 반영분이 아닌 커밋에 고정됨)`)
  const renames = renamesBetween(repoDir, revision, target)

  for (const source of sources) {
    let path = source.path
    let newLines = readAt(repoDir, target, path)
    if (!newLines && renames.has(path)) {
      path = renames.get(path)
      newLines = readAt(repoDir, target, path)
      issues.push(`경로 변경 ${source.path} → ${path}`)
    }
    if (!newLines) {
      issues.push(`파일 없음 ${source.path}`)
      continue
    }
    const oldLines = readAt(repoDir, revision, source.path)
    for (const key of ['line', 'end_line']) {
      const line = source[key]
      if (!line || line === 1) continue
      const found = relocateLine(oldLines, newLines, line)
      if (found.status === 'moved') issues.push(`줄 이동 ${path}:${line} → ${found.to}`)
      if (found.status === 'gone') issues.push(`줄 내용 사라짐 ${path}:${line} "${found.text.slice(0, 50)}"`)
    }
  }
  // 근거(path·line)가 그대로면 revision 만 올려도 된다. 운영에 없는 커밋에 고정된 것도 근거가 멀쩡하면 같다
  const evidenceIssues = issues.filter((issue) => !issue.startsWith('고정 커밋'))
  if (repin && !evidenceIssues.length) {
    const text = readFileSync(file, 'utf8')
    writeFileSync(file, text.split(revision).join(target))
    repinned.push(name)
  }
  results.push({ ...base, verdict: issues.length ? `❌ 어긋남 ${issues.length}` : '🟡 커밋만 뒤처짐', issues })
}

const lines = ['# 다이어그램 근거 점검', '', '| 다이어그램 | 기준 | 고정 → 현재 | sources | 결과 |', '|---|---|---|---|---|']
for (const result of results) {
  const refs = result.revision ? `${result.revision} → ${result.target}` : '-'
  lines.push(`| ${result.name} | ${result.branch ? `origin/${result.branch}` : '-'} | ${refs} | ${result.sources ?? '-'} | ${result.verdict} |`)
}
const drifted = results.filter((result) => result.issues.length)
for (const result of drifted) {
  lines.push('', `## ${result.name}`, ...result.issues.slice(0, 40).map((issue) => `- ${issue}`))
  if (result.issues.length > 40) lines.push(`- … 외 ${result.issues.length - 40}건`)
}
lines.push(
  '',
  '범례: ✅ 고정 커밋 = 운영 기준 · 🟡 커밋은 뒤처졌지만 근거는 그대로(revision 만 올려 다시 고정하면 된다) · ❌ 근거가 어긋남(내용 확인 후 JSON 수정·재생성)',
)
if (repin) lines.push('', `## --repin: revision 을 올린 장 ${repinned.length}개`, ...repinned.map((name) => `- ${name}`), '', 'HTML 을 다시 만든다(validate → deliver, 탭 번들은 build-bundle.py).')
console.log(lines.join('\n'))
if (strict && drifted.length) process.exit(1)
