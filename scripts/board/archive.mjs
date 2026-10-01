#!/usr/bin/env node
/**
 * 끝난 일을 한 폴더로 묶어 보관한다 — archive/<원래 파일 이름>/
 *
 *   issue.md   이슈(있으면)
 *   plan.md    계획서(있으면) · plan.html 은 결정 콘솔이 있을 때만(정식, 또는 리뷰 뒤 결정을 덧붙인 경량)
 *   meta.json  { archivedAt, title, kind, from: { issue, plan, html } }
 *
 * archive/ 는 git 에 커밋한다(진행 중 계획서 plans/** 는 로컬 산출물이라 커밋하지 않는다).
 * 이슈의 plan: 과 계획서의 Issue: 는 새 위치로 고쳐 서로를 가리키게 한다.
 * 현황판 [아카이브](server.mjs) · 30일 안전망(archive-plans.sh) · 예전 plans/archive·issues/archive 이전이 모두 이 함수를 쓴다.
 *
 * 사용: node scripts/board/archive.mjs <issues/…md | plans/…md> [--dry-run] [--no-commit]   보관한 것만 로컬 커밋(push 는 안 함)
 *       node scripts/board/archive.mjs --migrate [--dry-run]   예전 plans/archive/**·issues/archive/* 를 이 형태로 옮긴다
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync, statSync, rmSync } from 'node:fs'
import { join, dirname, basename, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
export const ARCHIVE_DIR = 'archive'

const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16)
const exists = (rel) => Boolean(rel) && existsSync(join(ROOT, rel))
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8')

// 상대 경로를 정규화해 top(issues·plans) 폴더 안의 .md 일 때만 돌려준다 — plans/../ 같은 경로로 밖의 파일을 옮기지 않게
const inside = (rel, top) => {
  if (!rel) return ''
  const clean = normalize(rel)
  return clean.startsWith(`${top}${sep}`) && clean.endsWith('.md') && !clean.split(sep).includes('..') ? clean : ''
}
// 이슈 frontmatter 의 plan: · 계획서 Checkpoint 의 Issue: 에서 상대 경로를 뽑는다
const linkedPlanOf = (issueText) => inside(issueText.match(/^plan:\s*(\S+\.md)/m)?.[1] ?? '', 'plans')
const linkedIssueOf = (planText) => inside(planText.match(/^-\s*Issue:\s*.*?(issues\/[^\s)`]+\.md)/m)?.[1] ?? '', 'issues')
const planDone = (planText) => /^-\s*Status:\s*\**done\b/m.test(planText)
const titleOf = (issueText, planText) =>
  issueText.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] || planText.match(/^#\s+(.+)$/m)?.[1] || ''

// 같은 이름 폴더가 있으면 덮지 않고 -2, -3 … 을 붙인다
const freeDir = (name) => {
  let dir = join(ARCHIVE_DIR, name)
  for (let count = 2; exists(dir); count += 1) dir = join(ARCHIVE_DIR, `${name}-${count}`)
  return dir
}

/**
 * id 는 issues/… 또는 plans/… 의 .md (예전 plans/archive·issues/archive 도 받는다).
 * 연결된 짝(이슈 ↔ 계획서)을 찾아 같이 옮긴다. 반환: { dir, moved: [상대 경로…] } 또는 { error }
 */
export const archiveBundle = (rawId, { dryRun = false } = {}) => {
  let id = rawId
  const clean = inside(id, 'issues') || inside(id, 'plans')
  if (!clean || !exists(clean) || basename(clean) === 'README.md') return { error: `보관할 파일을 찾지 못했어요: ${id}` }
  id = clean
  const isIssue = id.startsWith(`issues${sep}`)
  let issue = isIssue ? id : ''
  let plan = isIssue ? '' : id
  // 남겨 두는 짝 — 옮긴 쪽을 가리키는 경로만 새 위치로 고친다
  let leftIssue = ''
  if (isIssue) {
    const candidate = linkedPlanOf(read(issue))
    // 이슈를 보관할 때, 연결 계획서가 아직 끝나지 않았으면 두고 간다(정식 계획서는 여러 이슈를 묶기도 한다)
    if (exists(candidate) && planDone(read(candidate))) plan = candidate
  } else {
    const candidate = linkedIssueOf(read(plan))
    // 계획서만 보관할 때, 연결된 이슈가 아직 열려 있으면 두고 간다(이슈 카드가 따로 끝나야 한다)
    if (exists(candidate) && /^status:\s*(done|wontfix)\b/m.test(read(candidate))) issue = candidate
    else if (exists(candidate)) leftIssue = candidate
  }
  const html = plan && exists(plan.replace(/\.md$/, '.html')) ? plan.replace(/\.md$/, '.html') : ''
  let issueText = issue ? read(issue) : ''
  let planText = plan ? read(plan) : ''
  const dir = freeDir(basename(isIssue ? issue : plan, '.md'))
  const target = { issue: issue && join(dir, 'issue.md'), plan: plan && join(dir, 'plan.md'), html: html && join(dir, 'plan.html') }
  if (dryRun) return { dir, moved: Object.values(target).filter(Boolean), leftIssue: leftIssue || null, dryRun: true }

  // 서로 가리키는 경로를 새 위치로
  if (issue && plan) {
    issueText = issueText.replace(/^plan:.*$/m, `plan: ${target.plan}`)
    planText = planText.replace(/^(-\s*Issue:\s*).*$/m, `$1${target.issue}`)
  }
  mkdirSync(join(ROOT, dir), { recursive: true })
  // 경로를 고친 내용을 새 위치에 쓰고 원본은 지운다(내용이 같으니 옮긴 것과 같다)
  if (issue) { writeFileSync(join(ROOT, target.issue), issueText); rmSync(join(ROOT, issue)) }
  if (plan) { writeFileSync(join(ROOT, target.plan), planText); rmSync(join(ROOT, plan)) }
  if (html) renameSync(join(ROOT, html), join(ROOT, target.html))
  // 남겨 둔 열린 이슈가 옮긴 계획서를 가리키면 새 위치로 고친다
  if (leftIssue) {
    const text = read(leftIssue)
    if (inside(text.match(/^plan:\s*(\S+\.md)/m)?.[1] ?? '', 'plans') === plan) writeFileSync(join(ROOT, leftIssue), text.replace(/^plan:.*$/m, `plan: ${target.plan}`))
  }
  const meta = { archivedAt: stamp(), title: titleOf(issueText, planText), kind: issue ? 'issue' : 'plan', from: { issue: issue || null, plan: plan || null, html: html || null } }
  writeFileSync(join(ROOT, dir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
  return { dir, title: meta.title, paths: [dir, issue, plan, html, leftIssue].filter(Boolean), moved: [issue && `${issue} → ${target.issue}`, plan && `${plan} → ${target.plan}`, html && `${html} → ${target.html}`, leftIssue && `${leftIssue} 의 plan: → ${target.plan} (이슈는 열려 있어 남김)`].filter(Boolean) }
}

/**
 * 보관한 것만 로컬 커밋한다 — 옮긴 경로만 지정하므로 다른 세션이 스테이징해 둔 변경은 섞이지 않는다.
 * push 는 하지 않는다(헤르메스가 맡는다). 반환: { sha } 또는 { error }
 */
export const commitArchive = (results) => {
  const done = results.filter((result) => result.dir && !result.error && !result.dryRun)
  if (!done.length) return { skipped: true }
  const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  try {
    // 원래 자리(이슈)는 추적 중이면 삭제로, plans/** 는 gitignore 라 무시된다
    const tracked = new Set(git('ls-files', '--', ...done.flatMap((result) => result.paths.slice(1))).split('\n').filter(Boolean))
    const paths = [...new Set(done.flatMap((result) => [result.dir, ...result.paths.slice(1).filter((path) => tracked.has(path))]))]
    git('add', '-A', '--', ...paths)
    const title = done.length === 1 ? done[0].title || done[0].dir : `${done.length}건`
    git('commit', '-q', '-m', `docs: 아카이브 — ${title}`, '--', ...paths)
    return { sha: git('rev-parse', '--short', 'HEAD') }
  } catch (error) {
    return { error: String(error.stderr || error.message).trim().split('\n').slice(-2).join(' ') }
  }
}

// ── 히스토리(현황판) ─────────────────────────────────────────────────────
const section = (text, heading) => text.match(new RegExp(`^#{2,3}\\s*${heading}[^\\n]*\\n([\\s\\S]*?)(?=^#{1,3} |$(?![\\s\\S]))`, 'm'))?.[1].trim() ?? ''
const front = (text) =>
  Object.fromEntries(
    (text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '')
      .split('\n')
      .map((line) => line.match(/^([\w-]+):\s*(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2].replace(/\s+#.*$/, '').trim()]),
  )
const plainLine = (value) => value.replace(/\*\*/g, '').replace(/`/g, '').trim()

// 레포 이름 하나로 맞춘다 — 이슈 repo: 는 그대로, 계획서는 Agent:(에이전트 이름)나 파일 이름에서 hermes.config.json 으로 찾는다
// 표기는 이슈 repo: 와 같다(web-op · bznav-web/plus-web · bznav-web/packages · hermes)
const REPO_OF_AGENT = (() => {
  const map = new Map([['헤르메스', 'hermes'], ['hermes', 'hermes']])
  try {
    const config = JSON.parse(read('hermes.config.json'))
    for (const repo of config.repos ?? []) {
      for (const agent of repo.agents ?? []) map.set(agent, repo.name)
      if (repo.packagesAgent) map.set(repo.packagesAgent, `${repo.name}/packages`)
      for (const [app, info] of Object.entries(repo.apps ?? {})) if (info.agent) map.set(info.agent, `${repo.name}/${app}`)
    }
  } catch (error) {
    // config 를 못 읽으면 헤르메스 이름만 맞춘다
  }
  return map
})()
const repoOfPlan = (agentField, dirName, workRef) => {
  // Agent: 의 첫 낱말(괄호·공백 앞) — "(헤르메스 직접 …)" 처럼 괄호로 시작하면 괄호 안 첫 낱말
  const word = agentField.replace(/^\(/, '').split(/[\s(—·+]/)[0]
  if (REPO_OF_AGENT.has(word)) return REPO_OF_AGENT.get(word)
  // 파일 이름 YYYYMMDD-<에이전트|hermes|헤르메스>-…
  const fromName = dirName.replace(/^\d{8}-/, '')
  for (const [agent, repo] of REPO_OF_AGENT) if (fromName.startsWith(`${agent}-`)) return repo
  // Work ref 가 hermes 체크아웃이면 헤르메스 자체 작업
  if (/^hermes\b/.test(workRef)) return 'hermes'
  return ''
}

// 보관 폴더 → 처음 커밋한 사람. git log 한 번으로 전부 뽑는다(폴더마다 부르지 않게)
const archiveAuthors = () => {
  const authors = new Map()
  try {
    const out = execFileSync('git', ['-C', ROOT, '-c', 'core.quotepath=off', 'log', '--diff-filter=A', '--format=%x00%an', '--name-only', '--', `${ARCHIVE_DIR}/*/meta.json`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    // 최신 커밋부터 나오므로 뒤에 나온(더 오래된) 값으로 덮어 처음 커밋한 사람을 남긴다
    for (const block of out.split('\0').filter(Boolean)) {
      const [author, ...files] = block.split('\n').filter(Boolean)
      for (const file of files) authors.set(file.split('/')[1], author)
    }
  } catch {}
  return authors
}
const localUser = () => {
  try {
    return execFileSync('git', ['-C', ROOT, 'config', 'user.name'], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

export const listHistory = () => {
  const base = join(ROOT, ARCHIVE_DIR)
  if (!existsSync(base)) return []
  const authors = archiveAuthors()
  const me = localUser()
  return readdirSync(base)
    .filter((name) => statSync(join(base, name)).isDirectory())
    .map((name) => {
      const dir = join(ARCHIVE_DIR, name)
      const meta = exists(join(dir, 'meta.json')) ? JSON.parse(read(join(dir, 'meta.json'))) : {}
      const issueText = exists(join(dir, 'issue.md')) ? read(join(dir, 'issue.md')) : ''
      const planText = exists(join(dir, 'plan.md')) ? read(join(dir, 'plan.md')) : ''
      const issueMeta = front(issueText)
      const checkpoint = planText.match(/^## Checkpoint\s*\n([\s\S]*?)(?=^## (?!#))/m)?.[1] ?? ''
      const agent = plainLine(checkpoint.match(/^-\s*Agent:\s*(.+)$/m)?.[1] ?? '')
      const commits = section(planText, 'Commits').split('\n').filter((line) => /^-\s+\d{4}-\d{2}-\d{2}/.test(line)).map((line) => plainLine(line.replace(/^-\s+/, '')))
      // 요약 — 이슈는 본문 첫 문단, 계획서는 '## 지시'(요청한 것) 첫 줄, 없으면 제목만
      const issueLead = issueText.replace(/^---[\s\S]*?---\s*/, '').split('\n').find((line) => line.trim() && !line.startsWith('#')) ?? ''
      const request = section(planText, '지시').split('\n').map((line) => line.replace(/^>\s?/, '').trim()).find((line) => line && !line.startsWith('(')) ?? ''
      const summary = plainLine(issueText ? issueLead : request)
      return {
        dir,
        archivedAt: meta.archivedAt || '',
        title: meta.title || issueMeta.title || planText.match(/^#\s+(.+)$/m)?.[1] || name,
        kind: issueText ? 'issue' : 'plan',
        repo: issueMeta.repo || repoOfPlan(agent, name, plainLine(checkpoint.match(/^-\s*Work ref:\s*(.+)$/m)?.[1] ?? '')),
        issueKind: issueMeta.kind || '',
        severity: issueMeta.severity || '',
        status: issueMeta.status || plainLine(checkpoint.match(/^-\s*Status:\s*(.+)$/m)?.[1] ?? ''),
        fix: issueMeta.fix || '',
        pr: issueMeta.pr || '',
        // 작업자 — 계획서 Owner: → 이슈 owner: → 보관 커밋 작성자 → (아직 커밋 전이면) 이 워크스페이스 사용자
        owner: plainLine(checkpoint.match(/^-\s*Owner:\s*(.+)$/m)?.[1] ?? '') || issueMeta.owner || authors.get(name) || me,
        planType: planText ? (meta.from?.plan?.split('/')[1] === 'archive' ? meta.from.plan.split('/')[2] : meta.from?.plan?.split('/')[1]) || '' : '',
        commits,
        summary,
        files: { issue: issueText ? join(dir, 'issue.md') : null, plan: planText ? join(dir, 'plan.md') : null, html: exists(join(dir, 'plan.html')) ? join(dir, 'plan.html') : null },
      }
    })
    .sort((left, right) => (right.archivedAt || right.dir).localeCompare(left.archivedAt || left.dir))
}

export const readHistoryItem = (dir) => {
  const path = join(ROOT, dir)
  if (!path.startsWith(join(ROOT, ARCHIVE_DIR) + '/') || !existsSync(path)) return null
  const pick = (file) => (existsSync(join(path, file)) ? readFileSync(join(path, file), 'utf8') : null)
  return { dir, issue: pick('issue.md'), plan: pick('plan.md'), html: existsSync(join(path, 'plan.html')), meta: pick('meta.json') ? JSON.parse(pick('meta.json')) : null }
}

// ── 예전 형식 이전 ──────────────────────────────────────────────────────
const walk = (rel) => {
  const abs = join(ROOT, rel)
  if (!existsSync(abs)) return []
  return readdirSync(abs).flatMap((name) => {
    const child = join(rel, name)
    return statSync(join(ROOT, child)).isDirectory() ? walk(child) : [child]
  })
}
export const migrateOld = ({ dryRun = false } = {}) => {
  const results = []
  const claimed = new Set()
  // 이슈 먼저 — 연결된 계획서를 같이 가져간다(미리 보기에서도 두 번 잡지 않게 기억한다)
  for (const issue of walk('issues/archive').filter((path) => path.endsWith('.md'))) {
    const plan = linkedPlanOf(read(issue))
    if (plan) claimed.add(plan)
    results.push(archiveBundle(issue, { dryRun }))
  }
  for (const plan of walk('plans/archive').filter((path) => path.endsWith('.md'))) if (exists(plan) && !claimed.has(plan)) results.push(archiveBundle(plan, { dryRun }))
  return results
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const results = args.includes('--migrate') ? migrateOld({ dryRun }) : args.filter((arg) => !arg.startsWith('--')).map((id) => archiveBundle(id, { dryRun }))
  if (!results.length) { console.error('사용: node scripts/board/archive.mjs <issues/…md | plans/…md> [--dry-run] | --migrate [--dry-run]'); process.exit(2) }
  let failed = 0
  if (!dryRun && !args.includes('--no-commit')) {
    const committed = commitArchive(results)
    if (committed.sha) console.log(`커밋 ${committed.sha} (push 는 하지 않음)`)
    if (committed.error) console.error(`⚠️ 커밋하지 못했어요: ${committed.error}`)
  }
  for (const result of results) {
    if (result.error) { failed += 1; console.error(`✖ ${result.error}`); continue }
    console.log(`${dryRun ? '(미리 보기) ' : ''}✔ ${result.dir}`)
    for (const line of result.moved) console.log(`    ${line}`)
  }
  process.exit(failed ? 1 : 0)
}
