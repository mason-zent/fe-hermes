#!/usr/bin/env bash
# 위임 작업을 **보이는 herdr pane** 에서 실행한다. 헤르메스가 Agent 도구 대신 쓸 수 있다.
# 사용: scripts/delegate.sh <에이전트명> "<프롬프트>" [--down]
#   에이전트명은 .claude/agents/<이름>.md (예: hub-fe, reviewer, Explore 는 불가 — 내장 에이전트는 이름 그대로 시도)
#   pane 을 현재 pane 오른쪽(기본) 또는 아래(--down)에 열고 `claude --agent <이름> "<프롬프트>"` 를 띄운다.
#   결과는 pane 안에서 보고, 헤르메스는 `herdr pane read <id>` 로 읽는다. 종료 시 pane 은 셸로 돌아온다.
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENT="${1:-}"; PROMPT="${2:-}"; DIR="right"; [ "${3:-}" = "--down" ] && DIR="down"
[ -n "$AGENT" ] && [ -n "$PROMPT" ] || { echo "사용: $0 <에이전트명> \"<프롬프트>\" [--down]"; exit 2; }
if [ "${HERDR_ENV:-}" != 1 ] || ! command -v herdr >/dev/null 2>&1; then
  echo "herdr 밖입니다. 직접 실행하세요:  claude --agent $AGENT \"$PROMPT\""; exit 1
fi
OUT="$(herdr pane split --current --direction "$DIR" --ratio 0.5 --cwd "$HERMES_DIR" --no-focus)" || { echo "pane split 실패: $OUT"; exit 1; }
PANE="$(printf '%s' "$OUT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')"
sleep 1
herdr pane run "$PANE" claude --agent "$AGENT" "$PROMPT" >/dev/null
herdr pane rename "$PANE" "🤖 $AGENT" >/dev/null 2>&1 || true
echo "$PANE"
