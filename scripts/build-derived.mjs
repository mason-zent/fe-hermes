#!/usr/bin/env node
/**
 * 파생 문서 생성 — 지문(.sync/snapshots/*.json)이 정본, 문서는 파생물.
 *
 * 같은 사실을 여러 문서에 손으로 옮겨 적으면 반드시 어긋난다(불일치 A·B·C가 그렇게 생겼다).
 * 그래서 지문에서 뽑을 수 있는 사실은 이 스크립트가 쓰고, 사람은 건드리지 않는다.
 *
 *   node scripts/build-derived.mjs              # 생성 + 검증
 *   node scripts/build-derived.mjs --check      # 쓰지 않고 차이만 보고 (CI·확인용)
 *
 * 생성 구간은 문서 안에서 주석 마커로 감싼다:
 *   md   : <!-- BEGIN:generated:<이름> --> ... <!-- END:generated:<이름> -->
 *   html : 같은 형식
 *
 * 지문에 없는 사실(데이터 계층·상태 관리·UI·폼·인증 등 사람이 판단해 쓴 서술)은
 * 생성하지 않는다. 대신 마커 밖에 두고, 버전·포트 같은 숫자가 지문과 어긋나면 경고만 낸다.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SNAP_DIR = join(ROOT, '.sync/snapshots')
const PENDING_DIR = join(ROOT, '.sync/pending')
const CHECK_ONLY = process.argv.includes('--check')

// ---- 지문 읽기 ----
// pending 이 있으면 그것을 쓴다. 순서가 "지문 생성 → 문서 갱신 → accept" 이므로
// accept 전에 곧 확정될 값으로 문서를 만들어야 한다. pending 이 없으면 baseline 을 쓴다.
if (!existsSync(SNAP_DIR)) {
  console.error('지문이 없습니다. 먼저 `node scripts/sync-fingerprint.mjs` 를 돌리세요.')
  process.exit(1)
}
const snaps = {}
const sources = {}
const load = (dir, label) => {
  if (!existsSync(dir)) return
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const snapshot = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    snaps[snapshot.repo] = snapshot
    sources[snapshot.repo] = label
  }
}
load(SNAP_DIR, 'baseline')
load(PENDING_DIR, 'pending')
const pendingRepos = Object.entries(sources).filter(([, label]) => label === 'pending').map(([name]) => name)
if (pendingRepos.length) console.log(`지문 출처: pending ${pendingRepos.join(', ')} / 나머지는 baseline\n`)
const config = JSON.parse(readFileSync(join(ROOT, 'hermes.config.json'), 'utf8'))

// ---- 값 추출 헬퍼 ----
const dash = '–'
const UNKNOWN = '(지문 갱신 필요)'
const short = (sha) => (sha ? String(sha).slice(0, 7) : dash)
const clean = (version) => (version ? String(version).replace(/^[\^~]/, '') : null)

/** 앱이 `catalog:` 로 받는 버전을 루트 catalog 로 해석한다 */
const resolveDep = (snapshot, name, appName) => {
  const appDeps = appName ? snapshot.apps?.[appName]?.deps : null
  const raw = (appDeps ?? snapshot.package?.deps ?? {})[name]
  if (raw === 'catalog:' || raw === 'catalog:default') return clean(snapshot.catalog?.[name])
  return clean(raw) ?? clean(snapshot.catalog?.[name])
}

const nodeVersion = (snapshot) => {
  if (snapshot.nvmrc) return String(snapshot.nvmrc).trim().replace(/^v/, '')
  const engine = snapshot.package?.engines?.node
  return engine ? String(engine) : dash
}
const pnpmVersion = (snapshot) => {
  const pm = snapshot.package?.packageManager
  return pm ? String(pm).replace(/^pnpm@/, '') : dash
}

/** .prettierrc 원문(JSON 또는 JS)에서 핵심 값만 읽는다 */
const prettierSummary = (snapshot) => {
  const raw = snapshot.prettier
  if (!raw) return dash
  const pick = (key) => {
    const matched = String(raw).match(new RegExp(`["']?${key}["']?\\s*:\\s*("[^"]*"|'[^']*'|[A-Za-z0-9]+)`))
    return matched ? matched[1].replace(/['"]/g, '') : null
  }
  const parts = []
  const semi = pick('semi')
  if (semi !== null) parts.push(`semi ${semi}`)
  if (pick('singleQuote') === 'true') parts.push('single quote')
  const trailing = pick('trailingComma')
  if (trailing) parts.push(`trailingComma ${trailing}`)
  const width = pick('printWidth')
  if (width) parts.push(`printWidth ${width}`)
  return parts.length ? parts.join(', ') : dash
}

/** package.json 의 scripts 에 실제로 있는 검증 명령만 적는다.
 *  지문은 레포 루트에서는 객체({name: cmd}), 앱 단위에서는 이름 배열로 담는다 — 둘 다 받는다. */
const verifyScripts = (scripts) => {
  const names = Array.isArray(scripts) ? scripts : Object.keys(scripts ?? {})
  const found = ['lint:check', 'lint', 'typecheck', 'type-check', 'test:unit', 'test'].filter((name) => {
    if (name === 'lint' && names.includes('lint:check')) return false
    return names.includes(name)
  })
  if (!found.length) return dash
  const hasType = found.some((name) => name === 'typecheck' || name === 'type-check')
  const commands = found.map((name) => `\`${name}\``)
  if (!hasType) commands.push('`tsc --noEmit`(스크립트 없음)')
  return commands.join(', ')
}

// ---- services.md 자동 표 ----
const COLUMNS = [
  { repo: 'client-brics-refund', label: 'client-brics-refund' },
  { repo: 'client-brics-hub', label: 'client-brics-hub' },
  { repo: 'client-brics-care', label: 'client-brics-care' },
  { repo: 'bznav-web', label: 'bznav-web' },
  { repo: 'web-op', label: 'web-op' }
]

const agentsFor = (name) => {
  const entry = config.repos.find((item) => item.name === name)
  if (!entry) return dash
  if (entry.kind === 'monorepo') {
    const appAgents = Object.values(entry.apps ?? {}).map((app) => app.agent)
    return [...appAgents, entry.packagesAgent].filter(Boolean).join(', ')
  }
  return (entry.agents ?? []).join(', ')
}

const bznavPerApp = (snapshot, pick) =>
  Object.keys(snapshot.apps ?? {})
    .sort()
    .map((appName) => `${appName.replace(/-web$/, '')} ${pick(appName)}`)
    .join(' · ')

const servicesTable = () => {
  const row = (label, cell) => `| ${label} | ` + COLUMNS.map((column) => cell(snaps[column.repo], column.repo) ?? dash).join(' | ') + ' |'
  const lines = []
  lines.push('| 항목 | ' + COLUMNS.map((column) => column.label).join(' | ') + ' |')
  lines.push('|---|' + COLUMNS.map(() => '---|').join(''))
  lines.push(row('에이전트', (_s, repo) => agentsFor(repo)))
  lines.push(row('기준 브랜치', (snapshot) => {
    if (snapshot?.apps) {
      return '앱별 ' + bznavPerApp(snapshot, (app) => `\`${(snapshot.apps[app].branch ?? '').replace('origin/', '')}\``) + ' · packages `dev`'
    }
    return snapshot?.branch ? `\`${snapshot.branch.replace('origin/', '')}\`` : dash
  }))
  lines.push(row('기준 커밋', (snapshot) => {
    if (snapshot?.apps) return bznavPerApp(snapshot, (app) => `\`${short(snapshot.apps[app].sha)}\``)
    return snapshot ? `\`${short(snapshot.sha)}\` (${snapshot.shaDate ?? dash})` : dash
  }))
  lines.push(row('Next.js', (snapshot) => {
    if (!snapshot) return dash
    if (snapshot.apps) {
      const version = resolveDep(snapshot, 'next', Object.keys(snapshot.apps)[0])
      const routers = [...new Set(Object.values(snapshot.apps).map((app) => app.router).filter(Boolean))]
      return version ? `${version}${routers.length ? ` (${routers.join(' / ')})` : ''}` : UNKNOWN
    }
    return resolveDep(snapshot, 'next') ?? UNKNOWN
  }))
  lines.push(row('React', (snapshot) => (snapshot ? resolveDep(snapshot, 'react') ?? UNKNOWN : dash)))
  lines.push(row('Node / pnpm', (snapshot) => (snapshot ? `${nodeVersion(snapshot)} / ${pnpmVersion(snapshot)}` : dash)))
  lines.push(row('dev 포트', (snapshot) => {
    if (!snapshot) return dash
    if (snapshot.apps) return bznavPerApp(snapshot, (app) => snapshot.apps[app].port ?? dash)
    return snapshot.port ?? dash
  }))
  lines.push(row('Prettier', (snapshot) => (snapshot ? prettierSummary(snapshot) : dash)))
  lines.push(row('검증 스크립트', (snapshot) => {
    if (!snapshot) return dash
    if (snapshot.apps) {
      return bznavPerApp(snapshot, (app) => verifyScripts(snapshot.apps[app].scripts).replace(/`/g, ''))
    }
    return verifyScripts(snapshot.package?.scripts)
  }))
  return lines.join('\n')
}

// ---- playbook 기준 커밋 표 ----
const baselineRows = () => {
  const order = ['client-brics-refund', 'client-brics-hub', 'client-brics-care', 'bznav-web', 'web-op', 'zent-packages']
  return order
    .filter((name) => snaps[name])
    .map((name) => {
      const snapshot = snaps[name]
      const agent = name === 'bznav-web' ? 'bznav-*-fe (6)' : agentsFor(name) || dash
      const branch = (snapshot.branch ?? '').replace('origin/', '')
      const label = name === 'zent-packages' ? `${name} (${branch})` : name
      const sha = snapshot.apps ? '앱별 prd-*' : short(snapshot.sha)
      const subject = (snapshot.subject ?? '').slice(0, 58)
      const extra = snapshot.apps ? `packages 는 dev ${short(snapshot.sha)}` : subject
      return `            <tr><td>${label}</td><td class="name">${agent}</td><td class="name">${sha}</td><td>${snapshot.shaDate ?? dash}</td><td>${escapeHtml(extra)}</td></tr>`
    })
    .join('\n')
}
const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** last sync 는 실행일이 아니라 **지문이 확정된 시각**이다.
 *  실행일을 쓰면 문서를 안 고쳐도 날짜만 바뀌어 --check 가 실패하고,
 *  실제 sync 없이 생성만 다시 돌려도 최신 날짜가 붙는다. */
const lastSyncDate = () => {
  try {
    const state = JSON.parse(readFileSync(join(ROOT, '.sync/state.json'), 'utf8'))
    if (state.acceptedAt) return String(state.acceptedAt).slice(0, 10)
  } catch { /* state.json 이 없으면 지문 날짜로 폴백 */ }
  const dates = Object.values(snaps).map((s) => s.shaDate).filter(Boolean).sort()
  return dates.length ? dates[dates.length - 1] : '(미확정)'
}

// ---- 마커 치환 ----
const replaceBlock = (text, name, body) => {
  const pattern = new RegExp(`(<!-- BEGIN:generated:${name}[^>]*-->)([\\s\\S]*?)(<!-- END:generated:${name} -->)`)
  if (!pattern.test(text)) return { text, found: false, changed: false }
  let changed = false
  const next = text.replace(pattern, (_all, begin, old, end) => {
    const replacement = `${begin}\n${body}\n${end}`
    const current = `${begin}${old}${end}`
    if (current !== replacement) changed = true
    return replacement
  })
  return { text: next, found: true, changed }
}

const targets = [
  { file: 'docs/services.md', blocks: { 'stack-table': servicesTable() } },
  {
    file: 'docs/playbook.html',
    blocks: {
      'baseline-rows': baselineRows(),
      'last-sync': `      <span>last sync ${lastSyncDate()}</span>`
    }
  }
]

let wrote = 0
let drift = 0
const missing = []

// 1차: 전부 검증만 한다. 마커가 하나라도 없으면 아무것도 쓰지 않는다.
// 일부만 쓰고 실패하면 문서가 반만 갱신된 채로 남고, 그 상태로 accept 될 수 있다.
const planned = []
for (const target of targets) {
  const path = join(ROOT, target.file)
  if (!existsSync(path)) { missing.push(`${target.file} (파일 없음)`); continue }
  let text = readFileSync(path, 'utf8')
  let fileChanged = false
  for (const [name, body] of Object.entries(target.blocks)) {
    const opens = (text.match(new RegExp(`<!-- BEGIN:generated:${name}[^>]*-->`, 'g')) || []).length
    if (opens > 1) { missing.push(`${target.file} → 마커 generated:${name} 가 ${opens}개 (중복)`); continue }
    const result = replaceBlock(text, name, body)
    if (!result.found) { missing.push(`${target.file} → 마커 generated:${name} 없음`); continue }
    text = result.text
    if (result.changed) { fileChanged = true; drift += 1; console.log(`  ${CHECK_ONLY ? '차이' : '갱신'}: ${target.file} → ${name}`) }
  }
  if (fileChanged) planned.push({ path, text, file: target.file })
}

// 2차: 검증을 통과했을 때만 쓴다
if (missing.length) {
  console.log('')
  console.log('❌ 마커 문제로 생성을 중단했다 (아무것도 쓰지 않았다):')
  missing.forEach((item) => console.log(`  - ${item}`))
  console.log('\n문서의 <!-- BEGIN:generated:... --> / <!-- END:... --> 마커를 복구한 뒤 다시 돌려라.')
  process.exit(1)
}
if (!CHECK_ONLY) for (const item of planned) { writeFileSync(item.path, item.text); wrote += 1 }

// ---- 마커 밖 사실 검증 (생성하지 않고 경고만) ----
const warnings = []
const playbookPath = join(ROOT, 'docs/playbook.html')
if (existsSync(playbookPath)) {
  const html = readFileSync(playbookPath, 'utf8')
  for (const [name, snapshot] of Object.entries(snaps)) {
    const port = snapshot.apps ? null : snapshot.port
    if (port && !html.includes(String(port))) warnings.push(`playbook.html: ${name} 포트 ${port} 가 문서에 없다 (바뀐 값일 수 있음)`)
    const next = snapshot.apps ? resolveDep(snapshot, 'next', Object.keys(snapshot.apps)[0]) : resolveDep(snapshot, 'next')
    if (next) {
      // major 만 본다. 문서가 "Next 16" 처럼 덜 정밀하게 적는 것은 오류가 아니고,
      // 15 → 16 처럼 major 가 어긋난 경우만 실제 drift 다.
      const major = next.split('.')[0]
      if (!new RegExp(`Next\\s*${major}`).test(html)) {
        warnings.push(`playbook.html: ${name} 의 Next major ${major} 표기가 없다 (마커 밖 서술을 손으로 고쳐야 함)`)
      }
    }
  }
}

console.log('')
if (warnings.length) { console.log('⚠️ 마커 밖 사실이 지문과 어긋날 수 있음 (자동 수정 안 함):'); warnings.forEach((item) => console.log(`  - ${item}`)) }
if (!warnings.length) console.log('✅ 마커·마커 밖 사실 모두 이상 없음')

if (CHECK_ONLY) {
  console.log(drift ? `\n차이 ${drift}곳. \`node scripts/build-derived.mjs\` 로 갱신하세요.` : '\n파생 문서가 지문과 일치합니다.')
  process.exit(drift ? 1 : 0)
}
console.log(wrote ? `\n${wrote}개 파일 갱신. diff 를 확인하세요.` : '\n갱신할 것이 없습니다 (이미 최신).')
