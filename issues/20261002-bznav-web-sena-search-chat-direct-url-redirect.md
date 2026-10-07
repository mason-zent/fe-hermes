---
title: sena 로그인 상태에서 /search-chat 을 주소로 바로 열면 홈으로 튕긴다
status: open
repo: bznav-web/sena-web
agent: bznav-sena-fe
kind: code
severity: low
source: plans/feature/20261001-bznav-web-앱-repo-패키지-zent-전환.md — 전체 QA(2026-10-02, bznav-sena-fe)
plan:
pr:
fix:
reason:
---

로그인한 상태여도 `/search-chat` 을 새로고침하거나 링크로 바로 열면 홈(`/`)으로 이동한다. 사이드바(데스크톱)로 들어가면 정상이고, 모바일은 메뉴 안에서 검색해 영향이 없다. 레이아웃 가드가 세션 확인 전(`status: 'checking'`, `isCurrentAppActive: false` 초기값)에 홈으로 보내는 것으로 보인다(추측). zent 패키지 전환과는 무관하다(코드는 import 만 바뀜, user-session 로직 차이 0).

## 근거
- `apps/sena-web/app/search-chat/layout.tsx` — `useEffect` 에서 `!auth.isCurrentAppActive` 면 `router.push(PATHS.HOME)`. `auth.status` 는 보지 않음
- `@zenterprise-inc/bznav-fe-user-session` `src/hooks/use-auth-session.ts:13` `useState(false)` · `contexts/AuthServiceContext.ts:11` 기본 `status: 'checking'`
- QA: 로그인 세션으로 `/search-chat` 직접 진입 → `/`(모바일·데스크톱 둘 다) · 사이드바 "채팅 검색" 클릭 → `/search-chat` 정상, "보험" 검색 결과 3개

## 할 일
- `auth.status === 'checking'` 동안은 이동을 미루게 고친다(다른 인증 화면 가드와 같은 방식인지 확인)
- 운영(origin/prd-sena)에서도 같은지 확인
