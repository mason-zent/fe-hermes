---
title: delegate.sh 로 띄운 reviewer pane 이 실행 파일 경로 맨 앞 '/' 가 빠져 127 로 실패
status: open
repo: hermes
agent:
kind: code
severity: medium
source: plans/feature/20261001-bznav-web-앱-repo-패키지-zent-전환.md — sena 재리뷰(2026-10-07, bznav-sena-fe)
plan:
pr:
fix:
reason:
---

`scripts/delegate.sh reviewer --cwd <sena 워크트리> --here --plan … "<프롬프트>"` 로 띄운 pane(wG:p17)이 `zsh: no such file or directory: var/folders/wh/…/T/hermes-runner.qBn8zYFRrY` 로 끝났다(exit 127). `mktemp -t hermes-runner` 는 절대 경로(`/var/folders/…`)를 주는데, pane 에서 실행된 경로는 맨 앞 `/` 가 빠져 상대 경로가 됐다. 그래서 리뷰가 돌지 않았다(헤르메스는 공백 비교로 확인한 뒤 PR #2006 을 올렸다).

## 근거
- `scripts/delegate.sh:250` `RUNNER="$(mktemp -t hermes-runner)"`
- `herdr pane read wG:p17` — 위 오류 · `127 err | 10:46:55`
- 같은 날 다른 pane 들은 정상 실행 — 재현 조건 미확인. herdr 로 명령을 보낼 때 첫 글자가 먹히는 것인지(입력 직후 셸 준비 전 타이밍 등) 추측, 확인 필요

## 할 일
- 재현 조건 확인(첫 글자 유실인지, 경로 조립 문제인지)
- pane 에 보내기 전 셸 준비 대기, 또는 실행 명령 앞에 공백·`exec` 등 첫 글자 유실에 견디는 형태로

## 재현 (2026-10-07 11:20, packages-fe R-1 리뷰 wK:pA)
- pane 이 뜰 때 oh-my-zsh 가 `Would you like to update? [Y/n]` 를 물었고, 보낸 명령의 첫 글자 `/` 가 그 답으로 먹혔다 → 나머지 `var/folders/…` 가 상대 경로로 실행돼 127
- 같은 runner 파일을 pane 에 다시 보내니 정상 실행 → 경로 조립 문제가 아니라 **셸 시작 프롬프트의 첫 글자 유실**로 보인다
- 대응 후보: runner 실행 때 `DISABLE_UPDATE_PROMPT=true`(또는 `zstyle ':omz:update' mode disabled`)를 주거나, 보낼 명령 앞에 공백·개행을 하나 둔다
