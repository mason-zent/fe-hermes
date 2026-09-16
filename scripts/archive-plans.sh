#!/usr/bin/env bash
# 파일명 날짜(YYYYMMDD-)가 N일 이상 지난 plans 파일을 archive/로 이동.
# 최근 M일 git log에 plan 파일명 키워드가 등장하면 보류 (진행 중 작업 보호).
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

while IFS= read -r file; do
  basename=$(basename "$file")
  date_prefix="${basename:0:8}"

  if [[ ! "$date_prefix" =~ ^[0-9]{8}$ ]]; then
    skipped=$((skipped+1))
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

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[DRY] 이동: $rel → archive/${subdir#.}"
  else
    mkdir -p "$target"
    mv "$file" "$target/"
    echo "이동 완료: $rel → archive/${subdir#.}"
  fi
  archived=$((archived+1))
done < <(find "$PLANS_DIR" -type f -name "*.md" -not -path "*/archive/*" 2>/dev/null)

echo ""
echo "이동: ${archived}, 보류: ${held}, 형식외 skip: ${skipped}"
