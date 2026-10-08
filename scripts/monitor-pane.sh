#!/usr/bin/env bash
# 에이전트 로그 모니터(scripts/agent-monitor.py — 백그라운드 서브에이전트 + 워크트리 pane 세션)를 herdr pane 에 띄운다.
# 사용: scripts/monitor-pane.sh [분]   → 최근 N분(기본 120) 안에 수정된 로그를 tail
#
# 같은 워크스페이스에 "🛰 에이전트 모니터" pane 이 이미 있으면 새로 만들지 않고 그 pane 에서 다시 실행한다.
# 늘 켜 두는 용도(--stay) — 로그가 없어도 닫지 않고 기다리다 에이전트가 뜨면 붙는다. 10분 조용하면 알림(MONITOR_IDLE_ALERT_SEC).
# 표준출력은 pane id 한 줄 (재사용이면 " (재사용)" 이 붙는다).
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="🛰 에이전트 모니터"

MINUTES="${1:-}"
[[ "$MINUTES" =~ ^[0-9]+$ ]] || MINUTES=""     # 숫자가 아니면 기본값(120분)을 쓴다
CMD=("$HERMES_DIR/scripts/agent-monitor.py" --stay --recent)
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
RUN_SH="$(printf '%q ' "${CMD[@]}")"
herdr pane run "$PANE" bash -c "$RUN_SH" >/dev/null
herdr pane rename "$PANE" "$LABEL" >/dev/null 2>&1 || true
echo "$PANE"
