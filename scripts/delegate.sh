#!/usr/bin/env bash
# 에이전트를 **보이는 herdr pane** 에서 연다. 헤르메스가 Agent 도구(백그라운드) 대신 쓴다.
#
# **계획서 없이는 띄우지 않는다** — 모든 작업은 계획서 하나에 묶인다 (AGENTS.md 5절)
#   --plan <plans/…md>          이미 있는 계획서(정식·경량)에 묶는다
#   --plan new "<한 줄 요약>"     경량 계획서를 새로 만들어 묶는다 (scripts/new-plan.mjs → plans/task/…)
# 띄운 뒤 계획서 Checkpoint 의 Work ref 에 워크트리·브랜치·pane 을 적고, 에이전트 지시 맨 앞에 계획서 경로를 넣는다.
#
# 사용:
#   scripts/delegate.sh <에이전트명> --plan <경로>         # 담당 레포 workspace 의 새 탭에 연다 (기본)
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

AGENT=""; PROMPT=""; DIR="right"; WORKDIR=""; HERE=0; PLAN=""; PLAN_NEW=""
while [ $# -gt 0 ]; do
  case "$1" in
    --plan)
      if [ "${2:-}" = new ]; then PLAN_NEW="${3:-}"; shift 3; else PLAN="${2:-}"; shift 2; fi ;;
    --down) DIR="down"; shift ;;
    --here) HERE=1; shift ;;
    --cwd)  WORKDIR="${2:-}"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) if [ -z "$AGENT" ]; then AGENT="$1"; else PROMPT="$1"; fi; shift ;;
  esac
done

[ -n "$AGENT" ] || { echo "사용: $0 <에이전트명> --plan <plans/…md | new \"<요약>\"> [\"<프롬프트>\"] [--cwd <경로>] [--here] [--down]"; exit 2; }

# 계획서 필수 — 없으면 띄우지 않는다
if [ -z "$PLAN" ] && [ -z "$PLAN_NEW" ]; then
  echo "계획서 없이는 에이전트를 띄우지 않는다. --plan <plans/…md> 또는 --plan new \"<한 줄 요약>\" 을 준다 (docs/plan-template-light.md)" >&2
  exit 2
fi

# 에이전트 이름 검증 — 오타로 엉뚱한 세션이 뜨는 것을 막는다
if [ ! -f "$HERMES_DIR/.claude/agents/$AGENT.md" ]; then
  echo "그런 에이전트가 없다: $AGENT"
  echo "가능한 이름: $(ls "$HERMES_DIR/.claude/agents" | sed 's/\.md$//' | tr '\n' ' ')"
  exit 2
fi

if [ -n "$PLAN_NEW" ]; then
  PROMPT_TMP="$(mktemp -t hermes-plan-prompt)"; printf '%s' "$PROMPT" > "$PROMPT_TMP"
  PLAN="$(node "$HERMES_DIR/scripts/new-plan.mjs" --agent "$AGENT" --summary "$PLAN_NEW" --prompt-file "$PROMPT_TMP")" || { rm -f "$PROMPT_TMP"; echo "경량 계획서를 만들지 못했다" >&2; exit 1; }
  rm -f "$PROMPT_TMP"
fi
PLAN="${PLAN#"$HERMES_DIR"/}"
case "$PLAN" in plans/*.md) ;; *) echo "계획서는 plans/ 아래 .md 여야 한다: $PLAN" >&2; exit 2 ;; esac
[ -f "$HERMES_DIR/$PLAN" ] || { echo "계획서가 없다: $PLAN" >&2; exit 2; }
# 에이전트 지시 맨 앞에 계획서를 박는다 — 프롬프트 없이 열어도 계획서를 읽고 시작하게
PLAN_HEADER="이 작업의 계획서: $HERMES_DIR/$PLAN — 먼저 읽고 Checkpoint 의 Next 부터 한다. 끝나면(또는 막히면) 그 계획서의 Status·Progress·Validation·결과 절을 채운다(Status 는 끝나면 ready_for_review, 막히면 blocked). "
# 지시 없이 띄우면(/call) 사용자가 pane 에서 직접 요청한다 — 첫 요청으로 계획서를 채우게 한다
[ -z "$PROMPT" ] && PLAN_HEADER="${PLAN_HEADER}지금은 지시가 없다. 브랜치·미커밋 상태만 확인해 한 줄로 보고하고 사용자의 요청을 기다린다. 첫 요청을 받으면 계획서의 제목(# 줄)과 '## 지시' 절을 그 요청으로 바꿔 적고 진행한다. 요청이 여러 레포·API 변경으로 커지면 멈추고 정식 계획서가 필요하다고 알린다. "
PROMPT="$PLAN_HEADER${PROMPT}"

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

# 워크트리는 별도 git 레포라 Claude Code 가 hermes 의 .claude/agents·rules·AGENTS.md 를 못 찾는다
# (2026-09-23 실측 — `--agent '<이름>' not found`). hermes 밖 git 레포에서 띄울 때는
# 정의·공통 규칙을 직접 넘기고, 상태바·검증 스크립트가 메인 체크아웃 대신 워크트리를 보게 한다.
WORK_TOP="$(git -C "$WORKDIR" rev-parse --show-toplevel 2>/dev/null)"
HERMES_REAL="$(cd "$HERMES_DIR" && pwd -P)"
CLAUDE_ARGS="--agent '$AGENT'"
EXTRA_FILES=""
if [ -n "$WORK_TOP" ] && [ "$(cd "$WORK_TOP" && pwd -P)" != "$HERMES_REAL" ]; then
  AGENTS_JSON="$(mktemp -t hermes-agents)" && CONTEXT_FILE="$(mktemp -t hermes-context)" && SETTINGS_FILE="$(mktemp -t hermes-settings)" \
    && python3 "$HERMES_DIR/scripts/agent-context.py" "$AGENT" "$HERMES_DIR" "$WORK_TOP" "$AGENTS_JSON" "$CONTEXT_FILE" "$SETTINGS_FILE" \
    || { rm -f "$PROMPT_FILE" "$RUNNER" "${AGENTS_JSON:-}" "${CONTEXT_FILE:-}" "${SETTINGS_FILE:-}"; echo "에이전트 컨텍스트 생성 실패"; exit 1; }
  EXTRA_FILES="'$AGENTS_JSON' '$CONTEXT_FILE' '$SETTINGS_FILE'"
  CLAUDE_ARGS="--agents \"\$(cat '$AGENTS_JSON')\" $CLAUDE_ARGS --add-dir '$HERMES_DIR' --append-system-prompt-file '$CONTEXT_FILE' --settings '$SETTINGS_FILE'"
  REPO_DIR="$WORK_TOP"
fi

# exec 를 쓰지 않는다. exec 는 셸을 교체해 EXIT trap 이 돌지 않아 임시 파일이 남는다.
{
  echo '#!/usr/bin/env bash'
  echo "cleanup() { rm -f '$PROMPT_FILE' '$RUNNER' $EXTRA_FILES; }"
  echo 'trap cleanup EXIT INT TERM'
  echo "cd '$WORKDIR' || exit 1"
  [ -n "$REPO_DIR" ] && echo "export HERMES_REPO_DIR='$REPO_DIR'"
  [ -n "$EXTRA_FILES" ] && echo "export HERMES_VERIFY_DIR='$WORK_TOP'"
  if [ -n "$PROMPT" ]; then
    echo "claude $CLAUDE_ARGS \"\$(cat '$PROMPT_FILE')\""
  else
    echo "claude $CLAUDE_ARGS"
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

# 계획서 Work ref 에 어디서 누가 도는지 적는다 — 현황판이 이 pane 을 카드에 붙인다
python3 - "$HERMES_DIR/$PLAN" "$WORKDIR" "${BRANCH_NAME:-?}" "$PANE" "$AGENT" <<'PYEOF'
import sys, re, pathlib
plan, cwd, branch, pane, agent = sys.argv[1:6]
path = pathlib.Path(plan); text = path.read_text(encoding='utf-8')
line = f"- Work ref: {cwd} · 🌿 {branch} · pane {pane} ({agent})"
text = re.sub(r'^- Work ref:.*$', line, text, count=1, flags=re.M) if re.search(r'^- Work ref:', text, re.M) else text
path.write_text(text, encoding='utf-8')
PYEOF

echo "$PANE  ($AGENT — 계획서 $PLAN · $PLACEMENT · cwd: $WORKDIR)"
