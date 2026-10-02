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

const QA_DIR = dirname(fileURLToPath(import.meta.url))
const HERMES = join(QA_DIR, '..', '..')
const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] ?? '' : ''
}

const appName = option('app') || 'refund-web'
const routesConfig = JSON.parse(readFileSync(join(QA_DIR, 'routes', `${appName}.json`), 'utf8'))
const origin = option('url') || 'http://localhost:3291'
const authDir = join(HERMES, '.qa-auth')
const profileName = option('profile') || 'login'
const authFile = join(authDir, `${appName}.${profileName}.json`)
const fromFile = option('from') ? join(authDir, `${appName}.${option('from')}.json`) : null
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
  : '🔑 열린 창에서 dev 계정으로 **이메일** 로그인해 주세요(간편로그인은 localhost 로 안 돌아온다). 로그인을 마치고 이 서버 화면으로 돌아오면 저장합니다 (10분 제한)')

// 간편로그인(네이버·카카오)은 외부 로그인 페이지 → SSO 서버를 거쳐 이 서버로 돌아온다.
// 외부 페이지로 나간 순간이 아니라, 이 서버로 돌아와 로그인 화면이 아닐 때 끝난 것으로 본다
const isSignedInPage = (url) => url.origin === new URL(origin).origin && !url.pathname.startsWith('/auth/')
try {
  await page.waitForURL((url) => isSignedInPage(url), { timeout: 10 * 60 * 1000 })
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  mkdirSync(authDir, { recursive: true, mode: 0o700 })
  const state = await context.storageState({ path: authFile })
  chmodSync(authFile, 0o600)
  console.log(`✅ 세션 저장 — .qa-auth/${appName}.${profileName}.json (쿠키 ${state.cookies.length}개 · 값은 출력하지 않음)`)
} catch {
  console.error('⚠️  로그인을 마치지 않았다 — 저장하지 않음')
  process.exitCode = 1
} finally {
  await browser.close()
}
