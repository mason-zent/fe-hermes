/**
 * 흐름 씬 실행기 (D10 · D11) — scripts/qa/scenarios/<앱>/*.json 의 단계를 순서대로 실행한다.
 * run.mjs --suite 가 부른다. 화면을 URL 로 바로 여는 스모크와 달리, 클릭·입력·이동을 따라가며 확인한다.
 *
 * 씬 파일 형식
 *   {
 *     "name": "본인인증 실패 처리",            사람이 읽는 이름
 *     "profile": "login",                      세션 프로필(routes/<앱>.json profiles) — 없으면 logout
 *     "viewport": "mobile",                    routes 의 viewports 이름 — 없으면 첫 번째
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
 *   { "human": "휴대폰 본인인증을 마쳐 주세요", "untilUrl": "/auth/ci-authentication" }
 *                                                            ③ 사람이 끼는 단계 — 보이는 창(--headed)이면 띠를 띄우고 그 경로가 될 때까지(10분) 기다린다.
 *                                                            창 없이 돌면 여기서 멈추고 '사람 필요' 로 끝낸다
 *   { "wait": 1000 }                                         기다림(ms)
 *   { "screenshot": "after" }                                스크린샷 한 장(shots/<씬>.<이름>.png)
 *
 * 판정: 모든 단계 통과 ✅ pass · 실패한 단계에서 멈춤 ❌ fail · 사람 단계에서 멈춤 🙋 human
 */
import { join } from 'node:path'

const STEP_TIMEOUT = 15000
const HUMAN_TIMEOUT = 10 * 60 * 1000

const stepKind = (step) => ['goto', 'expectUrl', 'expectText', 'click', 'fill', 'mock', 'human', 'wait', 'screenshot'].find((kind) => kind in step)

const describe = (step) => {
  if (step.label) return step.label
  const kind = stepKind(step)
  const value = step[kind]
  if (kind === 'click') return `누름 "${typeof value === 'string' ? value : value.text ?? value.name}"${value.all ? ' (전부)' : ''}`
  if (kind === 'fill') return `입력 ${value.label ?? value.placeholder}`
  if (kind === 'mock') return `응답 흉내 ${value.method ?? '*'} ${value.url} → ${value.status ?? 200}`
  if (kind === 'human') return `🙋 ${value}`
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
export async function runScenario(context, scenario, options) {
  const page = await context.newPage()
  const problems = []
  page.on('pageerror', (error) => problems.push({ kind: 'pageerror', text: String(error.message).slice(0, 300) }))
  const steps = []
  const shots = []
  let status = 'pass'

  for (const step of scenario.steps ?? []) {
    const kind = stepKind(step)
    const record = { label: describe(step), ok: true, detail: '' }
    steps.push(record)
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
        await page.route(mock.url, (route) => {
          if (mock.method && route.request().method() !== mock.method) return route.fallback()
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
      } else if (kind === 'wait') {
        await page.waitForTimeout(Number(step.wait) || 500)
      } else if (kind === 'screenshot') {
        const file = `shots/${options.slug}.${step.screenshot}.png`
        await page.screenshot({ path: join(options.runDir, file), fullPage: true, animations: 'disabled', caret: 'hide' })
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
    await page.screenshot({ path: join(options.runDir, file), fullPage: false }).catch(() => {})
    shots.push({ name: '멈춘 화면', file })
  }
  await page.close()
  return { status, steps, shots, problems }
}
