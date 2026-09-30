---
title: 현황판 이슈 [처리 시작]이 브랜치 없는(detached) 워크트리를 만들어 커밋·PR 까지 못 간다
status: open
repo: hermes
agent:
kind: code
severity: medium
source: 경량·정식 흐름 분리 리뷰 2026-09-30
plan:
pr:
fix:
reason:
---

이슈 카드의 [처리 시작]은 `origin/<운영 기준 브랜치>` 에서 `--detach` 워크트리를 만든다. 그런데 `commit.sh`·`ship.sh` 는 detached HEAD 를 거부하므로, 이 경로로 시작한 작업은 "pane 에서 커밋·리뷰·PR 까지"(경량 흐름)를 그대로 따라갈 수 없다. 기준도 `prBase`(개발 브랜치)가 아니라 운영 기준 브랜치다.

## 근거
- `scripts/board/server.mjs:625` — `git worktree add --detach <path> origin/<branch>` (branch = 운영 기준, `workspaceOf`)
- `scripts/commit.sh:66` · `scripts/ship.sh:66` — detached HEAD 거부
- `CLAUDE.md` 4단계 "레포 하나짜리 작업은 pane 에서 끝까지 간다"

## 할 일
- 둘 중 하나를 정한다: ① [처리 시작]이 `new-branch.sh` 로 `prBase` 에서 이슈 브랜치(`fix/issue-<이름>` 등)를 만든다 ② 조사용 detached 는 두고, 고치기로 하면 에이전트가 먼저 브랜치를 묻게 한다
- 정한 뒤 경량 흐름 다이어그램 "언제 경량인가" 카드의 안내 줄을 고친다
