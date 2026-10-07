---
title: sena 로그인 화면의 "비밀번호 찾기" 링크가 없는 라우트(/forgot-password)를 가리켜 404
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

`/signin` 에 들어가면 이메일 로그인 폼의 비밀번호 찾기 링크가 `/forgot-password` 를 prefetch 하다 404 가 난다(콘솔 에러 1). sena-web 에는 그 라우트가 없다. 이메일 로그인은 dev 에서만 보여서(운영·stg 는 숨김) 실사용 영향은 적다. 전환 전 `packages/user-sign`·`user-session` 에도 같은 링크가 있어 전환과 무관하다.

## 근거
- 전환 전 HEAD `packages/user-session/src/constants.ts:21` `forgotPassword: '/forgot-password'` · `packages/user-sign/src/components/SignItems.tsx:101`
- 전환 뒤 `@zenterprise-inc/bznav-fe-user-session` 0.0.0-dev-20261001234459 `src/constants.ts:21` 동일
- `apps/sena-web/app` 에 forgot-password 라우트 없음

## 할 일
- sena 에서 비밀번호 찾기를 지원할지 결정 → 라우트 추가 또는 링크 숨김(패키지 쪽이면 zent-packages)
