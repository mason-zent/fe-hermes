# 현황판 헤더 실시간 글자 빼고 점을 제목 앞으로

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 16:40 / 헤르메스 → hermes
- Status: done
- Agent: hermes
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (scripts/board/index.html)

### Progress
- [x] 연결 점을 h1 「현황판」 앞으로, 말풍선(실시간 연결됨·마지막 변화·마지막 sync)은 제목에 올리면 뜨게
- [x] 정상 연결 시 「실시간」 글자 없음. 연결 중·서버 끊김·다른 탭 안내만 탭 옆에 글자로
- [x] 확인: 인라인 스크립트 파싱 ok, 서버 재시작, headless 캡처로 제목 앞 점 확인(?once 모드라 「연결 중…」 표시 — 실시간 모드에선 비워짐, 사용자 확인)
- [x] 추가 지시: 점이 내려와 보임 → h1 line-height 1 + 점 translateY(-1px). 4배 캡처로 점 중심·글자 중심 맞춤 확인

### Next
1. 없음

### Blocked
- 없음

### Validation
- node 인라인 스크립트 파싱 ok · headless Chrome 캡처 · 헤르메스 자체라 scripts/verify/* 대상 아님

## 지시
> 헤더의 「실시간」 글자 빼고 실시간 점은 현황판 제목 앞에

## 결과
- 변경: scripts/board/index.html
- 남은 위험: 없음

## Commits
- 2026-09-30 · hermes · main · 306c25e · feat: 현황판 헤더 연결 점을 제목 앞으로 · 파싱 ok·캡처 확인 · push 함
