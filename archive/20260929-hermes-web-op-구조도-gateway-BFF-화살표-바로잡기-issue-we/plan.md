# web-op 구조도 gateway→BFF 화살표 바로잡기 (issue web-op-bff-arrow)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 17:26 / 헤르메스 → hermes
- Status: done
- Agent: hermes
- Issue: issues/20260928-web-op-bff-arrow.md
- Work ref: hermes `main` (미커밋) · 코드는 origin/prd 4ac5be7 임시 체크아웃(지움)

### Progress
- [x] gateway 전수 조사(origin/prd) — 직접 6 · BFF 3곳(pipedrive 2·sso 1)
- [x] web-op.architecture.json: o10 gateway→ext 직접(위로 돌아감), o5 "BFF 일부", gateway 근거 3, route tag "호출처 확인 필요"
- [x] validate 9/9 · deliver · check-diagrams ✅
- [x] 커밋 be82b5d(구조도) · 7c68104(이슈 fix) push

### Next
1. 없음 — 호출처 판정은 web-op-unused-sales-routes 이슈

### Blocked
- 없음

### Validation
- (검증 스크립트 출력 표 · 실행 못 한 것은 "실행 못 함")

## 지시
> (지시문 없음 — pane 에서 대화로 지시)

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-09-29 · hermes · main · `be82b5d` — web-op 구조도 gateway 연결 · pushed
- 2026-09-29 · hermes · main · `7c68104` — 이슈 fix 기록 · pushed
