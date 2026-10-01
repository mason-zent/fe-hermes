# 경량 계획서 템플릿

**모든 작업은 계획서 하나에 묶인다.** 작업의 무게에 따라 둘 중 하나를 쓴다.

| 종류 | 언제 | 파일 | 승인 |
|---|---|---|---|
| 정식 | 새 기능 · 여러 레포 · API·구조 변경 | `plans/{feature,bugfix,refactor}/…` `.md` + `.html`(결정 콘솔) — `docs/plan-template.md` | 결정 콘솔에서 골라 [이대로 진행] |
| **경량** | 문구·스타일 수정 · 버그 하나 · 확인·조사 · 직접 부른 에이전트 작업 · 긴급 수정 | `plans/task/YYYYMMDD-<에이전트>-<요약>.md` 하나 — **이 템플릿** | **사용자의 지시가 곧 승인** |

- 손으로 쓰지 않는다. `node scripts/new-plan.mjs --agent <에이전트> --summary "<요약>"` 이 만든다. `scripts/delegate.sh --plan new "<요약>"` 과 현황판 [처리 시작] 은 이걸 부른다
- 작업이 커지면(여러 레포·API 변경·결정이 필요) 정식 계획서로 옮기고 경량판에는 그 경로를 적는다
- 담당 에이전트는 끝날 때 Checkpoint 의 Status·Progress·Validation 을 채운다. 현황판 칸반이 이 Status 를 따라 움직인다
- 버그 수정이면 `AGENTS.md` 5절의 버그 수정 규칙(재현 먼저 · 수정 전·후 비교)을 따른다
- 경량판에는 html 결정 콘솔이 없다(정식만 있다)

<!-- BEGIN:template -->
# {{title}}

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: {{updated}}
- Status: {{status}}
- Owner: {{owner}}
- Agent: {{agent}}
- Issue: {{issue}}
- Work ref: (디스패치할 때 채운다 — 워크트리 · 브랜치 · pane)

### Progress
- [ ] 담당 레포 브랜치·미커밋 상태 확인
- [ ] (작업) → 확인: (방법) → 성공 조건: (기대 결과)
- [ ] 표준 검증 + 동작 확인 결과 기록 — 실행 못 한 것은 이유

### Next
1. 담당 레포 브랜치·미커밋 상태를 확인해 보고한다

### Blocked
- 없음

### Validation
- (검증 스크립트 출력 표 · 실행 못 한 것은 "실행 못 함")

## 지시
{{prompt}}

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
<!-- END:template -->
