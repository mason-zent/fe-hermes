#!/usr/bin/env bash
# 헤르메스 현황판(scripts/board/server.mjs)을 띄우고 브라우저로 연다.
# 사용: scripts/board.sh          → 서버가 없으면 herdr pane "📋 현황판" 에 띄우고 브라우저를 연다
#       scripts/board.sh stop     → 서버를 끈다
#       scripts/board.sh url      → 주소만 출력
#
# 포트는 HERMES_BOARD_PORT (기본 4700). 이미 떠 있으면 새로 띄우지 않고 브라우저만 연다.
# herdr 밖이면 백그라운드(nohup)로 띄우고 로그는 /tmp/hermes-board.log.
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${HERMES_BOARD_PORT:-4700}"
URL="http://localhost:$PORT"
LABEL="📋 현황판"

is_up() { curl -s -o /dev/null --max-time 1 "$URL/api/state"; }

case "${1:-}" in
  url) echo "$URL"; exit 0 ;;
  stop)
    pkill -f "scripts/board/server.mjs" && echo "현황판을 껐다" || echo "떠 있는 현황판이 없다"
    exit 0 ;;
esac

if is_up; then
  echo "$URL (이미 떠 있음)"
else
  CMD="HERMES_BOARD_PORT=$PORT node $(printf '%q' "$HERMES_DIR/scripts/board/server.mjs")"
  if [ "${HERDR_ENV:-}" = 1 ] && command -v herdr >/dev/null 2>&1; then
    # 같은 이름의 pane 이 있으면 거기서 다시 띄운다
    PANE="$(herdr pane list 2>/dev/null | python3 -c '
import sys, json
try:
    panes = json.load(sys.stdin)["result"]["panes"]
except Exception:
    sys.exit(0)
found = [p for p in panes if p.get("label") == sys.argv[1] or p.get("name") == sys.argv[1]]
print(found[0]["pane_id"] if found else "")
' "$LABEL")"
    if [ -z "$PANE" ]; then
      OUT="$(herdr pane split --current --direction down --ratio 0.25 --cwd "$HERMES_DIR" --no-focus)" || {
        echo "⚠️  herdr pane split 실패: $OUT" >&2; exit 1; }
      PANE="$(printf '%s' "$OUT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')"
      sleep 1
    fi
    # herdr pane run 은 인자를 따옴표 없이 이어 붙인다(bash -c "..." 가 깨진다) — env 로 바로 실행한다
    herdr pane run "$PANE" env "HERMES_BOARD_PORT=$PORT" node "$HERMES_DIR/scripts/board/server.mjs" >/dev/null
    herdr pane rename "$PANE" "$LABEL" >/dev/null 2>&1 || true
    PLACE="pane $PANE"
  else
    nohup bash -c "$CMD" >/tmp/hermes-board.log 2>&1 &
    PLACE="백그라운드 (로그 /tmp/hermes-board.log)"
  fi
  for _ in $(seq 1 20); do is_up && break; sleep 0.3; done
  is_up || { echo "⚠️  서버가 뜨지 않았다 — $PLACE 확인" >&2; exit 1; }
  echo "$URL ($PLACE)"
fi

command -v open >/dev/null 2>&1 && open "$URL"
