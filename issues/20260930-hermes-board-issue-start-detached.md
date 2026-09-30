---
title: 현황판 이슈 [처리 시작]이 브랜치 없는(detached) 워크트리를 만들어 커밋·PR 까지 못 간다
status: wontfix
repo: hermes
agent:
kind: code
severity: medium
source: 경량·정식 흐름 분리 리뷰 2026-09-30
plan:
pr:
fix:
reason: 전제가 틀렸다 — [처리 시작](담당 에이전트 직행)은 원래 조사 전용(코드 수정·커밋 금지)이라 detached 가 의도된 동작. 실제 문제는 헤르메스로 보낼 수 없었던 것 → [처리 시작] 기본을 헤르메스로, 조사만은 선택지로 바꿈
---

이슈 카드의 [처리 시작]은 `origin/<운영 기준 브랜치>` 에서 `--detach` 워크트리를 만든다. 그런데 `commit.sh`·`ship.sh` 는 detached HEAD 를 거부하므로, 이 경로로 시작한 작업은 "pane 에서 커밋·리뷰·PR 까지"(경량 흐름)를 그대로 따라갈 수 없다. 기준도 `prBase`(개발 브랜치)가 아니라 운영 기준 브랜치다.

## 근거
- `scripts/board/server.mjs:625` — `git worktree add --detach <path> origin/<branch>` (branch = 운영 기준, `workspaceOf`)
- `scripts/commit.sh:66` · `scripts/ship.sh:66` — detached HEAD 거부
- `CLAUDE.md` 4단계 "레포 하나짜리 작업은 pane 에서 끝까지 간다"

## 할 일
- 둘 중 하나를 정한다: ① [처리 시작]이 `new-branch.sh` 로 `prBase` 에서 이슈 브랜치(`fix/issue-<이름>` 등)를 만든다 ② 조사용 detached 는 두고, 고치기로 하면 에이전트가 먼저 브랜치를 묻게 한다
- 정한 뒤 경량 흐름 다이어그램 "언제 경량인가" 카드의 안내 줄을 고친다

## 확인 결과 (2026-09-30 · 헤르메스)
- `scripts/board/index.html` ACTIONS.issue.open 지시문: "원인과 고칠 범위를 정리해 보고한다 — 코드는 수정하지 않는다(계획서 승인 뒤 헤르메스가 브랜치를 만들어 다시 맡긴다). 커밋하지 않는다." — 커밋할 일이 없는 경로였다
- 조치: [처리 시작] 기본 받는 곳을 헤르메스 pane 으로, "담당 에이전트로 바로(조사만)" 는 팝업 선택지로 (이 이슈를 닫는 커밋)
