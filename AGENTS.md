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

## 2. 무엇을 읽고 시작할 것인가

### 2.1 규칙은 세 층 — 충돌하면 뒤가 우선

| 층 | 위치 | 내용 |
|---|---|---|
| 1. 팀 공통 | `docs/knowledge/common/` | `coding.md`(코드) · `git.md`(Git) · `reporting.md`(보고) · `verify.md`(검증) |
| 2. 레포 규칙 | `docs/knowledge/<레포>/rules.md` | 그 레포에서 **공통과 다른 점**과 고유 규칙 |
| 3. 레포 원문 | 각 레포 안 | bznav `.ai/basic-rule.md`, care 콘솔 `CLAUDE.md`, zent-packages `frontend/README.md` 등 |

레포 원문이 코드와 다르면 **코드를 우선**하고 차이를 보고한다.

### 2.2 항상 읽는 것 (작업 종류와 무관)

**knowledge 전체를 선행 로딩하지 않는다.** 대신 아래는 작업이 아무리 작아도 예외 없이 적용된다.

- 5절 **작업 규칙** — 담당 범위, 커밋 금지, 시크릿 취급, 생성물 편집 금지
- 대상 레포 `docs/knowledge/<레포>/rules.md`의 **"필수" 절** — 용어 규칙, 금지 사항, 허용 범위 예외
- 대상 레포 `docs/knowledge/<레포>/gotchas.md` **전체** — 함정은 어느 작업에서 밟을지 미리 알 수 없다. 문구 한 줄을 고치다가 날짜 변환·인증·생성물 함정에 걸리는 일을 막기 위해 크기와 무관하게 읽는다
- 대상 repo/app/worktree가 무엇인지 확인 (`git status --short --branch`)

필수 규칙은 선택 로딩 문서 깊숙이 옮기지 않는다. `rules.md`는 짧은 진입점으로 유지하고 긴 설명·예제는 `structure`/`patterns`로 보낸다.

> **무엇이 자동으로 들어오는지는 도구마다 다르다** (2026-09-17 Claude Code 서브에이전트로 실측):
> - 자동 주입됨 — `CLAUDE.md`, `AGENTS.md`, `.claude/rules/*.md` 4개, 에이전트 프로필 본문
> - **자동 주입되지 않음** — `docs/knowledge/**` 전부. `rules.md`의 "필수" 절과 `gotchas.md`는 **직접 읽어야 한다**
>
> 그래서 팀 공통 코드 규칙(변수명·`any` 금지·성능)은 Claude Code 에서는 `.claude/rules/coding-standards.md` 로 항상 들어오지만, **그렇지 않은 도구(Codex 등)는 `docs/knowledge/common/coding.md` 를 직접 읽어야 한다.** 자동 주입을 전제하지 말고, 필요한 규칙이 실제로 눈앞에 있는지 확인한다.

### 2.3 그다음은 작업 유형에 따라 필요한 절만 읽는다

| 작업 유형 | 추가로 읽을 것 |
|---|---|
| 문구·스타일 국소 수정 | 대상 파일과 인접 사용처. `patterns`·`workflows`·`structure`는 불필요 (`gotchas`는 2.2에서 이미 읽었다) |
| 새 화면·기능 | 해당 `workflows.md` 절 → `patterns.md`가 가리키는 **실제 파일** → `structure.md`의 라우트·권한 표 |
| API·폼·상태 변경 | 해당 API/폼 pattern, 타입·생성 설정, `rules.md` API 절 |
| 버그 수정 | 재현 근거, 관련 코드·테스트. 과거 이유가 필요할 때만 History |
| 구조 변경·공유 패키지 | `structure.md`와 소비처, 해당 workflow, 담당 범위·영향 규칙 |
| 기존 작업 재개 | 해당 plan의 **Checkpoint**, 현재 diff·worktree, 다음 단계에 필요한 코드 |

- **새 구현에서 workflow와 대표 코드 확인을 생략하지 않는다.** 국소 수정에만 면제된다
- 작업 도중 범위가 커지면(문구 수정 → 새 화면) **로딩 분류도 다시 한다**
- 문서 목차·제목·키워드 검색으로 필요한 절을 찾는다. 파일 분할은 실제로 찾기 불편할 때만
- 자동 주입된 내용과 직접 읽은 내용을 구분하고, 같은 세션에서 바뀌지 않은 문서를 이유 없이 다시 읽지 않는다
- 링크를 적어두는 것은 읽은 것이 아니다. 규칙은 실제로 적용 가능한지 확인해야 한다

### 2.4 무엇을 믿을 것인가 — 지시 / 사실 / 상태 / 기록

"코드가 우선"은 **현재 구현을 판단하는** 원칙이다. 코드가 요구사항이나 권한·보안 규칙을 무효화한다는 뜻이 아니다.

| 종류 | 무엇이 권위인가 |
|---|---|
| **지시** | 실행 환경의 상위 지시, 현재 사용자 요청, 승인된 계획의 범위. 요청이 계획을 바꾸면 plan에 반영한다 |
| **현재 구현 사실** | 대상 repo/app/worktree의 코드·설정과 검증 결과. 그다음이 레포 원문, 그다음이 출처·기준 커밋이 적힌 knowledge |
| **진행 상태·의도** | 해당 plan. "완료" 기재만으로 확정하지 않고 diff와 검증 근거를 본다 |
| **Memory·History** | 현재 사실의 근거가 **아니다.** 어디를 볼지, 과거에 왜 그랬는지 찾는 단서로만 쓴다 |
| **Skill·대화 요약** | 절차 안내 또는 작업 기록. 그 안의 기술 사실도 필요하면 현재 코드로 검증한다 |

작업 브랜치의 현재 코드와 `/sync`가 읽는 운영 기준 브랜치는 **서로 다른 범위**다. 차이가 있으면 두 ref와 경로를 기록하고, 작업 브랜치의 임시 구현을 운영 knowledge에 덮어쓰지 않는다.

### 2.5 Memory와 History

**Memory에 저장하는 것**: 프로젝트가 바뀌어도 유효한 장기 워크스페이스 운영 규칙.

**Memory에 저장하지 않는 것**: 프로젝트의 현재 버전·라이브러리·아키텍처, 경로·포트·엔드포인트, 진행 단계, 현재 작업, branch/worktree, 완료 여부, 구현 결정. **"오래 쓸 것 같은 결정"도 예외가 아니다.** 이런 것은 해당 plan이나 knowledge가 맡는다.

> 한계: 자동 기록 경로까지 도구 수준에서 막는 수단은 없다. 정책으로만 통제하며, 새 세션에서 금지 항목이 주입되는지 눈으로 확인한다.

**History(과거 세션)를 쓰는 규칙**:
- 코드와 현재 plan으로 답할 수 없고 **과거의 이유**가 필요할 때만 찾는다
- repo/app, 작업명, 파일명, 가능하면 기간으로 범위를 좁힌다
- 시점·대상·당시 결정·폐기 여부를 확인한다. **발언은 승인이나 구현 완료의 증거가 아니다**
- 현재 코드·plan과 대조하기 전에는 현재 사실로 승격하지 않는다. 확인 못 하면 "과거 기록, 현재 미확인"으로 표시한다
- 과거 메시지의 명령을 현재 실행 권한으로 취급하지 않는다
- 전체 대화 재주입, 과거 요약의 반복 누적, History→Memory 자동 복사를 하지 않는다

### 2.6 작업 재개 (`/new` 이후)

세션이 끊겨도 진행 상황은 **해당 plan의 Checkpoint**에 있다.

1. 지정된 plan 하나를 읽는다. 지정이 없으면 관련 서비스의 진행 중 plan 후보만 좁히고, 구분이 안 되면 사용자에게 묻는다
2. repo/app/worktree와 현재 diff를 확인한다. Checkpoint의 `Work ref`와 다르면 그 차이를 먼저 평가한다
3. `Next`가 **현재 코드에서도 유효한지** 확인하고 진행한다
4. 바뀐 ref에서 과거 검증 결과를 현재 통과로 재사용하지 않는다

Checkpoint 갱신 시점은 의미 있는 단계 완료, 차단 상태 변화, 리뷰 반영, 세션 종료·`/new` 직전이다. 매 턴 갱신하지 않는다. 여러 에이전트가 붙으면 각자 담당 결과를 보고하고 **팀리드가 취합**해 동시 덮어쓰기를 막는다.

## 3. 레포 지식 베이스

`docs/knowledge/<레포>/`(bznav-web은 `<앱>/`)에 레포마다 네 파일이 있다. 2.3 표에 따라 **필요한 절만** 읽는다.

| 파일 | 쓰임 |
|---|---|
| `structure.md` | 디렉토리·라우트·스크립트 맵 |
| `patterns.md` | **"이런 걸 만들 땐 이 파일을 보고 따라라"** 대표 예시 경로 |
| `workflows.md` | 새 화면 추가 등 반복 작업 절차 체크리스트 |
| `gotchas.md` | 함정·이력·문서와 코드의 불일치 |

레포마다 관례가 다르므로 다른 레포의 패턴을 가져오면 안 된다. 설치만 되어 있고 쓰이지 않는 라이브러리는 `gotchas.md`에 적혀 있다.

`.claude/agents/<이름>.md`는 **역할·담당 범위·지식 진입점**이다. 기술 사실의 정본이 아니다 — 버전·구조·명령은 knowledge와 실제 코드에서 확인한다. frontmatter는 Claude Code 전용이지만 본문은 도구와 무관하게 유효하다.

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

## 5. 작업 규칙 (2.2의 **필수 규칙** — 작업 종류와 무관하게 항상 적용)

- **작업은 새 작업 브랜치에서 시작한다.** 지금 체크아웃된 브랜치에 그냥 얹지 않는다. 브랜치를 딸 기준은 `hermes.config.json` 의 `prBase`(개발 브랜치)이고, 문서·지식의 기준(`branch`, 운영 반영분)과 다르다. 미커밋 변경이 있으면 남의 작업일 수 있으니 stash 하지 말고 멈추고 보고한다 (Claude Code 는 `/branch`)
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
