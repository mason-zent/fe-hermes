#!/usr/bin/env bash
# 작업 브랜치를 만든다. 기본은 **워크트리**라 여러 작업을 동시에 돌릴 수 있다.
#
# 왜 워크트리인가: 체크아웃이 하나뿐이면 레포에 미커밋 변경이 있거나 남이 다른
# 브랜치를 물고 있을 때 작업을 시작조차 못 한다(실제로 겪음). 워크트리는 메인
# 체크아웃을 건드리지 않고 별도 디렉터리를 만들므로 그 제약이 사라지고,
# 한 레포에서 여러 작업을 동시에 진행할 수 있다.
#
# 사용:
#   scripts/new-branch.sh REF-3820 refund hub          # 두 레포에 워크트리 생성
#   scripts/new-branch.sh REF-3820 bznav:care-web      # bznav 는 앱으로 base 를 고른다
#   scripts/new-branch.sh fix/qa-로그인 care            # 슬래시가 있으면 그 이름 그대로
#   scripts/new-branch.sh REF-3820 refund --in-place   # 워크트리 없이 메인 체크아웃에서 분기
#   scripts/new-branch.sh REF-3820 refund --dry-run
#   scripts/new-branch.sh REF-3820 refund --reuse     # 이미 있는 브랜치를 이어 쓴다 (있으면 기본은 알려 주고 멈춘다)
#
# 대상은 레포 이름 일부로 매칭한다 (refund / hub / care / op / packages=zent-packages /
# bznav:<앱> / bznav:packages).
#
# 워크트리 위치: <hermes>/.worktrees/<레포>/<브랜치 슬러그>  (gitignore 대상)
# 정리: git -C repos/<레포> worktree remove <경로>
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$ROOT/hermes.config.json"
WT_ROOT="${HERMES_WORKTREE_ROOT:-$ROOT/.worktrees}"
DRY_RUN=0; IN_PLACE=0; REUSE=0
TICKET=""; TARGETS=()

for arg in "$@"; do
  case "$arg" in
    --dry-run)  DRY_RUN=1 ;;
    --reuse)    REUSE=1 ;;
    --in-place|--no-worktree) IN_PLACE=1 ;;
    -h|--help)  grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) if [ -z "$TICKET" ]; then TICKET="$arg"; else TARGETS+=("$arg"); fi ;;
  esac
done

[ -n "$TICKET" ] && [ ${#TARGETS[@]} -gt 0 ] || { echo "사용: $0 <티켓|브랜치명> <대상...> [--in-place] [--dry-run]"; exit 2; }

case "$TICKET" in
  */*) BRANCH="$TICKET" ;;
  *)   BRANCH="feature/$TICKET" ;;
esac
SLUG="$(printf '%s' "$BRANCH" | tr '/' '-')"
BRANCH_GIVEN="$BRANCH"; SLUG_GIVEN="$SLUG"   # 레포마다 이름 규칙이 다를 수 있어 반복문에서 다시 정한다

resolve() {
  python3 - "$CONFIG" "$1" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))
want = sys.argv[2]; app = None
if ':' in want: want, app = want.split(':', 1)
for repo in cfg['repos']:
    if want.lower() not in repo['name'].lower(): continue
    if repo.get('kind') == 'monorepo':
        if not app:
            print('ERR|bznav-web 은 앱을 지정해야 한다: bznav:care-web 또는 bznav:packages'); sys.exit(0)
        if app.startswith('packages'):
            # bznav-web 은 모노레포다. 앱으로 딴 워크트리 안에 packages/** 가 그대로 있으니
            # packages 전용 대상을 따로 둘 이유가 없다. 같은 base·같은 브랜치가 나온다.
            # 5개 앱 모두 base 가 origin/dev 이므로 어느 앱으로 따든 같은 브랜치가 나온다.
            apps = ', '.join(sorted((repo.get('apps') or {})))
            print(f"ERR|packages/* 는 따로 딸 필요가 없다. bznav-web 은 모노레포라 앱으로 딴 워크트리 안에 packages/** 가 그대로 있고, 5개 앱 모두 base 가 dev 라 어느 앱으로 따든 같다. 작업하는 앱으로 딴다 — bznav:<앱> ({apps})")
            sys.exit(0)
        entry = repo.get('apps', {}).get(app)
        if not entry:
            print(f"ERR|{app} 은 bznav-web 의 앱이 아니다: {', '.join(repo.get('apps', {}))}"); sys.exit(0)
        print(f"{repo['name']}|{entry['prBase']}|{app}"); sys.exit(0)
    print(f"{repo['name']}|{repo['prBase']}|-"); sys.exit(0)
print(f"ERR|'{want}' 에 맞는 레포가 hermes.config.json 에 없다")
PY
}

echo "브랜치: $BRANCH"
[ $IN_PLACE -eq 1 ] && echo "모드: 메인 체크아웃에서 분기 (--in-place)" || echo "모드: 워크트리 ($WT_ROOT/<레포>/$SLUG)"
[ $DRY_RUN -eq 1 ] && echo "(DRY-RUN: 실제로 만들지 않음)"
echo ""

created=0; skipped=0
for target in "${TARGETS[@]}"; do
  line="$(resolve "$target")"
  if [[ "$line" == ERR\|* ]]; then
    echo "❌ $target — ${line#ERR|}"; skipped=$((skipped+1)); continue
  fi
  IFS='|' read -r repo base app <<< "$line"
  dir="$ROOT/repos/$repo"
  label="$repo"; [ "$app" != "-" ] && label="$repo ($app)"

  [ -d "$dir" ] || { echo "❌ $label — repos/$repo 링크 없음. scripts/setup.sh 먼저"; skipped=$((skipped+1)); continue; }

  # fetch 실패해도 로컬에 origin/<base> 가 있으면 진행하되 경고한다.
  # SSH 키가 없거나 오프라인일 때 작업 자체를 막을 이유는 없다. 다만 base 가
  # 낡았을 수 있다는 사실은 반드시 알린다.
  stale=""
  # 비대화형으로 — ssh 키 암호를 묻다 멈추지 않게. ssh 가 안 되면 https 로 재시도(sync·현황판과 같은 방식)
  fetch_quiet() { GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10" git -C "$dir" "$@" fetch origin "$base" --quiet 2>/dev/null; }
  if ! fetch_quiet && ! fetch_quiet -c url.https://github.com/.insteadOf=git@github.com:; then
    if git -C "$dir" rev-parse --verify --quiet "origin/$base" >/dev/null; then
      stale=" ⚠️ fetch 실패 — 로컬 origin/$base 로 분기했다. 최신이 아닐 수 있다"
    else
      echo "❌ $label — origin/$base 를 fetch 하지 못했고 로컬에도 없다 (네트워크·권한 확인)"
      skipped=$((skipped+1)); continue
    fi
  fi

  # 레포별 브랜치 이름 — 기본은 위에서 정한 이름. bznav-rn-app 은 feature/v<앱버전>/<티켓> 이 관례라
  # 티켓만 줬으면 base 의 app.config.js 에서 앱 버전(첫 version: "x.y.z")을 읽어 붙인다(슬래시가 있으면 준 이름 그대로)
  BRANCH="$BRANCH_GIVEN"; SLUG="$SLUG_GIVEN"
  if [ "$repo" = bznav-rn-app ] && [[ "$TICKET" != */* ]]; then
    app_version="$(git -C "$dir" show "origin/$base:app.config.js" 2>/dev/null | sed -nE 's/^[[:space:]]*version:[[:space:]]*"([0-9][0-9.]*)".*/\1/p' | head -1)"
    if [ -n "$app_version" ]; then
      BRANCH="feature/v$app_version/$TICKET"; SLUG="$(printf '%s' "$BRANCH" | tr '/' '-')"
      echo "   $label — 레포 관례로 브랜치 이름: $BRANCH (앱 버전은 origin/$base app.config.js)"
    else
      echo "   ⚠️ $label — app.config.js 에서 앱 버전을 못 읽어 $BRANCH 로 딴다. 관례는 feature/v<앱버전>/<티켓> — 전체 이름을 주면 그대로 쓴다"
    fi
  fi

  # 이미 있는 브랜치 — 로컬 또는 원격(origin). 기본은 어디에 어떤 상태로 있는지 알려 주고 멈춘다.
  # 이어 쓰려면 --reuse (사용자에게 "그대로 쓸까요?" 를 물은 뒤)
  local_ref=0; remote_ref=0
  git -C "$dir" show-ref --verify --quiet "refs/heads/$BRANCH" && local_ref=1
  if GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10" git -C "$dir" ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1 \
    || GIT_TERMINAL_PROMPT=0 git -C "$dir" -c url.https://github.com/.insteadOf=git@github.com: ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    remote_ref=1
  fi
  if [ $local_ref = 1 ] || [ $remote_ref = 1 ]; then
    where="$(git -C "$dir" worktree list --porcelain 2>/dev/null | awk -v b="refs/heads/$BRANCH" '/^worktree /{w=$2} $0=="branch "b{print w}')"
    main_dir="$(cd "$dir" && pwd -P)"
    if [ $REUSE = 0 ]; then
      state="로컬 $([ $local_ref = 1 ] && echo 있음 || echo 없음) · 원격 $([ $remote_ref = 1 ] && echo 있음 || echo 없음)"
      [ $local_ref = 1 ] && state="$state · 마지막 커밋 $(git -C "$dir" log -1 --format='%h %ad %s' --date=short "$BRANCH" 2>/dev/null | cut -c1-60)"
      echo "⚠️  $label — 브랜치 $BRANCH 가 이미 있다 ($state)${where:+ · 체크아웃: $where}"
      echo "        그대로 이어 쓰려면 --reuse 를 붙여 다시 실행한다. 새로 따려면 다른 이름을 쓴다"
      skipped=$((skipped+1)); continue
    fi
    # --reuse
    if [ -n "$where" ] && [ "$(cd "$where" && pwd -P)" = "$main_dir" ]; then
      echo "⚠️  $label — $BRANCH 는 메인 체크아웃(repos/$repo)에 올라가 있어 워크트리로 이어 쓸 수 없다. 메인 체크아웃에서 할지 다른 이름으로 딸지 정한다"
      skipped=$((skipped+1)); continue
    fi
    if [ -n "$where" ]; then
      echo "♻️  $label — 이어서: 이미 있는 워크트리를 그대로 쓴다"
      echo "        워크트리: $where"
      created=$((created+1)); continue
    fi
    wt="$WT_ROOT/$repo/$SLUG"
    [ -e "$wt" ] && { echo "⏭  $label — 워크트리 경로가 이미 있다: $wt"; skipped=$((skipped+1)); continue; }
    [ $DRY_RUN = 1 ] && { echo "[DRY] $label — 이어서: $BRANCH ($([ $local_ref = 1 ] && echo 로컬 || echo 원격 추적))"; echo "        워크트리: $wt"; created=$((created+1)); continue; }
    mkdir -p "$(dirname "$wt")"
    if [ $local_ref = 1 ]; then
      ok="$(git -C "$dir" worktree add "$wt" "$BRANCH" >/dev/null 2>&1 && echo 1)"
    else
      GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10" git -C "$dir" fetch --quiet origin "$BRANCH" 2>/dev/null \
        || GIT_TERMINAL_PROMPT=0 git -C "$dir" -c url.https://github.com/.insteadOf=git@github.com: fetch --quiet origin "$BRANCH" 2>/dev/null
      ok="$(git -C "$dir" worktree add --track -b "$BRANCH" "$wt" "origin/$BRANCH" >/dev/null 2>&1 && echo 1)"
    fi
    if [ "$ok" = 1 ]; then
      echo "♻️  $label — 이어서: $BRANCH ($([ $local_ref = 1 ] && echo 로컬 브랜치 || echo 원격 추적)) 로 워크트리를 만들었다"
      echo "        워크트리: $wt"
      created=$((created+1))
    else
      echo "❌ $label — 이어 쓸 워크트리를 만들지 못했다 (git worktree add)"; skipped=$((skipped+1))
    fi
    continue
  fi

  head="$(git -C "$dir" rev-parse --short "origin/$base")"

  if [ $IN_PLACE -eq 1 ]; then
    dirty="$(git -C "$dir" status --porcelain 2>/dev/null)"
    if [ -n "$dirty" ]; then
      echo "⏭  $label — 미커밋 변경 $(printf '%s\n' "$dirty" | wc -l | tr -d ' ')건 (--in-place 라 건너뛴다. 워크트리로 하면 무관하다)"
      skipped=$((skipped+1)); continue
    fi
    cur="$(git -C "$dir" rev-parse --abbrev-ref HEAD)"
    if [ $DRY_RUN -eq 1 ]; then
      echo "[DRY] $label — origin/$base ($head) → $BRANCH (현재 $cur)${stale}"
    elif git -C "$dir" checkout -q -b "$BRANCH" "origin/$base" 2>/dev/null; then
      echo "✅ $label — origin/$base ($head) → $BRANCH  (이전 $cur)${stale}"
    else
      echo "❌ $label — 브랜치 생성 실패"; skipped=$((skipped+1)); continue
    fi
  else
    wt="$WT_ROOT/$repo/$SLUG"
    if [ -e "$wt" ]; then
      echo "⏭  $label — 워크트리 경로가 이미 있다: $wt"; skipped=$((skipped+1)); continue
    fi
    if [ $DRY_RUN -eq 1 ]; then
      echo "[DRY] $label — origin/$base ($head) → $BRANCH${stale}"
      echo "        워크트리: $wt"
    else
      mkdir -p "$(dirname "$wt")"
      if git -C "$dir" worktree add "$wt" -b "$BRANCH" "origin/$base" >/dev/null 2>&1; then
        echo "✅ $label — origin/$base ($head) → $BRANCH${stale}"
        echo "        워크트리: $wt"
        echo "        디스패치: scripts/delegate.sh <에이전트> --cwd $wt --plan <계획서>"
      else
        echo "❌ $label — 워크트리 생성 실패 (git worktree add)"; skipped=$((skipped+1)); continue
      fi
    fi
  fi
  created=$((created+1))
done

echo ""
echo "생성: ${created}, 건너뜀: ${skipped}"
if [ $skipped -gt 0 ]; then
  echo "건너뛴 레포는 사용자에게 보고하고 처리 방법을 확인한다. 그 레포에는 디스패치하지 않는다."
fi
[ $created -gt 0 ] && [ $IN_PLACE -eq 0 ] && [ $DRY_RUN -eq 0 ] && \
  echo "작업이 끝나면 정리: git -C repos/<레포> worktree remove <경로>  (wt-sync 로 메인 체크아웃에 반영한 뒤)"
exit 0
