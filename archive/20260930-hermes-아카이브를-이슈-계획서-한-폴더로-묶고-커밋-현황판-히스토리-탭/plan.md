# 아카이브를 이슈+계획서 한 폴더로 묶고 커밋 + 현황판 히스토리 탭

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 13:50 / 헤르메스
- Status: done
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (scripts/board · archive/)
- Review result: 승인 @975de4c · tree 5ec7d411ef0c · 🌿 main · 2026-09-30 14:06 · 커밋 전 변경 12개 포함 · 재리뷰 1~4 반영 확인 — inside() 로 폴더 밖 경로 거부, 끝난 계획서만 묶음, 남긴 열린 이슈의 plan: 갱신, 확인 창 문구·diagram SKILL 참조 수정 (스크래치 재현 통과)
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p3F (reviewer)

### Progress
- [x] 상태 확인 — main 깨끗, 옆 세션 idle(현황판 코드 충돌 없음)
- [x] 사용자 결정 A+가: 이슈·계획서를 한 폴더로 묶고, 아카이브만 git 커밋(진행 중 plans/** 는 로컬 유지)
- [x] scripts/board/archive.mjs(새) — archiveBundle(issue.md·plan.md·plan.html·meta.json, 서로 가리키는 경로 갱신, 같은 이름이면 -2), listHistory·readHistoryItem, --migrate → 현황판 [아카이브]·archive-plans.sh 가 같은 함수 사용
- [x] server.mjs — archiveCard 가 archive.mjs 사용, GET /api/history · /api/history/item(archive/ 밖 경로 404), 안 쓰게 된 moveFile 제거
- [x] index.html — 헤더 [현황]/[히스토리] 탭(#history), 검색·종류·레포 필터, 월별 목록, 한 건 상세(이슈·요청·진행·결과·검증·커밋), 아카이브 확인 창 문구
- [x] 기존 이전 → 2묶음(이슈+계획서 1, 계획서 1), 보관 시각은 git log·Updated 로. plans/archive·issues/archive 폐기
- [x] 문서 — CLAUDE.md 6단계 · board SKILL · issues/README · playbook · 정식 흐름 카드(+ standard 재생성)
- [x] 확인 → node --check 3개 · 임시 서버(4799) /api/history·item·경로 조작 404 · 시험 이슈+계획서 묶기(링크·원본 삭제·히스토리 표시) 후 시험 파일 삭제 · archive-plans.sh --dry-run
- [x] reviewer 검토(w2:p3F) → 수정 필요 4건 반영 후 재승인: 경로 정규화(plans/../ 로 밖 파일 옮김 재현됨), 연결 계획서는 done 일 때만 묶기(+확인 창 ✗ 표시), 계획서만 보관 시 남긴 열린 이슈 plan: 갱신(재현됨), diagram SKILL 중복 이슈 경로. 시험 3종 통과

### Next
1. 없음 — 사용자가 브라우저 히스토리 탭 확인

### Blocked
- 없음

### Validation
- 레포 검증 스크립트 대상 아님. 문법 확인·임시 서버 API·묶기 시험 통과. 브라우저 화면은 직접 보지 못함(사용자 확인 필요)

## 지시
> 계획서랑 묶어서 들고 있을 수 있나? 히스토리 찾아보는 페이지 하나 → A + 가 로 진행

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
