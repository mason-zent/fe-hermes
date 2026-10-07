---
title: bznav-web packages/ui 검증의 build-storybook 산출물(storybook-static/)이 남아 다음 lint·commit.sh 를 실패시킨다
status: open
repo: hermes
agent: hermes
kind: bug
severity: medium
source: bznav-refund-fe 2026-10-06 · plans/task/20261006-bznav-refund-fe-bznav-refund-fe-작업-pane-에서-지시.md
plan:
pr:
fix:
reason:
---

`scripts/verify/bznav-web.sh packages/ui` 가 `build-storybook` 을 돌리면 `packages/ui/storybook-static/` 이 생긴다. 이 폴더는 gitignore 대상이 아니고(`?? packages/ui/storybook-static/`) `@repo/ui` 의 `eslint .` 도 제외하지 않는다.

## 재현 (fix/REF-3904 워크트리)
1. `HERMES_VERIFY_DIR=<wt> scripts/verify/bznav-web.sh packages/ui` → lint ✅ · build-storybook ✅
2. 이어서 `scripts/commit.sh ... -- packages/ui/...` → packages/ui lint ❌ `14135 problems (12509 errors)`. 대부분 storybook-static 번들
3. 폴더를 지우고 다시 하면 통과. commit.sh 검증도 다시 만들어 "새 미추적 파일 214개" 가 남는다

## 후보
- 검증 스크립트가 build-storybook 출력을 임시 디렉터리로 보내거나 끝난 뒤 지운다
- commit.sh 엄격 검증이 build-storybook 뒤에 산출물을 정리한다
