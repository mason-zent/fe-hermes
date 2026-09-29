---
title: rn-app prd 의 eslint 설정이 깨져 lint 가 아예 돌지 않음
status: open
repo: bznav-rn-app
agent:
kind: code
severity: medium
source: bznav-rn-app 온보딩 2026-09-29 (verify 스크립트 첫 실행)
plan:
pr:
fix:
reason:
---

prd 에서 `yarn expo lint`(= `eslint src`)가 규칙 검사 전에 설정 오류로 죽는다 — `could not find plugin "@typescript-eslint"`. 그래서 검증 스크립트의 lint 단계가 늘 "실행 불가"로 나오고, `scripts/commit.sh` 엄격 검증도 `--allow-skip "yarn expo lint"` 없이는 통과하지 못한다.

## 근거
- `eslint.config.js` (origin/prd `a161710`) — files 제한이 없는 전역 설정 블록에서 `@typescript-eslint/no-use-before-define` 을 켠다
- `eslint-config-expo/flat` 은 `@typescript-eslint` 플러그인을 `**/*.ts, **/*.tsx` 로 한정한 설정 블록에만 등록한다 → 전역 블록에서는 플러그인을 못 찾는다
- 재현: prd 체크아웃, Node 20.20.2, `yarn install --frozen-lockfile` 후 `npx eslint src` → exit 2 (ESLint 9.32.0)
- `yarn tsc --noEmit` 은 통과

## 할 일
- 규칙 블록에 `files: ["**/*.ts", "**/*.tsx"]` 를 주거나, 그 블록에 `plugins: { "@typescript-eslint": … }` 를 등록하는 쪽으로 레포에서 고친다 (추측입니다 — 어느 쪽이 레포 의도인지 확인 필요)
- 고친 뒤 기존 코드에 lint 오류가 얼마나 나오는지 먼저 본다 (지금까지 한 번도 돌지 않았을 수 있다)
- 고쳐지면 `scripts/verify/bznav-rn-app.sh` 의 "설정 오류 → 건너뜀" 분기를 걷어 낸다
