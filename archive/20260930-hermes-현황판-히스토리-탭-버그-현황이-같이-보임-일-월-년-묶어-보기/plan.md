# 현황판 히스토리 탭 버그(현황이 같이 보임) + 일 월 년 묶어 보기

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 14:52 / 헤르메스
- Status: done
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (scripts/board/index.html)

### Progress
- [x] 원인 — main 에 hidden 을 줬지만 main{display:grid} 가 덮어 현황이 그대로 보임 → main[hidden]{display:none}
- [x] 일·월·년 전환 버튼(선택은 브라우저에 기억), 묶음 머리글에 건수 → 확인: 스크립트 문법 · 현황판 재시작 후 페이지에 반영
- [ ] 사용자 브라우저 확인

### Next
1. 담당 레포 브랜치·미커밋 상태를 확인해 보고한다

### Blocked
- 없음

### Validation
- (검증 스크립트 출력 표 · 실행 못 한 것은 "실행 못 함")

## 지시
> 히스토리 클릭하면 현황이랑 동일하게 보여 · 일·월·년 별로 보여주면 좋겠다

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-09-30 · hermes · main · 86a771b · 히스토리 탭 버그 + 일·월·년 · push 됨
