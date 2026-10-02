#!/usr/bin/env node
/**
 * 영향 화면 산출 — 변경 파일에서 import 를 거꾸로 따라가 그 파일을 쓰는 화면(라우트)을 모두 찾는다.
 * 계획서: plans/feature/20261002-QA-시뮬레이션-영향-화면.md (D4 dependency-cruiser · D9 가까운 화면부터)
 *
 *   node scripts/qa/impact.mjs --cwd <레포 또는 워크트리> --app refund-web [--base <ref>] [--files a,b] [--json]
 *
 *   --cwd    모노레포 루트(또는 그 안 아무 곳). 워크트리면 워크트리 경로
 *   --app    hermes.config.json 의 bznav-web 앱 이름 (파일럿: refund-web)
 *   --base   비교 기준 ref. 기본은 그 앱의 prBase(origin/<prBase>) — merge-base 부터의 변경 + 미커밋 + 추적 안 된 파일
 *   --files  변경 파일을 직접 준다(모노레포 루트 기준, 쉼표). 주면 git 을 보지 않는다
 *   --json   결과를 JSON 으로 (runner·현황판이 읽는다). 없으면 사람이 읽는 표
 */
import { readFileSync, realpathSync, existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { cruise } from 'dependency-cruiser'
import extractTSConfig from 'dependency-cruiser/config-utl/extract-ts-config'

const HERMES = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 ? argv[index + 1] ?? '' : ''
}
const flag = (name) => argv.includes(`--${name}`)

const appName = option('app') || 'refund-web'
const cwdOption = option('cwd') || join(HERMES, 'repos', 'bznav-web')
if (!existsSync(cwdOption)) {
  console.error(`⚠️  --cwd 경로가 없다: ${cwdOption}`)
  process.exit(2)
}

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
// 심볼릭 링크(repos/…)를 실제 경로로 — dependency-cruiser 는 링크 경로와 실제 경로가 섞이면 패키지를 못 읽는다
const repoRoot = realpathSync(git(['rev-parse', '--show-toplevel'], cwdOption))
const appDir = join('apps', appName)
const appAbs = join(repoRoot, appDir)
if (!existsSync(join(appAbs, 'pages'))) {
  console.error(`⚠️  ${appDir}/pages 가 없다 — 파일럿은 Pages Router 앱(refund-web) 기준이다`)
  process.exit(2)
}

if (!existsSync(join(repoRoot, 'node_modules'))) {
  console.error(`⚠️  ${repoRoot} 에 node_modules 가 없다 — tsconfig 가 @repo/project-config 를 extends 해서 먼저 pnpm install 이 필요하다 (run.mjs 는 알아서 한다)`)
  process.exit(2)
}

const config = JSON.parse(readFileSync(join(HERMES, 'hermes.config.json'), 'utf8'))
const monorepo = config.repos.find((repo) => repo.name === 'bznav-web')
const prBase = monorepo?.apps?.[appName]?.prBase ?? 'dev'

// 앱 밖이어도 이 앱 전체에 닿는 파일 — 바뀌면 모든 화면이 영향 범위
const GLOBAL_FILES = [
  `${appDir}/pages/_app.tsx`,
  `${appDir}/pages/_document.tsx`,
  `${appDir}/pages/_error.tsx`,
  `${appDir}/next.config.mjs`,
  `${appDir}/proxy.ts`,
  `${appDir}/tailwind.config.ts`,
  `${appDir}/postcss.config.mjs`,
  `${appDir}/package.json`,
  `${appDir}/tsconfig.json`,
  'package.json',
  'pnpm-lock.yaml'
]
const isGlobalFile = (file) => GLOBAL_FILES.includes(file) || file.startsWith('packages/project-config/')

// ── 1) 변경 파일 ─────────────────────────────────────────
function changedFiles() {
  const given = option('files')
  if (given) return given.split(',').map((file) => file.trim()).filter(Boolean)
  const baseRef = option('base') || `origin/${prBase}`
  const mergeBase = git(['merge-base', baseRef, 'HEAD'], repoRoot)
  const lists = [
    git(['diff', '--name-only', `${mergeBase}...HEAD`], repoRoot),
    git(['diff', '--name-only', 'HEAD'], repoRoot),
    git(['ls-files', '--others', '--exclude-standard'], repoRoot)
  ]
  return [...new Set(lists.join('\n').split('\n').filter(Boolean))]
}

// ── 2) 화면 목록 (Pages Router) ──────────────────────────
const SPECIAL_PAGES = new Set(['_app', '_document', '_error'])
function routeOf(pageFile) {
  // apps/refund-web/pages/help/faq/index.tsx → /help/faq
  const inside = pageFile.slice(`${appDir}/pages/`.length).replace(/\.(tsx|ts|jsx|js)$/, '')
  const route = `/${inside}`.replace(/\/index$/, '')
  return route || '/'
}
function isScreen(file) {
  if (!file.startsWith(`${appDir}/pages/`) || !/\.(tsx|ts|jsx|js)$/.test(file)) return false
  const inside = file.slice(`${appDir}/pages/`.length)
  if (inside.startsWith('api/')) return false
  const baseName = inside.split('/').pop().replace(/\.\w+$/, '')
  return !SPECIAL_PAGES.has(baseName)
}

// ── 3) 의존 그래프 ───────────────────────────────────────
async function buildGraph() {
  const tsConfigFile = join(appAbs, 'tsconfig.json')
  const previousCwd = process.cwd()
  process.chdir(repoRoot)
  try {
    const result = await cruise(
      [`${appDir}/pages`],
      {
        baseDir: repoRoot,
        tsPreCompilationDeps: true,
        combinedDependencies: true,
        // @repo/* 는 workspace 패키지라 따라간다. 외부 node_modules 는 끊는다
        doNotFollow: { path: 'node_modules/(?!@repo/)' },
        exclude: { path: '\\.(svg|png|jpe?g|gif|webp|ico|woff2?)$' },
        enhancedResolveOptions: {
          exportsFields: ['exports'],
          conditionNames: ['import', 'require', 'node', 'default', 'types'],
          extensions: ['.ts', '.tsx', '.js', '.mjs', '.jsx', '.json']
        },
        tsConfig: { fileName: tsConfigFile }
      },
      undefined,
      { tsConfig: extractTSConfig(tsConfigFile) }
    )
    return result.output.modules
  } finally {
    process.chdir(previousCwd)
  }
}

// ── 4) 역추적 — 변경 파일에서 위로 BFS (가까운 화면부터 · D9) ──
function traceScreens(modules, changed) {
  const importers = new Map() // 파일 → 그 파일을 import 하는 파일들
  for (const module of modules) {
    for (const dependency of module.dependencies) {
      if (dependency.couldNotResolve) continue
      if (!importers.has(dependency.resolved)) importers.set(dependency.resolved, [])
      importers.get(dependency.resolved).push(module.source)
    }
  }
  const known = new Set(modules.map((module) => module.source))
  const allScreens = modules.map((module) => module.source).filter(isScreen).sort()

  const globalHits = changed.filter(isGlobalFile)
  if (globalHits.length) {
    return {
      global: globalHits,
      screens: allScreens.map((file) => ({ file, route: routeOf(file), distance: 0, changed: globalHits[0], via: [globalHits[0], file] }))
    }
  }

  // 여러 시작점 BFS — 각 파일에 처음 닿은 경로가 최단 경로
  const parent = new Map()
  const origin = new Map()
  const distance = new Map()
  const queue = []
  for (const file of changed.filter((file) => known.has(file))) {
    distance.set(file, 0)
    origin.set(file, file)
    queue.push(file)
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor]
    for (const importer of importers.get(current) ?? []) {
      if (distance.has(importer)) continue
      distance.set(importer, distance.get(current) + 1)
      parent.set(importer, current)
      origin.set(importer, origin.get(current))
      queue.push(importer)
    }
  }

  const chainOf = (file) => {
    const chain = [file]
    while (parent.has(chain[0])) chain.unshift(parent.get(chain[0]))
    return chain
  }
  const screens = [...distance.keys()]
    .filter(isScreen)
    .map((file) => ({ file, route: routeOf(file), distance: distance.get(file), changed: origin.get(file), via: chainOf(file) }))
    .sort((left, right) => left.distance - right.distance || left.route.localeCompare(right.route))
  return { global: [], screens }
}

// 로그인 필요 화면 표시용 — 화면 파일이 AuthGuard 를 직접 쓰는지만 본다(실제 판정은 runner 가 이동 여부로)
function usesAuthGuard(file) {
  try {
    return /\bAuthGuard\b/.test(readFileSync(join(repoRoot, file), 'utf8'))
  } catch {
    return false
  }
}

const changed = changedFiles()
const modules = await buildGraph()
const { global, screens } = traceScreens(modules, changed)
const known = new Set(modules.map((module) => module.source))
const result = {
  app: appName,
  repoRoot,
  head: git(['rev-parse', '--short', 'HEAD'], repoRoot),
  base: option('files') ? null : option('base') || `origin/${prBase}`,
  changed: changed.map((file) => ({ file, inGraph: known.has(file), global: isGlobalFile(file) })),
  global,
  totalScreens: modules.map((module) => module.source).filter(isScreen).length,
  screens: screens.map((screen) => ({ ...screen, auth: usesAuthGuard(screen.file) }))
}

if (flag('json')) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
} else {
  console.log(`📍 ${appName} · ${relative(HERMES, repoRoot) || repoRoot} @ ${result.head} · 기준 ${result.base ?? '(--files)'}`)
  console.log(`변경 파일 ${changed.length}개 (그래프 안 ${result.changed.filter((item) => item.inGraph).length}개)`)
  if (global.length) console.log(`⚠️  공통 파일 변경 — 화면 전부: ${global.join(', ')}`)
  console.log(`영향 화면 ${screens.length} / ${result.totalScreens}`)
  for (const screen of result.screens) {
    const hops = screen.distance === 0 ? '직접' : `${screen.distance}단계`
    console.log(`  ${screen.route.padEnd(48)} ${hops.padEnd(5)} ${screen.auth ? '🔒' : '  '} ← ${screen.changed}`)
  }
}
