---
title: rn-app 커밋 지시의 --allow-skip 단계 이름이 옛 이름(yarn expo lint)이라 commit.sh 가 거부
status: open
repo: bznav-rn-app
agent: hermes
kind: knowledge
severity: medium
source: commit.sh 실전 시험 2026-09-29 (plans/task/20260929-bznav-rn-app-실전-시험-rn-app-prd-검증-commit-sh-커밋해줘-test-.md)
plan:
pr:
fix: fe7da08
reason:
---

rn-app 에이전트에 넘긴 디스패치 지시문이 `--allow-skip "yarn expo lint"` 를 쓰라고 했다. 그런데 검증 스크립트의 lint 단계 이름은 `yarn eslint src` 라 이름이 맞지 않아 commit.sh 가 커밋을 거부했다(16:58). `--allow-skip 'yarn eslint src'` 로 다시 돌려 `68fedd9` 로 커밋했다(17:04, push 안 함).

## 근거
- `scripts/verify/bznav-rn-app.sh:32` `run_step "yarn eslint src" …` — `--allow-skip` 은 이 단계 이름과 문자열로 비교된다
- 16:58 거부 메시지: `❌ 커밋하지 않았다: 검증을 통과하지 못했다(전체). … 건너뛴 단계를 허용하려면 사용자 확인 후 --allow-skip`
- 작업 트리에는 이미 고친 내용이 있지만 **커밋되지 않았다**(hermes 에서 `git status`): `.claude/agents/bznav-rn-app.md`, `docs/knowledge/bznav-rn-app/{gotchas,rules,structure}.md`, `issues/20260929-bznav-rn-app-eslint-config.md`, `scripts/verify/bznav-rn-app.sh`
- 에이전트 pane 은 고치기 전 프로필(`yarn expo lint`)을 들고 떴다. 고친 프로필은 새로 띄운 pane 에만 들어간다

## 할 일
- [x] 헤르메스 디스패치 지시문(이번 시험 프롬프트 등)에서 `--allow-skip "yarn expo lint"` 를 `--allow-skip "yarn eslint src"` 로 고친다
- [x] 위 미커밋 수정 6개 파일을 검토해 커밋한다(이 에이전트 범위 밖) — `fe7da08`(9개 파일)
- [x] 떠 있는 bznav-rn-app pane 은 옛 프로필이니 다음 작업은 새 pane 으로 띄운다
- [x] 시험 브랜치 `test/commit-smoke`(로컬 커밋 `68fedd9`, 워크트리 `.worktrees/bznav-rn-app/test-commit-smoke`)를 정리한다 — push 하지 않은 브랜치다
- (선택) commit.sh 가 `--allow-skip` 에 넘긴 이름이 검증 표의 단계와 하나도 안 맞으면 "알 수 없는 단계 이름"이라고 먼저 경고해 주면 같은 실수를 빨리 잡을 수 있다(추측입니다 — 구현 여부는 헤르메스 판단)

## 확인 결과
- 2026-09-29 헤르메스: 지시문의 옛 이름은 실전 시험 프롬프트 한 곳뿐(문서·프로필·스크립트는 이미 `yarn eslint src`). 시험 pane·워크트리·브랜치 정리함. 수정 파일 커밋 `fe7da08` · push
