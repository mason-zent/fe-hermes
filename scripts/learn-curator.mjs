#!/usr/bin/env node
/**
 * 학습 루프 정리(Curator) — 스킬이 얼마나 쓰이는지 세어 오래 안 쓴 스킬을 "정리 후보"로 올린다.
 * knowledge 는 참고로 열람 횟수만 보여 준다 — 안 읽힌 파일은 "그 레포 작업이 없었다"는 뜻이라 정리 후보로 삼지 않는다.
 * 지우지 않는다. 후보를 이슈 하나(repo: hermes)로 모아 두면 사용자가 고르고, 헤르메스가 archive 로 옮긴다.
 *
 *   node scripts/learn-curator.mjs              # 미리보기 — 표만 출력, 아무것도 쓰지 않는다
 *   node scripts/learn-curator.mjs --write      # 후보가 있으면 issues/<날짜>-hermes-learn-curator.md 를 만들거나 갱신
 *   옵션 --days <N> : 안 쓴 기간 기준(기본 30)
 *
 * 무엇을 세나 (이 컴퓨터의 Claude Code 대화 기록 ~/.claude/projects/<폴더>/<세션>.jsonl)
 *   - 스킬: 헤르메스·워크트리 세션(<hermes>* 폴더)의 Skill 도구 호출 { "skill": "<이름>" } 과 슬래시 입력 <command-name>/<이름></command-name>
 *     (스킬은 헤르메스 세션에만 보인다 — FE pane 에는 없다)
 *   - knowledge: 모든 세션의 도구 호출(Read·Bash cat/sed 등)에 <hermes>/docs/knowledge/**.md 경로가 나온 횟수.
 *     FE 에이전트는 레포 폴더에서도 뜨므로 폴더를 가리지 않는다. `cd …/knowledge; cat x.md` 처럼 경로가 쪼개진 읽기는 못 센다(근삿값)
 * 대화 내용은 읽어 세기만 하고 이슈에 옮기지 않는다(이름·횟수·날짜만). 대화 기록은 사람마다 다르므로 결과도 이 컴퓨터 기준이다.
 * Hermes Agent 의 Curator(14일 stale · 30일 archive, 삭제 안 함)를 승인 기반으로 옮긴 것 — plans/feature/20261008-학습-루프-2단계-Hermes-Agent-이식.md
 */
import { createReadStream, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { createInterface } from 'node:readline'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const shouldWrite = argv.includes('--write')
const daysIndex = argv.indexOf('--days')
const staleDays = daysIndex >= 0 ? Number(argv[daysIndex + 1]) || 30 : 30
const DAY_MS = 24 * 60 * 60 * 1000
const now = Date.now()
const today = new Date().toISOString().slice(0, 10)

// 헤르메스 + 그 워크트리 세션의 대화 기록 폴더(.worktrees 아래 세션은 이름이 hermes 폴더 이름으로 시작한다)
const projectsDir = join(homedir(), '.claude/projects')
const projectPrefix = ROOT.replace(/[/.]/g, '-')
const transcriptDirs = existsSync(projectsDir) ? readdirSync(projectsDir).map((name) => join(projectsDir, name)) : []
const isHermesDir = (dir) => {
  const name = dir.slice(projectsDir.length + 1)
  return name === projectPrefix || name.startsWith(`${projectPrefix}--worktrees`)
}

// 대상 목록 — 지금 있는 스킬과 knowledge 파일
const skillNames = readdirSync(join(ROOT, '.claude/skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, '.claude/skills', entry.name, 'SKILL.md')))
  .map((entry) => entry.name)
const knowledgeFiles = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (entry.name.endsWith('.md')) knowledgeFiles.push(relative(ROOT, path))
  }
}
walk(join(ROOT, 'docs/knowledge'))

// 처음 들어온 날 — git 에 처음 추가된 날(없으면 오늘). 새로 생긴 것을 "안 쓴 것"으로 올리지 않으려고
const addedOn = (path) => {
  try {
    const dates = execFileSync('git', ['log', '--diff-filter=A', '--format=%cs', '--', path], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
    return dates.at(-1) || today
  } catch {
    return today
  }
}

const usage = new Map() // key → { count, recent, last }
const bump = (key, timestamp) => {
  const entry = usage.get(key) ?? { count: 0, recent: 0, last: '' }
  entry.count += 1
  if (timestamp && now - Date.parse(timestamp) <= staleDays * DAY_MS) entry.recent += 1
  if (timestamp && timestamp > entry.last) entry.last = timestamp
  usage.set(key, entry)
}
const skillCallPattern = /"name":"Skill","input":\{"skill":"([a-z0-9:_-]+)"/g
const slashPattern = /<command-name>\/([a-z0-9_-]+)<\/command-name>/g
// 도구 호출 줄에서 hermes 절대 경로의 knowledge 파일 — 다른 레포의 같은 이름 경로를 섞지 않으려고 ROOT 를 붙여 찾는다
const escapedRoot = ROOT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const knowledgePattern = new RegExp(`${escapedRoot}/(docs/knowledge/[\\w./-]+?\\.md)`, 'g')
const timestampPattern = /"timestamp":"([^"]+)"/

// 사용자가 직접 입력한 글(문자열 또는 text 블록)만 — grep·cat 결과(tool_result)에 섞인 <command-name> 을 사용으로 세지 않으려고
const userTypedText = (line) => {
  try {
    const record = JSON.parse(line)
    if (record.type !== 'user') return ''
    const content = record.message?.content
    if (typeof content === 'string') return content
    if (Array.isArray(content)) return content.filter((block) => block?.type === 'text').map((block) => block.text ?? '').join('\n')
  } catch {
    // 깨진 줄은 건너뛴다
  }
  return ''
}

const scanFile = async (path, countSkills) => {
  const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity })
  for await (const line of lines) {
    const mentionsKnowledge = line.includes('docs/knowledge/') && line.includes('"tool_use"')
    if (!mentionsKnowledge && !(countSkills && (line.includes('"Skill"') || line.includes('<command-name>')))) continue
    const timestamp = line.match(timestampPattern)?.[1] ?? ''
    if (countSkills) {
      for (const match of line.matchAll(skillCallPattern)) bump(`skill:${match[1]}`, timestamp)
      if (line.includes('<command-name>')) for (const match of userTypedText(line).matchAll(slashPattern)) bump(`skill:${match[1]}`, timestamp)
    }
    // 한 줄(도구 호출 한 번)에 같은 파일이 여러 번 나와도 한 번으로
    if (mentionsKnowledge) for (const file of new Set([...line.matchAll(knowledgePattern)].map((match) => match[1]))) bump(file, timestamp)
  }
}
for (const dir of transcriptDirs) {
  let files = []
  try { files = readdirSync(dir) } catch { continue }
  for (const file of files) if (file.endsWith('.jsonl')) await scanFile(join(dir, file), isHermesDir(dir))
}

const describe = (key, path) => {
  const entry = usage.get(key) ?? { count: 0, recent: 0, last: '' }
  const added = addedOn(path)
  const lastUsed = entry.last ? entry.last.slice(0, 10) : ''
  const sinceUse = lastUsed ? Math.floor((now - Date.parse(lastUsed)) / DAY_MS) : Infinity
  const sinceAdded = Math.floor((now - Date.parse(added)) / DAY_MS)
  const stale = sinceUse > staleDays && sinceAdded > staleDays
  return { key, path, count: entry.count, recent: entry.recent, lastUsed: lastUsed || '없음', added, stale }
}
const skills = skillNames.map((name) => describe(`skill:${name}`, `.claude/skills/${name}/SKILL.md`))
const knowledge = knowledgeFiles.map((path) => describe(path, path))
// knowledge 는 후보로 삼지 않는다(위 설명) — 표에 참고로만
for (const item of knowledge) item.stale = false
const candidates = skills.filter((item) => item.stale)

// 출력 — 이름·횟수·날짜만
const table = (title, rows) => {
  console.log(`\n${title}`)
  console.log(`| 대상 | 전체 | 최근 ${staleDays}일 | 마지막 사용 | 추가 | 후보 |`)
  console.log('|---|---|---|---|---|---|')
  for (const row of rows) console.log(`| ${row.path} | ${row.count} | ${row.recent} | ${row.lastUsed} | ${row.added} | ${row.stale ? '🗄 정리 후보' : ''} |`)
}
console.log(`대화 기록 ${transcriptDirs.length}개 폴더(스킬은 헤르메스 ${transcriptDirs.filter(isHermesDir).length}개) · 기준 ${staleDays}일`)
table('스킬', skills)
table('knowledge (참고 — 정리 후보 아님, 열람 0 = 그 레포 작업이 없었거나 `cd` 로 쪼갠 읽기)', knowledge.filter((item) => item.count === 0))
console.log(`\n정리 후보 ${candidates.length}개${shouldWrite ? '' : ' — 미리보기(--write 로 이슈를 만든다)'}`)

if (!shouldWrite || candidates.length === 0) process.exit(0)

// 이슈 하나로 — 열린 curator 이슈가 있으면 그 파일을 갱신
const issuesDir = join(ROOT, 'issues')
const existing = readdirSync(issuesDir)
  .filter((file) => file.endsWith('-hermes-learn-curator.md'))
  .find((file) => !/^status:\s*(done|wontfix)/m.test(readFileSync(join(issuesDir, file), 'utf8')))
const issueFile = join(issuesDir, existing ?? `${today.replace(/-/g, '')}-hermes-learn-curator.md`)
const title = `학습 루프 정리 후보 — ${staleDays}일 넘게 안 쓴 스킬 ${candidates.length}개`
const candidateLine = (item, checked) => `- [${checked ? 'x' : ' '}] \`${item.path}\` — 마지막 사용 ${item.lastUsed} · 전체 ${item.count}회 (추가 ${item.added})`

if (existing) {
  // 이미 있는 이슈 — status·plan·fix·메모·다른 절은 그대로, [x] 로 고른 항목도 그대로 둔다
  let text = readFileSync(issueFile, 'utf8')
  const checkedPaths = new Set([...text.matchAll(/^- \[x\] `([^`]+)`/gm)].map((match) => match[1]))
  const keptChecked = [...text.matchAll(/^- \[x\] `([^`]+)`.*$/gm)].filter((match) => !candidates.some((item) => item.path === match[1])).map((match) => match[0])
  const section = [...candidates.map((item) => candidateLine(item, checkedPaths.has(item.path))), ...keptChecked].join('\n')
  text = text.replace(/^title:.*$/m, `title: ${title}`).replace(/^source:.*$/m, `source: scripts/learn-curator.mjs ${today}`)
  text = /^## 후보\n/m.test(text) ? text.replace(/^## 후보\n[\s\S]*?(?=\n## |(?![\s\S]))/m, `## 후보\n${section}\n`) : `${text.trimEnd()}\n\n## 후보\n${section}\n`
  writeFileSync(issueFile, text)
} else {
  writeFileSync(issueFile, `---
title: ${title}
status: open
repo: hermes
agent:
kind: knowledge
severity: low
source: scripts/learn-curator.mjs ${today}
plan:
fix:
reason:
---

오래 쓰이지 않은 스킬입니다(기준 일수는 제목, 이 컴퓨터의 대화 기록 기준). 지우지 않습니다 — 정리할 것을 고르면 헤르메스가 \`.claude/skills/.archive/\` 로 옮기거나 다른 스킬에 합치고(스킬 표 문서도 같이), 남길 것은 그대로 둡니다. 아무것도 정리하지 않기로 하면 \`status: wontfix\` 와 \`reason:\` 으로 닫는다.

## 후보
${candidates.map((item) => candidateLine(item, false)).join('\n')}

## 근거
- \`node scripts/learn-curator.mjs\` — Skill 호출·사용자가 입력한 슬래시 횟수(실행 결과에 섞인 것은 세지 않는다)
`)
}
console.log(`→ ${relative(ROOT, issueFile)}${existing ? ' (갱신 — 상태·체크 유지)' : ''}`)
