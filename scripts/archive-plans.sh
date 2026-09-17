#!/usr/bin/env bash
# 완료된 plans 파일을 archive/로 이동.
#
# 이동 조건 — 아래를 모두 만족해야 한다:
#   1. 본문 Checkpoint 의 `Status:` 가 **done** (명시적 완료)
#   2. 파일명 날짜(YYYYMMDD-)가 N일 이상 지났다
#   3. 최근 M일 git log 에 plan 파일명 키워드가 없다 (진행 중 작업 보호)
#
# Status 가 done 이 아니거나, 아예 없거나, 읽을 수 없으면 **보류한다.**
# 오래되었다는 이유만으로 진행 중(in_progress)·차단(blocked) 계획서를 옮기지 않는다.
# 상태가 없는 옛 문서도 보수적으로 보류한다 (사람이 판단할 몫).
#
# .md 를 옮길 때 같은 이름의 .html 도 함께 옮긴다. 계획서는 md+html 한 쌍이다.
# plans/feature/, plans/bugfix/, plans/refactor/ 구조를 그대로 archive/ 하위에 보존.
#
# 사용법:
#   scripts/archive-plans.sh                # 30일 이상 된 plan 이동
#   scripts/archive-plans.sh --dry-run      # 미리 보기만
#   scripts/archive-plans.sh --days 14      # 기준일 변경

set -euo pipefail

DAYS_OLD=30
RECENT_DAYS=7
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --days) DAYS_OLD="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *) echo "알 수 없는 인자: $1" >&2; exit 1 ;;
  esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLANS_DIR="$ROOT/plans"
ARCHIVE_DIR="$PLANS_DIR/archive"

if [[ ! -d "$PLANS_DIR" ]]; then
  echo "plans/ 디렉토리 없음: $PLANS_DIR" >&2
  exit 1
fi

if date -v-1d +%Y%m%d >/dev/null 2>&1; then
  CUTOFF=$(date -v-${DAYS_OLD}d +%Y%m%d)
else
  CUTOFF=$(date -d "${DAYS_OLD} days ago" +%Y%m%d)
fi

echo "기준: ${DAYS_OLD}일 이전 (cutoff=${CUTOFF}), git 보호 기간: 최근 ${RECENT_DAYS}일"
[[ $DRY_RUN -eq 1 ]] && echo "(DRY-RUN: 실제 이동 안 함)"
echo ""

archived=0
held=0
skipped=0
held_status=0

# 계획서 본문에서 Checkpoint 의 Status 값을 읽는다. 없으면 빈 문자열.
read_status() {
  sed -n 's/^[[:space:]]*-[[:space:]]*Status:[[:space:]]*\([A-Za-z_]*\).*/\1/p' "$1" 2>/dev/null | head -1
}

while IFS= read -r file; do
  basename=$(basename "$file")
  date_prefix="${basename:0:8}"

  if [[ ! "$date_prefix" =~ ^[0-9]{8}$ ]]; then
    skipped=$((skipped+1))
    continue
  fi

  # 조건 1: Status 가 done 인 것만 이동. 나머지(없음·planned·in_progress·blocked·ready_for_review)는 보류
  status="$(read_status "$file")"
  if [[ "$status" != "done" ]]; then
    echo "보류 (Status=${status:-없음}): $basename"
    held_status=$((held_status+1))
    continue
  fi

  if [[ "$date_prefix" -ge "$CUTOFF" ]]; then
    continue
  fi

  keyword="${basename%.md}"
  if git -C "$ROOT" log --since="${RECENT_DAYS} days ago" --all --format="%s%n%b" 2>/dev/null | grep -q -F "$keyword"; then
    echo "보류 (최근 커밋 언급): $basename"
    held=$((held+1))
    continue
  fi

  rel="${file#$PLANS_DIR/}"
  subdir=$(dirname "$rel")
  if [[ "$subdir" == "." ]]; then
    target="$ARCHIVE_DIR"
  else
    target="$ARCHIVE_DIR/$subdir"
  fi

  html="${file%.md}.html"   # 쌍인 html 도 함께 옮긴다
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[DRY] 이동: $rel → archive/${subdir#.}"
    [[ -f "$html" ]] && echo "[DRY] 이동: ${html#$PLANS_DIR/} → archive/${subdir#.}"
  else
    mkdir -p "$target"
    if [[ -e "$target/$basename" ]]; then
      echo "건너뜀 (목적지에 같은 이름 있음): $rel" >&2
      held=$((held+1))
      continue
    fi
    mv "$file" "$target/"
    echo "이동 완료: $rel → archive/${subdir#.}"
    if [[ -f "$html" ]]; then
      mv "$html" "$target/"
      echo "이동 완료: ${html#$PLANS_DIR/} → archive/${subdir#.}"
    fi
  fi
  archived=$((archived+1))
done < <(find "$PLANS_DIR" -type f -name "*.md" -not -path "*/archive/*" 2>/dev/null)

echo ""
echo "이동: ${archived}, 보류(Status): ${held_status}, 보류(기타): ${held}, 형식외 skip: ${skipped}"
