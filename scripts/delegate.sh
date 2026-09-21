#!/usr/bin/env bash
# 에이전트를 **보이는 herdr pane** 에서 연다. 헤르메스가 Agent 도구(백그라운드) 대신 쓴다.
#
# 사용:
#   scripts/delegate.sh <에이전트명>                      # 담당 레포 workspace 의 새 탭에 연다 (기본)
#   scripts/delegate.sh <에이전트명> --cwd <워크트리>       # 그 워크트리에서 연다
#   scripts/delegate.sh <에이전트명> --here                # 레포 workspace 로 보내지 않고 지금 탭에 쪼갠다 (단발 조사용)
#
# 배치 규칙 — workspace = 레포 / 그 안의 한 탭에 pane 을 나란히
#   워크트리마다 탭을 가르지 않는다. 한 화면에서 동시 작업 상황이 다 보이는 쪽이 낫다.
#   각 pane 은 "🤖 <에이전트> · <워크트리>" 로 이름이 붙고, 하단 상태바가
#   레포·브랜치·변경 개수를 보여준다 (scripts/statusline.sh).
#   scripts/delegate.sh <에이전트명> "<프롬프트>"           # 프롬프트까지 넣어 바로 시작
#   scripts/delegate.sh <에이전트명> --cwd <경로>          # 워크트리 등 다른 디렉터리에서 연다
#   scripts/delegate.sh <에이전트명> "<프롬프트>" --down    # 오른쪽 대신 아래로 분할
#
# 에이전트명은 .claude/agents/<이름>.md 의 name 이다 (hub-fe, reviewer 등).
# 결과는 pane 에서 보고, 헤르메스는 `herdr pane read <id>` 로 읽는다.
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"

AGENT=""; PROMPT=""; DIR="right"; WORKDIR=""; HERE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --down) DIR="down"; shift ;;
    --here) HERE=1; shift ;;
    --cwd)  WORKDIR="${2:-}"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) if [ -z "$AGENT" ]; then AGENT="$1"; else PROMPT="$1"; fi; shift ;;
  esac
done

[ -n "$AGENT" ] || { echo "사용: $0 <에이전트명> [\"<프롬프트>\"] [--cwd <경로>] [--here] [--down]"; exit 2; }

# 에이전트 이름 검증 — 오타로 엉뚱한 세션이 뜨는 것을 막는다
if [ ! -f "$HERMES_DIR/.claude/agents/$AGENT.md" ]; then
  echo "그런 에이전트가 없다: $AGENT"
  echo "가능한 이름: $(ls "$HERMES_DIR/.claude/agents" | sed 's/\.md$//' | tr '\n' ' ')"
  exit 2
fi

GIVEN_PROMPT="$PROMPT"
GIVEN_CWD="$WORKDIR"

# 이 에이전트의 담당 레포 경로를 config 에서 찾아 상태바(scripts/statusline.sh)에 넘긴다.
# 매핑의 정본은 hermes.config.json 이므로 여기서 다시 적지 않는다. reviewer 처럼 전담 레포가
# 없으면 빈 값이고, 그러면 상태바가 현재 cwd 로 알아서 찾는다.
REPO_DIR="$(python3 - "$HERMES_DIR/hermes.config.json" "$AGENT" <<'PYEOF'
import json, sys
cfg = json.load(open(sys.argv[1])); agent = sys.argv[2]
for repo in cfg['repos']:
    if agent in (repo.get('agents') or []) or agent == repo.get('packagesAgent'):
        print(repo['name']); break
    if any(app.get('agent') == agent for app in (repo.get('apps') or {}).values()):
        print(repo['name']); break
PYEOF
)"
[ -n "$REPO_DIR" ] && REPO_DIR="$HERMES_DIR/repos/$REPO_DIR"
[ -n "$REPO_DIR" ] && [ ! -d "$REPO_DIR" ] && REPO_DIR=""

WORKDIR="${WORKDIR:-$HERMES_DIR}"
[ -d "$WORKDIR" ] || { echo "디렉터리가 없다: $WORKDIR"; exit 2; }

if [ "${HERDR_ENV:-}" != 1 ] || ! command -v herdr >/dev/null 2>&1; then
  echo "herdr 밖입니다. 직접 실행하세요:"
  if [ -n "$PROMPT" ]; then echo "  (cd $WORKDIR && claude --agent $AGENT \"$PROMPT\")"
  else echo "  (cd $WORKDIR && claude --agent $AGENT)"; fi
  exit 1
fi

# 배치: workspace = 레포 / 그 안의 한 탭에 pane 을 나란히.
# 작업(워크트리)마다 탭을 가르지 않는다. 한 화면에서 동시 작업 상황이 다 보이는 쪽이 낫다.
# --here 이거나 담당 레포가 없으면(reviewer 등) 지금 탭에서 쪼갠다.
PLACEMENT=""
PANE=""
if [ "$HERE" = 0 ] && [ -n "$REPO_DIR" ]; then
  REPO_NAME="$(basename "$REPO_DIR")"

  WS="$(herdr workspace list 2>/dev/null | python3 -c "
import sys, json
try: rows = json.load(sys.stdin)['result']['workspaces']
except Exception: sys.exit()
for w in rows:
    if w.get('label') == '$REPO_NAME': print(w['workspace_id']); break
")"

  if [ -z "$WS" ]; then
    # 새로 만들면 기본 탭이 하나 딸려 온다. 그 탭을 그대로 쓴다 (빈 탭을 남기지 않는다)
    CREATED="$(herdr workspace create --label "$REPO_NAME" --cwd "$WORKDIR" --no-focus 2>/dev/null)"
    WS="$(printf '%s' "$CREATED" | python3 -c "
import sys, json
try: print(json.load(sys.stdin)['result']['workspace']['workspace_id'])
except Exception: pass
")"
    TAB="$(printf '%s' "$CREATED" | python3 -c "
import sys, json
try: print(json.load(sys.stdin)['result']['workspace']['active_tab_id'])
except Exception: pass
")"
    if [ -n "$TAB" ]; then
      herdr tab rename "$TAB" "$REPO_NAME" >/dev/null 2>&1 || true
      PANE="$(herdr pane list 2>/dev/null | python3 -c "
import sys, json
for p in json.load(sys.stdin)['result']['panes']:
    if p.get('tab_id') == '$TAB': print(p['pane_id']); break
")"
      PLACEMENT="새 workspace '$REPO_NAME'"
    fi
  else
    # 이미 있으면 그 workspace 의 활성 탭에 pane 을 덧붙인다
    TAB="$(herdr workspace get "$WS" 2>/dev/null | python3 -c "
import sys, json
try: print(json.load(sys.stdin)['result']['workspace']['active_tab_id'])
except Exception: pass
")"
    BASE="$(herdr pane list 2>/dev/null | python3 -c "
import sys, json
for p in json.load(sys.stdin)['result']['panes']:
    if p.get('tab_id') == '$TAB': print(p['pane_id']); break
")"
    if [ -n "$BASE" ]; then
      PANE="$(herdr pane split "$BASE" --direction "$DIR" --ratio 0.5 --cwd "$WORKDIR" --no-focus 2>/dev/null | python3 -c "
import sys, json
try: print(json.load(sys.stdin)['result']['pane']['pane_id'])
except Exception: pass
")"
      COUNT="$(herdr pane list 2>/dev/null | python3 -c "
import sys, json
print(sum(1 for p in json.load(sys.stdin)['result']['panes'] if p.get('tab_id') == '$TAB'))
")"
      PLACEMENT="workspace '$REPO_NAME' (pane ${COUNT}개째)"
    fi
  fi
fi

# 위에서 못 만들었으면(또는 --here) 지금 탭에서 쪼갠다
if [ -z "$PANE" ]; then
  OUT="$(herdr pane split --current --direction "$DIR" --ratio 0.5 --cwd "$WORKDIR" --no-focus)" \
    || { echo "pane split 실패: $OUT"; exit 1; }
  PANE="$(printf '%s' "$OUT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')" \
    || { echo "pane id 파싱 실패"; exit 1; }
  PLACEMENT="${PLACEMENT:-현재 탭}"
fi
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
  [ -n "$REPO_DIR" ] && echo "export HERMES_REPO_DIR='$REPO_DIR'"
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
# pane 이름에 실제 브랜치를 적는다. 나란히 놓였을 때 어느 작업인지 이름만 보고 알아야 한다.
# 워크트리 폴더명이 아니라 git 이 말하는 브랜치를 쓴다 — 메인 체크아웃에서 열면
# 폴더명은 레포 이름이라 아무것도 알려주지 않는다.
# 브랜치는 **에이전트가 만질 레포**에서 읽는다.
# --cwd 를 주지 않으면 cwd 가 hermes 루트라, 거기서 읽으면 hermes 의 브랜치가 나온다(엉뚱하다).
# verify 스크립트가 hermes 루트 기준이라 cwd 자체는 그대로 두고 읽는 곳만 바꾼다.
BRANCH_FROM="${GIVEN_CWD:-${REPO_DIR:-$WORKDIR}}"
BRANCH_NAME="$(git -C "$BRANCH_FROM" rev-parse --abbrev-ref HEAD 2>/dev/null)"
PANE_TITLE="🤖 $AGENT"
[ -n "$BRANCH_NAME" ] && [ "$BRANCH_NAME" != "HEAD" ] && PANE_TITLE="$PANE_TITLE · $BRANCH_NAME"
herdr pane rename "$PANE" "$PANE_TITLE" >/dev/null 2>&1 || true

if [ -n "$GIVEN_PROMPT" ]; then
  echo "$PANE  ($AGENT — 프롬프트 전달됨 · $PLACEMENT · cwd: $WORKDIR)"
else
  echo "$PANE  ($AGENT — 대기 중 · $PLACEMENT · cwd: $WORKDIR)"
fi
