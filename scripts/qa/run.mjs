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
 *   --headed            브라우저 창을 띄워 여는 모습을 보여 준다(동시 1개 · 창 하나에서 화면 이동 · 진행 표시 · 천천히 스크롤)
 *   --slow <ms>         --headed 의 속도(기본 700 — 클수록 느리다)
 *
 * 산출물: .qa-runs/<런 id>/run.json · shots/*.png · server-*.log (git 무시). 현황판 QA 탭이 run.json 을 읽는다.
 * 판정(D8): 통과 pass · 화면 변화 changed · 실패 fail(기준에 없던 에러) · 이동됨 redirected · 로그인 필요 login · 샘플 필요 sample
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, realpathSync, openSync, appendFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { buildReport, buildIndex } from './report.mjs'

const QA_DIR = dirname(fileURLToPath(import.meta.url))
const HERMES = join(QA_DIR, '..', '..')
const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] ?? '' : ''
}
const flag = (name) => argv.includes(`--${name}`)

const appName = option('app') || 'refund-web'
const cwdOption = option('cwd')
if (!cwdOption || !existsSync(cwdOption)) {
  console.error('사용: node scripts/qa/run.mjs --cwd <워크트리> [--app refund-web] [--plan <계획서>] [--no-base] [--keep-servers]')
  process.exit(2)
}
const routesConfig = JSON.parse(readFileSync(join(QA_DIR, 'routes', `${appName}.json`), 'utf8'))
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const repoRoot = realpathSync(git(['rev-parse', '--show-toplevel'], cwdOption))
const appRel = join('apps', appName)
const planPath = option('plan')

// 세션 프로필 — --profile 이 없으면 로그인 세션이 있는 첫 프로필, 없으면 logout
const profiles = Object.fromEntries(Object.entries(routesConfig.profiles ?? { logout: { session: null } }).filter(([name]) => !name.startsWith('$')))
const savedProfile = Object.entries(profiles).find(([, settings]) => settings.session && existsSync(join(HERMES, '.qa-auth', `${appName}.${settings.session}.json`)))
const profileName = option('profile') || savedProfile?.[0] || 'logout'
const profile = profiles[profileName]
if (!profile) {
  console.error(`⚠️  프로필 ${profileName} 이 routes/${appName}.json 의 profiles 에 없다 — ${Object.keys(profiles).join(', ')}`)
  process.exit(2)
}

// ── 런 기록 ──────────────────────────────────────────────
const pad = (value) => String(value).padStart(2, '0')
const now = new Date()
const runId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${appName}`
const runDir = join(HERMES, '.qa-runs', runId)
mkdirSync(join(runDir, 'shots'), { recursive: true })
const run = {
  id: runId,
  app: appName,
  plan: planPath ? relative(HERMES, join(process.cwd(), planPath)) : null,
  cwd: repoRoot,
  branch: git(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot).replace(/^HEAD$/, '(detached)'),
  head: git(['rev-parse', '--short', 'HEAD'], repoRoot),
  base: null,
  status: 'preparing', // preparing → running → done | error
  phase: '영향 화면 찾는 중',
  startedAt: new Date().toISOString(),
  finishedAt: null,
  changed: [],
  global: [],
  totalScreens: 0,
  screens: [],
  summary: {},
  log: []
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

// ── 1) 영향 화면 ─────────────────────────────────────────
function loadImpact() {
  const routesOption = option('routes')
  if (routesOption) {
    return {
      changed: [],
      global: [],
      totalScreens: 0,
      screens: routesOption.split(',').map((route) => {
        const file = pageFileOf(route.trim())
        return { route: route.trim(), file, distance: 0, changed: '(--routes)', via: [], auth: usesAuthGuard(file) }
      })
    }
  }
  const impactArgs = [join(QA_DIR, 'impact.mjs'), '--cwd', repoRoot, '--app', appName, '--json']
  if (option('files')) impactArgs.push('--files', option('files'))
  if (option('base')) impactArgs.push('--base', option('base'))
  return JSON.parse(execFileSync(process.execPath, impactArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
}

// --routes 로 받은 라우트 → 화면 파일 (/help/faq → apps/<앱>/pages/help/faq/index.tsx 또는 faq.tsx)
function pageFileOf(route) {
  const base = join(appRel, 'pages', route === '/' ? 'index' : route)
  return [`${base}.tsx`, join(base, 'index.tsx'), `${base}.ts`, join(base, 'index.ts')].find((candidate) => existsSync(join(repoRoot, candidate))) ?? null
}
// 로그인 화면 판정 — impact.mjs 와 같은 기준(화면 파일이 AuthGuard 를 직접 쓰는지)
function usesAuthGuard(file) {
  if (!file) return false
  try {
    return /\bAuthGuard\b/.test(readFileSync(join(repoRoot, file), 'utf8'))
  } catch {
    return false
  }
}

// 라우트(파일 기준) → 실제로 열 URL 들. 동적 라우트는 설정의 samples, 단계형은 entry(D6·D8)
function targetsOf(screen) {
  const settings = routesConfig.routes?.[screen.route] ?? {}
  if (settings.entry) return [{ url: settings.entry, entry: true, note: settings.note }]
  if (settings.samples?.length) return settings.samples.map((url) => ({ url, note: settings.note }))
  if (/\[/.test(screen.route)) return [{ url: null, note: settings.note ?? '동적 라우트 — routes 설정에 샘플 URL 을 적어 주세요' }]
  return [{ url: screen.route, note: settings.note }]
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
  // .env 는 워크트리 생성 때 복사된다(wt-copy-local.sh). 없을 때만 SSM 에서 만든다 — 내용은 출력하지 않는다
  if (!existsSync(join(appDir, '.env'))) {
    setPhase(`${label}: env 생성 (gen:env)`)
    runStep('pnpm', ['gen:env'], appDir, logFile)
  }
  setPhase(`${label}: Relay 생성 (gen:relay)`)
  runStep('pnpm', ['gen:relay'], appDir, logFile)
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
const headed = flag('headed')
const slowMs = Number(option('slow')) || 700
const pause = (page, factor = 1) => (headed ? page.waitForTimeout(slowMs * factor) : Promise.resolve())

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

// 화면을 위에서 아래로 천천히 내렸다가 다시 올린다 — 사람이 훑어보듯
async function sweepPage(page) {
  if (!headed) return
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

async function visit(context, origin, path, shotFile, label) {
  // 보이는 창이면 창 하나를 계속 쓴다(화면 이동이 그 창에서 보이게). 아니면 화면마다 새 페이지
  const page = headed ? (context.__qaPage ??= await context.newPage()) : await context.newPage()
  const problems = []
  const onConsole = (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    // 리소스 로드 실패는 response·requestfailed 가 우리 요청만 골라 잡는다 — 외부 위젯(채널톡 등) 401 이 콘솔로 새지 않게
    if (text.startsWith('Failed to load resource') || ignoreConsole.some((pattern) => pattern.test(text))) return
    problems.push({ kind: 'console', text: text.slice(0, 400) })
  }
  const onPageError = (error) => problems.push({ kind: 'pageerror', text: String(error.message).slice(0, 400) })
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
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('response', onResponse)
  page.on('requestfailed', onRequestFailed)

  const startedAt = Date.now()
  let timedOut = false
  try {
    await page.goto(`${origin}${path}`, { waitUntil: 'load', timeout: routesConfig.timeoutMs })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
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
  const brokenImages = await page
    .evaluate(() => [...document.images].filter((image) => image.complete && image.naturalWidth === 0 && image.src).map((image) => image.src))
    .catch(() => [])
  for (const source of brokenImages) problems.push({ kind: 'image', text: `깨진 이미지 ${source.replace(origin, '').slice(0, 200)}` })
  const finalUrl = new URL(page.url())
  // 진행 표시는 스크린샷에 들어가지 않게 지웠다가, 찍은 뒤 결과로 다시 띄운다
  await hideBanner(page)
  await page.screenshot({ path: shotFile, fullPage: true, timeout: 20000, animations: 'disabled', caret: 'hide' }).catch((error) => problems.push({ kind: 'screenshot', text: String(error.message).split('\n')[0] }))
  if (headed) {
    const tone = problems.length ? 'warn' : 'ok'
    await showBanner(page, `${problems.length ? `⚠️ 확인할 것 ${problems.length}개 — ${problems[0].text}` : '✅ 문제 없음'} · ${label}`, tone)
    await pause(page, 2)
    await hideBanner(page)
  }
  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  page.off('response', onResponse)
  page.off('requestfailed', onRequestFailed)
  if (!headed) await page.close()
  return { problems, finalPath: `${finalUrl.pathname}${finalUrl.search}`, ms: Date.now() - startedAt, timedOut }
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

const isSignPath = (path) => [routesConfig.signInPath, routesConfig.signOutPath].some((signPath) => path.startsWith(signPath))
const samePath = (requested, finalPath) => finalPath.split('?')[0].replace(/\/$/, '') === requested.split('?')[0].replace(/\/$/, '')
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
      if (!head.finalPath.startsWith(expected)) {
        result.newProblems.push({ kind: 'expect', text: `기대 이동 ${expected} — 실제 ${head.finalPath}` })
        return 'fail'
      }
      continue
    }
    if (expected === 'stay' && moved) {
      result.newProblems.push({ kind: 'expect', text: `이 화면에 머물러야 한다 — 실제 ${head.finalPath}` })
      return 'fail'
    }
    if (isSignPath(head.finalPath) && !isSignPath(target.url)) return 'login'
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
        status: target.url ? 'queued' : 'sample',
        viewports: [],
        problems: [],
        baseProblems: 0
      })
    }
  }
  say(`영향 화면 ${impact.screens.length}개 → 열 화면 ${run.screens.filter((screen) => screen.url).length}개`)
  if (!run.screens.some((screen) => screen.url)) return finish()

  // 작업 트리가 곧 기준 워크트리면 같은 코드라 비교할 게 없고, 한 폴더에 dev 서버 둘은 Next 가 막는다
  const sameAsBase = repoRoot === join(HERMES, '.worktrees', 'bznav-web', 'qa-base')
  if (sameAsBase && !flag('no-base')) say('작업 트리가 기준 워크트리(qa-base)라 전·후 비교를 건너뜀')
  const useBase = !flag('no-base') && !sameAsBase
  if (useBase && !option('base-url')) {
    const config = JSON.parse(readFileSync(join(HERMES, 'hermes.config.json'), 'utf8'))
    const prBase = config.repos.find((repo) => repo.name === 'bznav-web')?.apps?.[appName]?.prBase ?? 'dev'
    const baseRef = option('base') || `origin/${prBase}`
    const baseSha = git(['merge-base', baseRef, 'HEAD'], repoRoot)
    run.base = { ref: baseRef, sha: baseSha.slice(0, 9) }
  }

  // 작업 서버와 기준 서버를 함께 띄운다
  const headUrlPromise = option('head-url') ? Promise.resolve(option('head-url')) : startDevServer(repoRoot, 3291, 'head')
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

  // D7: 저장해 둔 로그인 세션 (login.mjs). localhost 쿠키라 두 포트가 함께 쓴다
  // D7: 저장해 둔 세션(login.mjs) — 프로필마다 하나. localhost 쿠키라 두 포트가 함께 쓴다
  const authFile = profile.session ? join(HERMES, '.qa-auth', `${appName}.${profile.session}.json`) : null
  const hasSession = Boolean(authFile && existsSync(authFile))
  run.profile = profileName
  run.session = hasSession ? 'saved' : 'none'
  if (profile.session && !hasSession) {
    say(`⚠️  프로필 ${profileName} 세션 없음 — node scripts/qa/login.mjs --profile ${profile.session} 로 저장한다. 세션 없이 진행`)
  } else {
    say(`세션 프로필 ${profileName}${profile.note ? ` (${profile.note})` : ''}`)
  }

  run.status = 'running'
  setPhase('화면 검사 중')
  const browser = await chromium.launch(headed ? { headless: false, slowMo: Math.round(slowMs / 3) } : {})
  const contexts = {}
  for (const viewport of routesConfig.viewports) {
    const contextOptions = { viewport: { width: viewport.width, height: viewport.height }, storageState: hasSession ? authFile : undefined, isMobile: viewport.width < 600, locale: 'ko-KR' }
    contexts[viewport.name] = { head: await browser.newContext(contextOptions), base: baseUrl ? await browser.newContext(contextOptions) : null }
  }

  const queue = run.screens.filter((screen) => screen.url)
  let cursor = 0
  const worker = async () => {
    while (cursor < queue.length) {
      const screen = queue[cursor]
      cursor += 1
      const order = cursor
      screen.status = 'running'
      saveRun()
      const slug = screen.key.replace(/[^\w가-힣-]+/g, '_').replace(/^_+|_+$/g, '') || 'root'
      const viewportResults = []
      for (const viewport of routesConfig.viewports) {
        const files = { head: `shots/${slug}.${viewport.name}.head.png`, base: `shots/${slug}.${viewport.name}.base.png`, diff: `shots/${slug}.${viewport.name}.diff.png` }
        const [head, base] = await Promise.all([
          visit(contexts[viewport.name].head, headUrl, screen.url, join(runDir, files.head), `${order}/${queue.length} 작업 · ${viewport.name}`),
          baseUrl ? visit(contexts[viewport.name].base, baseUrl, screen.url, join(runDir, files.base), `${order}/${queue.length} 기준 · ${viewport.name}`) : Promise.resolve(null)
        ])
        // 기준 화면에도 있던 에러는 이번 변경 탓이 아니다 — 새로 생긴 것만 실패로 센다
        const baseKeys = new Set((base?.problems ?? []).map(problemKey))
        const newProblems = head.problems.filter((problem) => !baseKeys.has(problemKey(problem)))
        const diff = base ? compareShots(join(runDir, files.head), join(runDir, files.base), join(runDir, files.diff)) : null
        viewportResults.push({ viewport: viewport.name, head, base, newProblems, diff })
        screen.viewports.push({
          name: viewport.name,
          shots: { head: files.head, base: base ? files.base : null, diff: diff ? files.diff : null },
          finalPath: head.finalPath,
          baseFinalPath: base?.finalPath ?? null,
          ms: head.ms,
          diff
        })
        saveRun()
      }
      screen.baseProblems = viewportResults.reduce((total, result) => total + result.head.problems.length - result.newProblems.length, 0)
      screen.expect = expectationOf(screen)
      screen.status = judge(screen, viewportResults)
      screen.problems = viewportResults.flatMap((result) => result.newProblems.map((problem) => ({ ...problem, viewport: result.viewport })))
      say(`${statusIcon(screen.status)} ${screen.key}${screen.problems.length ? ` — ${screen.problems[0].text}` : ''}`)
    }
  }
  await Promise.all(Array.from({ length: headed ? 1 : routesConfig.concurrency ?? 3 }, worker))
  await browser.close()
  return finish()
}

const STATUS_ICONS = { pass: '✅', expected: '☑️', changed: '🟡', fail: '❌', redirected: '↪️', login: '🔒', ci: '🪪', sample: '📝' }
const statusIcon = (status) => STATUS_ICONS[status] ?? '·'

function finish() {
  const counts = {}
  for (const screen of run.screens) counts[screen.status] = (counts[screen.status] ?? 0) + 1
  run.summary = counts
  run.status = 'done'
  run.finishedAt = new Date().toISOString()
  setPhase('끝')
  const line = `[${run.profile}] 통과 ${counts.pass ?? 0} · 기대대로 이동 ${counts.expected ?? 0} · 변화 ${counts.changed ?? 0} · 실패 ${counts.fail ?? 0} · 이동됨 ${counts.redirected ?? 0} · 로그인 필요 ${counts.login ?? 0} · 본인인증 필요 ${counts.ci ?? 0} · 샘플 필요 ${counts.sample ?? 0}`
  console.log(`\n📋 QA ${run.id}\n${line}\n결과: ${relative(HERMES, runDir)}/run.json`)
  if (run.plan) writeQaResult(line)
  return counts.fail ? 1 : 0
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
