# 에이전트가 작업을 마치면 자동으로 리뷰 띄우기 (처음 요청: '리뷰할까요?' 묻기)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-10-01 11:30 / 헤르메스 (Checkpoint 를 실제 진행대로 채움)
- Status: done
- Owner: Mason
- Agent: hermes
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main · 08afdb3

### Progress
- [x] 처음 요청 "작업 끝나면 '리뷰할까요?' 묻게" → 작업 중 "자동으로 리뷰하게" 로 바뀜
- [x] delegate.sh 에이전트 머리말 · reporting.md · CLAUDE.md 4단계 · git.md · call 스킬 — 코드를 바꾼 요청을 보고하면 묻지 않고 옆 reviewer pane (조사만·승인 뒤 변경 없음이면 생략)
- [x] 경량 흐름 다이어그램(리뷰 (선택) → 자동 리뷰) 재생성 · playbook
- [x] 커밋·push 08afdb3

### Next
1. 없음

### Blocked
- 없음

### Validation
- bash -n delegate.sh · archify validate/deliver(standard) ok · "리뷰할까요" 잔여 0
- 이미 떠 있는 에이전트 pane 은 뜰 때 받은 머리말이라 적용 안 됨(새로 띄운 pane 부터)

## 지시
> 에이전트가 작업을 마치면 '리뷰할까요?' 를 묻게 → (작업 중 변경) 자동으로 리뷰하게

## 결과 (2026-10-01 헤르메스)
- 요청: 처음엔 "작업 끝나면 리뷰할까요? 묻게" → 작업 중 "아니다 자동으로 리뷰하게" 로 바뀜
- 반영: 코드를 바꾼 요청을 보고하면 에이전트가 **묻지 않고 바로** 옆 reviewer pane 을 띄운다. 조사만 했거나 마지막 승인 뒤 변경이 없으면 생략. 결론이 나오면 사용자에게 보여 주고 수정 필요면 무엇을 고칠지 묻는다
- 파일: scripts/delegate.sh(에이전트 머리말) · docs/knowledge/common/reporting.md · CLAUDE.md 4단계 · docs/knowledge/common/git.md · .claude/skills/call/SKILL.md · docs/diagrams/hermes-flow-light.{workflow.json,html} · docs/playbook.html
- 검증: bash -n delegate.sh · archify validate/deliver(standard) ok · "리뷰할까요" 잔여 0
- 이미 떠 있는 에이전트 pane 은 뜰 때 받은 머리말을 쓰므로 새 규칙이 적용되지 않는다(새로 띄운 pane 부터)

## Commits
- 2026-10-01 · hermes · main · 08afdb3 · 에이전트가 코드를 바꾼 요청을 보고하면 자동으로 리뷰를 띄운다 · bash -n·archify ok · push 됨
