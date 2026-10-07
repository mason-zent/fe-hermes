---
title: delegate.sh reviewer --here 로 띄운 pane 이 러너 경로의 앞 / 가 빠져 시작하지 못한다
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

`scripts/delegate.sh reviewer --cwd <wt>/fix-REF-3904 --here --plan <계획서>` 로 띄운 pane wG:p13 이 바로 실패했다.

```
zsh: no such file or directory: var/folders/wh/_w_g9zy95lg6cvx0mhzwwz0w0000gp/T/hermes-runner.VhxO2q7heL
```

`$TMPDIR` 기반 러너 경로의 맨 앞 `/` 가 빠졌다(좁은 pane 에서 줄바꿈되며 첫 글자가 잘렸을 가능성도 있다 — 추측). 리뷰 결론이 계획서에 남지 않아 ship.sh 가 ⚠️ 를 띄웠고, 이번 PR(#2002)은 사용자 승인으로 리뷰 없이 올렸다.
