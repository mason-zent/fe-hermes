# feature bugfix 스킬 삭제 — 규칙은 AGENTS.md 로 이관 (Codex 교차)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 09:34 / 헤르메스
- Status: done
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (헤르메스 자체 구조)
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p37 (reviewer)

### Progress
- [x] 상태 확인 — main, 미커밋 없음
- [x] Claude 판단 + Codex 교차(읽기 전용) → 사용자 확정: 둘 다 삭제, /call 유지, 규칙은 공통 문서로
- [x] 규칙 이관 → AGENTS.md 5절(범위 확대 시 멈춤 · 버그 수정 규칙: 재현 기록·재현 불가 시 원인 미확정·수정 전 실패 확인·전후 비교·프론트 밖이면 알림), 경량 템플릿 안내에서 참조
- [x] delegate.sh 빈틈 → 범위 확대·버그 규칙 문구를 지시 유무와 관계없이 붙임(현황판 [처리 시작] 경로 포함) → 확인: bash -n 통과
- [x] 스킬 삭제(.claude/skills/feature, bugfix) + 참조 정리: CLAUDE.md(1단계·Skills 표), README, call SKILL, extending.md, playbook(스킬 카드 → "그냥 말하기" 카드, 개수 9, 트리), hermes-flow.workflow.json 카드
- [x] 다이어그램 재생성 → 확인: archify validate → 실패. HEAD 버전도 같은 실패 = 최신 archify 검사 강화(이번 변경과 무관) → HTML 은 카드 문구 한 줄만 json 과 동일하게 맞춤, 이슈 등록 issues/20260930-hermes-flow-diagram-archify-validate.md
- [x] reviewer 검토(w2:p37) → 수정 필요 1건 반영: "바로 고쳐" 예외를 AGENTS.md 5절·CLAUDE.md 2단계·흐름 카드(json+html)에 복원. CLAUDE.md 줄표 중복 정리. 참고 사항(branch 스킬 "계획서 없는 긴급 작업")은 issues/20260930-hermes-branch-skill-no-plan-wording.md 로 등록

### Next
1. 없음

### Blocked
- 없음

### Validation
- 레포 검증 스크립트 대상 아님. delegate.sh bash -n 통과. 남은 /feature·/bugfix 참조 grep 0건(계획서·이슈·브랜치 예시의 feature/ 브랜치명 제외). archify showcase 검증 실패(기존과 동일, 이슈 등록)

## 지시
> /feature·/bugfix 는 /call 로 다 되는 것 같다 → Codex 의견까지 들은 뒤 "오키 진행하자"

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-09-30 · hermes · main · 8f2fd2d · /feature·/bugfix 삭제 + 규칙 이관 · reviewer 승인 · push 됨
