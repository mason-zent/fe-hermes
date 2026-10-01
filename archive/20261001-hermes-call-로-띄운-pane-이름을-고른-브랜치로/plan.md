# call 로 띄운 pane 이름을 고른 브랜치로

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-10-01 11:10 / 헤르메스
- Status: done
- Owner: Mason
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main db1e2f3

### Progress
- [x] 원인 — delegate.sh 가 띄울 때 메인 체크아웃 브랜치(zent-packages 는 feature/REF-3481)로 pane 이름·Work ref 를 적고, /call 에서 에이전트가 브랜치를 고른 뒤엔 아무도 고치지 않음
- [x] delegate.sh — --ask-branch 면 「브랜치 선택 중」으로 적고, 에이전트 pane 에 HERMES_AGENT export
- [x] new-branch.sh — 워크트리를 만들거나 이어 쓰면 HERMES_AGENT·HERDR_PANE_ID 가 있을 때 pane 이름을 「🤖 <에이전트> · <브랜치>」로
- [x] 지금 떠 있는 wK:p1 이름을 feature/bznav-pkg 로 바로잡음 · --reuse 로 동작 확인

### Next
1. 없음

### Blocked
- 없음

### Validation
- bash -n 두 파일 통과 · HERMES_AGENT=packages-fe HERDR_PANE_ID=wK:p1 new-branch.sh feature/bznav-pkg packages --reuse → pane 이름 바뀜 확인. 새 /call 로 처음부터 띄워 보지는 않음

## 지시
> /call 로 부른 에이전트가 브랜치를 정하면 pane 이름이 그 브랜치로 바뀌어야 하는데 메인 체크아웃 브랜치로 보인다 (zent-packages)

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-10-01 · hermes · main · db1e2f3 · /call pane 이름을 고른 브랜치로 · bash -n·--reuse 로 이름 변경 확인 · push 됨
