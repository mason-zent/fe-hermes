# 실전 시험 — rn-app prd 검증 + commit.sh 커밋해줘 (test/commit-smoke, push 안 함)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 17:08 / 헤르메스
- Status: done
- Agent: bznav-rn-app
- Issue: issues/20260929-bznav-rn-app-allow-skip-step-name.md
- Work ref: /Users/mason/mason-zent/hermes/.worktrees/bznav-rn-app/test-commit-smoke · 🌿 test/commit-smoke · pane wH:p1 (bznav-rn-app)

### Progress
- [x] 담당 레포 브랜치·미커밋 상태 확인 — `test/commit-smoke...origin/prd`, 기존 미커밋 ` M package.json`(남의 변경, 건드리지 않음)
- [x] 요청 1: 시험용 `COMMIT_SMOKE.md` 생성(한 줄) — 커밋 대기
- [x] 요청 2 "커밋해줘": (거부 경로 확인 ✅) commit.sh 거부 — `--allow-skip 'yarn expo lint'` 가 검증 단계 이름 `yarn eslint src` 와 달라 매칭 안 됨. 커밋 안 됨
- [x] 요청 3 "진행"(`--allow-skip 'yarn eslint src'` 허락): commit.sh 로 `68fedd9` 커밋 — `COMMIT_SMOKE.md` 만, push 안 함
- [x] 요청 4 "요청해": 헤르메스 요청 이슈 `issues/20260929-bznav-rn-app-allow-skip-step-name.md` 등록(지시문 수정·미커밋 수정 6파일 커밋·브랜치 정리)

### Next
1. 헤르메스: 결과 확인 후 시험 브랜치 `test/commit-smoke` 정리(push·PR 없음). 디스패치 지시문의 `--allow-skip "yarn expo lint"` 문구를 `yarn eslint src` 로 고칠 것

### Blocked
- 없음 (lint 단계 이름 불일치는 `--allow-skip 'yarn eslint src'` 로 해소)

### Validation
- Node 20.19.4(nvm, 기본은 24.15.0 그대로) · prd a161710 워크트리 test/commit-smoke · yarn install --frozen-lockfile
- 표준 검증: 일반 exit 0(lint ⏭ 설정 오류 · tsc ✅) / 엄격 exit 1 / 엄격 + --allow-skip exit 0
- commit.sh 실전: 에이전트가 --allow-skip 허락을 먼저 받고 커밋 → `68fedd9`, 엄격 검증 통과(건너뜀 허용: yarn eslint src), 계획서 기록 자동, 스테이징 잔여 0, push 안 함
- 발견: `yarn expo lint` 가 package.json 에 "lint" 스크립트를 추가해 추적 파일을 바꿈 → 검증 스크립트를 `yarn eslint src --cache …` 직접 실행으로, 단계 이름 변경(문서 9곳)
- 정리: 시험 워크트리·브랜치(68fedd9) 삭제, 원격에 없음

| 단계 | 결과 | 소요 |
|---|---|---|
| `yarn eslint src` | ❌ 건너뜀(엄격 모드) — 레포 eslint.config.js 설정 오류로 lint 실행 불가(@typescript-eslint 플러그인 미등록) | 2s |
| `yarn tsc --noEmit` | ✅ 통과 | 2s |

- 2026-09-29 17:04 재시도(`--allow-skip 'yarn eslint src'`) → 커밋 `68fedd9`

| 단계 | 결과 | 소요 |
|---|---|---|
| `yarn eslint src` | ⏭ 건너뜀 — 레포 eslint.config.js 설정 오류로 lint 실행 불가(@typescript-eslint 플러그인 미등록) — 코드 문제 아님 | 2s |
| `yarn tsc --noEmit` | ✅ 통과 | 2s |

## 지시
> (지시문 없음 — pane 에서 대화로 지시)

## 결과
- 변경 파일: `COMMIT_SMOKE.md`(신규) — 문서 파일만, 네이티브 변경 없음·웹뷰 영향 없음
- 남은 위험: 처음에 보였던 미커밋 `package.json` 변경은 16:58 기준 사라졌다(내가 되돌린 것 아님 — 예전 `expo lint` 가 `"lint"` 스크립트를 추가했던 흔적으로 추측)

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
- 2026-09-29 17:04 · bznav-rn-app · 🌿 test/commit-smoke · `68fedd9` — test: commit.sh 실전 시험 파일 추가 · 엄격 검증 통과 — 전체 (건너뜀 허용: yarn eslint src) · push 안 함

