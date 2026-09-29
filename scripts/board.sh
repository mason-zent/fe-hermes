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
    # 포트를 잡고 있는 node 만 끈다. `pkill -f server.mjs` 는 명령줄에 그 경로가 든 프로세스(지시문에 경로가 적힌 에이전트 세션)까지 죽였다
    PIDS="$(lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null | while read -r pid; do ps -o comm= -p "$pid" | grep -q node && echo "$pid"; done)"
    if [ -n "$PIDS" ]; then kill $PIDS && echo "현황판을 껐다"; else echo "떠 있는 현황판이 없다"; fi
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

# 이미 보고 있는 탭이 있으면 새로 열지 않는다 — 탭마다 실시간 연결을 잡아 브라우저 연결 한도(6)를 채우면 요청이 멈춘다
viewers() { curl -s --max-time 1 "$URL/api/viewers" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("viewers",0))' 2>/dev/null || echo 0; }
VIEWERS="$(viewers)"
# 방금 띄웠으면 열려 있던 탭이 다시 붙을 때까지 잠깐 기다린다(자동 재연결은 몇 초 걸린다)
if [ "${VIEWERS:-0}" = 0 ] && [ -n "${PLACE:-}" ]; then
  for _ in 1 2 3 4 5 6; do sleep 1; VIEWERS="$(viewers)"; [ "${VIEWERS:-0}" -gt 0 ] && break; done
fi
if [ "${VIEWERS:-0}" -gt 0 ]; then
  echo "  (이미 열린 탭 ${VIEWERS}개 — 새 탭은 열지 않는다. 그 탭은 서버가 다시 뜨면 저절로 새로고침된다)"
else
  command -v open >/dev/null 2>&1 && open "$URL"
fi
