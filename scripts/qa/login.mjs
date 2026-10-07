#!/usr/bin/env node
/**
 * QA 로그인 세션 저장 (D7) — 브라우저 창을 띄우면 사용자가 dev 계정으로 직접 로그인한다.
 * 로그인이 끝나면(간편로그인이면 외부 페이지를 거쳐 이 서버로 돌아와 로그인 화면이 아닐 때) 쿠키·저장소를 .qa-auth/<앱>.json 에 저장한다. run.mjs 가 재사용한다.
 *
 *   node scripts/qa/login.mjs [--app refund-web] [--url http://localhost:3291] [--profile login]
 *   node scripts/qa/login.mjs --profile verified --from login --path /auth/ci-request   이어서 본인인증까지 → 다른 프로필로
 *
 *   --profile  저장할 세션 프로필 이름(routes/<앱>.json profiles 의 session). 기본 login
 *   --from     이 프로필 세션을 불러와 시작한다(로그인을 다시 하지 않는다)
 *   --path     처음 열 화면(기본 로그인 화면)
 *   ⚠️ 간편로그인(네이버·카카오)은 SSO 가 localhost 로 돌려보내지 않아(운영 도메인으로 감) 세션이 안 생긴다 — 이메일 로그인으로
 *
 *   --url  떠 있는 dev 서버 (run.mjs --keep-servers 로 남긴 3291, 또는 직접 띄운 3200). localhost 쿠키는 포트와 무관하게 공유된다
 *
 * 비밀번호는 어디에도 저장하지 않는다. 세션 파일은 git 무시·권한 600 이고, 내용(쿠키 값)은 출력하지 않는다.
 */
import { readFileSync, mkdirSync, chmodSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { normalizeTarget, sessionFileOf, sessionKeyOf, checkServerUrl } from './targets.mjs'

const QA_DIR = dirname(fileURLToPath(import.meta.url))
const HERMES = join(QA_DIR, '..', '..')
const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] ?? '' : ''
}

const appName = option('app') || 'refund-web'
const routesConfig = JSON.parse(readFileSync(join(QA_DIR, 'routes', `${appName}.json`), 'utf8'))
// --target server [--server <주소> | --url <주소>] (D21) — 배포된 서버에서 로그인한다. 간편인증도 그 서버로 돌아온다.
// 세션 파일은 서버 주소(호스트)마다 따로. 운영 주소는 거부
const target = option('server') ? 'server' : normalizeTarget(option('target'))
const serverValue = option('server') || option('url') || routesConfig.devUrl
const checked = target === 'server' ? checkServerUrl(serverValue ?? '') : null
if (checked?.error) {
  console.error(`⛔ ${checked.error}`)
  process.exit(2)
}
const origin = target === 'server' ? checked.url : option('url') || 'http://localhost:3291'
const authDir = join(HERMES, '.qa-auth')
const profileName = option('profile') || 'login'
const authFile = sessionFileOf(HERMES, appName, profileName, target, origin)
const fromFile = option('from') ? sessionFileOf(HERMES, appName, option('from'), target, origin) : null
if (fromFile && !existsSync(fromFile)) {
  console.error(`⚠️  --from ${option('from')} 세션이 없다 — 먼저 그 프로필로 로그인한다`)
  process.exit(2)
}

try {
  await fetch(origin, { redirect: 'manual' })
} catch {
  console.error(`⚠️  ${origin} 에 서버가 없다 — run.mjs --keep-servers 로 남기거나 dev 서버를 띄운 뒤 --url 로 준다`)
  process.exit(2)
}

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'ko-KR', storageState: fromFile ?? undefined })
const page = await context.newPage()
await page.goto(`${origin}${option('path') || routesConfig.signInPath}`)
console.log(fromFile
  ? `🔑 ${option('from')} 세션으로 열었습니다. 창에서 남은 단계(본인인증 등)를 마치고 이 서버 화면으로 돌아오면 ${profileName} 로 저장합니다 (10분 제한)`
  : target === 'server'
    ? '🔑 열린 창에서 로그인해 주세요(간편인증 가능). 로그인을 마치고 이 서버 화면으로 돌아오면 저장합니다 (10분 제한)'
    : '🔑 열린 창에서 dev 계정으로 **이메일** 로그인해 주세요(간편로그인은 localhost 로 안 돌아온다). 로그인을 마치고 이 서버 화면으로 돌아오면 저장합니다 (10분 제한)')

// 간편로그인(네이버·카카오)은 외부 로그인 페이지 → SSO 서버를 거쳐 이 서버로 돌아온다.
// 외부 페이지로 나간 순간이 아니라, 이 서버로 돌아와 로그인 화면이 아닐 때 끝난 것으로 본다
// /redirect(간편인증이 code 를 들고 돌아오는 곳)는 아직 토큰을 받기 전이다. 그리고 로그인 토큰 쿠키(B_AT*)가 실제로 생겨야 끝난 것으로 본다
// (2026-10-06 dev 서버 간편인증 — /redirect 에 닿자마자 저장해 토큰 없는 세션이 저장됐다)
// 본인인증 전 세션(프로필 authScreens 가 본인인증 화면 — 예: refund login)은 로그인 뒤 본인인증 화면으로 끌려가는 게 정상이다 — 거기 도착해도 끝난 것으로 본다
const sessionProfile = Object.values(routesConfig.profiles ?? {}).find((settings) => settings?.session === profileName)
const ciEndsLogin = Boolean(routesConfig.ciPath && sessionProfile?.authScreens && String(sessionProfile.authScreens).replace(/^=/, '').startsWith(routesConfig.ciPath))
const isSignedInPage = (url) => url.origin === new URL(origin).origin && !url.pathname.startsWith('/redirect')
  && (!url.pathname.startsWith('/auth/') || (ciEndsLogin && url.pathname.startsWith(routesConfig.ciPath)))
const hasToken = async () => (await context.cookies()).some((cookie) => cookie.name.startsWith('B_AT') && cookie.value)
try {
  const deadline = Date.now() + 10 * 60 * 1000
  // 화면이 로그인 밖이고 토큰 쿠키가 있으며, 그 상태가 2초 동안 유지될 때(중간에 다시 /auth 로 가는 리다이렉트가 끝나게)
  let stableSince = 0
  while (Date.now() < deadline) {
    const ready = !page.isClosed() && isSignedInPage(new URL(page.url())) && (await hasToken())
    if (!ready) stableSince = 0
    else if (!stableSince) stableSince = Date.now()
    else if (Date.now() - stableSince >= 2000) break
    if (page.isClosed()) throw new Error('창이 닫혔다')
    await page.waitForTimeout(500)
  }
  if (!stableSince || Date.now() >= deadline) throw new Error('시간 초과')
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  mkdirSync(authDir, { recursive: true, mode: 0o700 })
  const state = await context.storageState({ path: authFile })
  chmodSync(authFile, 0o600)
  console.log(`✅ 세션 저장 — .qa-auth/${sessionKeyOf(appName, target, origin)}.${profileName}.json (쿠키 ${state.cookies.length}개 · 값은 출력하지 않음)`)
} catch {
  console.error('⚠️  로그인을 마치지 않았다 — 저장하지 않음')
  process.exitCode = 1
} finally {
  await browser.close()
}
