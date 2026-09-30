# 점검 남은 항목 — 레포 이슈 5건 등록 + 헤르메스 스크립트 6건 수정

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 17:22 / 헤르메스
- Status: done
- Agent: hermes
- Issue: 없음
- Work ref: hermes `main` (미커밋)

### Progress
- [x] 레포 이슈 5건 등록 — console-github-instructions-swapped · bznav-web-ai-docs-stale · bznav-care-web-npmrc-token(high) · hub-readme-modal-guard · web-op-network-error-handling
- [x] (6) zent-packages.sh: changeset 을 브랜치 diff(origin/main...HEAD)+미커밋으로, test 스크립트 있는 패키지만 test
- [x] (7) new-branch.sh: rn-app 티켓만 주면 feature/v<app.config.js version>/<티켓> (dry-run: feature/v5.1.2/SENA-999 ✅, 슬래시 이름·다른 레포 그대로 ✅)
- [x] (8) delegate.sh: packages-fe 세션에 ZENT_CONSUMERS(소비 레포 6곳 realpath)
- [x] (9) web-op.sh: run-salesjwt-test.cjs 실행 단계
- [x] (10) bznav-web.sh: packages/<dir> → package.json name(ui-deprecated=@zenterprise-inc/ui ✅), lint 없으면 ⏭(project-config ✅)
- [x] (11) 템플릿 자체는 문제 아님(plan-md 는 계획서마다 채움) — 진짜 구멍: commit.sh 가 md 만 갱신 → 같은 이름 .html plan-md 도 동기화(임시 시험 ✅, 닫는 태그 이스케이프 ✅)
- [x] Codex 이중 체크(w2:p34) — 중간 2: changeset 삭제·README 도 인정 / </SCRIPT 변형 미이스케이프 → 수정, 5경우·변형 시험 ✅
- [x] 커밋 6e55397(스크립트) · b54a970(이슈) push

### Next
1. 없음 — 레포 이슈 5건은 현황판에서 담당 에이전트로

### Blocked
- 없음

### Validation
- 위 Progress 의 시험 · web-op.sh 는 메인 체크아웃(dev 61커밋 뒤, node_modules 낡음)에서 lint·typecheck·salesjwt 모두 ❌ — 환경 문제(sucrase MODULE_NOT_FOUND·옛 코드 타입 오류). 새 단계가 러너를 실행하는 것까지 확인, **운영 코드 통과는 실행 못 함**

## 지시
> 1~5는 이슈 등록하고 6~11은 바로 고쳐줘 · 작업다되면 codex랑 이중 체크해보고 커밋, 푸시해놩

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-09-29 · hermes · main · `6e55397` — 헤르메스 스크립트 6건 · pushed
- 2026-09-29 · hermes · main · `b54a970` — 레포 이슈 5건 등록 · pushed
