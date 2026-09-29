#!/usr/bin/env python3
"""FE 에이전트 세션 보호 훅 (Claude Code PreToolUse · Bash) — delegate.sh 가 FE 세션에만 건다.

막는 것 (실수 방지용이지 보안 경계가 아니다 — 스크립트 안의 명령까지 보지는 않는다)
  - git commit 직접        → scripts/commit.sh 로 안내 (지정 파일만·엄격 검증·계획서 기록)
  - git add -A / --all / . / -u  → 남의 변경이 섞인다. 파일을 하나씩 지정하거나 commit.sh 로
  - git push · gh pr …     → 밖으로 나가는 일은 헤르메스가 맡는다
scripts/commit.sh 를 부르는 명령은 통과시킨다.
막으면 exit 2 — stderr 가 에이전트에게 그대로 전달된다.
"""
import json
import re
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)
command = (payload.get('tool_input') or {}).get('command') or ''
if not command or 'scripts/commit.sh' in command:
    sys.exit(0)

# 명령을 ; && || | 로 나눠 조각마다 본다
pieces = [piece.strip() for piece in re.split(r'&&|\|\||;|\|', command)]


def git_sub(piece):
    """'git [-C 경로] [-c k=v] <서브명령> …' 에서 서브명령과 나머지를 꺼낸다"""
    tokens = piece.split()
    if not tokens or tokens[0] != 'git':
        return None, []
    index = 1
    while index < len(tokens) and tokens[index].startswith('-'):
        index += 2 if tokens[index] in ('-C', '-c', '--git-dir', '--work-tree') else 1
    return (tokens[index], tokens[index + 1:]) if index < len(tokens) else (None, [])


reason = ''
for piece in pieces:
    sub, rest = git_sub(piece)
    if sub == 'commit':
        reason = '커밋은 scripts/commit.sh 로만 한다 — 사용자가 "커밋해줘" 라고 했을 때: scripts/commit.sh --plan <계획서> --dir <워크트리> -m "<메시지>" -- <파일>…'
    elif sub == 'push':
        reason = 'push 는 하지 않는다 — 헤르메스가 맡는다. 사용자에게 "헤르메스에게 push 를 요청해 달라" 고 알린다'
    elif sub == 'add' and any(arg in ('-A', '--all', '.', '-u', '--update', ':/') for arg in rest):
        reason = 'git add -A · . · -u 는 남의 변경까지 올린다. 커밋하려면 scripts/commit.sh 에 파일을 하나씩 지정한다'
    elif re.match(r'^gh\s+pr\b', piece):
        reason = 'PR 은 헤르메스가 맡는다. 사용자에게 헤르메스에게 PR 을 요청해 달라고 알린다'
    if reason:
        break

if reason:
    print(f'⛔ 헤르메스 보호 훅: {reason}', file=sys.stderr)
    sys.exit(2)
sys.exit(0)
