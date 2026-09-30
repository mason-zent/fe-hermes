# 리뷰 승인을 파일 내용 기준으로 · 경량 흐름 작업→리뷰→커밋→PR · 정식 다이어그램 6건

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 13:35 / 헤르메스 → hermes
- Status: done
- Agent: (헤르메스 직접 — 워크스페이스)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main

### Progress
- [x] 리뷰 승인을 파일 내용(tree) 기준으로 — review-result.sh 가 임시 인덱스로 워크트리 전체 tree 기록, ship.sh 는 HEAD^{tree} 와 비교(옛 줄은 SHA). 리뷰는 선택(A) 유지 → 확인: 리뷰→커밋 ok · 커밋→리뷰 ok · 리뷰 뒤 수정 ⚠️ · 워크트리에만 있던 파일 ⚠️ · 실제 스테이징 무변경
- [x] 경량 다이어그램 새 배치 — 작업 → 리뷰(선택, reviewer pane 레인) → 커밋 → PR, 커밋·PR 거부 분리, ①~⑨ 순서 카드 → archify standard validate·deliver ok
- [x] 정식 다이어그램 — 레포 하나면 pane 에서 PR · 독립 서비스는 동시 · 공통 스펙 · 경량에서 옮겨 오는 길 · 커밋·PR 거부 → validate·deliver ok
- [x] CLAUDE.md 3단계 보호 훅 문구 · 4단계 순서(작업→리뷰(선택)→커밋→PR, 경량·정식 무관) · 6단계 아카이브 html · git.md · reviewer.md · playbook /call 카드

### Next
1. 없음

### Blocked
- 없음

### Validation
- bash -n ship.sh·review-result.sh · 임시 bare 원격 시나리오 4개 · archify validate standard 두 장 ok · deliver ok

## 지시
> 리뷰는 선택(A). 작업 → 리뷰(선택) → 커밋 순서로 · 정식 다이어그램 6건

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
