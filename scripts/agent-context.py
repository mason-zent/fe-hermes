#!/usr/bin/env python3
"""워크트리에서 에이전트를 띄울 때 넘길 정의·공통 규칙 파일을 만든다 (delegate.sh 가 쓴다).

왜 필요한가: 워크트리는 그 자체가 별도 git 레포라 Claude Code 가 hermes 의
.claude/agents·.claude/rules·AGENTS.md 를 찾지 못한다(2026-09-23 실측 — `--agent 'reviewer' not found`).
그래서 에이전트 정의는 --agents JSON 으로, 공통 규칙은 --append-system-prompt-file 로 직접 넣는다.
워크트리가 hermes 안(.worktrees/)이면 반대로 상위의 CLAUDE.md(팀리드 역할)·AGENTS.md·rules 가
자동으로 딸려 와 규칙이 두 번 들어가고 "직접 코드를 쓰지 않는다"는 팀리드 지시까지 섞인다.
settings 의 claudeMdExcludes 로 그것들을 빼고 여기서 만든 컨텍스트만 한 번 넣는다.

사용: scripts/agent-context.py <에이전트명> <hermes 루트> <워크트리> <agents.json 출력> <context.md 출력> <settings.json 출력>
"""
import json, sys, pathlib

agent, hermes_dir, workdir, agents_out, context_out, settings_out = sys.argv[1:7]
hermes = pathlib.Path(hermes_dir).resolve()

# 에이전트 md 의 frontmatter(name/description/tools)와 본문을 나눈다
text = (hermes / ".claude/agents" / f"{agent}.md").read_text(encoding="utf-8")
_, front, body = text.split("---", 2)
meta = {}
for line in front.strip().splitlines():
    key, _, value = line.partition(":")
    meta[key.strip()] = value.strip()

definition = {"description": meta.get("description", ""), "prompt": body.strip()}
if meta.get("tools"):
    definition["tools"] = [tool.strip() for tool in meta["tools"].split(",") if tool.strip()]
pathlib.Path(agents_out).write_text(json.dumps({agent: definition}, ensure_ascii=False), encoding="utf-8")

# 공통 규칙: AGENTS.md + .claude/rules/*.md. CLAUDE.md 는 헤르메스(팀리드) 전용이라 넣지 않는다
parts = [
    "# 헤르메스 작업 컨텍스트 (워크트리 실행)",
    f"- 헤르메스 루트: `{hermes_dir}` — 아래 문서의 `docs/`, `scripts/`, `plans/` 상대 경로는 모두 여기 기준이다",
    f"- 작업 디렉토리(워크트리): `{workdir}` — 코드 변경은 여기서만 한다. 에이전트 프로필의 `repos/<레포>` 는 메인 체크아웃이므로 수정하지 않는다",
    "- 검증 스크립트는 헤르메스 루트의 `scripts/verify/*.sh` 를 절대 경로로 실행한다. "
    "환경변수 `HERMES_VERIFY_DIR` 가 이 워크트리를 가리키므로 워크트리가 검증된다",
    "",
    (hermes / "AGENTS.md").read_text(encoding="utf-8"),
]
for rule in sorted((hermes / ".claude/rules").glob("*.md")):
    parts += ["", rule.read_text(encoding="utf-8")]
pathlib.Path(context_out).write_text("\n".join(parts), encoding="utf-8")

# 상위 디렉터리에서 자동 로드되는 hermes 문서를 뺀다 (위 컨텍스트에 이미 들어 있다)
excludes = [str(hermes / "CLAUDE.md"), str(hermes / "AGENTS.md"), str(hermes / ".claude/rules/**")]
pathlib.Path(settings_out).write_text(json.dumps({"claudeMdExcludes": excludes}), encoding="utf-8")
