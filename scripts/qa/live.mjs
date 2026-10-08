/**
 * 실시간 호출 기록 — QA 브라우저가 보내는 API 호출(GraphQL 연산·보낸 값·응답 상태, REST)과 트래킹 이벤트를
 * .qa-runs/<런>/live.jsonl 에 한 줄씩 쌓는다. 현황판 /qa-live?id=<런> 창이 이 파일을 따라 읽어 옆에서 보여 준다.
 *
 *   const live = createLiveLog(runDir)
 *   live.attach(context, 'desktop')     그 컨텍스트의 호출을 기록
 *   live.write({ kind: 'event', … })    직접 한 줄
 *   requestTags.set(request, '더미')     route 로 더미·막은 요청에 꼬리표(scenario.mjs)
 *   await startScreencast(page, runDir, 'desktop')   창 없이 도는 페이지의 화면을 live/<칸>.jpg(+ .json 주소)로 계속 덮어쓴다 — /qa-live 가 그린다
 *
 * 헤더(토큰)는 기록하지 않는다. 보낸 값 중 비밀번호·토큰·주민번호 같은 키는 *** 로 가린다.
 */
import { appendFileSync, mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const requestTags = new WeakMap()

// 기록하지 않는 외부 수집기·위젯 — Mixpanel 은 tracking.mjs 가 이벤트로 따로 남긴다
const NOISE_HOST = /mixpanel|google|doubleclick|facebook|tiktok|clarity|bing|channel\.io|airbridge|abr\.ge|datadoghq|browser-intake|naver\.(com|net)|kakao|moloco|sentry|hotjar|vercel-insights|daum\.net|ipify\.org/
const STATIC_FILE = /\.(svg|png|jpe?g|gif|webp|ico|woff2?|ttf|css|js|map|json)$/i
const SECRET_KEY = /password|passwd|token|secret|resident|jumin|ssn|card(number|no)|cvc/i

const maskSecrets = (value) => {
  if (Array.isArray(value)) return value.map(maskSecrets)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, SECRET_KEY.test(key) ? '***' : maskSecrets(inner)]))
  return value
}

function describe(request) {
  const url = new URL(request.url())
  let body = null
  try {
    body = request.postDataJSON()
  } catch {
    body = null
  }
  const query = typeof body?.query === 'string' ? body.query : ''
  const operation = query.match(/^\s*(query|mutation|subscription)\s+(\w+)/)
  if (operation) {
    return { kind: 'gql', op: operation[1], name: operation[2], values: JSON.stringify(maskSecrets(body.variables ?? {})).slice(0, 400) }
  }
  return { kind: 'http', method: request.method(), name: `${url.host}${url.pathname}`.slice(0, 160), values: body ? JSON.stringify(maskSecrets(body)).slice(0, 300) : '' }
}

// data 안을 훑어 errors{code,message} 와 result:false 를 모은다 — 개인정보 칸(이름·전화 등)은 보지 않는다
function payloadErrors(node, path = '', found = []) {
  if (!node || typeof node !== 'object' || found.length >= 5) return found
  if (Array.isArray(node)) { node.forEach((item) => payloadErrors(item, path, found)); return found }
  const error = node.errors
  if (error && typeof error === 'object') {
    for (const item of Array.isArray(error) ? error : [error]) if (item && (item.code || item.message)) found.push(`${path ? `${path}: ` : ''}${[item.code, item.message].filter(Boolean).join(' — ')}`)
  } else if (node.result === false && !found.length) found.push(`${path ? `${path}: ` : ''}result false`)
  for (const [key, value] of Object.entries(node)) if (key !== 'errors' && value && typeof value === 'object') payloadErrors(value, key, found)
  return found
}
export function createLiveLog(runDir) {
  const file = join(runDir, 'live.jsonl')
  const write = (entry) => {
    try {
      appendFileSync(file, `${JSON.stringify({ at: Date.now(), ...entry })}\n`)
    } catch {
      // 실시간 기록은 보기용 — 못 써도 검사는 계속한다
    }
  }
  const attach = (context, where) => {
    const record = (request, status, errors = '') => {
      if (!['fetch', 'xhr', 'eventsource'].includes(request.resourceType())) return
      const target = new URL(request.url())
      // next dev 내부 요청(_next·HMR)은 앱 동작이 아니다
      // 아이콘·이미지·글꼴 같은 정적 파일도 API 가 아니다
      if (NOISE_HOST.test(target.host) || target.pathname.startsWith('/_next/') || target.pathname.startsWith('/__nextjs') || STATIC_FILE.test(target.pathname)) return
      write({ where, status, errors, tag: requestTags.get(request) ?? '', page: safePath(request), ...describe(request) })
    }
    // GraphQL 은 실패해도 200 이고 본문 errors 에 담긴다 — 그 메시지를 같이 남긴다
    context.on('response', async (response) => {
      const request = response.request()
      let errors = ''
      if (request.method() === 'POST' && /"query"\s*:\s*"\s*(query|mutation)/.test(request.postData() ?? '')) {
        const body = await response.json().catch(() => null)
        if (Array.isArray(body?.errors) && body.errors.length) errors = body.errors.map((error) => error.message ?? error.code ?? '').join(' | ').slice(0, 300)
        // 결과 안의 업무 오류 — { result: false, errors: { code, message } } 처럼 200·data 안에 담긴 것(간편인증·환급 토큰 등). 코드·메시지만(값은 안 남긴다)
        else if (body?.data) errors = payloadErrors(body.data).join(' | ').slice(0, 300)
      }
      record(request, response.status(), errors)
    })
    context.on('requestfailed', (request) => {
      const failure = request.failure()?.errorText ?? 'failed'
      if (!failure.includes('ERR_ABORTED')) record(request, failure)
    })
  }
  return { write, attach }
}

// 요청을 보낸 화면 경로 — 어느 화면에서 나간 호출인지
function safePath(request) {
  try {
    return new URL(request.frame().url()).pathname
  } catch {
    return ''
  }
}

// 화면 전송(CDP screencast) — 바뀔 때마다 오는 프레임을 0.1초에 한 장까지 live/<칸>.jpg 로 덮어쓴다(반쯤 쓴 파일을 읽지 않게 임시 파일 → 이름 바꾸기)
export async function startScreencast(page, runDir, slot) {
  const dir = join(runDir, 'live')
  mkdirSync(dir, { recursive: true })
  const session = await page.context().newCDPSession(page)
  // 0.1초에 한 장까지(초당 10장) — 사이에 온 마지막 프레임은 버리지 않고 잠시 뒤에 쓴다(멈춘 화면이 옛 프레임으로 남지 않게)
  let lastWrite = 0
  let pending = null
  let timer = null
  const flush = () => {
    timer = null
    if (!pending) return
    const frame = pending
    pending = null
    lastWrite = Date.now()
    try {
      writeFileSync(join(dir, `${slot}.jpg.tmp`), frame)
      renameSync(join(dir, `${slot}.jpg.tmp`), join(dir, `${slot}.jpg`))
      writeFileSync(join(dir, `${slot}.json.tmp`), JSON.stringify({ url: page.url(), at: lastWrite }))
      renameSync(join(dir, `${slot}.json.tmp`), join(dir, `${slot}.json`))
    } catch {
      // 보기용 — 못 써도 검사는 계속한다
    }
  }
  session.on('Page.screencastFrame', ({ data, sessionId }) => {
    session.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    pending = Buffer.from(data, 'base64')
    if (!timer) timer = setTimeout(flush, Math.max(0, 100 - (Date.now() - lastWrite)))
  })
  await session.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: 1280, maxHeight: 1400 }).catch(() => {})
}
