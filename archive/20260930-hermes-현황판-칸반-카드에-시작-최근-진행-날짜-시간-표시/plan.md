# 현황판 칸반 카드에 시작·최근 진행 날짜 시간 표시

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 15:04 / 현황판에서 이동
- Status: done
- Agent: (헤르메스 직접 — 워크스페이스 코드)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main

### Progress
- [x] server.mjs — 계획서·이슈 카드에 created(파일 birthtime, 없으면 파일명 YYYYMMDD), 이슈의 linkedPlan 에 created·mtime
- [x] index.html — 제목 아래 "🕒 시작 <시각> · 최근 <시각> (N분 전)" 줄, 툴팁에 전체 날짜·시간. 이슈는 연결 계획서와 둘 중 늦은 수정 시각 → 확인: 현황판 재기동 후 /api/state 에 created·mtime 이 실제 파일 시각으로 나옴

### Next
1. 사용자가 브라우저에서 표시 확인

### Blocked
- 없음

### Validation
- node --check server.mjs 통과 · /api/state 확인. 브라우저 화면은 직접 보지 못함

## 지시
> 현환판에 칸반 카드에 진행한 날짜 시간좀 표시해줘

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
