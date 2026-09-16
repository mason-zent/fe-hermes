#!/usr/bin/env bash
# 가이드 메뉴(또는 지정 파일)를 현재 터미널 옆 pane 에 띄운다.
# 사용: scripts/guide-pane.sh            → 선택형 메뉴(scripts/guide-menu.sh)
#       scripts/guide-pane.sh <파일>     → 해당 파일을 less 로
#
# 우선순위
#   1. herdr 안(HERDR_ENV=1)이면 `herdr pane split` 으로 현재 pane 을 오른쪽으로 분할
#   2. tmux 안이면 tmux split-window
#   3. 둘 다 아니면 새 Ghostty 창으로 대체
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ $# -ge 1 ]; then
  case "$1" in /*) ABS="$1" ;; *) ABS="$HERMES_DIR/$1" ;; esac
  CMD=(less -R "$ABS"); LABEL="가이드"
else
  CMD=("$HERMES_DIR/scripts/guide-menu.sh"); LABEL="가이드 메뉴"
fi

if [ "${HERDR_ENV:-}" = 1 ] && command -v herdr >/dev/null 2>&1; then
  OUT="$(herdr pane split --current --direction right --ratio 0.6 --cwd "$HERMES_DIR" \
          --env "HERMES_CLAUDE_PANE=${HERDR_PANE_ID:-}" --no-focus)" || {
    echo "⚠️  herdr pane split 실패: $OUT" >&2; exit 1; }
  NEW_PANE="$(printf '%s' "$OUT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')"
  sleep 1
  herdr pane run "$NEW_PANE" "${CMD[@]}" >/dev/null
  herdr pane rename "$NEW_PANE" "$LABEL" >/dev/null 2>&1 || true
  echo "$NEW_PANE"
  exit 0
fi

if [ -n "${TMUX:-}" ]; then
  tmux split-window -h -c "$HERMES_DIR" "${CMD[*]}"
  exit 0
fi

open -na Ghostty --args --working-directory="$HERMES_DIR" --title="Hermes $LABEL" -e "${CMD[@]}"
