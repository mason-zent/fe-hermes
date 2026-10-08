// README + 01~09 도메인 문서를 공유용 HTML 한 파일로 묶는다
// 사용: node tools/build-html.mjs <marked 패키지 경로(lib/marked.esm.js)> [출력 파일]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const docDir = path.dirname(toolsDir);
const { Marked } = await import(pathToFileURL(process.argv[2]).href);
const outFile = process.argv[3] ?? path.join(docDir, 'refund-web-graphql-rest.html');

const domainFiles = fs.readdirSync(docDir).filter((name) => /^0\d-.*\.md$/.test(name)).sort();
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// GitHub 식 제목 슬러그 (README 안 링크와 맞춘다)
const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');

const render = (markdown, idPrefix) => {
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        const plain = text.replace(/`/g, '');
        const id = idPrefix ? `${idPrefix}-${slugify(plain)}` : slugify(plain);
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      code({ text, lang }) {
        if (lang === 'mermaid') return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
        return `<pre class="code"><code>${escapeHtml(text)}</code></pre>\n`;
      },
      link({ href, tokens }) {
        const inner = this.parser.parseInline(tokens);
        // 문서 사이 링크 → 한 파일 안의 앵커
        let target = href;
        const match = /^\.\/(0\d-[a-z-]+|README)\.md(?:#(.+))?$/.exec(href);
        if (match) target = match[2] ? `#${match[2]}` : match[1] === 'README' ? '#readme' : `#domain-${match[1]}`;
        const external = /^https?:/.test(target);
        return `<a href="${target}"${external ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
      }
    }
  });
  return marked.parse(markdown);
};

const readme = fs.readFileSync(path.join(docDir, 'README.md'), 'utf8')
  // 도구 안내(마지막 줄)는 공유본에 넣지 않는다
  .replace(/\n---\n\n이 폴더의 01~09 문서는[\s\S]*$/, '\n');
const domains = domainFiles.map((file) => {
  const markdown = fs.readFileSync(path.join(docDir, file), 'utf8');
  const id = file.replace(/\.md$/, '');
  const title = /^# (.+)$/m.exec(markdown)[1];
  const cards = [...markdown.matchAll(/^### (\d{2}-\d{2}) `([^`]+)` — (.+)$/gm)].map((match) => ({ id: match[1], field: match[2], label: match[3] }));
  // 도메인 문서 안의 README 링크 줄은 빼고, 카드마다 감싸서 검색할 수 있게 한다
  const body = render(markdown.replace(/^> \[README\]\(\.\/README\.md\) · /m, '> '), id)
    .replace(/<hr>\s*(?:<p>)?<a id="(\d{2}-\d{2})"><\/a>(?:<\/p>)?/g, '</section><section class="card" data-card="$1" id="$1">')
    .replace(/<\/section>(<section class="card")/, '$1');
  return { id, title, cards, html: `${body}</section>` };
});

const nav = [
  `<a class="nav-top" href="#readme">개요 · 진행표</a>`,
  ...domains.map(
    (domain) =>
      `<details class="nav-domain"><summary><a href="#domain-${domain.id}">${escapeHtml(domain.title)}</a> <span class="count">${domain.cards.length}</span></summary>${domain.cards
        .map((card) => `<a class="nav-card" data-search="${escapeHtml(`${card.id} ${card.field} ${card.label}`.toLowerCase())}" href="#${card.id}"><span class="cid">${card.id}</span> ${escapeHtml(card.field)}<small>${escapeHtml(card.label)}</small></a>`)
        .join('')}</details>`
  )
].join('\n');

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>환급 웹 GraphQL → REST 전환 작업 문서</title>
<style>
  :root { --bg:#fff; --fg:#1f2328; --muted:#656d76; --line:#d0d7de; --soft:#f6f8fa; --accent:#0969da; --side:300px; }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.65 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Noto Sans KR",sans-serif; color:var(--fg); background:var(--bg); }
  aside { position:fixed; inset:0 auto 0 0; width:var(--side); overflow:auto; border-right:1px solid var(--line); background:var(--soft); padding:16px 12px 40px; }
  aside h1 { font-size:15px; margin:0 0 10px; }
  aside input { width:100%; padding:7px 10px; border:1px solid var(--line); border-radius:6px; font:inherit; margin-bottom:10px; }
  aside a { color:var(--fg); text-decoration:none; }
  .nav-top { display:block; font-weight:600; padding:4px 6px; }
  .nav-domain summary { cursor:pointer; padding:4px 6px; font-weight:600; }
  .nav-domain .count { color:var(--muted); font-weight:400; font-size:12px; }
  .nav-card { display:block; overflow-wrap:anywhere; padding:3px 6px 3px 18px; font-size:13px; border-radius:4px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  .nav-card small { display:block; font-family:-apple-system,sans-serif; color:var(--muted); font-size:11.5px; }
  .nav-card:hover { background:#eaeef2; }
  .cid { color:var(--muted); }
  main { margin-left:var(--side); padding:24px 40px 120px; max-width:calc(var(--side) + 1200px); }
  .doc { border-bottom:3px solid var(--line); padding-bottom:32px; margin-bottom:32px; }
  h1 { font-size:26px; border-bottom:1px solid var(--line); padding-bottom:8px; }
  h2 { font-size:20px; margin-top:32px; border-bottom:1px solid var(--line); padding-bottom:6px; }
  h3 { font-size:17px; margin-top:8px; }
  table { border-collapse:collapse; display:block; overflow:auto; max-width:100%; margin:10px 0 16px; font-size:13.5px; }
  th, td { border:1px solid var(--line); padding:5px 10px; vertical-align:top; }
  th { background:var(--soft); text-align:left; white-space:nowrap; }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; background:rgba(175,184,193,.2); padding:1px 5px; border-radius:4px; }
  pre.code { background:var(--soft); border:1px solid var(--line); border-radius:6px; padding:12px 14px; overflow:auto; max-height:520px; font-size:12.5px; line-height:1.5; }
  pre.code code { background:none; padding:0; }
  pre.mermaid { background:#fff; border:1px solid var(--line); border-radius:6px; padding:12px; }
  blockquote { margin:10px 0; padding:4px 14px; color:var(--muted); border-left:4px solid var(--line); }
  a { color:var(--accent); }
  .card { border:1px solid var(--line); border-radius:8px; padding:4px 20px 12px; margin:18px 0; scroll-margin-top:12px; }
  .card:target { outline:3px solid #54aeff; }
  .card.hidden, .nav-card.hidden { display:none; }
  hr { border:0; border-top:1px solid var(--line); }
  .stamp { color:var(--muted); font-size:12px; margin-top:6px; }
  @media print { aside { display:none; } main { margin:0; } }
  @media (max-width:900px) { aside { position:static; width:auto; } main { margin:0; padding:16px; } }
</style>
</head>
<body>
<aside>
  <h1>환급 웹 GraphQL → REST</h1>
  <input id="q" type="search" placeholder="API 이름·설명 검색 (예: survey, 신청)">
  ${nav}
  <div class="stamp">만든 시각 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</div>
</aside>
<main>
  <section class="doc" id="readme">${render(readme, '')}</section>
  ${domains.map((domain) => `<section class="doc" id="domain-${domain.id}">${domain.html}</section>`).join('\n')}
</main>
<script>
  // 검색: 왼쪽 목록과 본문 카드를 같이 거른다
  const input = document.getElementById('q');
  input.addEventListener('input', () => {
    const keyword = input.value.trim().toLowerCase();
    document.querySelectorAll('.nav-card').forEach((link) => {
      const hit = !keyword || link.dataset.search.includes(keyword);
      link.classList.toggle('hidden', !hit);
      const card = document.querySelector('[data-card="' + link.getAttribute('href').slice(1) + '"]');
      if (card) card.classList.toggle('hidden', !hit);
      if (keyword && hit) link.closest('details').open = true;
    });
  });
</script>
<script type="module">
  // 흐름도 — 인터넷이 없으면 글로 보인다
  try {
    const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    await mermaid.run({ querySelector: 'pre.mermaid' });
  } catch (error) { console.warn('mermaid 로드 실패', error); }
</script>
</body>
</html>
`;
fs.writeFileSync(outFile, html);
console.log(`${outFile} · ${(html.length / 1024).toFixed(0)}KB · 도메인 ${domains.length} · 카드 ${domains.reduce((sum, domain) => sum + domain.cards.length, 0)}`);
