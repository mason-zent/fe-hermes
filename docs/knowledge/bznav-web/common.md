# bznav-web 공통 지식 (앱 에이전트 6개가 공유)

기준: **앱마다 운영 브랜치가 다르다** (`origin/prd-<앱>`). `packages/*`는 모든 앱이 공유하므로 통합 브랜치 `origin/dev` 기준. `/sync`로 갱신. 레포 경로 `repos/bznav-web`. 앱별 구조·패턴·함정은 `docs/knowledge/bznav-web/<앱>/`에 있다.

## 레포 자체 규칙 문서 (원문)

`.ai/basic-rule.md`의 **`[필수]` 등급 항목은 `rules.md`의 "필수" 절에 반영되어 있다.** 아래 원문은 작업 유형에 따라 필요할 때 읽는다 (`AGENTS.md` 2.3).

1. `.ai/basic-rule.md` — 공통 개발 규칙. `[필수]`/`[검증]`/`[권장]` 등급. **이 문서가 원문이고 여기 요약보다 우선한다**
2. `.github/agents/<앱>.agent.md` — 앱별 담당 범위·특이사항 (`shared-packages.agent.md` = packages/**). 새 화면·구조 작업 시
3. `.github/skills/react-component/SKILL.md` — 컴포넌트 생성·추출 시
4. `.github/skills/create-pr/SKILL.md` — PR 생성 시 (base 브랜치 추론 규칙)
5. `AGENTS.md`의 Codex 모델 정책은 무시. 규칙 우선순위(스킬 → agent.md → basic-rule)는 그대로

## 환경
- Node **24.15.0** (`.nvmrc`), pnpm **10.33.0**, Turborepo 2.8. `engines`와 `.nvmrc`가 다르면 작업 중단 후 보고
- 버전은 `pnpm-workspace.yaml`의 **catalog**가 단일 소스: Next 16.2.5, React 19.2.6, TypeScript 5.9.3, Jotai 2.17, Tailwind 3.4.19, react-relay 18.2 / relay-runtime 20.1, graphql 16.9
- 스크립트는 루트 또는 해당 workspace에서 `pnpm`으로만. `pnpm --filter <앱> <스크립트>`
- **로컬 dev에 AWS 인증 필요**: `gen:env`(`scripts/generate-env.mjs`)가 SSM(brand/refund/sena) 또는 Secrets Manager(care/plus)에서 `.env`를 만든다. 없으면 dev 서버 기동 불가 → 보고에 명시
- `.npmrc`는 `save-exact=true`, `@zenterprise-inc`는 GitHub Packages

## 앱 / 패키지 한눈에
| 앱 | 포트 | 라우터 | dev 번들러 | Relay | 상태 배치 | 스타일 | typecheck / test | PR base |
|---|---|---|---|---|---|---|---|---|
| refund-web | 3200 | **Pages** | **webpack** | O (`graphql/__generated__`) | `lib/stores/*.ts` | SCSS 19 + Tailwind | 없음 / 없음 | `dev-ecs` |
| care-web | 3100 | App (route group 다수) | turbo | O (`__generated__`) | `app/**/store/*Atom.ts` 분산 | Tailwind + CSS(shadcn) | `type-check` / `test:unit`(jest) | `dev` |
| brand-web | 3000 | App | turbo | — | 없음 | Tailwind + SCSS 1 | 없음 | `dev-ecs` |
| sena-web | 3300 | App (`(authenticated)`,`(login)`) | turbo | — | `lib/stores/*.ts` | Tailwind + SCSS 7 | 없음 | `dev-ecs` |
| plus-web | 3400 | App | turbo | — | `store/auth-store.ts` | Tailwind + SCSS 3 | 없음 | `dev` |

`packages/*` (`@repo/*`, workspace:*): `common-utils`(최하위, 다른 내부 패키지 의존 금지) · `platform`(client/server 이중 진입점) · `tracking-service`(Datadog·Mixpanel·Airbridge) · `ui`(**현행** 디자인 시스템, Radix+Tailwind+CVA, Storybook/Chromatic) · `ui-deprecated`(`@zenterprise-inc/ui`, **레거시, 신규 사용 금지**) · `user-session` · `user-sign` · `project-config`(lint 설정만). 5개 앱 전부 platform·tracking-service·common-utils·ui 사용, care/refund/sena만 user-session·user-sign.

## Relay / GraphQL (care-web, refund-web)
- 아티팩트(`__generated__/`)는 **커밋되지 않는다**. 체크아웃 직후 `pnpm --filter care-web relay` 또는 `pnpm --filter refund-web gen:relay`를 먼저 돌려야 타입이 맞는다. `dev`/`build`는 자동으로 선행 실행
- 스키마: care `apps/care-web/schema/schema-care.graphql`(`gen:schema:dev`), refund `apps/refund-web/graphql/schema/schema.graphql`(`gen:schema`) + `schemaExtensions/`. 스키마 갱신은 네트워크·인증 필요 → 꼭 필요할 때만
- query는 `graphql` tag, 기존 `graphql/` 구조 유지. **생성물 직접 편집 금지**
- 루트 `pnpm gen:relay`는 해당 태스크를 가진 앱이 없어 실질 no-op. 앱별 스크립트를 쓴다

## 코드 스타일 (`.ai/basic-rule.md` 4장 요약, 원문이 우선)
- Prettier 3: `singleQuote: true`, `semi: true`, `trailingComma: none`, `printWidth: 160`, 2 spaces. **변경 파일만** `pnpm exec prettier --check/--write <파일>`. 전체 포맷 금지
- 파일명: 컴포넌트·클래스 `PascalCase`, 훅·유틸·일반 모듈 `kebab-case`, 디렉터리 `kebab-case`. Next 예약 파일·동적 세그먼트·라우트 그룹은 예외
- TypeScript: 새 코드 `any` 금지(`unknown` + narrowing), `type` 기본(`interface`는 declaration merging 등 필요할 때만), 불필요한 단언·non-null 금지, 미사용 import/변수 금지
- 함수형 컴포넌트, `React.FC` 금지, arrow function, named export 기본(`export default`는 Next 진입점만)
- **컴포넌트 내부 순서**: ① 변수·상수·state ② 커스텀 훅·`useMemo` ③ `useCallback`·핸들러 ④ `useEffect`
- import 순서는 `project-config`의 `import/order`가 기준. 패키지 내부 파일(`packages/*/src`) 직접 import 금지 → public export. 다른 패키지는 `@repo/<pkg>`, 앱 내부는 `@/`. **앱에서 다른 앱 import 금지**
- 운영 코드 `console.log/debug` 금지. `window/document/localStorage`는 Client Component·hook에서만. `'use client'`는 필요한 파일에만
- CSS: Stylelint 통과 필수, 속성 알파벳순, class는 소문자 kebab. SCSS/Tailwind 혼용 앱은 **기존 파일 방식 유지**. 신규 UI는 `@repo/ui`(`@zenterprise-inc/ui` 금지). Tailwind className 전체 재정렬 금지
- 한글 식별자로 인한 Lint 경고는 임의 수정 금지

## 검증 (`.ai/basic-rule.md` 7장)
| 변경 범위 | 명령 |
|---|---|
| 앱 코드 | `pnpm --filter <앱> lint` (eslint + stylelint) |
| 타입 | care-web만 `pnpm --filter care-web type-check`. 다른 앱은 `pnpm --filter <앱> exec tsc --noEmit` 또는 `pnpm --filter <앱> build` |
| care-web 상태·Relay | `pnpm --filter care-web test:unit` |
| 공유 패키지 | `pnpm --filter @repo/<pkg> lint`, ui는 `build-storybook` |
| 라우팅·빌드 설정·의존성 | `pnpm --filter <앱> build` |
| 변경 파일 | `pnpm exec prettier --check <파일>`, `git diff --check` |

**실행하지 못한 검증을 통과한 것처럼 보고하지 않는다.** 완료 보고 4항목: 변경 파일·핵심 변경 / 실행한 검증과 결과 / 생성 파일·환경·외부 시스템 영향 / 남은 위험.

## 범위 규칙
- 앱 에이전트는 **자기 `apps/<앱>/**`만** 수정. `packages/**`와 다른 앱은 지시 없이 수정 금지 → 헤르메스에 보고하면 `bznav-packages-fe`가 먼저 처리하고 결과를 넘긴다
- 공통 패키지 API 변경은 영향 앱과 public export를 먼저 확인. 새 의존성은 catalog 확인 먼저, 내부 패키지는 `workspace:*`
- 요청하지 않은 의존성 업그레이드·파일 이동·공통화·전역 포맷팅 금지
- 비출력·비커밋: `.env*`, `.aws/access-key.js`, `firebase-key.json`, 토큰·키. (`.npmrc`에 평문 토큰, `apps/sena-web/firebase-key.json`이 커밋된 상태가 확인됨 — 건드리지 말고 헤르메스에 보고)
- 커밋하지 않는다. PR은 헤르메스/사용자 지시가 있을 때만 `.github/skills/create-pr` 절차로. base는 앱 계열에 따라 `dev`(care/plus) / `dev-ecs`(brand/refund/sena) / 릴리즈 `prd-<앱>`
