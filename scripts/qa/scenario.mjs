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
 *   { "expectText": "세나의 답변", "nth": 2, "timeout": 120000 }  그 글자가 2번째로 보일 때까지(이어 질문의 두 번째 답변 등) · timeout 은 이 단계만 기다리는 시간(ms)
 *   { "click": "휴대폰 본인인증 하기" }                       이 글자를 가진 요소를 누른다
 *   { "click": { "text": "[필수]", "all": true } }           맞는 것 전부 ("optional": true 면 없을 때 건너뛴다)
 *   { "click": { "role": "button", "name": "확인" } }        역할·이름으로
 *   { "fill": { "label": "이메일", "value": "qa@example.com" } }   (비밀번호 등 비밀 값은 씬에 적지 않는다)
 *   { "mock": { "url": "**\/ci/v2/prepare", "method": "POST", "status": 200, "json": {…} } }
 *                                                            ② 응답 흉내 — 이후 그 요청은 서버에 가지 않고 이 응답을 받는다.
 *                                                            json 안의 "{{origin}}" 은 이 서버 주소로 바뀐다
 *   { "mock": { "url": "**\/chat/guest/completions", "method": "POST", "contentType": "text/event-stream", "body": "data: {…}\n\n" } }
 *                                                            json 대신 body(글자 그대로) — SSE 스트림 답변 흉내 등. contentType 기본은 json 이면 application/json, body 면 text/plain
 *   { "mock": { "operation": "RefundApplyMutation", "json": { "data": {…} } } }
 *                                                            GraphQL 연산 이름으로 고른다(본문 query 의 `mutation RefundApplyMutation`). method 는 POST 로 본다.
 *                                                            브라우저가 보내는 요청만 잡힌다 — getServerSideProps 등 서버에서 보내는 요청은 못 잡는다
 *   { "human": "휴대폰 본인인증을 마쳐 주세요", "untilUrl": "/auth/ci-authentication" }
 *   { "human": "결과를 다 보셨으면 창을 닫아 주세요", "untilClose": true }
 *   { "click": { "role": "button", "name": "다음" }, "when": { "filled": ["홍길동", "YYYY.MM.DD"] } }   ← 그 칸이 다 채워져 있을 때만(아니면 건너뜀)   ← 마지막 단계로 — 사람이 창을 닫으면 통과로 끝
 *                                                            ③ 사람이 끼는 단계 — 보이는 창(--headed)이면 띠를 띄우고 그 경로가 될 때까지(10분) 기다린다.
 *                                                            창 없이 돌면 여기서 멈추고 '사람 필요' 로 끝낸다
 *   { "expectEvent": "more_body_my-info_clicked", "props": { "page": "more" } }
 *                                                            트래킹(Mixpanel) 이벤트가 나갔는지(씬 시작부터 · 5초) — props 는 값이 같아야 한다
 *   { "press": "Enter", "on": { "placeholder": "…" } }       키를 누른다(on 이 있으면 그 요소에서, 없으면 지금 초점) — "Shift+Enter" 처럼 조합도
 *   { "offline": true }                                      네트워크 끊기(false 면 다시 연결)
 *   { "section": "2. 로그인" }                                여정의 구간 표시(동작 없음) — 뒤 단계에 구간 이름이 붙는다
 *   { "session": "verified" }                                 여정 중간에 그 세션(저장된 로그인)으로 이어 가기 — 쿠키를 넣고 다음 goto 부터
 *   { "include": "13-" }                                       다른 씬(파일 이름 앞부분, _draft/ 도 가능)의 단계를 그 자리에 — run.mjs 가 읽을 때 펼친다
 *   "only": "auto" | "real"   (어느 단계·include 에나)          --mode 가 그것일 때만(기본 auto — 응답 흉내, real — 사람이 실제 인증)
 *   "when": { "url": "/auth/ci-request" }                      지금 경로가 이것으로 시작할 때만 · { "text": "…" } 그 글자가 보일 때만 · { "noText": "…" } 안 보일 때만
 *   { "wait": 1000 }                                         기다림(ms)
 *   { "screenshot": "after" }                                스크린샷 한 장(shots/<씬>.<이름>.png)
 *
 * "timeout" 은 goto 를 뺀 모든 단계에 줄 수 있다(기본 15초) — AI 답변처럼 오래 걸리는 단계에만
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

const stepKind = (step) => ['section', 'session', 'goto', 'expectUrl', 'expectText', 'expectEvent', 'click', 'fill', 'press', 'offline', 'mock', 'human', 'wait', 'screenshot'].find((kind) => kind in step)

export const describe = (step) => {
  const kind = stepKind(step)
  const value = step[kind]
  if (kind === 'section') return `▶ 구간 ${value}`
  if (step.label) return step.label
  if (kind === 'session') return `🔑 세션 ${value} 로 이어 가기(저장된 로그인)`
  if (kind === 'click') return `누름 "${typeof value === 'string' ? value : value.text ?? value.name}"${value.all ? ' (전부)' : ''}`
  if (kind === 'fill') return `입력 ${value.label ?? value.placeholder}`
  if (kind === 'press') return `키 ${value}`
  if (kind === 'offline') return value ? '네트워크 끊기' : '네트워크 다시 연결'
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
  let currentSection = ''

  for (const step of scenario.steps ?? []) {
    const kind = stepKind(step)
    const record = { label: describe(step), ok: true, detail: '' }
    steps.push(record)
    // 진행 알림 — 지금 몇 번째 단계인지(현황판·라이브 화면이 따라 그린다)
    options.onStep?.(steps)
    const timeout = step.timeout ?? STEP_TIMEOUT
    // 조건 — "when": { "url": "/auth/ci-request" } 은 지금 화면 경로가 이것으로 시작할 때만(여정에서 본인인증 화면에 왔을 때만 본인인증 구간 등)
    if (step.when?.url && !pathOf(page).startsWith(step.when.url)) {
      record.detail = `지금 ${pathOf(page)} — 조건(${step.when.url}) 아님, 건너뜀`
      options.onStep?.(steps)
      continue
    }
    // 조건 — "when": { "text": "…" } 은 그 글자가 보일 때만, { "noText": "…" } 은 안 보일 때만(계정 상태에 따라 갈라지는 화면)
    if (step.when?.text || step.when?.noText) {
      const wanted = step.when.text ?? step.when.noText
      const visible = await page.getByText(wanted, { exact: false }).first().waitFor({ state: 'visible', timeout: step.when.waitMs ?? 4000 }).then(() => true).catch(() => false)
      if (visible !== Boolean(step.when.text)) {
        record.detail = `"${wanted}" ${visible ? '보임' : '안 보임'} — 조건 아님, 건너뜀`
        options.onStep?.(steps)
        continue
      }
    }
    if (kind === 'section') {
      record.detail = ''
      currentSection = step.section
      options.onStep?.(steps)
      continue
    }
    record.section = currentSection
    // 조건 — "when": { "filled": ["홍길동", …] } 은 그 placeholder 칸이 모두 채워져 있을 때만 이 단계를 한다(미리 채워진 입력이면 대신 누르기)
    if (step.when?.filled) {
      await page.waitForTimeout(step.when.waitMs ?? 1500)
      const values = await Promise.all(step.when.filled.map((placeholder) => page.getByPlaceholder(placeholder).first().inputValue({ timeout: 3000 }).catch(() => '')))
      if (values.some((value) => !String(value).trim())) {
        record.detail = '입력 칸이 비어 있어 건너뜀 — 사람이 직접 입력'
        options.onStep?.(steps)
        continue
      }
    }
    try {
      if (kind === 'session') {
        // 여정 중간에 로그인 상태로 — 저장된 세션(routes profiles 의 session)의 쿠키를 이 창에 넣는다. 다음 goto 부터 그 상태
        const cookies = await options.sessionCookies?.(step.session)
        if (!cookies) throw new Error(`세션 ${step.session} 이 없거나 만료 — 현황판 QA 로그인 세션 줄에서 로그인`)
        await page.context().clearCookies()
        await page.context().addCookies(cookies)
        record.detail = `쿠키 ${cookies.length}개(값은 안 남김)`
      } else if (kind === 'goto') {
        await page.goto(`${options.origin}${step.goto}`, { waitUntil: 'load', timeout: 45000 })
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      } else if (kind === 'expectUrl') {
        await page.waitForURL((url) => `${url.pathname}${url.search}`.startsWith(step.expectUrl), { timeout })
      } else if (kind === 'expectText') {
        await page.getByText(step.expectText, { exact: false }).nth((step.nth ?? 1) - 1).waitFor({ state: 'visible', timeout })
      } else if (kind === 'click') {
        const locator = locatorOf(page, step.click)
        if (step.click.optional && !(await locator.count())) {
          record.detail = '없음 — 건너뜀'
        } else if (step.click.all) {
          await locator.first().waitFor({ state: 'visible', timeout })
          const count = await locator.count()
          for (let index = 0; index < count; index += 1) await locator.nth(index).click({ timeout })
          record.detail = `${count}개`
        } else {
          await locator.first().click({ timeout })
        }
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
      } else if (kind === 'fill') {
        await locatorOf(page, step.fill).first().fill(String(step.fill.value ?? ''), { timeout })
      } else if (kind === 'press') {
        if (step.on) await locatorOf(page, step.on).first().press(step.press, { timeout })
        else await page.keyboard.press(step.press)
      } else if (kind === 'offline') {
        await page.context().setOffline(Boolean(step.offline))
      } else if (kind === 'mock') {
        const mock = step.mock
        const body = (typeof mock.body === 'string' ? mock.body : JSON.stringify(mock.json ?? {})).replaceAll('{{origin}}', options.origin)
        const contentType = mock.contentType ?? (typeof mock.body === 'string' ? 'text/plain' : 'application/json')
        // GraphQL 은 주소가 하나라 본문 query 의 연산 이름(query|mutation <이름>)으로 고른다 — 브라우저에서 나가는 요청만 잡힌다(SSR 요청은 못 잡는다)
        const operationPattern = mock.operation ? new RegExp(`\\b(query|mutation|subscription)\\s+${mock.operation}\\b`) : null
        await page.route(mock.url ?? '**/*', (route) => {
          const request = route.request()
          if ((mock.method ?? (operationPattern ? 'POST' : null)) && request.method() !== (mock.method ?? 'POST')) return route.fallback()
          if (operationPattern && !operationPattern.test(String(graphqlQueryOf(request)))) return route.fallback()
          requestTags.set(request, '흉내')
          return route.fulfill({ status: mock.status ?? 200, contentType, body })
        })
      } else if (kind === 'human') {
        if (!options.headed) {
          record.ok = false
          record.detail = '창 없이 도는 중이라 멈춤 — --headed 로 돌리면 이 단계에서 기다린다'
          status = 'human'
          break
        }
        if (step.untilClose) {
          // 사람이 다 보고 창을 닫을 때까지(또는 대기 시간까지) — 닫으면 통과. 이 뒤 단계는 창이 없어 돌지 않는다
          await options.showBanner(page, `✅ ${step.human}`, 'ok')
          await page.waitForEvent('close', { timeout: HUMAN_TIMEOUT }).catch(() => {})
          record.detail = page.isClosed() ? '사람이 창을 닫음 — 끝' : '대기 시간이 지나 끝'
          break
        }
        await options.showBanner(page, `🙋 ${step.human} — 끝나면 저절로 이어서 확인해요`, 'warn')
        // 기다리는 동안 앱이 오류 안내(팝업·토스트)를 띄우면 안내 띠로 알려 주고 기록한다 — 팝업을 닫고 다시 시도하면 그대로 이어진다
        const deadline = Date.now() + HUMAN_TIMEOUT
        const reached = () => `${new URL(page.url()).pathname}${new URL(page.url()).search}`.startsWith(step.untilUrl ?? '/')
        let lastAlert = ''
        while (!reached()) {
          if (page.isClosed()) throw new Error('창이 닫혔다')
          if (Date.now() > deadline) throw new Error(`${Math.round(HUMAN_TIMEOUT / 60000)}분 안에 끝나지 않았다`)
          const alert = await page.evaluate(() => {
            const pattern = /오류|실패|다시 진행|다시 시도|만료|올바르지/
            const nodes = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="alert"], [role="status"], [data-sonner-toast], [class*="toast" i], [class*="Toast"], [class*="dialog" i]')]
            const text = nodes.map((node) => node.innerText?.trim()).filter(Boolean).find((value) => pattern.test(value)) ?? ''
            return text.replace(/\s+/g, ' ').slice(0, 120)
          }).catch(() => '')
          if (alert && alert !== lastAlert) {
            lastAlert = alert
            problems.push({ kind: 'human-alert', text: `사람 단계 중 앱 오류 안내 — ${alert}` })
            await options.showBanner(page, `⚠️ 앱에 오류 안내가 떴어요: "${alert}" — 팝업을 닫고 다시 시도해 주세요(라이브 화면 호출 목록에 오류 코드가 있어요). ${step.human}`, 'bad')
          } else if (!alert && lastAlert) {
            lastAlert = ''
            await options.showBanner(page, `🙋 ${step.human} — 끝나면 저절로 이어서 확인해요`, 'warn')
          }
          await page.waitForTimeout(1000)
        }
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
