/**
 * QA 대상(D21) — 실행 전에 고른다.
 *   local  : 내 컴퓨터의 next dev(작업 트리·qa-base 코드) — 이메일 로그인
 *   server : 배포된 서버 — 주소를 그때 입력한다(dev · stg · dev-1~3 · PR 미리보기 …). 입력이 없으면 routes/<앱>.json devUrl.
 *            배포본 코드 · 간편인증도 그 서버로 돌아온다
 * 세션 파일은 서버 주소(호스트)마다 따로(쿠키 도메인·이름이 다르다), 기준 사진은 로컬 / 서버 둘로 나눈다(dev 모드와 빌드본은 화면이 미세하게 다르다).
 * 운영 서버는 막는다 — 호스트에 dev·stg·pr·preview·qa 표시가 없으면 거부(화면을 열기만 해도 나가는 요청이 있다).
 */
import { join } from 'node:path'

// 예전 --target dev 도 서버로 본다
export const normalizeTarget = (value) => (value === 'dev' || value === 'server' ? 'server' : 'local')
const NON_PRODUCTION = /(^|[.-])(dev\d*|dev-\d+|stg|staging|pr-?\d*|preview|qa|test)([.-]|$)|^localhost$|^127\.0\.0\.1$/i

// 서버 주소 확인 — { url, host } 또는 { error }
export function checkServerUrl(value) {
  let url
  try {
    url = new URL(/^https?:\/\//.test(value) ? value : `https://${value}`)
  } catch {
    return { error: `주소 형식이 아니에요 — ${value}` }
  }
  if (!NON_PRODUCTION.test(url.hostname)) return { error: `운영 서버로 보이는 주소예요(${url.hostname}) — QA 는 dev·stg·dev-1~3·PR 미리보기 같은 개발 서버에서만 돌려요` }
  return { url: url.origin, host: url.hostname }
}
// 세션 파일 — 로컬은 <앱>, 서버는 <앱>@<호스트>
export const sessionKeyOf = (app, target, serverUrl) => (normalizeTarget(target) === 'server' ? `${app}@${new URL(serverUrl).hostname}` : app)
export const sessionFileOf = (hermes, app, session, target, serverUrl) => join(hermes, '.qa-auth', `${sessionKeyOf(app, target, serverUrl)}.${session}.json`)
// 기준 사진 — 로컬은 <앱>, 서버는 <앱>@server
export const targetKey = (app, target) => (normalizeTarget(target) === 'server' ? `${app}@server` : app)
export const TARGET_LABEL = { local: '🖥 로컬 서버', server: '☁️ 서버' }
