---
title: "[테스트] plus-web 계산기 훅이 8세트 모두 짝(use-<이름>·use-<이름>-form)을 갖췄는지 확인"
status: done
repo: bznav-web/plus-web
agent: bznav-plus-fe
kind: check
severity: low
source: 현황판 흐름 테스트 2026-09-28
plan: plans/task/20260928-bznav-plus-fe-테스트-plus-web-계산기-훅이-8세트-모두-짝-use-이름-use-.md
---

현황판 [처리 시작] → 경량 계획서 생성 → 이슈 워크트리 → 담당 에이전트 pane → 결과 기록 → 완료 가능 배지까지 한 바퀴 도는지 보려는 **테스트 이슈**다. 코드는 읽기만 한다.

## 근거
- `docs/knowledge/bznav-web/plus-web/structure.md` "`lib/hooks/calc/` ×8 + 공통 3"
- 대상: `apps/plus-web/lib/hooks/calc/<이름>/` (origin/prd-plus)

## 할 일
- 8개 폴더(breakeven · holiday-pay · salary-actual · salary-contract · simple-vat · store-sales · tax-penalty · vat) 각각에 `use-<이름>.ts` 와 `use-<이름>-form.ts` 가 있는지 확인
- 공통 파일 3개 이름 확인
- 결과를 이 파일 끝 `## 확인 결과` 에 표로 적고, `## 후속` 에 할 일이 없으면 `- [x] 없음` 을 적는다

## 확인 결과 (2026-09-28 · bznav-plus-fe)
기준 ref: `origin/prd-plus` = `edc6fe3009325aab275a90e8fa9c8fb668aa14e0` (워크트리 HEAD 와 동일, detached, 미커밋 변경 없음 — `git status --short --branch` → `## HEAD (no branch)`)
확인 명령: `git ls-tree -r --name-only edc6fe300 apps/plus-web/lib/hooks/calc/` → 파일 19개 (짝 8세트 16개 + 공통 3개)

| 폴더 | `use-<이름>.ts` | `use-<이름>-form.ts` |
|---|---|---|
| breakeven | ✅ `breakeven/use-breakeven.ts` | ✅ `breakeven/use-breakeven-form.ts` |
| holiday-pay | ✅ `holiday-pay/use-holiday-pay.ts` | ✅ `holiday-pay/use-holiday-pay-form.ts` |
| salary-actual | ✅ `salary-actual/use-salary-actual.ts` | ✅ `salary-actual/use-salary-actual-form.ts` |
| salary-contract | ✅ `salary-contract/use-salary-contract.ts` | ✅ `salary-contract/use-salary-contract-form.ts` |
| simple-vat | ✅ `simple-vat/use-simple-vat.ts` | ✅ `simple-vat/use-simple-vat-form.ts` |
| store-sales | ✅ `store-sales/use-store-sales.ts` | ✅ `store-sales/use-store-sales-form.ts` |
| tax-penalty | ✅ `tax-penalty/use-tax-penalty.ts` | ✅ `tax-penalty/use-tax-penalty-form.ts` |
| vat | ✅ `vat/use-vat.ts` | ✅ `vat/use-vat-form.ts` |

(경로는 모두 `apps/plus-web/lib/hooks/calc/` 기준)

공통 3개 (`lib/hooks/calc/` 바로 아래): `use-calculator-dp-log.ts` · `use-scroll-to-result.ts` · `use-slot-machine-digits.ts`

- 문서 근거: `docs/knowledge/bznav-web/plus-web/structure.md:17` "`use-<name>.ts` + `use-<name>-form.ts` ×8(breakeven·…·vat) + 공통 3" — ref 의 트리와 폴더명·개수 모두 일치
- 8개 외 추가 폴더, 짝이 빠진 폴더, 명명 규칙에서 벗어난 파일 없음. 위 기존 "확인 결과"(`find -type f` 기준)와도 결과가 같다
- 코드·다른 파일은 수정하지 않았다 (읽기 전용 확인). 검증 스크립트는 코드 변경이 없어 실행하지 않았다

## 후속
- [x] 없음
