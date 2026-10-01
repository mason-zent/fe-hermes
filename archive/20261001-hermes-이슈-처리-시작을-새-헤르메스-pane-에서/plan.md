# 이슈 처리 시작을 새 헤르메스 pane 에서

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-10-01 11:57 / 현황판에서 이동
- Status: done
- Owner: Mason
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (미커밋)

### Progress
- [x] 원인 — 이슈 [처리 시작] 기본(헤르메스로)이 처음 찾은 헤르메스 pane 에 send-text. 작업 중인지 안 봄 → 헤르메스 자체 이슈(담당 없음)는 그 대화 안에서 통째로 처리돼 섞임
- [x] 결정(사용자) A — 항상 새 헤르메스 pane
- [x] server.mjs POST /api/hermes-new — 헤르메스 pane 옆(없으면 현황판 pane 옆)에 split, 이름 「🧭 헤르메스 · <이슈 제목>」, 지시문은 임시 파일→러너로 claude 실행
- [x] index.html — 이슈 팝업 "헤르메스로" 가 hermes-new 로, 안내 문구 변경. 헤르메스 pane 이 없어도 조사만으로 빠지지 않음

### Next
1. 사용자 확인 → 커밋

### Blocked
- 없음

### Validation
- node --check server.mjs · 페이지 스크립트 문법 통과
- split→rename→러너(claude 대신 echo) 수동 재현: 따옴표 섞인 지시문 그대로 · cwd hermes · 임시 파일 삭제 확인, 테스트 pane 닫음
- 실제 [처리 시작] 으로 claude 세션 띄우기는 안 해 봄

## 지시
> 이슈 [처리 시작] 을 헤르메스로 보내면 작업 중인 헤르메스 pane 에 지시가 섞인다 → 새 헤르메스 pane 을 열어 처리 (A안)

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
