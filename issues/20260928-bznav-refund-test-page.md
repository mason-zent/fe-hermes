---
title: refund-web 운영 브랜치에 가드 없는 테스트 페이지 /tax/refund/test
status: open
repo: bznav-web/refund-web
kind: code
severity: medium
source: 심층 다이어그램 2026-09-28
plan:
---

링크 모음 테스트 페이지가 prd-refund 의 `pages/` 에 가드 없이 있어 누구나 URL 로 열 수 있다. `/tax/refund` 경로라 noindex 헤더만 붙는다.

## 근거 (origin/prd-refund 5bcf139)
- `apps/refund-web/pages/tax/refund/test/` (파일 확인)

## 할 일
- 운영에서 빼거나 가드를 붙일지 결정 — 계획서 → bznav-refund-fe
