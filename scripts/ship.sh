#!/usr/bin/env bash
# 에이전트 push·PR — 사용자가 pane 에서 "PR 올려줘" 라고 했을 때만, 이 스크립트로만 한다.
# 레포 하나짜리 작업만 받는다(여러 레포에 걸친 작업은 헤르메스가 순서를 정해 올린다).
#
# 사용 (두 번 부른다):
#   1) 미리보기 — 아무것도 보내지 않는다
#      scripts/ship.sh --plan <plans/…md> --dir <워크트리>
#      → 브랜치 · base 후보 · 올라갈 커밋 · 검증·리뷰 기록 · 제목 제안 · 본문 초안 파일 경로를 출력
#   2) 사용자가 미리보기를 보고 base·제목을 고른 뒤
#      scripts/ship.sh --plan <plans/…md> --dir <워크트리> --base <브랜치> [--base <브랜치2>] \
#        --title "<type(범위): 티켓 요약>" [--body-file <본문.md>] [--no-review-ok] --yes
#
# 옵션:
#   --base <브랜치>      PR 대상. 여러 번 주면 PR 을 각각 연다(bznav-rn-app 의 prd·dev 양쪽 관례)
#   --title "<제목>"     형식: type(범위): [티켓 ]요약 — 규칙은 docs/knowledge/common/git.md "PR 제목·본문"
#   --body-file <파일>   본문. 없으면 미리보기가 만든 초안을 쓴다. 필수 절(작업 내용·변경 사항·검증·확인 필요)이 있어야 한다
#   --no-review-ok       reviewer 승인 기록(- Review result: 승인 @<HEAD>)이 없어도 올린다 — 사용자가 확인했을 때만
#   --repo-agent <이름>  (헤르메스 전용) 여러 에이전트가 붙은 계획서에서 이 에이전트의 레포 몫만 올린다.
#                        FE 세션에서는 보호 훅이 이 옵션을 막는다 — 순서 조율은 헤르메스가 한다
#   --yes                실제로 보낸다. 없으면 미리보기만
#
# 확인하는 것 (하나라도 걸리면 아무것도 보내지 않는다)
#   - <워크트리> 가 등록된 워크트리이고 메인 체크아웃이 아니다 · 브랜치에 붙어 있다 · 보호 브랜치가 아니다
#   - 추적 파일의 미커밋 변경이 없다 (미추적 파일은 경고만)
#   - 계획서가 레포 하나짜리 작업이다 (Agent 줄·작업 배분표의 에이전트가 하나 — 헤르메스는 --repo-agent 로 그중 하나)
#   - HEAD 가 계획서 Commits 에 commit.sh 로 기록된 커밋이다 (검증 기록이 있는 커밋만 나간다)
#   - base 가 원격에 있고, base 에 없는 커밋이 하나 이상 있다
#   - 제목 형식 · 본문 필수 절 · 본문에 로컬 경로(plans/… · /Users/… · .worktrees/)·내부 주소·비밀값 흔적이 없다
#   - 본문은 미리보기가 만든 초안(또는 --body-file) 그대로 — --yes 때 초안을 다시 만들지 않는다(사용자가 본 그대로 나간다)
# 그다음: git push -u origin <브랜치> → base 마다 draft PR (이미 열린 PR 이 있으면 push 만 하고 링크를 알린다)
#         → 계획서 Commits 의 해당 줄 "push 안 함" 을 PR 링크로 바꾸고 Checkpoint 에 "- PR:" 줄을 남긴다
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
git() { command git -c core.quotePath=false "$@"; }

PLAN=""; DIR=""; TITLE=""; BODY_FILE=""; REVIEW_OK=0; YES=0; BASES=(); REPO_AGENT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --plan) PLAN="${2:-}"; shift 2 ;;
    --dir) DIR="${2:-}"; shift 2 ;;
    --base) BASES+=("${2:-}"); shift 2 ;;
    --title) TITLE="${2:-}"; shift 2 ;;
    --body-file) BODY_FILE="${2:-}"; shift 2 ;;
    --no-review-ok) REVIEW_OK=1; shift ;;
    --yes) YES=1; shift ;;
    --repo-agent) REPO_AGENT="${2:-}"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "모르는 옵션: $1" >&2; exit 2 ;;
  esac
done
fail() { echo "❌ 보내지 않았다: $*" >&2; exit 1; }

[ -n "$PLAN" ] && [ -n "$DIR" ] || { echo "사용: $0 --plan <plans/…md> --dir <워크트리> [--base … --title … --yes]" >&2; exit 2; }
PLAN="${PLAN#"$HERMES_DIR"/}"
[ -f "$HERMES_DIR/$PLAN" ] && case "$PLAN" in plans/*.md) true ;; *) false ;; esac || fail "계획서가 없다: $PLAN"
command -v gh >/dev/null 2>&1 || fail "gh CLI 가 없다"

# ── 1. 워크트리·브랜치 (commit.sh 와 같은 규칙) ─────────────────────────────
TOP="$(git -C "$DIR" rev-parse --show-toplevel 2>/dev/null)" || fail "git 레포가 아니다: $DIR"
TOP="$(cd "$TOP" && pwd -P)"
MAIN="$(git -C "$TOP" worktree list --porcelain | awk '/^worktree /{sub(/^worktree /, ""); print; exit}')"
MAIN="$(cd "$MAIN" && pwd -P)"
REPO="$(basename "$MAIN")"
for link in "$HERMES_DIR"/repos/*; do [ "$(cd "$link" 2>/dev/null && pwd -P)" = "$MAIN" ] && REPO="$(basename "$link")"; done
[ "$TOP" != "$MAIN" ] || fail "메인 체크아웃(repos/$REPO)이다. 워크트리에서 작업한 브랜치만 올린다"
BRANCH="$(git -C "$TOP" symbolic-ref --short -q HEAD)" || fail "detached HEAD 다"
case "$BRANCH" in
  dev|main|master|stg|frz|prd|prd-*|release/*|dev-*) fail "보호 브랜치($BRANCH)는 올리지 않는다" ;;
esac
[ -z "$(git -C "$TOP" status --porcelain --untracked-files=no)" ] || fail "커밋하지 않은 변경이 있다 — 먼저 \"커밋해줘\"(scripts/commit.sh) 또는 사용자에게 확인"
UNTRACKED="$(git -C "$TOP" ls-files --others --exclude-standard | wc -l | tr -d ' ')"
HEAD_SHA="$(git -C "$TOP" rev-parse --short HEAD)"

# ── 2. 계획서 — 레포 하나짜리인지, HEAD 가 기록된 커밋인지, 리뷰 기록 ────────────
HEAD_FULL="$(git -C "$TOP" rev-parse HEAD)"
PLAN_INFO="$(python3 - "$HERMES_DIR/$PLAN" "$HERMES_DIR/hermes.config.json" "$HEAD_FULL" "$BRANCH" <<'PYEOF'
import json, re, sys, pathlib
text = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'); cfg = json.load(open(sys.argv[2])); head, branch = sys.argv[3:5]
agents = set()
for repo in cfg['repos']:
    agents.update(repo.get('agents') or [])
    if repo.get('packagesAgent'): agents.add(repo['packagesAgent'])
    agents.update(app['agent'] for app in (repo.get('apps') or {}).values())
found = set()
line = re.search(r'^- Agent:\s*(.+)$', text, re.M)
if line: found.update(name for name in agents if re.search(rf'(?<![\w-]){re.escape(name)}(?![\w-])', line.group(1)))
# 정식 계획서의 작업 배분표 — "| 담당 |" 표의 첫 칸
section = re.search(r'^## \d*\.?\s*작업 배분\s*\n(.*?)(?=^## |\Z)', text, re.M | re.S)
if section:
    for row in re.findall(r'^\|\s*([^|]+?)\s*\|', section.group(1), re.M):
        found.update(name for name in agents if re.search(rf'(?<![\w-]){re.escape(name)}(?![\w-])', row))
commits = re.search(r'^#{2,3} Commits\s*\n(.*?)(?=^#{1,3} |\Z)', text, re.M | re.S)
recorded = ''
if commits:
    for entry in commits.group(1).splitlines():
        sha = re.search(r'`([0-9a-f]{6,40})`', entry)
        if sha and head.startswith(sha.group(1)) and branch in entry:
            recorded = entry.strip()
# reviewer 가 끝에 남기는 결론 줄 — "- Review result: 승인 @<sha> …". 마지막 줄을 본다
# 여러 레포 계획서는 브랜치마다 한 줄 — 이 브랜치 줄(없으면 브랜치 표시 없는 옛 줄)만 본다
lines = re.findall(r'^- Review result:.*$', text, re.M)
mine = [row for row in lines if f'🌿 {branch} ' in row + ' '] or [row for row in lines if '🌿' not in row]
results = [hit.groups() for hit in (re.match(r'^- Review result:\s*(.+?)\s*@\s*([0-9a-f]{6,40})', row) for row in mine) if hit]
if not results:
    review = 'none' if not re.search(r'^- Review:', text, re.M) else 'pending'
else:
    verdict, sha = results[-1]
    review = 'ok' if verdict.startswith('승인') and head.startswith(sha) else ('stale' if verdict.startswith('승인') else 'changes')
title = (re.search(r'^# (.+)$', text, re.M) or [None, ''])[1].strip()
print(len(found)); print(','.join(sorted(found))); print(recorded); print(review); print(title)
PYEOF
)" || fail "계획서를 읽지 못했다"
AGENT_COUNT="$(sed -n 1p <<<"$PLAN_INFO")"; AGENT_NAMES="$(sed -n 2p <<<"$PLAN_INFO")"
RECORDED="$(sed -n 3p <<<"$PLAN_INFO")"; REVIEWED="$(sed -n 4p <<<"$PLAN_INFO")"; PLAN_TITLE="$(sed -n 5p <<<"$PLAN_INFO")"
if [ -n "$REPO_AGENT" ]; then
  grep -qxF "$REPO_AGENT" <<<"${AGENT_NAMES//,/$'\n'}" || fail "--repo-agent $REPO_AGENT 가 계획서의 에이전트($AGENT_NAMES)에 없다"
  AGENT_REPO="$(python3 -c "import json,sys; c=json.load(open(sys.argv[1])); a=sys.argv[2]; print(next((r['name'] for r in c['repos'] if a in (r.get('agents') or []) or r.get('packagesAgent')==a or any(x.get('agent')==a for x in (r.get('apps') or {}).values())), ''))" "$HERMES_DIR/hermes.config.json" "$REPO_AGENT")"
  [ "$AGENT_REPO" = "$REPO" ] || fail "--repo-agent $REPO_AGENT 의 레포(${AGENT_REPO:-?})와 --dir 의 레포($REPO)가 다르다"
elif [ "${AGENT_COUNT:-0}" -gt 1 ]; then
  fail "여러 에이전트가 붙은 작업이다($AGENT_NAMES) — 순서 조율이 필요해 헤르메스가 올린다. 사용자에게 \"헤르메스에게 PR 을 요청해 달라\" 고 알린다"
fi
[ -n "$RECORDED" ] || fail "HEAD($HEAD_SHA)가 계획서 Commits 에 없다 — scripts/commit.sh 로 커밋한 것만 올린다(검증 기록이 있어야 한다)"
case "$RECORDED" in *"검증 생략"*) VERIFY_WARN="⚠️ 이 커밋은 검증 없이 커밋됐다(사용자 지시)";; *) VERIFY_WARN="";; esac
case "$REVIEWED" in
  ok) REVIEW_NOTE="reviewer 승인 @$HEAD_SHA" ;;
  stale) REVIEW_NOTE="⚠️ reviewer 승인 뒤에 새 커밋이 있다 — 다시 리뷰받거나, 이대로 올릴지 사용자에게 확인(올리면 --no-review-ok)" ;;
  changes) REVIEW_NOTE="⚠️ reviewer 결론이 승인이 아니다(수정 필요) — 반영·재리뷰하거나, 이대로 올릴지 사용자에게 확인(올리면 --no-review-ok)" ;;
  pending) REVIEW_NOTE="⚠️ reviewer 를 띄웠지만 결론 기록(- Review result:)이 없다 — 이대로 올릴지 사용자에게 확인(올리면 --no-review-ok)" ;;
  *) REVIEW_NOTE="⚠️ reviewer 기록 없음 — 리뷰 없이 올릴지 사용자에게 확인(올리면 --no-review-ok)" ;;
esac

# ── 3. base 후보 · 제목 범위 ─────────────────────────────────────────────
git -C "$TOP" fetch --quiet origin 2>/dev/null || echo "⚠️ fetch 실패 — 로컬의 origin 참조로 본다" >&2
PR_BASE="$(python3 - "$HERMES_DIR/hermes.config.json" "$REPO" <<'PYEOF'
import json, sys
cfg = json.load(open(sys.argv[1]))
for repo in cfg['repos']:
    if repo['name'] == sys.argv[2]:
        base = repo.get('prBase') or next((app.get('prBase') for app in (repo.get('apps') or {}).values() if app.get('prBase')), '')
        print(base or 'dev'); break
PYEOF
)"
CANDIDATES=("$PR_BASE")
[ "$REPO" = bznav-rn-app ] && CANDIDATES+=("dev")
# 최근 30일 안에 움직인 원격 release/* — 기능 PR 을 릴리즈 브랜치로 모으는 경우
while IFS= read -r ref; do [ -n "$ref" ] && CANDIDATES+=("$ref"); done < <(
  git -C "$TOP" for-each-ref --sort=-committerdate --format='%(committerdate:unix) %(refname:strip=3)' 'refs/remotes/origin/release/*' \
    | awk -v since="$(( $(date +%s) - 30*86400 ))" '$1 >= since {print $2}' | head -3)

CHANGED_FROM="origin/$PR_BASE"
git -C "$TOP" rev-parse -q --verify "$CHANGED_FROM" >/dev/null || CHANGED_FROM="$(git -C "$TOP" merge-base HEAD "origin/${BASES[0]:-$PR_BASE}" 2>/dev/null || echo HEAD~1)"
CHANGED="$(git -C "$TOP" diff --name-status "$CHANGED_FROM"...HEAD 2>/dev/null)"
SCOPES="$(REPO="$REPO" python3 -c '
import os, re, sys
repo = os.environ["REPO"]; files = [line.split("\t")[-1] for line in sys.stdin.read().splitlines() if line.strip()]
fixed = {"client-brics-refund": "refund", "client-brics-hub": "hub", "client-brics-care": "care", "web-op": "op", "bznav-rn-app": "app"}
scopes = []
if repo in fixed:
    scopes = [fixed[repo]]
elif repo == "bznav-web":
    for path in files:
        hit = re.match(r"apps/([^/]+)/", path)
        name = hit.group(1) if hit else ("packages" if path.startswith("packages/") else "")
        if name and name not in scopes: scopes.append(name)
elif repo == "zent-packages":
    for path in files:
        hit = re.match(r"frontend/(brics|bznav)/([^/]+)/", path)
        name = f"{hit.group(1)}-fe-{hit.group(2)}" if hit else ("zent-fe-devkit" if path.startswith("frontend/devkit/") else "")
        if name and name not in scopes: scopes.append(name)
print(",".join(scopes))
' <<<"$CHANGED")"
TICKET="$(grep -oE '[A-Z][A-Z0-9]+-[0-9]+' <<<"$BRANCH" | head -1)"
LAST_TYPE="$(git -C "$TOP" log -1 --pretty=%s | grep -oE '^(feat|fix|refactor|chore|docs|style|test)' || echo feat)"
SUMMARY="$(sed -E 's/^\[?[A-Z][A-Z0-9]+-[0-9]+\]?[ :—-]*//' <<<"$PLAN_TITLE")"
SUGGESTED="${LAST_TYPE}(${SCOPES:-범위}): ${TICKET:+$TICKET }${SUMMARY}"

# ── 4. 본문 초안 ─────────────────────────────────────────────────────────
DRAFT="$(git -C "$TOP" rev-parse --absolute-git-dir)/hermes-pr-body.md"
[ $YES = 1 ] || printf '%s\n' "$HEAD_FULL" > "$DRAFT.head"
[ $YES = 1 ] || CHANGED="$CHANGED" python3 - "$HERMES_DIR/$PLAN" "$DRAFT" "$TICKET" <<'PYEOF'
import os, re, sys, pathlib
text = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'); out = pathlib.Path(sys.argv[2]); ticket = sys.argv[3]
def section(names):
    for name in names:
        hit = re.search(rf'^#{{2,3}} (?:\d+\.\s*)?{name}\s*\n(.*?)(?=^#{{1,3}} |\Z)', text, re.M | re.S)
        if hit and hit.group(1).strip():
            return hit.group(1).strip()
    return ''
def clean(block):
    lines = [re.sub(r'^>\s?', '', line) for line in block.splitlines()]
    # hermes 로컬 경로는 PR 에 싣지 않는다
    return '\n'.join(line for line in lines if 'plans/' not in line and line.strip() not in ('', '---')).strip()
what = clean(section(['지시', '개요'])) or '- (작업 내용을 적는다)'
result = clean(section(['결과']))
validation = clean(section(['Validation'])) or '(검증 결과를 붙인다)'
kinds = {'A': '추가', 'M': '수정', 'D': '삭제', 'R': '이름 변경', 'C': '복사'}
changed = []
for row in os.environ.get('CHANGED', '').splitlines():
    cols = row.split('\t')
    if len(cols) >= 2:
        changed.append(f"- {kinds.get(cols[0][:1], cols[0])} `{cols[-1]}`")
body = f"""## 작업 내용
{what}

## 변경 사항
{chr(10).join(changed) or '- (변경 파일)'}
{result}

## 검증
{validation}

## 확인 필요
- 없음

---
{'티켓: ' + ticket + chr(10) if ticket else ''}🤖 Generated with [Claude Code](https://claude.com/claude-code)
"""
out.write_text(body, encoding='utf-8')
PYEOF

# ── 5. 미리보기 ──────────────────────────────────────────────────────────
if [ $YES = 0 ]; then
  echo "── PR 미리보기 (아직 아무것도 보내지 않았다)"
  echo "레포     $REPO · 🌿 $BRANCH · HEAD $HEAD_SHA"
  echo "base 후보 ${CANDIDATES[*]}   (기본: $PR_BASE — hermes.config.json prBase)"
  echo "올라갈 커밋 ($CHANGED_FROM..HEAD):"
  git -C "$TOP" log --oneline "$CHANGED_FROM"..HEAD 2>/dev/null | sed 's/^/  /'
  echo "검증     $RECORDED"
  [ -n "$VERIFY_WARN" ] && echo "         $VERIFY_WARN"
  echo "리뷰     $REVIEW_NOTE"
  [ "$UNTRACKED" = 0 ] || echo "미추적   ⚠️ 커밋 안 된 새 파일 ${UNTRACKED}개 — PR 에 안 들어간다"
  [ "$REPO" = zent-packages ] && ! grep -q '\.changeset/.*\.md' <<<"$CHANGED" && echo "changeset ⚠️ .changeset/*.md 가 없다 — 머지가 막힌다(pnpm changeset)"
  echo "제목 제안 $SUGGESTED"
  echo "본문 초안 $DRAFT  (고치려면 이 파일을 편집하거나 --body-file — --yes 때 다시 만들지 않는다)"
  echo "──"
  echo "사용자에게 base(후보 중 선택, 여러 개 가능)·제목(그대로/수정)을 확인받은 뒤 --base … --title \"…\" --yes 로 다시 실행한다"
  exit 0
fi

# ── 6. 보내기 전 확인 ────────────────────────────────────────────────────
[ ${#BASES[@]} -gt 0 ] || fail "--base 가 없다"
[ -n "$TITLE" ] || fail "--title 이 없다"
[ "$REVIEWED" = ok ] || [ $REVIEW_OK = 1 ] || fail "${REVIEW_NOTE#⚠️ }"
TYPE_RE='(feat|fix|refactor|chore|docs|style|test)'
[[ "$TITLE" =~ ^$TYPE_RE\(([^\)]+)\):\ .+ ]] || fail "제목 형식이 아니다: \"$TITLE\" — type(범위): 티켓 요약. 제안: $SUGGESTED"
TITLE_SCOPE="${BASH_REMATCH[2]}"
if [ -n "$SCOPES" ]; then
  for part in ${TITLE_SCOPE//,/ }; do
    grep -qxF "$part" <<<"${SCOPES//,/$'\n'}" || fail "제목의 범위($part)가 이 변경의 범위($SCOPES)에 없다. 제안: $SUGGESTED"
  done
fi
[ -z "$TICKET" ] || grep -qF "$TICKET" <<<"$TITLE" || fail "브랜치의 티켓($TICKET)이 제목에 없다. 제안: $SUGGESTED"
BODY="${BODY_FILE:-$DRAFT}"
[ -f "$BODY" ] || fail "본문 파일이 없다: $BODY — 미리보기(--yes 없이)부터 돌린다"
if [ -z "$BODY_FILE" ] && [ "$(cat "$DRAFT.head" 2>/dev/null)" != "$HEAD_FULL" ]; then
  fail "미리보기 뒤에 HEAD 가 바뀌었다 — 초안이 지금 커밋과 맞지 않는다. 미리보기부터 다시"
fi
for heading in '## 작업 내용' '## 변경 사항' '## 검증' '## 확인 필요'; do
  grep -qxF "$heading" "$BODY" || fail "본문에 \"$heading\" 절이 없다(docs/knowledge/common/git.md \"PR 제목·본문\")"
done
grep -qE '(^|[^[:alnum:]])plans/|/Users/|/private/|\.worktrees/|HERMES_[A-Z_]+=' "$BODY" && fail "본문에 로컬 경로(plans/… · /Users/… · .worktrees/ · HERMES_*=)가 있다 — 빼고 다시"
grep -qiE 'https?://(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)|https?://[^/[:space:]]*\.(internal|local)([:/[:space:]]|$)' "$BODY" && fail "본문에 내부 주소로 보이는 URL 이 있다 — 확인하고 빼기"
grep -qiE '(api[_-]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*[^[:space:]]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY' "$BODY" && fail "본문에 비밀값으로 보이는 줄이 있다 — 확인하고 빼기"
for base in "${BASES[@]}"; do
  git -C "$TOP" ls-remote --exit-code --heads origin "$base" >/dev/null 2>&1 || fail "원격에 base 브랜치가 없다: $base"
  [ -n "$(git -C "$TOP" rev-list "origin/$base"..HEAD 2>/dev/null)" ] || fail "origin/$base 에 없는 커밋이 없다 — 올릴 게 없다"
done

# ── 7. push → draft PR ───────────────────────────────────────────────────
git -C "$TOP" push -u origin "$BRANCH" || fail "push 실패"
PR_LINES=""
for base in "${BASES[@]}"; do
  URL="$(cd "$TOP" && gh pr list --head "$BRANCH" --base "$base" --state open --json url --jq '.[0].url' 2>/dev/null)"
  if [ -n "$URL" ]; then
    echo "ℹ️ 이미 열린 PR 이 있다 — push 만 했다: $URL"
  else
    URL="$(cd "$TOP" && gh pr create --draft --base "$base" --head "$BRANCH" --title "$TITLE" --body-file "$BODY")" \
      || fail "push 는 됐지만 PR 생성에 실패했다(base $base) — 사용자에게 알린다"
    URL="$(tail -1 <<<"$URL")"
    echo "✅ draft PR: $URL ($BRANCH → $base)"
  fi
  PR_LINES="$PR_LINES$base $URL"$'\n'
done

# ── 8. 계획서에 기록 ─────────────────────────────────────────────────────
PUSHED="$(for base in "${BASES[@]}"; do git -C "$TOP" log --pretty=%H "origin/$base"..HEAD 2>/dev/null; done | sort -u | tr '\n' ' ')"
python3 - "$HERMES_DIR/$PLAN" "$(date '+%Y-%m-%d %H:%M')" "$BRANCH" "$PUSHED" "$PR_LINES" <<'PYEOF'
import sys, re, pathlib
plan, stamp, branch, pushed, pr_lines = sys.argv[1:6]
path = pathlib.Path(plan); text = path.read_text(encoding='utf-8')
prs = [line.split(' ', 1) for line in pr_lines.strip().splitlines() if ' ' in line]
note = ' · '.join(f'push → {base} PR {url}' for base, url in prs)
shas = set(pushed.split())
def mark(match):
    entry = match.group(0)
    hit = re.search(r'`([0-9a-f]{6,})`', entry)
    return entry.replace('push 안 함', note) if hit and any(full.startswith(hit.group(1)) for full in shas) and branch in entry else entry
text = re.sub(r'^- .*push 안 함.*$', mark, text, flags=re.M)
for base, url in prs:
    line = f'- PR: {url} ({branch} → {base}, draft · {stamp})'
    if f'- PR: {url}' not in text:
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
PYEOF
[ $? = 0 ] || echo "⚠️ PR 은 올라갔지만 계획서 기록에 실패했다 — 계획서에 PR 링크를 손으로 적는다" >&2
echo "   draft 다. 리뷰어 지정·Ready 전환은 GitHub 에서"
