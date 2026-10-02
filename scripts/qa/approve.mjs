#!/usr/bin/env node
/**
 * 전체 검수 결과를 기준 사진으로 승인한다 (D12).
 *
 *   node scripts/qa/approve.mjs <런 id>                 승인할 만한 화면 전부(🆕 기준 없음 · 🟡 화면 변화 · ✅ 통과)
 *   node scripts/qa/approve.mjs <런 id> --key /help/faq  그 화면만 (실패 화면도 콕 집으면 올린다)
 *
 * 현황판 QA 탭의 [기준으로 승인] 도 같은 일을 한다.
 */
import { approveRun } from './baseline.mjs'

const argv = process.argv.slice(2)
const runId = argv.find((value) => !value.startsWith('--'))
const keyIndex = argv.indexOf('--key')
const keys = keyIndex >= 0 ? [argv[keyIndex + 1]] : null
if (!runId) {
  console.error('사용: node scripts/qa/approve.mjs <런 id> [--key <화면 키>]')
  process.exit(2)
}
const result = approveRun(runId, keys)
if (result.error) {
  console.error(`⚠️  ${result.error}`)
  process.exit(1)
}
console.log(`✅ 기준 승인 — 화면 ${result.screens}개 · 스크린샷 ${result.shots}장 → ${result.dir}`)
