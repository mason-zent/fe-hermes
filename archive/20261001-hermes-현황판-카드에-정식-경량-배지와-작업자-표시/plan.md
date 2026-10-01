# 현황판 카드에 정식·경량 배지와 작업자 표시

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-10-01 10:30 / 헤르메스
- Status: done
- Owner: Mason
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main aaaacf0

### Progress
- [x] 서버 — 계획서 grade(정식=feature·bugfix·refactor / 경량=task)·owner(Checkpoint Owner: → 첫 커밋 작성자 → git user.name), 이슈 owner(frontmatter owner: → 같은 폴백), linkedPlan 에도 grade·owner
- [x] 카드 — 정식만 제목 앞 📄(경량은 표시 없음) · 작업자 풀네임은 시간 줄 끝에 「· 👤 이름」. 이슈 카드는 연결 계획서 기준
- [x] 템플릿 — 경량·정식 Checkpoint 에 Owner, new-plan.mjs 가 git user.name 으로 채움
- [x] 히스토리 — 항목에 👤 작업자(계획서 Owner → 이슈 owner → 보관 커밋 작성자 → 로컬 사용자), 작업자는 행 오른쪽 별도 열, 검색어에 작업자 포함, 필터는 셀렉트(종류·레포·작업자) → 검색 입력 순, 우측 건수 제거, 날짜 머리글을 누르면 그날 목록 접기·펴기(▼·▶ · n건). 37건 확인
- [x] 4799 포트로 띄워 SSE 데이터 확인(카드 19장 grade·owner 정상) → 4700 현황판 재시작

### Next
1. 없음

### Blocked
- 없음

### Validation
- node --check server.mjs·new-plan.mjs 통과 · SSE 스냅샷에서 grade·owner 확인 · 화면 스크린샷은 headless 가 SSE 때문에 끝나지 않아 못 찍음

## 지시
> (지시문 없음 — pane 에서 대화로 지시)

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-10-01 · hermes · main · aaaacf0 · 현황판 정식 표시·작업자, 히스토리 작업자 열·필터·날짜 접기 · 문법 검사·SSE 데이터 확인 · push 됨
