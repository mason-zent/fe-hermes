import html, json, os, sys

D = os.path.dirname(os.path.abspath(__file__))
# 탭 사이 드릴다운: {출발 탭 번호: {노드 id: 도착 탭 번호}}
DRILL = {
    0: {
        "shell":    {"tab": 1, "label": "화면 19개 전수 보기 →"},
        "calc":     {"tab": 2, "label": "계산기 3계층 펼쳐 보기 →"},
        "taxcheck": {"tab": 3, "label": "세금 진단 흐름 보기 →"},
        "content":  {"tab": 4, "label": "노션 렌더 보기 →"},
        "fortune":  {"tab": 4, "label": "운세 저장·병합 보기 →"},
    },
    1: {
        "sales":     {"tab": 2, "label": "매출 계산 3계층 보기 →"},
        "labor":     {"tab": 2, "label": "인건비 계산 3계층 보기 →"},
        "tax":       {"tab": 2, "label": "세금 계산 3계층 보기 →"},
        "tcLanding": {"tab": 3, "label": "진단 흐름 보기 →"},
        "tcAuth":    {"tab": 3, "label": "간편인증 심층 보기 →"},
        "tcCollect": {"tab": 3, "label": "수집 · 분석 심층 보기 →"},
        "tcResult":  {"tab": 3, "label": "결과 · 차트 심층 보기 →"},
        "content":   {"tab": 4, "label": "노션 렌더 보기 →"},
        "fortune":   {"tab": 4, "label": "운세 심층 보기 →"},
    },
}

TABS = [
    ("plus-web 상세",       "plus-web-detail.architecture.html",   "진입 → 셸 → 화면군 → 훅 → 서버 넷"),
    ("화면 19 전수",        "screens.architecture.html",           "계산기 10 · 진단 6 · 콘텐츠 1 · 운세 2"),
    ("계산기 3계층",        "calc-layers.architecture.html",       "8세트 · 폼 훅 → 상태 훅 → 순수 계산 · DP 로그"),
    ("세금 진단",           "tax-check.architecture.html",         "간편인증 → 홈택스 수집 → 통합분석 → recharts"),
    ("콘텐츠 · 운세",       "content-fortune.architecture.html",   "노션 두 갈래 · 사업자번호 운세 localStorage"),
]

buttons, panels = [], []
for i, (name, fn, desc) in enumerate(TABS):
    with open(os.path.join(D, fn), encoding="utf-8") as f:
        raw = f.read()
    mapping = DRILL.get(i)
    if mapping:
        child = (
            "<script>(function(){var M=" + json.dumps(mapping) + ";"
            "var b=document.createElement('button');b.type='button';"
            "b.style.cssText='margin-top:10px;display:none;width:100%;padding:8px 10px;"
            "border-radius:8px;border:1px solid currentColor;background:transparent;color:inherit;"
            "font:inherit;font-size:12px;font-weight:700;cursor:pointer';"
            "b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();"
            "if(b.dataset.t!==undefined)parent.postMessage({archifyDrill:Number(b.dataset.t)},'*');});"
            "function host(){var m=document.querySelector('.semantic-passport-meta');"
            "if(m&&m.parentElement)return m.parentElement;"
            "var f=document.getElementById('focus-passport-meta');"
            "return f?f.parentElement:null;}"
            "function sync(){var h=host();if(h&&b.parentElement!==h)h.appendChild(b);"
            "var s=document.querySelector('[data-focus-selected]');"
            "var id=s&&s.getAttribute('data-node-id');var d=id?M[id]:undefined;"
            "if(!d){b.style.display='none';return;}"
            "b.dataset.t=String(d.tab);b.textContent=d.label;b.style.display='block';}"
            "function mark(){Object.keys(M).forEach(function(id){"
            "var el=document.querySelector('[data-node-id=\\''+id+'\\']');"
            "if(!el||el.dataset.drill)return;el.dataset.drill='1';"
            "var r=el.querySelector('rect');if(r){r.setAttribute('stroke-dasharray','6 4');"
            "r.setAttribute('stroke-width','2');}});}"
            "new MutationObserver(sync).observe(document.documentElement,"
            "{attributes:true,subtree:true,attributeFilter:['data-focus-selected']});"
            "[200,700,1500].forEach(function(ms){setTimeout(function(){mark();sync();},ms);});"
            "})();</script>"
        )
        raw = raw.replace("</body>", child + "</body>", 1) if "</body>" in raw else raw + child
    srcdoc = html.escape(raw, quote=True)
    active = " is-active" if i == 0 else ""
    buttons.append(
        f'<button class="tab{active}" data-idx="{i}" type="button">'
        f'<span class="tab-name">{html.escape(name)}</span>'
        f'<span class="tab-desc">{html.escape(desc)}</span></button>'
    )
    panels.append(
        f'<div class="panel{active}" data-idx="{i}">'
        f'<iframe title="{html.escape(name)}" loading="lazy" srcdoc="{srcdoc}"></iframe></div>'
    )

page = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>plus-web 아키텍처 다이어그램</title>
<style>
  :root {
    color-scheme: light;
    --bg: #f6f7f9; --panel: #ffffff; --line: #e2e5ea;
    --text: #12161c; --muted: #66707e; --accent: #0f766e; --accent-soft: #e6f4f1;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --bg: #0d1014; --panel: #151a21; --line: #262d37;
      --text: #e8ecf1; --muted: #98a3b3; --accent: #2dd4bf; --accent-soft: #10302c;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --bg: #0d1014; --panel: #151a21; --line: #262d37;
    --text: #e8ecf1; --muted: #98a3b3; --accent: #2dd4bf; --accent-soft: #10302c;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard",
                 "Noto Sans KR", "Segoe UI", sans-serif;
    display: flex; flex-direction: column;
  }
  header { padding: 14px 20px 0; flex: 0 0 auto; }
  h1 { margin: 0 0 2px; font-size: 16px; letter-spacing: -0.01em; }
  .sub { margin: 0 0 12px; font-size: 12px; color: var(--muted); }
  nav { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 10px; }
  .tab {
    flex: 0 0 auto; text-align: left; cursor: pointer;
    background: var(--panel); color: var(--muted);
    border: 1px solid var(--line); border-radius: 9px;
    padding: 7px 12px; font: inherit; line-height: 1.35;
    transition: border-color .12s, color .12s, background .12s;
  }
  .tab:hover { border-color: var(--accent); }
  .tab.is-active { border-color: var(--accent); background: var(--accent-soft); color: var(--text); }
  .tab-name { display: block; font-size: 12.5px; font-weight: 600; }
  .tab-desc { display: block; font-size: 10.5px; color: var(--muted); margin-top: 1px; }
  main { flex: 1 1 auto; min-height: 0; padding: 0 20px 16px; }
  .panel { display: none; height: 100%; }
  .panel.is-active { display: block; }
  iframe {
    width: 100%; height: 100%; border: 1px solid var(--line);
    border-radius: 12px; background: var(--panel); display: block;
  }
</style>
</head>
<body>
<header>
  <h1>plus-web 아키텍처 다이어그램</h1>
  <p class="sub">Archify 로 생성 · prd-plus 리비전 edc6fe30 기준 · <b>19화면 전수</b> · <b>점선 테두리 노드</b>를 클릭하면 Semantic passport 안에 <b>상세 보기 버튼</b>이 뜹니다</p>
  <nav>__BUTTONS__</nav>
</header>
<main>__PANELS__</main>
<script>
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const idx = tab.dataset.idx;
      tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      panels.forEach(function (p) { p.classList.toggle('is-active', p.dataset.idx === idx); });
      try { localStorage.setItem('plus-diagram-tab', idx); } catch (e) {}
    });
  });
  window.addEventListener('message', function (ev) {
    const d = ev.data;
    if (!d || typeof d.archifyDrill !== 'number') return;
    const target = document.querySelector('.tab[data-idx="' + d.archifyDrill + '"]');
    if (target) { target.click(); target.scrollIntoView({ block: 'nearest', inline: 'center' }); }
  });
  try {
    const saved = localStorage.getItem('plus-diagram-tab');
    if (saved !== null) {
      const target = document.querySelector('.tab[data-idx="' + saved + '"]');
      if (target) target.click();
    }
  } catch (e) {}
</script>
</body>
</html>
"""
out = os.path.join(D, "plus-web-architecture.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(page.replace("__BUTTONS__", "\n".join(buttons)).replace("__PANELS__", "\n".join(panels)))
print(out, round(os.path.getsize(out) / 1024 / 1024, 2), "MB")
