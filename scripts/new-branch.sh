#!/usr/bin/env bash
# 작업 브랜치를 만들고 시작한다. 레포마다 PR base 가 다르므로 hermes.config.json 의 prBase 를 쓴다.
#
# 왜 필요한가: 로컬 작업 트리는 브랜치가 제각각이다. 확인 없이 작업을 시작하면
# 남의 작업 브랜치 위에 얹히거나, 미커밋 변경과 섞인다(실제로 겪음).
#
# 사용:
#   scripts/new-branch.sh REF-3820 refund hub              # 두 레포에 feature/REF-3820
#   scripts/new-branch.sh REF-3820 bznav:care-web          # bznav 는 앱을 지정해 base 를 고른다
#   scripts/new-branch.sh fix/qa-로그인 care                # 슬래시가 있으면 이름 그대로 사용
#   scripts/new-branch.sh REF-3820 refund --dry-run
#
# 대상 이름은 레포 이름 일부로 매칭한다 (refund=client-brics-refund, bznav:<앱>, packages=zent-packages).
# bznav-web 의 packages/* 작업은 `bznav:packages`.
#
# 안전장치 — 하나라도 걸리면 그 레포는 **건너뛰고 보고**한다:
#   - 미커밋 변경이 있다 (남의 작업일 수 있다. stash 하지 않는다)
#   - 같은 이름의 브랜치가 이미 있다
#   - base 브랜치를 fetch 하지 못했다
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$ROOT/hermes.config.json"
DRY_RUN=0
TICKET=""
TARGETS=()

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) if [ -z "$TICKET" ]; then TICKET="$arg"; else TARGETS+=("$arg"); fi ;;
  esac
done

[ -n "$TICKET" ] && [ ${#TARGETS[@]} -gt 0 ] || { echo "사용: $0 <티켓|브랜치명> <대상...> [--dry-run]"; exit 2; }

# 슬래시가 없으면 feature/ 를 붙인다 (전 레포 공통 관례)
case "$TICKET" in
  */*) BRANCH="$TICKET" ;;
  *)   BRANCH="feature/$TICKET" ;;
esac

# 대상 이름 → 레포 경로·base 를 config 에서 해석한다
resolve() {
  python3 - "$CONFIG" "$1" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))
want = sys.argv[2]
app = None
if ':' in want:
    want, app = want.split(':', 1)
for repo in cfg['repos']:
    if want.lower() not in repo['name'].lower():
        continue
    if repo.get('kind') == 'monorepo':
        if not app:
            print('ERR|bznav-web 은 앱을 지정해야 한다: bznav:care-web 또는 bznav:packages'); sys.exit(0)
        if app == 'packages':
            print(f"{repo['name']}|{repo['packagesPrBase']}|packages"); sys.exit(0)
        entry = repo.get('apps', {}).get(app)
        if not entry:
            print(f"ERR|{app} 은 bznav-web 의 앱이 아니다: {', '.join(repo.get('apps', {}))}"); sys.exit(0)
        print(f"{repo['name']}|{entry['prBase']}|{app}"); sys.exit(0)
    print(f"{repo['name']}|{repo['prBase']}|-"); sys.exit(0)
print(f"ERR|'{want}' 에 맞는 레포가 hermes.config.json 에 없다")
PY
}

echo "브랜치: $BRANCH"
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

  if [ ! -d "$dir" ]; then
    echo "❌ $label — repos/$repo 링크가 없다. scripts/setup.sh 를 먼저 돌려라"; skipped=$((skipped+1)); continue
  fi

  dirty="$(git -C "$dir" status --porcelain 2>/dev/null)"
  if [ -n "$dirty" ]; then
    echo "⏭  $label — 미커밋 변경 $(printf '%s\n' "$dirty" | wc -l | tr -d ' ')건이 있어 건너뛴다 (남의 작업일 수 있어 stash 하지 않는다)"
    printf '%s\n' "$dirty" | head -5 | sed 's/^/      /'
    skipped=$((skipped+1)); continue
  fi

  if ! git -C "$dir" fetch origin "$base" --quiet 2>/dev/null; then
    echo "❌ $label — origin/$base 를 fetch 하지 못했다"; skipped=$((skipped+1)); continue
  fi

  if git -C "$dir" show-ref --verify --quiet "refs/heads/$BRANCH"; then
    echo "⏭  $label — 브랜치 $BRANCH 가 이미 있다"; skipped=$((skipped+1)); continue
  fi

  cur="$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  head="$(git -C "$dir" rev-parse --short "origin/$base" 2>/dev/null)"
  if [ $DRY_RUN -eq 1 ]; then
    echo "[DRY] $label — origin/$base ($head) 에서 $BRANCH 생성 (현재 $cur)"
  else
    if git -C "$dir" checkout -q -b "$BRANCH" "origin/$base" 2>/dev/null; then
      echo "✅ $label — origin/$base ($head) → $BRANCH  (이전 브랜치 $cur)"
    else
      echo "❌ $label — 브랜치 생성 실패"; skipped=$((skipped+1)); continue
    fi
  fi
  created=$((created+1))
done

echo ""
echo "생성: ${created}, 건너뜀: ${skipped}"
[ $skipped -gt 0 ] && echo "건너뛴 레포는 사용자에게 보고하고 처리 방법을 확인한다."
exit 0
