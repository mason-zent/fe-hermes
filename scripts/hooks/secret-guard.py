#!/usr/bin/env python3
"""시크릿 출력 차단 훅 (Claude Code PreToolUse · Bash) — 헤르메스·FE 에이전트·reviewer 모든 세션에 건다.

규칙: 토큰·키·비밀번호 값은 **어떤 경로로든 출력하지 않는다** (AGENTS.md 5절). 2026-10-01 에이전트가
`pnpm config get` 으로 사용자 전역 ~/.npmrc 토큰을 터미널에 찍은 사고 뒤에 넣었다.

막는 것
  - 패키지 매니저 설정 출력: npm|pnpm|yarn config get|list|ls (… 토큰이 섞여 나온다), npm|pnpm config 로 _authToken 조회
  - 시크릿 파일 읽기: git show·cat-file·diff·log·blame·grep · cat·head·tail·less·more·bat·grep·rg·awk·sed·strings·xxd·od·nl·cut·sort·jq·base64·open 이
    .npmrc · .env* · *.pem · *.key · id_rsa* · .netrc · .aws/credentials · gh/hosts.yml · firebase-key.json · access-key.js 를 읽는 것
    (값을 가리는 sed 치환 's/…=.*/…***/' 이 같은 명령에 있으면 통과)
  - 환경 변수 통째로 출력: printenv · env(인자 없이) · export -p · set(인자 없이) · declare -x
  - 토큰 변수 출력: echo/printf 에 $…TOKEN·KEY·SECRET·PASSWORD·PASS·AUTH… 가 들어간 것
  - 자격 증명 꺼내기: gh auth token · gh auth status -t/--show-token · git credential fill · security find-*-password -w
  - 프로세스 전체 인자·환경 변수: pgrep -fl/-a · ps aux/-ef/-e/-E/eww/-o command|args (편집기 helper 인자에 GITHUB_TOKEN=… 이 실린다 — 2026-10-02 사고)
확인이 필요하면 값 대신 **있는지·길이·해시 앞자리·HTTP 상태 코드**만 본다(예: curl -s -o /dev/null -w '%{http_code}').
실수 방지용이지 보안 경계가 아니다 — 스크립트 파일 안의 명령까지 보지는 않는다. 막으면 exit 2 (stderr 가 에이전트에게 간다).
"""
import json
import re
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)
command = (payload.get('tool_input') or {}).get('command') or ''
if not command.strip():
    sys.exit(0)

# heredoc 본문(<<'EOF' … EOF)과 작은따옴표 안은 실행되지 않는 글자다 — 규칙 문장·커밋 메시지에 'pnpm config get' 이 적혀 있어도 막지 않게 지운다.
# 큰따옴표 안은 남긴다($TOKEN 이 펼쳐지고, "~/.npmrc" 처럼 경로를 감쌀 수 있다)
def strip_inert(source):
    lines, out, end_tag = source.split('\n'), [], None
    for line in lines:
        if end_tag is not None:
            if line.strip() == end_tag:
                end_tag = None
            continue
        match = re.search(r"<<-?\s*['\"]?(\w+)['\"]?", line)
        if match:
            end_tag = match.group(1)
        out.append(line)
    return re.sub(r"'[^']*'", "''", '\n'.join(out))


text = strip_inert(command)
SECRET_FILE = r"(\.npmrc\b|\.env(\.[\w.-]+)?\b|\.pem\b|\.key\b|id_rsa\w*|id_ed25519\w*|\.netrc\b|\.aws/credentials|gh/hosts\.yml|firebase-key\.json|access-key\.js)"
READERS = r"(\bgit\s+(show|cat-file|diff|log|blame|grep)\b|\b(cat|head|tail|less|more|bat|grep|egrep|rg|awk|sed|strings|xxd|od|hexdump|nl|cut|sort|uniq|jq|base64|open|tac|view|vim?|nano)\b)"
SECRET_VAR = r"\$\{?\w*(TOKEN|KEY|SECRET|PASSWORD|PASSWD|PASS|AUTH|CREDENTIAL)\w*\}?"
# 가리는 sed 치환은 보통 작은따옴표 안에 있다 — 원래 명령에서 찾는다
MASKED = re.search(r"s[/|#][^/|#]*(=|:)\)?\.\*[/|#][^/|#]*(\*{3}|MASK|숨김|<redacted>)", command)

rules = [
    (r"\b(npm|pnpm|yarn)\s+config\s+(get|list|ls)\b", "패키지 매니저 설정 출력(config get/list)은 토큰을 찍는다"),
    (r"\bnpm\s+whoami\b.*--verbose", "npm whoami --verbose 는 토큰을 찍을 수 있다"),
    (r"\b(printenv)\b", "환경 변수를 통째로 출력한다"),
    (r"(^|[;&|(]\s*)env\s*($|[;&|)])", "환경 변수를 통째로 출력한다"),
    (r"\bexport\s+-p\b|\bdeclare\s+-x\b|(^|[;&|(]\s*)set\s*($|[;&|)])", "환경 변수를 통째로 출력한다"),
    (rf"\b(echo|printf)\b[^;&|]*{SECRET_VAR}", "토큰·키 변수를 출력한다"),
    (r"\bgh\s+auth\s+token\b|\bgh\s+auth\s+status\b[^;&|]*(-t\b|--show-token)", "GitHub 토큰을 꺼낸다"),
    (r"\bgit\s+credential\s+fill\b", "git 자격 증명을 꺼낸다"),
    (r"\bsecurity\s+find-\w+-password\b[^;&|]*-w\b", "키체인 비밀번호를 꺼낸다"),
    # 프로세스 목록의 전체 인자·환경 변수 — 편집기 helper 등은 인자에 환경 변수(GITHUB_TOKEN=…)를 통째로 싣는다(2026-10-02 pgrep -fl 사고)
    (r"\bpgrep\b[^;&|]*\s-(\w*l\w*f|\w*f\w*l|\w*a)\w*\b|\bpgrep\b[^;&|]*\s-\w*l\w*\b[^;&|]*\s-\w*f|\bpgrep\b[^;&|]*\s-\w*f\w*\b[^;&|]*\s-\w*l", "프로세스 전체 인자를 출력한다(환경 변수·토큰이 섞여 나온다) — pid 만 pgrep -f, 이름은 ps -o pid=,comm="),
    # macOS ps: -e/-E 환경 변수, -f/-j·BSD u 전체 인자, -o command|args 전체 인자
    (r"\bps\b[^;&|]*(\s-[a-zA-Z]*[eEfj][a-zA-Z]*\b|\s-[a-zA-Z]*o\s*\S*\b(command|args|cmd)\b)|\bps\s+[a-zA-Z]*[eu][a-zA-Z]*\b","프로세스 전체 인자·환경 변수를 출력한다 — ps -axo pid=,ppid=,comm= 처럼 명령 이름만 본다"),
]
for pattern, reason in rules:
    if re.search(pattern, text):
        sys.stderr.write(f"⛔ 시크릿 출력 차단: {reason}.\n토큰·키 값은 어떤 경로로든 출력하지 않는다(AGENTS.md 5절). 필요하면 있는지·길이·HTTP 상태 코드만 확인한다 — 예: curl -s -o /dev/null -w '%{{http_code}}' …\n")
        sys.exit(2)

# 시크릿 파일을 읽는 명령 — 같은 조각에 읽는 도구와 시크릿 파일이 함께 있으면 막는다(값을 가리는 sed 치환이 있으면 통과)
# 공백이 든 큰따옴표 문장(지시문·커밋 메시지)은 파일 경로가 아니다 — "…git grep … .npmrc 값은 출력하지 않는다…" 같은 글자를 읽기로 보지 않게 뺀다.
# 공백 없는 큰따옴표("$HOME/.npmrc")는 경로일 수 있어 남긴다
file_text = re.sub(r'"[^"]*\s[^"]*"', '""', text)
for piece in re.split(r"[;&|\n]+", file_text):
    # git 제외 pathspec(':!.npmrc' · ':(exclude).env') 는 읽는 게 아니라 빼는 것 — 지우고 본다
    piece = re.sub(r"[\"']?:(!|\(exclude\))[^\s\"']+[\"']?", ' ', piece)
    if re.search(READERS, piece) and re.search(SECRET_FILE, piece) and not MASKED:
        # .env.example · .env.sample 같은 예시 파일은 통과
        if re.search(r"\.env\.(example|sample|template)\b", piece) and not re.search(r"\.npmrc|\.pem|\.key|id_rsa|\.netrc|credentials|hosts\.yml|firebase-key|access-key", piece):
            continue
        sys.stderr.write("⛔ 시크릿 출력 차단: 시크릿 파일(.npmrc·.env·키 파일 등) 내용을 읽어 출력한다.\n값을 봐야 하면 sed 's/_authToken=.*/_authToken=***/' 처럼 가린 뒤 보거나, 있는지·참조 형태(${…})인지만 확인한다(AGENTS.md 5절).\n")
        sys.exit(2)
sys.exit(0)
