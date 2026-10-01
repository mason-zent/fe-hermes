#!/usr/bin/env bash
# 에이전트 로컬 커밋 — 사용자가 pane 에서 "커밋해줘" 라고 했을 때만, 이 스크립트로만 커밋한다.
# push·PR 은 하지 않는다 — 사용자가 "PR 올려줘" 라고 하면 scripts/ship.sh 로.
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
#   - HEAD 가 브랜치에 붙어 있다(detached 아님) · 보호 브랜치(dev·main·master·stg·frz·prd*·release/*·dev-*)가 아니다
#   - 원래 스테이징돼 있던 변경이 없다 — 남의 변경이 섞이지 않게
#   - 파일은 글자 그대로의 경로만(디렉터리·glob 금지), 워크트리 안이고, 실제로 바뀐 파일이다
# 그다음: 지정 파일만 스테이징 → 그 상태로 엄격 검증 → 검증 전후 스테이징·파일 내용·HEAD 가 같을 때만 커밋
#         → 계획서 "## Commits" 에 SHA·검증 결과를 한 줄 기록
# 실패하면 이 스크립트가 스테이징한 파일만 되돌린다(남의 스테이징은 애초에 없다).
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# 이 스크립트의 git 호출에만(export 하지 않는다 — 검증 스크립트·lint-staged 가 :(glob) 으로 설정을 찾다 못 찾는다)
#   GIT_LITERAL_PATHSPECS=1  경로는 글자 그대로 — Next 동적 라우트(app/[id]/page.tsx)의 [ ] 를 패턴으로 읽지 않게
#   core.quotePath=false     한글 경로가 "\355…" 로 인용되지 않게
git() { GIT_LITERAL_PATHSPECS=1 command git -c core.quotePath=false "$@"; }
# 파일 목록은 NUL 구분(-z)으로 받아 줄로 바꾼다 — " \ 공백이 든 이름도 인용되지 않은 그대로 (줄바꿈이 든 이름은 다루지 않는다)
untracked_names() { git -C "$TOP" ls-files -z --others --exclude-standard | tr '\0' '\n'; }

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
MAIN="$(git -C "$TOP" worktree list --porcelain | awk '/^worktree /{sub(/^worktree /, ""); print; exit}')"
MAIN="$(cd "$MAIN" && pwd -P)"
REPO="$(basename "$MAIN")"
# 메인 체크아웃의 이름은 hermes.config 의 레포 이름과 다를 수 있다 — repos/ 링크로 찾는다
for link in "$HERMES_DIR"/repos/*; do [ "$(cd "$link" 2>/dev/null && pwd -P)" = "$MAIN" ] && REPO="$(basename "$link")"; done
if [ "$TOP" = "$MAIN" ] && [ $ALLOW_MAIN = 0 ]; then
  fail "메인 체크아웃(repos/$REPO)이다. 워크트리에서 커밋하거나, 사용자가 명시하면 --allow-main-checkout"
fi
git -C "$TOP" worktree list --porcelain | grep -qxF "worktree $TOP" || [ "$TOP" = "$MAIN" ] || fail "등록된 워크트리가 아니다: $TOP"
BRANCH="$(git -C "$TOP" symbolic-ref --short -q HEAD)" || fail "detached HEAD 다 — 브랜치를 만든 워크트리에서 커밋한다(scripts/new-branch.sh)"
case "$BRANCH" in
  dev|main|master|stg|frz|prd|prd-*|release/*|dev-*) fail "보호 브랜치($BRANCH)에는 커밋하지 않는다" ;;
esac

# ── 2. 스테이징·파일 ────────────────────────────────────────────────────
git -C "$TOP" diff --cached --quiet || fail "원래 스테이징돼 있던 변경이 있다(남의 변경일 수 있다). git -C $TOP diff --cached --stat 으로 확인 — 이 스크립트는 건드리지 않는다"
for file in "${FILES[@]}"; do
  # 글자 그대로 쓰므로 [ ] 는 받는다(동적 라우트). * ? 는 셸 glob 이 덜 펼쳐진 것일 수 있어 거부
  case "$file" in *'*'*|*'?'*|/*|../*|*/../*) fail "파일은 워크트리 기준 글자 그대로의 상대 경로만: $file" ;; esac
  [ -d "$TOP/$file" ] && fail "디렉터리는 받지 않는다: $file"
  [ -n "$(git -C "$TOP" status --porcelain -- "$file")" ] || fail "바뀐 게 없는 파일이다: $file"
done
HEAD_BEFORE="$(git -C "$TOP" rev-parse HEAD)"

# 워크트리마다 한 번에 하나만
LOCK="$(git -C "$TOP" rev-parse --git-dir)/hermes-commit.lock"
mkdir "$LOCK" 2>/dev/null || fail "다른 커밋이 진행 중이다($LOCK)"
STAGED=0; COMMITTED=0
unstage() { git -C "$TOP" reset -q -- "${FILES[@]}" 2>/dev/null; STAGED=0; }
# 어떤 이유로 끝나든(실패·Ctrl+C·TERM·예상 못 한 오류) 커밋 전이면 이 스크립트가 올린 스테이징을 되돌린다
cleanup() { [ $STAGED = 1 ] && [ $COMMITTED = 0 ] && unstage; rmdir "$LOCK" 2>/dev/null; rm -f "${UNTRACKED_LIST:-}" 2>/dev/null; }
trap cleanup EXIT
trap 'echo "❌ 중단됐다 — 스테이징을 되돌렸다" >&2; exit 130' INT TERM

STAGED=1
git -C "$TOP" add -- "${FILES[@]}" || { unstage; fail "git add 실패"; }
# 지정한 파일 말고는 스테이징에 없어야 한다
EXTRA="$(git -C "$TOP" diff --cached --name-only | grep -vxF -f <(printf '%s\n' "${FILES[@]}") || true)"
[ -z "$EXTRA" ] || { unstage; fail "지정하지 않은 파일이 스테이징됐다: $EXTRA"; }
TREE_BEFORE="$(git -C "$TOP" write-tree)"
# 검증은 작업 트리 전체에서 돈다 — 전후 비교도 지정 파일만이 아니라 트리 전체를 본다
#   스테이징 diff · 추적 파일 diff · 추적 파일 상태 · **검증 전부터 있던** 미추적 파일의 내용
# 검증 중 **새로** 생긴 미추적 파일(storybook-static 같은 gitignore 안 된 산출물)은 커밋에 안 들어가므로 거부하지 않고 알리고 기록만 한다
UNTRACKED_LIST="$(mktemp -t hermes-commit-untracked)"
untracked_names > "$UNTRACKED_LIST"
# 파일마다 git 을 부르면 미추적 파일이 수천 개일 때 몇 분씩 걸린다 — 존재 확인은 셸 내장, 해시는 git 한 번(--stdin-paths)
untracked_state() {
  {
    while IFS= read -r path; do [ -f "$TOP/$path" ] && printf '%s\n' "$path"; done < "$UNTRACKED_LIST" | git -C "$TOP" hash-object --stdin-paths
    while IFS= read -r path; do [ -f "$TOP/$path" ] || printf 'gone %s\n' "$path"; done < "$UNTRACKED_LIST"
  } | shasum | cut -c1-12
}
tree_state() { printf '%s|%s|%s|%s' "$(git -C "$TOP" diff --cached | shasum | cut -c1-12)" "$(git -C "$TOP" diff | shasum | cut -c1-12)" "$(git -C "$TOP" status --porcelain --untracked-files=no | shasum | cut -c1-12)" "$(untracked_state)"; }
STATE_BEFORE="$(tree_state)"
# 지정 밖 미커밋 변경 — 검증 결과에 섞였을 수 있다. 막지는 않고 알리고 기록한다(docs/knowledge/common/git.md)
OUTSIDE="$(git -C "$TOP" status --porcelain -z --untracked-files=all | tr '\0' '\n' | cut -c4- | grep -vxF -f <(printf '%s\n' "${FILES[@]}") | wc -l | tr -d ' ')"
[ "$OUTSIDE" = 0 ] || echo "⚠️ 지정하지 않은 미커밋 변경이 ${OUTSIDE}개 있다 — 검증은 작업 트리 전체에서 돌아 그 변경이 결과에 섞였을 수 있다(커밋에는 안 들어간다)" >&2

# ── 3. 엄격 검증 ────────────────────────────────────────────────────────
VERIFY_NOTE="검증 생략(사용자 지시)"; RESULTS=""
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
  # shellcheck disable=SC2206
  if [ "$REPO" = bznav-web ]; then TARGETS=($VERIFY_ARGS); else TARGETS=("$VERIFY_ARGS"); fi
  # bznav-web 루트 파일만 넘기면 앱을 못 찾아 대상이 빈다 — 검증 0회로 "통과"가 되지 않게 멈춘다(bash 3.2 는 빈 배열에서 죽기도 한다)
  [ ${#TARGETS[@]} -gt 0 ] || { unstage; fail "검증할 앱을 파일에서 찾지 못했다 — --verify \"<앱|packages/<pkg>>\" 를 준다"; }
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
[ "$OUTSIDE" = 0 ] || VERIFY_NOTE="$VERIFY_NOTE (지정 밖 미커밋 변경 ${OUTSIDE}개가 있는 트리)"

# ── 4. 검증 전후가 같을 때만 커밋 ──────────────────────────────────────────
[ "$(git -C "$TOP" rev-parse HEAD)" = "$HEAD_BEFORE" ] || { unstage; fail "검증하는 동안 HEAD 가 바뀌었다"; }
[ "$(git -C "$TOP" write-tree)" = "$TREE_BEFORE" ] || { unstage; fail "검증하는 동안 스테이징이 바뀌었다"; }
[ "$(tree_state)" = "$STATE_BEFORE" ] || { unstage; fail "검증하는 동안 작업 트리가 바뀌었다(추적 파일·지정 파일·원래 있던 미추적 파일) — 검증한 내용과 커밋할 내용이 다를 수 있다"; }
NEW_UNTRACKED="$(untracked_names | grep -vxF -f "$UNTRACKED_LIST" | wc -l | tr -d ' ')"
if [ "$NEW_UNTRACKED" != 0 ]; then
  echo "⚠️ 검증 중 새 미추적 파일 ${NEW_UNTRACKED}개가 생겼다(빌드 산출물 등, gitignore 안 됨) — 커밋에는 안 들어간다" >&2
  VERIFY_NOTE="$VERIFY_NOTE (검증 중 새 미추적 파일 ${NEW_UNTRACKED}개)"
fi
git -C "$TOP" commit -q -m "$MESSAGE" || { unstage; fail "git commit 실패"; }
COMMITTED=1
SHA="$(git -C "$TOP" rev-parse --short HEAD)"

# ── 5. 계획서에 기록 ────────────────────────────────────────────────────
python3 - "$HERMES_DIR/$PLAN" "$(date '+%Y-%m-%d %H:%M')" "$REPO" "$BRANCH" "$SHA" "$MESSAGE" "$VERIFY_NOTE" "$TOP" "$ALLOW_MAIN" <<'PYEOF'
import sys, pathlib, re
plan, stamp, repo, branch, sha, message, note, top, allow_main = sys.argv[1:10]
path = pathlib.Path(plan); text = path.read_text(encoding='utf-8')
line = f"- {stamp} · {repo} · 🌿 {branch} · `{sha}` — {message.splitlines()[0]} · {note}{' · 메인 체크아웃(사용자 허용)' if allow_main == '1' else ''} · push 안 함"
# 끝 개행이 없으면 마지막 줄이 절 끝 매칭에서 빠진다 — 먼저 보정
if not text.endswith('\n'):
    text += '\n'
# 경량 템플릿은 "## Commits", 정식 템플릿은 Checkpoint 아래 "### Commits"
head = re.search(r'^(#{2,3}) Commits\s*$', text, re.M)
if head:
    level = len(head.group(1))
    # 같은 수준 이상의 다음 제목(또는 끝)까지가 이 절
    pattern = r'(^#{%d} Commits\s*\n(?:.*\n)*?)(?=^#{1,%d} |\Z)' % (level, level)
    updated = re.sub(pattern, lambda m: m.group(1).rstrip('\n') + '\n' + line + '\n\n', text, count=1, flags=re.M)
else:
    updated = text.rstrip('\n') + '\n\n## Commits\n' + line + '\n'
if updated == text or line not in updated:
    sys.exit(1)   # 기록이 안 됐다 — 아래에서 경고
path.write_text(updated, encoding='utf-8')
# 정식 계획서는 같은 이름의 .html(결정 콘솔)이 md 본문을 <script id="plan-md"> 에 그대로 담는다 — 있으면 같이 맞춘다(본문 사본이 낡지 않게)
html = path.with_suffix('.html')
if html.exists():
    page = html.read_text(encoding='utf-8')
    block = re.compile(r'(<script id="plan-md" type="text/markdown">)(.*?)(</script>)', re.S)
    if block.search(page):
        body = re.sub(r'</(script)', r'<\\/\1', updated, flags=re.I)   # 본문 안의 닫는 태그(대소문자·공백 변형 포함)가 블록을 끊지 않게
        html.write_text(block.sub(lambda m: m.group(1) + '\n' + body + m.group(3), page, count=1), encoding='utf-8')
PYEOF
[ $? = 0 ] || echo "⚠️ 커밋은 됐지만 계획서 기록에 실패했다 — 다시 커밋하지 말고 계획서 ## Commits 에 손으로 적는다: $SHA" >&2

echo "✅ 커밋했다: $SHA ($REPO · $BRANCH) — $VERIFY_NOTE"
echo "   push·PR 은 하지 않았다. 사용자가 \"PR 올려줘\" 라고 하면 scripts/ship.sh --plan $PLAN --dir $TOP 로 미리보기부터"
