---
title: refund-web gen:survey-schema 산출물(survey-model.ts) 사용처 0 — knowledge 의 "설문 타입 = gen:survey-schema" 와 불일치
status: open
repo: bznav-web/refund-web
agent: bznav-refund-fe
kind: check
severity: low
source: plans/task/20261008-bznav-refund-fe-bznav-refund-fe-작업-pane-에서-지시.md (GraphQL 제거 가능성 조사)
plan:
pr:
fix:
reason:
---

`gen:survey-schema`(openapi-typescript → `graphql/schema/survey-model.ts`, gitignore)의 산출물을 import 하는 파일이 없다. 그런데 에이전트 프로필·knowledge 는 설문 타입을 이 산출물에서 가져온다고 적고 있다. 이 명령을 그대로 둘지, 아니면 지울지 확인이 필요하다.

## 근거
- `apps/refund-web/package.json` `gen:survey-schema` · `gen:api` 에 포함 (origin/dev dc6d98d29)
- `grep -r "survey-model" apps/refund-web --include=*.ts --include=*.tsx` → 0건 (같은 ref)
- `.claude/agents/bznav-refund-fe.md` "설문(survey)" 행 · `docs/knowledge/bznav-web/refund-web/patterns.md` survey 절

## 할 일
- 운영 기준(origin/prd-refund)에서도 0건인지 확인
- 0건이면 knowledge·프로필 문구를 고칠지, 스크립트를 없앨지 결정
