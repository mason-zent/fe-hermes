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
#
# 대상은 레포 이름 일부로 매칭한다 (refund / hub / care / op / packages=zent-packages /
# bznav:<앱> / bznav:packages).
#
# 워크트리 위치: ~/orca/workspaces/<레포>/<브랜치 슬러그>  (기존 관례를 따른다)
# 정리: git -C repos/<레포> worktree remove <경로>
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$ROOT/hermes.config.json"
WT_ROOT="${HERMES_WORKTREE_ROOT:-$HOME/orca/workspaces}"
DRY_RUN=0; IN_PLACE=0
TICKET=""; TARGETS=()

for arg in "$@"; do
  case "$arg" in
    --dry-run)  DRY_RUN=1 ;;
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
            # 다만 PR base 가 앱 계열마다 다르므로(dev = care·plus / dev-ecs = brand·refund·sena)
            # 어느 계열에 낼지는 앱으로 표현한다.
            lines = {}
            for name, cfgapp in (repo.get('apps') or {}).items():
                lines.setdefault(cfgapp['prBase'], []).append(name)
            hint = ' / '.join(f"{base}: {', '.join(sorted(apps))}" for base, apps in sorted(lines.items()))
            print(f"ERR|packages/* 는 따로 딸 필요가 없다. bznav-web 은 모노레포라 앱으로 딴 워크트리 안에 packages/** 가 그대로 있다. 어느 앱 계열에 낼지만 정해 bznav:<앱> 으로 딴다 — 계열 {hint}")
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
  if ! git -C "$dir" fetch origin "$base" --quiet 2>/dev/null; then
    if git -C "$dir" rev-parse --verify --quiet "origin/$base" >/dev/null; then
      stale=" ⚠️ fetch 실패 — 로컬 origin/$base 로 분기했다. 최신이 아닐 수 있다"
    else
      echo "❌ $label — origin/$base 를 fetch 하지 못했고 로컬에도 없다 (네트워크·권한 확인)"
      skipped=$((skipped+1)); continue
    fi
  fi

  # 이미 있는 브랜치면 어디에 체크아웃돼 있는지 알려준다
  if git -C "$dir" show-ref --verify --quiet "refs/heads/$BRANCH"; then
    where="$(git -C "$dir" worktree list --porcelain 2>/dev/null | awk -v b="refs/heads/$BRANCH" '/^worktree /{w=$2} $0=="branch "b{print w}')"
    echo "⏭  $label — 브랜치 $BRANCH 가 이미 있다${where:+ (체크아웃: $where)}"
    skipped=$((skipped+1)); continue
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
        echo "        디스패치: scripts/delegate.sh <에이전트> --cwd $wt"
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
