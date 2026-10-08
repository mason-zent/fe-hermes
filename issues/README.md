# 이슈

sync·다이어그램 작업·리뷰 중에 찾았지만 **그 자리에서 고치지 않은 것**을 여기 쌓는다. 현황판(`/board`)의 "이슈" 칸에 뜬다.

**이슈 파일은 로컬 전용이다**(`.gitignore` — 이 README 만 커밋). 계획서(`plans/**`)처럼 각자 자기 컴퓨터에 갖고, 진행 중·리뷰·완료까지 커밋·push 하지 않는다. git 에 올라가는 것은 [아카이브]로 묶은 `archive/<이름>/` 뿐이다(사용자 결정 2026-10-08).

- 한 이슈 = 파일 하나. 이름은 `YYYYMMDD-<레포>-<짧은-제목>.md`
- 고치기로 하면 계획서를 쓰고 `plan:` 에 경로를 적은 뒤 `status: planned`. 끝나면 `done`(또는 안 하기로 하면 `wontfix`)
- 현황판 [처리 시작]은 **기본으로 헤르메스 pane 에 보낸다** — 헤르메스가 판단(📋 경량/정식) → 계획서 → `prBase` 에서 작업 브랜치 → 담당 에이전트 디스패치까지 이어서 한다
- 팝업에서 **"담당 에이전트로 바로(조사만)"** 를 고르면 `agent`(없으면 repo 의 담당)를 그 레포 workspace 에 새 pane 으로 띄운다. 이슈마다 워크트리(`.worktrees/<레포>/issue-<이슈>`, 운영 기준 ref · detached)를 만들고 **코드는 수정하지 않는다** — 원인·범위를 보고하고, 확인 이슈면 결과를 이 파일 끝 "## 확인 결과" 에 적는다. 고치기로 하면 헤르메스가 브랜치를 만들어 다시 맡긴다
- 끝난 이슈는 현황판 완료 칸의 [아카이브] 로 연결 계획서와 함께 `archive/<이름>/`(`issue.md` · `plan.md` · `meta.json`)에 묶여 보관되고 git 에 커밋된다. 지나간 이슈는 현황판 [아카이브] 탭에서 찾는다. 잘못 만든 이슈는 [삭제] — 휴지통 `.board-trash/` 로 옮겨져 되살릴 수 있다
- **hermes 자체 이슈**(`repo: hermes` — 스크립트·현황판·문서·규칙)는 서비스 칸반이 아니라 현황판 헤더의 **[정비] 탭**(할 일 · 진행 중 · 완료)에 뜬다. 담당 에이전트·워크트리·PR 이 없다 — [처리 시작]을 누르면 헤르메스가 경량 계획서로 직접 고치고, 사용자가 커밋하라고 하면 고친 코드만 hermes `main` 에 커밋·push 한 뒤 이슈 파일(로컬)에 `fix: <sha>` · `status: done` 을 적는다. `kind` 와 무관하게 완료 기준은 `fix:` 커밋이 `origin/main` 에 있는 것. `Agent: hermes` 이거나 `Work ref` 가 `hermes` 로 시작하는(hermes 체크아웃) 계획서도 같은 탭에 뜬다
- 대화에서만 말하고 끝내지 않는다. 다음 세션에서도 보이게 여기 남긴다
- **learn 이슈**(`<날짜>-<영역>-learn-<이름>.md`) — 학습 후보다(`AGENTS.md` 6절 "📚 배운 것", 기준 `docs/knowledge/common/learning.md`). 칸반에는 뜨지 않고 현황판 **[학습] 탭**에만 뜬다 — [넣기]·[고쳐서 넣기]·[버리기](넣으면 공책에 한 줄 + `docs/knowledge/learned/` 기록, 후보 파일은 휴지통으로). `target: skill:<이름>` 이면 스킬 후보 — [헤르메스에게 맡기기]. 본문은 `## 무엇을 배웠나`·`## 왜 중요한가`·`## 공책에 넣을 문장`·`## 어디서 배웠나`. `scripts/learn-curator.mjs` 가 만드는 `…-hermes-learn-curator.md` 는 이름에 `-learn-` 이 있지만 후보가 아니라 정리 후보 목록이다

```markdown
---
title: 한 줄 제목
status: open            # open | planned | in_progress | done | wontfix
repo: web-op            # 레포 (bznav 는 bznav-web/<앱>, 공통 패키지는 bznav-web/packages)
agent:                  # 담당 에이전트. 비우면 repo 로 hermes.config.json 에서 찾는다
kind: code              # code | diagram | knowledge | check(확인만 필요) | seo(/seo-feedback 가 서비스당 하나로 매주 갱신)
severity: medium        # high | medium | low
source: sync 2026-09-28 # 어디서 찾았나
plan:                   # 이 이슈를 고치는 계획서. 다른 작업 중 발견했으면 그 계획서는 여기가 아니라 source: 에 적는다
pr:                     # code: PR 번호 (담당 레포)
fix:                    # knowledge·diagram·repo: hermes: 수정 커밋 sha (여러 개면 쉼표)
target:                 # learn 이슈: 고칠 knowledge 파일#절 (예 docs/knowledge/bznav-web/refund-web/gotchas.md#날짜) 또는 skill:<이름>
signal:                 # learn 이슈: done(작업 끝) | correction(사용자 교정) | repeat-error(같은 오류 3회) | review(배우기 검토자 — scripts/learn-review.mjs)
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
| `check` | `## 확인 결과` 절이 있다 · `## 후속` 절의 모든 줄이 `- [x]` 이거나 존재하는 `issues/…md` 를 가리킨다(후속이 없으면 `- [x] 없음`) |
| `knowledge` · `diagram` · **`repo: hermes`**(kind 무관) | `fix:` 의 커밋이 전부 hermes `origin/main` 에 들어 있다 |
| `code` | `plan:` 계획서 Status 가 `done` · `pr:` 이 GitHub 에서 MERGED |
| `seo` | `## 현재 항목` 의 모든 줄이 `- [x]`(해결) — 해결 판정은 `/seo-feedback` 이 직전 리포트와 비교해 한다 |
| `wontfix` | `reason:` 이 비어 있지 않다 |

**완료로 옮기기**

1. 위 조건이 **모두 채워져 `완료 가능` 배지가 뜨면 헤르메스가 옮긴다**(`status: done` — 이슈 파일은 로컬이라 커밋하지 않는다). 사용자에게 옮기라고 넘기지 않는다(사용자 결정 2026-09-29)
2. 조건이 덜 찼으면 옮기지 않고 남은 것을 알린다. 사용자가 현황판에서 직접 옮길 수도 있다 — 그때는 남은 ✗ 를 보여 주고 다시 묻는다

에이전트(FE pane)는 이슈를 완료로 옮기지 않는다. 판정과 이동은 헤르메스가 한다.
