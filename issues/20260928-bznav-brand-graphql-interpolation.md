---
title: brand-web 약관 쿼리가 URL 값을 GraphQL 문자열에 그대로 끼운다
status: open
repo: bznav-web/brand-web
kind: code
severity: high
source: 심층 다이어그램 2026-09-28
plan:
---

`/terms/<종류>/<버전>` 의 세그먼트 값이 variables 없이 DatoCMS 쿼리 문자열에 들어간다. 보안 영향(쿼리 주입) 확인이 필요하다.

## 근거 (origin/prd-brand 7f052c0)
- `apps/brand-web/lib/constants/graph-ql-query.ts:27,45,49`
- `apps/brand-web/lib/utils/dato-cms.ts:42-44`

## 할 일
- 영향 범위 판단 후 GraphQL variables 로 바꾸는 수정 — 계획서 → bznav-brand-fe
