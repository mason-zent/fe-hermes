#!/usr/bin/env bash
# 메인 체크아웃의 git 무시 로컬 파일(.env·.aws 키 등)을 워크트리로 복사한다.
#
# 왜: git worktree 는 추적 파일만 가져온다. .env·.aws/access-key.js 같은 무시 대상이 없으면
# 워크트리에서 env 없이 빌드·dev 확인을 하게 된다(실제로 겪음 — issues/20261001-hermes-worktree-env-파일-미복사.md).
#
# 사용:
#   scripts/wt-copy-local.sh <메인 체크아웃> <워크트리>   new-branch.sh 가 워크트리를 만든 뒤 부른다
#   scripts/wt-copy-local.sh --all                       .worktrees/ 아래 이미 있는 워크트리 전부에 한 번
#   (--dry-run 을 붙이면 복사하지 않고 목록만)
#
# 무엇을: hermes.config.json 의 worktreeCopy(gitignore 식 패턴) 에 맞는, 메인 체크아웃의 git 무시 파일.
#   슬래시 없는 패턴은 어느 깊이의 파일 이름에나(.env → apps/*/.env 도), 슬래시 있는 패턴은 레포 루트 기준 경로에 맞춘다.
# 규칙: 내용은 출력하지 않고 이름만 보고한다 · 워크트리에 이미 있으면 덮어쓰지 않는다 ·
#   워크트리에서 git 무시 대상이 아니면(커밋될 수 있으면) 복사하지 않는다 · 권한은 그대로(cp -p)
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$ROOT/hermes.config.json"
WT_ROOT="${HERMES_WORKTREE_ROOT:-$ROOT/.worktrees}"
DRY_RUN=0; ARGS=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) ARGS+=("$arg") ;;
  esac
done

copy_one() {
  local main="$1" wt="$2"
  [ -d "$main" ] && [ -d "$wt" ] || { echo "❌ 경로 없음: $main → $wt"; return 1; }
  DRY_RUN="$DRY_RUN" python3 - "$CONFIG" "$main" "$wt" <<'PY'
import fnmatch, json, os, shutil, subprocess, sys
cfg_path, main, wt = sys.argv[1:4]
patterns = json.load(open(cfg_path)).get('worktreeCopy', {}).get('include', [])
dry = os.environ.get('DRY_RUN') == '1'
# 무시 디렉터리를 펼칠 때 들어가지 않을 곳 — 의존성·빌드 산출물(무겁고 복사 대상이 아니다)
heavy = {'node_modules', '.next', '.turbo', '.pnpm-store', 'dist', 'build', 'out', 'coverage',
         'storybook-static', '.expo', 'ios', 'android', '.git', '__generated__'}

def wanted(rel):
    name = os.path.basename(rel)
    for pat in patterns:
        if '/' in pat:
            if fnmatch.fnmatchcase(rel, pat): return True
        elif fnmatch.fnmatchcase(name, pat): return True
    return False

listed = subprocess.run(['git', '-C', main, 'ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z'],
                        capture_output=True, text=True).stdout.split('\0')
candidates = []
for entry in filter(None, listed):
    if entry.endswith('/'):
        top = entry.rstrip('/')
        if os.path.basename(top) in heavy: continue
        for base, dirs, files in os.walk(os.path.join(main, top)):
            dirs[:] = [d for d in dirs if d not in heavy]
            for name in files:
                candidates.append(os.path.relpath(os.path.join(base, name), main))
    else:
        candidates.append(entry)

copied, existed, unsafe = [], [], []
for rel in sorted(set(filter(wanted, candidates))):
    src, dst = os.path.join(main, rel), os.path.join(wt, rel)
    if not os.path.isfile(src): continue
    if os.path.lexists(dst): existed.append(rel); continue
    # 워크트리 브랜치의 .gitignore 가 다를 수 있다 — 거기서도 무시 대상일 때만 둔다(커밋 방지)
    if subprocess.run(['git', '-C', wt, 'check-ignore', '-q', '--no-index', rel]).returncode != 0:
        unsafe.append(rel); continue
    if not dry:
        os.makedirs(os.path.dirname(dst) or wt, exist_ok=True)
        shutil.copy2(src, dst)
    copied.append(rel)

verb = '복사할' if dry else '복사'
print(f"   🔑 로컬 파일 {verb} {len(copied)}개" + (f": {', '.join(copied)}" if copied else ''))
if existed: print(f"      이미 있어 건너뜀 {len(existed)}개: {', '.join(existed)}")
if unsafe: print(f"      ⚠️ 워크트리에서 git 무시 대상이 아니라 건너뜀(커밋될 수 있음): {', '.join(unsafe)}")
PY
}

if [ "${ARGS[0]:-}" = "--all" ]; then
  # .worktrees/<레포>/<슬러그> — 메인 체크아웃은 repos/<레포>
  found=0
  for wt in "$WT_ROOT"/*/*/; do
    [ -e "$wt/.git" ] || continue
    repo="$(basename "$(dirname "$wt")")"
    echo "== $repo/$(basename "$wt")"
    copy_one "$ROOT/repos/$repo" "${wt%/}"
    found=$((found+1))
  done
  [ $found = 0 ] && echo "워크트리가 없다 ($WT_ROOT)"
  exit 0
fi

[ ${#ARGS[@]} = 2 ] || { echo "사용: $0 <메인 체크아웃> <워크트리> | --all  [--dry-run]"; exit 2; }
copy_one "${ARGS[0]}" "${ARGS[1]}"
