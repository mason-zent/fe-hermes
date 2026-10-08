# Hermes — FE 에이전트 팀 워크스페이스

Claude Code 위에 만든 **프론트엔드 멀티 레포 팀 리드**. 이 폴더에서 `claude` 를 켜면 **헤르메스**가 되어, 요청을 받아 어느 레포 일인지 고르고 → 계획서를 쓰고 → 담당 FE 에이전트에게 맡기고 → 리뷰까지 받아 보고한다.

> 처음이면 **`ONBOARDING.md`**(화면: `/guide 시작하기`) · 그림으로 보는 사용법은 `docs/playbook.html`(`/guide 열기`)
> Nous Research 의 오픈소스 Hermes Agent 와는 이름만 같은 다른 것이다 — 따로 설치하지 않는다.

## 한눈에

```
 사용자: "브릭스 환급 프로모션 페이지 고쳐줘"
   │
   ▼
 [헤르메스]
   ① 어느 레포?  "브릭스" = 운영 콘솔 · "비즈넵" = 사용자 웹 · 없으면 되묻기
   ② 계획서      경량(바로 진행) / 정식(결정 콘솔 → [이대로 진행])
   ③ 브랜치      prBase 에서 워크트리 .worktrees/<레포>/<브랜치>
   │
   ▼
 [담당 에이전트 · 옆 pane]
   작업 → 검증 → 자동 리뷰 → "커밋해줘" → "PR 올려줘"
   │                                        │
   │ 작업 끝·교정·같은 오류 3회               │ PR 머지
   │                                        ▼
   │                               [배우기 검토자]
   ▼                                        │
 학습 후보 ◀────────────────────────────────┘
   │
   ▼
 [현황판 /board]  서비스 · 정비 · QA · 학습 · 아카이브
   │
   └─ [학습] 탭에서 [넣기] → 레포 공책(gotchas.md) → 다음 작업이 읽는다
```

## 팀

| 에이전트 | 담당 레포 | 서비스 |
|---|---|---|
| `brics-refund-fe` | client-brics-refund | 브릭스 환급 운영 콘솔 |
| `brics-hub-fe` | client-brics-hub | 브릭스 Hub 콘솔 (권한·메뉴·리소스·감사·메시지) |
| `brics-care-fe` | client-brics-care | 브릭스 케어 운영 콘솔 (구독·결제·프로모션·QA) |
| `op-fe` | web-op | Z-Enterprise 운영 웹 (영업·서류·직원) |
| `bznav-{refund,care,brand,sena,plus}-fe` | bznav-web `apps/<앱>` | 비즈넵 사용자 웹 (앱마다 1개) |
| `bznav-packages-fe` | bznav-web `packages/*` | 비즈넵 공통 패키지 `@repo/*` |
| `packages-fe` | zent-packages `frontend/` | 발행 공유 패키지 `@zenterprise-inc/*-fe-*` |
| `bznav-rn-app` | bznav-rn-app | 비즈넵 모바일 앱 (Expo · React Native) |
| `reviewer` | 전체 (읽기 전용) | 계획서 대비 검증 · 교차 정합성 |
| `learn-reviewer` | 끝난 작업 (읽기 전용) | 배우기 검토자 — 직접 부르지 않음, 내 PR 이 머지되면 돈다 |

레포 목록·기준 브랜치의 정본은 `hermes.config.json`. 레포는 `repos/<레포>` 링크로 접근하고, `claude` 를 켤 때 옆 폴더에서 알아서 연결한다.

## 시작하기

```bash
git clone https://github.com/mason-zent/fe-hermes.git
cd fe-hermes
claude              # 레포 연결은 자동 · QA 시뮬레이션을 쓸 때만 한 번 scripts/setup.sh
```

| 이렇게 하면 | 일어나는 일 |
|---|---|
| 그냥 말하기 — "브릭스 환급 페이지네이션 버그 원인 찾아줘" | 헤르메스가 라우팅 → 계획서 → 디스패치 → 리뷰 → 보고 |
| `/call <에이전트>` | 담당 에이전트를 pane 에 바로. 요청·"커밋해줘"·"PR 올려줘" 까지 그 pane 에서 |
| `/board` | 현황판(`localhost:4700`) — 서비스 · 정비 · QA · 학습 · 아카이브 |
| `/guide` | 가이드 메뉴 — 스킬 · 에이전트·라우팅 · git 현황 · 시작하기 · 플레이북 · 다이어그램 |
| `/monitor` | 백그라운드·pane 에이전트 로그 실시간 |
| `/sync` | 운영 브랜치를 읽어 지식 문서 갱신 (가끔, 한 사람이) |
| `/diagram` | 서비스 다이어그램 다시 그리기 |
| `/qa-tc <앱>` | 비즈넵 웹 QA TC 목록 작성·갱신 |
| `/seo-feedback` | 슬랙 SEO 리포트 → 서비스별 SEO 이슈 (매주 월 자동) |
| "현황 알려줘" · "리뷰해줘" · "○○ 전체 검수 돌려줘" | 말로 하는 것 |

## 학습

```
 작업한 에이전트 ── 작업 끝 · 교정 · 같은 오류 3회 ──┐
                                                  ├─▶ 학습 후보
 배우기 검토자 ──── 내 PR 머지 뒤                  │      │
                  (계획서·대화·바뀐 코드·리뷰 댓글) ┘      ▼
                                         현황판 [학습] 탭 — 사람이 [넣기]
                                                  │
                                                  ▼
                              레포 공책 gotchas.md (git 으로 팀 공유)
                                                  │
                                                  ▼
                                       다음 작업이 시작 전에 읽는다
```

다시 마주치고 · 모르면 실제로 잘못되고 · 코드만 봐서는 모르는 **코드 함정**만, 근거가 코드·실행 결과일 때만. 취향은 공용 공책에 넣지 않는다(Claude 메모리 몫). 기준 정본 `docs/knowledge/common/learning.md` · 채점 `node scripts/learn-eval.mjs`

## 구조

```
hermes/
├── AGENTS.md                  공통 규칙·지식 진입점 (Codex 등 다른 도구도 읽는다)
├── CLAUDE.md                  Claude Code 전용 — 헤르메스 역할 · 에이전트 · 스킬 · 흐름
├── ONBOARDING.md              시작하기 가이드
├── hermes.config.json         담당 레포 · 기준 브랜치 · 에이전트 매핑 (정본)
│
├── .claude/
│   ├── agents/                에이전트 14개 (역할·담당 범위·지식 진입점)
│   ├── rules/                 언어 · 코드 · Git · 디스패치 규칙
│   └── skills/                /call /board /sync /diagram /guide /monitor /seo-feedback /qa-tc
│
├── docs/
│   ├── knowledge/             지식 노트 — 에이전트가 일할 때 읽는다
│   │   ├── common/            팀 공통 (coding · git · verify · reporting · learning)
│   │   ├── <레포>/            rules · structure · patterns · workflows · gotchas(공책)
│   │   ├── hermes/            헤르메스 자체 함정 공책
│   │   └── learned/           학습한 내용의 쉬운 설명 기록
│   ├── playbook.html          그림으로 보는 사용법 (/guide 열기)
│   ├── onboarding.html        시작하기 화면 (/guide 시작하기)
│   ├── diagrams/              작업 흐름 · 서비스별 구조·화면 맵·요청 흐름 (/guide 그림)
│   ├── services.md            서비스 비교표 (포트·스택·검증 명령)
│   ├── qa/                    QA TC 목록
│   ├── handoff/               작업 인계 문서 (예: 케어·환급 웹 GraphQL → REST 전환)
│   ├── extending.md           스킬·에이전트 추가 방법
│   └── plan-template*         계획서 템플릿 (정식 md + 결정 콘솔 html · 경량 md)
│
├── plans/                     작업계획서 — 각자 로컬 (git 에 안 올라감)
├── issues/                    이슈·학습 후보 — 각자 로컬 (git 에 안 올라감)
├── archive/                   끝나서 보관한 일 — 이건 git 에 올라간다
├── repos/                     담당 레포 링크 (각자 로컬)
├── .sync/snapshots/           /sync 비교 기준 (운영 브랜치 지문)
│
└── scripts/
    ├── 작업 흐름
    │   ├── new-plan.mjs · plan-html.mjs   계획서 만들기 · 결정 콘솔
    │   ├── new-branch.sh                  작업 브랜치·워크트리 (+ wt-copy-local.sh)
    │   ├── delegate.sh                    에이전트를 pane 에 띄우기
    │   ├── commit.sh · ship.sh            "커밋해줘" · "PR 올려줘"
    │   ├── review-result.sh               reviewer 결론 기록
    │   └── heavy.sh                       무거운 명령 한 번에 하나씩
    ├── 검증 · QA
    │   ├── verify/<레포>.sh               표준 검증 (에이전트·reviewer 공용)
    │   └── qa/                            QA 시뮬레이션 (Playwright)
    ├── 현황판 · 화면
    │   ├── board.sh · board/              현황판 서버·화면 (/board)
    │   ├── guide-menu.sh · guide-pane.sh  가이드 메뉴 (/guide)
    │   ├── monitor-pane.sh · agent-monitor.py  로그 모니터 (/monitor)
    │   └── statusline.sh · mdview.py      상태바 · 터미널 마크다운 뷰어
    ├── 학습
    │   ├── learn-review.mjs (+ -pane.sh)  배우기 검토자 — 머지된 내 PR 로 학습 후보
    │   ├── learn-curator.mjs              30일 안 쓴 스킬 정리 후보 (/sync 끝)
    │   └── learn-eval.mjs · .json         학습 품질 채점 (정답지)
    ├── 지식 문서
    │   ├── sync-fingerprint.mjs           /sync — 운영 브랜치 지문
    │   ├── build-derived.mjs              지문 → 서비스 맵·플레이북 표
    │   └── check-diagrams.mjs · build-diagram-index.mjs · diagram-coverage.mjs
    ├── hooks/                             시작 점검 · 커밋·push 보호 · 비밀값 노출 막기
    └── setup.sh · seo-feedback.sh · archive-plans.sh · agent-context.py · branch-candidates.sh
```

## 확장하기

| 추가할 것 | 방법 |
|---|---|
| 스킬 | `.claude/skills/<이름>/SKILL.md` — 만들면 `/<이름>` 으로 바로 뜬다 (`call/SKILL.md` 를 복사해 시작) |
| 에이전트 | `.claude/agents/<이름>.md` — `description` 이 라우팅 문장. 안에 `: `(콜론+공백)를 쓰면 YAML 이 깨진다 |
| 같이 고칠 곳 | `CLAUDE.md` 표 · `AGENTS.md` · 이 README · `docs/playbook.html` — 헤르메스에게 "방금 추가한 거 문서에도 반영해줘" |

상세: `docs/extending.md`
