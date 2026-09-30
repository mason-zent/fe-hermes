# 현황판 팝업 배경 눌러도 닫히게

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 16:32 / 헤르메스 → hermes
- Status: done
- Agent: hermes
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (scripts/board/index.html)

### Progress
- [x] 팝업 3개(ask·confirm·detail) 공통 — 배경 클릭 시 각 팝업의 취소·닫기 버튼 클릭과 동일하게(confirm 은 취소로 resolve). 안에서 누르고 밖에서 뗀 드래그는 무시
- [x] 확인: 인라인 스크립트 파싱 ok, 서버 재시작 후 새 코드 제공 확인. 브라우저 클릭은 사용자 확인

### Next
1. 없음

### Blocked
- 없음

### Validation
- node 인라인 스크립트 파싱 ok · 헤르메스 자체라 scripts/verify/* 대상 아님

## 지시
> 팝업이 닫기를 눌러야만 닫힌다. 배경 눌러도 닫히게

## 결과
- 변경: scripts/board/index.html (+14)
- 남은 위험: 보내기 팝업(ask)도 배경 클릭으로 닫히며 입력하던 글은 취소와 같게 처리됨

## Commits
- 2026-09-30 · hermes · main · d781f60 · feat: 현황판 팝업 배경 클릭으로 닫기 · 파싱 ok · push 함
