# Hermes — FE 멀티 레포 작업 워크스페이스

여러 프론트엔드 레포를 한 곳에서 작업하기 위한 워크스페이스다. **이 문서는 도구에 무관한 공통 규칙**이고, Claude Code·Codex·그 밖의 에이전트가 모두 여기서 출발한다.

도구별 추가 사항은 각자의 문서에 있다.
- Claude Code → `CLAUDE.md` (서브에이전트 위임, 슬래시 커맨드, Plan-First 흐름)
- Codex 등 그 외 → 이 문서 하나로 충분하다. 위임 기능이 없으면 헤르메스 역할 없이 **직접** 작업하되 아래 규칙과 지식을 그대로 따른다

---

## 1. 담당 레포와 기준 브랜치

목록의 정본은 `hermes.config.json`이다. 경로는 어디서나 `repos/<레포>`이며 `scripts/setup.sh`가 심볼릭 링크를 만든다.

| 레포 | 담당 범위 | 기준 브랜치 |
|---|---|---|
| `repos/client-brics-refund` | BRICS 환급 운영 콘솔 (13002) | `origin/prd` |
| `repos/client-brics-hub` | BRICS Hub 콘솔 (13003) | `origin/prd` |
| `repos/client-brics-care` | BRICS 케어 운영 콘솔 (13001) | `origin/prd` |
| `repos/web-op` | Z-Enterprise 운영 웹 (3000) | `origin/prd` |
| `repos/bznav-web/apps/refund-web` | 비즈넵 환급 사용자 웹 (3200) | `origin/prd-refund` |
| `repos/bznav-web/apps/care-web` | 비즈넵 케어 사용자 웹 (3100) | `origin/prd-care` |
| `repos/bznav-web/apps/brand-web` | 비즈넵 브랜드 사이트 (3000) | `origin/prd-brand` |
| `repos/bznav-web/apps/sena-web` | 비즈넵 세나 AI 챗 (3300) | `origin/prd-sena` |
| `repos/bznav-web/apps/plus-web` | 비즈넵 플러스 계산기 (3400) | `origin/prd-plus` |
| `repos/bznav-web/packages/*` | 비즈넵 공통 패키지 `@repo/*` | `origin/dev` (앱들이 공유) |
| `repos/zent-packages/frontend` | 발행 공유 패키지 (`backend/`는 범위 밖) | `origin/main` |

**기준 브랜치 = 운영 반영분.** 문서와 지식 베이스는 이 브랜치를 읽어 만든 것이다. 로컬 작업 트리가 그보다 뒤처져 있으면 문서와 코드가 다를 수 있는데, **그건 문서 오류가 아니다.** 작업 전 `git status --short --branch`로 얼마나 벌어졌는지 확인하고 보고에 적는다.

**범위 밖**: 백엔드 레포(`server-*`), `zent-packages/backend`, `client-brics-works`. 이들 변경이 필요하면 작업을 멈추고 사용자에게 알린다.

### 어느 레포인지 고르기
- 환급 콘솔·랜딩 SEO 어드민·파트너·광고·간편신청 → client-brics-refund
- 권한·역할·메뉴(사이드바)·리소스 센터·감사 로그·메시지 플랫폼 → client-brics-hub
- 케어 구독·결제·납세자·프로모션·마케팅 페이지·QA → client-brics-care
- 영업·서류·직원·파이프드라이브 → web-op
- 비즈넵 사용자 웹은 앱별로: 환급 랜딩/이벤트/UTM/홈택스/설문 → refund-web · 세무기장 구독 → care-web · 브랜드/약관 → brand-web · AI 상담 → sena-web · 세금 계산기/진단 → plus-web · `@repo/*` → packages
- `brics-fe-ui`·`zent-auth`·`bznav-fe-ui` 등 발행 패키지 → zent-packages
- ⚠️ **"케어"·"환급"만 나오면 운영 콘솔인지 사용자 웹인지 반드시 사용자에게 확인**한다. 둘은 완전히 다른 레포다

---

## 2. 규칙은 세 층이다 — 충돌하면 뒤가 우선

| 층 | 위치 | 내용 |
|---|---|---|
| 1. 팀 공통 | `docs/knowledge/common/` | `coding.md`(코드) · `git.md`(Git) · `reporting.md`(보고) · `verify.md`(검증) |
| 2. 레포 규칙 | `docs/knowledge/<레포>/rules.md` | 그 레포에서 **공통과 다른 점**과 고유 규칙 |
| 3. 레포 원문 | 각 레포 안 | bznav `.ai/basic-rule.md`, care 콘솔 `CLAUDE.md`, zent-packages `frontend/README.md` 등 |

작업 전 이 순서로 읽는다. 레포 원문이 코드와 다르면 **코드를 우선**하고 차이를 보고한다.

## 3. 레포 지식 베이스

`docs/knowledge/<레포>/`(bznav-web은 `<앱>/`)에 레포마다 네 파일이 있다.

| 파일 | 쓰임 |
|---|---|
| `structure.md` | 디렉토리·라우트·스크립트 맵 |
| `patterns.md` | **"이런 걸 만들 땐 이 파일을 보고 따라라"** 대표 예시 경로 |
| `workflows.md` | 새 화면 추가 등 반복 작업 절차 체크리스트 |
| `gotchas.md` | 함정·이력·문서와 코드의 불일치 |

**새 코드를 쓰기 전에 `workflows.md`에서 해당 절차를 고르고 `patterns.md`가 가리키는 파일을 먼저 읽는다.** 레포마다 관례가 다르므로 다른 레포의 패턴을 가져오면 안 된다. 설치만 되어 있고 쓰이지 않는 라이브러리는 `gotchas.md`에 적혀 있다.

레포별 상세 프로필(스택·구조·검증 명령)은 `.claude/agents/<이름>.md`에 있다. 파일 맨 위 frontmatter는 Claude Code 전용이지만 **본문은 도구와 무관하게 유효**하니 그대로 읽어도 된다.

## 4. 검증

에이전트와 리뷰어가 **같은 스크립트**를 돌리고, 그 출력 표를 보고서에 그대로 붙인다.

```bash
scripts/verify/client-brics-refund.sh
scripts/verify/client-brics-hub.sh
scripts/verify/client-brics-care.sh
scripts/verify/web-op.sh
scripts/verify/bznav-web.sh <앱|packages/<pkg>>
scripts/verify/zent-packages.sh <패키지명...>
```

실행 전 확인할 것과 결과 해석은 `docs/knowledge/common/verify.md`에 있다. 요약하면 Node 버전을 레포 `.nvmrc`에 맞추고(`nvm use`), 생성물(Orval·Relay)이 없으면 타입 검사가 건너뛰어진다는 점이다. **실행하지 못한 검증을 통과한 것처럼 보고하지 않는다.**

## 5. 작업 규칙

- 담당 범위 밖은 수정하지 않는다. 필요하면 멈추고 보고한다
- 요청 범위 밖의 정리·의존성 업그레이드·파일 이동·전역 포맷팅 금지
- 포맷은 **작업한 파일만**. 설정은 레포마다 다르다(web-op만 세미콜론·큰따옴표·80칸)
- 생성물(`__generated__/`, Relay 아티팩트)은 직접 편집하지 않고 생성 명령으로 만든다
- **커밋하지 않는다.** 커밋과 PR 여부는 사용자가 정한다
- `.env*`, 토큰, 키 파일 내용은 출력·커밋하지 않는다

## 6. 보고 형식

1. **변경 파일 목록** (경로)
2. **구현 요약** — 요청 항목별 완료 / 미완료 / 다르게 한 것과 이유
3. **검증 결과** — 검증 스크립트 출력 표 그대로. 실패는 원문, 실행 못 한 것은 "실행 못 함"
4. **남은 위험·확인 필요** — 범위 밖 수정 필요, 추측으로 처리한 부분, 다른 서비스 영향

한국어로 소통하고 코드 주석도 한국어로 쓴다. 불확실하면 "추측입니다"라고 밝힌다.

---

## 7. 문서를 최신으로 유지하기

`/sync`(Claude Code) 또는 `node scripts/sync-fingerprint.mjs`가 각 레포의 기준 브랜치를 읽어 지문을 만들고 이전 baseline과 비교한다. 스택 버전·명령·포트·구조 같은 사실은 그대로 반영하고, 판단이 들어간 문장은 "확인 필요"로 남긴다. 갱신 후 `--accept`로 baseline을 확정한다.

레포가 아니라 **이 워크스페이스 자체**의 구조가 바뀌면(에이전트·스킬 추가 등) `docs/extending.md`를 따른다. sync는 그 변화를 잡지 않는다.
