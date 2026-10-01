#!/usr/bin/env node
/**
 * 정식 계획서의 결정 콘솔 html 을 만들거나 md 와 맞춘다.
 *
 *   node scripts/plan-html.mjs <plans/…md> --data <PLAN.json>   # 처음 만들 때 (docs/plan-template.html 복사)
 *   node scripts/plan-html.mjs <plans/…md> [--data <PLAN.json>] # 이미 있으면 plan-md 를 md 로 다시 맞추고, --data 가 있으면 PLAN 도 바꾼다
 *   node scripts/plan-html.mjs <plans/…md> --add <결정.json>    # 리뷰 뒤 결정을 덧붙인다 — 기존 결정(확정분은 잠긴 채)은 두고 새 결정만 연다.
 *                                                               html 이 없으면(경량 계획서) 템플릿으로 새로 만든다. 결정.json 은 decisions[] 배열(또는 { decisions: [] })
 *   node scripts/plan-html.mjs <plans/…md> --decide r1='<label>' [r2='<label>' …]  # 확정을 기록한다 — 그 id 에만 decided 를 채우고 나머지는 그대로
 *                                                               (--data 로 PLAN 전체를 바꾸면 기존 결정이 지워진다 — 확정에는 이걸 쓴다)
 *   옵션 --pane <id> : [이대로 진행] 이 보낼 pane(계획서를 만든 헤르메스, 리뷰 뒤 결정이면 그 작업 에이전트). 없으면 PLAN.hermesPane → 없으면 `herdr pane current`
 *
 * PLAN.json 은 title·type·scope·summary·decisions[] (형식은 docs/plan-template.html 헤더 주석). mdFile 은 자동으로 채운다.
 * 치환은 헤더 주석이 끝난 뒤에서만 한다 — 주석 안의 블록 이름까지 바꾸면 PLAN 이 주석에 갇혀 빈 화면이 된다.
 * 만든 뒤 `scripts/board.sh open <md>` 로 현황판 주소로 연다.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] ?? '' : ''
}
const mdArg = argv.find((arg) => arg.endsWith('.md'))
if (!mdArg) {
  console.error('사용: node scripts/plan-html.mjs <plans/…md> [--data <PLAN.json>] [--pane <id>]')
  process.exit(1)
}
const mdPath = resolve(mdArg)
const mdFile = relative(ROOT, mdPath)
if (!mdFile.startsWith('plans/') || !existsSync(mdPath)) {
  console.error(`⚠️  plans/ 안의 md 가 아니거나 없다: ${mdArg}`)
  process.exit(1)
}
const htmlPath = mdPath.replace(/\.md$/, '.html')
const dataPath = option('data')
const addPath = option('add')
// --decide 뒤의 id=label 들 (다음 -- 옵션 전까지)
const decideIndex = argv.indexOf('--decide')
const decides = []
if (decideIndex >= 0) {
  for (const arg of argv.slice(decideIndex + 1)) {
    if (arg.startsWith('--')) break
    decides.push(arg)
  }
}
if (decideIndex >= 0 && (!decides.length || decides.some((pair) => !/^[^=]+=.+/.test(pair)))) {
  console.error("⚠️  --decide 는 id='label' 형식이다 (예: --decide r1='A 유지' r2='B 되돌림')")
  process.exit(1)
}
if (decides.length && !existsSync(htmlPath)) {
  console.error('⚠️  html 이 없다 — --decide 는 결정 콘솔이 있는 계획서에만 쓴다')
  process.exit(1)
}
if (!existsSync(htmlPath) && !dataPath && !addPath) {
  console.error('⚠️  html 이 없다 — 처음 만들 때는 --data <PLAN.json> (리뷰 뒤 결정이면 --add <결정.json>) 이 필요하다')
  process.exit(1)
}

const source = readFileSync(existsSync(htmlPath) ? htmlPath : join(ROOT, 'docs/plan-template.html'), 'utf8')
const commentEnd = source.indexOf('-->') + 3
const head = source.slice(0, commentEnd)
let body = source.slice(commentEnd)

const planBlock = /(<script id="plan-data">\n)const PLAN = ([\s\S]*?)\n(<\/script>)/
const current = body.match(planBlock)
if (!current) {
  console.error('⚠️  html 에서 PLAN 블록을 찾지 못했다')
  process.exit(1)
}
let plan
if (dataPath) {
  plan = JSON.parse(readFileSync(dataPath, 'utf8'))
} else if (existsSync(htmlPath)) {
  plan = new Function(`return (${current[2]})`)()
} else {
  // 경량 계획서에 처음 결정 콘솔을 붙일 때 — 제목은 md 의 첫 제목
  const title = readFileSync(mdPath, 'utf8').match(/^#\s+(.+)$/m)?.[1] ?? mdFile
  plan = { title, type: 'task', scope: '-', summary: '리뷰 뒤 다시 결정할 사항', decisions: [] }
}
if (addPath) {
  const added = JSON.parse(readFileSync(addPath, 'utf8'))
  const list = Array.isArray(added) ? added : added.decisions ?? []
  // 콘솔은 id·title·options[].label 로 동작한다 — 빠지면 바로 거부
  const broken = list.find((decision) => !decision?.id || !decision.title || !Array.isArray(decision.options) || !decision.options.length || decision.options.some((item) => !item?.label))
  if (broken) {
    console.error(`⚠️  결정 형식이 틀렸다 — id·title·options[{label}] 가 필요하다: ${JSON.stringify(broken).slice(0, 120)}`)
    process.exit(1)
  }
  // 리뷰를 두 번 돌면 reviewer 는 다시 R1 부터 매긴다 — 겹치는 r 번호는 다음 빈 번호로 바꾼다
  const taken = new Set((plan.decisions ?? []).map((decision) => decision.id))
  const nextReviewId = () => {
    let number = 1
    while (taken.has(`r${number}`)) number += 1
    return `r${number}`
  }
  for (const decision of list) {
    if (taken.has(decision.id)) {
      if (!/^r\d+$/i.test(decision.id)) {
        console.error(`⚠️  결정 id 가 겹친다: ${decision.id} — 다른 id 로 다시`)
        process.exit(1)
      }
      const renamed = nextReviewId()
      console.log(`   ${decision.id} → ${renamed} (이미 있는 번호라 바꿨다 — 제목의 번호도 확인)`)
      decision.title = decision.title.replace(new RegExp(`^${decision.id}\\b`, 'i'), renamed.toUpperCase())
      decision.id = renamed
    }
    taken.add(decision.id)
  }
  plan.decisions = [...(plan.decisions ?? []), ...list]
}
for (const pair of decides) {
  const [id, ...rest] = pair.split('=')
  const label = rest.join('=')
  const decision = (plan.decisions ?? []).find((item) => item.id === id)
  if (!decision) {
    console.error(`⚠️  그런 결정이 없다: ${id} (있는 것: ${(plan.decisions ?? []).map((item) => item.id).join(', ')})`)
    process.exit(1)
  }
  if (!decision.options.some((item) => item.label === label)) console.log(`   ${id}: '${label}' 는 선택지 label 과 다르다 — 그대로 기록한다`)
  decision.decided = label
}
plan.mdFile = mdFile

const currentPane = () => {
  try {
    return JSON.parse(execFileSync('herdr', ['pane', 'current'], { encoding: 'utf8' })).result.pane.pane_id
  } catch {
    return ''
  }
}
const previousPane = (() => {
  try {
    return new Function(`return (${current[2]})`)().hermesPane ?? ''
  } catch {
    return ''
  }
})()
// 리뷰 뒤 결정(--add)은 그 결정을 덧붙인 pane(작업 에이전트)으로 보낸다 — 처음 계획서를 만든 헤르메스가 아니라
plan.hermesPane = addPath
  ? option('pane') || currentPane() || plan.hermesPane || previousPane
  : option('pane') || plan.hermesPane || previousPane || currentPane()

// PLAN 안의 < 는 \u003c 로 — 문자열에 </script> 가 있어도 블록이 끊기지 않게
const planJson = JSON.stringify(plan, null, 2).replace(/</g, '\\u003c')
body = body.replace(planBlock, (_, open, __, close) => `${open}const PLAN = ${planJson}\n${close}`)
// 본문 안의 닫는 태그(대소문자 변형 포함)가 블록을 끊지 않게 — commit.sh 와 같은 방식
const markdown = readFileSync(mdPath, 'utf8').replace(/<\/(script)/gi, '<\\/$1')
body = body.replace(/(<script id="plan-md" type="text\/markdown">\n)[\s\S]*?(<\/script>)/, (_, open, close) => `${open}${markdown}\n${close}`)
writeFileSync(htmlPath, head + body)

const decided = (plan.decisions ?? []).filter((decision) => decision.decided != null).length
console.log(`${relative(ROOT, htmlPath)} · 결정 ${decided}/${plan.decisions?.length ?? 0} 확정 · 보낼 pane ${plan.hermesPane || '(없음 — 복사로만)'}`)
