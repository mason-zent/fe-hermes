# 현황판 이슈 처리 시작 기본을 헤르메스로 조사만은 선택지

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 16:08 / 헤르메스 → hermes
- Status: done
- Agent: (헤르메스 직접 — 워크스페이스)
- Issue: issues/20260930-hermes-board-issue-start-detached.md
- Work ref: hermes 메인 체크아웃 · main

### Progress
- [x] 현황판 [처리 시작] 팝업에 받는 곳 선택 — 기본 헤르메스(판단 → 계획서 → prBase 브랜치 → 담당 에이전트), "담당 에이전트로 바로(조사만)" 는 기존 detached 조사 경로 → 확인: index.html 스크립트 파싱 ok · 서버 재기동 후 페이지에 선택지 문구
- [x] 문서 — issues/README · board SKILL · server 주석 · CLAUDE.md 1단계 · 경량 다이어그램 카드(재생성)
- [x] 잘못 등록한 detached 이슈 wontfix — 조사 전용 경로라 의도된 동작

### Next
1. 없음 — 브라우저에서 팝업 동작 확인(사용자)

### Blocked
- 없음

### Validation
- node --check server.mjs · index.html 인라인 스크립트 파싱 · archify validate/deliver ok. 팝업 클릭 동작은 브라우저에서 직접 보지 못함

## 지시
> 현황판 이슈 처리 이슈는 헤르메스로 해야할것같은데 선택할수도 없네 → 기본 헤르메스, 조사만은 선택지로

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
