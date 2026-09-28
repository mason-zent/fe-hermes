#!/usr/bin/env node
/**
 * 심층 다이어그램 화면 전수 대조 — 한 폴더(탭 번들)의 JSON 이 레포의 화면 파일을 빠짐없이 한 번씩 담았는지 본다.
 *
 *   node scripts/diagram-coverage.mjs docs/diagrams/refund-web
 *
 * 화면 파일은 JSON 의 meta.repository.revision 시점에서 센다(로컬 작업 트리는 읽지 않는다).
 *   - App Router : <앱 루트>/app/**\/page.{tsx,ts,jsx,js}
 *   - Pages Router: <앱 루트>/pages/**\/*.{tsx,ts,jsx,js} 에서 _app·_document·_error·api/ 제외
 * 앱 루트는 bznav 면 apps/<앱>/, 콘솔이면 레포 루트(hermes.config.json 의 appDir 기준).
 *
 * 결과: 누락(화면인데 어느 도메인 탭에도 없음) · 중복(두 도메인 탭 이상) · 없는 경로(JSON 에 있는데 레포에 없음). 셋 다 0 이어야 합격.
 * 세지 않는 것: 탭 0(`*-detail`)의 대표 화면 인용, 한 탭 안의 같은 화면 반복.
 * 드릴다운 노드(build-bundle.py DRILL 의 출발 노드)에 있는 화면은 담긴 것으로 치되, 다른 탭의 일반 노드와 겹쳐도 중복으로 보지 않는다.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const folder = process.argv[2]
if (!folder) {
  console.error('사용: node scripts/diagram-coverage.mjs <다이어그램 폴더>')
  process.exit(2)
}
const config = JSON.parse(readFileSync(join(ROOT, 'hermes.config.json'), 'utf8'))

const collectSources = (node, found = []) => {
  if (Array.isArray(node)) node.forEach((child) => collectSources(child, found))
  else if (node && typeof node === 'object') {
    if (Array.isArray(node.sources)) found.push(...node.sources.filter((source) => source && source.path).map((source) => source.path))
    Object.values(node).forEach((child) => collectSources(child, found))
  }
  return found
}

const dir = resolve(folder)
const diagrams = readdirSync(dir)
  .filter((name) => name.endsWith('.architecture.json'))
  .map((name) => ({ name, json: JSON.parse(readFileSync(join(dir, name), 'utf8')) }))
if (!diagrams.length) {
  console.error(`${folder} 에 *.architecture.json 이 없다`)
  process.exit(2)
}

const repository = diagrams[0].json.meta?.repository
const revisions = new Set(diagrams.map((diagram) => diagram.json.meta?.repository?.revision))
if (revisions.size > 1) console.log(`⚠️ 탭마다 revision 이 다르다: ${[...revisions].join(', ')} — 같은 커밋에 고정해야 한다`)
const repoName = String(repository.url).split('/').pop()
const repoConfig = config.repos.find((repo) => repo.name === repoName)
const repoDir = join(ROOT, 'repos', repoName)

// 앱 루트: sources 경로가 apps/<앱>/ 이면 그 앱, 아니면 레포 루트
const allSources = diagrams.flatMap((diagram) => collectSources(diagram.json).map((path) => ({ path, tab: diagram.name })))

// build-bundle.py 의 TABS 순서와 DRILL(출발 탭 번호 → 노드 id)을 읽어 드릴다운 노드를 안다
const drillNodes = new Set()
try {
  const bundle = readFileSync(join(dir, 'build-bundle.py'), 'utf8')
  const tabFiles = [...bundle.slice(bundle.indexOf('TABS = [')).matchAll(/\(\s*"[^"]*",\s*"([^"]+)\.html"/g)].map((match) => match[1] + '.json')
  const drillBlock = bundle.slice(bundle.indexOf('DRILL = {'), bundle.indexOf('TABS = ['))
  let currentTab = null
  for (const row of drillBlock.split('\n')) {
    const tabMatch = row.match(/^\s*(\d+):\s*\{/)
    if (tabMatch) currentTab = Number(tabMatch[1])
    for (const nodeMatch of row.matchAll(/"([\w-]+)":\s*\{\s*"tab"/g)) drillNodes.add(`${tabFiles[currentTab]}\0${nodeMatch[1]}`)
  }
} catch {
  // build-bundle.py 가 없으면 드릴다운 제외 없이 센다
}
const domainSources = diagrams
  .filter((diagram) => !diagram.name.includes('-detail.'))
  .flatMap((diagram) =>
    (diagram.json.components ?? [])
      .flatMap((component) =>
        [...new Set(collectSources(component))].map((path) => ({ path, tab: diagram.name, drill: drillNodes.has(`${diagram.name}\0${component.id}`) })),
      ),
  )
const appMatch = allSources.map((source) => source.path.match(/^(apps\/[^/]+\/)/)).find(Boolean)
const appRoot = appMatch ? appMatch[1] : ''
const srcPrefix = repoConfig?.srcDir ? `${repoConfig.srcDir}/` : ''

const tree = execFileSync('git', ['-C', repoDir, 'ls-tree', '-r', '--name-only', repository.revision, '--', appRoot || '.'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n')
  .filter(Boolean)
const inApp = (path) => path.startsWith(appRoot)
const appRouterPages = tree.filter((path) => inApp(path) && new RegExp(`^${appRoot}(${srcPrefix})?app/.*page\\.(tsx|ts|jsx|js)$`).test(path))
const pagesRouterPages = tree.filter(
  (path) =>
    inApp(path) &&
    new RegExp(`^${appRoot}(${srcPrefix})?pages/.*\\.(tsx|ts|jsx|js)$`).test(path) &&
    !/\/pages\/(_app|_document|_error)\.[jt]sx?$/.test(path) &&
    !/\/pages\/api\//.test(path),
)
const screens = new Set([...appRouterPages, ...pagesRouterPages])

const counted = new Map()
for (const source of domainSources) {
  if (!screens.has(source.path)) continue
  const entries = counted.get(source.path) ?? []
  const tab = source.tab.replace('.architecture.json', '')
  if (!entries.some((entry) => entry.tab === tab && entry.drill === source.drill)) entries.push({ tab, drill: source.drill })
  counted.set(source.path, entries)
}
// 중복 = 드릴다운이 아닌 노드로 두 탭 이상에 담긴 화면
const ownerTabs = (entries) => [...new Set(entries.filter((entry) => !entry.drill).map((entry) => entry.tab))]
const missing = [...screens].filter((path) => !counted.has(path))
const duplicated = [...counted].map(([path, entries]) => [path, ownerTabs(entries)]).filter(([, tabs]) => tabs.length > 1)
const treeSet = new Set(tree)
const unknown = [...new Set(allSources.map((source) => source.path))].filter((path) => path.startsWith(appRoot) && !treeSet.has(path))

console.log(`${repoName} ${appRoot || '(루트)'} @ ${repository.revision.slice(0, 7)}`)
console.log(`화면 파일 ${screens.size} (App Router ${appRouterPages.length} · Pages Router ${pagesRouterPages.length}) · 다이어그램에 담긴 화면 ${counted.size} · 탭 ${diagrams.length}`)
for (const diagram of diagrams) {
  const count = [...counted].filter(([, entries]) => entries.some((entry) => entry.tab === diagram.name.replace('.architecture.json', ''))).length
  console.log(`  ${diagram.name.replace('.architecture.json', '').padEnd(34)} 화면 ${count}`)
}
console.log(`누락 ${missing.length}${missing.length ? '\n' + missing.map((path) => `  - ${path}`).join('\n') : ''}`)
console.log(`중복 ${duplicated.length}${duplicated.length ? '\n' + duplicated.map(([path, tabs]) => `  - ${path} (${tabs.join(', ')})`).join('\n') : ''}`)
console.log(`없는 경로 ${unknown.length}${unknown.length ? '\n' + unknown.map((path) => `  - ${path}`).join('\n') : ''}`)
process.exit(missing.length || duplicated.length || unknown.length ? 1 : 0)
