---
title: web-op 구조도의 gateway → BFF 화살표가 코드와 다르다
status: done
repo: web-op
kind: diagram
severity: medium
source: 다이어그램 가이드 작성 2026-09-28
plan:
fix: be82b5d
---

sales 클라이언트는 BFF(`/api/sales/**`)를 거치지 않고 zent API 를 직접 부르는데, 구조도는 gateway → route(BFF) → service 로 그려져 있다. 지식 문서는 고쳤고 그림만 남았다.

## 근거 (origin/prd 4ac5be7)
- `src/gateway/sales/SalesAuthApiClient.ts:5,9` — `NEXT_PUBLIC_SERVER_ZENT_API_URL` 직접 호출, BFF 경유는 `:111` sso 하나
- `src/gateway/sales/SalesDataApiClient.ts:5`
- `docs/diagrams/web-op.architecture.json` gateway → route 연결

## 할 일
- [ ] `/api/sales/**` 17개를 외부에서 부르는지 확인 — 그림에는 "호출처 확인 필요"로 남기고 판정은 이슈 `20260928-web-op-unused-sales-routes` 에서
- [x] 결과에 맞춰 구조도 연결을 고치고 재생성 — gateway→외부 API 직접(대부분) 추가, gateway→app/api 는 "BFF 일부"(pipedrive·sso), app/api 에 "호출처 확인 필요" 표시

## 확인 결과
- 2026-09-29 헤르메스 — origin/prd 4ac5be7 gateway 전수: ZENT API 직접 = SalesAuthApiClient·SalesDataApiClient·SalesDocumentFileUploadGateway·DocumentFileGateway·DocumentUploadGateway·DocumentsRequirementGateway (`NEXT_PUBLIC_SERVER_ZENT_API_URL`). BFF(`/api/**`) 경유 = PipedriveGateway·DocumentPipedriveGateway(`/api/pipedrive/deal`)·SalesAuthApiClient:111(`/api/sales/auth/sso`). EmployeeGateway 는 타입만
- 구조도 validate 9/9 · deliver · check-diagrams ✅ 최신
