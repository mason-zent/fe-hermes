/**
 * 흐름 씬 실행기 (D10 · D11) — scripts/qa/scenarios/<앱>/*.json 의 단계를 순서대로 실행한다.
 * run.mjs --suite 가 부른다. 화면을 URL 로 바로 여는 스모크와 달리, 클릭·입력·이동을 따라가며 확인한다.
 *
 * 씬 파일 형식
 *   {
 *     "name": "본인인증 실패 처리",            사람이 읽는 이름
 *     "profile": "login",                      세션 프로필(routes/<앱>.json profiles) — 없으면 logout
 *     "viewports": ["desktop"],                돌릴 뷰포트(routes 의 viewports 이름) — 없으면 전부(데스크톱·모바일, 동시에). 사람 단계 씬은 하나만
 *     "why": "인증사가 실패로 돌려보내면 …",    무엇을 지키는 씬인지
 *     "steps": [ … ]
 *   }
 *
 * 단계 (한 단계에 키 하나 + 선택 "label")
 *   { "goto": "/menu" }                                      이 서버 경로로 이동
 *   { "expectUrl": "/auth/sign-" }                           현재(또는 15초 안에 바뀐) 경로가 이것으로 시작해야 한다
 *   { "expectText": "본인인증을 실패했어요" }                 이 글자가 화면에 보여야 한다(15초)
 *   { "click": "휴대폰 본인인증 하기" }                       이 글자를 가진 요소를 누른다
 *   { "click": { "text": "[필수]", "all": true } }           맞는 것 전부 ("optional": true 면 없을 때 건너뛴다)
 *   { "click": { "role": "button", "name": "확인" } }        역할·이름으로
 *   { "fill": { "label": "이메일", "value": "qa@example.com" } }   (비밀번호 등 비밀 값은 씬에 적지 않는다)
 *   { "mock": { "url": "**\/ci/v2/prepare", "method": "POST", "status": 200, "json": {…} } }
 *                                                            ② 응답 흉내 — 이후 그 요청은 서버에 가지 않고 이 응답을 받는다.
 *                                                            json 안의 "{{origin}}" 은 이 서버 주소로 바뀐다
 *   { "mock": { "operation": "RefundApplyMutation", "json": { "data": {…} } } }
 *                                                            GraphQL 연산 이름으로 고른다(본문 query 의 `mutation RefundApplyMutation`). method 는 POST 로 본다.
 *                                                            브라우저가 보내는 요청만 잡힌다 — getServerSideProps 등 서버에서 보내는 요청은 못 잡는다
 *   { "human": "휴대폰 본인인증을 마쳐 주세요", "untilUrl": "/auth/ci-authentication" }
 *                                                            ③ 사람이 끼는 단계 — 보이는 창(--headed)이면 띠를 띄우고 그 경로가 될 때까지(10분) 기다린다.
 *                                                            창 없이 돌면 여기서 멈추고 '사람 필요' 로 끝낸다
 *   { "expectEvent": "more_body_my-info_clicked", "props": { "page": "more" } }
 *                                                            트래킹(Mixpanel) 이벤트가 나갔는지(씬 시작부터 · 5초) — props 는 값이 같아야 한다
 *   { "wait": 1000 }                                         기다림(ms)
 *   { "screenshot": "after" }                                스크린샷 한 장(shots/<씬>.<이름>.png)
 *
 * 안전장치: 씬에서 흉내로 지정하지 않은 GraphQL mutation 은 서버로 보내지 않고 오류 응답으로 막는다(문제 목록에 "막은 mutation" 으로 남는다).
 *          꼭 실제로 보내야 하면 씬에 "allowMutations": ["연산 이름"]
 *
 * 판정: 모든 단계 통과 ✅ pass · 실패한 단계에서 멈춤 ❌ fail · 사람 단계에서 멈춤 🙋 human
 */
import { join } from 'node:path'
import { eventsSince, HIDE_EVENT_PANEL } from './tracking.mjs'
import { requestTags } from './live.mjs'

const STEP_TIMEOUT = 15000
const HUMAN_TIMEOUT = 10 * 60 * 1000

const stepKind = (step) => ['goto', 'expectUrl', 'expectText', 'expectEvent', 'click', 'fill', 'mock', 'human', 'wait', 'screenshot'].find((kind) => kind in step)

export const describe = (step) => {
  if (step.label) return step.label
  const kind = stepKind(step)
  const value = step[kind]
  if (kind === 'click') return `누름 "${typeof value === 'string' ? value : value.text ?? value.name}"${value.all ? ' (전부)' : ''}`
  if (kind === 'fill') return `입력 ${value.label ?? value.placeholder}`
  if (kind === 'mock') return value.operation ? `응답 흉내 GraphQL ${value.operation} → ${value.status ?? 200}` : `응답 흉내 ${value.method ?? '*'} ${value.url} → ${value.status ?? 200}`
  if (kind === 'human') return `🙋 ${value}`
  if (kind === 'expectEvent') return `📊 이벤트 ${value}${step.props ? ` (${Object.entries(step.props).map(([key, inner]) => `${key}=${inner}`).join(', ')})` : ''}`
  return `${kind} ${typeof value === 'string' || typeof value === 'number' ? value : ''}`.trim()
}

function locatorOf(page, target) {
  if (typeof target === 'string') return page.getByText(target, { exact: false })
  if (target.role) return page.getByRole(target.role, target.name ? { name: target.name } : {})
  if (target.label) return page.getByLabel(target.label)
  if (target.placeholder) return page.getByPlaceholder(target.placeholder)
  return page.getByText(target.text, { exact: false })
}

const pathOf = (page) => {
  const url = new URL(page.url())
  return `${url.pathname}${url.search}`
}

/**
 * @param {import('playwright').BrowserContext} context  프로필 세션이 들어 있는 컨텍스트
 * @param {{ origin: string, slug: string, runDir: string, headed: boolean, showBanner: Function, hideBanner: Function }} options
 */
// 보이는 창 자리 — 창끼리 겹치지 않게 run.mjs 가 정한 자리(context.__qaPlace)로 옮긴다
// 요청 본문의 GraphQL query 글자 — JSON 이 아니면 빈 글자
function graphqlQueryOf(request) {
  try {
    return request.postDataJSON()?.query ?? ''
  } catch {
    return ''
  }
}

// 흉내로 지정하지 않은 GraphQL mutation 을 서버에 보내지 않고 오류 응답으로 막는다 — page 또는 context 에 건다.
// 나중에 등록한 route(씬의 mock)가 먼저 잡으므로, 여기에는 흉내가 없는 것만 온다
export async function guardMutations(target, onBlocked, allowList = []) {
  const allowed = new Set(allowList)
  await target.route('**/*', (route) => {
    const request = route.request()
    const operation = request.method() === 'POST' ? String(graphqlQueryOf(request)).match(/^\s*mutation\s+(\w+)/)?.[1] : null
    if (!operation || allowed.has(operation)) return route.fallback()
    onBlocked(operation)
    requestTags.set(request, '막음')
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ errors: [{ message: `QA 가 막은 mutation ${operation}` }] }) })
  })
}

export async function placeWindow(page) {
  const place = page.context().__qaPlace
  if (!place) return
  try {
    const session = await page.context().newCDPSession(page)
    const { windowId } = await session.send('Browser.getWindowForTarget')
    await session.send('Browser.setWindowBounds', { windowId, bounds: { left: place.left, top: place.top, width: place.width + 16, height: place.height + 90 } })
    await session.detach()
  } catch {
    // 창 위치는 보기 편하게 하는 것뿐 — 못 옮겨도 검사는 계속한다
  }
}

export async function runScenario(context, scenario, options) {
  const page = await context.newPage()
  await placeWindow(page)
  await options.onPage?.(page)
  // 씬이 지나간 화면(경로) — 주소로 바로 못 여는 화면을 "흐름에서 확인" 으로 잇는 데 쓴다(run.mjs linkFlows)
  const visited = []
  page.on('framenavigated', (frame) => {
    if (frame !== page.mainFrame()) return
    const path = new URL(page.url()).pathname
    if (path !== 'blank' && visited.at(-1) !== path) visited.push(path)
  })
  const problems = []
  page.on('pageerror', (error) => problems.push({ kind: 'pageerror', text: String(error.message).slice(0, 300) }))
  const steps = []
  const shots = []
  // 안전장치 — 흉내로 지정하지 않은 GraphQL mutation 은 서버에 보내지 않는다(신청·인증 요청·알림톡이 실제로 나가지 않게).
  // 뒤에 등록한 mock 이 먼저 잡고, 못 잡은 것만 여기로 온다. 씬에 "allowMutations": ["이름"] 이면 그것만 통과
  await guardMutations(page, (operation) => problems.push({ kind: 'blocked', text: `막은 mutation ${operation} — 흉내(mock operation)가 없어 서버에 보내지 않았다` }), scenario.allowMutations)
  let status = 'pass'

  for (const step of scenario.steps ?? []) {
    const kind = stepKind(step)
    const record = { label: describe(step), ok: true, detail: '' }
    steps.push(record)
    // 진행 알림 — 지금 몇 번째 단계인지(현황판·라이브 화면이 따라 그린다)
    options.onStep?.(steps)
    try {
      if (kind === 'goto') {
        await page.goto(`${options.origin}${step.goto}`, { waitUntil: 'load', timeout: 45000 })
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      } else if (kind === 'expectUrl') {
        await page.waitForURL((url) => `${url.pathname}${url.search}`.startsWith(step.expectUrl), { timeout: STEP_TIMEOUT })
      } else if (kind === 'expectText') {
        await page.getByText(step.expectText, { exact: false }).first().waitFor({ state: 'visible', timeout: STEP_TIMEOUT })
      } else if (kind === 'click') {
        const locator = locatorOf(page, step.click)
        if (step.click.optional && !(await locator.count())) {
          record.detail = '없음 — 건너뜀'
        } else if (step.click.all) {
          await locator.first().waitFor({ state: 'visible', timeout: STEP_TIMEOUT })
          const count = await locator.count()
          for (let index = 0; index < count; index += 1) await locator.nth(index).click({ timeout: STEP_TIMEOUT })
          record.detail = `${count}개`
        } else {
          await locator.first().click({ timeout: STEP_TIMEOUT })
        }
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
      } else if (kind === 'fill') {
        await locatorOf(page, step.fill).first().fill(String(step.fill.value ?? ''), { timeout: STEP_TIMEOUT })
      } else if (kind === 'mock') {
        const mock = step.mock
        const body = JSON.stringify(mock.json ?? {}).replaceAll('{{origin}}', options.origin)
        // GraphQL 은 주소가 하나라 본문 query 의 연산 이름(query|mutation <이름>)으로 고른다 — 브라우저에서 나가는 요청만 잡힌다(SSR 요청은 못 잡는다)
        const operationPattern = mock.operation ? new RegExp(`\\b(query|mutation|subscription)\\s+${mock.operation}\\b`) : null
        await page.route(mock.url ?? '**/*', (route) => {
          const request = route.request()
          if ((mock.method ?? (operationPattern ? 'POST' : null)) && request.method() !== (mock.method ?? 'POST')) return route.fallback()
          if (operationPattern && !operationPattern.test(String(graphqlQueryOf(request)))) return route.fallback()
          requestTags.set(request, '흉내')
          return route.fulfill({ status: mock.status ?? 200, contentType: 'application/json', body })
        })
      } else if (kind === 'human') {
        if (!options.headed) {
          record.ok = false
          record.detail = '창 없이 도는 중이라 멈춤 — --headed 로 돌리면 이 단계에서 기다린다'
          status = 'human'
          break
        }
        await options.showBanner(page, `🙋 ${step.human} — 끝나면 저절로 이어서 확인해요`, 'warn')
        await page.waitForURL((url) => `${url.pathname}${url.search}`.startsWith(step.untilUrl ?? '/'), { timeout: HUMAN_TIMEOUT })
        await options.hideBanner(page)
      } else if (kind === 'expectEvent') {
        // 씬 시작부터 나간 Mixpanel 이벤트 중 이름(과 props 의 값)이 맞는 것이 5초 안에 있어야 한다
        const matches = () => (page.__qaEvents ?? []).some((event) => event.name === step.expectEvent && Object.entries(step.props ?? {}).every(([key, value]) => String(event.props[key]) === String(value)))
        const deadline = Date.now() + 5000
        while (!matches() && Date.now() < deadline) await page.waitForTimeout(200)
        if (!matches()) {
          const names = [...new Set((page.__qaEvents ?? []).map((event) => event.name))].slice(-8).join(', ')
          throw new Error(`이벤트 ${step.expectEvent} 가 안 나갔다 — 나간 것: ${names || '없음'}`)
        }
      } else if (kind === 'wait') {
        await page.waitForTimeout(Number(step.wait) || 500)
      } else if (kind === 'screenshot') {
        const file = `shots/${options.slug}.${step.screenshot}.png`
        await page.screenshot({ path: join(options.runDir, file), fullPage: true, animations: 'disabled', caret: 'hide', style: HIDE_EVENT_PANEL })
        shots.push({ name: step.screenshot, file })
      } else {
        throw new Error(`모르는 단계: ${JSON.stringify(step).slice(0, 80)}`)
      }
      if (!record.detail) record.detail = pathOf(page)
    } catch (error) {
      record.ok = false
      record.detail = `${String(error.message).split('\n')[0].slice(0, 200)} · 지금 ${pathOf(page)}`
      status = 'fail'
      break
    }
  }
  // 실패·멈춘 순간의 화면을 남긴다
  if (status !== 'pass') {
    const file = `shots/${options.slug}.stopped.png`
    await page.screenshot({ path: join(options.runDir, file), fullPage: false, style: HIDE_EVENT_PANEL }).catch(() => {})
    shots.push({ name: '멈춘 화면', file })
  }
  options.onStep?.(steps)
  await page.close()
  return { status, steps, shots, problems, events: eventsSince(page, 0), visited }
}
