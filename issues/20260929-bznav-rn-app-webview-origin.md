---
title: rn-app 웹뷰 브릿지·딥링크가 출처(origin)·도메인을 검사하지 않음
status: open
repo: bznav-rn-app
agent:
kind: check
severity: high
source: bznav-rn-app 온보딩 2026-09-29 (지식 문서 작성 중 관찰)
plan:
pr:
fix:
reason:
---

`WebViewModal` 의 `onMessage` 가 메시지 출처를 보지 않고 `onSignOut`·`closeWebView` 를 처리하고, 딥링크 v2 `OPEN_WEB_MODAL` 은 url 도메인을 검사하지 않는다. 외부 링크로 임의 웹 페이지를 앱 웹뷰에 띄우고 브릿지 액션을 부를 수 있는지 확인이 필요하다.

## 근거
- origin/prd `a161710` — `WebViewModal` onMessage, 딥링크 v2 `OPEN_WEB_MODAL` 처리부 (`docs/knowledge/bznav-rn-app/gotchas.md` 보안 절, `patterns.md` §4·§7)

## 할 일
- 실제로 외부 url 이 들어올 수 있는 경로인지 확인 (추측입니다 — 실행해 보지 않았다)
- 필요하면 허용 도메인 목록·origin 검사 도입 여부를 사용자와 정한다
