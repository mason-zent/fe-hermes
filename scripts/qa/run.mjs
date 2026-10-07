#!/usr/bin/env node
/**
 * QA 시뮬레이션 실행 — 영향 화면을 실제 브라우저(Playwright)로 열어 검사하고, 기준 브랜치 화면과 비교한다.
 * 계획서: plans/feature/20261002-QA-시뮬레이션-영향-화면.md
 *
 *   node scripts/qa/run.mjs --cwd <워크트리> [--app refund-web] [--plan <계획서>] [옵션]
 *
 *   --base <ref>        비교 기준 ref (기본 origin/<prBase>). 그 merge-base 를 기준 화면으로 띄운다
 *   --no-base           기준 화면 비교를 건너뛴다(스모크만)
 *   --files a,b         변경 파일을 직접 준다(impact.mjs 와 같음)
 *   --routes /a,/b      영향 분석 없이 이 화면들만 연다
 *   --head-url <url>    이미 떠 있는 작업 서버를 쓴다(직접 띄우지 않음)
 *   --base-url <url>    이미 떠 있는 기준 서버를 쓴다
 *   --profile <이름>     세션 프로필(routes/<앱>.json profiles — 예: logout · login · verified). 기본은 세션이 저장된 첫 프로필
 *   --keep-servers      끝나도 dev 서버를 끄지 않는다(다음 실행·login.mjs 에서 재사용)
 *   --suite             전체 검수(D11·D12) — 영향 분석 대신 화면 전부 + 흐름 씬(scenarios/<앱>/*.json), 기준 서버 대신 승인한 기준 사진(.qa-baselines/)과 비교.
 *                       --cwd 를 안 주면 최신 origin/<prBase> 의 qa-base 워크트리에서 돈다. 변화는 approve.mjs 로 기준 승인
 *   --headed            브라우저 창을 띄워 여는 모습을 보여 준다(동시 1개 · 창 하나에서 화면 이동 · 진행 표시 · 천천히 스크롤)
 *   --slow <ms>         --headed 의 속도(기본 700 — 클수록 느리다, 0 이면 멈춤 없이)
 *   --watch             창은 띄우되 빠르게(= --headed --slow 0) — 전체 검수를 지켜볼 때
 *   --target server --server <주소>  배포된 서버(dev·stg·dev-1~3·PR 미리보기)로 — 운영 주소는 거부. --server 만 줘도 된다
 *   --flow              QA 세션 흐름(D18~D20) — 비로그인 검수 → 로그인 상태 전부 차례로(세션 없으면 그 차례에 로그인 창) → 실패 리포트 모달. --live 와 함께
 *   --profiles a,b      세션 상태 여럿을 동시에(dev 서버 하나 공유)
 *   --tc-picks <파일>    변경분 TC(/qa-tc <앱> <브랜치> 가 만든 .qa-runs/tc-picks/<앱>@<브랜치>.json) — 영향 QA 에서 기본으로 그 브랜치 파일을 찾는다.
 *                       그 TC 에 걸린 흐름 씬을 화면 검사 뒤에 돌리고, 씬이 없는 TC 는 "사람이 확인" 으로 남긴다
 *   --live              창 없이 돌고, 현황판 /qa-live?id=<런> 한 페이지에 화면(데스크톱·모바일·씬)·API 호출·Mixpanel 이벤트를 실시간으로 — 현황판이 떠 있으면 그 페이지를 연다
 *
 * 무거운 명령이라 scripts/heavy.sh 잠금을 잡고 돈다 — 다른 세션의 install·build·QA 가 돌면 끝날 때까지 기다린다(그동안 run.json 은 아직 없다).
 * 산출물: .qa-runs/<런 id>/run.json · shots/*.png · server-*.log (git 무시). 현황판 QA 탭이 run.json 을 읽는다.
 * 판정(D8): 통과 pass · 화면 변화 changed · 실패 fail(기준에 없던 에러) · 이동됨 redirected · 로그인 필요 login · 샘플 필요 sample
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, realpathSync, openSync, appendFileSync, readdirSync, copyFileSync } from 'node:fs'
import { join, dirname, relative, resolve } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { buildReport, buildIndex } from './report.mjs'
import { runScenario, placeWindow, guardMutations, describe as describeStep } from './scenario.mjs'
import { baselineDir, readBaselineProblems } from './baseline.mjs'
import { captureTracking, blockThirdParty, eventsSince, HIDE_EVENT_PANEL } from './tracking.mjs'
import { createLiveLog, startScreencast } from './live.mjs'
import { normalizeTarget, sessionFileOf, targetKey, checkServerUrl } from './targets.mjs'

const QA_DIR = dirname(fileURLToPath(import.meta.url))
const HERMES = join(QA_DIR, '..', '..')
const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] ?? '' : ''
}
const flag = (name) => argv.includes(`--${name}`)

// 무거운 명령 규칙(AGENTS.md 5절) — pnpm install·gen:relay·next dev 두 개를 돌리므로 런 전체를 scripts/heavy.sh 잠금 하나로 감싼다.
// 잠금이 없으면 heavy.sh 를 거쳐 자기 자신을 다시 띄운다(다른 세션의 install·build·QA 가 끝날 때까지·부하가 내려갈 때까지 기다림)
if (!process.env.HERMES_HEAVY_HELD) {
  const { spawnSync } = await import('node:child_process')
  const heavy = join(HERMES, 'scripts', 'heavy.sh')
  const relaunched = spawnSync(heavy, [process.execPath, fileURLToPath(import.meta.url), ...argv], { stdio: 'inherit' })
  process.exit(relaunched.status ?? 1)
}

const appName = option('app') || 'refund-web'
const suite = flag('suite')
// --target local|server (D21) — server 면 dev 서버를 띄우지 않고 배포된 서버를 연다. 주소는 --server <주소>(없으면 routes 의 devUrl)
const target = option('server') ? 'server' : normalizeTarget(option('target'))
const serverUrl = (() => {
  if (target !== 'server') return null
  const value = option('server') || JSON.parse(readFileSync(join(QA_DIR, 'routes', `${appName}.json`), 'utf8')).devUrl
  if (!value) {
    console.error(`⚠️  서버 주소가 없다 — --server <주소> 를 주거나 routes/${appName}.json 에 devUrl 을 둔다`)
    process.exit(2)
  }
  const checked = checkServerUrl(value)
  if (checked.error) {
    console.error(`⛔ ${checked.error}`)
    process.exit(2)
  }
  return checked.url
})()
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

// 전체 검수는 지금 개발 브랜치(origin/<prBase>) 그대로를 본다 — qa-base 워크트리를 최신으로 맞춰 쓴다
function prepareSuiteTree() {
  const mainCheckout = realpathSync(join(HERMES, 'repos', 'bznav-web'))
  const config = JSON.parse(readFileSync(join(HERMES, 'hermes.config.json'), 'utf8'))
  const prBase = config.repos.find((repo) => repo.name === 'bznav-web')?.apps?.[appName]?.prBase ?? 'dev'
  try {
    git(['fetch', '--quiet', 'origin', prBase], mainCheckout)
  } catch {
    console.log(`⚠️  origin/${prBase} fetch 실패 — 로컬에 있는 ref 로 진행`)
  }
  const target = git(['rev-parse', `origin/${prBase}`], mainCheckout)
  const basePath = join(HERMES, '.worktrees', 'bznav-web', 'qa-base')
  if (!existsSync(basePath)) {
    git(['worktree', 'add', '--detach', basePath, target], mainCheckout)
    execFileSync(join(HERMES, 'scripts', 'wt-copy-local.sh'), [mainCheckout, basePath], { stdio: 'ignore' })
  } else if (git(['rev-parse', 'HEAD'], basePath) !== target) {
    git(['checkout', '--detach', '--force', target], basePath)
  }
  return basePath
}

// --profiles logout,login,verified — 세션 상태 여럿을 동시에. dev 서버는 하나(첫 상태의 런이 띄우고 --keep-servers),
// 나머지 상태는 그 서버(--head-url)를 같이 쓴다. 이 프로세스가 heavy.sh 잠금을 쥐고 있으니 자식 런은 잠금 없이(HERMES_HEAVY_HELD) 돈다.
// 런은 상태마다 따로(.qa-runs/<id>) 생기고 run.group 으로 묶인다 — 현황판 /qa-live?group=<묶음 id> 가 한 화면에 보여 준다
// --flow — QA 세션 흐름(D18~D20): ① 비로그인(logout) 검수 → ② 로그인 상태들을 routes profiles 순서대로 전부(예: login → verified, 2026-10-07 사용자 결정).
// 단계마다 세션이 살아 있으면 그대로(D18), 없거나 만료면 라이브 화면에 "로그인해 주세요" 를 띄우고 보이는 로그인 창을 연다(D19) → 사용자가 로그인하면
// 저장 → ③ 그 세션으로 검수(로그인을 안 하면 그 단계만 건너뜀) → ④ 끝나면 라이브 화면이 실패 리포트 모달을 띄운다(D20). 진행 상태는 .qa-runs/<묶음>/group.json
if (flag('flow')) {
  const flowRoutes = JSON.parse(readFileSync(join(QA_DIR, 'routes', `${appName}.json`), 'utf8'))
  const flowProfiles = Object.entries(flowRoutes.profiles ?? {}).filter(([key]) => !key.startsWith('$'))
  // 로그인 상태 단계 — 세션이 있는 프로필 전부(routes 순서). flowTargets 로 고를 수 있다
  const flowTargets = flowRoutes.flowTargets ?? flowProfiles.filter(([, settings]) => settings.session).map(([name]) => name)
  const tree = option('cwd') || (suite ? prepareSuiteTree() : '')
  const stamp = new Date()
  const two = (value) => String(value).padStart(2, '0')
  const groupId = `${stamp.getFullYear()}${two(stamp.getMonth() + 1)}${two(stamp.getDate())}-${two(stamp.getHours())}${two(stamp.getMinutes())}${two(stamp.getSeconds())}-${appName}-group`
  const groupDir = join(HERMES, '.qa-runs', groupId)
  mkdirSync(groupDir, { recursive: true })
  let pane = ''
  try {
    // herdr 는 JSON 을 준다 — [담당 에이전트에게 조사 맡기기] 가 이 pane(이 런을 띄운 헤르메스)으로 보낸다
    pane = JSON.parse(execFileSync('herdr', ['pane', 'current'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })).result?.pane?.pane_id ?? ''
  } catch {
    pane = ''
  }
  const group = {
    id: groupId, app: appName, mode: 'flow', pane, startedAt: stamp.toISOString(), finishedAt: null,
    target,
    stages: [{ profile: 'logout', status: 'queued' }, ...flowTargets.map((profile) => ({ profile, status: 'queued' }))],
    gate: null
  }
  const saveGroup = () => writeFileSync(join(groupDir, 'group.json'), `${JSON.stringify(group, null, 2)}\n`)
  saveGroup()
  const skip = new Set()
  argv.forEach((value, index) => {
    if (value === '--cwd') skip.add(index).add(index + 1)
    if (value === '--flow') skip.add(index)
  })
  const baseArgs = argv.filter((_, index) => !skip.has(index))
  const devUrl = target === 'server' ? serverUrl : 'http://localhost:3291'
  const launchStage = (stage, extra) => {
    stage.status = 'running'
    saveGroup()
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...baseArgs, '--profile', stage.profile, '--cwd', tree, '--group', groupId, '--stage-scenarios', ...extra], {
      env: { ...process.env, HERMES_HEAVY_HELD: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    for (const stream of [child.stdout, child.stderr]) {
      let rest = ''
      stream.on('data', (chunk) => {
        const lines = (rest + chunk).split('\n')
        rest = lines.pop()
        for (const line of lines) console.log(`[${stage.profile}] ${line}`)
      })
    }
    return new Promise((resolve) => child.on('exit', (code) => {
      stage.status = code === 0 || code === 1 ? 'done' : 'error'
      saveGroup()
      resolve(code ?? 1)
    }))
  }
  // 저장한 세션이 살아 있나(D18) — 파일이 있고 로그인 토큰(B_AT*) 이 만료 전
  const sessionAlive = (profileName) => {
    const settings = flowRoutes.profiles?.[profileName]
    if (!settings?.session) return true
    const file = sessionFileOf(HERMES, appName, settings.session, target, serverUrl)
    if (!existsSync(file)) return false
    const token = (JSON.parse(readFileSync(file, 'utf8')).cookies ?? []).find((cookie) => cookie.name.startsWith('B_AT') && cookie.expires > 0)
    return !token || token.expires * 1000 > Date.now() + 10 * 60 * 1000
  }
  console.log(`🧭 QA 세션 흐름 — ${target === 'server' ? `서버 ${devUrl}` : '로컬 서버'} · 비로그인 → ${flowTargets.join(' → ') || '(로그인 상태 없음)'} · 묶음 ${groupId}`)
  const codes = []
  // 로컬이면 첫 단계가 dev 서버를 띄우고 남긴다(--keep-servers), dev 서버면 그 주소를 바로 쓴다
  const logoutDone = launchStage(group.stages[0], target === 'server' ? ['--head-url', devUrl] : ['--keep-servers'])
  let logoutEnded = false
  logoutDone.then(() => { logoutEnded = true })
  // 라이브 화면은 바로 연다 — 로컬 dev 서버가 뜨는 몇 분 동안도 준비 단계가 보이게
  if (flag('live')) {
    const board = `http://localhost:${process.env.HERMES_BOARD_PORT || 4700}`
    const up = await fetch(`${board}/api/qa/runs`).then((response) => response.ok).catch(() => false)
    if (up) spawn('open', [`${board}/qa-live?group=${groupId}`], { stdio: 'ignore', detached: true }).unref()
    console.log(`📺 실시간 화면 — ${board}/qa-live?group=${groupId}`)
  }
  const deadline = Date.now() + 10 * 60 * 1000
  let ready = false
  while (!ready && !logoutEnded && Date.now() < deadline) {
    ready = await fetch(devUrl, { redirect: 'manual' }).then((response) => response.status < 500).catch(() => false)
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  // ② 로그인 — 세션이 없거나 만료면 로그인 창을 연다(D19). 사용자가 마치면 저장. 첫 로그인 단계는 비로그인 검수가 도는 동안 미리 연다
  const loginMessage = (profileName) => {
    const note = flowRoutes.profiles[profileName]?.note ?? ''
    const how = target === 'server' ? '로그인(간편인증 가능)' : '이메일 로그인'
    return `${profileName} 상태로 검수하려면 로그인해 주세요 — 열린 창에서 ${how}${profileName === 'verified' ? ' + 휴대폰 본인인증' : ''}을 마치면 이어서 진행해요(10분)${note ? ` · ${note}` : ''}`
  }
  const requestStageLogin = (stage) => {
    const session = flowRoutes.profiles[stage.profile].session
    group.gate = { profile: stage.profile, status: 'waiting', since: new Date().toISOString(), message: loginMessage(stage.profile) }
    stage.status = 'waiting-login'
    saveGroup()
    console.log(`🔑 ${group.gate.message}`)
    return new Promise((resolve) => {
      const login = spawn(process.execPath, [join(QA_DIR, 'login.mjs'), '--app', appName, '--url', devUrl, '--target', target, '--profile', session], { stdio: 'inherit' })
      login.on('exit', (code) => {
        group.gate.status = code === 0 ? 'done' : 'failed'
        saveGroup()
        resolve(code ?? 1)
      })
    })
  }
  const loginStages = group.stages.slice(1)
  const firstLogin = ready && loginStages[0] && !sessionAlive(loginStages[0].profile) ? requestStageLogin(loginStages[0]) : Promise.resolve(0)
  codes.push(await logoutDone)
  // ③ 로그인 상태 검수 — 단계마다 차례대로. 로그인을 못 했으면 그 단계만 건너뛴다
  for (const [index, stage] of loginStages.entries()) {
    const loginCode = index === 0 ? await firstLogin : ready && !sessionAlive(stage.profile) ? await requestStageLogin(stage) : 0
    if (!ready || loginCode !== 0 || !sessionAlive(stage.profile)) {
      stage.status = 'skipped'
      stage.reason = !ready ? 'dev 서버가 뜨지 않았다' : '로그인을 마치지 않았다'
      saveGroup()
      console.log(`⏭  ${stage.profile} 검수 건너뜀 — ${stage.reason}`)
      continue
    }
    codes.push(await launchStage(stage, ['--head-url', devUrl]))
  }
  // 로컬이면 첫 단계가 남긴 dev 서버(3291)를 끈다
  try {
    if (target === 'local') {
      const pid = execFileSync('lsof', ['-nP', '-t', '-iTCP:3291', '-sTCP:LISTEN'], { encoding: 'utf8' }).trim().split('\n')[0]
      const groupPid = execFileSync('ps', ['-o', 'pgid=', '-p', pid], { encoding: 'utf8' }).trim()
      if (groupPid) process.kill(-Number(groupPid), 'SIGTERM')
    }
  } catch {
    // 이미 꺼졌다
  }
  group.finishedAt = new Date().toISOString()
  saveGroup()
  process.exit(Math.max(0, ...codes))
}

if (option('profiles')) {
  const names = option('profiles').split(',').map((name) => name.trim()).filter(Boolean)
  const tree = option('cwd') || (suite ? prepareSuiteTree() : '')
  const stamp = new Date()
  const two = (value) => String(value).padStart(2, '0')
  const groupId = `${stamp.getFullYear()}${two(stamp.getMonth() + 1)}${two(stamp.getDate())}-${two(stamp.getHours())}${two(stamp.getMinutes())}${two(stamp.getSeconds())}-${appName}-group`
  // 자식에게 넘길 인자 — --profiles 와 그 값은 빼고 상태·묶음·작업 트리를 붙인다
  const skip = new Set()
  argv.forEach((value, index) => {
    if (value === '--profiles' || value === '--cwd') skip.add(index).add(index + 1)
  })
  const baseArgs = argv.filter((_, index) => !skip.has(index))
  const devUrl = target === 'server' ? serverUrl : `http://localhost:3291`
  const children = []
  const launch = (name, extra) => {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...baseArgs, '--profile', name, '--cwd', tree, '--group', groupId, ...extra], {
      env: { ...process.env, HERMES_HEAVY_HELD: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    // 상태마다 앞에 [이름] 을 붙여 섞여도 구분되게
    for (const stream of [child.stdout, child.stderr]) {
      let rest = ''
      stream.on('data', (chunk) => {
        const lines = (rest + chunk).split('\n')
        rest = lines.pop()
        for (const line of lines) console.log(`[${name}] ${line}`)
      })
    }
    const done = new Promise((resolve) => child.on('exit', (code) => resolve(code ?? 1)))
    children.push(done)
    return done
  }
  console.log(`👥 세션 상태 ${names.length}개 동시 — ${names.join(', ')} · 묶음 ${groupId}`)
  const first = launch(names[0], target === 'server' ? ['--head-url', devUrl] : ['--keep-servers'])
  // 첫 런이 dev 서버를 띄울 때까지(설치·relay 포함) 기다린 뒤 나머지를 그 서버로
  let firstEnded = false
  first.then(() => { firstEnded = true })
  const deadline = Date.now() + 10 * 60 * 1000
  let ready = false
  while (!ready && !firstEnded && Date.now() < deadline) {
    ready = await fetch(devUrl, { redirect: 'manual' }).then((response) => response.status < 500).catch(() => false)
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  if (ready) {
    if (flag('live')) {
      const board = `http://localhost:${process.env.HERMES_BOARD_PORT || 4700}`
      const up = await fetch(`${board}/api/qa/runs`).then((response) => response.ok).catch(() => false)
      if (up) spawn('open', [`${board}/qa-live?group=${groupId}`], { stdio: 'ignore', detached: true }).unref()
      console.log(`📺 실시간 화면 — ${board}/qa-live?group=${groupId}`)
    }
    for (const name of names.slice(1)) {
      // 같은 초에 시작하면 런 폴더 이름이 겹칠 수 있어 1초씩 띄운다
      await new Promise((resolve) => setTimeout(resolve, 1100))
      launch(name, ['--head-url', devUrl])
    }
  } else {
    console.log('⚠️  첫 런의 dev 서버가 뜨지 않아 나머지 상태는 돌리지 않았다')
  }
  const codes = await Promise.all(children)
  // 첫 런이 남겨 둔(--keep-servers) dev 서버를 끈다 — 이 런이 띄운 3291 만
  try {
    const pid = execFileSync('lsof', ['-nP', '-t', '-iTCP:3291', '-sTCP:LISTEN'], { encoding: 'utf8' }).trim().split('\n')[0]
    const groupPid = execFileSync('ps', ['-o', 'pgid=', '-p', pid], { encoding: 'utf8' }).trim()
    if (groupPid) process.kill(-Number(groupPid), 'SIGTERM')
  } catch {
    // 이미 꺼졌다
  }
  process.exit(Math.max(...codes))
}

const cwdOption = option('cwd') || (suite ? prepareSuiteTree() : '')
if (!cwdOption || !existsSync(cwdOption)) {
  console.error('사용: node scripts/qa/run.mjs --cwd <워크트리> [--app refund-web] [--plan <계획서>] [--no-base] [--keep-servers]  ·  전체 검수: --suite [--profile <이름>]')
  process.exit(2)
}
const routesConfig = JSON.parse(readFileSync(join(QA_DIR, 'routes', `${appName}.json`), 'utf8'))
const repoRoot = realpathSync(git(['rev-parse', '--show-toplevel'], cwdOption))
const appRel = join('apps', appName)
const planPath = option('plan')

// 세션 프로필 — --profile 이 없으면 로그인 세션이 있는 첫 프로필, 없으면 logout
const profiles = Object.fromEntries(Object.entries(routesConfig.profiles ?? { logout: { session: null } }).filter(([name]) => !name.startsWith('$')))
const savedProfile = Object.entries(profiles).find(([, settings]) => settings.session && existsSync(sessionFileOf(HERMES, appName, settings.session, target, serverUrl)))
const profileName = option('profile') || savedProfile?.[0] || 'logout'
const profile = profiles[profileName]
if (!profile) {
  console.error(`⚠️  프로필 ${profileName} 이 routes/${appName}.json 의 profiles 에 없다 — ${Object.keys(profiles).join(', ')}`)
  process.exit(2)
}

// ── 런 기록 ──────────────────────────────────────────────
const pad = (value) => String(value).padStart(2, '0')
const now = new Date()
const baseRunId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${appName}`
// 같은 초에 둘이 시작하면 폴더가 겹친다 — 뒤에 번호를 붙인다
let runId = baseRunId
for (let suffix = 2; existsSync(join(HERMES, '.qa-runs', runId)); suffix += 1) runId = `${baseRunId}-${suffix}`
const runDir = join(HERMES, '.qa-runs', runId)
mkdirSync(join(runDir, 'shots'), { recursive: true })
// 실시간 호출 기록(live.jsonl) — 현황판 /qa-live 창이 따라 읽는다
const live = createLiveLog(runDir)
const run = {
  id: runId,
  app: appName,
  kind: suite ? 'suite' : 'impact',
  plan: planPath ? relative(HERMES, join(process.cwd(), planPath)) : null,
  cwd: repoRoot,
  branch: git(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot).replace(/^HEAD$/, '(detached)'),
  head: git(['rev-parse', '--short', 'HEAD'], repoRoot),
  base: null,
  status: 'preparing', // preparing → running → done | error
  phase: suite ? '전체 검수 준비' : '영향 화면 찾는 중',
  startedAt: new Date().toISOString(),
  finishedAt: null,
  changed: [],
  global: [],
  totalScreens: 0,
  screens: [],
  scenarios: [],
  summary: {},
  scenarioSummary: {},
  log: [],
  // --profiles·--flow 로 함께 돈 런 묶음
  group: option('group') || null,
  // D21 — local(내 컴퓨터 next dev) | server(배포된 서버 — serverUrl)
  target,
  serverUrl
}
// 변경분 TC — 이 브랜치에서 확인할 TC 목록(/qa-tc 변경분 모드가 쓴다). 영향 QA 에서만, 파일이 없으면 예전처럼 화면만
const tcPicksFile = option('tc-picks') ? resolve(option('tc-picks')) : suite ? null : join(HERMES, '.qa-runs', 'tc-picks', `${appName}@${run.branch.replace(/[^\w.-]+/g, '-')}.json`)
const tcPicks = tcPicksFile && existsSync(tcPicksFile) ? JSON.parse(readFileSync(tcPicksFile, 'utf8')) : null
const pickIds = tcPicks ? new Set((tcPicks.tcs ?? []).map((tc) => tc.id)) : null
if (tcPicks) {
  run.tcPicks = {
    file: relative(HERMES, tcPicksFile),
    head: tcPicks.head ?? null,
    createdAt: tcPicks.createdAt ?? null,
    tcs: (tcPicks.tcs ?? []).map((tc) => ({ id: tc.id, title: tc.title ?? '', why: tc.why ?? '', session: tc.session ?? '', status: 'manual', scenarios: [] }))
  }
}
const saveRun = () => {
  const temporary = join(runDir, 'run.json.tmp')
  writeFileSync(temporary, `${JSON.stringify(run, null, 2)}\n`)
  renameSync(temporary, join(runDir, 'run.json'))
}
const say = (message) => {
  const line = `${new Date().toTimeString().slice(0, 8)} ${message}`
  run.log.push(line)
  if (run.log.length > 200) run.log.shift()
  console.log(line)
  saveRun()
}
const setPhase = (phase) => {
  run.phase = phase
  say(phase)
}

// 보이는 창 배치 — 뷰포트별 창의 왼쪽 위치(흐름 씬도 같은 자리에 띄운다)
const windowLefts = {}

// --live — 현황판이 떠 있으면 실시간 페이지를 기본 브라우저로 연다(안 떠 있으면 주소만 알린다)
async function openLivePage() {
  // 묶음(--profiles)이면 부모가 묶음 화면을 연다
  if (option('group')) return
  const board = `http://localhost:${process.env.HERMES_BOARD_PORT || 4700}`
  const liveUrl = `${board}/qa-live?id=${runId}`
  const up = await fetch(`${board}/api/qa/runs`).then((response) => response.ok).catch(() => false)
  if (up) spawn('open', [liveUrl], { stdio: 'ignore', detached: true }).unref()
  say(up ? `📺 실시간 화면 — ${liveUrl}` : `📺 현황판이 꺼져 있다 — scripts/board.sh 로 띄운 뒤 ${liveUrl}`)
}

// 저장한 세션의 로그인 토큰(B_AT*) 만료 시각 — 지났으면 그 시각(ms), 아니면 null. 쿠키 값은 읽지 않는다
function expiredSessionAt(file) {
  const { cookies = [] } = JSON.parse(readFileSync(file, 'utf8'))
  const token = cookies.find((cookie) => cookie.name.startsWith('B_AT') && cookie.expires > 0)
  return token && token.expires * 1000 < Date.now() ? token.expires * 1000 : null
}
const expiredMessage = (profileName, session, expiredAt) =>
  `세션 ${profileName} 만료(${new Date(expiredAt).toLocaleString('ko-KR')}) — node scripts/qa/login.mjs --profile ${session} 로 다시 로그인한다`

// ── 1) 영향 화면 ─────────────────────────────────────────
function loadImpact() {
  const impactArgs = [join(QA_DIR, 'impact.mjs'), '--cwd', repoRoot, '--app', appName, '--json']
  const routesOption = option('routes')
  if (option('files')) impactArgs.push('--files', option('files'))
  if (option('base')) impactArgs.push('--base', option('base'))
  // --routes 도 화면 전부를 받아 그 라우트만 고른다 — Pages·App Router 어느 쪽이든 화면 파일·로그인 표시가 impact.mjs 와 같다
  if (suite || routesOption) impactArgs.push('--all')
  // 화면마다 코드에 있는 트래킹 이벤트 목록 — 실제로 나간 이벤트와 맞춰 본다
  impactArgs.push('--events')
  const impact = JSON.parse(execFileSync(process.execPath, impactArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
  if (!routesOption) return impact
  const wanted = routesOption.split(',').map((route) => route.trim()).filter(Boolean)
  const known = new Map(impact.screens.map((screen) => [screen.route, screen]))
  return {
    ...impact,
    changed: [],
    global: [],
    totalScreens: 0,
    screens: wanted.map((route) => ({ ...(known.get(route) ?? { route, file: null, auth: false, via: [] }), distance: 0, changed: '(--routes)' }))
  }
}

// 라우트 → Pages Router 화면 파일 (/help/faq → apps/<앱>/pages/help/faq/index.tsx 또는 faq.tsx) · App Router 앱이면 없다(null)
function pageFileOf(route) {
  const base = join(appRel, 'pages', route === '/' ? 'index' : route)
  return [`${base}.tsx`, join(base, 'index.tsx'), `${base}.ts`, join(base, 'index.ts')].find((candidate) => existsSync(join(repoRoot, candidate))) ?? null
}

// 라우트(파일 기준) → 실제로 열 URL 들. 동적 라우트는 설정의 samples, 단계형은 entry(D6·D8)
function targetsOf(screen) {
  const settings = routesConfig.routes?.[screen.route] ?? {}
  // 열기만 해도 부작용(알림톡·실조회 등)이 있는 화면 — 열지 않고 이유만 남긴다
  if (settings.skip) return [{ url: null, skip: true, note: settings.note ?? '설정에서 건너뜀' }]
  if (settings.entry) return [{ url: settings.entry, entry: true, note: settings.note }]
  if (settings.samples?.length) return settings.samples.map((url) => ({ url, note: settings.note }))
  if (/\[/.test(screen.route)) return [{ url: null, note: settings.note ?? '동적 라우트 — routes 설정에 샘플 URL 을 적어 주세요' }]
  return [{ url: screen.route, note: settings.note }]
}

// routes.<화면>.samplesFrom: "sitemap" — BE(CMS)가 주소를 주는 동적 화면(랜딩·이벤트 등). 서버가 뜬 뒤 그 앱의 /sitemap.xml 에서
// 경로 모양이 맞는 주소를 샘플로 받아 '샘플 필요' 항목을 실제 화면들로 바꾼다. samplesLimit(기본 30)개까지
async function expandSitemapSamples(origin) {
  const waiting = run.screens.filter((screen) => screen.status === 'sample' && routesConfig.routes?.[screen.route]?.samplesFrom === 'sitemap')
  if (!waiting.length) return
  let locations = []
  try {
    const xml = await (await fetch(`${origin}/sitemap.xml`)).text()
    locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1].trim(), origin).pathname)
  } catch (error) {
    say(`⚠️  sitemap.xml 을 못 읽었다 — ${error.message}`)
    return
  }
  // 이미 따로 검사하는 고정 화면(/home/reviews 등)은 빼고, 동적 경로 모양에 맞는 것만
  const fixedRoutes = new Set(run.screens.filter((screen) => !/\[/.test(screen.route)).map((screen) => screen.route))
  for (const screen of waiting) {
    const settings = routesConfig.routes[screen.route]
    const prefix = screen.route.slice(0, screen.route.indexOf('['))
    const matched = [...new Set(locations.filter((path) => path.startsWith(prefix) && path.length > prefix.length && !fixedRoutes.has(path) && !pageFileOf(path)))]
    const limit = settings.samplesLimit ?? 30
    if (!matched.length) {
      screen.note = `sitemap.xml 에 ${prefix}… 주소가 없다 — 지금 살아 있는 콘텐츠가 없을 수 있다`
      continue
    }
    const entries = matched.slice(0, limit).map((url) => ({ ...screen, key: `${screen.route} ${url}`, url, status: 'queued', note: `sitemap.xml 에서 받은 주소${matched.length > limit ? ` (${matched.length}개 중 ${limit}개)` : ''}`, viewports: [], problems: [] }))
    run.screens.splice(run.screens.indexOf(screen), 1, ...entries)
    say(`🗺  ${screen.route} — sitemap.xml 에서 ${entries.length}개${matched.length > limit ? ` (전체 ${matched.length}개)` : ''}`)
  }
  saveRun()
}

// ── 2) dev 서버 ──────────────────────────────────────────
const servers = []
async function waitForServer(url, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual' })
      if (response.status < 500) return
    } catch {
      // 아직 안 떴다
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error(`${label} 서버가 ${Math.round(timeoutMs / 1000)}초 안에 뜨지 않았다 — ${relative(HERMES, runDir)}/server-${label}.log`)
}

function runStep(command, args, cwd, logFile) {
  appendFileSync(logFile, `\n$ ${command} ${args.join(' ')}\n`)
  const output = openSync(logFile, 'a')
  execFileSync(command, args, { cwd, stdio: ['ignore', output, output] })
}

// 새 워크트리에는 node_modules 가 없다 — 영향 분석(tsconfig extends)과 dev 서버 둘 다 필요하다
function ensureDependencies(root, label, logFile = join(runDir, `server-${label}.log`)) {
  if (existsSync(join(root, 'node_modules'))) return
  setPhase(`${label}: 의존성 설치 (pnpm install)`)
  runStep('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], root, logFile)
}

async function startDevServer(root, port, label) {
  const appDir = join(root, appRel)
  const logFile = join(runDir, `server-${label}.log`)
  writeFileSync(logFile, '')
  ensureDependencies(root, label, logFile)
  // 앱마다 스크립트 이름이 다르다 — env 생성(gen:env)·Relay(gen:relay · care 는 relay) 는 있는 것만
  const scripts = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8')).scripts ?? {}
  // .env 는 워크트리 생성 때 복사된다(wt-copy-local.sh). 없을 때만 SSM 에서 만든다 — 내용은 출력하지 않는다
  if (!existsSync(join(appDir, '.env')) && scripts['gen:env']) {
    setPhase(`${label}: env 생성 (gen:env)`)
    runStep('pnpm', ['gen:env'], appDir, logFile)
  }
  const relayScript = ['gen:relay', 'relay'].find((name) => scripts[name])
  if (relayScript) {
    setPhase(`${label}: Relay 생성 (${relayScript})`)
    runStep('pnpm', [relayScript], appDir, logFile)
  }
  setPhase(`${label}: dev 서버 기동 :${port}`)
  const output = openSync(logFile, 'a')
  const child = spawn('pnpm', ['exec', 'next', 'dev', '-p', String(port), '--webpack'], { cwd: appDir, stdio: ['ignore', output, output], detached: true })
  servers.push({ child, label })
  const url = `http://localhost:${port}`
  await waitForServer(url, 240000, label)
  say(`${label}: ${url} 준비됨`)
  return url
}

// 기준 화면용 워크트리 — merge-base 에 detach 해서 재사용한다(.worktrees/<레포>/qa-base)
function prepareBaseWorktree(baseSha) {
  const repoName = 'bznav-web'
  const basePath = join(HERMES, '.worktrees', repoName, 'qa-base')
  if (!existsSync(basePath)) {
    git(['worktree', 'add', '--detach', basePath, baseSha], repoRoot)
    const mainCheckout = realpathSync(join(HERMES, 'repos', repoName))
    execFileSync(join(HERMES, 'scripts', 'wt-copy-local.sh'), [mainCheckout, basePath], { stdio: 'ignore' })
  } else if (git(['rev-parse', 'HEAD'], basePath) !== git(['rev-parse', baseSha], repoRoot)) {
    // 우리 전용 워크트리라 생성물 외 변경이 없다 — 기준 커밋으로 맞춘다
    git(['checkout', '--detach', '--force', baseSha], basePath)
  }
  return basePath
}

function stopServers() {
  if (flag('keep-servers')) return
  for (const { child } of servers) {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      // 이미 꺼졌다
    }
  }
}

// ── 3) 화면 하나 열기 ────────────────────────────────────
const ignoreConsole = (routesConfig.ignoreConsole ?? []).map((pattern) => new RegExp(pattern))
const isNoiseRequest = (url) => /\/_next\/webpack-hmr|__nextjs|\/favicon\.ico/.test(url)
const isOwnRequest = (url, origin) => url.startsWith(origin) || /\.bznav\.com\//.test(url)

// 보이는 창 모드(--headed) — 창 하나에서 화면을 차례로 옮겨 가며, 위에 진행 표시를 띄우고 천천히 훑는다
// --watch = 창은 띄우되 빠르게(멈춤·천천히 스크롤 없이) — 전체 검수를 지켜보기용
const watch = flag('watch')
// --live = 창 없이 돌면서 화면·API 호출·트래킹 이벤트를 현황판 한 페이지(/qa-live)에 실시간으로 — QA 자동화 도구 화면
const liveView = flag('live')
const headed = flag('headed') || watch
const slowMs = watch ? 0 : Number(option('slow') || 700)
const pause = (page, factor = 1) => (headed && slowMs > 0 ? page.waitForTimeout(slowMs * factor) : Promise.resolve())

async function showBanner(page, text, tone = 'run') {
  if (!headed) return
  await page
    .evaluate(
      ({ text, tone }) => {
        const colors = { run: '#1f6feb', ok: '#1a7f37', warn: '#bf8700', bad: '#cf222e' }
        let banner = document.getElementById('__hermes_qa_banner')
        if (!banner) {
          banner = document.createElement('div')
          banner.id = '__hermes_qa_banner'
          banner.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:2147483647;padding:10px 14px;border-radius:10px;color:#fff;font:600 14px/1.4 -apple-system,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);pointer-events:none;transition:background .3s'
          document.documentElement.appendChild(banner)
        }
        banner.style.background = colors[tone] ?? colors.run
        banner.textContent = text
      },
      { text, tone }
    )
    .catch(() => {})
}
const hideBanner = (page) => page.evaluate(() => document.getElementById('__hermes_qa_banner')?.remove()).catch(() => {})

// 브라우저 안에서 도는 화면 품질 검사(page.evaluate) — 바깥 변수를 쓰지 않는다
function scanVisualQuality() {
  const problems = []
  const warnings = []
  const width = document.documentElement.clientWidth
  const height = window.innerHeight
  const visible = (element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.05 && rect.width > 1 && rect.height > 1
  }
  const label = (element) => (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || element.tagName.toLowerCase()).replace(/\s+/g, ' ').trim().slice(0, 30)
  // QA 가 띄운 것(진행 띠·이벤트 패널)은 뺀다
  const ours = (element) => Boolean(element.closest('#__hermes_qa_banner, #__hermes_qa_events'))

  // ⓪ 스타일 미적용 — 스타일시트가 하나도 없거나, 본문이 브라우저 기본 글꼴(Times·serif)이면 CSS 가 안 먹은 화면이다
  const bodyFont = getComputedStyle(document.body).fontFamily
  if (!document.styleSheets.length) problems.push({ kind: 'css', text: 'CSS 미적용 — 스타일시트가 하나도 없다' })
  else if (/^\s*("?Times( New Roman)?"?|serif)\s*(,|$)/i.test(bodyFont)) problems.push({ kind: 'css', text: `CSS 미적용으로 보임 — 본문 글꼴이 브라우저 기본(${bodyFont.slice(0, 40)})` })

  // ① 깨진 글자·값 — 화면에 보이는 글자에 � · undefined · null · NaN · [object Object] · 그대로 찍힌 HTML 엔티티 · 템플릿 괄호
  const BROKEN = [
    [/\uFFFD/, '깨진 글자(�)'],
    [/\[object Object\]/, '[object Object]'],
    [/(^|[^\w가-힣])(undefined|NaN)([^\w가-힣]|$)/, 'undefined·NaN'],
    [/(^|\s)null(\s|$|원|개|명)/, 'null'],
    [/&(amp|nbsp|lt|gt|quot|#\d+);/, 'HTML 엔티티가 글자로'],
    [/\{\{[^}]*\}\}|\$\{[^}]*\}/, '템플릿 괄호가 글자로']
  ]
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seenBroken = new Set()
  while (walker.nextNode()) {
    const node = walker.currentNode
    const text = node.textContent ?? ''
    if (!text.trim() || !node.parentElement || ours(node.parentElement) || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'].includes(node.parentElement.tagName)) continue
    if (!visible(node.parentElement)) continue
    for (const [pattern, name] of BROKEN) {
      const match = text.match(pattern)
      if (match && !seenBroken.has(name + text.trim().slice(0, 40))) {
        seenBroken.add(name + text.trim().slice(0, 40))
        problems.push({ kind: 'text', text: `${name} — "${text.trim().slice(0, 60)}"` })
      }
    }
  }

  const buttons = [...document.querySelectorAll('button, a[href], [role="button"]')].filter((element) => !ours(element) && visible(element)).slice(0, 300)
  for (const element of buttons) {
    const rect = element.getBoundingClientRect()
    // ② 이름 없는 버튼 — 글자·aria-label·title·이미지 alt 가 모두 없다(스크린리더가 읽을 게 없다)
    const hasName = (element.innerText || '').trim() || element.getAttribute('aria-label') || element.getAttribute('title') || element.getAttribute('aria-labelledby') || element.querySelector('img[alt]:not([alt=""]), svg title')
    if (!hasName) warnings.push({ kind: 'a11y', text: `이름 없는 버튼 — ${element.tagName.toLowerCase()}${element.className && typeof element.className === 'string' ? `.${element.className.split(' ')[0]}` : ''} (${Math.round(rect.x)},${Math.round(rect.y)})` })
    // ③ 화면 밖 버튼 — 가로로 화면 밖(가로 슬라이드 속 항목은 부모가 넘침을 숨기면 뺀다)
    const inScroller = element.closest('[class*="swiper"], [class*="slick"], [class*="carousel"], [class*="scroll"]')
    if ((rect.right < 0 || rect.left > width) && !inScroller) warnings.push({ kind: 'offscreen', text: `화면 밖 버튼 — "${label(element)}" (x=${Math.round(rect.left)})` })
    // ④ 가려진 버튼 — 지금 보이는 영역 안인데 가운데를 다른 요소가 덮는다(고정 헤더·하단 바·대화상자는 빼고)
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    if (centerX > 0 && centerX < width && centerY > 0 && centerY < height) {
      const top = document.elementFromPoint(centerX, centerY)
      if (top && top !== element && !element.contains(top) && !top.contains(element) && !ours(top)) {
        let cover = top
        let pinned = false
        while (cover && cover !== document.body) {
          const position = getComputedStyle(cover).position
          if (position === 'fixed' || position === 'sticky' || cover.getAttribute('role') === 'dialog' || cover.getAttribute('aria-modal') === 'true') pinned = true
          cover = cover.parentElement
        }
        if (!pinned) warnings.push({ kind: 'covered', text: `가려진 버튼 — "${label(element)}" 위를 ${top.tagName.toLowerCase()} "${label(top)}" 가 덮음` })
      }
    }
  }

  // ⑥ 이미지 — 스크롤을 끝낸 뒤에도 안 뜬 것(지연 로딩 포함)은 문제, 찌그러짐·흐림(원본보다 크게 늘림)·alt 없음은 확인 필요
  let imageNotes = 0
  for (const image of document.images) {
    if (ours(image) || !image.getAttribute('src') && !image.currentSrc) continue
    const rect = image.getBoundingClientRect()
    const name = (image.getAttribute('alt') || image.currentSrc || image.src || '').split('?')[0].split('/').pop().slice(0, 50)
    if (!image.complete && visible(image)) {
      problems.push({ kind: 'image', text: `이미지가 끝까지 안 뜸 — ${name}` })
      continue
    }
    if (!image.naturalWidth || !visible(image) || imageNotes >= 10) continue
    const fit = getComputedStyle(image).objectFit
    const naturalRatio = image.naturalWidth / image.naturalHeight
    const shownRatio = rect.width / rect.height
    if (fit === 'fill' && Math.abs(shownRatio / naturalRatio - 1) > 0.15 && !image.currentSrc.endsWith('.svg')) {
      imageNotes += 1
      warnings.push({ kind: 'image-ratio', text: `찌그러진 이미지 — ${name} (원본 ${image.naturalWidth}×${image.naturalHeight} → ${Math.round(rect.width)}×${Math.round(rect.height)})` })
    }
    const scale = (rect.width * window.devicePixelRatio) / image.naturalWidth
    if (scale > 2 && rect.width > 80 && !image.currentSrc.endsWith('.svg')) {
      imageNotes += 1
      warnings.push({ kind: 'image-lowres', text: `흐린 이미지 — ${name} (원본 ${image.naturalWidth}px 을 ${Math.round(rect.width)}px 로 ${scale.toFixed(1)}배 늘림)` })
    }
    if (!image.hasAttribute('alt') && rect.width > 40) {
      imageNotes += 1
      warnings.push({ kind: 'a11y', text: `대체 텍스트(alt) 없는 이미지 — ${name}` })
    }
  }

  // ⑤ 잘린 글자 — 넘침을 숨긴 칸에서 글자가 칸보다 길다(말줄임(…)으로 의도한 것은 뺀다)
  let clipped = 0
  for (const element of document.body.querySelectorAll('p, span, div, button, a, h1, h2, h3, h4, li, label, strong')) {
    if (clipped >= 8 || ours(element) || !visible(element)) continue
    if (![...element.childNodes].some((child) => child.nodeType === 3 && child.textContent.trim())) continue
    const style = getComputedStyle(element)
    const hidden = ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY)
    if (!hidden || style.textOverflow === 'ellipsis' || Number(style.webkitLineClamp) > 0) continue
    if (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2) {
      clipped += 1
      warnings.push({ kind: 'clipped', text: `잘린 글자 — "${label(element)}" (칸 ${element.clientWidth}×${element.clientHeight} · 글자 ${element.scrollWidth}×${element.scrollHeight})` })
    }
  }
  // 같은 내용은 하나로
  const unique = (list) => [...new Map(list.map((item) => [item.text, item])).values()]
  return { problems: unique(problems).slice(0, 10), warnings: unique(warnings).slice(0, 20) }
}

// 아이콘 글자(사용자 정의 영역 U+E000–F8FF)가 실제로 아이콘 글꼴로 그려졌는지 — font-display: optional 이면 첫 방문에 대체 글꼴로
// 그려져 □ 가 된다(issues/20261001-bznav-web-font-display-optional-icon-glyph.md). 브라우저(CDP)에 실제 렌더 글꼴을 묻는다
const ICON_FONT = /BZNAV/i
async function iconFontProblems(page) {
  const found = []
  let session = null
  try {
    const count = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let index = 0
      while (walker.nextNode() && index < 30) {
        if (/[\uE000-\uF8FF]/.test(walker.currentNode.textContent)) walker.currentNode.parentElement.setAttribute('data-qa-icon', String(index++))
      }
      return index
    })
    if (!count) return found
    session = await page.context().newCDPSession(page)
    await session.send('DOM.enable')
    await session.send('CSS.enable')
    const { root } = await session.send('DOM.getDocument', { depth: 0 })
    const { nodeIds } = await session.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-qa-icon]' })
    for (const nodeId of nodeIds) {
      const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId })
      if (fonts.some((font) => ICON_FONT.test(font.familyName))) continue
      const label = await page.evaluate((index) => {
        const element = document.querySelector(`[data-qa-icon="${index}"]`)
        return (element?.closest('a,button') ?? element)?.textContent?.replace(/[\uE000-\uF8FF]/g, '').trim().slice(0, 40) ?? ''
      }, String(nodeIds.indexOf(nodeId)))
      found.push({ kind: 'font', text: `아이콘 글꼴 미적용(□) — "${label}" 의 아이콘이 ${fonts.map((font) => font.familyName).join(', ') || '알 수 없는 글꼴'} 로 그려짐` })
    }
  } catch {
    // 글꼴 확인은 보조 검사 — 못 해도 화면 검사는 계속한다
  } finally {
    await page.evaluate(() => document.querySelectorAll('[data-qa-icon]').forEach((element) => element.removeAttribute('data-qa-icon'))).catch(() => {})
    await session?.detach().catch(() => {})
  }
  return found
}

// 트래킹용 스크롤 — 빠르게(화면 높이의 70% 씩, 0.15초) 끝까지 내렸다가 맨 위로. IntersectionObserver 가 각 구역을 보게
async function trackingSweep(page) {
  const { scrollHeight, viewportHeight } = await page
    .evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, viewportHeight: window.innerHeight }))
    .catch(() => ({ scrollHeight: 0, viewportHeight: 1 }))
  if (scrollHeight <= viewportHeight) return
  const step = Math.max(200, Math.round(viewportHeight * 0.7))
  for (let top = step; top < scrollHeight + step && top < 40000; top += step) {
    await page.evaluate((target) => window.scrollTo(0, target), top).catch(() => {})
    await page.waitForTimeout(150)
  }
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
  await page.waitForTimeout(150)
}

// 화면을 위에서 아래로 천천히 내렸다가 다시 올린다 — 사람이 훑어보듯
async function sweepPage(page) {
  if (!headed || slowMs === 0) return
  const { scrollHeight, viewportHeight } = await page
    .evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, viewportHeight: window.innerHeight }))
    .catch(() => ({ scrollHeight: 0, viewportHeight: 1 }))
  const step = Math.max(200, Math.round(viewportHeight * 0.7))
  for (let top = step; top < scrollHeight; top += step) {
    await page.evaluate((target) => window.scrollTo({ top: target, behavior: 'smooth' }), top).catch(() => {})
    await pause(page, 0.8)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })).catch(() => {})
  await pause(page)
}

async function visit(context, origin, path, shotFile, label, settings = {}) {
  // 보이는 창이면 창 하나를 계속 쓴다(화면 이동이 그 창에서 보이게). 아니면 화면마다 새 페이지
  // 보이는 창·실시간 화면이면 컨텍스트마다 페이지 하나를 계속 쓴다(화면 이동이 한 곳에서 보이게)
  const reusePage = headed || liveView
  if (reusePage && !context.__qaPage) {
    context.__qaPage = await context.newPage()
    if (headed) await placeWindow(context.__qaPage)
    if (liveView) await startScreencast(context.__qaPage, runDir, context.__qaSlot)
  }
  const page = reusePage ? context.__qaPage : await context.newPage()
  live.write({ where: context.__qaSlot ?? label, kind: 'mark', name: `▶ ${path}`, page: path })
  const problems = []
  const onConsole = (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    // 리소스 로드 실패는 response·requestfailed 가 우리 요청만 골라 잡는다 — 외부 위젯(채널톡 등) 401 이 콘솔로 새지 않게
    // routes.<화면>.ignoreConsole — 그 화면에서만 환경 탓인 콘솔 에러(예: 공동인증서 프로그램이 없는 QA 브라우저)
    if (text.startsWith('Failed to load resource') || ignoreConsole.some((pattern) => pattern.test(text)) || (settings.ignoreConsole ?? []).some((pattern) => new RegExp(pattern).test(text))) return
    const location = message.location()
    // 위치가 라이브러리(next devtools·relay 등) 안이면 앱 소스가 아니라 쓸모없다 — 그때는 비운다
    const fromLibrary = !location?.url || /node_modules|\.pnpm|next\/dist/.test(location.url)
    problems.push({ kind: 'console', text: text.slice(0, 400), at: fromLibrary ? '' : sourceAt(`${location.url}:${location.lineNumber + 1}`) })
  }
  const onPageError = (error) => problems.push({ kind: 'pageerror', text: String(error.message).slice(0, 400), at: stackAt(error.stack) })
  const onResponse = (response) => {
    const url = response.url()
    if (response.status() >= 400 && isOwnRequest(url, origin) && !isNoiseRequest(url)) {
      problems.push({ kind: 'http', text: `${response.status()} ${url.replace(origin, '').slice(0, 200)}` })
    }
  }
  const onRequestFailed = (request) => {
    const failure = request.failure()?.errorText ?? ''
    if (failure.includes('ERR_ABORTED') || isNoiseRequest(request.url()) || !isOwnRequest(request.url(), origin)) return
    problems.push({ kind: 'network', text: `${failure} ${request.url().replace(origin, '').slice(0, 200)}` })
  }
  // 이미지는 어느 주소(CDN 등)에서 오든 본다 — <img> 와 CSS 배경 이미지 모두 resourceType image
  const brokenImageRequests = new Set()
  // 스타일시트(CSS)·글꼴도 같이 — 못 받으면 화면이 깨져 보인다
  const brokenStyleRequests = new Set()
  const onImageResponse = (response) => {
    const type = response.request().resourceType()
    if (response.status() < 400) return
    if (type === 'image') brokenImageRequests.add(`${response.status()} ${response.url().replace(origin, '').slice(0, 160)}`)
    if (type === 'stylesheet' || type === 'font') brokenStyleRequests.add(`${type === 'font' ? '글꼴' : 'CSS'} ${response.status()} ${response.url().replace(origin, '').slice(0, 160)}`)
  }
  const onImageFailed = (request) => {
    const failure = request.failure()?.errorText ?? ''
    if (failure.includes('ERR_ABORTED')) return
    if (request.resourceType() === 'image') brokenImageRequests.add(`${failure} ${request.url().replace(origin, '').slice(0, 160)}`)
    if (['stylesheet', 'font'].includes(request.resourceType())) brokenStyleRequests.add(`${request.resourceType() === 'font' ? '글꼴' : 'CSS'} ${failure} ${request.url().replace(origin, '').slice(0, 160)}`)
  }
  page.on('response', onImageResponse)
  page.on('requestfailed', onImageFailed)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('response', onResponse)
  page.on('requestfailed', onRequestFailed)

  const startedAt = Date.now()
  const eventStart = (page.__qaEvents ?? []).length
  let timedOut = false
  try {
    // 페이지를 계속 쓰면 앞 화면이 늦게 하는 이동(location.replace 등)이 이번 이동을 끊는다(ERR_ABORTED) — 빈 화면으로 한 번 끊고 간다
    if (reusePage) await page.goto('about:blank').catch(() => {})
    await page.goto(`${origin}${path}`, { waitUntil: 'load', timeout: routesConfig.timeoutMs }).catch(async (error) => {
      // 그래도 끊기면 한 번만 다시
      if (!String(error.message).includes('ERR_ABORTED')) throw error
      await page.waitForTimeout(1000)
      await page.goto(`${origin}${path}`, { waitUntil: 'load', timeout: routesConfig.timeoutMs })
    })
    // routes.<화면>.networkIdle: false — 요청이 계속 이어지는 화면(dev 의 /404 등)은 조용해지길 기다리지 않는다(15초 낭비)
    if (settings.networkIdle !== false) await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    // 클라이언트 가드(AuthGuard)의 replace 를 기다린다
    await page.waitForTimeout(1500)
  } catch (error) {
    timedOut = true
    problems.push({ kind: 'timeout', text: String(error.message).split('\n')[0].slice(0, 300) })
  }
  const landedPath = new URL(page.url()).pathname
  await showBanner(page, `QA ▶ ${label} · ${path}${landedPath !== path.split('?')[0] ? `  →  ${landedPath} 로 이동됨` : ''}`)
  await pause(page, 1.5)
  await sweepPage(page)
  // 스크롤 이벤트(ScrollEventWrapper — 구역이 50% 보일 때 한 번)가 나가게 한 화면씩 내려 본다. 끝나면 맨 위로
  await trackingSweep(page)
  const brokenImages = await page
    .evaluate(() => [...document.images].filter((image) => image.complete && image.naturalWidth === 0 && image.src).map((image) => image.src))
    .catch(() => [])
  for (const source of brokenImages) problems.push({ kind: 'image', text: `깨진 이미지 ${source.replace(origin, '').slice(0, 200)}` })
  for (const entry of brokenStyleRequests) problems.push({ kind: 'css', text: `스타일 요청 실패 ${entry}` })
  // 화면의 <img> 로 안 잡히는 것(CSS 배경·다른 주소) — 요청이 실패했거나 4xx·5xx
  const shownBroken = new Set(brokenImages.map((source) => source.replace(origin, '').slice(0, 160)))
  for (const entry of brokenImageRequests) {
    if (![...shownBroken].some((source) => entry.endsWith(source))) problems.push({ kind: 'image', text: `이미지 요청 실패 ${entry}` })
  }
  problems.push(...(await iconFontProblems(page)))
  // 가로 넘침 — 화면보다 넓은 요소가 있으면 옆으로 밀리는 스크롤이 생긴다(모바일에서 흔한 깨짐)
  const overflow = await page
    .evaluate(() => {
      const width = document.documentElement.clientWidth
      if (document.documentElement.scrollWidth <= width + 1) return null
      const wide = [...document.body.querySelectorAll('*')].find((element) => element.getBoundingClientRect().right > width + 1 && getComputedStyle(element).position !== 'fixed')
      return { scroll: document.documentElement.scrollWidth, width, what: wide ? `${wide.tagName.toLowerCase()}${wide.className && typeof wide.className === 'string' ? `.${wide.className.split(' ')[0]}` : ''} "${(wide.textContent ?? '').trim().slice(0, 30)}"` : '' }
    })
    .catch(() => null)
  if (overflow) problems.push({ kind: 'layout', text: `가로 넘침 — 화면 폭 ${overflow.width}px 인데 ${overflow.scroll}px 까지 밀린다${overflow.what ? ` · ${overflow.what}` : ''}` })
  // 눈으로 보이는 깨짐 — 확실한 것(깨진 글자·값)은 문제, 의도일 수도 있는 것(잘린 글자·가려진·화면 밖·이름 없는 버튼)은 확인 필요(warnings)
  const quality = await page.evaluate(scanVisualQuality).catch(() => ({ problems: [], warnings: [] }))
  problems.push(...quality.problems)
  const warnings = quality.warnings
  const finalUrl = new URL(page.url())
  // 진행 표시는 스크린샷에 들어가지 않게 지웠다가, 찍은 뒤 결과로 다시 띄운다
  await hideBanner(page)
  await page.screenshot({ path: shotFile, fullPage: true, timeout: 20000, animations: 'disabled', caret: 'hide', style: HIDE_EVENT_PANEL }).catch((error) => problems.push({ kind: 'screenshot', text: String(error.message).split('\n')[0] }))
  if (headed) {
    const tone = problems.length ? 'warn' : 'ok'
    await showBanner(page, `${problems.length ? `⚠️ 확인할 것 ${problems.length}개 — ${problems[0].text}` : '✅ 문제 없음'} · ${label}`, tone)
    await pause(page, 2)
    await hideBanner(page)
  }
  page.off('response', onImageResponse)
  page.off('requestfailed', onImageFailed)
  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  page.off('response', onResponse)
  page.off('requestfailed', onRequestFailed)
  const events = eventsSince(page, eventStart)
  const rawEvents = (page.__qaEvents ?? []).slice(eventStart)
  const scrollSections = rawEvents.filter((event) => event.name.endsWith('_scrolled')).map((event) => String(event.props.section ?? ''))
  if (!reusePage) await page.close()
  return { problems, warnings, events, scrollSections, finalPath: `${finalUrl.pathname}${finalUrl.search}`, ms: Date.now() - startedAt, timedOut }
}

// 두 스크린샷 비교 — 크기가 다르면 겹치는 부분만 비교하고 높이 변화를 따로 적는다
function compareShots(headFile, baseFile, diffFile) {
  if (!existsSync(headFile) || !existsSync(baseFile)) return null
  const headImage = PNG.sync.read(readFileSync(headFile))
  const baseImage = PNG.sync.read(readFileSync(baseFile))
  const width = Math.min(headImage.width, baseImage.width)
  const height = Math.min(headImage.height, baseImage.height)
  const crop = (image) => {
    const cropped = new PNG({ width, height })
    PNG.bitblt(image, cropped, 0, 0, width, height, 0, 0)
    return cropped
  }
  const diffImage = new PNG({ width, height })
  const differentPixels = pixelmatch(crop(headImage).data, crop(baseImage).data, diffImage.data, width, height, { threshold: 0.1 })
  writeFileSync(diffFile, PNG.sync.write(diffImage))
  return {
    pixels: differentPixels,
    ratio: Number((differentPixels / (width * height)).toFixed(5)),
    sizeChanged: headImage.width !== baseImage.width || headImage.height !== baseImage.height,
    headSize: [headImage.width, headImage.height],
    baseSize: [baseImage.width, baseImage.height]
  }
}

// 로그인 없는 앱(brand·plus)은 signInPath 가 없다
const isSignPath = (path) => [routesConfig.signInPath, routesConfig.signOutPath].filter(Boolean).some((signPath) => path.startsWith(signPath))
// 기대 이동 — '=/' 처럼 '=' 로 시작하면 그 경로와 정확히 같아야 하고, 아니면 앞부분이 같으면 된다
const reachedExpected = (expected, finalPath) => (expected.startsWith('=') ? samePath(expected.slice(1), finalPath) : finalPath.startsWith(expected))
const samePath = (requested, finalPath) => finalPath.split('?')[0].replace(/\/$/, '') === requested.split('?')[0].replace(/\/$/, '')
// 에러가 난 곳 — 주소·webpack 접두어를 걷어 앱 소스 경로:줄 로(dev 서버는 원본 경로를 준다). 기준 비교 키에는 넣지 않는다
const sourceAt = (where) =>
  String(where)
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^webpack-internal:\/\/\/(\([^)]+\)\/)?\.?\/?/, '')
    .replace(/\?[^:]*(?=:\d)/, '')
    .slice(0, 200)
// 스택에서 첫 앱 코드 줄(node_modules·_next 밖) — 없으면 첫 줄
function stackAt(stack) {
  const frames = String(stack ?? '').split('\n').slice(1).map((line) => line.trim().replace(/^at\s+/, ''))
  const appFrame = frames.find((frame) => !/node_modules|\.pnpm|next\/dist|\/_next\/static\/chunks\/(webpack|main|framework)/.test(frame)) ?? frames[0] ?? ''
  const location = appFrame.match(/\(?((?:webpack-internal|https?):\/\/\S+?:\d+)(?::\d+)?\)?$/)?.[1]
  return location ? `${sourceAt(location)}${appFrame.includes(' (') ? ` (${appFrame.split(' (')[0]})` : ''}` : appFrame.slice(0, 200)
}
const problemKey = (problem) => `${problem.kind}:${problem.text.replace(/:\d{4}\b/g, '')}`

const isCiPath = (path) => Boolean(routesConfig.ciPath) && path.startsWith(routesConfig.ciPath)

// 세션 상태(프로필)별 기대 이동 — 화면 설정 expect[프로필] 이 먼저, 없으면 로그인 화면(AuthGuard)에 프로필의 authScreens.
// 'stay' = 그 화면에 머물러야 한다 · 경로 = 그 경로(앞부분)로 넘어가야 한다 · 없음 = 기대 없이 기존 판정
function expectationOf(screen) {
  const routeExpect = routesConfig.routes?.[screen.route]?.expect?.[profileName]
  if (routeExpect) return routeExpect
  if (screen.auth && profile.authScreens) return profile.authScreens
  return null
}

function judge(target, viewportResults) {
  if (!target.url) return 'sample'
  const expected = expectationOf(target)
  let status = 'pass'
  for (const result of viewportResults) {
    const head = result.head
    const moved = !samePath(target.url, head.finalPath)
    if (expected && expected !== 'stay') {
      // 가드가 보내야 할 곳으로 갔는지가 검사 대상이다 — 기대와 다르면 실패
      if (!reachedExpected(expected, head.finalPath)) {
        result.newProblems.push({ kind: 'expect', text: `기대 이동 ${expected} — 실제 ${head.finalPath}` })
        return 'fail'
      }
      continue
    }
    if (expected === 'stay' && moved) {
      result.newProblems.push({ kind: 'expect', text: `이 화면에 머물러야 한다 — 실제 ${head.finalPath}` })
      return 'fail'
    }
    // 비로그인(authScreens 가 로그인 경로) 검수에서 로그인 화면으로 갔으면 가드가 제대로 막은 것 — 화면 파일에 AuthGuard 가 없어도(레이아웃·상위에서 막는 화면)
    if (isSignPath(head.finalPath) && !isSignPath(target.url)) return profile.authScreens && isSignPath(profile.authScreens.replace(/^=/, '')) ? 'expected' : 'login'
    if (isCiPath(head.finalPath) && !isCiPath(target.url)) return 'ci'
    // 진입 경로(entry)로 연 단계형 화면은 다음 단계로 넘어가는 게 정상이다
    if (moved && !target.entry) return 'redirected'
    if (result.newProblems.length) return 'fail'
    // 긴 화면에서는 비율이 작게 나온다(제목 한 줄 ≈ 0.1%) — 바뀐 픽셀 수로 본다
    if (result.diff && (result.diff.pixels >= (routesConfig.diffMinPixels ?? 50) || result.diff.sizeChanged)) status = 'changed'
  }
  if (expected && expected !== 'stay' && status === 'pass') return 'expected'
  return status
}

// ── 세션 지키기 — 검사 중에 로그인이 풀리면 멈추고 로그인을 받는다 ──────────────
// 토큰 쿠키(B_AT*)가 검사 컨텍스트에 있는지로 본다. 없으면 run.gate 를 띄우고(라이브 화면 띠) login.mjs 창을 연다 →
// 저장되면 새 쿠키를 검사 컨텍스트에 넣고 이어 간다. 동시에 여러 화면이 걸려도 로그인 창은 하나(relogin 약속을 같이 기다린다)
let relogin = null
let sessionGaveUp = false
const sessionAlive = async (contextList) => (await Promise.all(contextList.map(async (context) => (await context.cookies()).some((cookie) => cookie.name.startsWith('B_AT') && cookie.value)))).every(Boolean)
async function guardSession(contextList, headUrl) {
  if (!profile.session) return true
  if (await sessionAlive(contextList)) return true
  if (sessionGaveUp) return false
  relogin ??= requestLogin(contextList, headUrl).finally(() => { relogin = null })
  return relogin
}
async function requestLogin(contextList, headUrl) {
  const started = run.screens.some((screen) => !['queued', 'running'].includes(screen.status))
  run.gate = { profile: profileName, status: 'waiting', since: new Date().toISOString(), message: `${started ? '로그인이 풀렸어요' : `${profileName} 상태로 검수하려면 로그인해 주세요`} — 열린 창에서 ${started ? '다시 ' : ''}로그인${profileName === 'verified' ? '(+ 휴대폰 본인인증)' : ''}해 주시면 ${started ? '멈춘 화면부터 ' : ''}이어서 검사해요(10분)${profile.note ? ` · ${profile.note}` : ''}` }
  saveRun()
  say(`🔑 ${run.gate.message}`)
  const code = await new Promise((resolve) => {
    const login = spawn(process.execPath, [join(QA_DIR, 'login.mjs'), '--app', appName, '--url', headUrl, '--target', target, '--profile', profile.session], { stdio: 'inherit' })
    login.on('exit', (exitCode) => resolve(exitCode ?? 1))
  })
  const file = sessionFileOf(HERMES, appName, profile.session, target, serverUrl)
  if (code !== 0 || !existsSync(file)) {
    sessionGaveUp = true
    run.gate.status = 'failed'
    saveRun()
    say('⚠️  로그인을 마치지 않았다 — 남은 로그인 화면은 확인하지 못한다')
    return false
  }
  const { cookies = [] } = JSON.parse(readFileSync(file, 'utf8'))
  for (const context of contextList) {
    await context.clearCookies()
    await context.addCookies(cookies)
  }
  run.gate.status = 'done'
  saveRun()
  say('✅ 다시 로그인 — 이어서 검사')
  return true
}

// ── 4) 실행 ──────────────────────────────────────────────
async function main() {
  if (!option('routes')) ensureDependencies(repoRoot, 'head')
  const impact = loadImpact()
  run.changed = impact.changed
  run.global = impact.global
  run.totalScreens = impact.totalScreens
  // D9: 가까운 화면부터 — impact 가 이미 거리순
  for (const screen of impact.screens) {
    for (const target of targetsOf(screen)) {
      run.screens.push({
        key: `${screen.route}${target.url && target.url !== screen.route ? ` ${target.url}` : ''}`,
        route: screen.route,
        url: target.url,
        entry: Boolean(target.entry),
        note: target.note ?? null,
        file: screen.file,
        distance: screen.distance,
        changedFile: screen.changed,
        via: screen.via,
        auth: screen.auth,
        codeEvents: impact.events?.[screen.route] ?? [],
        status: target.skip ? 'skip' : target.url ? 'queued' : 'sample',
        viewports: [],
        problems: [],
        baseProblems: 0
      })
    }
  }
  say(`영향 화면 ${impact.screens.length}개 → 열 화면 ${run.screens.filter((screen) => screen.url).length}개`)
  // 열 화면이 없어도 sitemap 에서 받을 화면이 있으면 서버를 띄운다
  const fromSitemap = run.screens.some((screen) => screen.status === 'sample' && routesConfig.routes?.[screen.route]?.samplesFrom === 'sitemap')
  if (!run.screens.some((screen) => screen.url) && !fromSitemap) return finish()

  // 작업 트리가 곧 기준 워크트리면 같은 코드라 비교할 게 없고, 한 폴더에 dev 서버 둘은 Next 가 막는다
  const sameAsBase = repoRoot === join(HERMES, '.worktrees', 'bznav-web', 'qa-base')
  if (sameAsBase && !flag('no-base') && !suite) say('작업 트리가 기준 워크트리(qa-base)라 전·후 비교를 건너뜀')
  const useBase = !flag('no-base') && !sameAsBase && !suite
  if (suite) say(`전체 검수 — ${target === 'server' ? `☁️ 서버 ${serverUrl}` : '🖥 로컬 서버'} · 승인한 기준 사진과 비교 (.qa-baselines/${targetKey(appName, target)}/${profileName})`)
  if (useBase && !option('base-url')) {
    const config = JSON.parse(readFileSync(join(HERMES, 'hermes.config.json'), 'utf8'))
    const prBase = config.repos.find((repo) => repo.name === 'bznav-web')?.apps?.[appName]?.prBase ?? 'dev'
    const baseRef = option('base') || `origin/${prBase}`
    const baseSha = git(['merge-base', baseRef, 'HEAD'], repoRoot)
    run.base = { ref: baseRef, sha: baseSha.slice(0, 9) }
  }

  // 만료된 세션 — 라이브 화면(현황판에서 시작)이면 멈추지 않고 첫 화면 검사 전에 로그인 창을 띄운다(guardSession).
  // 라이브 화면 없이(명령줄) 돌면 로그인 화면만 찍고 실패로 남으니 서버를 띄우기 전에 멈춘다
  const sessionPath = profile.session ? sessionFileOf(HERMES, appName, profile.session, target, serverUrl) : null
  const expiredAt = sessionPath && existsSync(sessionPath) ? expiredSessionAt(sessionPath) : null
  if (expiredAt && !liveView) throw new Error(expiredMessage(profileName, profile.session, expiredAt))
  if (expiredAt) say(`🔑 세션 ${profileName} 만료(${new Date(expiredAt).toLocaleString('ko-KR')}) — 화면 검사 전에 로그인 창을 띄운다`)

  // 작업 서버와 기준 서버를 함께 띄운다
  // dev 서버 대상이면 띄우지 않고 배포본 주소를 쓴다
  const devTargetUrl = target === 'server' ? serverUrl : null
  const headUrlPromise = option('head-url') ? Promise.resolve(option('head-url')) : devTargetUrl ? Promise.resolve(devTargetUrl) : startDevServer(repoRoot, 3291, 'head')
  const baseUrlPromise = !useBase
    ? Promise.resolve(null)
    : option('base-url')
      ? Promise.resolve(option('base-url'))
      : Promise.resolve().then(() => {
          setPhase(`base: 기준 워크트리 준비 @ ${run.base.sha}`)
          return startDevServer(prepareBaseWorktree(run.base.sha), 3292, 'base')
        })
  const [headUrl, baseUrl] = await Promise.all([headUrlPromise, baseUrlPromise])
  run.urls = { head: headUrl, base: baseUrl }
  await expandSitemapSamples(headUrl)

  // D7: 저장해 둔 로그인 세션 (login.mjs). localhost 쿠키라 두 포트가 함께 쓴다
  // D7: 저장해 둔 세션(login.mjs) — 프로필마다 하나. localhost 쿠키라 두 포트가 함께 쓴다
  const authFile = profile.session ? sessionFileOf(HERMES, appName, profile.session, target, serverUrl) : null
  const hasSession = Boolean(authFile && existsSync(authFile))
  run.profile = profileName
  run.session = hasSession ? 'saved' : 'none'
  if (profile.session && !hasSession) {
    say(`⚠️  프로필 ${profileName} 세션 없음 — node scripts/qa/login.mjs --profile ${profile.session} 로 저장한다. 세션 없이 진행`)
  } else {
    say(`세션 프로필 ${profileName}${profile.note ? ` (${profile.note})` : ''}`)
  }

  run.status = 'running'
  if (liveView) await openLivePage()
  if (run.tcPicks) {
    say(`확인할 TC ${run.tcPicks.tcs.length}개 (${run.tcPicks.file}${run.tcPicks.head && run.tcPicks.head !== run.head ? ` · ⚠️ TC 는 @${run.tcPicks.head} 기준 — 지금 @${run.head}` : ''})`)
  }
  if (suite || pickIds) listScenarios(loadScenarios())
  setPhase('화면 검사 중')
  const browser = await chromium.launch(headed ? { headless: false, slowMo: Math.round(slowMs / 3) } : {})
  const contexts = {}
  // 보이는 창 배치 — 뷰포트 순서대로 왼쪽부터 나란히, 작업은 윗줄·기준은 아랫줄(겹치지 않게)
  const rowHeight = Math.max(...routesConfig.viewports.map((viewport) => viewport.height)) + 110
  let windowLeft = 0
  for (const viewport of routesConfig.viewports) {
    const contextOptions = { viewport: { width: viewport.width, height: viewport.height }, storageState: hasSession ? authFile : undefined, isMobile: viewport.width < 600, locale: 'ko-KR' }
    contexts[viewport.name] = { head: await browser.newContext(contextOptions), base: baseUrl ? await browser.newContext(contextOptions) : null }
    // 화면을 열기만 해도 나가는 mutation(저장·알림톡 등)은 서버에 보내지 않는다 — 막은 것은 로그에 남긴다
    for (const context of Object.values(contexts[viewport.name]).filter(Boolean)) {
      await guardMutations(context, (operation) => say(`🛡  막은 mutation ${operation} (${viewport.name})`))
      // 트래킹(Mixpanel) 이벤트를 잡아 화면마다 남기고, 보이는 창이면 오른쪽 아래에 띄운다(실제 전송은 막는다)
      const where = `${viewport.name}${context === contexts[viewport.name].base ? ' 기준' : ''}`
      context.__qaSlot = context === contexts[viewport.name].base ? `${viewport.name}-base` : viewport.name
      await captureTracking(context, { headed, onEvent: (name, props, page) => live.write({ where, kind: 'event', name, values: props, page: page ? new URL(page.url()).pathname : '' }) })
      await blockThirdParty(context)
      live.attach(context, where)
    }
    windowLefts[viewport.name] = windowLeft
    contexts[viewport.name].head.__qaPlace = { left: windowLeft, top: 0, width: viewport.width, height: viewport.height }
    if (contexts[viewport.name].base) contexts[viewport.name].base.__qaPlace = { left: windowLeft, top: rowHeight, width: viewport.width, height: viewport.height }
    windowLeft += viewport.width + 30
  }

  const queue = run.screens.filter((screen) => screen.url)
  let cursor = 0
  const sessionContexts = Object.values(contexts).flatMap((pair) => [pair.head, pair.base].filter(Boolean))
  const worker = async () => {
    while (cursor < queue.length) {
      const screen = queue[cursor]
      cursor += 1
      const order = cursor
      screen.status = 'running'
      saveRun()
      const slug = screen.key.replace(/[^\w가-힣-]+/g, '_').replace(/^_+|_+$/g, '') || 'root'
      // 세션 지키기 — 로그인 상태 검수인데 토큰이 없으면 멈추고 로그인을 요청한다(못 하면 이 화면은 '로그인 필요')
      if (!(await guardSession(sessionContexts, headUrl))) {
        Object.assign(screen, { status: 'login', note: '로그인이 풀려 확인하지 못했어요 — 로그인 요청에 답이 없었어요' })
        saveRun()
        continue
      }
      let viewportResults = []
      for (let attempt = 0; attempt < 2; attempt += 1) {
      viewportResults = []
      screen.viewports = []
      for (const viewport of routesConfig.viewports) {
        const files = { head: `shots/${slug}.${viewport.name}.head.png`, base: `shots/${slug}.${viewport.name}.base.png`, diff: `shots/${slug}.${viewport.name}.diff.png` }
        const [head, base] = await Promise.all([
          visit(contexts[viewport.name].head, headUrl, screen.url, join(runDir, files.head), `${order}/${queue.length} 작업 · ${viewport.name}`, routesConfig.routes?.[screen.route]),
          baseUrl ? visit(contexts[viewport.name].base, baseUrl, screen.url, join(runDir, files.base), `${order}/${queue.length} 기준 · ${viewport.name}`, routesConfig.routes?.[screen.route]) : Promise.resolve(null)
        ])
        // 전체 검수 — 승인한 기준 사진·그때의 문제 목록과 비교(D12)
        const baselineShot = suite ? join(baselineDir(targetKey(appName, target), profileName), `${slug}.${viewport.name}.png`) : null
        const hasBaseline = Boolean(baselineShot && existsSync(baselineShot))
        if (hasBaseline) copyFileSync(baselineShot, join(runDir, files.base))
        // 기준 화면에도 있던 에러는 이번 변경 탓이 아니다 — 새로 생긴 것만 실패로 센다
        // routes.<화면>.allowStatus — 그 화면 자신의 응답 코드가 원래 이런 화면(/404 → 404)이면 문제로 세지 않는다
        const allowStatus = routesConfig.routes?.[screen.route]?.allowStatus ?? []
        if (allowStatus.length) head.problems = head.problems.filter((problem) => !(problem.kind === 'http' && allowStatus.some((code) => problem.text.startsWith(`${code} ${screen.url.split('?')[0]}`))))
        // 필수 화면 보기 이벤트(코드의 <PageViewEventLogger pageName='…'>) — 이 화면에 머물렀는데 안 나갔으면 문제
        if (samePath(screen.url, head.finalPath)) {
          for (const event of (screen.codeEvents ?? []).filter((item) => item.required)) {
            if (!(head.events ?? []).some((fired) => fired.name === event.name)) head.problems.push({ kind: 'tracking', text: `필수 화면 보기 이벤트가 안 나감 — ${event.name}`, at: event.at })
          }
        }
        const knownProblems = suite ? readBaselineProblems(targetKey(appName, target), profileName, `${slug}.${viewport.name}`) : base?.problems ?? []
        const baseKeys = new Set(knownProblems.map(problemKey))
        const newProblems = head.problems.filter((problem) => !baseKeys.has(problemKey(problem)))
        const diff = base || hasBaseline ? compareShots(join(runDir, files.head), join(runDir, files.base), join(runDir, files.diff)) : null
        if (suite && !hasBaseline) screen.noBaseline = true
        viewportResults.push({ viewport: viewport.name, head, base, newProblems, diff })
        screen.viewports.push({
          name: viewport.name,
          shots: { head: files.head, base: base || (suite && !screen.noBaseline) ? files.base : null, diff: diff ? files.diff : null },
          slug: `${slug}.${viewport.name}`,
          headProblems: head.problems,
          finalPath: head.finalPath,
          events: head.events,
          scrollSections: head.scrollSections,
          warnings: head.warnings ?? [],
          baseFinalPath: base?.finalPath ?? null,
          ms: head.ms,
          diff
        })
        saveRun()
      }
      // 검사하는 사이에 로그인이 풀렸으면(토큰이 사라짐) 로그인을 받고 이 화면을 한 번 더
      if (attempt === 0 && profile.session && !(await sessionAlive(sessionContexts)) && (await guardSession(sessionContexts, headUrl))) {
        say(`🔁 ${screen.key} — 다시 로그인했으니 다시 검사`)
        continue
      }
      break
      }
      screen.eventCheck = eventCheckOf(screen)
      screen.baseProblems = viewportResults.reduce((total, result) => total + result.head.problems.length - result.newProblems.length, 0)
      screen.expect = expectationOf(screen)
      screen.status = judge(screen, viewportResults)
      if (screen.status === 'expected' && !screen.expect) screen.expect = profile.authScreens
      // 기준 사진이 아직 없는 화면 — 처음 검수. 승인하면 다음부터 기준이 된다
      if (suite && screen.noBaseline && screen.status === 'pass') screen.status = 'new'
      screen.problems = viewportResults.flatMap((result) => result.newProblems.map((problem) => ({ ...problem, viewport: result.viewport })))
      say(`${statusIcon(screen.status)} ${screen.key}${screen.problems.length ? ` — ${screen.problems[0].text}` : ''}`)
    }
  }
  await Promise.all(Array.from({ length: headed || liveView ? 1 : routesConfig.concurrency ?? 3 }, worker))
  // 화면 검사 컨텍스트를 닫고 씬으로 — 같은 뷰포트 칸(라이브 화면)·창 자리를 씬이 이어 쓴다
  if (suite || pickIds) {
    for (const pair of Object.values(contexts)) {
      await pair.head.close()
      await pair.base?.close()
    }
    await runScenarios(browser, headUrl)
  }
  await browser.close()
  return finish()
}

// ── 흐름 씬 (D10·D11) — 씬마다 자기 세션 프로필·뷰포트로 ───────────
// 이번 런에서 돌릴 흐름 씬 파일들(--scenarios 로 거른다)
function loadScenarios() {
  const dir = join(QA_DIR, 'scenarios', appName)
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.json')).sort() : []
  const only = option('scenarios') ? option('scenarios').split(',') : null
  // 흐름(--flow) 단계에서는 그 단계 세션의 씬만 — 씬은 자기 세션이 정해져 있어 단계마다 다 돌리면 같은 씬이 두 번 돈다
  const stageOnly = flag('stage-scenarios')
  return files
    .map((name) => ({ file: name, ...JSON.parse(readFileSync(join(dir, name), 'utf8')) }))
    .filter((scenario) => !only || only.some((key) => scenario.file.includes(key)))
    .filter((scenario) => !stageOnly || (scenario.profile ?? 'logout') === profileName)
    // 영향 QA 에서는 변경분 TC 에 걸린 씬만
    .filter((scenario) => suite || !pickIds || (scenario.tc ?? []).some((id) => pickIds.has(id)))
}
// 씬이 돌 뷰포트 — 씬 파일 "viewports": ["desktop"] 처럼 적으면 그것만, 없으면 화면 검사와 같은 전부(데스크톱·모바일)
const scenarioViewports = (scenario) => {
  const names = scenario.viewports ?? routesConfig.viewports.map((viewport) => viewport.name)
  return routesConfig.viewports.filter((viewport) => names.includes(viewport.name))
}
// 씬 목록을 미리 run.json 에 — 화면 검사 중에도 체크리스트에 씬과 단계가 보이게. 씬 × 뷰포트마다 한 항목, plan = 씬의 단계 목록
function listScenarios(scenarios) {
  if (run.scenarios.length) return
  for (const scenario of scenarios) {
    for (const viewport of scenarioViewports(scenario)) {
      run.scenarios.push({
        key: `${scenario.file}@${viewport.name}`, file: scenario.file, name: scenario.name, viewport: viewport.name, why: scenario.why ?? '', tc: scenario.tc ?? [],
        profile: scenario.profile ?? 'logout', status: 'queued', plan: (scenario.steps ?? []).map(describeStep), steps: [], shots: []
      })
    }
  }
}

async function runScenarios(browser, origin) {
  const scenarios = loadScenarios()
  if (!scenarios.length) return
  listScenarios(scenarios)
  setPhase(`흐름 씬 ${scenarios.length}개 (뷰포트마다)`)
  for (const scenario of scenarios) {
    // 같은 씬을 뷰포트마다 동시에 — 라이브 화면의 데스크톱·모바일 칸(보이는 창이면 그 자리)에 나란히 보인다
    const entries = run.scenarios.filter((entry) => entry.file === scenario.file)
    await Promise.all(entries.map((entry) => runScenarioOn(browser, origin, scenario, entry)))
  }
}

async function runScenarioOn(browser, origin, scenario, entry) {
  const viewport = routesConfig.viewports.find((item) => item.name === entry.viewport)
  const where = `씬 ${scenario.file.slice(0, 2)} · ${viewport.name}`
  entry.status = 'running'
  saveRun()
  const scenarioProfile = profiles[entry.profile] ?? { session: null }
  const sessionFile = scenarioProfile.session ? sessionFileOf(HERMES, appName, scenarioProfile.session, target, serverUrl) : null
  if (sessionFile && !existsSync(sessionFile)) {
    Object.assign(entry, { status: 'login', steps: [{ label: `세션 ${entry.profile} 없음 — node scripts/qa/login.mjs --profile ${scenarioProfile.session}`, ok: false, detail: '' }] })
    say(`🔒 ${where} ${entry.name}`)
    return
  }
  const scenarioExpiredAt = sessionFile ? expiredSessionAt(sessionFile) : null
  if (scenarioExpiredAt) {
    Object.assign(entry, { status: 'login', steps: [{ label: expiredMessage(entry.profile, scenarioProfile.session, scenarioExpiredAt), ok: false, detail: '' }] })
    say(`🔒 ${where} ${entry.name}`)
    return
  }
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, storageState: sessionFile ?? undefined, isMobile: viewport.width < 600, locale: 'ko-KR' })
  // 보이는 창이면 화면 검사 때 그 뷰포트 창 자리에
  context.__qaPlace = { left: windowLefts[viewport.name] ?? 0, top: 0, width: viewport.width, height: viewport.height }
  await captureTracking(context, { headed, onEvent: (name, props, page) => live.write({ where, kind: 'event', name, values: props, page: page ? new URL(page.url()).pathname : '' }) })
  await blockThirdParty(context)
  live.attach(context, where)
  live.write({ where, kind: 'mark', name: `▶ 씬 시작 — ${scenario.name}` })
  const slug = `scenario-${scenario.file.replace(/\.json$/, '').replace(/[^\w가-힣-]+/g, '_')}.${viewport.name}`
  const result = await runScenario(context, scenario, {
    origin, slug, runDir, headed, showBanner, hideBanner,
    onPage: liveView ? (page) => startScreencast(page, runDir, viewport.name) : null,
    onStep: (steps) => {
      entry.steps = steps.map((step) => ({ ...step }))
      saveRun()
    }
  })
  await context.close()
  Object.assign(entry, result)
  const stopped = result.steps.find((step) => !step.ok)
  say(`${statusIcon(result.status)} ${where} ${entry.name}${stopped ? ` — ${stopped.label}: ${stopped.detail}` : ''}`)
}

// 이벤트 확인 — 코드에 있는 이벤트(codeEvents)와 실제로 나간 이벤트를 맞춰 본다(뷰포트 합집합).
// 화면 보기(_viewed) 가 하나도 안 나갔으면 ⚠(그 화면에 머문 경우만). 클릭 이벤트는 누르지 않으니 "누르면 나감" 으로만 센다
function eventCheckOf(screen) {
  const fired = new Set(screen.viewports.flatMap((viewport) => (viewport.events ?? []).map((event) => event.name)))
  const sections = new Set(screen.viewports.flatMap((viewport) => viewport.scrollSections ?? []))
  const code = screen.codeEvents ?? []
  const literal = code.filter((event) => event.name)
  const stayed = screen.viewports.some((viewport) => samePath(screen.url ?? '', viewport.finalPath ?? ''))
  const expectedSections = code.filter((event) => event.section).map((event) => event.section)
  return {
    fired: [...fired],
    pageView: [...fired].some((name) => name.endsWith('_viewed')),
    noPageView: stayed && ![...fired].some((name) => name.endsWith('_viewed')),
    literal: literal.length,
    literalFired: literal.filter((event) => fired.has(event.name)).length,
    clicks: literal.filter((event) => event.kind === 'clicked').length,
    dynamic: code.filter((event) => !event.name && !event.section).length,
    sections: expectedSections,
    sectionsMissing: expectedSections.filter((section) => !sections.has(section))
  }
}

// 흐름 연결 — 통과한 씬이 지나간 경로를 화면(라우트)에 잇는다. 주소로 바로 열면 데이터·저장소 값이 없어 확인 못 하는 화면
// (샘플 필요·이동됨·실패)도 흐름 속에서는 열렸으니 screen.flows 에 "어느 씬·뷰포트에서 지나갔다" 를 남긴다
const routePattern = (route) => new RegExp(`^${route.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]/g, '[^/]+')}/?$`)
function linkFlows() {
  const passed = run.scenarios.filter((scenario) => scenario.status === 'pass' && scenario.visited?.length)
  if (!passed.length) return
  for (const screen of run.screens) {
    const pattern = routePattern(screen.route)
    const flows = passed.filter((scenario) => scenario.visited.some((path) => pattern.test(path))).map((scenario) => `${scenario.file.slice(0, 2)}·${scenario.viewport}`)
    if (flows.length) screen.flows = [...new Set(flows)]
  }
  const linked = run.screens.filter((screen) => screen.flows && ['sample', 'redirected', 'fail', 'skip'].includes(screen.status))
  if (linked.length) say(`🔗 주소로는 확인 못 했지만 흐름에서 지나간 화면 ${linked.length}개 — ${linked.map((screen) => screen.route).join(', ')}`)
}

const STATUS_ICONS = { pass: '✅', expected: '☑️', changed: '🟡', fail: '❌', redirected: '↪️', login: '🔒', ci: '🪪', sample: '📝', new: '🆕', human: '🙋', skip: '⛔' }
const statusIcon = (status) => STATUS_ICONS[status] ?? '·'

// 변경분 TC 마다 결과 — 걸린 씬이 없으면 사람이 확인(manual), 있으면 그 씬들의 결과(하나라도 실패면 실패)
function settleTcPicks() {
  if (!run.tcPicks) return
  for (const tc of run.tcPicks.tcs) {
    const entries = run.scenarios.filter((entry) => (entry.tc ?? []).includes(tc.id))
    tc.scenarios = [...new Set(entries.map((entry) => entry.file))]
    if (!entries.length) tc.status = 'manual'
    else if (entries.some((entry) => entry.status === 'fail')) tc.status = 'fail'
    else if (entries.every((entry) => entry.status === 'pass')) tc.status = 'pass'
    else tc.status = entries.find((entry) => entry.status !== 'pass').status
  }
}

function finish() {
  linkFlows()
  settleTcPicks()
  const counts = {}
  for (const screen of run.screens) counts[screen.status] = (counts[screen.status] ?? 0) + 1
  run.summary = counts
  const scenarioCounts = {}
  for (const scenario of run.scenarios) scenarioCounts[scenario.status] = (scenarioCounts[scenario.status] ?? 0) + 1
  run.scenarioSummary = scenarioCounts
  run.status = 'done'
  run.finishedAt = new Date().toISOString()
  setPhase('끝')
  const scenarioLine = run.scenarios.length ? ` · 흐름 씬 ${run.scenarios.length}개(통과 ${scenarioCounts.pass ?? 0} · 실패 ${scenarioCounts.fail ?? 0} · 사람 필요 ${scenarioCounts.human ?? 0} · 로그인 필요 ${scenarioCounts.login ?? 0})` : ''
  const tcLine = run.tcPicks ? ` · 확인할 TC ${run.tcPicks.tcs.length}개(씬 통과 ${run.tcPicks.tcs.filter((tc) => tc.status === 'pass').length} · 씬 실패 ${run.tcPicks.tcs.filter((tc) => tc.status === 'fail').length} · 사람이 확인 ${run.tcPicks.tcs.filter((tc) => tc.status === 'manual').length})` : ''
  const line = `${suite ? '전체 검수 ' : ''}[${run.profile}] ${suite ? `기준 없음 ${counts.new ?? 0} · ` : ''}통과 ${counts.pass ?? 0} · 기대대로 이동 ${counts.expected ?? 0} · 변화 ${counts.changed ?? 0} · 실패 ${counts.fail ?? 0} · 이동됨 ${counts.redirected ?? 0} · 로그인 필요 ${counts.login ?? 0} · 본인인증 필요 ${counts.ci ?? 0} · 샘플 필요 ${counts.sample ?? 0}${counts.skip ? ` · 건너뜀(부작용) ${counts.skip}` : ''}${scenarioLine}${tcLine}`
  console.log(`\n📋 QA ${run.id}\n${line}\n결과: ${relative(HERMES, runDir)}/run.json`)
  if (run.plan) writeQaResult(line)
  return counts.fail || scenarioCounts.fail ? 1 : 0
}

// 계획서 Checkpoint 에 "- QA result:" 한 줄 (있으면 바꾼다)
function writeQaResult(line) {
  const planFile = join(HERMES, run.plan)
  if (!existsSync(planFile)) return
  const text = readFileSync(planFile, 'utf8')
  const entry = `- QA result: ${line} · @${run.head}${run.base ? ` vs ${run.base.ref}@${run.base.sha}` : ''} · ${run.id}`
  const updated = /^- QA result:.*$/m.test(text)
    ? text.replace(/^- QA result:.*$/m, entry)
    : text.replace(/^(- Status:.*)$/m, `$1\n${entry}`)
  writeFileSync(planFile, updated)
}

// 중간에 끄면(Ctrl+C·kill) dev 서버를 남기지 않고 런을 '중단' 으로 닫는다 — 현황판이 계속 ⏳ 로 보이지 않게
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    run.status = 'error'
    run.error = `중단됨 (${signal})`
    stopServers()
    saveRun()
    process.exit(130)
  })
}

let exitCode = 0
try {
  exitCode = await main()
} catch (error) {
  run.status = 'error'
  run.error = String(error.message)
  say(`❌ ${error.message}`)
  exitCode = 2
} finally {
  stopServers()
  saveRun()
  try {
    buildReport(runDir)
    buildIndex()
    console.log(`🗂  리포트: ${relative(HERMES, runDir)}/report.html · 이력: node scripts/qa/history.mjs`)
  } catch (error) {
    console.error(`⚠️  리포트를 만들지 못했다 — ${error.message}`)
  }
}
process.exit(exitCode)
