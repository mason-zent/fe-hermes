---
title: web-op 응답 없는 네트워크 오류에서 오류 처리가 다시 예외를 냄
status: open
repo: web-op
agent: op-fe
kind: code
severity: medium
source: 지식 문서 점검 2026-09-29 (Claude·Codex 교차)
plan:
pr:
fix:
reason:
---

web-op 의 gateway·route 오류 처리는 서버 응답이 있다고 가정한다. 응답 없는 네트워크 오류(타임아웃·연결 실패)에서는 `response` 가 없어 catch 안에서 다시 예외가 나고, 사용자에게 안내 alert 나 JSON 오류 대신 처리되지 않은 오류가 된다.

## 근거 (origin/prd 4ac5be7 점검)
- `src/gateway/BaseApiGateway.ts:115` — `errorResponse.response.data.message` 를 가드 없이 읽는다
- `src/backend/repository/external/SalesExternalApiGateway.ts:22` — `error.response` 를 던진다(응답 없으면 undefined)
- `app/api/sales/statstics/route.ts:29,32` — catch 값의 중첩 필드를 가드 없이 읽는다
- 헤르메스 문서에 함정으로 적었다(`docs/knowledge/web-op/gotchas.md`·`workflows.md`). 신규 코드는 BaseApiGateway 상속 금지

## 할 일
- 응답 없는 오류를 정규화(기본 메시지·상태)하는 방향을 정한다 — 기존 BaseApiGateway 를 고칠지, 새 gateway 에서만 처리할지 사용자 확인 후 op-fe
