# Hermes — FE 에이전트 팀 워크스페이스

Claude Code 기반 **프론트엔드 멀티 서비스 에이전트 팀**. 이 폴더에서 Claude Code를 열면 **헤르메스**(Plan-First 팀 리드)가 되고, 서비스별 FE 에이전트에게 작업을 배분한다.

## 팀

| 에이전트 | 담당 레포 | 서비스 |
|---|---|---|
| `refund-fe` | client-brics-refund | BRICS 환급 운영 콘솔 |
| `hub-fe` | client-brics-hub | BRICS Hub 콘솔 (권한·메뉴·리소스·감사·메시지) |
| `care-fe` | client-brics-care | BRICS 케어 운영 콘솔 (구독·결제·프로모션·QA) |
| `op-fe` | web-op | Z-Enterprise 운영 웹 (영업·서류·직원) |
| `bznav-refund-fe` / `bznav-care-fe` / `bznav-brand-fe` / `bznav-sena-fe` / `bznav-plus-fe` | bznav-web `apps/<앱>` | 비즈넵 사용자향 웹 (앱마다 에이전트 1개) |
| `bznav-packages-fe` | bznav-web `packages/*` | 비즈넵 공통 패키지 `@repo/*` |
| `packages-fe` | zent-packages `frontend/` | 발행 공유 패키지 `@zenterprise-inc/*-fe-*` (기준 브랜치 main) |
| `reviewer` | 전체 (읽기 전용) | 계획서 대비 검증, 교차 정합성 |

담당 레포는 `hermes.config.json`에 목록이 있고, 문서·스크립트는 모두 `repos/<레포>` 심볼릭 링크로 접근한다. 링크는 `scripts/setup.sh`가 만든다(기본: hermes 상위 폴더에 레포들이 나란히 있다고 가정, 다르면 `--root <경로>`). `repos/`는 gitignore라 팀원마다 배치가 달라도 문서는 그대로 쓴다.

## 시작하기
```bash
git clone https://github.com/mason-zent/fe-hermes.git
cd fe-hermes
scripts/setup.sh            # repos/<레포> 링크 생성 + 도구 점검 (레포가 다른 곳이면 --root <경로>)
claude
```
- `/feature 기능 설명` — 계획서 → 승인 → 병렬 디스패치 → 리뷰 → 보고
- `/bugfix 버그 설명`
- `/review 대상`
- `/status` — repos/ 에 연결된 레포 전체 현황
- `/monitor` — 백그라운드 서브에이전트 로그를 pane 에 실시간 표시 (`/monitor 30` = 최근 30분)
- `/sync` — 담당 레포의 `origin/<branch>`를 읽어 에이전트 md·서비스 맵·플레이북을 갱신. baseline은 `.sync/snapshots/`
- `/guide` — 사용·확장 가이드를 터미널에 표시. `/guide pane`은 오른쪽 pane에 선택형 메뉴(스킬 목록·실행 · 에이전트/라우팅 · git 현황 · 문서)를 띄움(herdr / tmux), `/guide 열기`는 `docs/playbook.html`을 브라우저로

에이전트를 직접 부를 수도 있다: "hub-fe로 메시지 큐 화면 컬럼 하나 추가해줘" (계획서 규칙은 헤르메스가 판단).

## 구조
```
AGENTS.md                 **공통 규칙·지식 진입점 (도구 무관 — Codex 등도 이걸 읽는다)**
CLAUDE.md                 @AGENTS.md import + Claude Code 전용(서브에이전트·스킬·Plan-First)
hermes.config.json        담당 레포 목록·브랜치·에이전트 매핑 (정본)
repos/                    레포 심볼릭 링크 (scripts/setup.sh 생성, gitignore)
.claude/agents/           서브에이전트 12개
.claude/rules/            언어·코드·Git·디스패치 규칙
.claude/skills/           /feature /bugfix /review /status /sync /guide
.sync/snapshots/          레포별 기준 브랜치 지문 baseline (/sync 가 비교 기준으로 사용)
docs/services.md          서비스 비교표
docs/knowledge/           지식 베이스: common/(팀 공통 규칙) · <레포>/rules.md(레포 규칙) · 레포 지식 (README.md 참고)
docs/extending.md         스킬·에이전트 추가 방법 (/guide)
docs/plan-template.*      계획서 템플릿 (md + 결정 콘솔 html)
plans/{feature,bugfix,refactor,archive}/   작업계획서 (gitignore)
scripts/setup.sh          팀원 최초 설정 (repos/ 링크 + 도구 점검)
scripts/verify/<레포>.sh   표준 검증 스크립트 (에이전트·reviewer 공용, 표 요약 출력)
scripts/delegate.sh       위임을 herdr pane 에서 보이게 실행 (claude --agent <이름>)
scripts/agent-monitor.py  백그라운드 서브에이전트 로그 실시간 모니터 (렌더러)
scripts/monitor-pane.sh   모니터를 pane 에 띄움·재사용 (/monitor)
scripts/archive-plans.sh  오래된 계획서 정리
scripts/guide-pane.sh     오른쪽 pane 을 열어 메뉴 또는 파일을 띄움 (/guide pane)
scripts/guide-menu.sh     선택형 가이드 메뉴 (스킬 목록·실행 · 라우팅 · git 현황 · 문서)
scripts/mdview.py         터미널 마크다운 뷰어 (의존성 없음, glow 없을 때 사용)
scripts/sync-fingerprint.mjs  기준 브랜치 지문 생성·비교 (/sync 가 호출)
```

## 확장하기
상세는 `docs/extending.md` (터미널에서 `/guide`).
- **스킬 추가**: `.claude/skills/<이름>/SKILL.md` 하나 만들면 `/<이름>`으로 바로 뜬다. frontmatter에 `name`, `description`, 필요하면 `argument-hint`를 두고, 본문에서 `$ARGUMENTS`로 인자를 받는다. 기존 `feature/SKILL.md`를 복사해서 고치는 게 가장 빠르다.
- **에이전트 추가**: `.claude/agents/<이름>.md`. frontmatter의 `description`이 헤르메스가 라우팅할 때 읽는 문장이니 "어떤 요청이면 이 에이전트"를 구체적으로 적는다. description 안에 콜론+공백(`: `)이 들어가면 YAML이 깨진다.
- **같이 갱신할 곳**: 스킬이나 에이전트를 추가하면 `CLAUDE.md`의 팀 표·Skills 표, 이 README, `docs/playbook.html`도 손본다. `/sync`는 레포 쪽 변화만 반영하고 hermes 자체 구조 변화는 잡지 않으니, 헤르메스에게 "방금 추가한 스킬 문서에도 반영해줘"라고 하면 된다.
