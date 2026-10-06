/**
 * 트래킹 이벤트 가로채기 — 브라우저에서 Mixpanel 로 나가는 요청을 잡아 이벤트 이름·속성을 모은다.
 * 실제 전송은 막는다(QA 가 dev Mixpanel 프로젝트 데이터를 더럽히지 않게). 보이는 창이면 오른쪽 아래 패널에 실시간으로 띄운다.
 *
 *   await captureTracking(context, { headed, onEvent })   컨텍스트에 건다 — onEvent(이름, 줄인 속성, page) 는 실시간 기록용
 *   page.__qaEvents                              그 페이지에서 잡힌 이벤트 [{ name, props, at }] — 화면·씬이 시작 위치를 기억해 잘라 쓴다
 *
 * 이벤트 이름 규칙(@repo/tracking-service EventTrackingProvider): sendClickEvent → <이름>_clicked · sendViewEvent → <이름>_viewed ·
 * sendScrollEvent → _scrolled · sendRequestEvent → _request
 */

const MIXPANEL = /^https:\/\/api(-js)?\.mixpanel\.com\/(track|engage|groups)/
// 패널·리포트에 보일 속성에서 뺀다 — Mixpanel 기본값·식별자 + 모든 이벤트에 붙는 공통 속성(MixpanelService commonAttributes).
// user_email 같은 개인정보도 여기서 빠져 run.json·리포트에 남지 않는다. page 는 어느 화면 이벤트인지 보여서 남긴다
const NOISE_KEY = /^(\$|mp_|utm_)|^(token|distinct_id|time|is_server|zenv|app_id|client_id|session_id|client_session_id|landing_id|user_email|user_access_type)$/
export const EVENT_PANEL_ID = '__hermes_qa_events'
// 스크린샷에서 패널을 숨기는 스타일(page.screenshot 의 style 옵션)
export const HIDE_EVENT_PANEL = `#${EVENT_PANEL_ID} { display: none !important; }`

// 요청 본문 → 이벤트 배열. data=<JSON 또는 base64 JSON>(폼) 또는 JSON 본문
function decodeEvents(request) {
  const body = request.postData() ?? ''
  const raw = body.trimStart().startsWith('[') || body.trimStart().startsWith('{') ? body : new URLSearchParams(body).get('data') ?? ''
  for (const text of [raw, Buffer.from(raw, 'base64').toString('utf8')]) {
    try {
      const parsed = JSON.parse(text)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      // 다음 해석 방식으로
    }
  }
  return []
}

const cleanProps = (properties = {}) => Object.fromEntries(Object.entries(properties).filter(([key]) => !NOISE_KEY.test(key)))

const shortProps = (props) =>
  Object.entries(props)
    .slice(0, 3)
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join(' ')
    .slice(0, 90)

// 오른쪽 아래 패널에 한 줄 — 6초 뒤 사라지고 최근 8줄만 둔다
async function showEvent(page, line) {
  await page
    .evaluate(
      ({ id, text }) => {
        let box = document.getElementById(id)
        if (!box) {
          box = document.createElement('div')
          box.id = id
          Object.assign(box.style, {
            position: 'fixed', right: '8px', bottom: '8px', zIndex: '2147483647', width: 'min(380px, 94vw)',
            display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'none', font: '12px/1.4 ui-monospace, Menlo, monospace'
          })
          document.documentElement.appendChild(box)
        }
        const row = document.createElement('div')
        row.textContent = text
        Object.assign(row.style, {
          background: 'rgba(91, 33, 182, 0.93)', color: '#fff', padding: '5px 8px', borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0,0,0,.25)', transition: 'opacity .4s', wordBreak: 'break-all'
        })
        box.appendChild(row)
        while (box.children.length > 8) box.firstChild.remove()
        setTimeout(() => {
          row.style.opacity = '0'
          setTimeout(() => row.remove(), 500)
        }, 6000)
      },
      { id: EVENT_PANEL_ID, text: line }
    )
    .catch(() => {})
}

export async function captureTracking(context, { headed, onEvent }) {
  await context.route(MIXPANEL, async (route) => {
    const request = route.request()
    let page = null
    try {
      page = request.frame().page()
    } catch {
      page = null
    }
    const kind = request.url().match(MIXPANEL)[2]
    // engage(사용자 프로필 갱신)·groups 는 막기만 하고 목록에는 넣지 않는다 — 화면 동작과 무관하고 개인정보가 담긴다
    for (const event of kind === 'track' ? decodeEvents(request) : []) {
      const name = String(event.event ?? '')
      if (!name) continue
      const props = cleanProps(event.properties)
      if (page) (page.__qaEvents ??= []).push({ name, props, at: Date.now() })
      onEvent?.(name, shortProps(props), page)
      if (page && headed) await showEvent(page, `📊 ${name}${Object.keys(props).length ? ` · ${shortProps(props)}` : ''}`)
    }
    // verbose=1 이면 JSON 응답을 기대한다
    const verbose = new URL(request.url()).searchParams.get('verbose') === '1'
    return route.fulfill({ status: 200, contentType: verbose ? 'application/json' : 'text/plain', body: verbose ? '{"status":1,"error":null}' : '1' })
  })
}

// 외부 수집 스크립트·픽셀 — QA 에서는 보내지 않는다(분석 데이터 오염 방지 · 계속 이어지는 요청 때문에 networkidle 이 15초씩 걸리던 것).
// 화면에 보이는 위젯(채널톡 등)은 화면의 일부라 막지 않는다. Mixpanel 은 위 captureTracking 이 따로 잡는다
const THIRD_PARTY = /^https:\/\/([\w-]+\.)*(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|googlesyndication\.com|clarity\.ms|datadoghq\.com|facebook\.(com|net)|tiktok\.com|tiktokw\.us|bing\.com|wcs\.naver\.(com|net)|moloco\.com)\/|^https:\/\/www\.google\.com\/(ccm|rmkt|pagead)\//
export async function blockThirdParty(context) {
  await context.route(THIRD_PARTY, (route) => {
    const type = route.request().resourceType()
    if (type === 'script') return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    return route.fulfill({ status: 204, body: '' })
  })
}

// 잡힌 이벤트 중 from 번째부터 — 리포트·현황판에는 이름과 줄인 속성만
export const eventsSince = (page, from) => (page.__qaEvents ?? []).slice(from).map(({ name, props }) => ({ name, props: shortProps(props) }))
