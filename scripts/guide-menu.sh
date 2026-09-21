#!/usr/bin/env bash
# 헤르메스 가이드 메뉴 — ↑/↓ 또는 숫자로 고르고 Enter 로 실행. q 로 종료.
# 외부 의존 없음(bash + tput + python3). herdr pane 안에서 띄우면 스킬 실행 항목이
# 아래에 새 pane 을 열어 별도 헤르메스 세션으로 /<스킬> 을 돌린다.
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERMES_DIR"
CLAUDE_PANE="${HERMES_CLAUDE_PANE:-}"
REPOS=( $(ls "$HERMES_DIR/repos" 2>/dev/null) )

BOLD=$(tput bold 2>/dev/null || true); DIM=$(tput dim 2>/dev/null || true)
REV=$(tput rev 2>/dev/null || true);   RESET=$(tput sgr0 2>/dev/null || true)
GREEN=$(tput setaf 2 2>/dev/null || true); YELLOW=$(tput setaf 3 2>/dev/null || true)
CYAN=$'\e[38;5;80m'; GRAY=$'\e[38;5;245m'; HL=$'\e[48;5;24m\e[38;5;231m\e[1m'   # 선택 행: 진한 파랑 배경 + 흰 글자
TITLE=$'\e[1m\e[38;5;222m'

# ---------- 동작 ----------
mouse_on()  { printf '\e[?1000h\e[?1006h'; }   # 클릭·휠 보고 (SGR 인코딩)
mouse_off() { printf '\e[?1000l\e[?1006l'; }
ITEM_ROW0=3   # draw() 에서 1번 항목이 찍히는 화면 행

pause() { printf '\n%s↩  아무 키나 누르면 메뉴로 돌아갑니다%s' "$GRAY" "$RESET"; IFS= read -rsn1 _; }
section() { # section <파일> <시작 정규식> <끝 정규식>  → 시작~끝 직전까지 출력
  awk -v s="$2" -v e="$3" '$0 ~ s {p=1} p && $0 ~ e && !($0 ~ s) {exit} p' "$1"
}
ask_claude() { # ask_claude <프롬프트>  — 기존 헤르메스 pane 을 건드리지 않고 **새 pane** 에 별도 Claude 세션을 띄워 실행
  if [ "${HERDR_ENV:-}" = 1 ] && command -v herdr >/dev/null 2>&1 && command -v claude >/dev/null 2>&1; then
    local out new_pane
    out="$(herdr pane split --current --direction down --ratio 0.5 --cwd "$HERMES_DIR" --focus 2>&1)" || {
      printf '%s⚠️ pane 분할 실패:%s %s\n' "$YELLOW" "$RESET" "$out"; return 1; }
    new_pane="$(printf '%s' "$out" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["pane"]["pane_id"])')"
    sleep 1
    herdr pane run "$new_pane" claude "$1" >/dev/null
    herdr pane rename "$new_pane" "헤르메스 작업" >/dev/null 2>&1 || true
    printf '%s✔ 새 pane(%s)에 헤르메스 세션을 띄워 실행했습니다:%s %s\n' "$GREEN" "$new_pane" "$RESET" "$1"
  else
    printf '%sherdr 밖이거나 claude 명령이 없습니다. 채팅에 직접 붙여넣으세요:%s\n\n  %s\n' "$YELLOW" "$RESET" "$1"
  fi
}

# 마크다운 뷰어: glow 가 있으면 glow, 없으면 내장 렌더러(scripts/mdview.py) → less
view_md() { # view_md <파일>
  if command -v glow >/dev/null 2>&1; then glow -p "$1"
  else python3 "$HERMES_DIR/scripts/mdview.py" "$1" | less -R; fi
}
view_md_stdin() { # 표준입력의 마크다운을 렌더해 less 로
  if command -v glow >/dev/null 2>&1; then glow -p -
  else python3 "$HERMES_DIR/scripts/mdview.py" | less -R; fi
}

# ---------- frontmatter 읽기 ----------
list_skills() { # 출력: <디렉토리>\t<이름>\t<인자힌트>\t<설명>
  python3 - "$HERMES_DIR" <<'PY'
import sys, os, glob
root = sys.argv[1]
def meta_of(path):
    meta = {}
    with open(path, encoding='utf-8') as fp:
        lines = fp.read().split('\n')
    if lines and lines[0].strip() == '---':
        for line in lines[1:]:
            if line.strip() == '---':
                break
            if ':' in line:
                key, val = line.split(':', 1)
                meta[key.strip()] = val.strip().strip('"').strip("'")
    return meta
for path in sorted(glob.glob(os.path.join(root, '.claude/skills/*/SKILL.md'))):
    dirname = os.path.basename(os.path.dirname(path))
    meta = meta_of(path)
    print('\t'.join([dirname, meta.get('name', dirname),
                     meta.get('argument-hint', ''), meta.get('description', '')]))
PY
}

# ---------- 각 항목의 동작 ----------
act_skills() { # 스킬 목록 → 골라서 실행하거나 SKILL.md 보기
  local dirs=() names=() hints=() descs=() dir name hint desc idx pick act args cols
  while IFS=$'\t' read -r dir name hint desc; do
    dirs+=("$dir"); names+=("$name"); hints+=("$hint"); descs+=("$desc")
  done < <(list_skills)
  if [ "${#names[@]}" -eq 0 ]; then
    printf '%s.claude/skills 에 스킬이 없습니다.%s\n' "$YELLOW" "$RESET"; pause; return
  fi
  cols=$(tput cols 2>/dev/null || echo 80); [ "$cols" -lt 40 ] && cols=80
  printf '%s번호를 고르면 실행하거나 SKILL.md 를 볼 수 있습니다. 빈 입력이면 메뉴로 돌아갑니다.%s\n\n' "$GRAY" "$RESET"
  for idx in "${!names[@]}"; do
    printf '  %s%2d%s  %s/%s%s' "$CYAN" $((idx+1)) "$RESET" "$BOLD" "${names[$idx]}" "$RESET"
    [ -n "${hints[$idx]}" ] && printf '  %s%s%s' "$GRAY" "${hints[$idx]}" "$RESET"
    printf '\n'
    [ -n "${descs[$idx]}" ] && wrap_help $((cols - 12)) "${descs[$idx]}"
    printf '\n'
  done
  printf '번호: '; read -r pick
  [[ "$pick" =~ ^[0-9]+$ ]] && [ "$pick" -ge 1 ] && [ "$pick" -le "${#names[@]}" ] || return
  idx=$((pick-1))
  printf '\n  %s/%s%s   %s[⏎] 새 pane 에서 실행  ·  [v] SKILL.md 보기  ·  [q] 취소%s\n선택: ' \
    "$BOLD" "${names[$idx]}" "$RESET" "$GRAY" "$RESET"
  IFS= read -rsn1 act; echo
  case "$act" in
    v|V) view_md ".claude/skills/${dirs[$idx]}/SKILL.md" ;;
    q|Q) return ;;
    "")
      if [ -n "${hints[$idx]}" ]; then
        printf '인자 %s%s%s (없으면 Enter): ' "$GRAY" "${hints[$idx]}" "$RESET"
      else
        printf '인자 (없으면 Enter): '
      fi
      read -r args
      ask_claude "/${names[$idx]}${args:+ $args}"
      pause ;;
  esac
}

act_agents() { # 에이전트 목록(.claude/agents/*.md) + AGENTS.md 라우팅 기준
  { python3 - "$HERMES_DIR" <<'PY'
import sys, os, glob, re
root = sys.argv[1]
print('# 에이전트 · 담당 레포\n')
for path in sorted(glob.glob(os.path.join(root, '.claude/agents/*.md'))):
    body = open(path, encoding='utf-8').read()
    lines = body.split('\n')
    meta = {}
    if lines and lines[0].strip() == '---':
        for line in lines[1:]:
            if line.strip() == '---':
                break
            if ':' in line:
                key, val = line.split(':', 1)
                meta[key.strip()] = val.strip().strip('"').strip("'")
    name = meta.get('name', os.path.basename(path)[:-3])
    repo = re.search(r'^- 레포: *(.+)$', body, re.M)
    port = re.search(r'^- dev 포트: *(.+)$', body, re.M)
    head = f'**{name}**'
    if repo:
        head += f' — {repo.group(1).strip()}'          # 원문에 이미 백틱·포트가 들어 있어 그대로 쓴다
    if port and port.group(1).strip() and '포트' not in head:
        head += f' · dev 포트 {port.group(1).strip()}'
    print(f'- {head}')
    if meta.get('description'):
        print(f'  {meta["description"]}')
    print()
PY
    echo
    section AGENTS.md '^### 어느 레포인지 고르기' '^---'
  } | view_md_stdin
}

act_status() {
  { for repo in "${REPOS[@]}"; do
      echo "${BOLD}== $repo${RESET}"
      git -C "repos/$repo" status --short --branch 2>&1 | head -15
      git -C "repos/$repo" log --oneline -3 2>&1; echo
    done
    echo "${BOLD}== 진행 중 계획서${RESET}"
    find plans -name '*.md' -not -path 'plans/archive/*' 2>/dev/null | sort
  } | less -R
}

act_playbook()  { open docs/playbook.html && echo "브라우저에서 docs/playbook.html 을 열었습니다."; pause; }
act_diagram()   { open docs/diagrams/hermes-flow.html && echo "브라우저에서 작업 흐름 다이어그램을 열었습니다."; pause; }
act_services()  { view_md docs/services.md; }
act_flow()      { { section CLAUDE.md '^## 작업 흐름' '^## Skills'; } | view_md_stdin; }
act_extending() { view_md docs/extending.md; }

# ---------- 메뉴 ----------
# 항목: 아이콘 | 제목 | 설명 | 동작
ICONS=( "⚡" "👥" "📊" "🌐" "🔀" "🗺️ " "🔁" "📘" )
TITLES=(
  "스킬 목록 · 실행"
  "에이전트 · 담당 레포 · 라우팅"
  "git 현황 · 진행 중 계획서"
  "플레이북을 브라우저로 열기"
  "작업 흐름 다이어그램 (인터랙티브)"
  "서비스 맵"
  "작업 흐름 (Plan-First)"
  "확장 가이드"
)
DESCS=(
  ".claude/skills/*"
  ".claude/agents/* · AGENTS.md"
  "로컬 실행"
  "docs/playbook.html"
  "docs/diagrams/hermes-flow.html"
  "docs/services.md"
  "CLAUDE.md"
  "docs/extending.md"
)
HELPS=(
  "헤르메스에게 시킬 수 있는 슬래시 커맨드 목록. 이름·인자·설명을 .claude/skills 에서 그때그때 읽어오니 스킬을 추가하면 여기에도 바로 나온다. 번호를 고르면 새 pane 에 별도 헤르메스 세션을 띄워 실행하거나(⏎) SKILL.md 본문을 볼 수 있다(v)"
  "FE 에이전트 전원의 담당 레포·포트와 라우팅 문장을 .claude/agents 에서 읽어 보여주고, 그 아래에 AGENTS.md 의 '어느 레포인지 고르기' 기준을 붙인다. 어떤 요청이 어느 서비스인지 헷갈릴 때"
  "repos/ 에 연결된 모든 담당 레포의 브랜치, 미커밋 변경, 최근 커밋 3개와 진행 중 계획서 목록을 한 화면에. 로컬에서 바로 돌아 빠르다"
  "공유용 플레이북 HTML 을 기본 브라우저에서 연다. 같은 내용이 claude.ai 아티팩트로도 공유돼 있다"
  "요청부터 보고까지의 흐름을 인터랙티브 다이어그램으로 본다. 레인별로 사용자·헤르메스·FE 에이전트가 각각 무엇을 하는지, 어디서 멈추고 묻는지, 에이전트가 무엇을 읽는지를 3가지 뷰로 나눠 볼 수 있다. Archify 로 생성하며 원본은 docs/diagrams/hermes-flow.workflow.json"
  "담당 서비스의 포트·스택·검증 명령·생성물 비교표 (docs/services.md)"
  "분석 → 계획서 → 승인 → 병렬 디스패치 → 검증 → 보고 → 정리, 헤르메스의 6단계 Plan-First 흐름"
  "스킬·에이전트를 추가하는 방법과 같이 갱신할 문서 목록. docs/extending.md 를 마크다운 뷰어로 연다 (q 로 닫기)"
)
ACTIONS=(act_skills act_agents act_status act_playbook act_diagram act_services act_flow act_extending)
# 그룹: "시작인덱스|제목"
MENU_GROUPS=( "0|⚡  실행 · 확인" "3|📘  문서" )
sel=0; n=${#TITLES[@]}
ROW_OF=()   # ROW_OF[i] = i번 항목이 그려진 화면 행(1-based). 클릭 매핑에 사용

GROUP_AT=()   # GROUP_AT[i] = i번 항목 앞에 찍을 그룹 제목 (없으면 빈 값). 서브셸 없이 조회하기 위한 배열
for g in "${MENU_GROUPS[@]}"; do GROUP_AT[${g%%|*}]="${g#*|}"; done
wrap_help() { # wrap_help <폭> <문장> → 한글 2칸 기준으로 줄을 나눠 5칸 들여쓰기해 출력
  python3 - "$1" "$2" <<'PY'
import sys, unicodedata
width, text = int(sys.argv[1]), sys.argv[2]
def w(ch): return 2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1
lines, cur, cur_w = [], "", 0
for word in text.split(" "):
    ww = sum(w(c) for c in word)
    if cur and cur_w + 1 + ww > width:
        lines.append(cur); cur, cur_w = word, ww
    else:
        cur = word if not cur else cur + " " + word; cur_w = ww if cur_w == 0 else cur_w + 1 + ww
if cur: lines.append(cur)
print("\n".join("     " + l for l in lines))
PY
}
cursor_hide() { printf '\e[?25l'; }
cursor_show() { printf '\e[?25h'; }

draw() {
  local cols; cols=$(tput cols 2>/dev/null || echo 80); [ "$cols" -lt 30 ] && cols=80
  local wide=0; [ "$cols" -ge 70 ] && wide=1          # 넓을 때만 설명 컬럼 표시
  local rule_w=$(( cols - 4 )); [ "$rule_w" -gt 60 ] && rule_w=60
  local rule="" k; for ((k=0; k<rule_w; k++)); do rule+="─"; done
  local frame="" row=1 i num desc
  frame+=$'\n'"  ${TITLE}⚡ Hermes 가이드 메뉴${RESET}"$'\n'; row=$((row+2))
  frame+="  ${GRAY}${rule}${RESET}"$'\n'; row=$((row+1))
  for i in "${!TITLES[@]}"; do
    if [ -n "${GROUP_AT[$i]:-}" ]; then
      frame+=$'\n'"  ${CYAN}${GROUP_AT[$i]}${RESET}"$'\n'; row=$((row+2))
    fi
    ROW_OF[$i]=$row
    printf -v num '%2d' $((i+1))
    desc=""; [ "$wide" = 1 ] && desc="  ·  ${DESCS[$i]}"
    if [ "$i" -eq "$sel" ]; then
      frame+="  ${HL} ▶ ${num}  ${ICONS[$i]} ${TITLES[$i]}${desc} ${RESET}"$'\n'
    else
      frame+="     ${num}  ${ICONS[$i]} ${TITLES[$i]}${GRAY}${desc}${RESET}"$'\n'
    fi
    row=$((row+1))
  done
  # 선택 항목 설명 패널
  frame+=$'\n'"  ${GRAY}${rule}${RESET}"$'\n'
  frame+="  ${CYAN}💬 ${TITLES[$sel]}${RESET}"$'\n'
  frame+="$(wrap_help $((cols - 12)) "${HELPS[$sel]}")"$'\n'
  if [ "$wide" = 1 ]; then
    frame+=$'\n'"  ${GRAY}🖱 클릭  ·  ↕ 방향키/휠  ·  🔢 숫자  ·  ⏎ 실행  ·  q 종료${RESET}"$'\n'
  else
    frame+=$'\n'"  ${GRAY}🖱 클릭 · ↕ · ⏎ 실행 · q 종료${RESET}"$'\n'
  fi
  # 화면을 지우지 않고 홈으로 이동해 덮어쓴 뒤, 남은 아래쪽만 지운다 → 깜빡임 없음
  frame="${frame//$'\n'/$'\e[K\n'}"   # 각 줄 끝까지 지워 이전 프레임의 긴 글자가 남지 않게
  printf '\e[H%s\e[J' "$frame"
}

row_to_index() { # row_to_index <화면행> → 항목 인덱스 (없으면 -1)
  local i
  for i in "${!ROW_OF[@]}"; do [ "${ROW_OF[$i]}" = "$1" ] && { echo "$i"; return; }; done
  echo -1
}

run_sel() { mouse_off; cursor_show; clear; printf '%s%s %s%s\n\n' "$TITLE" "${ICONS[$sel]}" "${TITLES[$sel]}" "$RESET"; "${ACTIONS[$sel]}"; clear; cursor_hide; mouse_on; }

trap 'mouse_off; cursor_show; clear; exit 0' INT TERM EXIT
clear; cursor_hide; mouse_on
while :; do
  draw
  IFS= read -rsn1 key
  if [ "$key" = $'\x1b' ]; then
    # 바이트가 나눠 들어와도(herdr send-keys 등) 시퀀스 끝까지 읽는다 (bash 3.2: 정수 타임아웃만 가능)
    IFS= read -rsn1 -t 1 b1 || b1=""
    IFS= read -rsn1 -t 1 b2 || b2=""
    key=ignore
    if [ "$b1" = "[" ] && [ "$b2" = "<" ]; then
      seq=""
      while IFS= read -rsn1 -t 1 ch; do
        case "$ch" in M|m) break ;; *) seq+="$ch" ;; esac
      done
      IFS=';' read -r mb mx my <<<"$seq"
      if [ "$ch" = "M" ]; then
        case "$mb" in
          0)  idx=$(row_to_index "$my"); [ "$idx" -ge 0 ] && { sel=$idx; key=click; } ;;
          64) key=up ;;
          65) key=down ;;
        esac
      fi
    elif [ "$b1" = "[" ] || [ "$b1" = "O" ]; then
      case "$b2" in A) key=up ;; B) key=down ;; esac
    fi
  fi
  [ -n "${GUIDE_MENU_DEBUG:-}" ] && printf 'key=%q seq=%q sel=%s\n' "$key" "${seq:-}" "$sel" >> "$GUIDE_MENU_DEBUG"
  case "$key" in
    up|k)   sel=$(( (sel - 1 + n) % n )) ;;
    down|j) sel=$(( (sel + 1) % n )) ;;
    ""|click) run_sel ;;
    [1-9])  idx=$((key-1)); [ "$idx" -lt "$n" ] && { sel=$idx; run_sel; } ;;
    q|Q) exit 0 ;;
  esac
done
