#!/usr/bin/env node
/**
 * 학습 품질 재채점 — scripts/learn-eval.json(정답지)의 작업들을 배우기 검토자로 --dry-run(아무것도 쓰지 않음) 돌리고,
 * 작업마다 검토자 결과 아래에 정답지(✅ 나와야 할 것 / ❌ 나오면 안 되는 것)를 붙여 출력한다. 비교는 사람(또는 헤르메스)이 한다.
 *
 *   node scripts/learn-eval.mjs > /tmp/learn-eval.log     # 13개 · 약 15분 · 약 $3~4 (Claude 구독 사용량)
 *   node scripts/learn-eval.mjs --only 7                  # 7번 작업만
 *
 * 기준(docs/knowledge/common/learning.md)이나 역할(.claude/agents/learn-reviewer.md)을 바꾸면 다시 돌려 좋아졌는지 본다.
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { cases } = JSON.parse(readFileSync(join(ROOT, 'scripts/learn-eval.json'), 'utf8'))
const onlyIndex = process.argv.indexOf('--only')
const only = onlyIndex >= 0 ? Number(process.argv[onlyIndex + 1]) : 0

cases.forEach((testCase, index) => {
  if (only && only !== index + 1) return
  console.log(`######## [${index + 1}] ${testCase.plan}`)
  const run = spawnSync(process.execPath, [join(ROOT, 'scripts/learn-review.mjs'), '--plan', testCase.plan, '--dry-run'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  const output = `${run.stdout}${run.stderr}`.split('\n').filter((line) => line && !/^\s*\((예정|--dry-run)/.test(line))
  console.log(output.join('\n'))
  console.log('  ── 정답지')
  if (!testCase.expect.length) console.log('    (0개가 맞다)')
  for (const item of testCase.expect) console.log(`    ${item.learn ? '✅ 나와야 함' : '❌ 나오면 안 됨'} — ${item.about}${item.why ? ` (${item.why})` : ''}`)
})
console.log('######## DONE')
