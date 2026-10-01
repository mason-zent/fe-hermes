#!/usr/bin/env node
/**
 * 정식 계획서의 결정 콘솔 html 을 만들거나 md 와 맞춘다.
 *
 *   node scripts/plan-html.mjs <plans/…md> --data <PLAN.json>   # 처음 만들 때 (docs/plan-template.html 복사)
 *   node scripts/plan-html.mjs <plans/…md> [--data <PLAN.json>] # 이미 있으면 plan-md 를 md 로 다시 맞추고, --data 가 있으면 PLAN 도 바꾼다
 *   옵션 --pane <id> : [이대로 진행] 이 보낼 헤르메스 pane. 없으면 PLAN.hermesPane → 없으면 `herdr pane current`
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
if (!existsSync(htmlPath) && !dataPath) {
  console.error('⚠️  html 이 없다 — 처음 만들 때는 --data <PLAN.json> 이 필요하다')
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
} else {
  plan = new Function(`return (${current[2]})`)()
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
plan.hermesPane = option('pane') || plan.hermesPane || previousPane || currentPane()

// PLAN 안의 < 는 \u003c 로 — 문자열에 </script> 가 있어도 블록이 끊기지 않게
const planJson = JSON.stringify(plan, null, 2).replace(/</g, '\\u003c')
body = body.replace(planBlock, (_, open, __, close) => `${open}const PLAN = ${planJson}\n${close}`)
// 본문 안의 닫는 태그(대소문자 변형 포함)가 블록을 끊지 않게 — commit.sh 와 같은 방식
const markdown = readFileSync(mdPath, 'utf8').replace(/<\/(script)/gi, '<\\/$1')
body = body.replace(/(<script id="plan-md" type="text\/markdown">\n)[\s\S]*?(<\/script>)/, (_, open, close) => `${open}${markdown}\n${close}`)
writeFileSync(htmlPath, head + body)

const decided = (plan.decisions ?? []).filter((decision) => decision.decided != null).length
console.log(`${relative(ROOT, htmlPath)} · 결정 ${decided}/${plan.decisions?.length ?? 0} 확정 · 보낼 pane ${plan.hermesPane || '(없음 — 복사로만)'}`)
