# Karpathy 지침 선별 반영 (Claude·Codex 교차)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 17:36 / 헤르메스
- Status: done
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (헤르메스 자체 문서라 워크트리 없이 직접 수정)
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p35 (reviewer)

### Progress
- [x] 상태 확인 — main, 기존 미커밋 7건(issues 6·verify 스크립트 1)은 건드리지 않음
- [x] 외부 레포 분석(Claude) + Codex 독립 분석·비판(읽기 전용) → 사용자 확정: 1·2·4·5·6 반영, 불일치 2건은 이슈만
- [x] 반영 → 확인: git diff → 성공 조건: 7개 파일, 제안 문안과 일치
- [x] 템플릿 변경 영향 → 확인: 옛 문구 grep·board Progress 파싱 → 성공 조건: 옛 문구 의존 없음(board 는 절 통째로 읽음)
- [x] reviewer 검토 → 확인: diff·grep·board/new-plan 파싱·이슈 줄 번호 대조 → 결과: 조건부 승인, 수정 필요 1건(이슈 줄 번호)·권고 3건
- [x] 리뷰 반영 — bugfix 재현 기록을 2단계 계획서 항목으로 옮김(1단계 추가 줄 제거 → 이슈 줄 번호 17-21 그대로 유효), 요약에 외부 입력 검증·보안 처리 추가, AGENTS 5절에 "디스패치는 확정 뒤" 명시
- [x] 이슈 2건도 사용자 지시로 같이 수정(bugfix 계획서 종류 · reviewer 문서 오류 단정 + playbook 동기화)

### Next
1. 없음

### Blocked
- 없음

### Validation
- 문서 변경이라 레포 검증 스크립트 대상 아님 — 실행 안 함. grep·diff 로 확인
- reviewer(2026-09-29): 표준 검증 스크립트 대상 아님 — 실행 안 함. board `section(checkpoint,'Progress')` 가 `- [ ]`/`- [x]` 개수만 세고 new-plan 은 BEGIN/END 사이를 치환만 해 템플릿 변경 영향 없음

## 지시
> andrej-karpathy-skills 레포 분석 → Codex 와 교차 확인 → 제안. 사용자 "그렇게 진행해": Karpathy 관련 5개 반영, 문서 불일치 2건은 issues/ 등록만

## 결과
- `docs/knowledge/common/coding.md` — "단순한 구현" 절, 미사용 코드 범위 명확화
- `.claude/rules/coding-standards.md` — 위 두 가지 요약
- `.claude/agents/reviewer.md` — 변경 필요성·성공 조건 검증 항목, 미사용 import 문구
- `docs/plan-template.md` 7절 · `docs/plan-template-light.md` Progress — 단계 → 확인 → 성공 조건
- `.claude/skills/bugfix/SKILL.md` — 재현 기록·재현 먼저·수정 전후 비교
- `AGENTS.md` 5절(해석 여러 개·더 적은 변경 제안) · 7절(외부 가이드라인 도입 기준)
- 이슈: `issues/20260929-hermes-bugfix-plan-kind-mismatch.md`, `issues/20260929-hermes-reviewer-doc-wrong-assertion.md`
- 플러그인은 설치하지 않음
- reviewer: 수정 필요 — `issues/20260929-hermes-bugfix-plan-kind-mismatch.md` 근거 `SKILL.md:17-21` → 현재 `18-22`(이번 diff 로 한 줄 밀림). 권고 — bugfix 1단계 3번 '계획서에 적는다'는 계획서가 2단계에서 생기므로 2단계로 옮기거나 '2단계 계획서에', coding-standards 요약에 '외부 입력 검증·보안 처리' 누락, AGENTS 5절 '확인 전에도 계속한다'가 헤르메스의 '확정 전 디스패치 금지'와 헷갈릴 여지

## Commits
- 2026-09-30 · hermes · main · ec2212a · Karpathy 지침 선별 반영 + 불일치 2건 · 문서 변경(검증 스크립트 대상 아님) · push 됨
- 2026-09-30 · hermes · main · b9650b0 · 이슈 2건 등록·완료(fix ec2212a) · push 됨
