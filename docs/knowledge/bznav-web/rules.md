# bznav-web 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점. **원문은 레포의 `.ai/basic-rule.md`**이고 우선순위는 `.github/skills/*/SKILL.md` → `.github/agents/<앱>.agent.md` → `.ai/basic-rule.md`. 환경·앱 표·Relay·검증표 등 상세는 같은 폴더의 `common.md`.

## 필수 — 작업 크기와 무관하게 항상 적용

### 모든 앱 공통
- **자기 앱(`apps/<앱>/**`)만 수정한다.** 다른 앱 import 금지, `packages/**` 수정 금지(→ `bznav-packages-fe`가 **먼저**), **패키지 내부 파일 직접 import 금지**(public export만)
- **비커밋 파일**: `.env*`, `.aws/access-key.js`, **`apps/sena-web/firebase-key.json`**(레포에 커밋되어 있다). 내용을 출력·수정·이동하지 않는다. 마주치면 헤르메스에 보고
- Relay **아티팩트는 미커밋**이고 직접 편집하지 않는다. `relay`/`gen:relay`를 먼저 돌린다
- `@zenterprise-inc/ui`(ui-deprecated) **신규 사용 금지**. 신규 UI는 `@repo/ui`
- **커밋하지 않는다.** 새 의존성은 `pnpm-workspace.yaml` catalog 확인이 먼저다

### 코드를 쓰거나 고치면 항상

원문 `.ai/basic-rule.md` 의 **`[필수]` 등급이 정본**이다. 코드를 건드리는 작업이면 그 절을 읽는다 — 선택 로딩의 예외다. 자주 걸리는 것만 여기 적는다.

- **포맷**: 스페이스 2칸, 작은따옴표, 세미콜론, trailing comma 없음, `printWidth: 160`, 탭 금지. **작업한 파일만** 포맷한다
- **파일명**: 컴포넌트·클래스 `PascalCase`, 훅·유틸·일반 모듈·디렉터리 `kebab-case`
- **타입**: `any` 금지(`unknown` 으로 받고 narrowing), 선언은 `type` 기본, 재사용하지 않는 props 는 인라인, `as any`·불필요한 non-null assertion 금지, 미사용 import·변수 금지
- **React**: `React.FC` 금지, 함수·이벤트 핸들러는 arrow function, **`export default` 는 Next 진입점만이고 기본은 named export**, 컴포넌트 내부 선언 순서(변수·state → 훅·`useMemo` → `useCallback`·핸들러 → `useEffect`)
- **import**: 패키지 내부 파일(`packages/*/src`·`lib`·`dist`) 직접 import 금지(public export 만), 다른 패키지 상대경로 금지(`@repo/<패키지>`), 앱에서 다른 앱 import 금지
- **`console.log`·`console.debug` 를 운영 코드에 남기지 않는다**
- `window`·`document`·`localStorage`·`sessionStorage` 는 Client Component 또는 hook 에서만. `'use client'` 는 state·effect·핸들러·브라우저 API 가 필요한 파일에만
- **CSS**: Stylelint 통과 필수, 새 class·id·keyframe 은 소문자로 시작. SCSS/Tailwind 는 그 앱의 기존 방식을 유지하고 한 파일에서 임의로 바꾸지 않는다
- **한글 객체명·변수명 때문에 나는 Lint 경고는 임의로 고치지 않는다**
- 인증이 필요한 App Router 영역은 그 앱의 AuthGuard 를 레이아웃에서 쓴다. Provider 를 추가·이동하면 기존 중첩 순서와 Client 경계를 확인한다
- 한 번만 쓰는 코드를 의미 없이 공통 유틸·컴포넌트로 추출하지 않는다

### 변경 범위별 검증 (원문 §검증 표)

표준 스크립트(`scripts/verify/bznav-web.sh <앱>`)는 lint·타입·테스트만 돈다. **아래는 거기에 더해서** 해야 한다.

| 변경 범위 | 추가 검증 |
|---|---|
| **앱 라우팅·빌드 설정·의존성 변경** | **`pnpm --filter <앱> build`** — 스크립트가 대신해 주지 않는다 |
| Relay query·schema 변경 | 해당 Relay 생성 명령 실행 + generated diff 확인 |
| `@repo/ui` 변경 | 필요하면 `pnpm --filter @repo/ui build-storybook` |
| 환경 변수·생성 스크립트 변경 | 관련 생성 명령의 실행 조건과 산출물 확인 |
| 문서·설정만 변경 | `prettier --check <변경 파일>`, `git diff --check` |

### 앱별 — 해당 앱 작업이면 항상
- **refund-web**: **Pages Router**다(다른 앱은 App Router). `app/`·`'use client'`·서버 컴포넌트 패턴을 가져오지 않는다. dev는 webpack. Relay 생성 명령이 `gen:relay`(care-web은 `relay`)
- **care-web**: **순수 로직·atom을 바꾸면 테스트를 추가한다**(`__test__/`). 5개 앱 중 유일하게 `type-check`·`test:unit`이 있다. storage atom은 local/session 목적을 구분하고 key·초기값·serialization을 명시한다
- **brand-web**: `postbuild`가 sitemap/robots를 재생성한다. **라우팅·메타데이터·콘텐츠 구조를 바꾸면 `build` 후 sitemap 산출을 확인한다**
- **plus-web**: **차트(recharts)를 바꾸면 데이터 shape 영향을 확인한다**(색은 hex 하드코딩). 폼은 두 갈래 — 계산기는 resolver 없이 RHF `watch`/`setValue`, yup resolver는 간편인증에만
- **sena-web**: `app/chat/` 변경은 스트리밍·대화 컨텍스트가 여러 store에 걸치므로 상태 전달 흐름을 먼저 확인한다
- **packages/**: 수정 허용은 `packages/**` + 패키지 변경에 직결된 루트 `package.json`·`pnpm-workspace.yaml`·`turbo.json` **최소 수정**이다. **catalog 버전 변경은 헤르메스에 보고**하고, `apps/**`는 읽기만 한다

## 공통과 다른 점
- Prettier **`semi: true`**, `singleQuote: true`, `trailingComma: none`, **`printWidth: 160`**
- 파일명: 컴포넌트·클래스 `PascalCase`, **훅·유틸·일반 모듈 `kebab-case`**, 디렉터리 `kebab-case`
- 타입 선언은 `type` 기본(`interface`는 declaration merging 등 필요할 때만). named export 기본, `export default`는 Next 진입점만
- **컴포넌트 내부 순서**: ① 변수·상수·state ② 커스텀 훅·`useMemo` ③ `useCallback`·핸들러 ④ `useEffect`
- CSS 속성 알파벳순, Stylelint 통과 필수. SCSS/Tailwind 혼용 파일은 기존 방식 유지
- 신규 UI는 `@repo/ui`. `@zenterprise-inc/ui`(ui-deprecated) 신규 사용 금지

## 범위
- 앱 에이전트는 자기 `apps/<앱>/**`만. `packages/**`는 `bznav-packages-fe`가 **먼저**. 앱에서 다른 앱 import 금지, 패키지 내부 파일 직접 import 금지(public export만)
- 새 의존성은 `pnpm-workspace.yaml` catalog 확인 먼저. 내부 패키지는 `workspace:*`

## Relay
- 아티팩트 미커밋 → `relay`/`gen:relay` 선행. 생성물 직접 편집 금지. 스키마 갱신은 네트워크·인증 필요

## 검증
- 기본 `pnpm --filter <앱> lint`. 타입은 care-web만 `type-check`, 나머지는 `exec tsc --noEmit`. care-web은 `test:unit`도

## Git
- **문서·지식의 기준 브랜치는 앱마다 다르다** — `origin/prd-<앱>`(운영 반영분). `packages/*` 는 모든 앱이 공유하므로 통합 브랜치 `origin/dev` 기준. 정본은 `hermes.config.json`
- **개발·PR 브랜치는 별개다** — PR base 는 앱 계열별로 `dev`(care·plus, EKS) / `dev-ecs`(brand·refund·sena, ECS), 릴리즈 `prd-<앱>`. PR 은 `.github/skills/create-pr` 절차. 문서 기준과 PR base 를 같은 것으로 취급하지 않는다
- 커밋 `type(scope): 설명` (예 `fix(refund): REF-3728 ...`). 응답·PR·리뷰는 한글 존댓말
- 비커밋: `.env*`, `.aws/access-key.js`, `firebase-key.json`
