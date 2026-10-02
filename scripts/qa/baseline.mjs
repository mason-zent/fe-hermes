/**
 * 기준 사진 (D12) — 전체 검수가 비교하는 "승인한 화면".
 *   .qa-baselines/<앱>/<프로필>/<화면>.<뷰포트>.png      스크린샷
 *   .qa-baselines/<앱>/<프로필>/<화면>.<뷰포트>.json     그때 있던 문제 목록(알려진 문제 — 다음 검수에서 실패로 세지 않는다) · 승인한 런
 * git 무시 · 로컬 전용(dev 데이터가 맥마다 같지 않을 수 있다).
 *
 * 승인: approve.mjs <런 id> [--key <화면 키>] — 전체 검수 런의 작업 스크린샷을 기준으로 올린다.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RUNS_DIR, buildReport, buildIndex } from './report.mjs'

const HERMES = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const BASELINES_DIR = join(HERMES, '.qa-baselines')

export const baselineDir = (app, profile) => join(BASELINES_DIR, app, profile)

export function readBaselineProblems(app, profile, name) {
  const file = join(baselineDir(app, profile), `${name}.json`)
  if (!existsSync(file)) return []
  try {
    return JSON.parse(readFileSync(file, 'utf8')).problems ?? []
  } catch {
    return []
  }
}

/**
 * 전체 검수 런의 화면을 기준으로 승인한다. keys 를 안 주면 승인할 만한 화면 전부(🆕 기준 없음 · 🟡 화면 변화 · ✅ 통과).
 * 실패·이동·로그인 필요 화면은 기준으로 올리지 않는다(망가진 화면이 기준이 되지 않게) — key 로 콕 집으면 그 화면만 올린다.
 */
export function approveRun(runId, keys = null) {
  const runDir = join(RUNS_DIR, runId)
  const runFile = join(runDir, 'run.json')
  if (!existsSync(runFile)) return { error: `런이 없다: ${runId}` }
  const run = JSON.parse(readFileSync(runFile, 'utf8'))
  if (run.kind !== 'suite') return { error: '기준 승인은 전체 검수(--suite) 런만 — 영향 QA 는 기준 브랜치와 비교한다' }
  if (run.status !== 'done') return { error: '끝난 런만 승인할 수 있다' }
  const approvable = new Set(['new', 'changed', 'pass', 'expected'])
  const targets = run.screens.filter((screen) => (keys ? keys.includes(screen.key) : approvable.has(screen.status)))
  if (!targets.length) return { error: keys ? '그 화면이 런에 없다' : '승인할 화면이 없다' }
  const dir = baselineDir(run.app, run.profile)
  mkdirSync(dir, { recursive: true })
  let count = 0
  for (const screen of targets) {
    for (const viewport of screen.viewports) {
      if (!viewport.shots?.head || !viewport.slug || !existsSync(join(runDir, viewport.shots.head))) continue
      copyFileSync(join(runDir, viewport.shots.head), join(dir, `${viewport.slug}.png`))
      writeFileSync(join(dir, `${viewport.slug}.json`), `${JSON.stringify({ run: run.id, head: run.head, approvedAt: new Date().toISOString(), finalPath: viewport.finalPath, problems: viewport.headProblems ?? [] }, null, 2)}\n`)
      count += 1
    }
    screen.approved = true
  }
  writeFileSync(runFile, `${JSON.stringify(run, null, 2)}\n`)
  buildReport(runDir)
  buildIndex()
  return { ok: true, screens: targets.length, shots: count, dir }
}
