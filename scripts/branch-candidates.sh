#!/usr/bin/env bash
# 브랜치 선택지 후보 — /call 로 뜬 에이전트가 "어느 브랜치로 할까요?" 를 선택형(AskUserQuestion)으로 물을 때 쓴다.
# 사용: scripts/branch-candidates.sh <레포 이름> [개수=3]
# 출력: 한 줄에 하나 "<브랜치>\t<로컬|원격|로컬·원격>\t<최근 활동 요약>\t<체크아웃 위치 또는 ->"
#   - 최근 활동 = 마지막 커밋과 reflog 마지막 기록(브랜치 생성·이동) 중 더 최근 것 — 커밋 없이 방금 만든 브랜치도 위로 온다
#   - 이 git 사용자(user.email)의 브랜치를 먼저: 마지막 커밋 작성자이거나 reflog 에 내 이름으로 기록이 있으면 "내 브랜치"
#   - 운영·개발 기준 브랜치(dev·prd*·main·stg·release/* 등)는 뺀다 — 작업 브랜치 후보만
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${1:-}"; COUNT="${2:-3}"
[ -n "$REPO" ] || { echo "사용: $0 <레포 이름> [개수]" >&2; exit 2; }
DIR="$HERMES_DIR/repos/$REPO"
[ -d "$DIR" ] || { echo "repos/$REPO 가 없다" >&2; exit 2; }

# 파이썬은 -c 로 넘긴다 — heredoc 으로 넘기면 파이프의 git 출력과 표준 입력이 부딪친다
PY=$(cat <<'PYEOF'
import sys, subprocess, os, time
me, count, repo_dir, git_dir = sys.argv[1].strip('<>'), int(sys.argv[2]), sys.argv[3], sys.argv[4]
base = ('dev', 'main', 'master', 'stg', 'HEAD')
worktrees = {}
out = subprocess.run(['git', '-C', repo_dir, 'worktree', 'list', '--porcelain'], capture_output=True, text=True).stdout
path = ''
for line in out.splitlines():
    if line.startswith('worktree '): path = line[9:]
    if line.startswith('branch refs/heads/'): worktrees[line[18:]] = path

def reflog(name):
    # .git/logs/refs/heads/<브랜치> 마지막 줄: "<old> <new> 이름 <email> <ts> <tz>\t<메시지>"
    log_path = os.path.join(git_dir, 'logs', 'refs', 'heads', name)
    try:
        with open(log_path, encoding='utf-8', errors='replace') as handle:
            lines = [line for line in handle if line.strip()]
    except OSError:
        return 0, False, ''
    if not lines:
        return 0, False, ''
    mine = any(me and f'<{me}>' in line for line in lines)
    last = lines[-1]
    head, _, message = last.partition('\t')
    parts = head.split()
    try:
        stamp = int(parts[-2])
    except (ValueError, IndexError):
        stamp = 0
    return stamp, mine, message.strip()

rows = {}
for line in sys.stdin:
    ref, stamp, email, subject = (line.rstrip('\n').split('\t') + ['', '', '', ''])[:4]
    local = ref.startswith('refs/heads/')
    name = ref[11:] if local else ref[len('refs/remotes/origin/'):]
    if name in base or name.startswith(('prd', 'dev-', 'release/')):
        continue
    row = rows.setdefault(name, {'local': False, 'remote': False, 'stamp': 0, 'what': '', 'mine': False})
    row['local' if local else 'remote'] = True
    row['mine'] = row['mine'] or bool(me and email.strip('<>') == me)
    commit_stamp = int(stamp or 0)
    if commit_stamp > row['stamp']:
        row['stamp'], row['what'] = commit_stamp, subject
    if local:
        log_stamp, log_mine, log_message = reflog(name)
        row['mine'] = row['mine'] or log_mine
        if log_stamp > row['stamp']:
            row['stamp'], row['what'] = log_stamp, f'(커밋 없음) {log_message}' if log_message.startswith('branch: Created') else log_message

ordered = sorted(rows.items(), key=lambda item: item[1]['stamp'], reverse=True)
mine = [item for item in ordered if item[1]['mine']]
for name, row in (mine or ordered)[:count]:
    where = '로컬·원격' if row['local'] and row['remote'] else ('로컬' if row['local'] else '원격')
    day = time.strftime('%Y-%m-%d', time.localtime(row['stamp'])) if row['stamp'] else '?'
    print(f"{name}\t{where}\t{day} {row['what'][:40]}\t{worktrees.get(name, '-')}")
PYEOF
)
ME="$(git -C "$DIR" config user.email 2>/dev/null)"
GIT_DIR="$(cd "$DIR" && cd "$(git rev-parse --git-common-dir)" && pwd -P)"
# 로컬과 원격 브랜치를 모은다 (원격은 origin/ 을 떼고 합친다). 날짜는 유닉스 시각 — reflog 와 비교한다
git -C "$DIR" for-each-ref \
  --format='%(refname)%09%(committerdate:unix)%09%(authoremail)%09%(contents:subject)' refs/heads refs/remotes/origin 2>/dev/null \
| python3 -c "$PY" "$ME" "$COUNT" "$DIR" "$GIT_DIR"
