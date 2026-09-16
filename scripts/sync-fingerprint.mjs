#!/usr/bin/env node
/**
 * 담당 레포들의 origin/dev 상태를 지문(fingerprint)으로 뽑아 이전 지문과 비교한다.
 * 작업 트리는 건드리지 않고 `git show origin/dev:<path>` 로 dev 트리를 직접 읽는다.
 *
 *   node scripts/sync-fingerprint.mjs            # fetch → 지문 생성 → .sync/pending/ 에 저장 → 리포트 출력
 *   node scripts/sync-fingerprint.mjs --no-fetch # 네트워크 없이 로컬 origin/dev 참조만 사용
 *   node scripts/sync-fingerprint.mjs --accept   # pending 지문을 baseline(.sync/snapshots/)으로 확정
 *   node scripts/sync-fingerprint.mjs --repo hub # 특정 레포만 (이름 일부 매칭)
 *
 * 리포트는 stdout 과 .sync/last-report.md 에 동시에 남는다.
 * /sync 스킬이 이 리포트를 읽고 .claude/agents/*.md, docs/services.md, docs/playbook.html 을 갱신한 뒤 --accept 를 호출한다.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SYNC_DIR = join(ROOT, '.sync')
const SNAP_DIR = join(SYNC_DIR, 'snapshots')
const PENDING_DIR = join(SYNC_DIR, 'pending')
const REPORT_PATH = join(SYNC_DIR, 'last-report.md')
const BRANCH = 'origin/dev'

const REPOS = [
  { name: 'client-brics-refund', agent: 'refund-fe', path: '/Users/mason/mason-zent/client-brics-refund', kind: 'single', appDir: 'app' },
  { name: 'client-brics-hub', agent: 'hub-fe', path: '/Users/mason/mason-zent/client-brics-hub', kind: 'single', appDir: 'app' },
  { name: 'bznav-web', agent: 'bznav-fe', path: '/Users/mason/mason-zent/bznav-web', kind: 'monorepo' },
  { name: 'web-op', agent: 'op-fe', path: '/Users/mason/mason-zent/web-op', kind: 'single', appDir: 'app', srcDir: 'src' }
]

// 에이전트 md 에 영향을 주는 의존성만 추적한다 (전체 deps 는 노이즈)
const DEP_PATTERNS = [
  /^next$/, /^react$/, /^react-dom$/, /^typescript$/, /^swr$/, /^orval$/, /^axios$/,
  /^react-relay$/, /^relay-runtime$/, /^relay-compiler$/, /^graphql$/,
  /^zustand$/, /^jotai$/, /^nuqs$/, /^styled-components$/, /^tailwindcss$/,
  /^react-hook-form$/, /^zod$/, /^yup$/, /^next-auth$/, /^jest$/, /^vitest$/, /^@playwright\/test$/,
  /^@ebay\/nice-modal-react$/, /^@zenterprise-inc\//, /^@repo\//, /^turbo$/, /^storybook$/
]

// 레포 규칙·소개 문서. 내용이 바뀌면 에이전트 md 재검토 대상
const DOC_FILES = ['README.md', 'CLAUDE.md', 'AGENTS.md', '.ai/basic-rule.md', '.prettierrc', 'prettier.config.js', '.nvmrc']
const DOC_GLOB_DIRS = ['.github/agents', '.github/skills', '.claude/rules', 'docs']

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const optValue = (name) => { const idx = args.indexOf(name); return idx >= 0 ? args[idx + 1] : null }
const NO_FETCH = flag('--no-fetch')
const ACCEPT = flag('--accept')
const REPO_FILTER = optValue('--repo')

const git = (repoPath, gitArgs, { allowFail = false } = {}) => {
  try {
    return execFileSync('git', ['-C', repoPath, ...gitArgs], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 }).trimEnd()
  } catch (error) {
    if (allowFail) return null
    throw error
  }
}
const showFile = (repoPath, filePath) => git(repoPath, ['show', `${BRANCH}:${filePath}`], { allowFail: true })
const readJson = (repoPath, filePath) => {
  const raw = showFile(repoPath, filePath)
  if (raw === null) return null
  try { return JSON.parse(raw) } catch { return { __parseError: true } }
}
// 디렉토리 항목 나열 (blob/tree 이름). 없으면 null
const listTree = (repoPath, dirPath) => {
  const out = git(repoPath, ['ls-tree', '--name-only', BRANCH, dirPath ? `${dirPath}/` : ''], { allowFail: true })
  if (out === null || out === '') return null
  return out.split('\n').map((line) => line.replace(/^.*\//, '')).filter(Boolean).sort()
}
const listDirsOnly = (repoPath, dirPath) => {
  const out = git(repoPath, ['ls-tree', BRANCH, dirPath ? `${dirPath}/` : ''], { allowFail: true })
  if (out === null || out === '') return null
  return out.split('\n').filter((line) => line.includes(' tree ')).map((line) => line.split('\t')[1].replace(/^.*\//, '')).sort()
}
// 파일들의 blob id (내용 변경 감지용)
const blobIds = (repoPath, paths) => {
  const result = {}
  for (const filePath of paths) {
    const out = git(repoPath, ['ls-tree', BRANCH, filePath], { allowFail: true })
    if (out) result[filePath] = out.split(/\s+/)[2].slice(0, 12)
  }
  return result
}
const blobIdsInDir = (repoPath, dirPath) => {
  const out = git(repoPath, ['ls-tree', '-r', BRANCH, `${dirPath}/`], { allowFail: true })
  if (!out) return {}
  const result = {}
  for (const line of out.split('\n')) {
    const [meta, filePath] = line.split('\t')
    if (!filePath) continue
    result[filePath] = meta.split(/\s+/)[2].slice(0, 12)
  }
  return result
}

const pickDeps = (pkg) => {
  const merged = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) }
  const picked = {}
  for (const [depName, version] of Object.entries(merged).sort()) {
    if (DEP_PATTERNS.some((pattern) => pattern.test(depName))) picked[depName] = version
  }
  return picked
}
const portFromScript = (devScript) => {
  const match = devScript?.match(/-p\s+(\d{2,5})/) ?? devScript?.match(/--port[= ](\d{2,5})/)
  return match ? Number(match[1]) : (devScript ? 3000 : null)
}
const summarizePackage = (pkg) => pkg ? {
  name: pkg.name ?? null,
  version: pkg.version ?? null,
  packageManager: pkg.packageManager ?? null,
  engines: pkg.engines ?? null,
  scripts: pkg.scripts ?? {},
  deps: pickDeps(pkg)
} : null

const buildSnapshot = (repo) => {
  const sha = git(repo.path, ['rev-parse', BRANCH])
  const [shaDate, subject] = git(repo.path, ['log', '-1', '--format=%cs%n%s', BRANCH]).split('\n')
  const rootPkg = readJson(repo.path, 'package.json')
  const snapshot = {
    repo: repo.name,
    agent: repo.agent,
    branch: BRANCH,
    sha: sha.slice(0, 12),
    shaDate,
    subject,
    package: summarizePackage(rootPkg),
    port: portFromScript(rootPkg?.scripts?.dev),
    prettier: showFile(repo.path, '.prettierrc') ?? showFile(repo.path, 'prettier.config.js') ?? showFile(repo.path, '.prettierrc.json') ?? null,
    nvmrc: showFile(repo.path, '.nvmrc'),
    dirs: {},
    docs: {}
  }

  if (repo.kind === 'single') {
    // app/ 1단계 + 2단계 (라우트 구조)
    const appTop = listDirsOnly(repo.path, repo.appDir)
    if (appTop) {
      snapshot.dirs[repo.appDir] = appTop
      for (const dirName of appTop) {
        if (dirName.startsWith('_') || dirName === 'api') continue
        const second = listDirsOnly(repo.path, `${repo.appDir}/${dirName}`)
        if (second && second.length) snapshot.dirs[`${repo.appDir}/${dirName}`] = second.filter((name) => !name.startsWith('_'))
      }
    }
    if (repo.srcDir) {
      const srcTop = listDirsOnly(repo.path, repo.srcDir)
      if (srcTop) {
        snapshot.dirs[repo.srcDir] = srcTop
        for (const dirName of srcTop) {
          const second = listDirsOnly(repo.path, `${repo.srcDir}/${dirName}`)
          if (second && second.length) snapshot.dirs[`${repo.srcDir}/${dirName}`] = second
        }
      }
    }
    const libTop = listTree(repo.path, 'lib')
    if (libTop) snapshot.dirs.lib = libTop
  } else {
    // 모노레포: apps/* 와 packages/* 각각의 package.json 요약
    snapshot.apps = {}
    snapshot.packages = {}
    for (const appName of listDirsOnly(repo.path, 'apps') ?? []) {
      const pkg = readJson(repo.path, `apps/${appName}/package.json`)
      const usesPages = listTree(repo.path, `apps/${appName}/pages`) !== null
      const usesApp = listTree(repo.path, `apps/${appName}/app`) !== null || listTree(repo.path, `apps/${appName}/src/app`) !== null
      snapshot.apps[appName] = {
        name: pkg?.name ?? null,
        dev: pkg?.scripts?.dev ?? null,
        port: portFromScript(pkg?.scripts?.dev),
        router: usesPages && !usesApp ? 'pages' : usesApp ? 'app' : 'unknown',
        deps: pickDeps(pkg)
      }
    }
    for (const pkgName of listDirsOnly(repo.path, 'packages') ?? []) {
      const pkg = readJson(repo.path, `packages/${pkgName}/package.json`)
      snapshot.packages[pkgName] = pkg?.name ?? null
    }
    const workspaceYaml = showFile(repo.path, 'pnpm-workspace.yaml')
    snapshot.catalogHash = workspaceYaml ? hashString(workspaceYaml) : null
  }

  snapshot.docs = { ...blobIds(repo.path, DOC_FILES) }
  for (const dirPath of DOC_GLOB_DIRS) Object.assign(snapshot.docs, blobIdsInDir(repo.path, dirPath))
  return snapshot
}

const hashString = (text) => {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) | 0
  return (hash >>> 0).toString(16)
}

// ---- diff ----
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const fmt = (value) => value === undefined ? '(없음)' : typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value)
const diffValues = (before, after, path, lines) => {
  if (JSON.stringify(before) === JSON.stringify(after)) return
  if (Array.isArray(before) && Array.isArray(after)) {
    const added = after.filter((item) => !before.includes(item))
    const removed = before.filter((item) => !after.includes(item))
    if (added.length) lines.push(`+ ${path}: ${added.map(fmt).join(', ')}`)
    if (removed.length) lines.push(`- ${path}: ${removed.map(fmt).join(', ')}`)
    return
  }
  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of [...keys].sort()) diffValues(before[key], after[key], path ? `${path}.${key}` : key, lines)
    return
  }
  if (path === 'prettier') { lines.push(`~ prettier 설정 변경됨 (내용은 git diff 로 확인)`); return }
  lines.push(`~ ${path}: ${fmt(before)} → ${fmt(after)}`)
}

const commitsBetween = (repo, fromSha, toSha) => {
  const log = git(repo.path, ['log', '--oneline', '--no-decorate', `${fromSha}..${toSha}`], { allowFail: true }) ?? ''
  const commits = log ? log.split('\n') : []
  const files = git(repo.path, ['diff', '--name-only', `${fromSha}..${toSha}`], { allowFail: true }) ?? ''
  const buckets = {}
  for (const filePath of files ? files.split('\n') : []) {
    const key = filePath.split('/').slice(0, 2).join('/')
    buckets[key] = (buckets[key] ?? 0) + 1
  }
  const topDirs = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 15)
  return { commits, fileCount: files ? files.split('\n').length : 0, topDirs }
}

// ---- main ----
const ensureDirs = () => { for (const dir of [SYNC_DIR, SNAP_DIR, PENDING_DIR]) if (!existsSync(dir)) mkdirSync(dir, { recursive: true }) }
const loadJson = (filePath) => existsSync(filePath) ? JSON.parse(readFileSync(filePath, 'utf8')) : null

if (ACCEPT) {
  ensureDirs()
  const pendingFiles = existsSync(PENDING_DIR) ? readdirSync(PENDING_DIR).filter((name) => name.endsWith('.json')) : []
  if (!pendingFiles.length) { console.log('확정할 pending 지문이 없습니다. 먼저 인자 없이 실행하세요.'); process.exit(0) }
  for (const fileName of pendingFiles) renameSync(join(PENDING_DIR, fileName), join(SNAP_DIR, fileName))
  writeFileSync(join(SYNC_DIR, 'state.json'), JSON.stringify({ acceptedAt: new Date().toISOString(), repos: pendingFiles.map((name) => name.replace(/\.json$/, '')) }, null, 2))
  console.log(`baseline 확정: ${pendingFiles.map((name) => name.replace(/\.json$/, '')).join(', ')}`)
  process.exit(0)
}

ensureDirs()
const targets = REPOS.filter((repo) => !REPO_FILTER || repo.name.includes(REPO_FILTER) || repo.agent.includes(REPO_FILTER))
const report = []
const today = new Date().toISOString().slice(0, 10)
report.push(`# Hermes sync 리포트 (${today})`, '', `기준 브랜치: \`${BRANCH}\`. 작업 트리는 읽지 않았다.`, '')

let changedCount = 0
for (const repo of targets) {
  if (!existsSync(repo.path)) { report.push(`## ${repo.name} (${repo.agent})`, '', `⚠️ 경로가 없다: ${repo.path}`, ''); continue }
  let fetchNote = ''
  if (!NO_FETCH) {
    const fetched = git(repo.path, ['fetch', '--quiet', 'origin', 'dev'], { allowFail: true })
    if (fetched === null) fetchNote = ' (fetch 실패, 로컬 origin/dev 참조 사용)'
  }
  const snapshot = buildSnapshot(repo)
  const previous = loadJson(join(SNAP_DIR, `${repo.name}.json`))
  writeFileSync(join(PENDING_DIR, `${repo.name}.json`), JSON.stringify(snapshot, null, 2))

  report.push(`## ${repo.name} → \`.claude/agents/${repo.agent}.md\``, '')
  report.push(`- origin/dev: \`${snapshot.sha}\` ${snapshot.shaDate} "${snapshot.subject}"${fetchNote}`)

  if (!previous) {
    report.push('- **baseline 없음** — 첫 실행. 아래 지문 전체를 에이전트 md 와 대조해 틀린 사실을 고친 뒤 `--accept`.', '')
    report.push('```json', JSON.stringify({ ...snapshot, docs: Object.keys(snapshot.docs) }, null, 2), '```', '')
    changedCount += 1
    continue
  }
  if (previous.sha === snapshot.sha) { report.push('- 변경 없음 (동일 커밋)', ''); continue }

  changedCount += 1
  const { commits, fileCount, topDirs } = commitsBetween(repo, previous.sha, snapshot.sha)
  report.push(`- 이전 baseline: \`${previous.sha}\` ${previous.shaDate} → 커밋 ${commits.length}개, 파일 ${fileCount}개 변경`)
  if (topDirs.length) report.push(`- 변경 많은 경로: ${topDirs.map(([dir, count]) => `\`${dir}\`(${count})`).join(', ')}`)

  const lines = []
  const { docs: prevDocs, sha: _a, shaDate: _b, subject: _c, ...prevRest } = previous
  const { docs: nextDocs, sha: _d, shaDate: _e, subject: _f, ...nextRest } = snapshot
  diffValues(prevRest, nextRest, '', lines)
  const docChanges = []
  for (const filePath of new Set([...Object.keys(prevDocs ?? {}), ...Object.keys(nextDocs ?? {})])) {
    if (!prevDocs?.[filePath]) docChanges.push(`+ ${filePath} (신규)`)
    else if (!nextDocs?.[filePath]) docChanges.push(`- ${filePath} (삭제)`)
    else if (prevDocs[filePath] !== nextDocs[filePath]) docChanges.push(`~ ${filePath}`)
  }

  report.push('', '### 지문 변화 (스택·명령·포트·디렉토리)')
  report.push(lines.length ? '```diff' : '', ...(lines.length ? lines : ['- 없음. 코드만 바뀌고 구조·스택은 동일']), lines.length ? '```' : '')
  report.push('', '### 규칙·소개 문서 변화')
  if (docChanges.length) {
    report.push('```diff', ...docChanges.sort(), '```', '', `내용 확인: \`git -C ${repo.path} diff ${previous.sha}..${snapshot.sha} -- <파일>\``)
  } else report.push('- 없음')
  report.push('', `### 커밋 (최근 ${Math.min(commits.length, 40)}개)`, '```', ...commits.slice(0, 40), commits.length > 40 ? `... 외 ${commits.length - 40}개` : '', '```', '')
}

report.push('---', '', changedCount
  ? `변경된 레포 ${changedCount}개. 문서 갱신 후 \`node scripts/sync-fingerprint.mjs --accept\` 로 baseline 을 확정한다.`
  : '모든 레포가 baseline 과 동일. 갱신할 것이 없다.')

const text = report.filter((line) => line !== undefined).join('\n')
writeFileSync(REPORT_PATH, text)
console.log(text)
