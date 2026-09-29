# bznav-web 공통 지식 (앱 에이전트 6개가 공유)

기준: **앱마다 운영 브랜치가 다르다** (`origin/prd-<앱>`). `packages/*`는 모든 앱이 공유하므로 통합 브랜치 `origin/dev` 기준. `/sync`로 갱신. 레포 경로 `repos/bznav-web`. 앱별 구조·패턴·함정은 `docs/knowledge/bznav-web/<앱>/`에 있다.

## 레포 자체 규칙 문서 (원문)

`.ai/basic-rule.md`의 **`[필수]` 등급 항목은 `rules.md`의 "필수" 절에 반영되어 있다.** 아래 원문은 작업 유형에 따라 필요할 때 읽는다 (`AGENTS.md` 2.3).

1. `.ai/basic-rule.md` — 공통 개발 규칙. `[필수]`/`[검증]`/`[권장]` 등급. **이 문서가 원문이고 여기 요약보다 우선한다**
2. `.github/agents/<앱>.agent.md` — 앱별 담당 범위·특이사항 (`shared-packages.agent.md` = packages/**). 새 화면·구조 작업 시
3. `.github/skills/react-component/SKILL.md` — 컴포넌트 생성·추출 시
4. `.github/skills/create-pr/SKILL.md` — 참고만. PR 은 헤르메스가 만들고, 이 스킬의 base 추론(`dev-ecs`)은 낡았다(`gotchas.md`)
5. `AGENTS.md`의 Codex 모델 정책은 무시. 규칙 우선순위(스킬 → agent.md → basic-rule)는 그대로

## 환경
- Node(`.nvmrc`)·pnpm(`packageManager`)·앱 포트 등 **버전·포트 숫자는 지문 `.sync/snapshots/bznav-web.json`이 정본**이다. `engines`와 `.nvmrc`가 다르면 작업 중단 후 보고
- 라이브러리 버전은 `pnpm-workspace.yaml`의 **catalog**가 단일 소스
- 스크립트는 루트 또는 해당 workspace에서 `pnpm`으로만. `pnpm --filter <앱> <스크립트>`
- **로컬 `.env` 는 AWS 인증으로 만든다**(`scripts/generate-env.mjs`, 없으면 dev 기동 불가 → 보고에 명시). 앱마다 다르다 — brand·refund·sena 는 `dev` 가 `gen:env`(SSM, `--env=loc`)를 먼저 돈다 · plus 는 `gen:env`(Secrets Manager, `--env=dev`)가 있지만 `dev` 에 없어 **수동** · care 는 앱 스크립트가 없어 `node scripts/generate-env.mjs --app=care-web --env=<env> --source=sm` 을 직접
- `.npmrc`는 `save-exact=true`, `@zenterprise-inc`는 GitHub Packages

## 앱 / 패키지 한눈에
| 앱 | 라우터 | dev 번들러 | Relay | 상태 배치 | 스타일 | typecheck / test | PR base |
|---|---|---|---|---|---|---|---|
| refund-web | **Pages** | **webpack** | O (`graphql/__generated__`) | `lib/stores/*.ts` | Tailwind 기본 + SCSS 모듈(레거시) | 없음 / 없음 | `dev` |
| care-web | App (route group 다수) | turbo | O (`__generated__`) | `app/**/store/*Atom.ts` 분산 | Tailwind + CSS(shadcn) | `type-check` / `test:unit`(jest) | `dev` |
| brand-web | App | turbo | — | 없음 | Tailwind + 전역 SCSS | 없음 | `dev` |
| sena-web | App (`(authenticated)`,`(login)`) | turbo | — | `lib/stores/*.ts` | Tailwind + SCSS 모듈 일부 | 없음 | `dev` |
| plus-web | App | turbo | — | `store/auth-store.ts` | Tailwind + 라우트 스코프 SCSS | 없음 | `dev` |

`packages/*` (`@repo/*`, workspace:*): `common-utils`(최하위, 다른 내부 패키지 의존 금지) · `platform`(client/server 이중 진입점) · `tracking-service`(Datadog·Mixpanel·Airbridge) · `ui`(**현행** 디자인 시스템, Radix+Tailwind+CVA, Storybook/Chromatic) · `ui-deprecated`(`@zenterprise-inc/ui`, **레거시, 신규 사용 금지**) · `user-session` · `user-sign` · `project-config`(lint 설정만). 5개 앱 전부 platform·tracking-service·common-utils·ui 사용, care/refund/sena만 user-session·user-sign.

## Relay / GraphQL (care-web, refund-web)
- 아티팩트(`__generated__/`)는 **커밋되지 않는다**. 체크아웃 직후 `pnpm --filter care-web relay` 또는 `pnpm --filter refund-web gen:relay`를 먼저 돌려야 타입이 맞는다. `dev`/`build`는 자동으로 선행 실행. 루트 `.gitignore` 가 두 앱의 `*.graphql.ts` 를 무시한다 — 원문 6.2 의 "커밋 대상인지 확인"은 이것으로 답이 정해져 있다
- 스키마: care `apps/care-web/schema/schema-care.graphql`(`gen:schema:dev`), refund `apps/refund-web/graphql/schema/schema.graphql`(`gen:schema`) + `schemaExtensions/`. 스키마 갱신은 네트워크·인증 필요 → 꼭 필요할 때만
- query는 `graphql` tag, 기존 `graphql/` 구조 유지. **생성물 직접 편집 금지**
- 루트 `pnpm gen:relay`(`turbo gen:schema && turbo compile:relay`)는 **쓰지 않는다** — refund-web 의 `gen:schema` 가 돌아 스키마를 dev 게이트웨이에서 받아 덮어쓰고(네트워크 필요), `compile:relay` 를 가진 앱이 없어 아티팩트는 안 만든다. 앱별 스크립트를 쓴다

## 코드 스타일
- 규칙은 `rules.md` "필수" 절(원문 `.ai/basic-rule.md` 4장이 우선). 거기 없는 보충만 여기 둔다
- 파일명 규칙 예외: Next 예약 파일·동적 세그먼트·라우트 그룹·기존 생성 디렉터리. import 순서는 `project-config` 의 `import/order`, 앱 내부는 `@/`. Tailwind className 전체 재정렬 금지. 포맷 확인은 `pnpm exec prettier --check/--write <파일>`

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
- 범위·비커밋 파일·커밋/PR 규칙은 `rules.md` "필수" 절. 커밋된 비밀 파일 현황은 `gotchas.md`
- 공통 패키지 API 변경은 영향 앱과 public export를 먼저 확인한다. 요청하지 않은 의존성 업그레이드·파일 이동·공통화·전역 포맷팅 금지
- 배포 인프라: **`refund-web` 만 ECS**, 나머지 4개는 EKS 로 이관됐다. 브랜치 선택과는 무관하다(PR base 는 전부 `dev`)
