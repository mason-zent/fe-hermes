#!/usr/bin/env bash
# reviewer 결론을 계획서에 한 줄 남긴다 — reviewer 가 리뷰를 끝낼 때 부른다(코드는 건드리지 않는다).
# ship.sh 는 이 줄의 tree(리뷰한 파일 내용)와 커밋된 내용(HEAD^{tree})이 같은지 본다 — 리뷰 → 커밋 순서여도 된다.
#
# 사용: scripts/review-result.sh --plan <plans/…md> --dir <리뷰한 워크트리> --verdict 승인|수정필요 [--note "<한 줄>"]
# 기록: "- Review result: 승인 @<HEAD 짧은 SHA> · 🌿 <브랜치> · <날짜> · <메모>" 를 Checkpoint 의 "- Review:" 줄 아래에
#       (같은 브랜치 줄이 있으면 바꾸고, 다른 브랜치 줄은 남긴다 — 여러 레포 계획서)
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLAN=""; DIR=""; VERDICT=""; NOTE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --plan) PLAN="${2:-}"; shift 2 ;;
    --dir) DIR="${2:-}"; shift 2 ;;
    --verdict) VERDICT="${2:-}"; shift 2 ;;
    --note) NOTE="${2:-}"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "모르는 옵션: $1" >&2; exit 2 ;;
  esac
done
[ -n "$PLAN" ] && [ -n "$DIR" ] && [ -n "$VERDICT" ] || { echo "사용: $0 --plan <계획서> --dir <워크트리> --verdict 승인|수정필요 [--note …]" >&2; exit 2; }
case "$VERDICT" in 승인) ;; 수정필요|"수정 필요") VERDICT="수정 필요" ;; *) echo "verdict 는 승인 또는 수정필요" >&2; exit 2 ;; esac
PLAN="${PLAN#"$HERMES_DIR"/}"
[ -f "$HERMES_DIR/$PLAN" ] && case "$PLAN" in plans/*.md) true ;; *) false ;; esac || { echo "계획서가 없다: $PLAN" >&2; exit 1; }
SHA="$(git -C "$DIR" rev-parse --short HEAD 2>/dev/null)" || { echo "git 레포가 아니다: $DIR" >&2; exit 1; }
BRANCH="$(git -C "$DIR" symbolic-ref --short -q HEAD || echo detached)"
DIRTY="$(git -C "$DIR" status --porcelain --untracked-files=no | wc -l | tr -d ' ')"
# 리뷰한 파일 내용 — 커밋 안 된 변경·새 파일까지 포함한 워크트리 전체의 git tree. 임시 인덱스라 실제 스테이징은 건드리지 않는다
TMP_INDEX="$(mktemp -t hermes-review-index)"
cp "$(git -C "$DIR" rev-parse --path-format=absolute --git-path index)" "$TMP_INDEX" 2>/dev/null || true
TREE="$(GIT_INDEX_FILE="$TMP_INDEX" git -C "$DIR" add -A >/dev/null 2>&1 && GIT_INDEX_FILE="$TMP_INDEX" git -C "$DIR" write-tree)"
rm -f "$TMP_INDEX"
[ -n "$TREE" ] || { echo "리뷰한 내용(tree)을 계산하지 못했다: $DIR" >&2; exit 1; }
python3 - "$HERMES_DIR/$PLAN" "$VERDICT" "$SHA" "$(date '+%Y-%m-%d %H:%M')" "$NOTE" "$DIRTY" "$BRANCH" "$TREE" <<'PYEOF'
import re, sys, pathlib
plan, verdict, sha, stamp, note, dirty, branch, tree = sys.argv[1:9]
path = pathlib.Path(plan); text = path.read_text(encoding='utf-8')
extra = f' · 커밋 전 변경 {dirty}개 포함' if dirty != '0' else ''
line = f"- Review result: {verdict} @{sha} · tree {tree[:12]} · 🌿 {branch} · {stamp}{extra}{' · ' + note if note else ''}"
# 브랜치(= 레포 작업)마다 한 줄 — 여러 레포 계획서에서 서로 덮어쓰지 않게
same = re.compile(rf'^- Review result:.*🌿 {re.escape(branch)} .*$', re.M)
if same.search(text):
    text = same.sub(lambda m: line, text, count=1)
elif re.search(r'^- Review result:.*$', text, re.M):
    last = list(re.finditer(r'^- Review result:.*$', text, re.M))[-1]
    text = text[:last.end()] + '\n' + line + text[last.end():]
else:
    anchor = re.search(r'^- (Review|Work ref):.*$', text, re.M)
    text = text[:anchor.end()] + '\n' + line + text[anchor.end():] if anchor else text.rstrip('\n') + '\n' + line + '\n'
path.write_text(text, encoding='utf-8')
html = path.with_suffix('.html')
if html.exists():
    page = html.read_text(encoding='utf-8')
    block = re.compile(r'(<script id="plan-md" type="text/markdown">)(.*?)(</script>)', re.S)
    if block.search(page):
        body = re.sub(r'</(script)', r'<\\/\1', text, flags=re.I)
        html.write_text(block.sub(lambda m: m.group(1) + '\n' + body + m.group(3), page, count=1), encoding='utf-8')
print(line)
PYEOF
