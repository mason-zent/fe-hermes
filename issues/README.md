# 이슈

sync·다이어그램 작업·리뷰 중에 찾았지만 **그 자리에서 고치지 않은 것**을 여기 쌓는다. 현황판(`/board`)의 "이슈" 칸에 뜬다.

- 한 이슈 = 파일 하나. 이름은 `YYYYMMDD-<레포>-<짧은-제목>.md`
- 고치기로 하면 계획서를 쓰고 `plan:` 에 경로를 적은 뒤 `status: planned`. 끝나면 `done`(또는 안 하기로 하면 `wontfix`)
- 현황판 [처리 시작]은 `agent`(없으면 repo 의 담당)를 그 레포 workspace 에 새 pane 으로 띄워 맡긴다. 이슈마다 워크트리(`.worktrees/<레포>/issue-<이슈>`, 운영 기준 ref · detached)를 만든다. 에이전트는 브랜치 상태부터 보고하고, 확인 이슈면 결과를 이 파일 끝 "## 확인 결과" 에 적는다
- 끝난 이슈는 현황판 완료 칸의 [아카이브] 로 `issues/archive/` 에 보관한다(연결 경량 계획서는 `plans/archive/task/`). 잘못 만든 이슈는 [삭제] — 휴지통 `.board-trash/` 로 옮겨져 되살릴 수 있다
- 대화에서만 말하고 끝내지 않는다. 다음 세션에서도 보이게 여기 남긴다

```markdown
---
title: 한 줄 제목
status: open            # open | planned | in_progress | done | wontfix
repo: web-op            # 레포 (bznav 는 bznav-web/<앱>, 공통 패키지는 bznav-web/packages)
agent:                  # 담당 에이전트. 비우면 repo 로 hermes.config.json 에서 찾는다
kind: code              # code | diagram | knowledge | check(확인만 필요)
severity: medium        # high | medium | low
source: sync 2026-09-28 # 어디서 찾았나
plan:                   # code: 계획서 경로
pr:                     # code: PR 번호 (담당 레포)
fix:                    # knowledge·diagram: 수정 커밋 sha (여러 개면 쉼표)
reason:                 # wontfix: 하지 않는 이유
---

무엇이 문제인지 한두 문장. (첫 문단이 카드에 보인다)

## 근거
- 파일:줄 (기준 ref)

## 할 일
- …

## 후속
- [x] 확인 결과로 생긴 일 — 처리했으면 [x] 와 근거(커밋 등)
- 따로 할 일은 새 이슈로 → issues/20260928-xxx.md
```

## 완료 기준 — 현황판 `완료 가능` 배지

현황판(`scripts/board/server.mjs` 의 `doneCheck`)이 아래 신호를 **기계적으로** 확인해, 모두 채워지면 카드에 `완료 가능` 을 붙인다. 판단이 들어가는 조건은 쓰지 않는다.

| 종류 | 조건 (전부) |
|---|---|
| 공통 | 이 이슈 파일이 **커밋·push** 됐다 — 작업 트리와 hermes `origin/main` 사이에 차이가 없다 |
| `check` | `## 확인 결과` 절이 있다 · `## 후속` 절의 모든 줄이 `- [x]` 이거나 존재하는 `issues/…md` 를 가리킨다(후속이 없으면 `- [x] 없음`) |
| `knowledge` · `diagram` | `fix:` 의 커밋이 전부 hermes `origin/main` 에 들어 있다 |
| `code` | `plan:` 계획서 Status 가 `done` · `pr:` 이 GitHub 에서 MERGED |
| `wontfix` | `reason:` 이 비어 있지 않다 |

**완료로 옮기기**

1. 위 조건이 **모두 채워져 `완료 가능` 배지가 뜨면 헤르메스가 옮긴다**(`status: done` · 커밋·push). 사용자에게 옮기라고 넘기지 않는다(사용자 결정 2026-09-29)
2. 조건이 덜 찼으면 옮기지 않고 남은 것을 알린다. 사용자가 현황판에서 직접 옮길 수도 있다 — 그때는 남은 ✗ 를 보여 주고 다시 묻는다

에이전트(FE pane)는 이슈를 완료로 옮기지 않는다. 판정과 이동은 헤르메스가 한다.
