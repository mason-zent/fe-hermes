#!/usr/bin/env bash
# 백그라운드 서브에이전트 로그 모니터(scripts/agent-monitor.py)를 herdr pane 에 띄운다.
# 사용: scripts/monitor-pane.sh [분]   → 최근 N분(기본 120) 안에 수정된 subagents 로그를 tail
#
# 같은 워크스페이스에 "🛰 에이전트 모니터" pane 이 이미 있으면 새로 만들지 않고 그 pane 에서 다시 실행한다.
# 새로 연 pane 에 모니터할 로그가 없으면 AUTOCLOSE_SEC 초 뒤 그 pane 을 자동으로 닫는다 (0 이면 안 닫음).
# 표준출력은 pane id 한 줄 (재사용이면 " (재사용)" 이 붙는다).
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="🛰 에이전트 모니터"
AUTOCLOSE_SEC="${MONITOR_AUTOCLOSE_SEC:-10}"   # 로그가 없을 때 새 pane 을 닫기까지 기다리는 초

MINUTES="${1:-}"
[[ "$MINUTES" =~ ^[0-9]+$ ]] || MINUTES=""     # 숫자가 아니면 기본값(120분)을 쓴다
CMD=("$HERMES_DIR/scripts/agent-monitor.py" --recent)
[ -n "$MINUTES" ] && CMD+=("$MINUTES")

if [ "${HERDR_ENV:-}" != 1 ] || ! command -v herdr >/dev/null 2>&1; then
  echo "herdr 밖입니다. 직접 실행하세요:  ${CMD[*]}" >&2
  exit 1
fi

# 이미 떠 있는 모니터 pane 찾기 (같은 워크스페이스 우선)
PANE="$(herdr pane list 2>/dev/null | python3 -c '
import sys, json
cur, label = sys.argv[1], sys.argv[2]
workspace = cur.split(":")[0] if ":" in cur else ""
try:
    panes = json.load(sys.stdin)["result"]["panes"]
except Exception:
    sys.exit(0)
found = [p for p in panes if p.get("label") == label]
if workspace:
    found = [p for p in found if p.get("workspace_id") == workspace] or found
print(found[0]["pane_id"] if found else "")
' "${HERDR_PANE_ID:-}" "$LABEL")"

if [ -n "$PANE" ]; then
  herdr pane send-keys "$PANE" C-c >/dev/null 2>&1 || true   # 돌고 있던 모니터를 먼저 끊는다
  sleep 1
  herdr pane run "$PANE" "${CMD[@]}" >/dev/null
  echo "$PANE (재사용)"
  exit 0
fi

OUT="$(herdr pane split --current --direction right --ratio 0.5 --cwd "$HERMES_DIR" --no-focus)" || {
  echo "⚠️  herdr pane split 실패: $OUT" >&2; exit 1; }
PANE="$(printf '%s' "$OUT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')"
sleep 1
# 새로 연 pane 은 모니터할 로그가 없으면(종료 코드 3) 20초 뒤 스스로 닫는다.
# 재사용한 pane 은 사용자가 띄워둔 것일 수 있으니 닫지 않는다.
# pane 안에서 돌 명령: 모니터가 끝났을 때 종료 코드 3(모니터할 로그 없음)이면 스스로 닫는다
RUN_SH="$(printf '%q ' "${CMD[@]}")"
# 여러 줄이면 pane 에 셸 연속 프롬프트(then>)가 찍히므로 한 줄로 이어 붙인다
if [ "$AUTOCLOSE_SEC" -gt 0 ] 2>/dev/null; then
  RUN_SH="$RUN_SH; [ \$? -eq 3 ] && { echo; for s in \$(seq $AUTOCLOSE_SEC -1 1); do printf \"\\r  \\033[2m%2d초 뒤 이 pane 을 닫습니다 — Ctrl+C 로 취소\\033[0m\" \$s; sleep 1; done; echo; herdr pane close $PANE; }; true"
fi
herdr pane run "$PANE" bash -c "$RUN_SH" >/dev/null
herdr pane rename "$PANE" "$LABEL" >/dev/null 2>&1 || true
echo "$PANE"
