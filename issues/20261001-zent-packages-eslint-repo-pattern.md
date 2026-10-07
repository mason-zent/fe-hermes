---
title: bznav-fe-project-config eslint 의 no-internal-modules 허용 패턴에 @repo 가 남아 있다
status: done
repo: zent-packages
agent: packages-fe
kind: code
severity: low
source: packages-fe 작업 중 2026-10-01 (PR #104 import 점검)
plan: plans/task/20261001-packages-fe-bznav-fe-project-config-eslint-no-intern.md
pr: 105
fix: 7ec2fd6
reason:
---

`frontend/bznav/project-config/lint/eslint.config.js` 의 `import/no-internal-modules` 허용 목록에 bznav-web 시절 패턴 `'!(@repo)/**/*'` 가 그대로 있다. zent 로 옮기면서 패키지 이름은 `@zenterprise-inc/bznav-fe-*` 가 됐기 때문에, 원래 의도(내부 패키지는 서브패스 import 금지)가 지금은 아무것도 막지 못하는 것으로 보인다(추측입니다). 같은 목록의 `'@zenterprise-inc/ui/*'` 도 존재하지 않는 패키지 이름이다.

## 근거
- `frontend/bznav/project-config/lint/eslint.config.js:79` (main `bfa6be4` 에도 같은 줄이 있다 — 이번 동기화 PR #104 에서 생긴 것이 아니다)
- 같은 파일 77행: `'@zenterprise-inc/ui/*'`

## 할 일
- 패턴을 `'!(@zenterprise-inc)/**/*'` 등으로 바꿀지 정한다. 이 설정은 web-op 이 `bznav-fe-project-config` 로 그대로 소비하므로, 바꾸면 web-op lint 결과가 달라질 수 있다 → web-op 에서 `@zenterprise-inc/*` 서브패스 import 를 쓰는 곳을 먼저 확인한다
- 바꾸면 changeset(project-config minor)

## 확인 결과 (헤르메스 2026-10-07)
- packages-fe 가 `7ec2fd6` 으로 수정 — 앞의 `!` 때문에 패턴 전체가 부정돼 모든 import 를 허용하던 `import/no-internal-modules` 를 끄고 `no-restricted-imports` 로 비공개 서브패스를 막도록 교체. PR #105 로 zent `dev` 에 머지(2026-10-01), `origin/dev` 의 eslint.config.js 에 반영 확인

## 후속
- [x] 없음 (새 exports 서브패스를 추가하면 허용 목록도 갱신해야 한다는 주의는 계획서 남은 위험에 기록)
