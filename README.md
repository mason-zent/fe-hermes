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
| `bznav-rn-app` | bznav-rn-app | 비즈넵 모바일 앱 (Expo · React Native, 기준 브랜치 prd) |
| `reviewer` | 전체 (읽기 전용) | 계획서 대비 검증, 교차 정합성 |

담당 레포는 `hermes.config.json`에 목록이 있고, 문서·스크립트는 모두 `repos/<레포>` 심볼릭 링크로 접근한다. 링크는 `scripts/setup.sh`가 만든다(기본: hermes 상위 폴더에 레포들이 나란히 있다고 가정, 다르면 `--root <경로>`). `repos/`는 gitignore라 팀원마다 배치가 달라도 문서는 그대로 쓴다. **직접 돌릴 필요는 없다** — `claude` 를 켤 때 SessionStart 훅(`scripts/hooks/setup-check.py`)이 빠진 링크를 찾아 기본 위치에서 알아서 연결하고, 거기에도 없는 레포가 있을 때만 헤르메스가 위치를 묻는다.

## 시작하기
> 처음 받는 팀원은 **`ONBOARDING.md`** (준비물 · 설치 · 첫 사용 · 막힐 때) 부터.

```bash
git clone https://github.com/mason-zent/fe-hermes.git
cd fe-hermes
claude                      # 켤 때 repos/<레포> 링크를 알아서 연결한다 (수동: scripts/setup.sh [--root <경로>])
```
- 그냥 말하기 — "refund·hub 에 공지 배너 똑같이 넣어줘", "환급 콘솔 페이지네이션 버그 원인 찾아줘" → 헤르메스가 라우팅 → 계획서 → 승인 → 디스패치 → 리뷰 → 보고
- `/call 에이전트` — 담당 에이전트를 pane 으로 바로 띄운다. 브랜치 이름은 에이전트가 물어 워크트리를 만들고, 요청·"커밋해줘"·"리뷰해줘"·"PR 올려줘" 까지 그 pane 에서 끝낸다(빈 지시 경량 계획서)
- 리뷰·현황·브랜치도 말로 — "refund 변경 리뷰해줘", "현황 알려줘" (헤르메스가 `docs/knowledge/common/git.md` 절차대로)
- `/monitor` — 백그라운드 서브에이전트·워크트리 pane 에이전트 로그를 pane 에 실시간 표시 (`/monitor 30` = 최근 30분)
- `/board` — 현황판. 로컬 서버(`localhost:4700`)를 띄워 브라우저에서 실시간으로 본다 — 지금 동작 중인 에이전트, 계획서 칸반(계획·진행 중·리뷰·완료), `issues/` 의 이슈. 카드를 끌어 상태를 바꾸고 버튼으로 헤르메스에게 지시를 보낸다
- `/sync` — 담당 레포의 운영 기준 브랜치를 읽어 지문을 만들고, 사실마다 정한 정본(knowledge·config·지문)만 갱신. 파생 문서(서비스 맵 스택 표·플레이북 기준 커밋 표)는 `node scripts/build-derived.mjs`가 생성. baseline은 `.sync/snapshots/`. 다이어그램 근거 점검은 `node scripts/check-diagrams.mjs`
- `/diagram` — 다이어그램 다시 그리기. 서비스를 주면(`/diagram brand`) 그 서비스만, 비우면 전체. 운영 기준 코드로 그리고 검증·목록 갱신, 그리다 찾은 문제는 `issues/` 등록. `/diagram 점검` 은 근거만 점검
- `/seo-feedback` — 슬랙 SEO Health 봇 리포트를 직전 리포트와 비교해 서비스당 SEO 이슈 하나를 갱신(슬랙에는 보내지 않음). 매주 월 08:15 자동(`scripts/seo-feedback.sh install` 한 맥에서만)
- `/qa-tc 앱` — 그 앱 담당 에이전트가 레포 코드를 읽어 QA TC 목록(`docs/qa/tc/<앱>.md`)을 쓰거나 갱신한다. `/qa-tc refund-web #1234` 처럼 브랜치·PR 을 주면 그 변경 때문에 바뀌어야 할 TC 만. 자동화할 TC 는 흐름 씬 초안(`_draft/`)까지
- `/guide` — 오른쪽 pane 에 가이드 메뉴(스킬 목록·실행 · 에이전트/라우팅 · git 현황 · 문서, herdr / tmux). `/guide 그림`은 다이어그램 목록(`docs/diagrams/index.html`)을 브라우저로 연다 — 작업 흐름 + 담당 서비스 10개 × 구조·화면 맵·요청 흐름, 비즈넵 웹 5개와 모바일 앱은 심층 추가. `/guide 열기`는 `docs/playbook.html`을 브라우저로

에이전트를 직접 부를 수도 있다: "hub-fe로 메시지 큐 화면 컬럼 하나 추가해줘" (계획서 규칙은 헤르메스가 판단).

## 구조
```
AGENTS.md                 **공통 규칙·지식 진입점 (도구 무관 — Codex 등도 이걸 읽는다)**
CLAUDE.md                 @AGENTS.md import + Claude Code 전용(서브에이전트·스킬·Plan-First)
hermes.config.json        담당 레포 목록·브랜치·에이전트 매핑 (정본)
repos/                    레포 심볼릭 링크 (scripts/setup.sh 생성, gitignore)
.claude/agents/           서브에이전트 13개
.claude/rules/            언어·코드·Git·디스패치 규칙
.claude/skills/           /call /board /sync /diagram /guide /monitor /seo-feedback /qa-tc
.sync/snapshots/          레포별 기준 브랜치 지문 baseline (/sync 가 비교 기준으로 사용)
docs/diagrams/            다이어그램 (Archify 생성. index.html 이 목록, 원본은 *.json, 재생성법은 그 폴더 README)
docs/services.md          서비스 비교표
docs/knowledge/           지식 베이스: common/(팀 공통 규칙) · <레포>/rules.md(레포 규칙) · 레포 지식 (README.md 참고)
docs/extending.md         스킬·에이전트 추가 방법 (/guide)
docs/plan-template*      계획서 템플릿 (정식 md + 결정 콘솔 html · 경량 md)
plans/{feature,bugfix,refactor,archive}/   작업계획서 (gitignore)
issues/                   sync·다이어그램·리뷰에서 찾은 이슈 — 한 이슈 = 파일 하나 (형식은 그 폴더 README). 현황판 이슈 칸
scripts/setup.sh          팀원 최초 설정 (repos/ 링크 + 도구 점검)
scripts/verify/<레포>.sh   표준 검증 스크립트 (에이전트·reviewer 공용, 표 요약 출력)
scripts/delegate.sh       위임을 herdr pane 에서 보이게 실행 (claude --agent <이름>)
scripts/agent-monitor.py  서브에이전트·pane 에이전트 로그 실시간 모니터 (렌더러)
scripts/monitor-pane.sh   모니터를 pane 에 띄움·재사용 (/monitor)
scripts/board.sh          현황판 서버를 pane 에 띄우고 브라우저로 연다 (/board). 서버·화면은 scripts/board/
scripts/archive-plans.sh  오래된 계획서 정리
scripts/seo-feedback.sh   /seo-feedback 헤드리스 실행 · 매주 월 08:15 launchd 등록(install/uninstall/status)
scripts/guide-pane.sh     오른쪽 pane 을 열어 메뉴 또는 파일을 띄움 (/guide)
scripts/guide-menu.sh     선택형 가이드 메뉴 (스킬 목록·실행 · 라우팅 · git 현황 · 문서)
scripts/mdview.py         터미널 마크다운 뷰어 (의존성 없음, glow 없을 때 사용)
scripts/new-branch.sh         작업 브랜치·워크트리 생성 (헤르메스 3단계 · /call 에이전트가 호출)
scripts/wt-copy-local.sh      워크트리에 메인 체크아웃의 git 무시 로컬 파일(.env·.aws 키) 복사 (new-branch.sh 가 호출 · --all)
scripts/commit.sh             에이전트 로컬 커밋 ("커밋해줘" — 지정 파일만·엄격 검증·계획서 기록)
scripts/ship.sh               push + draft PR ("PR 올려줘" — 미리보기 → 확인 → 공통 제목·본문 형식, 레포 하나짜리 작업만)
scripts/statusline.sh         pane 하단 상태바 (레포·브랜치·변경 개수). 표시 규칙은 docs/playbook.html
scripts/sync-fingerprint.mjs  기준 브랜치 지문 생성·비교 (/sync 가 호출)
```

## 확장하기
상세는 `docs/extending.md` (터미널에서 `/guide`).
- **스킬 추가**: `.claude/skills/<이름>/SKILL.md` 하나 만들면 `/<이름>`으로 바로 뜬다. frontmatter에 `name`, `description`, 필요하면 `argument-hint`를 두고, 본문에서 `$ARGUMENTS`로 인자를 받는다. 기존 `call/SKILL.md`를 복사해서 고치는 게 가장 빠르다.
- **에이전트 추가**: `.claude/agents/<이름>.md`. frontmatter의 `description`이 헤르메스가 라우팅할 때 읽는 문장이니 "어떤 요청이면 이 에이전트"를 구체적으로 적는다. description 안에 콜론+공백(`: `)이 들어가면 YAML이 깨진다.
- **같이 갱신할 곳**: 스킬이나 에이전트를 추가하면 `CLAUDE.md`의 팀 표·Skills 표, **`AGENTS.md`**, 이 README, `docs/playbook.html`도 손본다. `/sync`는 레포 쪽 변화만 반영하고 hermes 자체 구조 변화는 잡지 않으니, 헤르메스에게 "방금 추가한 스킬 문서에도 반영해줘"라고 하면 된다.
