# 스킬 정리 2차 — review branch status 삭제 guide monitor 축소 (Codex 교차)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 10:01 / 헤르메스
- Status: done
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (헤르메스 자체 구조)
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p38 (reviewer)

### Progress
- [x] 상태 확인 — main, 미커밋 없음
- [x] 실사용 집계(2주·세션 30: guide 10 · monitor 3 · call 2 · status 1 · sync 1 · 나머지 0) + Claude 안 + Codex 교차 → 사용자 확정: board 유지, 최종 6개(call·board·sync·diagram·guide·monitor)
- [x] 규칙 이관 → docs/knowledge/common/git.md "작업 브랜치 만들기"(이름 관례·RN 예외·여러 레포 같은 이름/스냅샷 매칭·bznav packages·건너뛴 레포 처리·선행 실패 시 멈춤·Work ref base SHA·끝난 뒤) · "현황 점검"(보호/폐기 브랜치 경고·blocked 사유). prBase 표는 복제하지 않고 config 참조. CLAUDE.md 3단계에서 이 절을 먼저 읽도록 연결
- [x] 삭제 review·branch·status, 축소 guide(메뉴·파일·열기·그림)·monitor(설명 정리)
- [x] 참조 정리: CLAUDE.md(3단계·Skills 표·"커맨드가 없는 것은 말로"), AGENTS.md, README, dispatch-protocol, call SKILL(reviewer 안내), bznav-rn-app 에이전트·지식, bznav-web rules, extending, playbook(카드 3개 제거·"그냥 말하기"에 리뷰/현황/브랜치·guide 카드·개수 6·트리·상태바 안내), 현황판 진행 지시 문구, commit.sh 메시지, 다이어그램 목록 문구 → 확인: 잔여 참조 grep 0건, bash -n commit.sh · node --check build-diagram-index.mjs 통과
- [x] reviewer 검토(w2:p38) → 수정 필요 2건 반영: git.md "기록"(delegate.sh 는 Work ref 를 통째로 다시 쓴다 → base SHA 는 Progress 에), CLAUDE.md 5단계(수정 필요는 사용자 확인 뒤 그 FE pane 에서 이어서 — 흐름 카드 json·html 동기화). 제안 2건 반영: guide 파일 인자는 실제 경로일 때만, diagrams/README /guide 표기

### Next
1. 없음

### Blocked
- 없음

### Validation
- 레포 검증 스크립트 대상 아님. 스크립트 문법 확인 통과. 잔여 참조 grep 0건

## 지시
> 스킬 전반 다시 체크 — 불필요한 게 또 있을 것 → Codex 의견 → "board 가 현황판이지 않아?"(유지)

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-09-30 · hermes · main · 1d9485d · 스킬 정리 2차 · reviewer 승인 · push 됨
