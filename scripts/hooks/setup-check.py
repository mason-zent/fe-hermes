#!/usr/bin/env python3
"""첫 실행 점검 훅 (Claude Code SessionStart) — .claude/settings.json 이 헤르메스 세션에 건다.

repos/<레포> 링크가 hermes.config.json 목록대로 다 있으면 아무것도 하지 않는다.
빠진 게 있으면
  - 터미널에 한 줄 안내(systemMessage) — 아무 말이나 입력하면 헤르메스가 설정을 돕는다
  - 헤르메스 컨텍스트에 지시(additionalContext) — 첫 응답에서 scripts/setup.sh 실행 여부를 AskUserQuestion 으로 묻는다
FE 에이전트 세션(claude --agent)과 hermes 루트가 아닌 cwd(레포·워크트리)에서는 조용히 넘어간다.
어떤 오류가 나도 세션 시작을 막지 않는다(항상 exit 0).
"""
import json
import os
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
    first_run = len(missing) == len(names)

    headline = '헤르메스 초기 설정이 안 됐습니다' if first_run else f'연결 안 된 레포 {len(missing)}개가 있습니다'
    system_message = f'⚙️  {headline} ({", ".join(missing)}). 아무 말이나 입력하면 헤르메스가 scripts/setup.sh 실행을 도와드립니다.'

    context = (
        f'[setup-check] repos/ 링크 점검 결과: hermes.config.json 레포 {len(names)}개 중 {len(missing)}개가 연결되지 않았다 — {", ".join(missing)}. '
        f'기본 레포 루트 {repos_root} 에서 찾은 것: {", ".join(found) if found else "없음"} ({len(found)}/{len(missing)}). '
        '사용자의 첫 메시지가 무엇이든 그 작업보다 먼저 이것을 처리한다(환경 설정이라 계획서 없이 진행한다). 한 줄로 상황을 알리고 곧바로 AskUserQuestion 으로 묻는다 — '
        "질문 '레포 연결(scripts/setup.sh)을 지금 할까요?', header '초기 설정', 선택지: "
        + (f"'기본 위치로 연결 (Recommended)'(description '{repos_root} 에서 {len(found)}개 발견'), " if found else '')
        + "'다른 폴더 지정'(description 'Other 에 레포들이 있는 폴더 경로를 적어 주세요'), '나중에'(description '지금은 건너뜀. 연결 안 된 레포의 에이전트는 동작하지 않음'). "
        '기본 위치면 scripts/setup.sh, 경로를 받으면 scripts/setup.sh --root <경로> 를 실행하고 출력의 ✔/✖ 줄과 도구 점검을 그대로 요약한다. '
        '여전히 ✖ 인 레포는 clone 이 필요하다고 알린다(clone 은 사용자에게 묻고 한다). 끝나면 원래 요청으로 돌아간다. '
        "'나중에'를 고르면 더 묻지 않고 원래 요청을 진행하되, 연결 안 된 레포가 필요한 작업이면 그때 알린다."
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
