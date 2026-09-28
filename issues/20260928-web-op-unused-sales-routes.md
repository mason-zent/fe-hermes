---
title: web-op /api/sales/** Route Handler 17개를 레포 안에서 아무도 부르지 않는다
status: open
repo: web-op
kind: check
severity: medium
source: 다이어그램 가이드 작성 2026-09-28
plan:
---

레포 안 호출자는 sso(`/api/sales/auth/sso`) 하나뿐이다. 외부(콘솔·다른 서비스)에서 부르는지, 죽은 코드인지 확인이 필요하다.

## 근거 (origin/prd 4ac5be7)
- `git grep "/api/sales" origin/prd -- src` → `SalesAuthApiClient.ts:111` 만
- `src/app/api/sales/**` Route Handler 17개

## 할 일
- 운영 로그(Datadog 등)나 백엔드 담당자에게 호출 여부 확인 — 백엔드는 헤르메스 범위 밖
