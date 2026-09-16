# Hermes — FE 에이전트 팀 워크스페이스

Claude Code 기반 **프론트엔드 멀티 서비스 에이전트 팀**. 이 폴더에서 Claude Code를 열면 **헤르메스**(Plan-First 팀 리드)가 되고, 서비스별 FE 에이전트에게 작업을 배분한다.

## 팀

| 에이전트 | 담당 레포 | 서비스 |
|---|---|---|
| `refund-fe` | client-brics-refund | BRICS 환급 운영 콘솔 |
| `hub-fe` | client-brics-hub | BRICS Hub 콘솔 (권한·메뉴·리소스·감사·메시지) |
| `bznav-fe` | bznav-web | 비즈넵 사용자향 웹 모노레포 |
| `op-fe` | web-op | Z-Enterprise 운영 웹 (영업·서류·직원) |
| `reviewer` | 전체 (읽기 전용) | 계획서 대비 검증, 교차 정합성 |

레포 경로는 `/Users/mason/mason-zent/<레포>`로 하드코딩되어 있다. 위치가 바뀌면 `CLAUDE.md`, `docs/services.md`, `.claude/agents/*.md`, `.claude/skills/status/SKILL.md`의 경로를 함께 바꾼다.

## 사용
```bash
cd /Users/mason/mason-zent/hermes
claude
```
- `/feature 기능 설명` — 계획서 → 승인 → 병렬 디스패치 → 리뷰 → 보고
- `/bugfix 버그 설명`
- `/review 대상`
- `/status`
- `/sync` — 4개 레포 `origin/dev`를 읽어 에이전트 md·서비스 맵·플레이북을 갱신. baseline은 `.sync/snapshots/`
- `/guide` — 사용·확장 가이드를 터미널에 표시. `/guide pane`은 오른쪽 pane에 선택형 메뉴(문서 보기·스킬/에이전트 템플릿 생성·새 pane에서 헤르메스 실행)를 띄움(herdr / tmux), `/guide 열기`는 `docs/playbook.html`을 브라우저로

에이전트를 직접 부를 수도 있다: "hub-fe로 메시지 큐 화면 컬럼 하나 추가해줘" (계획서 규칙은 헤르메스가 판단).

## 구조
```
CLAUDE.md                 헤르메스 역할·라우팅·작업 흐름
.claude/agents/           서브에이전트 5개
.claude/rules/            언어·코드·Git·디스패치 규칙
.claude/skills/           /feature /bugfix /review /status /sync /guide
.sync/snapshots/          레포별 origin/dev 지문 baseline (/sync 가 비교 기준으로 사용)
docs/services.md          4개 서비스 비교표
docs/extending.md         스킬·에이전트 추가 방법 (/guide)
docs/plan-template.*      계획서 템플릿 (md + 결정 콘솔 html)
plans/{feature,bugfix,refactor,archive}/   작업계획서 (gitignore)
scripts/archive-plans.sh  오래된 계획서 정리
scripts/guide-pane.sh     오른쪽 pane 을 열어 메뉴 또는 파일을 띄움 (/guide pane)
scripts/guide-menu.sh     선택형 가이드 메뉴 (클릭 또는 ↑↓ + Enter 로 실행)
scripts/sync-fingerprint.mjs  origin/dev 지문 생성·비교 (/sync 가 호출)
```

## 확장하기
상세는 `docs/extending.md` (터미널에서 `/guide`).
- **스킬 추가**: `.claude/skills/<이름>/SKILL.md` 하나 만들면 `/<이름>`으로 바로 뜬다. frontmatter에 `name`, `description`, 필요하면 `argument-hint`를 두고, 본문에서 `$ARGUMENTS`로 인자를 받는다. 기존 `feature/SKILL.md`를 복사해서 고치는 게 가장 빠르다.
- **에이전트 추가**: `.claude/agents/<이름>.md`. frontmatter의 `description`이 헤르메스가 라우팅할 때 읽는 문장이니 "어떤 요청이면 이 에이전트"를 구체적으로 적는다. description 안에 콜론+공백(`: `)이 들어가면 YAML이 깨진다.
- **같이 갱신할 곳**: 스킬이나 에이전트를 추가하면 `CLAUDE.md`의 팀 표·Skills 표, 이 README, `docs/playbook.html`도 손본다. `/sync`는 레포 쪽 변화만 반영하고 hermes 자체 구조 변화는 잡지 않으니, 헤르메스에게 "방금 추가한 스킬 문서에도 반영해줘"라고 하면 된다.
