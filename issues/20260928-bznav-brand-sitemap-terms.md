---
title: brand-web sitemap 에 약관 URL 이 실제로 들어가는지 확인
status: open
repo: bznav-web/brand-web
kind: check
severity: low
source: 심층 다이어그램 2026-09-28
plan:
---

동적 경로 제외는 `additionalPaths` 헬퍼에만 있고, next-sitemap 기본 수집에는 generateStaticParams 로 빌드된 `/terms/*` 가 들어갈 수 있다. 약관 revalidate 3600 이 루트의 cookies() 동적 렌더 아래서 실제로 효과가 있는지도 같이 본다.

## 근거 (origin/prd-brand 7f052c0)
- `apps/brand-web/next-sitemap.config.mjs:4,19`
- `apps/brand-web/app/layout.tsx:131` `getServerWorkingPlatform()` → `cookies()`

## 할 일
- 빌드 산출 `public/sitemap.xml` 과 배포 응답 헤더로 확인 → 지식 문서 "확인 필요" 해소
