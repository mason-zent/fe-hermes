# bznav-web 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점. **원문은 레포의 `.ai/basic-rule.md`**이고 우선순위는 `.github/skills/*/SKILL.md` → `.github/agents/<앱>.agent.md` → `.ai/basic-rule.md`. 환경·앱 표·Relay·검증표 등 상세는 같은 폴더의 `common.md`.

## 필수 — 작업 크기와 무관하게 항상 적용

### 모든 앱 공통
- **자기 앱(`apps/<앱>/**`)만 수정한다.** 다른 앱 import 금지, `packages/**` 수정 금지(→ `bznav-packages-fe`가 **먼저**), **패키지 내부 파일 직접 import 금지**(public export만)
- **비커밋 파일**: `.env*`, `.aws/access-key.js`, **`apps/sena-web/firebase-key.json`**(레포에 커밋되어 있다). 내용을 출력·수정·이동하지 않는다. 마주치면 헤르메스에 보고
- Relay **아티팩트는 미커밋**이고 직접 편집하지 않는다. `relay`/`gen:relay`를 먼저 돌린다
- `@zenterprise-inc/ui`(ui-deprecated) **신규 사용 금지**. 신규 UI는 `@repo/ui`
- **커밋하지 않는다.** 새 의존성은 `pnpm-workspace.yaml` catalog 확인이 먼저다

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
