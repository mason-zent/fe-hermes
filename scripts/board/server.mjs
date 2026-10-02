#!/usr/bin/env node
/**
 * 헤르메스 현황판 — 로컬 서버를 띄워 지금 무슨 일이 돌아가는지 브라우저에서 실시간으로 본다.
 *
 *   node scripts/board/server.mjs            # http://localhost:4700 (HERMES_BOARD_PORT 로 변경)
 *   /board                                   # 헤르메스 세션에서 — herdr pane 에 띄우고 브라우저를 연다
 *
 * 보여주는 것 (로컬 파일·명령에서 읽는다)
 *   - 칸반: 이슈(issues/*.md) · 계획 · 진행 중 · 리뷰 · 완료(plans/**\/*.md 의 Checkpoint Status)
 *   - 지금 동작 중: herdr pane 의 에이전트(agent_status), 백그라운드 서브에이전트 로그, 워크트리
 *   - 머리: 마지막 sync, 다이어그램 점검 결과는 /board 에서 따로 돌리지 않는다(무겁다)
 *
 * 3초마다 모아서 바뀐 게 있으면 SSE(/events)로 밀어 준다. 브라우저는 새로고침하지 않아도 된다.
 *
 * 쓰기는 두 가지뿐이다 (브라우저 버튼)
 *   - POST /api/move   카드를 다른 칸으로 — 이슈 frontmatter status, 계획서 Checkpoint Status(md 와 html 의 plan-md 사본 둘 다)
 *   - POST /api/dispatch (이슈 [처리 시작] → "담당 에이전트로 바로(조사만)") 이슈마다 워크트리(.worktrees/<레포>/issue-<이슈>, 운영 기준 ref · detached — 조사 전용, 코드 수정 없음)를 만들고
 *     담당 에이전트를 그 레포 workspace 에 새 pane 으로 띄운다(scripts/delegate.sh --cwd). 한 레포에서 여러 이슈를 동시에 돌려도 부딪히지 않게
 *   - POST /api/worktree-remove 끝난 이슈의 워크트리를 지운다(미커밋 변경이 있으면 거부)
 *   - POST /api/delete 카드를 휴지통(.board-trash/<날짜>/)으로 옮긴다 — 이슈면 연결된 경량 계획서·워크트리도. 되돌릴 수 있게 지우지 않는다
 *   - POST /api/archive 끝난 카드를 archive/<이름>/ 한 폴더로 보관 — issue.md · plan.md(· plan.html) · meta.json(archive.mjs), 이슈 워크트리 정리. 보드에서 사라지고 히스토리 탭에 뜬다
 *   - GET  /api/qa/runs      QA 시뮬레이션 런 목록(.qa-runs/) · /api/qa/run?id= 런 하나 · /qa-runs/<id>/<파일> 스크린샷·리포트
 *   - GET  /api/qa/apps      전체 검수할 수 있는 앱·세션 프로필 · POST /api/qa-suite [전체 검수](요청할 때만) · POST /api/qa-approve [기준으로 승인]
 *   - POST /api/qa-start     계획서 카드 [QA 실행] — Work ref 워크트리로 scripts/qa/run.mjs 를 뒤에서 돌린다(한 번에 하나)
 *   - GET  /api/history      보관된 일 목록 · /api/history/item?dir= 한 건의 이슈·계획서 원문
 *   - POST /api/hermes-new 이슈 [처리 시작] → 헤르메스: 새 헤르메스 pane(🧭 헤르메스 · <이슈>)을 열어 그 안에서 처리한다 — 떠 있는 헤르메스 대화에 섞지 않는다
 *   - POST /api/action 이미 떠 있는 헤르메스·에이전트 pane 에 지시문을 입력한다(herdr pane send-text + Enter)
 *     정식 계획서 결정 콘솔(/plans/*.html)의 [이대로 진행] 도 이걸로 PLAN.hermesPane 에 보낸다
 *   브라우저가 보내기 전에 지시문을 보여주고 고치게 한다
 * 다른 사이트가 localhost 로 요청을 보내 헤르메스에 지시를 넣지 못하게, 서버를 띄울 때마다 만드는 토큰과
 * Origin 이 맞는 요청만 받는다.
 */
import { createServer } from 'node:http'
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, rmSync, mkdirSync, renameSync } from 'node:fs'
import { join, dirname, relative, basename, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile, execFileSync, spawn } from 'node:child_process'
import { homedir, tmpdir } from 'node:os'
import { archiveBundle, commitArchive, listHistory, readHistoryItem } from './archive.mjs'
import { listRuns as listQaRuns, RUNS_DIR as QA_RUNS_DIR } from '../qa/report.mjs'
import { approveRun as approveQaRun } from '../qa/baseline.mjs'
import { createHash, randomBytes } from 'node:crypto'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const PORT = Number(process.env.HERMES_BOARD_PORT || 4700)
const POLL_MS = 3000
const DONE_KEEP_DAYS = 14 // 완료 칸에 남겨 두는 기간
const SUBAGENT_ACTIVE_SEC = 90 // 로그가 이 안에 바뀌었으면 "작업 중"
const SUBAGENT_RECENT_MIN = 30 // 이 안에 끝난 백그라운드 에이전트까지 보여준다

const run = (command, args, options = {}) =>
  new Promise((resolve) => {
    execFile(command, args, { encoding: 'utf8', timeout: 5000, maxBuffer: 16 * 1024 * 1024, ...options }, (error, stdout) => resolve(error ? null : stdout))
  })

const readText = (path) => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

// ── 작업자 ──────────────────────────────────────────────────────────────
// 계획서 Checkpoint 의 Owner: · 이슈 frontmatter 의 owner: 가 정본. 없으면 그 파일을 처음 커밋한 사람,
// 커밋 전이면(plans/** 는 로컬) 이 워크스페이스의 git user.name — 로컬 파일은 이 사람이 만든 것이다
const LOCAL_USER = (() => {
  try {
    return execFileSync('git', ['-C', ROOT, 'config', 'user.name'], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
})()
// path → { author, at }. 커밋된 파일은 처음 커밋한 사람이 바뀌지 않아 계속 쓰고, 아직 없으면 1분 뒤 다시 본다
const authorCache = new Map()
const firstAuthor = async (path) => {
  const cached = authorCache.get(path)
  if (cached && (cached.author || Date.now() - cached.at < 60_000)) return cached.author
  const out = await run('git', ['-C', ROOT, 'log', '--diff-filter=A', '--format=%an', '--', relative(ROOT, path)])
  const author = out?.trim().split('\n').at(-1) ?? ''
  authorCache.set(path, { author, at: Date.now() })
  return author
}
const ownerOf = async (declared, path) => declared || (await firstAuthor(path)) || LOCAL_USER

const listFiles = (dir, predicate) => {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) return listFiles(full, predicate)
    return predicate(full) ? [full] : []
  })
}

// ── 계획서 ──────────────────────────────────────────────────────────────
const STATUS_COLUMN = { planned: 'plan', in_progress: 'doing', blocked: 'doing', ready_for_review: 'review', done: 'done' }

const section = (text, heading) => {
  const match = text.match(new RegExp(`^###\\s*${heading}\\s*\\n([\\s\\S]*?)(?=^##|$(?![\\s\\S]))`, 'm'))
  return match ? match[1].trim() : ''
}
const field = (text, name) => text.match(new RegExp(`^-\\s*${name}:\\s*(.+)$`, 'm'))?.[1].trim() ?? ''
const plain = (value) => value.replace(/\*\*/g, '').replace(/`/g, '').trim()

const readPlan = (path) => {
  const text = readText(path)
  if (!text) return null
  const archived = path.includes('/archive/')
  const checkpoint = text.match(/^## Checkpoint\s*\n([\s\S]*?)(?=^## (?!#))/m)?.[1] ?? ''
  const statusRaw = plain(field(checkpoint, 'Status'))
  const status = archived ? 'done' : (statusRaw.match(/planned|in_progress|blocked|ready_for_review|done/)?.[0] ?? 'planned')
  const progress = section(checkpoint, 'Progress')
  const checked = (progress.match(/^- \[x\]/gim) ?? []).length
  const total = (progress.match(/^- \[[ x]\]/gim) ?? []).length
  const blocked = plain(section(checkpoint, 'Blocked').split('\n')[0] ?? '').replace(/^-\s*/, '')
  const next = plain(section(checkpoint, 'Next').split('\n').find((line) => line.trim()) ?? '').replace(/^\d+\.\s*/, '')
  const mtime = statSync(path).mtimeMs
  return {
    kind: 'plan',
    created: createdAt(path),
    id: relative(ROOT, path),
    title: plain(text.match(/^#\s+(.+)$/m)?.[1] ?? basename(path, '.md')),
    type: path.split('/').at(archived ? -2 : -2),
    // 정식 = feature·bugfix·refactor (md + html 결정 콘솔) · 경량 = plans/task
    grade: path.split('/').at(-2) === 'task' ? 'light' : 'formal',
    owner: plain(field(checkpoint, 'Owner')),
    // hermes 자체 작업 — 서비스 칸반과 따로 [헤르메스] 탭에 보인다. 경량은 Agent: hermes,
    // 정식은 Agent 줄이 없으니 Work ref 가 hermes 체크아웃("hermes 메인 체크아웃 · main …")인 것으로 본다(FE 워크트리는 절대 경로라 안 걸린다)
    scope: plain(field(checkpoint, 'Agent')) === 'hermes' || /^hermes\b/.test(plain(field(checkpoint, 'Work ref'))) ? 'hermes' : 'service',
    status,
    statusNote: plain(statusRaw.replace(/^(planned|in_progress|blocked|ready_for_review|done)\s*[—-]?\s*/, '')),
    column: STATUS_COLUMN[status] ?? 'plan',
    blocked: status === 'blocked' || (blocked && !/^없음/.test(blocked)) ? blocked || '막힘' : '',
    next,
    workRef: plain(field(checkpoint, 'Work ref')),
    review: plain(field(checkpoint, 'Review')),
    issue: plain(field(checkpoint, 'Issue')).match(/issues\/\S+\.md/)?.[0] ?? '',
    updated: plain(field(checkpoint, 'Updated')),
    progress: total ? { checked, total } : null,
    archived,
    mtime,
    html: existsSync(path.replace(/\.md$/, '.html')) ? relative(ROOT, path.replace(/\.md$/, '.html')) : null,
  }
}

// 카드의 "시작" 시각 — 파일이 처음 생긴 때. birthtime 이 없거나(0) 수정 시각보다 뒤면 파일명 앞 YYYYMMDD 를 쓴다
const createdAt = (path) => {
  const { birthtimeMs, mtimeMs } = statSync(path)
  if (birthtimeMs > 0 && birthtimeMs <= mtimeMs) return birthtimeMs
  const day = basename(path).match(/^(\d{4})(\d{2})(\d{2})/)
  return day ? new Date(`${day[1]}-${day[2]}-${day[3]}T00:00:00+09:00`).getTime() : mtimeMs
}

// ── 이슈 ────────────────────────────────────────────────────────────────
// repo 값(`web-op`, `bznav-web/brand-web`, `bznav-web/packages`)으로 담당 에이전트를 찾는다. 정본은 hermes.config.json
const config = JSON.parse(readFileSync(join(ROOT, 'hermes.config.json'), 'utf8'))
const AGENT_NAMES = new Set(readdirSync(join(ROOT, '.claude/agents')).map((name) => name.replace(/\.md$/, '')))
// 에이전트 → 담당 레포·운영 기준 브랜치 (워크트리를 어디서 어떤 ref 로 만들지)
const workspaceOf = (agent) => {
  for (const repo of config.repos) {
    if (repo.agents?.includes(agent)) return { repo: repo.name, branch: repo.branch }
    if (repo.packagesAgent === agent) return { repo: repo.name, branch: repo.branch }
    for (const app of Object.values(repo.apps ?? {})) if (app.agent === agent) return { repo: repo.name, branch: app.branch }
  }
  return null
}
const issueWorktree = (issueId, agent) => {
  const target = workspaceOf(agent)
  if (!target) return null
  const slug = `issue-${basename(issueId, '.md')}`
  return { ...target, path: join(ROOT, '.worktrees', target.repo, slug), rel: `.worktrees/${target.repo}/${slug}` }
}
const agentForRepo = (repoValue) => {
  const [repoName, app] = repoValue.split('/')
  const repo = config.repos.find((entry) => entry.name === repoName)
  if (!repo) return ''
  if (app === 'packages') return repo.packagesAgent || ''
  if (app && repo.apps?.[app]) return repo.apps[app].agent || ''
  return repo.agents?.[0] || ''
}
const ISSUE_COLUMN = { open: 'issue', planned: 'plan', in_progress: 'doing', done: 'done', wontfix: 'done' }

const readIssue = (path) => {
  const text = readText(path)
  if (!text) return null
  const front = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  const meta = Object.fromEntries(
    front
      .split('\n')
      .map((line) => line.match(/^([\w-]+):\s*(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2].replace(/\s+#.*$/, '').trim()]),
  )
  const body = text.slice(front ? text.indexOf('---', 3) + 3 : 0).trim()
  const status = meta.status || 'open'
  return {
    kind: 'issue',
    id: relative(ROOT, path),
    title: meta.title || basename(path, '.md'),
    status,
    column: ISSUE_COLUMN[status] ?? 'issue',
    repo: meta.repo || '',
    // repo: hermes 는 헤르메스 자체 이슈 — 담당 에이전트·PR 없이 헤르메스가 직접 고치고 main 에 커밋·push 하면 끝
    scope: meta.repo === 'hermes' ? 'hermes' : 'service',
    severity: meta.severity || '',
    type: meta.kind || '',
    source: meta.source || '',
    plan: meta.plan || '',
    agent: meta.agent || agentForRepo(meta.repo || ''),
    owner: meta.owner || '',
    fix: meta.fix || '',
    pr: meta.pr || '',
    reason: meta.reason || '',
    body,
    summary: plain(body.split('\n').find((line) => line.trim() && !line.startsWith('#')) ?? ''),
    created: createdAt(path),
    mtime: statSync(path).mtimeMs,
  }
}

// ── 완료 가능 판정 ───────────────────────────────────────────────────────
// 전부 파일·git·GitHub 에서 기계적으로 확인되는 신호만 쓴다. 판정은 배지일 뿐, 옮기는 건 사람이다
const prCache = new Map() // pr → { state, at }
const prState = async (repoName, pr) => {
  const key = `${repoName}#${pr}`
  const cached = prCache.get(key)
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.state
  const out = await run('gh', ['pr', 'view', String(pr).replace(/^#/, ''), '--repo', `zenterprise-inc/${repoName}`, '--json', 'state', '--jq', '.state'], { timeout: 15_000 })
  const state = out?.trim() || 'UNKNOWN'
  prCache.set(key, { state, at: Date.now() })
  return state
}

const doneCheck = async (issue) => {
  const checks = []
  // 공통: 이 이슈 파일이 커밋·push 됐다 = 작업 트리와 origin/main 사이에 차이가 없다
  const pushed = (await run('git', ['-C', ROOT, 'diff', '--quiet', 'origin/main', '--', issue.id])) !== null
    && (await run('git', ['-C', ROOT, 'cat-file', '-e', `origin/main:${issue.id}`])) !== null
  checks.push({ label: '이슈 파일 커밋·push', ok: pushed })

  if (issue.status === 'wontfix') {
    checks.push({ label: 'reason: 하지 않는 이유', ok: Boolean(issue.reason) })
  } else if (issue.type === 'check') {
    checks.push({ label: '## 확인 결과 절', ok: /^## 확인 결과/m.test(issue.body) })
    const followUp = issue.body.match(/^## 후속\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1] ?? ''
    const items = followUp.split('\n').filter((line) => /^\s*- /.test(line))
    const open = items.filter((line) => {
      if (/^\s*- \[x\]/i.test(line)) return false
      const linked = line.match(/issues\/[\w.-]+\.md/)
      return !(linked && existsSync(join(ROOT, linked[0])))
    })
    checks.push({ label: items.length ? `## 후속 ${items.length - open.length}/${items.length} 정리` : '## 후속 절 (없으면 "- [x] 없음")', ok: items.length > 0 && open.length === 0 })
  } else if (issue.type === 'knowledge' || issue.type === 'diagram' || issue.scope === 'hermes') {
    // hermes 자체 이슈는 kind 와 무관하게 이 기준 — PR 없이 main 에 커밋·push 하므로 fix: 커밋이 origin/main 에 있으면 끝
    const shas = issue.fix.split(/[,\s]+/).filter(Boolean)
    let allIn = shas.length > 0
    for (const sha of shas) if ((await run('git', ['-C', ROOT, 'merge-base', '--is-ancestor', sha, 'origin/main'])) === null) allIn = false
    checks.push({ label: shas.length ? `fix: ${shas.join(', ')} push 됨` : 'fix: 수정 커밋 sha', ok: allIn })
  } else if (issue.type === 'seo') {
    // 서비스당 하나로 매주 갱신되는 SEO Health 이슈(/seo-feedback) — 현재 항목이 전부 해결([x])이면 끝
    const current = issue.body.match(/^## 현재 항목\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1] ?? ''
    const items = current.split('\n').filter((line) => /^\s*- \[[ x]\]/i.test(line))
    const resolved = items.filter((line) => /^\s*- \[x\]/i.test(line))
    checks.push({ label: items.length ? `## 현재 항목 ${resolved.length}/${items.length} 해결` : '## 현재 항목 절', ok: items.length > 0 && resolved.length === items.length })
  } else if (issue.type === 'code') {
    const planPath = issue.plan ? join(ROOT, issue.plan) : ''
    const planDone = planPath && existsSync(planPath) && /^- Status:.*\bdone\b/m.test(readText(planPath) ?? '')
    checks.push({ label: 'plan: 계획서 Status done', ok: Boolean(planDone) })
    const repoName = (issue.worktree?.repo || workspaceOf(issue.agent)?.repo || issue.repo.split('/')[0])
    const merged = issue.pr ? (await prState(repoName, issue.pr)) === 'MERGED' : false
    checks.push({ label: issue.pr ? `pr: ${issue.pr} MERGED` : 'pr: PR 번호', ok: merged })
  }
  return { ready: checks.every((check) => check.ok), checks }
}

// ── 지금 동작 중 ─────────────────────────────────────────────────────────
const readPanes = async () => {
  const out = await run('herdr', ['pane', 'list'])
  if (!out) return { available: false, panes: [] }
  try {
    const panes = JSON.parse(out).result.panes
      .filter((pane) => pane.agent)
      .map((pane) => {
        // herdr 는 pane 이름을 label 로 준다 (delegate.sh 가 붙인 '🤖 <에이전트> · <브랜치>')
        const name = pane.label || pane.name || pane.title || ''
        const delegated = name.match(/^🤖\s*(\S+)(?:\s*·\s*(.+))?$/)
        return {
          kind: 'pane',
          id: pane.pane_id,
          tool: pane.agent,
          status: pane.agent_status || 'unknown',
          // 위임 pane 은 에이전트 이름, hermes 루트의 claude 는 헤르메스(팀리드), 그 밖은 도구 이름
          agent: delegated?.[1] || (pane.agent === 'claude' && pane.cwd === ROOT ? '헤르메스' : pane.agent),
          role: delegated ? 'agent' : pane.agent === 'claude' && pane.cwd === ROOT ? 'hermes' : 'other',
          branch: delegated?.[2] || '',
          title: pane.terminal_title_stripped || '',
          cwd: pane.cwd?.replace(homedir(), '~') || '',
          focused: Boolean(pane.focused),
        }
      })
    return { available: true, panes }
  } catch {
    return { available: false, panes: [] }
  }
}

const projectDir = join(homedir(), '.claude/projects', ROOT.replace(/[/.]/g, '-'))
const readSubagents = () => {
  const now = Date.now()
  return listFiles(projectDir, (path) => /\/subagents\/agent-[^/]+\.jsonl$/.test(path))
    .map((path) => ({ path, mtime: statSync(path).mtimeMs }))
    .filter((log) => now - log.mtime < SUBAGENT_RECENT_MIN * 60_000)
    .map((log) => {
      let meta = {}
      try {
        meta = JSON.parse(readFileSync(log.path.replace(/\.jsonl$/, '.meta.json'), 'utf8'))
      } catch {
        // meta 가 없으면 이름만
      }
      // 마지막 도구 호출 한 줄
      let lastTool = ''
      const tail = readText(log.path)?.split('\n').filter(Boolean).slice(-40) ?? []
      for (const line of tail.reverse()) {
        try {
          const content = JSON.parse(line).message?.content
          const tool = Array.isArray(content) ? content.find((part) => part.type === 'tool_use') : null
          if (tool) {
            const input = tool.input ?? {}
            lastTool = `${tool.name} ${input.description || input.file_path || input.pattern || input.command || ''}`.slice(0, 90)
            break
          }
        } catch {
          // 깨진 줄은 건너뛴다
        }
      }
      const ageSec = Math.round((now - log.mtime) / 1000)
      return {
        kind: 'subagent',
        id: basename(log.path, '.jsonl'),
        agent: meta.agentType || 'agent',
        title: meta.description || '',
        status: ageSec < SUBAGENT_ACTIVE_SEC ? 'working' : 'done',
        ageSec,
        lastTool,
      }
    })
    .sort((left, right) => left.ageSec - right.ageSec)
}

const readWorktrees = async () => {
  const dir = join(ROOT, '.worktrees')
  if (!existsSync(dir)) return []
  const found = []
  for (const repo of readdirSync(dir)) {
    const repoDir = join(dir, repo)
    if (!statSync(repoDir).isDirectory()) continue
    for (const slug of readdirSync(repoDir)) {
      const path = join(repoDir, slug)
      const branch = (await run('git', ['-C', path, 'rev-parse', '--abbrev-ref', 'HEAD']))?.trim()
      if (!branch) continue
      const dirty = ((await run('git', ['-C', path, 'status', '--porcelain'])) ?? '').split('\n').filter(Boolean).length
      found.push({ repo, slug, branch, dirty })
    }
  }
  return found
}

const readHeader = () => {
  let sync = ''
  try {
    sync = JSON.parse(readFileSync(join(ROOT, '.sync/state.json'), 'utf8')).acceptedAt ?? ''
  } catch {
    // sync 기록 없음
  }
  return { sync, usage: readUsage() }
}

// ── AI 사용량 ──────────────────────────────────────────────────────────
// 설치된 AI CLI 를 PATH 에서 찾아, 사용량(요금제 한도 %)을 로컬에 남기는 CLI 만 그 값을 읽어 보여 준다.
// 새 CLI 는 읽는 함수를 만들어 AI_CLIS 에 한 줄 추가하면 된다
// resets_at 은 ISO 문자열 또는 epoch 초로 올 수 있어 ms 로 맞춘다
const toMs = (value) => {
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value
  const parsed = Date.parse(value ?? '')
  return Number.isNaN(parsed) ? null : parsed
}
// 창 길이(분) → 표시 이름
const windowLabel = (minutes) => {
  if (minutes === 300) return '5시간'
  if (minutes === 10080) return '주간'
  if (minutes % 1440 === 0) return `${minutes / 1440}일`
  if (minutes % 60 === 0) return `${minutes / 60}시간`
  return `${minutes}분`
}
// at 은 분 단위로 내려 값이 들어올 때마다 화면을 다시 그리지 않게 한다
const toMinute = (ms) => Math.floor(ms / 60_000) * 60_000

// Claude — scripts/board/statusline.sh 가 statusline 입력에서 떨군 파일
const readClaudeUsage = () => {
  try {
    const { at, rate_limits: limits } = JSON.parse(readFileSync(join(ROOT, '.board-usage.json'), 'utf8'))
    const windows = [['five_hour', '5시간'], ['seven_day', '주간']]
      .filter(([key]) => typeof limits?.[key]?.used_percentage === 'number')
      .map(([key, label]) => ({ label, percent: Math.round(limits[key].used_percentage), resetsAt: toMs(limits[key].resets_at) }))
    return windows.length ? { at: toMinute(at * 1000), windows } : null
  } catch {
    return null // 아직 statusline 이 한 번도 안 돌았거나 래퍼가 연결되지 않음
  }
}

// Codex — 가장 최근 세션 로그(~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl)의 마지막 token_count 이벤트
// 로그가 커질 수 있어 끝부분만 읽고, 파일이 그대로면 이전 결과를 쓴다
const CODEX_SESSIONS = join(homedir(), '.codex/sessions')
let codexCache = { key: '', value: null }
const newestChild = (dir, filter) => {
  try {
    return readdirSync(dir).filter(filter).sort().pop() ?? null
  } catch {
    return null
  }
}
const newestCodexLog = () => {
  let dir = CODEX_SESSIONS
  for (let depth = 0; depth < 3; depth += 1) {
    const child = newestChild(dir, (name) => /^\d+$/.test(name))
    if (!child) return null
    dir = join(dir, child)
  }
  const file = newestChild(dir, (name) => name.endsWith('.jsonl'))
  return file ? join(dir, file) : null
}
const readCodexUsage = () => {
  const path = newestCodexLog()
  if (!path) return null
  try {
    const { mtimeMs, size } = statSync(path)
    const key = `${path}:${mtimeMs}:${size}`
    if (codexCache.key === key) return codexCache.value
    const text = readFileSync(path, 'utf8')
    const lines = text.slice(Math.max(0, text.length - 512 * 1024)).split('\n').reverse()
    let value = null
    for (const line of lines) {
      if (!line.includes('"rate_limits"')) continue
      try {
        const entry = JSON.parse(line)
        const limits = entry.payload?.rate_limits
        const windows = [limits?.primary, limits?.secondary]
          .filter((win) => typeof win?.used_percent === 'number')
          .map((win) => ({ label: windowLabel(win.window_minutes), minutes: win.window_minutes, percent: Math.round(win.used_percent), resetsAt: toMs(win.resets_at) }))
          .sort((left, right) => left.minutes - right.minutes)
        if (windows.length) value = { at: toMinute(Date.parse(entry.timestamp) || mtimeMs), windows }
        break
      } catch {
        // 잘린 줄 — 다음 줄
      }
    }
    codexCache = { key, value }
    return value
  } catch {
    return null
  }
}

const AI_CLIS = [
  { id: 'claude', label: 'Claude', bin: 'claude', read: readClaudeUsage },
  { id: 'codex', label: 'Codex', bin: 'codex', read: readCodexUsage },
]
// PATH 에서 실행 파일 찾기 — 1분마다만 다시 본다
const PATH_DIRS = [...new Set([...(process.env.PATH ?? '').split(':'), join(homedir(), '.local/bin'), '/opt/homebrew/bin', '/usr/local/bin'])].filter(Boolean)
let installedCache = { at: 0, ids: [] }
const installedClis = () => {
  if (Date.now() - installedCache.at > 60_000) {
    installedCache = { at: Date.now(), ids: AI_CLIS.filter((cli) => PATH_DIRS.some((dir) => existsSync(join(dir, cli.bin)))).map((cli) => cli.id) }
  }
  return AI_CLIS.filter((cli) => installedCache.ids.includes(cli.id))
}
const readUsage = () =>
  installedClis().map((cli) => {
    const usage = cli.read()
    return { id: cli.id, label: cli.label, at: usage?.at ?? null, windows: usage?.windows.map(({ label, percent, resetsAt }) => ({ label, percent, resetsAt })) ?? [] }
  })

// ── 모으기 ──────────────────────────────────────────────────────────────
// 보호 브랜치(statusline.sh 와 같은 목록)는 여러 계획서가 같이 쓰므로 브랜치로는 붙이지 않는다.
// hermes 자체 작업은 모두 main 이라, 그냥 포함 검사를 하면 main 에서 도는 pane 하나가 hermes 계획서 전부를 진행 중으로 끌고 갔다
const PROTECTED_BRANCH = /^(prd|main|master|dev|dev-ecs|prd-.+|release\/.+)$/
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// delegate.sh 가 적는 "🌿 <브랜치>" 형식으로 정확히 같을 때만 (feature/A 가 feature/A-2 에 붙지 않게)
const branchMatches = (workRef, branch) =>
  Boolean(branch) && !PROTECTED_BRANCH.test(branch) && new RegExp(`🌿 ${escapeRegExp(branch)}(?=[\\s@·(]|$)`).test(workRef)

const collect = async () => {
  const now = Date.now()
  // archive 는 보드에서 치운 것 — 보이지 않는다
  const plans = listFiles(join(ROOT, 'plans'), (path) => path.endsWith('.md') && !path.includes('/plans/archive/'))
    .map(readPlan)
    .filter(Boolean)
    .filter((plan) => plan.column !== 'done' || now - plan.mtime < DONE_KEEP_DAYS * 86_400_000)
  const issues = listFiles(join(ROOT, 'issues'), (path) => path.endsWith('.md') && !path.endsWith('README.md') && !path.includes('/issues/archive/'))
    .map(readIssue)
    .filter(Boolean)
    .filter((issue) => issue.column !== 'done' || now - issue.mtime < DONE_KEEP_DAYS * 86_400_000)
  const [{ available, panes }, worktrees] = await Promise.all([readPanes(), readWorktrees()])
  await Promise.all([...plans, ...issues].map(async (card) => { card.owner = await ownerOf(card.owner, join(ROOT, card.id)) }))
  const subagents = readSubagents()

  // 이슈마다 완료 가능 판정 (issues/README.md "완료 기준")
  for (const issue of issues) {
    issue.doneCheck = await doneCheck(issue)
    delete issue.body
  }
  // 이슈마다 워크트리 계획(어느 레포·ref)과 실제로 있는지
  for (const issue of issues) {
    const worktree = issue.agent ? issueWorktree(issue.id, issue.agent) : null
    issue.worktree = worktree ? { repo: worktree.repo, ref: `origin/${worktree.branch}`, rel: worktree.rel, exists: existsSync(worktree.path) } : null
  }
  // 에이전트 pane 을 브랜치로 계획서에 붙인다
  for (const plan of plans) {
    // delegate.sh 가 Work ref 에 "pane <id>" 를 적는다. 없으면 브랜치로 맞춘다
    plan.agents = panes
      .filter((pane) => pane.role === 'agent' && (plan.workRef.includes(`pane ${pane.id} `) || plan.workRef.endsWith(`pane ${pane.id}`) || plan.review.includes(`pane ${pane.id} `) || branchMatches(plan.workRef, pane.branch)))
      .map((pane) => pane.id)
    // 에이전트가 지금 일하고 있으면 진행 중 칸에 — 요청을 여러 번 주고받으면 계획서 Status 가 리뷰에 머물러 있어도
    // 실제로는 작업 중이다. 파일은 바꾸지 않고 보여 주는 칸만 (끝나 대기로 돌아가면 다시 리뷰 칸)
    plan.working = plan.agents.some((id) => panes.find((pane) => pane.id === id)?.status === 'working')
    if (plan.working && (plan.column === 'review' || plan.column === 'done')) plan.column = 'doing'
  }
  // 이슈에 연결된 계획서는 카드를 따로 만들지 않고 이슈 카드 안에 합친다 — 같은 일이 두 장으로 보이지 않게
  const merged = new Set()
  for (const issue of issues) {
    const plan = plans.find((entry) => entry.id === issue.plan || entry.issue === issue.id)
    if (!plan) continue
    // 아직 열린(open) 이슈가 다른 작업의 계획서를 가리키면 "그 작업 중 발견" 이다 — 합치면 진행 중 계획서 카드가
    // 이슈 칸으로 빨려 들어가 사라진다. 계획서가 이 이슈를 위해 만든 것(Issue:)일 때만 합친다
    if (issue.status === 'open' && plan.issue !== issue.id) continue
    merged.add(plan.id)
    issue.linkedPlan = { id: plan.id, grade: plan.grade, owner: plan.owner, created: plan.created, mtime: plan.mtime, status: plan.status, progress: plan.progress, blocked: plan.blocked, next: plan.next, workRef: plan.workRef, agents: plan.agents }
    // 계획서가 리뷰 단계면 이슈 카드도 리뷰 칸에
    if (issue.status === 'in_progress' && plan.status === 'ready_for_review') issue.column = 'review'
    if (plan.working && issue.column !== 'done') issue.column = 'doing'
    issue.linkedPlan.working = plan.working
    if (plan.status === 'blocked') issue.blocked = plan.blocked || '막힘'
  }
  return { header: readHeader(), herdr: available, agents: [...AGENT_NAMES].sort(), cards: [...issues, ...plans.filter((plan) => !merged.has(plan.id))], panes, subagents, worktrees }
}

// ── 서버 ────────────────────────────────────────────────────────────────
let snapshot = null
let snapshotHash = ''
let updatedAt = 0
const clients = new Set()

const refresh = async () => {
  const collectStarted = Date.now()
  const state = await collect()
  const collectMs = Date.now() - collectStarted
  if (collectMs > 1500) console.log(`⚠️ 현황판 재계산 ${collectMs}ms`)
  const hash = createHash('sha1').update(JSON.stringify(state)).digest('hex')
  if (hash === snapshotHash) return
  snapshot = state
  snapshotHash = hash
  updatedAt = Date.now()
  const payload = `data: ${JSON.stringify({ ...snapshot, updatedAt, boot: BOOT })}\n\n`
  for (const client of clients) client.write(payload)
}

const TOKEN = randomBytes(16).toString('hex')
// 서버가 다시 뜨면 토큰이 바뀐다 — 열려 있던 브라우저가 알아채고 새로고침하도록 기동 번호를 따로 준다(토큰은 SSE 로 내보내지 않는다)
const BOOT = randomBytes(6).toString('hex')
const page = readFileSync(join(ROOT, 'scripts/board/index.html'), 'utf8').replace('__BOARD_TOKEN__', TOKEN).replace('__BOARD_BOOT__', BOOT)

// ── 쓰기: 카드 이동 ──────────────────────────────────────────────────────
const PLAN_STATUS_OF = { plan: 'planned', doing: 'in_progress', review: 'ready_for_review', done: 'done' }
const ISSUE_STATUS_OF = { issue: 'open', plan: 'planned', doing: 'in_progress', review: 'in_progress', done: 'done' }
const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16)

const safePath = (id, dir) => {
  const path = join(ROOT, id)
  return path.startsWith(join(ROOT, dir) + '/') && path.endsWith('.md') && existsSync(path) ? path : null
}

const moveCard = (id, column) => {
  if (id.startsWith('issues/')) {
    const path = safePath(id, 'issues')
    const status = ISSUE_STATUS_OF[column]
    if (!path || !status) return '이슈를 찾지 못했거나 옮길 칸이 올바르지 않아요'
    const text = readFileSync(path, 'utf8')
    if (!/^status:.*$/m.test(text)) return '이슈 파일에 status 줄이 없어요'
    writeFileSync(path, text.replace(/^status:.*$/m, `status: ${status}`))
    return null
  }
  const path = safePath(id, 'plans')
  const status = PLAN_STATUS_OF[column]
  if (!path || !status) return '계획서를 찾지 못했거나 옮길 칸이 올바르지 않아요'
  if (path.includes('/archive/')) return '보관(archive)된 계획서는 옮길 수 없어요'
  const text = readFileSync(path, 'utf8')
  const oldStatus = text.match(/^- Status:.*$/m)?.[0]
  const oldUpdated = text.match(/^- Updated:.*$/m)?.[0]
  if (!oldStatus) return '계획서 Checkpoint 에 Status 줄이 없어요'
  // 상태 값만 바꾸고 뒤의 설명은 둔다
  const STATUS_TOKEN = /(planned|in_progress|blocked|ready_for_review|done)/
  const newStatus = STATUS_TOKEN.test(oldStatus) ? oldStatus.replace(STATUS_TOKEN, status) : oldStatus.replace(/^- Status:\s*/, `- Status: ${status} — `)
  const newUpdated = `- Updated: ${stamp()} / 현황판에서 이동`
  let next = text.replace(oldStatus, newStatus)
  if (oldUpdated) next = next.replace(oldUpdated, newUpdated)
  writeFileSync(path, next)
  // 정식 계획서의 결정 콘솔 html 안 md 사본(plan-md)도 같이 — 경량 계획서는 html 이 없다
  const htmlPath = path.replace(/\.md$/, '.html')
  if (existsSync(htmlPath)) {
    let html = readFileSync(htmlPath, 'utf8')
    if (html.includes(oldStatus)) html = html.replace(oldStatus, newStatus)
    if (oldUpdated && html.includes(oldUpdated)) html = html.replace(oldUpdated, newUpdated)
    writeFileSync(htmlPath, html)
  }
  return null
}

// ── 쓰기: 헤르메스에게 지시 ───────────────────────────────────────────────
const sendToPane = async (paneId, text) => {
  const panes = snapshot?.panes ?? []
  const target = panes.find((pane) => pane.id === paneId && pane.role !== 'other')
  if (!target) return '보낼 pane 을 찾지 못했어요 (헤르메스·에이전트 pane 에만 보낼 수 있어요)'
  const oneLine = text.replace(/\s*\n\s*/g, ' ').trim()
  if (!oneLine || oneLine.length > 2000) return '지시문이 비어 있거나 너무 길어요'
  if ((await run('herdr', ['pane', 'send-text', paneId, oneLine])) === null) return 'herdr 로 입력을 보내지 못했어요'
  await run('herdr', ['pane', 'send-keys', paneId, 'Enter'])
  return null
}

// 이슈 [처리 시작] → 헤르메스: 떠 있는 헤르메스 pane 에 끼워 넣지 않고 **새 헤르메스 pane** 을 열어 그 안에서 처리한다.
// 하던 대화 한가운데에 다른 이슈가 섞이지 않게 — 이슈 하나에 세션 하나. 자리는 헤르메스 pane 옆(없으면 현황판 pane 옆)
const openHermesPane = async (issueId, text) => {
  const issuePath = safePath(issueId, 'issues')
  if (!issuePath) return { error: '이슈 파일을 찾지 못했어요' }
  const prompt = text.trim()
  if (!prompt || prompt.length > 4000) return { error: '지시문이 비어 있거나 너무 길어요' }
  const base = (snapshot?.panes ?? []).find((pane) => pane.role === 'hermes')
  const splitArgs = base ? ['pane', 'split', base.id] : ['pane', 'split', '--current']
  const out = await run('herdr', [...splitArgs, '--direction', 'right', '--ratio', '0.5', '--cwd', ROOT, '--no-focus'])
  let pane = ''
  try {
    pane = JSON.parse(out ?? '').result.pane.pane_id
  } catch {
    return { error: '새 pane 을 열지 못했어요 (herdr pane split)' }
  }
  const title = (readIssue(issuePath)?.title ?? basename(issueId, '.md')).slice(0, 30)
  await run('herdr', ['pane', 'rename', pane, `🧭 헤르메스 · ${title}`])
  // 지시문은 따옴표·줄바꿈이 섞여 있어 파일로 넘긴다(delegate.sh 와 같은 방식). 끝나면 러너가 지운다
  const stamp = randomBytes(4).toString('hex')
  const promptFile = join(tmpdir(), `hermes-issue-prompt-${stamp}`)
  const runner = join(tmpdir(), `hermes-issue-runner-${stamp}`)
  writeFileSync(promptFile, prompt)
  writeFileSync(runner, [
    '#!/usr/bin/env bash',
    `trap "rm -f '${promptFile}' '${runner}'" EXIT INT TERM`,
    `cd '${ROOT}' || exit 1`,
    `claude "$(cat '${promptFile}')"`,
  ].join('\n') + '\n', { mode: 0o755 })
  if ((await run('herdr', ['pane', 'run', pane, runner])) === null) return { error: `pane ${pane} 에서 헤르메스를 실행하지 못했어요` }
  return { pane }
}

// 담당 에이전트를 레포 workspace 에 띄운다 — delegate.sh 가 workspace 찾기·pane 이름·임시 파일을 다 한다
// 디스패치는 몇 초~수십 초 걸린다 — 작업 번호를 바로 돌려주고, 단계마다 SSE(event: job)로 진행을 밀어 준다
const jobs = new Map()
const STEPS = [
  ['fetch', '운영 ref fetch'],
  ['worktree', '이슈 워크트리'],
  ['plan', '경량 계획서'],
  ['pane', '에이전트 pane'],
]
const pushJob = (job) => {
  const payload = `event: job\ndata: ${JSON.stringify(job)}\n\n`
  for (const client of clients) client.write(payload)
}

const dispatchAgent = async (issueId, agent, text, job) => {
  const started = Date.now()
  const step = (key, state, detail = '') => {
    const entry = job.steps.find((item) => item.key === key)
    Object.assign(entry, { state, detail, sec: Math.round((Date.now() - started) / 100) / 10 })
    pushJob(job)
  }
  const fail = (key, message) => {
    step(key, 'error', message)
    return { error: message }
  }
  if (!AGENT_NAMES.has(agent)) return fail('fetch', `${agent} 라는 에이전트가 없어요`)
  const prompt = text.trim()
  if (!prompt || prompt.length > 4000) return fail('fetch', '지시문이 비어 있거나 너무 길어요')
  if (!safePath(issueId, 'issues')) return fail('fetch', '이슈 파일을 찾지 못했어요')
  const worktree = issueWorktree(issueId, agent)
  if (!worktree) return fail('fetch', `${agent} 의 담당 레포를 hermes.config.json 에서 찾지 못했어요`)
  const repoDir = join(ROOT, 'repos', worktree.repo)
  let note = ''
  if (!existsSync(worktree.path)) {
    // 서버는 입력을 받을 수 없다 — ssh 키 암호를 묻다 멈추지 않게 비대화형으로. 안 되면 sync 처럼 https 로 재시도
    step('fetch', 'running', `origin/${worktree.branch}`)
    const quiet = { timeout: 45_000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o ConnectTimeout=10' } }
    let fetched = await run('git', ['-C', repoDir, 'fetch', '--quiet', 'origin', worktree.branch], quiet)
    let via = 'ssh'
    if (fetched === null) {
      via = 'https'
      fetched = await run('git', ['-C', repoDir, '-c', 'url.https://github.com/.insteadOf=git@github.com:', 'fetch', '--quiet', 'origin', worktree.branch], quiet)
    }
    if (fetched === null) note = ' (fetch 실패 — 로컬 ref 로 만들었다)'
    step('fetch', fetched === null ? 'warn' : 'done', fetched === null ? 'ssh·https 모두 실패해서 로컬 ref 로 진행해요' : `origin/${worktree.branch} (${via})`)
    step('worktree', 'running', worktree.rel)
    const added = await run('git', ['-C', repoDir, 'worktree', 'add', '--detach', worktree.path, `origin/${worktree.branch}`], { timeout: 120_000 })
    if (added === null) return fail('worktree', `워크트리를 만들지 못했어요: ${worktree.rel} ← origin/${worktree.branch}`)
  } else {
    step('fetch', 'skip', '워크트리가 이미 있어서 건너뛰었어요')
  }
  const sha = (await run('git', ['-C', worktree.path, 'rev-parse', '--short', 'HEAD']))?.trim() ?? '?'
  step('worktree', 'done', `${worktree.rel} @ ${sha}`)
  const header = `첫 보고 맨 앞에 '📋 경량으로 진행합니다 — 이슈 처리 · <계획서 경로>' 한 줄을 붙인다(계획서가 정식이면 '📋 정식으로 진행합니다'). 작업 디렉토리는 이 이슈 전용 워크트리 ${worktree.path} 다 (origin/${worktree.branch} @ ${sha}, detached — 브랜치 없음). 코드는 이 안에서만 읽는다. repos/${worktree.repo} 메인 체크아웃은 다른 작업이 올라가 있으니 읽지 않는다. `

  // 모든 작업은 계획서 하나에 묶인다 — 이슈에 계획서가 없으면 경량 계획서를 만들어 연결한다
  step('plan', 'running')
  const issueText = readText(join(ROOT, issueId)) ?? ''
  let plan = issueText.match(/^plan:\s*(\S+\.md)/m)?.[1] ?? ''
  if (!plan || !existsSync(join(ROOT, plan))) {
    const title = issueText.match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^"|"$/g, '') || basename(issueId, '.md')
    const promptPath = join(tmpdir(), `hermes-issue-prompt-${Date.now()}.txt`)
    writeFileSync(promptPath, header + prompt)
    plan = ((await run('node', [join(ROOT, 'scripts/new-plan.mjs'), '--agent', agent, '--summary', title, '--issue', issueId, '--prompt-file', promptPath], { cwd: ROOT })) ?? '').trim()
    rmSync(promptPath, { force: true })
    if (!plan) return fail('plan', '경량 계획서를 만들지 못했어요')
    const withPlan = /^plan:.*$/m.test(issueText) ? issueText.replace(/^plan:.*$/m, `plan: ${plan}`) : issueText.replace(/^(status:.*)$/m, `$1\nplan: ${plan}`)
    writeFileSync(join(ROOT, issueId), withPlan)
  }
  step('plan', 'done', plan)
  step('pane', 'running', `${worktree.repo} workspace`)
  const out = await run(join(ROOT, 'scripts/delegate.sh'), [agent, header + prompt, '--cwd', worktree.path, '--plan', plan], { cwd: ROOT, timeout: 30_000 })
  if (out === null) return fail('pane', '에이전트를 띄우지 못했어요 — herdr 안에서 현황판을 띄웠는지 확인해 주세요')
  const pane = out.trim().split('\n').pop()
  step('pane', 'done', pane.split(' ')[0])
  // 맡겼으면 카드도 진행 중으로 — open·planned 일 때만 (이미 더 간 상태는 건드리지 않는다)
  const current = readText(join(ROOT, issueId))?.match(/^status:\s*(\S+)/m)?.[1]
  if (!current || current === 'open' || current === 'planned') moveCard(issueId, 'doing')
  return { pane, plan, worktree: worktree.rel, ref: `origin/${worktree.branch}@${sha}${note}` }
}

// 리뷰 요청 — 헤르메스 pane 을 거치지 않고 reviewer 를 바로 띄운다.
// 어느 레포 workspace·어느 워크트리에 띄울지는 delegate.sh 가 계획서의 Agent·Work ref 를 보고 정한다
const dispatchReview = async (planId, text) => {
  if (!safePath(planId, 'plans') || !planId.endsWith('.md')) return { error: '계획서를 찾지 못했어요' }
  const prompt = text.trim()
  if (!prompt || prompt.length > 4000) return { error: '지시문이 비어 있거나 너무 길어요' }
  const out = await run(join(ROOT, 'scripts/delegate.sh'), ['reviewer', prompt, '--plan', planId], { cwd: ROOT, timeout: 30_000 })
  if (out === null) return { error: 'reviewer 를 띄우지 못했어요 — herdr 안에서 현황판을 띄웠는지 확인해 주세요' }
  return { pane: out.trim().split('\n').pop() }
}

const removeIssueWorktree = async (issueId, agent) => {
  const worktree = issueWorktree(issueId, agent)
  if (!worktree || !existsSync(worktree.path)) return { error: '지울 워크트리가 없어요' }
  const dirty = ((await run('git', ['-C', worktree.path, 'status', '--porcelain'])) ?? 'x').trim()
  if (dirty) return { error: '커밋하지 않은 변경이 있어서 지우지 않았어요 — 직접 확인해 주세요' }
  // 에이전트가 로컬 커밋을 할 수 있으니, 깨끗해도 원격 어디에도 없는 커밋이 있으면 지우지 않는다
  const unpushed = ((await run('git', ['-C', worktree.path, 'rev-list', '--count', 'HEAD', '--not', '--remotes'])) ?? '1').trim()
  if (unpushed !== '0') return { error: `push 하지 않은 커밋이 ${unpushed}개 있어서 지우지 않았어요 — 그 pane 에서 "PR 올려줘"(ship.sh)로 올리거나 직접 확인해 주세요` }
  if ((await run('git', ['-C', join(ROOT, 'repos', worktree.repo), 'worktree', 'remove', worktree.path])) === null) return { error: '워크트리를 지우지 못했어요 (git worktree remove 실패)' }
  return { removed: worktree.rel }
}

// 삭제는 휴지통으로 옮기기 — plans/ 는 gitignore 라 지우면 되돌릴 수 없다
const toTrash = (relPath) => {
  const from = join(ROOT, relPath)
  if (!existsSync(from)) return null
  const to = join(ROOT, '.board-trash', stamp().slice(0, 10), relPath)
  mkdirSync(dirname(to), { recursive: true })
  renameSync(from, existsSync(to) ? `${to}.${Date.now()}` : to)
  return relPath
}

const archiveCard = async (id) => {
  const moved = []
  const notes = []
  let lastBundle = null
  if (id.startsWith('issues/')) {
    const path = safePath(id, 'issues')
    if (!path || basename(path) === 'README.md') return { error: '이슈 파일을 찾지 못했어요' }
    const text = readFileSync(path, 'utf8')
    const agent = text.match(/^agent:\s*(\S+)/m)?.[1] || agentForRepo(text.match(/^repo:\s*(\S+)/m)?.[1] || '')
    if (agent) {
      const removed = await removeIssueWorktree(id, agent)
      if (removed.removed) moved.push(`워크트리 ${removed.removed} 정리`)
      else if (removed.error && !removed.error.startsWith('지울 워크트리가 없어요')) notes.push(removed.error)
    }
    // 연결된 계획서와 한 폴더로 묶어 보관한다(archive.mjs) — 이슈 plan: 은 새 위치로 고쳐진다
    const bundle = archiveBundle(id)
    if (bundle.error) return { error: bundle.error }
    lastBundle = bundle
    moved.push(...bundle.moved)
  } else {
    const path = safePath(id, 'plans')
    if (!path) return { error: '계획서를 찾지 못했어요' }
    const bundle = archiveBundle(id)
    if (bundle.error) return { error: bundle.error }
    lastBundle = bundle
    moved.push(...bundle.moved)
  }
  // 보관한 것만 로컬 커밋(push 는 헤르메스)
  const committed = commitArchive([lastBundle])
  if (committed.sha) moved.push(`커밋 ${committed.sha}`)
  if (committed.error) notes.push(`커밋하지 못했어요 — ${committed.error}`)
  return { moved: moved.filter(Boolean), notes }
}

const deleteCard = async (id) => {
  const moved = []
  const notes = []
  if (id.startsWith('issues/')) {
    const path = safePath(id, 'issues')
    if (!path || basename(path) === 'README.md') return { error: '이슈 파일을 찾지 못했어요' }
    const text = readFileSync(path, 'utf8')
    const agent = text.match(/^agent:\s*(\S+)/m)?.[1] || agentForRepo(text.match(/^repo:\s*(\S+)/m)?.[1] || '')
    // 워크트리 — 커밋 안 된 변경이 있으면 남긴다
    if (agent) {
      const removed = await removeIssueWorktree(id, agent)
      if (removed.removed) moved.push(`워크트리 ${removed.removed} 정리`)
      else if (removed.error && !removed.error.startsWith('지울 워크트리가 없어요')) notes.push(removed.error)
    }
    // 연결된 경량 계획서만 같이 — 정식 계획서는 다른 작업과 묶여 있을 수 있어 두지 않는다
    const plan = text.match(/^plan:\s*(plans\/task\/\S+\.md)/m)?.[1]
    if (plan && toTrash(plan)) moved.push(plan)
    moved.push(toTrash(id))
  } else {
    const path = safePath(id, 'plans')
    if (!path) return { error: '계획서를 찾지 못했어요' }
    moved.push(toTrash(id))
    const html = id.replace(/\.md$/, '.html')
    if (existsSync(join(ROOT, html))) moved.push(toTrash(html))
  }
  return { moved: moved.filter(Boolean), notes, trash: `.board-trash/${stamp().slice(0, 10)}/` }
}

const readBody = (request) =>
  new Promise((resolve) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 20_000) request.destroy()
    })
    request.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch {
        resolve(null)
      }
    })
  })

// 잘못된 퍼센트 인코딩(%E0%A4%A 등)이면 decodeURIComponent 가 던진다 — 서버가 죽지 않게 빈 경로(= 404)로
const safeDecodedPath = (pathname) => {
  try {
    return join(ROOT, decodeURIComponent(pathname))
  } catch {
    return ''
  }
}

// ── QA 시뮬레이션 (scripts/qa) ─────────────────────────────
let qaChild = null
const QA_ID = /^\d{8}-\d{6}-[\w-]+$/
const QA_TYPES = { '.png': 'image/png', '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.log': 'text/plain; charset=utf-8' }
// 목록에는 요약만 — 화면별 상세는 런 하나를 열 때
// 끝나지 않았는데 2분 넘게 run.json 이 그대로면 죽은 런 — 목록에 계속 ⏳ 로 남지 않게 '중단' 으로 보여 준다
const qaStale = (run) => ['preparing', 'running'].includes(run.status) && Date.now() - statSync(join(QA_RUNS_DIR, run.id, 'run.json')).mtimeMs > 120_000
const qaSummary = (run) => ({
  id: run.id, kind: run.kind ?? 'impact', app: run.app, plan: run.plan, branch: run.branch, head: run.head, base: run.base, profile: run.profile,
  status: run.status, phase: run.phase, error: run.error, startedAt: run.startedAt, finishedAt: run.finishedAt, summary: run.summary,
  screens: run.screens?.length ?? 0, finished: (run.screens ?? []).filter((screen) => !['queued', 'running'].includes(screen.status)).length,
  ...(qaStale(run) ? { status: 'error', error: '응답 없음 — 중단된 런' } : {})
})
// 돌고 있는 런 — run.json 이 2분 안에 갱신됐고 끝나지 않은 것(포트 3291·3292 를 쓰므로 한 번에 하나)
function activeQaRun() {
  for (const run of listQaRuns().slice(0, 5)) {
    if (!['preparing', 'running'].includes(run.status)) continue
    const fresh = Date.now() - statSync(join(QA_RUNS_DIR, run.id, 'run.json')).mtimeMs < 120_000
    if (fresh) return run
  }
  return null
}
// 계획서 카드 → QA 대상: Work ref 맨 앞의 워크트리(절대 경로) + 담당 에이전트의 앱(routes/<앱>.json 이 있는 것만 — 파일럿 refund-web)
function startQaRun(planId) {
  const path = safePath(planId, 'plans')
  if (!path) return { error: '계획서를 찾지 못했어요' }
  const text = readFileSync(path, 'utf8')
  const workRef = text.match(/^- Work ref:\s*(\S+)/m)?.[1] ?? ''
  const worktree = workRef.replace(/`/g, '')
  if (!worktree.startsWith('/') || !existsSync(worktree)) return { error: 'Work ref 에 워크트리 경로가 없어요 — 담당 에이전트가 브랜치를 만든 뒤에 돌릴 수 있어요' }
  const agent = text.match(/^- Agent:\s*(\S+)/m)?.[1] ?? ''
  const config = JSON.parse(readFileSync(join(ROOT, 'hermes.config.json'), 'utf8'))
  const apps = config.repos.find((repo) => repo.name === 'bznav-web')?.apps ?? {}
  const app = Object.entries(apps).find(([, settings]) => settings.agent === agent)?.[0] ?? Object.keys(apps).find((name) => existsSync(join(worktree, 'apps', name)) && existsSync(join(ROOT, 'scripts', 'qa', 'routes', `${name}.json`)))
  if (!app || !existsSync(join(ROOT, 'scripts', 'qa', 'routes', `${app}.json`))) return { error: `QA 시뮬레이션은 아직 refund-web 만 돼요 (scripts/qa/routes/<앱>.json)${agent ? ` — 이 계획서는 ${agent}` : ''}` }
  // 방금 띄운 런은 run.json 을 쓰기 전일 수 있다 — 이 서버가 띄운 프로세스가 살아 있으면 먼저 거부
  if (qaChild && qaChild.exitCode === null && qaChild.signalCode === null) return { error: '이 현황판이 띄운 QA 가 아직 돌고 있어요 — QA 탭에서 진행을 보세요' }
  const running = activeQaRun()
  if (running) return { error: `다른 QA 가 돌고 있어요 — ${running.id} (${running.phase})` }
  mkdirSync(QA_RUNS_DIR, { recursive: true })
  const log = join(QA_RUNS_DIR, 'launch.log')
  writeFileSync(log, `${new Date().toISOString()} ${planId} ${worktree} ${app}\n`, { flag: 'a' })
  const child = spawn(process.execPath, [join(ROOT, 'scripts', 'qa', 'run.mjs'), '--cwd', worktree, '--app', app, '--plan', planId], { cwd: ROOT, detached: true, stdio: 'ignore' })
  child.unref()
  qaChild = child
  return { ok: true, app, worktree }
}

// 무거운 명령 잠금(scripts/heavy.sh) — QA 는 이 차례를 기다린다. 지금 누가 쥐고 있는지 + 이 현황판이 띄운 QA 가 기다리는 중인지
function heavyLockState() {
  const lock = process.env.HERMES_HEAVY_LOCK || '/tmp/hermes-heavy.lock'
  let holder = ''
  try {
    holder = readFileSync(join(lock, 'what'), 'utf8').trim()
  } catch {
    holder = ''
  }
  const launched = Boolean(qaChild && qaChild.exitCode === null && qaChild.signalCode === null)
  return { holder, waiting: launched && !activeQaRun() }
}

// 전체 검수 가능한 앱 — scripts/qa/routes/<앱>.json 이 있는 것. 프로필마다 세션이 저장돼 있는지
function qaApps() {
  const dir = join(ROOT, 'scripts', 'qa', 'routes')
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((name) => name.endsWith('.json')).map((name) => {
    const app = name.replace(/\.json$/, '')
    const config = JSON.parse(readFileSync(join(dir, name), 'utf8'))
    const profiles = Object.entries(config.profiles ?? {}).filter(([key]) => !key.startsWith('$')).map(([key, settings]) => ({
      name: key, note: settings.note ?? '', session: !settings.session || existsSync(join(ROOT, '.qa-auth', `${app}.${settings.session}.json`))
    }))
    const scenarioDir = join(ROOT, 'scripts', 'qa', 'scenarios', app)
    return { app, profiles, scenarios: existsSync(scenarioDir) ? readdirSync(scenarioDir).filter((file) => file.endsWith('.json')).length : 0 }
  })
}
// [전체 검수] — 최신 개발 브랜치(qa-base)로 화면 전부 + 흐름 씬. 한 번에 하나
function startQaSuite(app, profile) {
  const known = qaApps().find((entry) => entry.app === app)
  if (!known) return { error: `전체 검수 설정이 없는 앱이에요 — scripts/qa/routes/${app}.json` }
  if (profile && !known.profiles.some((entry) => entry.name === profile)) return { error: `프로필 ${profile} 이 없어요` }
  if (qaChild && qaChild.exitCode === null && qaChild.signalCode === null) return { error: '이 현황판이 띄운 QA 가 아직 돌고 있어요 — QA 탭에서 진행을 보세요' }
  const running = activeQaRun()
  if (running) return { error: `다른 QA 가 돌고 있어요 — ${running.id} (${running.phase})` }
  mkdirSync(QA_RUNS_DIR, { recursive: true })
  writeFileSync(join(QA_RUNS_DIR, 'launch.log'), `${new Date().toISOString()} suite ${app} ${profile ?? ''}\n`, { flag: 'a' })
  const args = [join(ROOT, 'scripts', 'qa', 'run.mjs'), '--suite', '--app', app, ...(profile ? ['--profile', profile] : [])]
  qaChild = spawn(process.execPath, args, { cwd: ROOT, detached: true, stdio: 'ignore' })
  qaChild.unref()
  return { ok: true, app, profile: profile || '(기본)' }
}

const allowed = (request) => {
  const origin = request.headers.origin
  const okOrigin = origin === `http://localhost:${PORT}` || origin === `http://127.0.0.1:${PORT}`
  return okOrigin && request.headers['x-board-token'] === TOKEN && request.headers['content-type']?.startsWith('application/json')
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`)
  if (url.pathname === '/events') {
    // 기동 번호 없이 붙는 건 옛 페이지 — 204 를 주면 EventSource 가 재연결을 멈춘다(연결 한도를 잡아먹지 않게)
    if (!url.searchParams.get('boot')) {
      response.writeHead(204)
      response.end()
      return
    }
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
    if (snapshot) response.write(`data: ${JSON.stringify({ ...snapshot, updatedAt, boot: BOOT })}\n\n`)
    clients.add(response)
    const keepAlive = setInterval(() => response.write(': ping\n\n'), 20_000)
    request.on('close', () => {
      clearInterval(keepAlive)
      clients.delete(response)
    })
    return
  }
  // 카드 상세 — 누를 때만 읽는다(실시간 갱신에 싣지 않는다). plans/·issues/ 안의 md 만
  if (url.pathname === '/api/card') {
    const id = String(url.searchParams.get('id') ?? '')
    const dir = id.startsWith('issues/') ? 'issues' : 'plans'
    const path = safePath(id, dir)
    response.writeHead(path ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' })
    if (!path) return response.end(JSON.stringify({ error: '파일을 찾지 못했어요' }))
    const text = readFileSync(path, 'utf8')
    let plan = null
    if (dir === 'issues') {
      const planId = text.match(/^plan:\s*(\S+\.md)/m)?.[1]
      if (planId && existsSync(join(ROOT, planId))) plan = { id: planId, text: readFileSync(join(ROOT, planId), 'utf8') }
    }
    return response.end(JSON.stringify({ id, text, plan }))
  }
  if (url.pathname === '/api/qa/runs') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    return response.end(JSON.stringify({ runs: listQaRuns().slice(0, 60).map(qaSummary), heavy: heavyLockState() }))
  }
  if (url.pathname === '/api/qa/apps') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    return response.end(JSON.stringify({ apps: qaApps() }))
  }
  if (url.pathname === '/api/qa/run') {
    const id = String(url.searchParams.get('id') ?? '')
    const file = join(QA_RUNS_DIR, id, 'run.json')
    const ok = QA_ID.test(id) && existsSync(file)
    response.writeHead(ok ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    return response.end(ok ? readFileSync(file) : JSON.stringify({ error: 'QA 런을 찾지 못했어요' }))
  }
  // QA 스크린샷·리포트 — .qa-runs/<런 id>/ 안의 png·html·json·log 만(경로 탈출 404)
  if (url.pathname.startsWith('/qa-runs/')) {
    let inner = ''
    try {
      inner = decodeURIComponent(url.pathname.slice('/qa-runs/'.length))
    } catch {
      inner = ''
    }
    const path = join(QA_RUNS_DIR, inner)
    const type = QA_TYPES[path.slice(path.lastIndexOf('.'))]
    if (inner && type && QA_ID.test(inner.split('/')[0]) && path.startsWith(QA_RUNS_DIR + sep) && existsSync(path) && statSync(path).isFile()) {
      response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' })
      return response.end(readFileSync(path))
    }
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    return response.end('not found')
  }
  // board.sh 가 이미 보고 있는 탭이 있는지 묻는다 — 있으면 새 탭을 열지 않는다
  // 히스토리 — 보관된 일(archive/). 누를 때만 읽는다
  if (url.pathname === '/api/history') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    return response.end(JSON.stringify({ items: listHistory() }))
  }
  if (url.pathname === '/api/history/item') {
    const item = readHistoryItem(String(url.searchParams.get('dir') ?? ''))
    response.writeHead(item ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' })
    return response.end(JSON.stringify(item ?? { error: '보관된 일을 찾지 못했어요' }))
  }
  if (url.pathname === '/api/viewers') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ viewers: clients.size }))
    return
  }
  if (url.pathname === '/api/state') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ ...snapshot, updatedAt, boot: BOOT }))
    return
  }
  if (request.method === 'POST' && ['/api/move', '/api/action', '/api/dispatch', '/api/review', '/api/worktree-remove', '/api/delete', '/api/archive', '/api/hermes-new', '/api/qa-start', '/api/qa-suite', '/api/qa-approve'].includes(url.pathname)) {
    const reply = (code, body) => {
      response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify(body))
    }
    if (!allowed(request)) return reply(403, { error: '허용되지 않은 요청이에요 (토큰·Origin 확인)' })
    const body = await readBody(request)
    if (!body) return reply(400, { error: '요청 형식이 올바르지 않아요' })
    if (url.pathname === '/api/dispatch') {
      // 바로 작업 번호를 돌려주고 뒤에서 돈다 — 진행은 SSE event: job
      const job = { id: randomBytes(4).toString('hex'), issue: String(body.id ?? ''), agent: String(body.agent ?? ''), state: 'running', steps: STEPS.map(([key, label]) => ({ key, label, state: 'wait' })) }
      jobs.set(job.id, job)
      dispatchAgent(job.issue, job.agent, String(body.text ?? ''), job).then(async (result) => {
        Object.assign(job, result.error ? { state: 'error', error: result.error } : { state: 'done', result })
        pushJob(job)
        await refresh()
      })
      return reply(202, { ok: true, job: job.id })
    }
    if (url.pathname === '/api/qa-suite') {
      const result = startQaSuite(String(body.app ?? ''), String(body.profile ?? ''))
      return reply(result.error ? 400 : 202, result)
    }
    if (url.pathname === '/api/qa-approve') {
      const id = String(body.id ?? '')
      if (!QA_ID.test(id)) return reply(400, { error: '런 id 가 올바르지 않아요' })
      const result = approveQaRun(id, body.key ? [String(body.key)] : null)
      return reply(result.error ? 400 : 200, result.error ? result : { ok: true, screens: result.screens, shots: result.shots })
    }
    if (url.pathname === '/api/qa-start') {
      const result = startQaRun(String(body.id ?? ''))
      return reply(result.error ? 400 : 202, result)
    }
    if (url.pathname === '/api/hermes-new') {
      const result = await openHermesPane(String(body.id ?? ''), String(body.text ?? ''))
      if (result.error) return reply(400, result)
      await refresh()
      return reply(200, { ok: true, ...result })
    }
    if (url.pathname === '/api/review') {
      const result = await dispatchReview(String(body.id ?? ''), String(body.text ?? ''))
      if (result.error) return reply(400, result)
      await refresh()
      return reply(200, { ok: true, ...result })
    }
    if (url.pathname === '/api/delete' || url.pathname === '/api/archive') {
      const result = url.pathname === '/api/delete' ? await deleteCard(String(body.id ?? '')) : await archiveCard(String(body.id ?? ''))
      if (result.error) return reply(400, result)
      await refresh()
      return reply(200, { ok: true, ...result })
    }
    if (url.pathname === '/api/worktree-remove') {
      const result = await removeIssueWorktree(String(body.id ?? ''), String(body.agent ?? ''))
      if (result.error) return reply(400, result)
      await refresh()
      return reply(200, { ok: true, ...result })
    }
    const error = url.pathname === '/api/move' ? moveCard(String(body.id ?? ''), String(body.column ?? '')) : await sendToPane(String(body.pane ?? ''), String(body.text ?? ''))
    if (error) return reply(400, { error })
    await refresh()
    return reply(200, { ok: true })
  }
  // 보관된 결정 콘솔(archive/<이름>/plan.html) — 히스토리에서 읽기 전용으로 본다. 토큰을 넣지 않아 [이대로 진행] 은 복사로 바뀐다
  if (url.pathname.startsWith('/archive/') && url.pathname.endsWith('/plan.html')) {
    const path = safeDecodedPath(url.pathname)
    if (path && path.startsWith(join(ROOT, 'archive') + sep) && existsSync(path)) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      response.end(readFileSync(path))
      return
    }
  }
  // 계획서 HTML(결정 콘솔)은 plans/ 안의 것만 연다
  // 토큰을 넣어 준다 — 콘솔의 [이대로 진행] 이 /api/action 으로 PLAN.hermesPane 에 결정을 보낸다(같은 출처라 Origin 검사도 통과)
  if (url.pathname.startsWith('/plans/') && url.pathname.endsWith('.html')) {
    const path = safeDecodedPath(url.pathname)
    if (path && path.startsWith(join(ROOT, 'plans')) && existsSync(path)) {
      const html = readFileSync(path, 'utf8').replace('</head>', `<script>window.HERMES_BOARD_TOKEN = ${JSON.stringify(TOKEN)}</script>\n</head>`)
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      response.end(html)
      return
    }
  }
  response.writeHead(url.pathname === '/' ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8' })
  response.end(url.pathname === '/' ? page : 'not found')
}).listen(PORT, '127.0.0.1', async () => {
  await refresh()
  setInterval(refresh, POLL_MS)
  console.log(`헤르메스 현황판: http://localhost:${PORT}  (3초마다 갱신 · Ctrl+C 로 종료)`)
})
