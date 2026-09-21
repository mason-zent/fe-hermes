#!/bin/sh
# Claude Code 하단 상태바. 지금 어느 레포의 어느 브랜치를 보고 있는지 항상 보이게 한다.
#
#   📁 client-brics-refund  🌿 feature/REF-1234  ✎2 +1 -1  ⇡3  ⧉worktree
#
# **기호·색의 뜻은 docs/playbook.html 의 "작업 흐름 → pane 하단 상태바" 가 정본이다.**
# 여기에 같은 표를 다시 적지 않는다. 표시를 바꾸면 그쪽도 같이 고친다.
#
# 대상 레포는 delegate.sh 가 넣어준 HERMES_REPO_DIR 을 먼저 보고, 없으면 payload 의 cwd 로 찾는다.
# 에이전트→레포 매핑의 정본은 hermes.config.json 이며 여기서 다시 적지 않는다.
#
# orca 의 statusline 훅(사용량 보고)을 덮지 않도록 stdin 을 그대로 흘려보낸 뒤 우리 줄을 찍는다.

payload=$(cat)

orca_hook="$HOME/.orca/agent-hooks/claude-statusline.sh"
if [ -x "$orca_hook" ]; then
  printf '%s' "$payload" | "$orca_hook" >/dev/null 2>&1 || :
fi

dir="${HERMES_REPO_DIR:-}"
if [ -z "$dir" ]; then
  dir=$(printf '%s' "$payload" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
fi
[ -n "$dir" ] && [ -d "$dir" ] || dir="$PWD"

toplevel=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || exit 0
branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -n "$branch" ] || exit 0

# 워크트리 안이면 toplevel 이 워크트리 폴더명이라 어느 레포인지 알 수 없다.
# git-common-dir 은 항상 메인 체크아웃의 .git 을 가리키므로 그 부모가 진짜 레포 이름이다.
common=$(git -C "$dir" rev-parse --git-common-dir 2>/dev/null)
gitdir=$(git -C "$dir" rev-parse --git-dir 2>/dev/null)
case "$common" in /*) abs_common="$common" ;; *) abs_common="$dir/$common" ;; esac
if [ -n "$common" ] && [ "$common" != "$gitdir" ]; then
  is_worktree=1
  name=$(basename "$(dirname "$abs_common")")
else
  is_worktree=0
  name=$(basename "$toplevel")
fi

# ANSI 색 (Claude Code 상태바는 ANSI 를 그대로 렌더한다)
R='\033[0m'; DIM='\033[2m'; BOLD='\033[1m'
CYAN='\033[36m'; GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; MAGENTA='\033[35m'

# 변경 내역을 종류별로 센다 (porcelain 은 "XY 경로", X=인덱스 Y=워크트리)
counts=$(git -C "$dir" status --porcelain 2>/dev/null | awk '
  /^\?\?/            { add++;  next }
  /^(U.|.U|AA|DD)/   { conf++; next }
  /^(A.|.A)/         { add++;  next }
  /^(D.|.D)/         { del++;  next }
  /^(R.|.R)/         { ren++;  next }
                     { mod++ }
  END { printf "%d %d %d %d %d", mod+0, add+0, del+0, conf+0, ren+0 }')
set -- $counts
mod=$1; add=$2; del=$3; conf=$4; ren=$5

ahead=$(git -C "$dir" rev-list --count '@{upstream}..HEAD' 2>/dev/null || echo 0)

# 보호 브랜치에서 작업 중이면 경고한다. FE 레포에서 여기에 코드를 쓰면 안 된다.
# 단 hermes 워크스페이스 자체는 main 이 정상 작업 브랜치라 제외한다
# (hermes.config.json 이 있으면 워크스페이스로 본다 — 이름 하드코딩을 피한다).
if [ -f "$toplevel/hermes.config.json" ]; then
  protected=0
else
  case "$branch" in
    prd|main|master|dev|dev-ecs|prd-*|release/*) protected=1 ;;
    *) protected=0 ;;
  esac
fi

out="${DIM}📁${R} ${CYAN}${name}${R}  "
if [ "$protected" = 1 ]; then
  out="${out}${RED}${BOLD}⚠️  ${branch}${R}"
else
  out="${out}${DIM}🌿${R} ${GREEN}${branch}${R}"
fi

[ "$mod"  -gt 0 ] && out="${out}  ${YELLOW}✎${mod}${R}"
[ "$add"  -gt 0 ] && out="${out}  ${GREEN}+${add}${R}"
[ "$del"  -gt 0 ] && out="${out}  ${RED}-${del}${R}"
[ "$ren"  -gt 0 ] && out="${out}  ${MAGENTA}⇄${ren}${R}"
[ "$conf" -gt 0 ] && out="${out}  ${RED}${BOLD}✗${conf}${R}"
[ "${ahead:-0}" -gt 0 ] && out="${out}  ${CYAN}⇡${ahead}${R}"

[ "$is_worktree" = 1 ] && out="${out}  ${MAGENTA}⧉worktree${R}"

printf '%b' "$out"
