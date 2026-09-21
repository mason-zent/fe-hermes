#!/bin/sh
# Claude Code 하단 상태바. 지금 어느 레포의 어느 브랜치를 보고 있는지 항상 보이게 한다.
#
# 표시: <레포> <브랜치> [●미커밋수] [↑앞선커밋수]
#   예: client-brics-refund  feature/seo-health-refund  ●3
#
# 대상 레포는 delegate.sh 가 넣어준 HERMES_REPO_DIR 을 먼저 보고, 없으면 현재 cwd 로 찾는다.
# 에이전트→레포 매핑의 정본은 hermes.config.json 이며 여기서 다시 적지 않는다.
#
# orca 의 statusline 훅(사용량 보고)을 덮지 않도록 stdin 을 그대로 흘려보낸 뒤 우리 줄을 찍는다.
payload=$(cat)

orca_hook="$HOME/.orca/agent-hooks/claude-statusline.sh"
if [ -x "$orca_hook" ]; then
  printf '%s' "$payload" | "$orca_hook" >/dev/null 2>&1 || :
fi

# 대상 디렉터리 결정
dir="${HERMES_REPO_DIR:-}"
if [ -z "$dir" ]; then
  # payload 의 cwd 를 꺼낸다 (jq 없이)
  dir=$(printf '%s' "$payload" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
fi
[ -n "$dir" ] && [ -d "$dir" ] || dir="$PWD"

toplevel=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || exit 0
name=$(basename "$toplevel")
branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -n "$branch" ] || exit 0

dirty=$(git -C "$dir" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
ahead=$(git -C "$dir" rev-list --count '@{upstream}..HEAD' 2>/dev/null || echo 0)

line="$name  $branch"
[ "${dirty:-0}" -gt 0 ] && line="$line  ●$dirty"
[ "${ahead:-0}" -gt 0 ] && line="$line  ↑$ahead"

# 워크트리면 표시 (메인 체크아웃과 구분)
common=$(git -C "$dir" rev-parse --git-common-dir 2>/dev/null)
gitdir=$(git -C "$dir" rev-parse --git-dir 2>/dev/null)
[ -n "$common" ] && [ "$common" != "$gitdir" ] && line="$line  (worktree)"

printf '%s' "$line"
