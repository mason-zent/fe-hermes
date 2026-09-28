#!/usr/bin/env bash
# 브랜치 선택지 후보 — /call 로 뜬 에이전트가 "어느 브랜치로 할까요?" 를 선택형(AskUserQuestion)으로 물을 때 쓴다.
# 사용: scripts/branch-candidates.sh <레포 이름> [개수=3]
# 출력: 한 줄에 하나 "<브랜치>\t<로컬|원격|로컬·원격>\t<마지막 커밋 날짜 요약>\t<체크아웃 위치 또는 ->"
#   - 이 git 사용자(user.email)가 마지막으로 커밋한 브랜치를 최근 순으로 (없으면 전체 최근 순)
#   - 운영·개발 기준 브랜치(dev·prd*·main·stg 등)는 뺀다 — 작업 브랜치 후보만
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${1:-}"; COUNT="${2:-3}"
[ -n "$REPO" ] || { echo "사용: $0 <레포 이름> [개수]" >&2; exit 2; }
DIR="$HERMES_DIR/repos/$REPO"
[ -d "$DIR" ] || { echo "repos/$REPO 가 없다" >&2; exit 2; }

# 파이썬은 -c 로 넘긴다 — heredoc 으로 넘기면 파이프의 git 출력과 표준 입력이 부딪친다
PY=$(cat <<'PYEOF'
import sys, subprocess
me, count, repo_dir = sys.argv[1].strip('<>'), int(sys.argv[2]), sys.argv[3]
base = ('dev', 'main', 'master', 'stg', 'HEAD')
worktrees = {}
out = subprocess.run(['git', '-C', repo_dir, 'worktree', 'list', '--porcelain'], capture_output=True, text=True).stdout
path = ''
for line in out.splitlines():
    if line.startswith('worktree '): path = line[9:]
    if line.startswith('branch refs/heads/'): worktrees[line[18:]] = path
rows = {}
for line in sys.stdin:
    ref, date, email, subject = (line.rstrip('\n').split('\t') + ['', '', '', ''])[:4]
    local = ref.startswith('refs/heads/')
    name = ref[11:] if local else ref[len('refs/remotes/origin/'):]
    if name in base or name.startswith(('prd', 'dev-', 'release/')):
        continue
    row = rows.setdefault(name, {'local': False, 'remote': False, 'date': date, 'subject': subject, 'mine': False})
    row['local' if local else 'remote'] = True
    row['mine'] = row['mine'] or (me and email.strip('<>') == me)
    if date > row['date']: row['date'], row['subject'] = date, subject
ordered = sorted(rows.items(), key=lambda item: item[1]['date'], reverse=True)
mine = [item for item in ordered if item[1]['mine']]
for name, row in (mine or ordered)[:count]:
    where = '로컬·원격' if row['local'] and row['remote'] else ('로컬' if row['local'] else '원격')
    print(f"{name}\t{where}\t{row['date']} {row['subject'][:40]}\t{worktrees.get(name, '-')}")
PYEOF
)
ME="$(git -C "$DIR" config user.email 2>/dev/null)"
# 로컬과 원격 브랜치를 날짜순으로 모은다 (원격은 origin/ 을 떼고 합친다)
git -C "$DIR" for-each-ref --sort=-committerdate \
  --format='%(refname)%09%(committerdate:short)%09%(authoremail)%09%(contents:subject)' refs/heads refs/remotes/origin 2>/dev/null \
| python3 -c "$PY" "$ME" "$COUNT" "$DIR"
