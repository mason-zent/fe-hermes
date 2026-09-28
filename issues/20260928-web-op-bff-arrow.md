---
title: web-op 구조도의 gateway → BFF 화살표가 코드와 다르다
status: open
repo: web-op
kind: diagram
severity: medium
source: 다이어그램 가이드 작성 2026-09-28
plan:
---

sales 클라이언트는 BFF(`/api/sales/**`)를 거치지 않고 zent API 를 직접 부르는데, 구조도는 gateway → route(BFF) → service 로 그려져 있다. 지식 문서는 고쳤고 그림만 남았다.

## 근거 (origin/prd 4ac5be7)
- `src/gateway/sales/SalesAuthApiClient.ts:5,9` — `NEXT_PUBLIC_SERVER_ZENT_API_URL` 직접 호출, BFF 경유는 `:111` sso 하나
- `src/gateway/sales/SalesDataApiClient.ts:5`
- `docs/diagrams/web-op.architecture.json` gateway → route 연결

## 할 일
- `/api/sales/**` 17개를 외부에서 부르는지 먼저 확인(이슈 `20260928-web-op-unused-sales-routes`)
- 결과에 맞춰 구조도 연결을 고치고 재생성
