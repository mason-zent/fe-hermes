#!/usr/bin/env python3
"""첫 실행 점검 훅 (Claude Code SessionStart) — .claude/settings.json 이 헤르메스 세션에 건다.

repos/<레포> 링크가 hermes.config.json 목록대로 다 있으면 아무것도 하지 않는다.
빠진 게 있으면
  - 기본 레포 루트(reposRoot, 보통 hermes 상위 폴더)에서 찾은 것은 묻지 않고 scripts/setup.sh 로 바로 연결한다
  - 거기에도 없는 레포가 남으면 터미널 안내(systemMessage) + 헤르메스 지시(additionalContext) — 첫 응답에서 폴더 위치를 묻는다
FE 에이전트 세션(claude --agent)과 hermes 루트가 아닌 cwd(레포·워크트리)에서는 조용히 넘어간다.
어떤 오류가 나도 세션 시작을 막지 않는다(항상 exit 0).
"""
import json
import os
import subprocess
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    payload = {}

HERMES_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..'))


def main() -> None:
    # 헤르메스 세션만 — 에이전트 세션·다른 cwd 는 건너뛴다
    if payload.get('agent_type'):  # claude --agent 로 뜬 세션(실측 2026-09-30)
        return
    cwd = os.path.realpath(payload.get('cwd') or os.getcwd())
    if cwd != HERMES_DIR:
        return
    if payload.get('source') not in (None, 'startup', 'clear'):
        return

    with open(os.path.join(HERMES_DIR, 'hermes.config.json'), encoding='utf-8') as config_file:
        config = json.load(config_file)
    names = [repo['name'] for repo in config.get('repos', [])]

    def is_repo(path: str) -> bool:
        return os.path.exists(os.path.join(path, '.git'))

    missing = [name for name in names if not is_repo(os.path.join(HERMES_DIR, 'repos', name))]
    if not missing:
        return

    repos_root = config.get('reposRoot') or '..'
    if not os.path.isabs(repos_root):
        repos_root = os.path.join(HERMES_DIR, repos_root)
    repos_root = os.path.realpath(repos_root)
    found = [name for name in missing if is_repo(os.path.join(repos_root, name))]

    # 기본 위치에서 찾은 레포는 묻지 않고 바로 연결한다 — 사용자가 setup.sh 를 몰라도 되게
    messages = []
    if found:
        subprocess.run(['bash', os.path.join(HERMES_DIR, 'scripts', 'setup.sh')], cwd=HERMES_DIR,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=40, check=False)
        linked = [name for name in found if is_repo(os.path.join(HERMES_DIR, 'repos', name))]
        if linked:
            messages.append(f'🔗 레포 {len(linked)}개를 자동으로 연결했습니다 ({", ".join(linked)} → {repos_root})')
    still_missing = [name for name in names if not is_repo(os.path.join(HERMES_DIR, 'repos', name))]
    if not still_missing:
        print(json.dumps({'systemMessage': messages[0]}, ensure_ascii=False))
        return

    # 기본 위치에 없는 레포만 남았다 — 어디 있는지는 사용자만 안다
    messages.append(f'⚙️  {len(still_missing)}개 레포를 {repos_root} 에서 찾지 못했습니다 ({", ".join(still_missing)}). 아무 말이나 입력하면 헤르메스가 위치를 물어 연결합니다.')
    system_message = '\n'.join(messages)
    context = (
        f'[setup-check] repos/ 링크 점검: {repos_root} 에서 찾은 레포는 훅이 이미 scripts/setup.sh 로 자동 연결했다. '
        f'남은 {len(still_missing)}개는 그 위치에 없다 — {", ".join(still_missing)}. '
        '사용자의 첫 메시지가 무엇이든 그 작업보다 먼저 이것을 처리한다(환경 설정이라 계획서 없이 진행한다). 한 줄로 알리고 곧바로 AskUserQuestion 으로 묻는다 — '
        "질문 '이 레포들이 있는 폴더가 어디인가요?', header '레포 위치', 선택지: "
        "'폴더 경로 입력'(description 'Other 에 레포들이 나란히 있는 폴더 경로를 적어 주세요'), "
        "'아직 clone 안 함'(description 'clone 할 레포와 위치를 안내합니다'), '나중에'(description '지금은 건너뜀. 연결 안 된 레포의 에이전트는 동작하지 않음'). "
        '경로를 받으면 scripts/setup.sh --root <경로> 를 실행하고 ✔/✖ 줄을 요약한다. clone 은 사용자에게 묻고 한다. 끝나면 원래 요청으로 돌아간다. '
        "'나중에'면 더 묻지 않고 원래 요청을 진행하되, 연결 안 된 레포가 필요한 작업이면 그때 알린다."
    )
    print(json.dumps({
        'systemMessage': system_message,
        'hookSpecificOutput': {'hookEventName': 'SessionStart', 'additionalContext': context},
    }, ensure_ascii=False))


try:
    main()
except Exception:
    pass
sys.exit(0)
