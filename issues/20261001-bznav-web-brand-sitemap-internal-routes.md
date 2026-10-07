---
title: brand-web sitemap 에 /_global-error·/_not-found 가 들어간다
status: open
repo: bznav-web
agent: bznav-brand-fe
kind: bug
severity: low
source: bznav-brand-fe 2026-10-01 (zent 전환 ② build 확인 중) · plans/feature/20261001-bznav-web-앱-repo-패키지-zent-전환.md
plan:
pr:
fix:
reason:
---

`pnpm --filter brand-web build` 뒤 postbuild(next-sitemap)가 만든 `public/sitemap.xml` 의 `<loc>` 가 `/`, `/_global-error`, `/_not-found`, `/brand-resource` 다. `next-sitemap.config.mjs` 의 `getStaticAppRoutes` 가 `.next/server/app-paths-manifest.json` 의 `*/page` 를 모두 넣고 `EXCLUDE_ROUTES` 는 `/home` 만 빼서, Next 내부 라우트가 색인 대상에 들어간다.

- 전환 전(8622ccf27, @repo/*) build 도 같은 결과 — 이번 전환과 무관
- 약관(`/terms/[...terms]`)은 동적 라우트라 `[` 필터로 빠진다(의도인지 확인 필요)
- 제안: `EXCLUDE_ROUTES` 에 `/_global-error`·`/_not-found` 추가 또는 `_` 로 시작하는 경로 제외. 운영 sitemap 실물은 미확인
