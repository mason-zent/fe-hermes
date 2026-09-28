import html, json, os, sys

D = os.path.dirname(os.path.abspath(__file__))
# 탭 사이 드릴다운: {출발 탭 번호: {노드 id: 도착 탭 번호}}
DRILL = {
    0: {
        "shell":     {"tab": 1, "label": "Provider 순서 · 가드 보기 →"},
        "guard":     {"tab": 1, "label": "가드 8종 보기 →"},
        "home":      {"tab": 2, "label": "20화면 전수 보기 →"},
        "etc":       {"tab": 2, "label": "20화면 전수 보기 →"},
        "authed":    {"tab": 2, "label": "20화면 전수 보기 →"},
        "login":     {"tab": 2, "label": "20화면 전수 보기 →"},
        "chat":      {"tab": 3, "label": "채팅 스트림 심층 보기 →"},
        "chathooks": {"tab": 3, "label": "채팅 스트림 심층 보기 →"},
        "banner":    {"tab": 4, "label": "답변 알림 · 웹 푸시 보기 →"},
        "pushhooks": {"tab": 4, "label": "답변 알림 · 웹 푸시 보기 →"},
        "sw":        {"tab": 4, "label": "답변 알림 · 웹 푸시 보기 →"},
    },
    1: {"banner": {"tab": 4, "label": "답변 알림 · 웹 푸시 보기 →"}},
    2: {"chatlayout": {"tab": 3, "label": "채팅 스트림 심층 보기 →"}},
    3: {"frame": {"tab": 4, "label": "done 뒤 ACK · 알림 보기 →"}},
}

TABS = [
    ("sena-web 상세",     "sena-web-detail.architecture.html", "진입 → 셸 → 가드 → 화면군 → 훅 → 관문"),
    ("루트 셸 · 가드",    "shell-guard.architecture.html",     "Provider 순서 · 가드 8종"),
    ("화면 20",           "screens.architecture.html",         "page.tsx 전수 · 공개 6 · 채팅 2 · 인증 6 · 로그인 6"),
    ("채팅 스트림",       "chat-stream.architecture.html",     "4갈래 요청 · <ENDLINE> SSE · 취소 · 복구"),
    ("답변 알림 · 웹 푸시","answer-push.architecture.html",     "SENA-730 · ACK · 배너 · 구독 수명"),
]

# 기준 커밋은 문구로 박지 않고 첫 탭 JSON 의 meta.repository.revision 에서 읽는다 (다시 고정해도 안 낡게)
with open(os.path.join(D, TABS[0][1].replace(".html", ".json")), encoding="utf-8") as f:
    REV = json.load(f)["meta"]["repository"]["revision"][:8]

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
<title>sena-web 아키텍처 다이어그램</title>
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
  <h1>sena-web 아키텍처 다이어그램</h1>
  <p class="sub">Archify 로 생성 · 저장소 리비전 __REV__ (origin/prd-sena) 기준 · <b>20화면 전수</b> · <b>점선 테두리 노드</b>를 클릭하면 Semantic passport 안에 <b>상세 보기 버튼</b>이 뜹니다</p>
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
      try { localStorage.setItem('sena-diagram-tab', idx); } catch (e) {}
    });
  });
  window.addEventListener('message', function (ev) {
    const d = ev.data;
    if (!d || typeof d.archifyDrill !== 'number') return;
    const target = document.querySelector('.tab[data-idx="' + d.archifyDrill + '"]');
    if (target) { target.click(); target.scrollIntoView({ block: 'nearest', inline: 'center' }); }
  });
  try {
    const saved = localStorage.getItem('sena-diagram-tab');
    if (saved !== null) {
      const target = document.querySelector('.tab[data-idx="' + saved + '"]');
      if (target) target.click();
    }
  } catch (e) {}
</script>
</body>
</html>
"""
out = os.path.join(D, "sena-web-architecture.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(page.replace("__BUTTONS__", "\n".join(buttons)).replace("__PANELS__", "\n".join(panels)).replace("__REV__", REV))
print(out, round(os.path.getsize(out) / 1024 / 1024, 2), "MB")
