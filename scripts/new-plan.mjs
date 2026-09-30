#!/usr/bin/env node
/**
 * 경량 계획서를 만든다 — 모든 작업은 계획서 하나에 묶인다(AGENTS.md 5절).
 *
 *   node scripts/new-plan.mjs --agent <에이전트> --summary "<한 줄 요약>" [--issue issues/…md] [--prompt-file <파일>] [--status in_progress]
 *   → 만든 계획서 경로를 한 줄 출력 (plans/task/YYYYMMDD-<에이전트>-<요약>.md)
 *
 * 정식 계획서(md 하나, 결정은 대화의 결정 표)는 새 기능·여러 레포·API·구조 변경용이다(docs/plan-template.md).
 * 이 스크립트는 문구 수정·버그 하나·확인·조사·직접 부른 에이전트 작업용 경량판(docs/plan-template-light.md)만 만든다.
 * 경량판은 사용자의 지시가 곧 승인이라 결정 표가 없다.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] ?? '' : ''
}

const agent = option('agent')
const summary = option('summary').trim()
const issue = option('issue')
const promptFile = option('prompt-file')
const status = option('status') || 'in_progress'
if (!summary) {
  console.error('사용: node scripts/new-plan.mjs --agent <에이전트> --summary "<한 줄 요약>" [--issue issues/…md] [--prompt-file <파일>]')
  process.exit(2)
}

const now = new Date()
const stamp = now.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })
const day = stamp.slice(0, 10).replace(/-/g, '')
// 파일명: 한글·영문·숫자만 남기고 짧게
const slug = summary
  .normalize('NFC')
  .replace(/[^\p{L}\p{N}]+/gu, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40)
const dir = join(ROOT, 'plans/task')
mkdirSync(dir, { recursive: true })
let file = join(dir, `${day}-${agent || 'hermes'}-${slug}.md`)
for (let count = 2; existsSync(file); count += 1) file = join(dir, `${day}-${agent || 'hermes'}-${slug}-${count}.md`)

const prompt = promptFile && existsSync(promptFile) ? readFileSync(promptFile, 'utf8').trim() : ''
const template = readFileSync(join(ROOT, 'docs/plan-template-light.md'), 'utf8')
const body = template
  .slice(template.indexOf('<!-- BEGIN:template -->') + '<!-- BEGIN:template -->'.length, template.indexOf('<!-- END:template -->'))
  .trim()
  .replaceAll('{{title}}', summary)
  .replaceAll('{{updated}}', `${stamp.slice(0, 16)} / ${agent ? `헤르메스 → ${agent}` : '헤르메스'}`)
  .replaceAll('{{status}}', status)
  .replaceAll('{{agent}}', agent || '(정해지지 않음)')
  .replaceAll('{{issue}}', issue || '없음')
  .replaceAll('{{prompt}}', prompt ? prompt.split('\n').map((line) => `> ${line}`).join('\n') : '> (지시문 없음 — pane 에서 대화로 지시)')

writeFileSync(file, body.normalize('NFC') + '\n')
console.log(file.replace(ROOT + '/', ''))
