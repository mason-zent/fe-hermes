# 모든 작업에 계획서 강제 — 경량 계획서와 delegate --plan

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-28 17:10 / 헤르메스
- Status: done
- Agent: 헤르메스 (hermes 자체 변경 — FE 레포 아님)
- Issue: 없음
- Work ref: hermes main — 67f9a2e(현황판) · 121debc(계획서 강제), origin/main push 완료

### Progress
- [x] 경량 계획서 — `docs/plan-template-light.md`(정식/경량 구분표 + 템플릿), `scripts/new-plan.mjs`(plans/task/ 생성)
- [x] `scripts/delegate.sh` — `--plan <경로>` / `--plan new "<요약>"` 필수, 계획서 경로를 에이전트 지시 맨 앞에, 띄운 뒤 Work ref 에 워크트리·브랜치·pane 기록
- [x] 현황판 — 이슈 [처리 시작]이 경량 계획서를 만들어 이슈 `plan:` 에 연결 후 `--plan` 으로 디스패치, pane↔계획서 연결을 Work ref 의 pane id 로, task 유형은 "경량" 표시
- [x] 규칙 — CLAUDE.md 1단계·3단계, dispatch-protocol 전제, AGENTS.md 5절, /bugfix·/feature 스킬, plan-template.md, playbook 2곳에서 "계획서 없이" 예외 제거 → 경량 계획서
- [x] 작업 흐름 다이어그램 1단계 카드 동기화(CLAUDE.md 규칙), archify 9/9
- [x] 사용자 테스트 — plus-web 테스트 이슈로 [처리 시작] → 워크트리·경량 계획서·pane·결과 기록·리뷰 칸 이동까지 확인
- [x] 커밋·push — 67f9a2e · 121debc

### Next
1. 없음 — 완료. 현황판 완료 칸에서 [아카이브]

### Blocked
- 없음

### Validation
- `delegate.sh` 계획서 없이 → 거부 / 없는 계획서 → 거부 (실행 확인)
- `new-plan.mjs` → plans/task/…md 생성, 현황판 진행 중 칸에 "경량" 카드 (실행 확인)
- 현황판 [처리 시작] 전체 흐름 — plus-web 테스트 이슈로 실행: fetch 2.4s · 워크트리 3.1s · 경량 계획서 3.2s · pane 5.6s, 에이전트가 결과 기록 후 ready_for_review
- hermes-flow workflow validate 9/9 · deliver 0

## 지시
> 모든 작업에 계획서를 강제한다 (사용자 결정 2026-09-28, 방법 B + 강제).
> 1) 경량 계획서 템플릿·생성 스크립트 (docs/plan-template-light.md, scripts/new-plan.mjs)
> 2) delegate.sh: --plan <경로> | --plan new "<요약>" 필수. 없으면 띄우지 않는다. 계획서 경로를 에이전트 지시에 넣고 Work ref 에 워크트리·pane 기록
> 3) 현황판: 이슈 [처리 시작] 이 경량 계획서를 만들어 이슈 plan: 에 연결. pane↔계획서 연결을 Work ref 의 pane id 로도. task 유형 표시
> 4) 규칙: CLAUDE.md·dispatch-protocol 의 "긴급은 계획서 없이" 예외 제거 → 경량 계획서. AGENTS.md "작업은 계획서 하나에 묶인다". 작업 흐름 다이어그램 카드 동기화

## 결과
- 변경: docs/plan-template-light.md(신규) · scripts/new-plan.mjs(신규) · scripts/delegate.sh · scripts/board/{server.mjs,index.html} · CLAUDE.md · AGENTS.md · .claude/rules/dispatch-protocol.md · .claude/skills/{bugfix,feature}/SKILL.md · docs/plan-template.md · docs/playbook.html · docs/diagrams/hermes-flow.{workflow.json,html}
- 남은 위험: delegate.sh 를 --plan 없이 부르던 다른 스크립트·문서 예시가 남아 있으면 실패한다 — 검색으로 찾은 곳은 고쳤다
