import html, os, sys

D = os.path.dirname(os.path.abspath(__file__))
TABS = [
    ("refund-web 개요",    "refund-web.architecture.html",        "앱 하나의 큰 그림"),
    ("refund-web 상세",    "refund-web-detail.architecture.html", "화면 → 훅 → Relay 도메인 컬럼"),
    ("환급 플로우",        "refund-flow.workflow.html",           "인증 → 조회 → 신청 → 설문"),
    ("조회 상세",          "refund-lookup.workflow.html",         "폴링 · 대기열 · 오류 분기"),
    ("신청 상세",          "refund-apply.workflow.html",          "카드 · 계좌 · 예금주 · 병렬 신청"),
    ("인증 · 세션 시퀀스", "refund-auth.sequence.html",           "토큰 발급과 만료 처리"),
    ("간편인증 상태",      "hometax-auth.lifecycle.html",         "서명 대기 · 폴링 · 만료"),
    ("회원가입 · CI",      "sign-up.workflow.html",               "가입 여부 판정과 본인인증"),
    ("오류 코드 매핑",     "error-routing.architecture.html",     "코드 → 안내 화면 대응표"),
    ("상태 저장소",        "refund-state.dataflow.html",          "atom · sessionStorage · 메모리"),
    ("GraphQL 문서",       "refund-graphql.dataflow.html",        "도메인별 쿼리 · 뮤테이션 60건"),
    ("트래킹 전송",        "tracking.dataflow.html",              "Mixpanel · 픽셀 · MSK 적재"),
]

buttons, panels = [], []
for i, (name, fn, desc) in enumerate(TABS):
    with open(os.path.join(D, fn), encoding="utf-8") as f:
        srcdoc = html.escape(f.read(), quote=True)
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
<title>refund-web 아키텍처 다이어그램</title>
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
  <h1>refund-web 아키텍처 다이어그램</h1>
  <p class="sub">Archify 로 생성 · 저장소 리비전 4be90b5e 기준 · 각 탭은 독립 실행되는 다이어그램입니다</p>
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
      try { localStorage.setItem('refund-diagram-tab', idx); } catch (e) {}
    });
  });
  try {
    const saved = localStorage.getItem('refund-diagram-tab');
    if (saved !== null) {
      const target = document.querySelector('.tab[data-idx="' + saved + '"]');
      if (target) target.click();
    }
  } catch (e) {}
</script>
</body>
</html>
"""
out = os.path.join(D, "refund-web-architecture.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(page.replace("__BUTTONS__", "\n".join(buttons)).replace("__PANELS__", "\n".join(panels)))
print(out, round(os.path.getsize(out) / 1024 / 1024, 2), "MB")
