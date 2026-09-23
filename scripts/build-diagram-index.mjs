#!/usr/bin/env node
// docs/diagrams/index.html 을 실제 파일 목록에서 만든다.
// 다이어그램을 추가하면 이 스크립트를 다시 돌린다 — 손으로 카드를 늘리지 않는다.
//   node scripts/build-diagram-index.mjs
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'docs/diagrams');

// 타입별 표시 이름. architecture 만 파일명에 타입이 안 붙는다(먼저 만든 9장의 관례).
const TYPES = [
  { key: 'architecture', label: '구조', suffix: '.html' },
  { key: 'domains', label: '화면 맵', suffix: '.domains.html' },
  { key: 'sequence', label: '요청 흐름', suffix: '.sequence.html' },
  { key: 'lifecycle', label: '화면 상태', suffix: '.lifecycle.html' },
];

// 서비스 전체를 가로지르는 것 — 타입 4종 패턴이 아니라 한 장짜리다
// 서비스 심층 번들 — 한 HTML 에 탭으로 여러 장이 들어 있다
const DEEP = [
  {
    file: 'care-web/care-web-architecture.html',
    name: 'bznav care-web 심층',
    sub: '탭 3장 · 화면 78개 전수',
    desc: '상세 아키텍처(노드 26 · 근거 60) + 부가세 자료제출 35화면 + 종소세 자료제출 43화면. 노드를 클릭하면 실제 page.tsx 경로가 전부 뜬다.',
  },
];

const CROSS = [
  {
    file: 'data-sources.html',
    name: '데이터 출처 지도',
    sub: '출처 · 관문 · 서비스',
    desc: 'Orval+SWR / Relay / fetch 래퍼 / CMS 클라이언트 — 계열마다 관문이 완전히 다르다.',
  },
];

const GROUPS = [
  {
    title: '운영 콘솔 · 내부',
    items: [
      {
        base: 'client-brics-refund',
        name: 'client-brics-refund',
        sub: '환급 운영 콘솔 · 13002',
        desc: 'layout 권한 가드 25개 · Orval 생성물(태그명 한글) · lib/swr 임시 훅 · 모달 3방식',
      },
      {
        base: 'client-brics-hub',
        name: 'client-brics-hub',
        sub: 'Hub 콘솔 · 13003',
        desc: 'admin 병렬 라우트(works 이관) vs messages 중첩 라우트 · 내재화 사이드바 · Jest 순수 함수',
      },
      {
        base: 'client-brics-care',
        name: 'client-brics-care',
        sub: '케어 운영 콘솔 · 13001',
        desc: 'page 가드가 기본, layout 가드는 qa 하나 · zustand/useState 혼재 · 가드 없는 화면 주의',
      },
      {
        base: 'web-op',
        name: 'web-op',
        sub: 'Z-Enterprise 운영 웹 · 3000',
        desc: '레이어드 + 자체 BFF · 인증 세 갈래(JWT·링크 키·서버 키) · BaseApiGateway 상속 금지',
      },
    ],
  },
  {
    title: '비즈넵 사용자 웹',
    items: [
      {
        base: 'bznav-refund-web',
        name: 'bznav refund-web',
        sub: '비즈넵 환급 · 3200',
        desc: '5개 앱 중 유일한 Pages Router · webpack · Relay · 자체 sitemap',
      },
      {
        base: 'bznav-care-web',
        name: 'bznav care-web',
        sub: '비즈넵 케어 · 3100',
        desc: 'route group · CARE_PATHS 한글 키 · CareAuthGuard · 유일하게 type-check·test:unit 보유',
      },
      {
        base: 'bznav-brand-web',
        name: 'bznav brand-web',
        sub: '비즈넵 브랜드 · 3000',
        desc: 'DatoCMS GraphQL 단일 경로 · next-sitemap postbuild · Jotai 사용처 0건',
      },
      {
        base: 'bznav-sena-web',
        name: 'bznav sena-web',
        sub: '비즈넵 세나 · 3300',
        desc: 'AI 챗 상태 흐름 · route group · marked 렌더 · firebase-key.json 주의',
      },
      {
        base: 'bznav-plus-web',
        name: 'bznav plus-web',
        sub: '비즈넵 플러스 · 3400',
        desc: '계산기 3계층 · recharts · 노션 렌더 · gen:env 수동',
      },
    ],
  },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let total = 0;
const section = (group) => {
  const cards = group.items
    .map((item) => {
      const pills = TYPES.filter((type) => existsSync(join(DIR, item.base + type.suffix))).map((type) => {
        total++;
        return `<a class="pill" href="${item.base}${type.suffix}">${type.label}</a>`;
      });
      if (!pills.length) return '';
      return `      <div class="card">
        <div class="t">${esc(item.name)}</div>
        <div class="s">${esc(item.sub)}</div>
        <div class="d">${esc(item.desc)}</div>
        <div class="pills">${pills.join('')}</div>
      </div>`;
    })
    .filter(Boolean);
  return `    <h2>${esc(group.title)}</h2>\n    <div class="grid">\n${cards.join('\n')}\n    </div>`;
};
const deepCards = DEEP.filter((item) => existsSync(join(DIR, item.file)))
  .map((item) => {
    total++;
    return `      <div class="card">
        <div class="t">${esc(item.name)}</div>
        <div class="s">${esc(item.sub)}</div>
        <div class="d">${esc(item.desc)}</div>
        <div class="pills"><a class="pill" href="${item.file}">열기</a></div>
      </div>`;
  });
const deepSection = deepCards.length
  ? `    <h2>서비스 심층 (탭 번들)</h2>\n    <div class="grid">\n${deepCards.join('\n')}\n    </div>`
  : '';

const crossCards = CROSS.filter((item) => existsSync(join(DIR, item.file)))
  .map((item) => {
    total++;
    return `      <div class="card">
        <div class="t">${esc(item.name)}</div>
        <div class="s">${esc(item.sub)}</div>
        <div class="d">${esc(item.desc)}</div>
        <div class="pills"><a class="pill" href="${item.file}">열기</a></div>
      </div>`;
  });
const crossSection = crossCards.length
  ? `    <h2>서비스 전체를 가로지르는 것</h2>\n    <div class="grid">\n${crossCards.join('\n')}\n    </div>`
  : '';

const body = [deepSection, crossSection, ...GROUPS.map(section)].filter(Boolean).join('\n');

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>헤르메스 다이어그램</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 40px 28px 64px;
    background: #070b14; color: #e6edf6;
    font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Segoe UI', sans-serif;
    line-height: 1.6;
  }
  .wrap { max-width: 1060px; margin: 0 auto; }
  h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -.01em; }
  .lead { color: #8fa3bf; font-size: 14px; margin: 0 0 8px; }
  .note { color: #6d819c; font-size: 12.5px; margin: 0 0 36px; }
  .note code { background: #111a2b; padding: 2px 6px; border-radius: 5px; color: #9ec5ff; }
  h2 {
    font-size: 13px; color: #7f94b4; font-weight: 600;
    margin: 34px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #1b2740;
  }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
  .card {
    background: #0d1422; border: 1px solid #1b2740; border-radius: 12px;
    padding: 16px 18px; transition: border-color .15s, background .15s;
  }
  .card:hover { border-color: #26365a; }
  .t { font-size: 15px; font-weight: 700; margin-bottom: 3px; }
  .s { font-size: 12px; color: #6fd3c4; font-family: 'SF Mono', Menlo, monospace; margin-bottom: 8px; }
  .d { font-size: 13px; color: #93a6c2; }
  .pills { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 13px; }
  .pill {
    text-decoration: none; font-size: 12.5px; font-weight: 600;
    color: #cfe0f8; background: #111c2f; border: 1px solid #22314f;
    padding: 5px 11px; border-radius: 999px;
    transition: border-color .15s, background .15s, color .15s;
  }
  .pill:hover { border-color: #2f6df6; background: #16243c; color: #fff; }
  footer { margin-top: 44px; padding-top: 18px; border-top: 1px solid #1b2740; color: #5f738f; font-size: 12.5px; }
  footer code { background: #111a2b; padding: 2px 6px; border-radius: 5px; color: #9ec5ff; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>헤르메스 다이어그램</h1>
    <p class="lead">작업 흐름과 담당 레포를 인터랙티브 HTML 로 본다. 서비스마다 보는 각도를 나눠 두었다.</p>
    <p class="note"><b>구조</b>는 어떤 부품으로 이루어져 있는가, <b>화면 맵</b>은 실제로 어떤 화면이 몇 개씩 있는가, <b>요청 흐름</b>은 한 화면이 뜰 때 무엇이 오가는가, <b>화면 상태</b>는 어디서 갈라지고 멈추는가를 본다. 노드를 클릭하면 상세가 뜨고 <code>SRC</code> 배지는 실제 파일을 가리킨다.</p>
    <h2>작업 흐름</h2>
    <div class="grid">
      <div class="card">
        <div class="t">헤르메스 작업 흐름</div>
        <div class="s">Plan-First 6단계</div>
        <div class="d">요청 → 라우팅 → 작업 카드 → 승인 → /branch → 에이전트 pane → 검증 → 보고. 단계별 규칙이 카드에 들어 있다.</div>
        <div class="pills"><a class="pill" href="hermes-flow.html">열기</a></div>
      </div>
    </div>
${body}
    <footer>
      원본 스펙은 <code>docs/diagrams/*.json</code> 이고 <a href="https://github.com/tt-a1i/archify" style="color:#9ec5ff">Archify</a> 로 생성한다.
      이 목록은 <code>node scripts/build-diagram-index.mjs</code> 로 다시 만든다 — 카드를 손으로 늘리지 않는다.
      다시 만드는 방법과 스키마 함정은 <code>docs/diagrams/README.md</code> 에 있다.
      bznav <code>packages/*</code> 와 <code>zent-packages</code> 는 아직 없다.
    </footer>
  </div>
</body>
</html>
`;
writeFileSync(join(DIR, 'index.html'), html);
console.log(
  `✅ index.html — 서비스 ${GROUPS.reduce((n, g) => n + g.items.length, 0)}개 · 다이어그램 링크 ${total}개 + 작업 흐름 1`,
);
