#!/usr/bin/env bash
# 헤르메스 가이드 메뉴 — ↑/↓ 또는 숫자로 고르고 Enter 로 실행. q 로 종료.
# 외부 의존 없음(bash + tput). herdr pane 안에서 띄우면 "헤르메스에게 요청" 항목이
# HERMES_CLAUDE_PANE 에 지정된 Claude Code pane 으로 프롬프트를 보낸다.
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
open_editor() {
  if command -v cursor >/dev/null 2>&1; then cursor "$1"; else "${EDITOR:-vim}" "$1"; fi
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
act_extending() { view_md docs/extending.md; }
act_team()      { { section CLAUDE.md '^## 팀 구성' '^## 작업 흐름'; } | view_md_stdin; }
act_flow()      { { section CLAUDE.md '^## 작업 흐름' '^## Skills'; } | view_md_stdin; }
act_services()  { view_md docs/services.md; }
act_pick_md() { # hermes 안의 md 파일을 번호로 골라 뷰어로 연다
  local files=() f i
  while IFS= read -r f; do files+=("$f"); done < <(
    { ls CLAUDE.md README.md 2>/dev/null; find docs .claude/agents .claude/rules .claude/skills -name '*.md' 2>/dev/null | sort; } )
  printf '%s번호를 입력하고 Enter. 빈 입력이면 메뉴로 돌아갑니다.%s\n\n' "$GRAY" "$RESET"
  for i in "${!files[@]}"; do printf '  %s%3d%s  %s\n' "$CYAN" $((i+1)) "$RESET" "${files[$i]}"; done
  printf '\n번호: '; read -r pick
  [[ "$pick" =~ ^[0-9]+$ ]] && [ "$pick" -ge 1 ] && [ "$pick" -le "${#files[@]}" ] || return
  view_md "${files[$((pick-1))]}"
}
act_playbook()  { open docs/playbook.html && echo "브라우저에서 docs/playbook.html 을 열었습니다."; pause; }
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
act_new_skill() {
  printf '새 스킬 이름 (소문자·숫자·하이픈, 예: deploy-check): '; read -r name
  [[ "$name" =~ ^[a-z][a-z0-9-]{0,31}$ ]] || { echo "${YELLOW}이름 형식이 맞지 않습니다.${RESET}"; pause; return; }
  target=".claude/skills/$name/SKILL.md"
  [ -e "$target" ] && { echo "${YELLOW}이미 있습니다: $target${RESET}"; pause; return; }
  mkdir -p ".claude/skills/$name"
  cat > "$target" <<TPL
---
name: $name
description: 어떤 요청이면 이 스킬인지 한 문장으로. (콜론+공백 금지)
argument-hint: "인자 예시"
---

# $name

요청: \$ARGUMENTS

## 절차
1.
2.

## 보고
-
TPL
  echo "${GREEN}✔ 생성:${RESET} $target  → /$name 으로 바로 쓸 수 있습니다."
  open_editor "$target"
  printf '\n문서(CLAUDE.md Skills 표 · README · playbook) 반영을 헤르메스에게 요청할까요? [y/N] '; read -rsn1 yn; echo
  [[ "$yn" =~ ^[Yy]$ ]] && ask_claude "방금 추가한 스킬 /$name (.claude/skills/$name/SKILL.md)을 CLAUDE.md Skills 표, README.md, docs/playbook.html에 반영해줘"
  pause
}
act_new_agent() {
  printf '새 에이전트 이름 (소문자·숫자·하이픈, 예: care-fe): '; read -r name
  [[ "$name" =~ ^[a-z][a-z0-9-]{0,31}$ ]] || { echo "${YELLOW}이름 형식이 맞지 않습니다.${RESET}"; pause; return; }
  target=".claude/agents/$name.md"
  [ -e "$target" ] && { echo "${YELLOW}이미 있습니다: $target${RESET}"; pause; return; }
  cat > "$target" <<TPL
---
name: $name
description: <레포>(<서비스 설명>) 담당 프론트엔드 엔지니어. repos/<레포> 안의 작업에 사용한다. <어떤 화면·요청이면 이 에이전트인지 구체적으로>. (콜론+공백 금지)
tools: Read, Glob, Grep, Edit, Write, Bash
---

너는 **$name**, \`<레포>\` 전담 프론트엔드 엔지니어다.
헤르메스(팀리드)가 승인된 작업계획서와 함께 작업을 넘긴다. 담당 레포 밖은 수정하지 않는다.

## 기본 정보
- 레포: repos/<레포>
- 스택:
- dev 포트:

## 구조
-

## 코드 규칙
- 기존 패턴을 먼저 읽고 따른다

## 검증 명령
\`\`\`bash
\`\`\`

## 보고 형식
- 변경 파일 목록, 검증 결과(lint/typecheck/test), 남은 위험
- 커밋하지 않는다
TPL
  echo "${GREEN}✔ 생성:${RESET} $target  (기존 .claude/agents/*.md 를 참고해 채우세요)"
  open_editor "$target"
  printf '\n문서(CLAUDE.md 팀 표·라우팅 · README · playbook) 반영을 헤르메스에게 요청할까요? [y/N] '; read -rsn1 yn; echo
  [[ "$yn" =~ ^[Yy]$ ]] && ask_claude "방금 추가한 에이전트 $name (.claude/agents/$name.md)을 CLAUDE.md 팀 표·라우팅 기준, README.md, docs/playbook.html에 반영해줘"
  pause
}
act_ask_sync_docs() { ask_claude "방금 추가한 스킬/에이전트를 CLAUDE.md 팀 표·Skills 표, README.md, docs/playbook.html에 반영해줘"; pause; }
act_ask_sync()      { ask_claude "/sync"; pause; }
act_ask_status()    { ask_claude "/status"; pause; }

# ---------- 메뉴 ----------
# 항목: 아이콘 | 제목 | 설명 | 동작
ICONS=( "📘" "👥" "🔁" "🗺️ " "🌐" "📂" "📊" "✨" "🤖" "📝" "🔄" "📋" )
TITLES=(
  "확장 가이드 보기"
  "팀 구성 · 라우팅 기준"
  "작업 흐름 (Plan-First)"
  "서비스 맵"
  "플레이북을 브라우저로 열기"
  "md 파일 골라 보기"
  "담당 레포 git 현황 · 계획서"
  "새 스킬 만들기"
  "새 에이전트 만들기"
  "스킬/에이전트 문서 반영 요청"
  "/sync 실행"
  "/status 실행"
)
DESCS=(
  "docs/extending.md"
  "CLAUDE.md"
  "CLAUDE.md"
  "docs/services.md"
  "docs/playbook.html"
  "에이전트·규칙·문서 전체"
  "로컬 실행"
  "템플릿 생성 → 편집기"
  "템플릿 생성 → 편집기"
  "헤르메스 세션"
  "헤르메스 세션"
  "헤르메스 세션"
)
HELPS=(
  "스킬·에이전트를 추가하는 방법과 같이 갱신할 문서 목록. docs/extending.md 를 less 로 연다 (q 로 닫기)"
  "에이전트 5개의 담당 레포·서비스·스택 표와, 어떤 요청이 어느 에이전트로 가는지 라우팅 기준"
  "분석 → 계획서 → 승인 → 병렬 디스패치 → 검증 → 보고 → 정리, 헤르메스의 6단계 Plan-First 흐름"
  "담당 서비스의 포트·스택·검증 명령·생성물 비교표 (docs/services.md)"
  "공유용 플레이북 HTML 을 기본 브라우저에서 연다. 같은 내용이 claude.ai 아티팩트로도 공유돼 있다"
  "CLAUDE.md·README·docs·에이전트·규칙·스킬 md 를 목록에서 번호로 골라 마크다운 뷰어로 연다 (glow 있으면 glow, 없으면 내장 렌더러)"
  "repos/ 에 연결된 모든 담당 레포의 브랜치, 미커밋 변경, 최근 커밋 3개와 진행 중 계획서 목록을 한 화면에"
  "이름을 입력하면 .claude/skills/<이름>/SKILL.md 템플릿을 만들고 편집기를 연다. 저장하면 /<이름> 으로 바로 쓸 수 있다"
  "이름을 입력하면 .claude/agents/<이름>.md 템플릿을 만들고 편집기를 연다. description 이 라우팅 문장이니 구체적으로"
  "아래에 새 pane 을 열어 별도 헤르메스 세션을 띄우고, 방금 추가한 스킬/에이전트를 CLAUDE.md·README·playbook 에 반영해 달라고 요청한다"
  "아래에 새 pane 을 열어 별도 헤르메스 세션으로 /sync 를 돌린다. 담당 레포 origin/<branch> 를 읽어 에이전트 md·서비스 맵·플레이북을 갱신"
  "아래에 새 pane 을 열어 별도 헤르메스 세션으로 /status 를 돌린다. 이 세션(현재 대화)은 건드리지 않는다"
)
ACTIONS=(act_extending act_team act_flow act_services act_playbook act_pick_md act_status
         act_new_skill act_new_agent act_ask_sync_docs act_ask_sync act_ask_status)
# 그룹: "시작인덱스|제목"
MENU_GROUPS=( "0|📚  문서" "6|🧰  도구" "9|🚀  헤르메스에게 (새 pane 에서 실행)" )
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
    0)      [ 9 -lt "$n" ] && { sel=9; run_sel; } ;;
    q|Q) exit 0 ;;
  esac
done
