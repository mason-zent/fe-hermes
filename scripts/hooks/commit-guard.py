#!/usr/bin/env python3
"""FE 에이전트 세션 보호 훅 (Claude Code PreToolUse · Bash) — delegate.sh 가 FE 세션에만 건다.

막는 것 (실수 방지용이지 보안 경계가 아니다 — 스크립트 파일 안의 명령까지 보지는 않는다)
  - git commit 직접        → scripts/commit.sh 로 안내 (지정 파일만·엄격 검증·계획서 기록)
  - git add -A / --all / . / -u / 디렉터리  → 남의 변경이 섞인다. 파일을 하나씩 지정하거나 commit.sh 로
  - git push · gh pr (쓰기) → scripts/ship.sh 로 안내 (사용자가 "PR 올려줘" 했을 때 · 레포 하나짜리 작업만 · 미리보기 확인 후)
  - git revert · merge · cherry-pick · am  → commit.sh 를 거치지 않고 커밋을 만든다
  - git stash(list·show 제외) · reset --hard → 미커밋 변경(남의 작업일 수 있다)을 치우거나 지운다
통과: 실제로 실행되는 명령(조각의 첫 실행 토큰)이 **이 hermes 의** scripts/commit.sh · scripts/ship.sh 인 조각(경로를 풀어 비교 — 같은 이름의 다른 파일은 막는다),
      gh pr 읽기(view·list·status·checks·diff), gh api 읽기(GET).
그 밖에 막는 것: ship.sh --repo-agent(헤르메스 전용 — 여러 레포 순서 조율), gh api 쓰기(-X POST 등 · -f/-F 필드 · --input, 붙여 쓴 꼴 포함).
경로는 페이로드 cwd 기준으로 푼다 — 워크트리에서는 절대 경로로 부른다(에이전트 지시문이 그렇게 한다).
한계(보안 경계가 아니다): FE 세션은 hermes 에 쓰기 권한이 있어 scripts 자체나 계획서 기록(Review result 등)을 고칠 수 있고,
git -c alias.… · send-pack · eval · xargs 로 감싼 push 는 보지 않는다.

명령은 ; && || | & 줄바꿈으로 나누고, $( … ) · ` … ` · ( … ) 안과 sh|bash|zsh -c "…" 인자도 따로 본다.
VAR=값 · env · command · sudo · nohup · time · exec · nice 앞붙임은 건너뛰고, git·gh 는 경로를 떼고 이름으로 본다.
막으면 exit 2 — stderr 가 에이전트에게 그대로 전달된다.
"""
import json
import os
import pathlib
import re
import shlex
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)
command = (payload.get('tool_input') or {}).get('command') or ''
cwd = payload.get('cwd') or os.getcwd()
if not command.strip():
    sys.exit(0)

WRAPPERS = {'env', 'command', 'sudo', 'nohup', 'time', 'exec', 'nice', 'builtin'}
SHELLS = {'sh', 'bash', 'zsh', 'dash'}
GIT_OPTS_WITH_VALUE = {'-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env'}
GH_OPTS_WITH_VALUE = {'-R', '--repo', '--hostname'}
# 통과시키는 스크립트 — 이 파일 기준 hermes 루트의 scripts/ 아래 실제 파일만
HERMES_SCRIPTS = pathlib.Path(__file__).resolve().parents[1]
ALLOWED_SCRIPTS = {name: os.path.realpath(HERMES_SCRIPTS / name) for name in ('commit.sh', 'ship.sh')}


def mask_quotes(text, keep_substitution):
    """따옴표 안을 같은 길이의 공백으로 가린다 — 커밋 메시지 "fix: (git merge 대응)" 같은 글자를 명령으로 보지 않게.
    keep_substitution 이면 큰따옴표 안의 $( … ) · ` … ` 는 남긴다(큰따옴표 안에서도 실행된다)"""
    out, index, quote = [], 0, ''
    while index < len(text):
        char = text[index]
        if quote == "'":
            out.append(' ' if char != "'" else char); quote = '' if char == "'" else quote
        elif quote == '"':
            if char == '\\' and index + 1 < len(text):
                out.append('  '); index += 2; continue
            if char == '"':
                out.append(char); quote = ''
            elif keep_substitution and (text.startswith('$(', index) or char == '`'):
                # 치환 구간은 끝까지 그대로 옮긴다 — $( ) 는 괄호 짝을 센다(중첩)
                if char == '$':
                    depth, end = 0, index + 1
                    while end < len(text):
                        depth += {'(': 1, ')': -1}.get(text[end], 0)
                        if depth == 0:
                            break
                        end += 1
                else:
                    end = text.find('`', index + 1)
                end = len(text) - 1 if end < 0 or end >= len(text) else end
                out.append(text[index:end + 1]); index = end + 1; continue
            else:
                out.append(' ')
        else:
            if char in ('"', "'"):
                quote = char
            out.append(char)
        index += 1
    return ''.join(out)


def balanced_groups(view, opener):
    """view 에서 opener('$(' 또는 '(') 로 시작하는 구간의 안쪽 (시작, 끝) 을 괄호 짝을 세어 찾는다 — 중첩도 바깥 한 겹"""
    spans, index = [], 0
    while True:
        index = view.find(opener, index)
        if index < 0:
            return spans
        if opener == '(' and index > 0 and view[index - 1] == '$':
            index += 1; continue   # $( 는 치환 쪽에서 본다
        depth, cursor = 0, index + len(opener) - 1
        while cursor < len(view):
            if view[cursor] == '(':
                depth += 1
            elif view[cursor] == ')':
                depth -= 1
                if depth == 0:
                    break
            cursor += 1
        spans.append((index + len(opener), cursor))
        index = cursor + 1


def inner_commands(text):
    """$( … ) · ` … ` · ( … ) 안의 명령을 꺼낸다. 괄호 짝을 세어 바깥 한 겹을 꺼내고, 그 안은 check() 가 재귀로 다시 본다.
    치환은 작은따옴표만 가리고(큰따옴표 안에서도 실행), 서브셸 ( … ) 은 따옴표를 모두 가린 뒤 찾는다"""
    substitution_view = mask_quotes(text, keep_substitution=True)
    found = [text[begin:end] for begin, end in balanced_groups(substitution_view, '$(')]
    found += [text[match.start(1):match.end(1)] for match in re.finditer(r'`([^`]*)`', substitution_view)]
    plain_view = mask_quotes(text, keep_substitution=False)
    found += [text[begin:end] for begin, end in balanced_groups(plain_view, '(')]
    return found


def split_pieces(text):
    """; && || | & 줄바꿈으로 나눈다 — 따옴표 안의 구분자는 가린 채로 자리를 찾아 원문을 자른다"""
    view = mask_quotes(text, keep_substitution=False)
    pieces, start = [], 0
    for match in re.finditer(r'&&|\|\||[;|&\n]', view):
        pieces.append(text[start:match.start()]); start = match.end()
    pieces.append(text[start:])
    return [piece.strip() for piece in pieces if piece.strip()]


def tokens_of(piece):
    try:
        return shlex.split(piece, posix=True)
    except ValueError:
        return piece.split()


def strip_prefix(tokens):
    """VAR=값 · 감싸는 명령(env·sudo…)과 그 옵션을 건너뛴다"""
    index = 0
    while index < len(tokens):
        token = tokens[index]
        if re.match(r'^[A-Za-z_][A-Za-z0-9_]*=', token):
            index += 1
        elif os.path.basename(token) in WRAPPERS:
            index += 1
            # 감싸는 명령의 옵션(-u user, -i 등)은 값까지 건너뛴다 — 다음 비옵션 토큰이 실제 명령
            while index < len(tokens) and tokens[index].startswith('-'):
                index += 2 if tokens[index] in ('-u', '-g', '-C', '-n') else 1
        else:
            break
    return tokens[index:]


def check_git(args):
    """args = git 뒤의 토큰들. 막을 이유를 돌려준다"""
    index = 0
    while index < len(args) and args[index].startswith('-'):
        option = args[index].split('=', 1)[0]
        index += 2 if option in GIT_OPTS_WITH_VALUE and '=' not in args[index] else 1
    if index >= len(args):
        return ''
    sub, rest = args[index], args[index + 1:]
    if sub == 'commit':
        return '커밋은 scripts/commit.sh 로만 한다 — 사용자가 "커밋해줘" 라고 했을 때: scripts/commit.sh --plan <계획서> --dir <워크트리> -m "<메시지>" -- <파일>…'
    if sub in ('revert', 'merge', 'cherry-pick', 'am'):
        return f'git {sub} 는 commit.sh 를 거치지 않고 커밋을 만든다(검증·계획서 기록 없음). 필요하면 이유를 사용자에게 말하고 사용자가 직접 실행하게 한다'
    if sub == 'stash' and (not rest or rest[0] not in ('list', 'show')):
        return 'git stash 는 미커밋 변경(사용자·남의 작업일 수 있다)을 치운다. 보기만(list·show) 허용 — 필요하면 사용자에게 묻는다'
    if sub == 'reset' and '--hard' in rest:
        return 'git reset --hard 는 미커밋 변경을 지운다. 되돌릴 게 있으면 파일을 지정해 사용자에게 확인한 뒤 사용자가 직접 한다'
    if sub == 'push':
        return 'push 는 scripts/ship.sh 로만 한다 — 사용자가 "PR 올려줘" 라고 했을 때: scripts/ship.sh --plan <계획서> --dir <워크트리> 로 미리보기부터'
    if sub == 'add':
        for arg in rest:
            short_bundle = re.match(r'^-[A-Za-z]+$', arg) and any(flag in arg[1:] for flag in 'Au')
            everything = arg in ('--all', '--update', '.', './', ':/', ':') or arg.startswith(':/') or short_bundle
            directory = not arg.startswith('-') and os.path.isdir(os.path.join(cwd, arg))
            if everything or directory:
                return 'git add -A · . · -u · 디렉터리는 남의 변경까지 올린다. 커밋하려면 scripts/commit.sh 에 파일을 하나씩 지정한다'
    return ''


def check_gh(args):
    index = 0
    while index < len(args) and args[index].startswith('-'):
        option = args[index].split('=', 1)[0]
        index += 2 if option in GH_OPTS_WITH_VALUE and '=' not in args[index] else 1
    if index < len(args) and args[index] == 'api':
        rest = args[index + 1:]
        # 붙여 쓴 꼴(-XPUT · -X=POST · --method=PATCH · -fquery=… · -Fhead=…)까지 본다
        method = ''
        for pos, token in enumerate(rest):
            if token in ('-X', '--method'):
                method = rest[pos + 1].upper() if pos + 1 < len(rest) else '?'
            elif token.startswith('--method='):
                method = token.split('=', 1)[1].upper()
            elif token.startswith('-X'):
                method = token[2:].lstrip('=').upper()
        writes = any(token.startswith(('-f', '-F', '--field', '--raw-field', '--input')) for token in rest)
        if (method and method != 'GET') or writes:
            return 'gh api 쓰기는 막는다 — PR 은 scripts/ship.sh 로. 읽기(GET)만 허용'
        return ''
    if index < len(args) and args[index] == 'pr':
        action = args[index + 1] if index + 1 < len(args) else ''
        if action in ('view', 'list', 'status', 'checks', 'diff'):
            return ''
        return 'PR 은 scripts/ship.sh 로만 만든다 — 사용자가 "PR 올려줘" 라고 했을 때: scripts/ship.sh --plan <계획서> --dir <워크트리> 로 미리보기부터'
    return ''


def check(text, depth=0):
    if depth > 5:
        return ''
    for inner in inner_commands(text):
        reason = check(inner, depth + 1)
        if reason:
            return reason
    for piece in split_pieces(text):
        tokens = strip_prefix(tokens_of(piece))
        if not tokens:
            continue
        name = os.path.basename(tokens[0])
        if name in ALLOWED_SCRIPTS:
            # 이 hermes 의 그 파일일 때만 통과 — ./ship.sh · /tmp/ship.sh 같은 같은 이름의 다른 파일은 막는다
            if os.path.realpath(os.path.join(cwd, tokens[0])) != ALLOWED_SCRIPTS[name]:
                return f'{name} 은 hermes 의 scripts/{name} 만 실행한다: {ALLOWED_SCRIPTS[name]}'
            if name == 'ship.sh' and any(token == '--repo-agent' or token.startswith('--repo-agent=') for token in tokens[1:]):
                return 'ship.sh --repo-agent 는 헤르메스 전용이다(여러 레포 작업의 순서 조율). 사용자에게 헤르메스에게 PR 을 요청해 달라고 알린다'
            continue
        # -c 는 -lc · -ec 처럼 다른 옵션과 묶여 올 수 있다
        flag = next((position for position, token in enumerate(tokens[1:], 1) if re.match(r'^-[A-Za-z]*c[A-Za-z]*$', token)), None) if name in SHELLS else None
        if flag is not None:
            position = flag
            if position + 1 < len(tokens):
                reason = check(tokens[position + 1], depth + 1)
                if reason:
                    return reason
            continue
        if name == 'git':
            reason = check_git(tokens[1:])
        elif name == 'gh':
            reason = check_gh(tokens[1:])
        else:
            reason = ''
        if reason:
            return reason
    return ''


reason = check(command)
if reason:
    print(f'⛔ 헤르메스 보호 훅: {reason}', file=sys.stderr)
    sys.exit(2)
sys.exit(0)
