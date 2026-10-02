#!/usr/bin/env node
/**
 * QA 이력 보기 — 지금까지 돌린 QA 런을 최신순으로 보여 준다.
 *
 *   node scripts/qa/history.mjs                 터미널에 목록 (최근 20건)
 *   node scripts/qa/history.mjs --plan <계획서>  그 계획서로 돌린 것만
 *   node scripts/qa/history.mjs --open          이력 HTML(.qa-runs/index.html)을 브라우저로
 *   node scripts/qa/history.mjs --open <런 id>  그 런의 리포트(report.html)를 브라우저로
 */
import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync } from 'node:child_process'
import { RUNS_DIR, listRuns, buildReport, buildIndex, summaryText, when } from './report.mjs'

const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] ?? '' : ''
}

let runs = listRuns()
// 리포트가 없던 예전 런도 채운다
for (const run of runs) if (!existsSync(join(RUNS_DIR, run.id, 'report.html'))) buildReport(join(RUNS_DIR, run.id))
const indexFile = buildIndex()

const planFilter = option('plan')
if (planFilter) runs = runs.filter((run) => run.plan && (run.plan === planFilter || run.plan.endsWith(planFilter)))

if (argv.includes('--open')) {
  const target = option('open') && !option('open').startsWith('--') ? join(RUNS_DIR, option('open'), 'report.html') : indexFile
  if (!existsSync(target)) {
    console.error(`⚠️  없음: ${target}`)
    process.exit(2)
  }
  execFileSync('open', [target])
  console.log(`🌐 ${relative(process.cwd(), target)}`)
  process.exit(0)
}

if (!runs.length) {
  console.log('QA 이력 없음 — node scripts/qa/run.mjs --cwd <워크트리> 로 돌린다')
  process.exit(0)
}
console.log(`QA 이력 ${runs.length}건 (최신순) · 전체 보기: node scripts/qa/history.mjs --open`)
for (const run of runs.slice(0, 20)) {
  console.log(`\n${when(run.startedAt)}  ${run.id}`)
  console.log(`  ${run.app} · ${run.branch} @${run.head}${run.base ? ` vs ${run.base.ref}@${run.base.sha}` : ''}${run.plan ? ` · ${run.plan}` : ''}`)
  console.log(`  ${summaryText(run)}`)
}
