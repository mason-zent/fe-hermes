#!/bin/sh
# Claude Code statusLine 래퍼 — 입력 JSON 의 rate_limits(5시간·주간 사용량)를 현황판이 읽을 파일로 떨군다.
# 입력은 그대로 기존 statusline(Orca 훅)에 넘긴다. 여기서 실패해도 statusline 은 깨지지 않게 조용히 넘어간다.
#
#   ~/.claude/settings.json → "statusLine": { "type": "command", "command": "/bin/sh <hermes>/scripts/board/statusline.sh" }
#   출력 파일: <hermes>/.board-usage.json (gitignore) — scripts/board/server.mjs 가 읽는다
payload=$(cat)
dir=$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)

if [ -n "$dir" ] && command -v jq >/dev/null 2>&1; then
  usage=$(printf '%s' "$payload" | jq -c 'select(.rate_limits != null) | {at: (now | floor), rate_limits: .rate_limits}' 2>/dev/null)
  if [ -n "$usage" ]; then
    # 여러 세션이 동시에 써도 반쯤 쓴 파일을 읽지 않게 임시 파일 → mv
    tmp="$dir/.board-usage.json.$$"
    printf '%s\n' "$usage" > "$tmp" 2>/dev/null && mv -f "$tmp" "$dir/.board-usage.json" 2>/dev/null
    rm -f "$tmp" 2>/dev/null
  fi
fi

# 기존 statusline(Orca 훅)이 있으면 같은 입력으로 이어서 실행
orca="$HOME/.orca/agent-hooks/claude-statusline.sh"
if [ -r "$orca" ] && [ -x "$orca" ]; then
  printf '%s' "$payload" | /bin/sh "$orca"
fi
exit 0
