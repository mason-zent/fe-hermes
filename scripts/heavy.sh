#!/usr/bin/env bash
# 무거운 명령을 한 번에 하나씩, 컴퓨터가 버틸 때만 돌린다 — 앞에 붙이기만 하면 된다.
#
# 사용:  <hermes>/scripts/heavy.sh pnpm install --frozen-lockfile
#        <hermes>/scripts/heavy.sh pnpm --filter plus-web build
#        HERMES_VERIFY_DIR=<워크트리> <hermes>/scripts/heavy.sh <hermes>/scripts/verify/bznav-web.sh plus-web
#
# 왜: 에이전트 여럿이 동시에 install·build·tsc·dev 를 돌리다 컴퓨터가 죽은 적이 있다(2026-10-02).
# 무거운 명령 = pnpm/npm/yarn install, next build·dev, tsc, test, 검증 스크립트(verify/*), relay·gen:relay, pkg:link·pkg:unlink, docker build.
#
# 하는 일
#   1. 공용 잠금(/tmp/hermes-heavy.lock) — 다른 세션이 무거운 명령을 돌리는 중이면 기다린다(레포·워크트리 무관, 한 대에 하나)
#   2. 부하 대기 — 1분 부하 평균이 코어 수 × HERMES_HEAVY_LOAD(기본 1.2) 를 넘으면 내려갈 때까지 기다린다
#      (다른 세션의 QA dev 서버·Spotlight·보안 프로그램처럼 잠금 밖의 부하도 같이 본다)
#   3. 명령을 돌리고, 끝나거나 실패하거나 끊겨도 잠금을 푼다. 주인이 죽은 잠금(프로세스 없음)은 치우고 잡는다
#   4. 감시 — 도는 동안 5초마다 본다. 자식 프로세스가 HERMES_HEAVY_MAX_PROCS(기본 300)를 넘거나
#      메모리 여유가 HERMES_HEAVY_MIN_FREE %(기본 15) 아래로 떨어지면 그 명령과 자식을 모두 끄고 137 로 끝난다
#      (next dev 가 postcss 작업자를 1609개까지 띄워 메모리 70GB·부하 100 까지 간 일 뒤에 넣었다 — 2026-10-02)
# 기다리는 동안 30초마다 "⏳ 대기 — 이유" 를 한 줄 찍는다. 최대 대기 HERMES_HEAVY_WAIT 초(기본 1800) 넘으면 포기하고 75 로 끝난다.
# next dev 처럼 계속 도는 명령도 잠금을 쥐고 있으니, 확인이 끝나면 바로 끈다(Ctrl+C / kill) — 그래야 다음 차례가 돈다.
set -uo pipefail

[ $# -gt 0 ] || { echo "사용: scripts/heavy.sh <무거운 명령…>" >&2; exit 2; }

# 이미 잠금을 쥔 명령 안에서 또 부르면(검증 스크립트 → heavy.sh 등) 그냥 돌린다 — 같은 잠금을 기다리다 멈추지 않게
[ -n "${HERMES_HEAVY_HELD:-}" ] && exec "$@"

LOCK="${HERMES_HEAVY_LOCK:-/tmp/hermes-heavy.lock}"  # 시험할 때만 바꾼다
CORES="$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 4)"
LIMIT="$(awk -v cores="$CORES" -v factor="${HERMES_HEAVY_LOAD:-1.2}" 'BEGIN{printf "%.1f", cores*factor}')"
MAX_WAIT="${HERMES_HEAVY_WAIT:-1800}"
WHO="${HERMES_AGENT:-$(basename "$PWD")}"

load_now() { sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}' || awk '{print $1}' /proc/loadavg; }
over_limit() { awk -v load="$(load_now)" -v limit="$LIMIT" 'BEGIN{exit !(load > limit)}'; }

started=$(date +%s); last_note=0
note() {
  local now; now=$(date +%s)
  if [ $((now - last_note)) -ge 30 ]; then echo "⏳ 대기 $((now - started))초 — $1"; last_note=$now; fi
}
give_up() { echo "⛔ ${MAX_WAIT}초를 기다려도 차례가 오지 않았다 — $1. 헤르메스·사용자에게 알린다" >&2; exit 75; }

# 1) 공용 잠금
while ! mkdir "$LOCK" 2>/dev/null; do
  owner="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$owner" ] && ! kill -0 "$owner" 2>/dev/null; then
    rm -rf "$LOCK"; echo "🧹 주인이 없는 잠금(pid $owner)을 치웠다"; continue
  fi
  note "다른 무거운 명령이 도는 중: $(cat "$LOCK/what" 2>/dev/null || echo '?')"
  [ $(( $(date +%s) - started )) -lt "$MAX_WAIT" ] || give_up "잠금"
  sleep 5
done
echo $$ > "$LOCK/pid"; printf '%s · %s\n' "$WHO" "$*" | cut -c1-160 > "$LOCK/what"
cleanup() { rm -rf "$LOCK"; }
trap cleanup EXIT INT TERM HUP

# 2) 부하 대기
while over_limit; do
  note "부하 $(load_now) > 한도 $LIMIT (코어 $CORES)"
  [ $(( $(date +%s) - started )) -lt "$MAX_WAIT" ] || give_up "부하"
  sleep 10
done

waited=$(( $(date +%s) - started ))
[ "$waited" -gt 0 ] && echo "▶ 차례 — ${waited}초 기다림 · 부하 $(load_now)/$LIMIT"
# 3) 실행 + 4) 감시 — 끝나면 trap 이 잠금을 푼다. 안쪽 호출이 다시 기다리지 않게 표시를 넘긴다
MAX_PROCS="${HERMES_HEAVY_MAX_PROCS:-300}"
MIN_FREE="${HERMES_HEAVY_MIN_FREE:-15}"
# root 아래 자손 pid 들(자기 자신 제외) — ps 의 부모 관계를 거슬러 올라가 root 를 만나면 자손
descendants() {
  ps -axo pid=,ppid= | awk -v root="$1" '{parent[$1]=$2} END{for (pid in parent) {node=pid; while ((node in parent) && node != 1 && node != 0) {if (parent[node] == root) {print pid; break} node = parent[node]}}}'
}
free_percent() { memory_pressure 2>/dev/null | awk -F': ' '/free percentage/{gsub(/%/,"",$2); print $2+0}'; }
stop_all() {
  local pids; pids="$(descendants "$child") $child"
  kill -TERM $pids 2>/dev/null; sleep 3; kill -KILL $pids 2>/dev/null
}
HERMES_HEAVY_HELD=1 "$@" &
child=$!
trap 'stop_all; cleanup; exit 130' INT TERM HUP
trap cleanup EXIT
while kill -0 "$child" 2>/dev/null; do
  sleep 5
  kill -0 "$child" 2>/dev/null || break
  count=$(descendants "$child" | wc -l | tr -d ' ')
  free=$(free_percent); free=${free:-100}
  reason=""
  [ "$count" -gt "$MAX_PROCS" ] && reason="자식 프로세스 ${count}개 > ${MAX_PROCS}"
  [ "$free" -lt "$MIN_FREE" ] && reason="${reason:+$reason · }메모리 여유 ${free}% < ${MIN_FREE}%"
  if [ -n "$reason" ]; then
    echo "⛔ 감시: $reason — 명령을 끈다: $*" >&2
    echo "   폭주한 것이다. 원인(설정·감시 범위 등)을 먼저 찾고, 다시 돌리기 전에 헤르메스·사용자에게 알린다" >&2
    stop_all
    exit 137
  fi
done
wait "$child"
