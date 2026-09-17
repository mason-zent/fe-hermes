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

# `herdr pane run` 은 인자를 따옴표 없이 셸 명령줄로 이어붙인다.
# 프롬프트를 그대로 넘기면 공백에서 단어가 쪼개지고 ( ) ! * 등이 셸에 먹혀
# 에이전트가 엉뚱한 프롬프트를 받는다(실제로 겪음). 그래서 러너 스크립트 한 개만 넘긴다.
PROMPT_FILE="$(mktemp -t hermes-prompt)"
RUNNER="$(mktemp -t hermes-runner)"
printf '%s' "$PROMPT" > "$PROMPT_FILE"
cat > "$RUNNER" <<RUNNER_EOF
#!/usr/bin/env bash
cd "$HERMES_DIR" || exit 1
trap 'rm -f "$PROMPT_FILE" "$RUNNER"' EXIT
exec claude --agent "$AGENT" "\$(cat "$PROMPT_FILE")"
RUNNER_EOF
chmod +x "$RUNNER"
herdr pane run "$PANE" "$RUNNER" >/dev/null
herdr pane rename "$PANE" "🤖 $AGENT" >/dev/null 2>&1 || true
echo "$PANE"
