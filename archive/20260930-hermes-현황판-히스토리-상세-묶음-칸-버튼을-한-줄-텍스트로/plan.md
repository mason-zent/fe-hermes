# 현황판 히스토리 상세 묶음 칸 버튼을 한 줄 텍스트로

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 16:30 / 헤르메스
- Status: done
- Agent: hermes
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (scripts/board/index.html)

### Progress
- [x] 사용자 결정: 묶음 칸(파일 버튼·연결 안내) 삭제, 이동 기능 없음, 본문 머리 「📄 이슈」「📋 계획서」 옆에 archive 경로 표시
- [x] scripts/board/index.html — 묶음 칸 HTML·클릭 핸들러·.bundle CSS 삭제, 머리 small 을 archive/<폴더>/issue.md · plan.md 로
- [x] 추가 지시: 제목 아래 회색 줄은 보관 날짜만(폴더·원래 경로 삭제)
- [x] 확인: 페이지 스크립트 문법 파싱 통과, 현황판 서버 응답 200. 브라우저 눈 확인은 사용자

### Next
1. 없음

### Blocked
- 없음

### Validation
- node 로 index.html 인라인 스크립트 파싱 → ok
- 헤르메스 자체 레포라 scripts/verify/* 대상 아님(실행 안 함)

## 지시
> 히스토리 상세 팝업의 묶음 칸은 필요 없다. 이동도 필요 없고, 이슈·계획서 옆에 경로만 적어라
> 제목 아래 줄은 보관 날짜만 있으면 된다

## 결과
- 변경: scripts/board/index.html (+4 −30)
- 남은 위험: 없음(추측입니다 — 목록의 📎 이슈+계획서 알약은 그대로 둠)

## Commits
- 2026-09-30 · hermes · main · ea9a3f0 · fix: 현황판 히스토리 상세 정리 · 검증 스크립트 파싱 ok · push 함
