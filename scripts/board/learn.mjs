/**
 * 현황판 [학습] 탭 — 학습 후보(issues/*-learn-*.md)와 학습한 내용(docs/knowledge/learned/*.md)을 다룬다.
 * 기준·흐름 정본: docs/knowledge/common/learning.md · plans/feature/20261008-학습-루프-4단계-학습-탭-쉬운-기록.md
 *
 *   넣기      후보 → 공책(target 파일) 끝 "## 학습" 절에 한 줄(<!-- learn:<id> -->) + 기록 docs/knowledge/learned/<id>.md
 *             strengthen(기존 줄 강화)이면 그 줄을 바꾸고 원래 줄을 기록에 남긴다(삭제하면 되돌린다)
 *   버리기    후보 → 휴지통(.board-trash/<날짜>/), 수만 센다
 *   수정      학습한 내용 → 기록과 공책 줄을 표시(id)로 찾아 같이 고친다
 *   삭제      학습한 내용 → 공책 줄을 빼고(강화였으면 원래 줄로 되돌림) 기록은 휴지통으로
 * 커밋은 하지 않는다 — 사용자가 "커밋해줘" 할 때 헤르메스가 모아서.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, normalize, relative, sep } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const ISSUES = join(ROOT, 'issues')
const LEARNED = join(ROOT, 'docs/knowledge/learned')
const STATS = join(ROOT, '.board-learn-stats.json')
const SECTION = '## 학습'
const SECTION_NOTE = '학습 루프로 들어온 줄 — 현황판 [학습] 탭에서 수정·삭제한다. 쉬운 설명은 `docs/knowledge/learned/`'

const today = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10)
export const isLearnIssue = (path) => /-learn-[^/]*\.md$/.test(path) && !/-learn-curator\.md$/.test(path)  // curator 정리 목록은 후보가 아니다

// ── 읽기 ────────────────────────────────────────────────────────────────
const parse = (text) => {
  const front = text.match(/^---\n([\s\S]*?)\n---\n?/)
  const meta = Object.fromEntries((front?.[1] ?? '').split('\n').map((line) => line.match(/^([\w-]+):\s*(.*)$/)).filter(Boolean).map((match) => [match[1], match[2].trim()]))
  const body = front ? text.slice(front[0].length) : text
  const sections = {}
  let current = '_intro'
  for (const line of body.split('\n')) {
    const heading = line.match(/^## (.+)$/)
    if (heading) {
      current = heading[1].trim()
      continue
    }
    sections[current] = `${sections[current] ?? ''}${line}\n`
  }
  for (const key of Object.keys(sections)) sections[key] = sections[key].trim()
  return { meta, sections, body: body.trim() }
}

const firstSection = (sections, ...names) => names.map((name) => sections[name]).find(Boolean) ?? ''
// 1단계 형식(본문 한 줄 + 근거)도 읽는다
const view = (id, text, extra = {}) => {
  const { meta, sections, body } = parse(text)
  const rule = firstSection(sections, '공책에 넣을 문장') || sections._intro?.split('\n')[0] || ''
  return {
    id,
    title: meta.title || basename(id, '.md'),
    target: meta.target || '',
    notebook: (meta.target || '').split('#')[0],
    source: meta.source || '',
    signal: meta.signal || '',
    basis: meta.basis || '',
    skill: (meta.target || '').startsWith('skill:'),
    explain: firstSection(sections, '무엇을 배웠나') || (sections._intro && sections._intro !== rule ? sections._intro : ''),
    why: firstSection(sections, '왜 중요한가', '모르면').replace(/^- /, ''),
    rule: rule.replace(/\n\(새 줄이 아니라 기존 줄을 고친다: [\s\S]*\)$/, '').trim(),
    strengthen: meta.strengthen || (firstSection(sections, '공책에 넣을 문장').match(/\(새 줄이 아니라 기존 줄을 고친다: ([\s\S]*)\)$/) ?? [])[1] || '',
    where: firstSection(sections, '어디서 배웠나', '근거'),
    extra: Object.entries(sections).filter(([key]) => key.startsWith('덧붙임') || key === '절차').map(([key, value]) => `## ${key}\n${value}`).join('\n\n'),
    body,
    ...extra,
  }
}

const readStats = () => {
  try { return JSON.parse(readFileSync(STATS, 'utf8')) } catch { return { applied: 0, discarded: 0 } }
}
const bumpStat = (key) => {
  const stats = readStats()
  stats[key] = (stats[key] ?? 0) + 1
  try { writeFileSync(STATS, JSON.stringify(stats)) } catch { /* 수만 못 셀 뿐 */ }
}

// 공책·기록에 커밋 안 된 변경이 몇 개인지 — "커밋해줘" 안내용
const uncommitted = () => {
  try {
    const out = execFileSync('git', ['status', '--porcelain', '-uall', '--', 'docs/knowledge'], { cwd: ROOT, encoding: 'utf8' })
    return out.split('\n').filter((line) => /docs\/knowledge\/(learned\/|.*gotchas\.md)/.test(line)).length
  } catch {
    return 0
  }
}

export const listLearn = () => {
  const candidates = existsSync(ISSUES)
    ? readdirSync(ISSUES).filter((file) => isLearnIssue(file))
      .map((file) => ({ file, text: readFileSync(join(ISSUES, file), 'utf8') }))
      .filter(({ text }) => !/^status:\s*(done|wontfix)/m.test(text))
      .map(({ file, text }) => view(`issues/${file}`, text, { created: statSync(join(ISSUES, file)).mtime.toISOString().slice(0, 10) }))
      .sort((left, right) => right.created.localeCompare(left.created))
    : []
  const learned = existsSync(LEARNED)
    ? readdirSync(LEARNED).filter((file) => file.endsWith('.md') && file !== 'README.md')
      .map((file) => {
        const text = readFileSync(join(LEARNED, file), 'utf8')
        const { meta } = parse(text)
        return view(`docs/knowledge/learned/${file}`, text, { applied: meta.applied || '', original: (parse(text).sections['원래 줄'] || '') })
      })
      .sort((left, right) => right.applied.localeCompare(left.applied))
    : []
  return { candidates, learned, stats: readStats(), uncommitted: uncommitted() }
}

// ── 안전한 경로 ──────────────────────────────────────────────────────────
const inside = (rel, dir) => {
  const path = normalize(join(ROOT, rel))
  return path.startsWith(join(ROOT, dir) + sep) && existsSync(path) ? path : null
}
// 공책은 이미 있는 docs/knowledge/<영역>/gotchas.md 만 — learned/ 기록·규칙 문서·없는 폴더에 쓰지 않는다
const notebookPath = (target) => {
  const file = (target || '').split('#')[0]
  if (!/^docs\/knowledge\/[\w.-]+(?:\/[\w.-]+)*\/gotchas\.md$/.test(file) || file.includes('..') || file.startsWith('docs/knowledge/learned/')) return null
  const path = join(ROOT, file)
  return existsSync(path) ? path : null
}
const toTrash = (path) => {
  const to = join(ROOT, '.board-trash', today(), relative(ROOT, path))
  mkdirSync(dirname(to), { recursive: true })
  renameSync(path, existsSync(to) ? `${to}.${Date.now()}` : to)
}
const oneLine = (text) => String(text ?? '').replace(/\s*\n\s*/g, ' ').trim()
const marker = (id) => `<!-- learn:${id} -->`

// ── 공책 줄 넣기·바꾸기·빼기 ─────────────────────────────────────────────
// 줄 비교용 — 앞의 "- " 와 뒤의 학습 표시를 떼고 공백을 하나로
const bare = (row) => oneLine(row).replace(/^[-*]\s+/, '').replace(/\s*<!-- learn:[^>]+ -->\s*$/, '').trim()
const markerOf = (row) => (row.match(/<!-- learn:([^>]+) -->/) ?? [])[1] ?? ''
// 강화할 기존 줄 — 정확히 같은 줄만(부분 일치로 다른 줄을 덮지 않는다)
const findStrengthen = (path, strengthen) => {
  const needle = bare(strengthen)
  if (!needle) return null
  const rows = readFileSync(path, 'utf8').split('\n')
  const index = rows.findIndex((row) => bare(row) === needle)
  return index < 0 ? null : { index, row: rows[index], learnedId: markerOf(rows[index]) }
}
const insertLine = (path, id, rule, found) => {
  let text = readFileSync(path, 'utf8')
  const line = `- ${oneLine(rule)} ${marker(id)}`
  if (found) {
    const rows = text.split('\n')
    rows[found.index] = line
    writeFileSync(path, rows.join('\n'))
    return found.row
  }
  if (!text.includes(`\n${SECTION}\n`)) text = `${text.trimEnd()}\n\n${SECTION}\n\n${SECTION_NOTE}\n`
  text = `${text.trimEnd()}\n${line}\n`
  writeFileSync(path, text)
  return ''
}
const replaceLine = (path, id, rule) => {
  if (!existsSync(path)) return false
  const text = readFileSync(path, 'utf8')
  const rows = text.split('\n')
  const index = rows.findIndex((row) => row.includes(marker(id)))
  if (index < 0) return false
  rows[index] = `- ${oneLine(rule)} ${marker(id)}`
  writeFileSync(path, rows.join('\n'))
  return true
}
const removeLine = (path, id, original) => {
  if (!existsSync(path)) return false
  const rows = readFileSync(path, 'utf8').split('\n')
  const index = rows.findIndex((row) => row.includes(marker(id)))
  if (index < 0) return false
  if (original) rows[index] = original
  else rows.splice(index, 1)
  writeFileSync(path, rows.join('\n'))
  return true
}

const ledgerText = (item, { applied, original }) => `---
id: ${item.lid}
title: ${oneLine(item.title)}
target: ${item.target}
source: ${item.source}
signal: ${item.signal}
basis: ${item.basis || ''}
applied: ${applied}
---

## 무엇을 배웠나
${item.explain.trim()}

## 왜 중요한가
${item.why.trim()}

## 공책에 넣을 문장
${oneLine(item.rule)}

## 어디서 배웠나
${item.where.trim()}
${original ? `\n## 원래 줄\n${original}\n` : ''}${item.extra ? `\n${item.extra}\n` : ''}`

// ── 동작 ────────────────────────────────────────────────────────────────
export const applyLearn = (id, edits = {}) => {
  const path = inside(id, 'issues')
  if (!path || !isLearnIssue(path)) return { error: '학습 후보를 찾지 못했어요' }
  const item = view(id, readFileSync(path, 'utf8'))
  if (item.skill) return { error: '스킬 후보는 [헤르메스에게 맡기기]로 — 헤르메스가 스킬 파일을 만든다' }
  Object.assign(item, Object.fromEntries(Object.entries(edits).filter(([key, value]) => ['title', 'explain', 'why', 'rule'].includes(key) && typeof value === 'string' && value.trim())))
  if (!item.rule.trim()) return { error: '공책에 넣을 문장이 비어 있어요' }
  const notebook = notebookPath(item.target)
  if (!notebook) return { error: `공책 위치가 올바르지 않아요: ${item.target || '(없음)'}` }
  let found = null
  if (item.strengthen) {
    found = findStrengthen(notebook, item.strengthen)
    if (!found) return { error: '강화할 기존 줄을 공책에서 찾지 못했어요 — [고쳐서 넣기]에서 "공책에 넣을 문장"을 확인하거나, 후보의 strengthen 줄을 공책 줄과 똑같이 맞춰 주세요' }
  }
  // 이미 학습된 줄을 강화 — 그 학습(X)을 이어받는다: 표시는 X 그대로, X 기록의 문장을 바꾸고 이 후보는 덧붙임으로(R2=A)
  if (found?.learnedId) {
    const ledgerPath = join(LEARNED, `${found.learnedId}.md`)
    if (!existsSync(ledgerPath)) return { error: `이어받을 학습 기록(${found.learnedId})이 없어요 — [학습한 내용]을 확인해 주세요` }
    replaceLine(notebook, found.learnedId, item.rule)
    const ledger = readFileSync(ledgerPath, 'utf8')
      .replace(/(## 공책에 넣을 문장\n)[^\n]*/, `$1${oneLine(item.rule)}`)
    writeFileSync(ledgerPath, `${ledger.trimEnd()}\n\n## 덧붙임 (${today()} · ${item.source})\n- ${oneLine(item.explain)}\n- 이전 문장: ${bare(found.row)}\n`)
    toTrash(path)
    bumpStat('applied')
    return { ok: true, notebook: relative(ROOT, notebook), inherited: found.learnedId }
  }
  // 같은 id 가 이미 있으면(같은 날 같은 문장) 접미사를 붙여 기존 기록·줄을 덮지 않는다
  let lid = basename(path, '.md')
  for (let suffix = 2; existsSync(join(LEARNED, `${lid}.md`)) || readFileSync(notebook, 'utf8').includes(marker(lid)); suffix += 1) lid = `${basename(path, '.md')}-${suffix}`
  item.lid = lid
  const original = insertLine(notebook, item.lid, item.rule, found)
  mkdirSync(LEARNED, { recursive: true })
  writeFileSync(join(LEARNED, `${item.lid}.md`), ledgerText(item, { applied: today(), original }))
  toTrash(path)
  bumpStat('applied')
  return { ok: true, notebook: relative(ROOT, notebook), strengthened: Boolean(original) }
}

export const discardLearn = (id) => {
  const path = inside(id, 'issues')
  if (!path || !isLearnIssue(path)) return { error: '학습 후보를 찾지 못했어요' }
  toTrash(path)
  bumpStat('discarded')
  return { ok: true }
}

export const editLearned = (id, edits = {}) => {
  const path = inside(id, 'docs/knowledge/learned')
  if (!path) return { error: '학습한 내용을 찾지 못했어요' }
  const text = readFileSync(path, 'utf8')
  const item = view(id, text)
  const { meta, sections } = parse(text)
  Object.assign(item, Object.fromEntries(Object.entries(edits).filter(([key, value]) => ['title', 'explain', 'why', 'rule'].includes(key) && typeof value === 'string' && value.trim())))
  item.lid = meta.id || basename(path, '.md')
  const notebook = notebookPath(item.target)
  const moved = notebook ? replaceLine(notebook, item.lid, item.rule) : false
  writeFileSync(path, ledgerText(item, { applied: meta.applied || today(), original: sections['원래 줄'] || '' }))
  return { ok: true, notebookUpdated: moved }
}

export const removeLearned = (id) => {
  const path = inside(id, 'docs/knowledge/learned')
  if (!path) return { error: '학습한 내용을 찾지 못했어요' }
  const { meta, sections } = parse(readFileSync(path, 'utf8'))
  const notebook = notebookPath(meta.target)
  const removed = notebook ? removeLine(notebook, meta.id || basename(path, '.md'), sections['원래 줄'] || '') : false
  toTrash(path)
  return { ok: true, notebookUpdated: removed }
}
