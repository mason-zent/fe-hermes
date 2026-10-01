---
title: 리뷰 뒤 결정 콘솔 후속 — 머리말 계획서 경로 절대화 · --decide 덮어쓰기 경고 · 리뷰 이력 보존
status: open
repo: hermes
agent:
kind: script
severity: low
source: 재리뷰 2026-10-01 (plans/refactor/20261001-리뷰-후-결정-콘솔-히스토리-묶음.md)
plan:
pr:
fix:
reason:
---

리뷰 뒤 결정 콘솔 작업의 재리뷰(승인)에서 나온 선택 제안과 문서·코드 불일치. 승인된 내용 그대로 커밋하고 여기로 넘긴다.

## 할 일
- `scripts/delegate.sh:66` 에이전트 머리말의 `plan-html.mjs <계획서>` · `board.sh open <계획서>` · `--decide` 자리표시자를 `$HERMES_DIR/$PLAN` 절대 경로로. 워크트리에서 `plans/…` 상대 경로를 주면 plan-html.mjs 가 실패한다. `docs/knowledge/common/reporting.md` 의 `node scripts/plan-html.mjs` 도 같다
- `--decide` 가 이미 확정된 결정을 말없이 덮어쓴다 — 이미 decided 가 있으면 경고하거나 `--force` 를 요구
- `--decide R1=…`(대문자)는 거부된다 — 콘솔 프롬프트는 제목 `R1 …` 으로 오므로 대소문자 무시로 찾거나 머리말에 "id 는 소문자"
- `--decide` 는 문자열만 — multi(배열) 결정은 못 다룬다(리뷰 형식은 택1이라 당장 문제 없음)
- `scripts/review-result.sh:41` 은 같은 브랜치의 `- Review result:` 줄을 덮어쓴다 → 히스토리 "리뷰" 칸에는 브랜치별 마지막 결론만 남는다(1차 "수정 필요" 는 사라짐, 내용은 '리뷰 뒤 결정' 절에 있음). 이력을 남기도록 바꿀지 정한다

## 근거
- 재리뷰 보고서(w2:p3P, 2026-10-01 11:18) 제안 1~4 · "문서와 코드가 어긋난 곳"
