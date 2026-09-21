#!/usr/bin/env bash
# 에이전트를 **보이는 herdr pane** 에서 연다. 헤르메스가 Agent 도구(백그라운드) 대신 쓴다.
#
# 사용:
#   scripts/delegate.sh <에이전트명>                      # pane 만 열고 대기 — 거기서 작업을 지시한다 (기본)
#   scripts/delegate.sh <에이전트명> "<프롬프트>"           # 프롬프트까지 넣어 바로 시작
#   scripts/delegate.sh <에이전트명> --cwd <경로>          # 워크트리 등 다른 디렉터리에서 연다
#   scripts/delegate.sh <에이전트명> "<프롬프트>" --down    # 오른쪽 대신 아래로 분할
#
# 에이전트명은 .claude/agents/<이름>.md 의 name 이다 (hub-fe, reviewer 등).
# 결과는 pane 에서 보고, 헤르메스는 `herdr pane read <id>` 로 읽는다.
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"

AGENT=""; PROMPT=""; DIR="right"; WORKDIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --down) DIR="down"; shift ;;
    --cwd)  WORKDIR="${2:-}"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) if [ -z "$AGENT" ]; then AGENT="$1"; else PROMPT="$1"; fi; shift ;;
  esac
done

[ -n "$AGENT" ] || { echo "사용: $0 <에이전트명> [\"<프롬프트>\"] [--cwd <경로>] [--down]"; exit 2; }

# 에이전트 이름 검증 — 오타로 엉뚱한 세션이 뜨는 것을 막는다
if [ ! -f "$HERMES_DIR/.claude/agents/$AGENT.md" ]; then
  echo "그런 에이전트가 없다: $AGENT"
  echo "가능한 이름: $(ls "$HERMES_DIR/.claude/agents" | sed 's/\.md$//' | tr '\n' ' ')"
  exit 2
fi

WORKDIR="${WORKDIR:-$HERMES_DIR}"
[ -d "$WORKDIR" ] || { echo "디렉터리가 없다: $WORKDIR"; exit 2; }

if [ "${HERDR_ENV:-}" != 1 ] || ! command -v herdr >/dev/null 2>&1; then
  echo "herdr 밖입니다. 직접 실행하세요:"
  if [ -n "$PROMPT" ]; then echo "  (cd $WORKDIR && claude --agent $AGENT \"$PROMPT\")"
  else echo "  (cd $WORKDIR && claude --agent $AGENT)"; fi
  exit 1
fi

OUT="$(herdr pane split --current --direction "$DIR" --ratio 0.5 --cwd "$WORKDIR" --no-focus)" \
  || { echo "pane split 실패: $OUT"; exit 1; }
PANE="$(printf '%s' "$OUT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')" \
  || { echo "pane id 파싱 실패"; exit 1; }
sleep 1

# `herdr pane run` 은 인자를 따옴표 없이 셸 명령줄로 이어붙인다.
# 프롬프트를 그대로 넘기면 공백에서 단어가 쪼개지고 ( ) ! * 가 셸에 먹혀
# 에이전트가 엉뚱한 프롬프트를 받는다(실제로 겪음). 그래서 러너 스크립트 한 개만 넘긴다.
PROMPT_FILE="$(mktemp -t hermes-prompt)" || { echo "mktemp 실패"; exit 1; }
RUNNER="$(mktemp -t hermes-runner)"      || { rm -f "$PROMPT_FILE"; echo "mktemp 실패"; exit 1; }
printf '%s' "$PROMPT" > "$PROMPT_FILE"   || { rm -f "$PROMPT_FILE" "$RUNNER"; echo "프롬프트 쓰기 실패"; exit 1; }

# exec 를 쓰지 않는다. exec 는 셸을 교체해 EXIT trap 이 돌지 않아 임시 파일이 남는다.
{
  echo '#!/usr/bin/env bash'
  echo "cleanup() { rm -f '$PROMPT_FILE' '$RUNNER'; }"
  echo 'trap cleanup EXIT INT TERM'
  echo "cd '$WORKDIR' || exit 1"
  if [ -n "$PROMPT" ]; then
    echo "claude --agent '$AGENT' \"\$(cat '$PROMPT_FILE')\""
  else
    echo "claude --agent '$AGENT'"
  fi
  echo 'exit $?'
} > "$RUNNER"
chmod +x "$RUNNER" || { rm -f "$PROMPT_FILE" "$RUNNER"; echo "chmod 실패"; exit 1; }

if ! herdr pane run "$PANE" "$RUNNER" >/dev/null; then
  rm -f "$PROMPT_FILE" "$RUNNER"
  echo "pane 실행 실패 (pane $PANE)"; exit 1
fi
herdr pane rename "$PANE" "🤖 $AGENT" >/dev/null 2>&1 || true

if [ -n "$PROMPT" ]; then
  echo "$PANE  ($AGENT — 프롬프트 전달됨, cwd: $WORKDIR)"
else
  echo "$PANE  ($AGENT — 대기 중. 이 pane 에서 작업을 지시하세요. cwd: $WORKDIR)"
fi
