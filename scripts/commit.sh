#!/usr/bin/env bash
# 에이전트 로컬 커밋 — 사용자가 pane 에서 "커밋해줘" 라고 했을 때만, 이 스크립트로만 커밋한다.
# push·PR 은 하지 않는다(헤르메스가 맡는다).
#
# 사용:
#   scripts/commit.sh --plan <plans/…md> --dir <워크트리> -m "<커밋 메시지>" [--verify "<검증 인자>"] -- <파일> [<파일>…]
#
# 옵션:
#   --verify "<인자>"          검증 스크립트 인자. bznav-web 은 바뀐 파일에서 앱을 찾는다(apps/<앱>/, packages/<pkg>/),
#                              zent-packages 는 패키지명을 준다
#   --allow-skip "이름|이름"    검증에서 건너뛰어도 되는 단계 — 사용자가 확인한 것만
#   --allow-main-checkout      메인 체크아웃(repos/<레포>)에 커밋 — 사용자가 명시했을 때만
#   --no-verify                검증 없이 — 사용자가 명시했을 때만. 계획서 기록에 남긴다
#
# 확인하는 것 (하나라도 걸리면 아무것도 바꾸지 않고 멈춘다)
#   - <워크트리> 가 등록된 git 워크트리이고 메인 체크아웃이 아니다(허용 옵션 제외)
#   - HEAD 가 브랜치에 붙어 있다(detached 아님) · 보호 브랜치(dev·main·master·stg·prd*·release/*·dev-*)가 아니다
#   - 원래 스테이징돼 있던 변경이 없다 — 남의 변경이 섞이지 않게
#   - 파일은 글자 그대로의 경로만(디렉터리·glob 금지), 워크트리 안이고, 실제로 바뀐 파일이다
# 그다음: 지정 파일만 스테이징 → 그 상태로 엄격 검증 → 검증 전후 스테이징·파일 내용·HEAD 가 같을 때만 커밋
#         → 계획서 "## Commits" 에 SHA·검증 결과를 한 줄 기록
# 실패하면 이 스크립트가 스테이징한 파일만 되돌린다(남의 스테이징은 애초에 없다).
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"

PLAN=""; DIR=""; MESSAGE=""; VERIFY_ARGS=""; ALLOW_SKIP=""; ALLOW_MAIN=0; NO_VERIFY=0; FILES=()
while [ $# -gt 0 ]; do
  case "$1" in
    --plan) PLAN="${2:-}"; shift 2 ;;
    --dir) DIR="${2:-}"; shift 2 ;;
    -m|--message) MESSAGE="${2:-}"; shift 2 ;;
    --verify) VERIFY_ARGS="${2:-}"; shift 2 ;;
    --allow-skip) ALLOW_SKIP="${2:-}"; shift 2 ;;
    --allow-main-checkout) ALLOW_MAIN=1; shift ;;
    --no-verify) NO_VERIFY=1; shift ;;
    --) shift; FILES=("$@"); break ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "모르는 옵션: $1" >&2; exit 2 ;;
  esac
done
fail() { echo "❌ 커밋하지 않았다: $*" >&2; exit 1; }

[ -n "$PLAN" ] && [ -n "$DIR" ] && [ -n "$MESSAGE" ] && [ ${#FILES[@]} -gt 0 ] \
  || { echo "사용: $0 --plan <plans/…md> --dir <워크트리> -m \"<메시지>\" [--verify …] -- <파일>…" >&2; exit 2; }
PLAN="${PLAN#"$HERMES_DIR"/}"
[ -f "$HERMES_DIR/$PLAN" ] && case "$PLAN" in plans/*.md) true ;; *) false ;; esac || fail "계획서가 없다: $PLAN"

# ── 1. 워크트리·브랜치 ──────────────────────────────────────────────────
TOP="$(git -C "$DIR" rev-parse --show-toplevel 2>/dev/null)" || fail "git 레포가 아니다: $DIR"
TOP="$(cd "$TOP" && pwd -P)"
MAIN="$(git -C "$TOP" worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
MAIN="$(cd "$MAIN" && pwd -P)"
REPO="$(basename "$MAIN")"
# 메인 체크아웃의 이름은 hermes.config 의 레포 이름과 다를 수 있다 — repos/ 링크로 찾는다
for link in "$HERMES_DIR"/repos/*; do [ "$(cd "$link" 2>/dev/null && pwd -P)" = "$MAIN" ] && REPO="$(basename "$link")"; done
if [ "$TOP" = "$MAIN" ] && [ $ALLOW_MAIN = 0 ]; then
  fail "메인 체크아웃(repos/$REPO)이다. 워크트리에서 커밋하거나, 사용자가 명시하면 --allow-main-checkout"
fi
git -C "$TOP" worktree list --porcelain | grep -qxF "worktree $TOP" || [ "$TOP" = "$MAIN" ] || fail "등록된 워크트리가 아니다: $TOP"
BRANCH="$(git -C "$TOP" symbolic-ref --short -q HEAD)" || fail "detached HEAD 다 — 브랜치를 만든 워크트리에서 커밋한다(/branch)"
case "$BRANCH" in
  dev|main|master|stg|prd|prd-*|release/*|dev-*) fail "보호 브랜치($BRANCH)에는 커밋하지 않는다" ;;
esac

# ── 2. 스테이징·파일 ────────────────────────────────────────────────────
git -C "$TOP" diff --cached --quiet || fail "원래 스테이징돼 있던 변경이 있다(남의 변경일 수 있다). git -C $TOP diff --cached --stat 으로 확인 — 이 스크립트는 건드리지 않는다"
for file in "${FILES[@]}"; do
  case "$file" in *'*'*|*'?'*|*'['*|/*|../*|*/../*) fail "파일은 워크트리 기준 글자 그대로의 상대 경로만: $file" ;; esac
  [ -d "$TOP/$file" ] && fail "디렉터리는 받지 않는다: $file"
  [ -n "$(git -C "$TOP" status --porcelain -- "$file")" ] || fail "바뀐 게 없는 파일이다: $file"
done
HEAD_BEFORE="$(git -C "$TOP" rev-parse HEAD)"

# 워크트리마다 한 번에 하나만
LOCK="$(git -C "$TOP" rev-parse --git-dir)/hermes-commit.lock"
mkdir "$LOCK" 2>/dev/null || fail "다른 커밋이 진행 중이다($LOCK)"
unstage() { git -C "$TOP" reset -q -- "${FILES[@]}" 2>/dev/null; }
cleanup() { rmdir "$LOCK" 2>/dev/null; }
trap cleanup EXIT

git -C "$TOP" add -- "${FILES[@]}" || { unstage; fail "git add 실패"; }
# 지정한 파일 말고는 스테이징에 없어야 한다
EXTRA="$(git -C "$TOP" diff --cached --name-only | grep -vxF -f <(printf '%s\n' "${FILES[@]}") || true)"
[ -z "$EXTRA" ] || { unstage; fail "지정하지 않은 파일이 스테이징됐다: $EXTRA"; }
TREE_BEFORE="$(git -C "$TOP" write-tree)"
STATE_BEFORE="$(git -C "$TOP" diff --cached | shasum | cut -c1-12)$(git -C "$TOP" diff -- "${FILES[@]}" | shasum | cut -c1-12)"

# ── 3. 엄격 검증 ────────────────────────────────────────────────────────
VERIFY_NOTE="검증 생략(사용자 지시)"
if [ $NO_VERIFY = 0 ]; then
  SCRIPT="$HERMES_DIR/scripts/verify/$REPO.sh"
  [ -x "$SCRIPT" ] || { unstage; fail "검증 스크립트가 없다: scripts/verify/$REPO.sh"; }
  if [ -z "$VERIFY_ARGS" ] && [ "$REPO" = bznav-web ]; then
    # 바뀐 파일에서 앱·패키지를 찾는다
    VERIFY_ARGS="$(printf '%s\n' "${FILES[@]}" | sed -nE 's#^apps/([^/]+)/.*#\1#p; s#^(packages/[^/]+)/.*#\1#p' | sort -u | tr '\n' ' ')"
  fi
  [ "$REPO" = zent-packages ] && [ -z "$VERIFY_ARGS" ] && { unstage; fail "zent-packages 는 --verify \"<패키지명>\" 이 필요하다"; }
  RESULTS=""
  # bznav-web 은 앱마다 한 번씩
  if [ "$REPO" = bznav-web ]; then TARGETS=($VERIFY_ARGS); else TARGETS=("$VERIFY_ARGS"); fi
  for target in "${TARGETS[@]}"; do
    echo "── 검증: scripts/verify/$REPO.sh $target (엄격 모드, 대상 $TOP)"
    # shellcheck disable=SC2086
    if ! HERMES_VERIFY_STRICT=1 HERMES_VERIFY_ALLOW_SKIP="$ALLOW_SKIP" HERMES_VERIFY_DIR="$TOP" "$SCRIPT" $target; then
      unstage; fail "검증을 통과하지 못했다(${target:-전체}). 위 표를 보고 고친 뒤 다시 — 건너뛴 단계를 허용하려면 사용자 확인 후 --allow-skip"
    fi
    RESULTS="$RESULTS${target:-전체} "
  done
  VERIFY_NOTE="엄격 검증 통과 — $RESULTS${ALLOW_SKIP:+(건너뜀 허용: $ALLOW_SKIP)}"
fi

# ── 4. 검증 전후가 같을 때만 커밋 ──────────────────────────────────────────
[ "$(git -C "$TOP" rev-parse HEAD)" = "$HEAD_BEFORE" ] || { unstage; fail "검증하는 동안 HEAD 가 바뀌었다"; }
[ "$(git -C "$TOP" write-tree)" = "$TREE_BEFORE" ] || { unstage; fail "검증하는 동안 스테이징이 바뀌었다"; }
STATE_AFTER="$(git -C "$TOP" diff --cached | shasum | cut -c1-12)$(git -C "$TOP" diff -- "${FILES[@]}" | shasum | cut -c1-12)"
[ "$STATE_AFTER" = "$STATE_BEFORE" ] || { unstage; fail "검증하는 동안 파일이 바뀌었다 — 검증한 내용과 커밋할 내용이 다르다"; }
git -C "$TOP" commit -q -m "$MESSAGE" || { unstage; fail "git commit 실패"; }
SHA="$(git -C "$TOP" rev-parse --short HEAD)"

# ── 5. 계획서에 기록 ────────────────────────────────────────────────────
python3 - "$HERMES_DIR/$PLAN" "$(date '+%Y-%m-%d %H:%M')" "$REPO" "$BRANCH" "$SHA" "$MESSAGE" "$VERIFY_NOTE" "$TOP" "$ALLOW_MAIN" <<'PYEOF'
import sys, pathlib, re
plan, stamp, repo, branch, sha, message, note, top, allow_main = sys.argv[1:10]
path = pathlib.Path(plan); text = path.read_text(encoding='utf-8')
line = f"- {stamp} · {repo} · 🌿 {branch} · `{sha}` — {message.splitlines()[0]} · {note}{' · 메인 체크아웃(사용자 허용)' if allow_main == '1' else ''} · push 안 함"
if re.search(r'^## Commits\s*$', text, re.M):
    text = re.sub(r'(^## Commits\s*\n(?:.*\n)*?)(?=^## |\Z)', lambda m: m.group(1).rstrip('\n') + '\n' + line + '\n\n', text, count=1, flags=re.M)
else:
    text = text.rstrip('\n') + '\n\n## Commits\n' + line + '\n'
path.write_text(text, encoding='utf-8')
PYEOF
[ $? = 0 ] || echo "⚠️ 커밋은 됐지만 계획서 기록에 실패했다 — 다시 커밋하지 말고 계획서 ## Commits 에 손으로 적는다: $SHA" >&2

echo "✅ 커밋했다: $SHA ($REPO · $BRANCH) — $VERIFY_NOTE"
echo "   push·PR 은 하지 않았다. 필요하면 헤르메스에게 말한다"
