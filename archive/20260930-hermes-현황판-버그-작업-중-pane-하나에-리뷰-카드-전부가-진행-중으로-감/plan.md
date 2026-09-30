# 현황판 버그 — 작업 중 pane 하나에 리뷰 카드 전부가 진행 중으로 감

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 09:22 / 헤르메스
- Status: done
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (scripts/board/server.mjs)

### Progress
- [x] 원인 — server.mjs 브랜치 대체 매칭이 `workRef.includes(pane.branch)`. hermes 계획서 Work ref 는 모두 "main" 을 포함 → main 에서 도는 reviewer pane(w2:p36) 하나가 계획서 8장에 붙어 리뷰·완료 카드까지 진행 중으로
- [x] 수정 → 확인: 수정 전후 /api/state 비교 → 성공 조건: w2:p36 은 자기 Review 줄이 있는 계획서 1장에만, 나머지는 원래 칸 — 통과
- [x] branchMatches 단위 확인 8건 통과(보호 브랜치 제외 · `🌿 <브랜치>` 정확 일치 · 접두 일치 거부 · 정규식 특수문자)

### Next
1. 없음

### Blocked
- 없음

### Validation
- node --check 통과 · 단위 8/8 · 현황판 재시작 후 전후 비교 통과

## 지시
> 칸반 버그 — 작업 중인 것 하나가 리뷰에서 진행 중으로 가야 하는데 리뷰에 있는 게 전부 간다

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
