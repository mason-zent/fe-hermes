#!/usr/bin/env bash
# "📚 배우기 검토" pane 하나에서 learn-review.mjs --watch 를 돌린다(학습 루프 3단계 — 작업마다 pane 을 늘리지 않는다).
# 사용: scripts/learn-review-pane.sh   (보통은 learn-review.mjs --enqueue 가 부른다)
#
# 어느 워크스페이스든 그 이름의 pane 이 이미 있으면 그 pane 에서 다시 돌리고(돌고 있으면 learn-review.mjs 가 알아서 건너뛴다),
# 없으면 지금 pane 옆에 하나 띄운다. 표준출력은 pane id 한 줄. herdr 밖이면 1 로 끝낸다(호출한 쪽이 뒤에서 돌린다).
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="📚 배우기 검토"
CMD=(node "$HERMES_DIR/scripts/learn-review.mjs" --watch)

if [ "${HERDR_ENV:-}" != 1 ] || ! command -v herdr >/dev/null 2>&1; then
  exit 1
fi

PANE="$(herdr pane list 2>/dev/null | python3 -c '
import sys, json
label = sys.argv[1]
try:
    panes = json.load(sys.stdin)["result"]["panes"]
except Exception:
    sys.exit(0)
found = [p for p in panes if p.get("label") == label]
print(found[0]["pane_id"] if found else "")
' "$LABEL")"

RUN="$(printf '%q ' "${CMD[@]}")"   # herdr pane run 은 명령을 한 줄 문자열로 받는다
if [ -n "$PANE" ]; then
  herdr pane run "$PANE" "$RUN" >/dev/null || exit 1
  echo "$PANE (재사용)"
  exit 0
fi

OUT="$(herdr pane split --current --direction down --ratio 0.3 --cwd "$HERMES_DIR" --no-focus)" || exit 1
PANE="$(printf '%s' "$OUT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')" || exit 1
sleep 1
herdr pane run "$PANE" "$RUN" >/dev/null
herdr pane rename "$PANE" "$LABEL" >/dev/null 2>&1 || true
echo "$PANE"
