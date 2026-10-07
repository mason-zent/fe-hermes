---
title: 문서가 안내하는 wt-sync 명령이 없다 (워크트리를 메인 체크아웃에서 보는 방법)
status: open
repo: hermes
agent:
kind: knowledge
severity: low
source: packages-fe 작업 중 2026-10-01 (plans/refactor/20260930-bznav-packages-sync-with-history.md)
plan:
pr:
fix:
reason:
---

`new-branch.sh` 출력과 `docs/knowledge/common/git.md` 는 "메인 체크아웃·소스트리에서 보려면 `wt-sync`" 라고 안내하는데, `wt-sync` 는 scripts/ 에도, PATH 에도, ~/.zshrc 에도 없다. 사용자가 워크트리 브랜치를 실제로 확인하는 방법을 물었을 때 안내할 명령이 없었다.

## 근거
- `scripts/new-branch.sh:214` — "(wt-sync 로 메인 체크아웃에 반영한 뒤)"
- `docs/knowledge/common/git.md:99` — "메인 체크아웃·소스트리에서 보려면 `wt-sync`(같은 `.git` 이라 fetch 불필요)"
- `which wt-sync` → not found, `scripts/` 와 `~/.zshrc`·`~/.zprofile`·`~/.bashrc` 에서 검색해도 없음 (2026-10-01)

## 할 일
- `wt-sync` 를 만들지(스크립트 또는 `/guide` 메뉴), 문서에서 지우고 대안(워크트리 경로를 에디터로 열기, `git -C <메인> log/diff <브랜치>`)으로 바꿀지 정한다
- 같은 브랜치는 워크트리 두 곳에 동시에 체크아웃할 수 없다는 점도 함께 적는다

## 후속
- (없음)
