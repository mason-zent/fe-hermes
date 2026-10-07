/**
 * QA 이력 리포트 — run.json 을 사람이 보는 HTML 로 만든다.
 *   .qa-runs/<런 id>/report.html  런 하나 (화면 카드 · 작업/기준/차이 스크린샷 · 문제 원문 · 영향 경로)
 *   .qa-runs/index.html           전체 이력 (최신순 · 계획서 · 브랜치 · 결과 요약)
 * run.mjs 가 끝날 때 부르고, history.mjs 가 다시 만든다. 현황판 QA 탭도 같은 run.json 을 읽는다.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERMES = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const RUNS_DIR = join(HERMES, '.qa-runs')

export const STATUS = {
  pass: { icon: '✅', label: '통과', tone: 'ok' },
  expected: { icon: '☑️', label: '기대대로 이동', tone: 'ok' },
  changed: { icon: '🟡', label: '화면 변화', tone: 'warn' },
  fail: { icon: '❌', label: '실패', tone: 'bad' },
  redirected: { icon: '↪️', label: '이동됨', tone: 'muted' },
  login: { icon: '🔒', label: '로그인 필요', tone: 'muted' },
  ci: { icon: '🪪', label: '본인인증 필요', tone: 'muted' },
  sample: { icon: '📝', label: '샘플 필요', tone: 'muted' },
  new: { icon: '🆕', label: '기준 없음', tone: 'run' },
  human: { icon: '🙋', label: '사람 필요', tone: 'warn' },
  skip: { icon: '⛔', label: '건너뜀(부작용)', tone: 'muted' },
  queued: { icon: '·', label: '대기', tone: 'muted' },
  running: { icon: '⏳', label: '실행 중', tone: 'run' }
}
const ORDER = ['fail', 'changed', 'human', 'login', 'ci', 'redirected', 'sample', 'skip', 'new', 'expected', 'pass', 'running', 'queued']

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])

export function listRuns() {
  if (!existsSync(RUNS_DIR)) return []
  return readdirSync(RUNS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(RUNS_DIR, entry.name, 'run.json')))
    .map((entry) => {
      try {
        return JSON.parse(readFileSync(join(RUNS_DIR, entry.name, 'run.json'), 'utf8'))
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .sort((left, right) => right.id.localeCompare(left.id))
}

export const summaryText = (run) => {
  const screens = ORDER.filter((status) => run.summary?.[status])
    .map((status) => `${STATUS[status].icon} ${STATUS[status].label} ${run.summary[status]}`)
    .join(' · ')
  const scenarios = Object.keys(run.scenarioSummary ?? {}).length
    ? ` | 흐름 씬 ${ORDER.filter((status) => run.scenarioSummary[status]).map((status) => `${STATUS[status].icon}${run.scenarioSummary[status]}`).join(' ')}`
    : ''
  return `${run.kind === 'suite' ? '[전체 검수] ' : ''}${screens}${scenarios}` || (run.status === 'error' ? `오류 — ${run.error ?? ''}` : run.phase ?? '')
}

const STYLE = `
:root{--bg:#f6f4ef;--card:#fff;--ink:#1f2328;--sub:#6e7781;--line:#e4e0d6;--ok:#1a7f37;--warn:#9a6700;--bad:#cf222e;--run:#1f6feb;--muted:#6e7781;--chip:#f0ede5}
@media (prefers-color-scheme:dark){:root{--bg:#161616;--card:#202020;--ink:#e6e6e6;--sub:#9a9a9a;--line:#333;--chip:#2a2a2a;--ok:#3fb950;--warn:#d29922;--bad:#f85149;--run:#58a6ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px 64px}h1{font-size:20px;margin:0 0 4px}.sub{color:var(--sub)}
a{color:var(--run);text-decoration:none}a:hover{text-decoration:underline}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 20px}.chip{background:var(--chip);border-radius:999px;padding:3px 10px;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;border-left:4px solid var(--muted)}
.card.ok{border-left-color:var(--ok)}.card.warn{border-left-color:var(--warn)}.card.bad{border-left-color:var(--bad)}.card.run{border-left-color:var(--run)}
.card h3{margin:0 0 4px;font-size:15px;word-break:break-all}.why{color:var(--sub);font-size:12px;word-break:break-all;margin:4px 0 8px}
.shots{display:flex;gap:6px;margin-top:8px;overflow-x:auto}.shot{flex:0 0 auto;text-align:center;font-size:11px;color:var(--sub)}
.shot img{display:block;width:150px;height:110px;object-fit:cover;object-position:top;border:1px solid var(--line);border-radius:6px;background:#fff}
.problems{margin:8px 0 0;padding-left:18px;font-size:12px;color:var(--bad);word-break:break-all}
.events{margin:4px 0 0;padding-left:16px;font-size:11.5px;word-break:break-all}details summary{cursor:pointer;font-size:12px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;color:var(--sub);font-weight:600}
tr:last-child td{border-bottom:0}.tag{font-size:12px;color:var(--sub)}
details summary{cursor:pointer;color:var(--sub);font-size:12px;margin-top:6px}
@media (max-width:600px){.grid{grid-template-columns:1fr}th:nth-child(3),td:nth-child(3){display:none}}
`

const page = (title, body) =>
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${STYLE}</style></head><body><main>${body}</main></body></html>\n`

// 2026-10-02 09:08
export const when = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 트래킹 이벤트(Mixpanel) — 접어 둔 목록. 이름 · 줄인 속성
function eventList(groups) {
  const filled = groups.filter(([, events]) => events?.length)
  if (!filled.length) return ''
  const total = filled.reduce((sum, [, events]) => sum + events.length, 0)
  const lists = filled
    .map(([label, events]) => `${label ? `<div class="tag">${escape(label)}</div>` : ''}<ul class="events">${events.map((event) => `<li><b>${escape(event.name)}</b>${event.props ? ` <span class="tag">${escape(event.props)}</span>` : ''}</li>`).join('')}</ul>`)
    .join('')
  return `<details><summary>📊 트래킹 이벤트 ${total}개</summary>${lists}</details>`
}

// 흐름 씬 — 단계마다 통과/멈춤과 그때 경로, 남긴 스크린샷
function scenarioSection(run) {
  if (!run.scenarios?.length) return ''
  const items = run.scenarios
    .map((scenario) => {
      const status = STATUS[scenario.status] ?? STATUS.queued
      const steps = (scenario.steps ?? []).map((step) => `<li>${step.ok ? '✔' : '✖'} ${escape(step.label)}${step.detail ? ` <span class="tag">${escape(step.detail)}</span>` : ''}</li>`).join('')
      const shots = (scenario.shots ?? []).map((shot) => `<a class="shot" href="${escape(shot.file)}" target="_blank"><img loading="lazy" src="${escape(shot.file)}" alt="${escape(shot.name)}">${escape(shot.name)}</a>`).join('')
      return `<div class="card ${status.tone}"><h3>${status.icon} ${escape(scenario.name)}</h3>
  <div class="tag">${status.label} · 세션 ${escape(scenario.profile)}${scenario.viewport ? ` · ${escape(scenario.viewport)}` : ''} · ${escape(scenario.file)}</div>
  ${scenario.why ? `<div class="why">${escape(scenario.why)}</div>` : ''}
  <ol style="margin:6px 0 0;padding-left:18px;font-size:12.5px">${steps}</ol>
  ${(scenario.problems ?? []).length ? `<ul class="problems">${scenario.problems.map((problem) => `<li>${escape(problem.text)}</li>`).join('')}</ul>` : ''}
  <div class="shots">${shots}</div>
  ${eventList([['', scenario.events]])}</div>`
    })
    .join('\n')
  return `<h2 style="font-size:15px;margin:18px 0 0">흐름 씬 ${run.scenarios.length}개</h2><div class="grid" style="margin-top:10px">${items}</div>`
}

export function buildReport(runDir) {
  const run = JSON.parse(readFileSync(join(runDir, 'run.json'), 'utf8'))
  const screens = [...run.screens].sort((left, right) => ORDER.indexOf(left.status) - ORDER.indexOf(right.status) || left.distance - right.distance)
  const cards = screens
    .map((screen) => {
      const status = STATUS[screen.status] ?? STATUS.queued
      const shots = screen.viewports
        .flatMap((viewport) =>
          [
            ['작업', viewport.shots.head],
            ['기준', viewport.shots.base],
            ['차이', viewport.shots.diff]
          ]
            .filter(([, file]) => file)
            .map(
              ([kind, file]) =>
                `<a class="shot" href="${escape(file)}" target="_blank"><img loading="lazy" src="${escape(file)}" alt="${escape(`${screen.key} ${viewport.name} ${kind}`)}">${escape(viewport.name)} ${kind}${kind === '차이' && viewport.diff ? ` ${viewport.diff.pixels}px` : ''}</a>`
            )
        )
        .join('')
      const moved = screen.viewports.find((viewport) => viewport.finalPath && screen.url && viewport.finalPath.split('?')[0] !== screen.url.split('?')[0])
      const problems = screen.problems.length
        ? `<ul class="problems">${screen.problems.map((problem) => `<li>[${escape(problem.viewport)}] ${escape(problem.kind)} — ${escape(problem.text)}</li>`).join('')}</ul>`
        : ''
      const via = screen.via?.length ? `<details><summary>영향 경로 (${screen.distance}단계)</summary><div class="why">${screen.via.map(escape).join('<br>→ ')}</div></details>` : ''
      return `<div class="card ${status.tone}">
  <h3>${status.icon} ${escape(screen.url ?? screen.route)}</h3>
  <div class="tag">${status.label}${screen.auth ? ' · 🔒 로그인 화면' : ''}${screen.entry ? ' · 진입 경로로 열었음' : ''}${screen.expect ? ` · 기대 ${screen.expect === 'stay' ? '머무름' : `→ ${escape(screen.expect.replace(/^=/, ''))}`}` : ''}${moved ? ` · → ${escape(moved.finalPath)}` : ''}${screen.baseProblems ? ` · 기준에도 있던 문제 ${screen.baseProblems}개` : ''}${screen.approved ? ' · ✔ 기준 승인됨' : ''}</div>
  <div class="why">${escape(screen.route)} ← ${escape(screen.changedFile)}</div>
  ${screen.note ? `<div class="why">📝 ${escape(screen.note)}</div>` : ''}
  ${screen.flows?.length ? `<div class="why">🔗 흐름에서 확인 — 씬 ${escape(screen.flows.join(', '))}</div>` : ''}
  ${screen.viewports.some((viewport) => viewport.warnings?.length) ? `<details><summary>⚠ 확인 필요 ${screen.viewports.reduce((total, viewport) => total + (viewport.warnings?.length ?? 0), 0)}개</summary><ul class="events">${screen.viewports.flatMap((viewport) => (viewport.warnings ?? []).map((warning) => `<li>[${escape(viewport.name)}] ${escape(warning.text)}</li>`)).join('')}</ul></details>` : ''}
  ${problems}
  <div class="shots">${shots}</div>
  ${eventList(screen.viewports.map((viewport) => [viewport.name, viewport.events]))}
  ${via}
</div>`
    })
    .join('\n')
  const changed = run.changed?.length
    ? `<details><summary>변경 파일 ${run.changed.length}개</summary><div class="why">${run.changed.map((item) => `${escape(item.file)}${item.global ? ' (공통 — 화면 전부)' : ''}${item.inGraph ? '' : ' (화면과 연결 없음)'}`).join('<br>')}</div></details>`
    : ''
  const body = `<p class="sub"><a href="../index.html">← QA 이력</a></p>
<h1>${run.kind === 'suite' ? '전체 검수' : 'QA'} ${escape(run.app)} · ${escape(run.branch)} @${escape(run.head)}</h1>
<div class="sub">${when(run.startedAt)} · ${run.base ? `기준 ${escape(run.base.ref)}@${escape(run.base.sha)}` : '기준 비교 없음'}${run.plan ? ` · 계획서 ${escape(run.plan)}` : ''} · 세션 프로필 ${escape(run.profile ?? '')} (${run.session === 'saved' ? '저장된 세션' : '세션 없음'})${run.kind === 'suite' ? ' · 비교: 승인한 기준 사진 — 승인은 <code>node scripts/qa/approve.mjs ' + escape(run.id) + '</code> 또는 현황판 QA 탭' : ''}</div>
<div class="chips">${ORDER.filter((status) => run.summary?.[status]).map((status) => `<span class="chip">${STATUS[status].icon} ${STATUS[status].label} ${run.summary[status]}</span>`).join('')}<span class="chip">영향 화면 ${new Set(run.screens.map((screen) => screen.route)).size} / 전체 ${run.totalScreens || '?'}</span></div>
${run.status === 'error' ? `<p class="problems">오류 — ${escape(run.error)}</p>` : ''}
${changed}
${scenarioSection(run)}
<h2 style="font-size:15px;margin:18px 0 0">화면 ${run.screens.length}개</h2>
<div class="grid" style="margin-top:10px">${cards || '<p class="sub">영향 화면 없음</p>'}</div>`
  writeFileSync(join(runDir, 'report.html'), page(`QA ${run.id}`, body))
  return join(runDir, 'report.html')
}

export function buildIndex() {
  const runs = listRuns()
  const rows = runs
    .map(
      (run) => `<tr>
  <td><a href="${escape(run.id)}/report.html">${when(run.startedAt)}</a><div class="tag">${escape(run.id)}</div></td>
  <td>${escape(run.app)} · ${escape(run.branch)} @${escape(run.head)}<div class="tag">${run.base ? `기준 ${escape(run.base.ref)}@${escape(run.base.sha)}` : '기준 비교 없음'}</div></td>
  <td class="tag">${escape(run.plan ?? '')}</td>
  <td>${escape(summaryText(run))}</td>
</tr>`
    )
    .join('\n')
  const body = `<h1>QA 이력</h1><div class="sub">최신순 · ${runs.length}건 · .qa-runs/ (git 무시)</div>
<table style="margin-top:16px"><thead><tr><th>언제</th><th>앱 · 브랜치</th><th>계획서</th><th>결과</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="sub">아직 없음</td></tr>'}</tbody></table>`
  writeFileSync(join(RUNS_DIR, 'index.html'), page('QA 이력', body))
  return join(RUNS_DIR, 'index.html')
}
