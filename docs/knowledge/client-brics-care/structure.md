# client-brics-care 구조 맵

기준 `origin/prd` `1457d83` (2026-08-20). 규칙 `rules.md`, 예시 `patterns.md`, 절차 `workflows.md`, 함정 `gotchas.md`.

## 루트
| 경로 | 역할 |
|---|---|
| `app/` | Next 15.5 App Router. **라우트 그룹·병렬 라우트·middleware 없음** |
| `app/_components/` | AuthForm, LoadingIndicator, PaginationLimitSelector, SigninCard · `app/_hooks/useDebounce.ts` |
| `lib/` | `auth.ts`(사실상 미사용), `orval-fetcher.ts`, `formdata.ts`, `file.ts`(`downloadFile`), `string.ts` |
| `__generated__/` | Orval, **커밋됨**. 별칭 `@/generated/*`(배럴은 `@/generated/index`로 명시). `endpoints/{admin,bman,mkt-event,overdue-payment,payment-method,payment,promotion,qa,txpr,user,vat}` (vat·admin은 사용 0~1) |
| 설정 | `next.config.mjs`(`withZentDevkit`, `distDir: dist`, `compiler.styledComponents`, SVGR, `/pro/:slug*` rewrite), `orval.config.ts`, `generate-env.mjs`(SSM → 루트 `.env`), `tailwind.config.js`(**`app/marketing-page/constants`의 `LOGO_COLORS`를 require**), `components.json`(shadcn, `tailwind.css` 경로는 모노레포 잔재) |
| CI | `.github/workflows/{pr-lint-build,pr-preview(라벨 `preview`),pr-preview-cleanup,default-build(push dev/stg/prd 자동)}.yml`, 루트 `Dockerfile`·`Dockerfile.preview` |

## app/ 라우트
| 라우트 | 형태 | 가드 |
|---|---|---|
| `/` | 서버. 세션 있으면 `/subscription` redirect, 없으면 SigninCard | — |
| `/subscription` | 서버 page → `CareSubscriptionContainer`(client) | `PAGE_CARE_SUBSCRIPTION` |
| `/bmans` | 서버 page → `PaymentsContainer`(client, 18KB) | `PAGE_CARE_PAYMENT` |
| `/txprs/[txprInfrId]/payments` | **client** page → `PaymentsDetailContainer`(bmans 폴더 재사용) | **없음** |
| `/marketing-page` (+`create`, `edit/[id]`) | 목록 서버 page / create·edit는 client, `MarketingPageForm mode` | 목록만 `PAGE_CARE_MARKETING_PAGE`, **create·edit 없음** |
| `/promotion-page` (+`create`, `edit/[promotionId]`) | 목록 → `PromotionList` / `PromotionForm mode` | 목록만 `PAGE_CARE_MARKETING_PAGE`(전용 권한 없음), **create·edit 없음** |
| `/qa` (+`[userId]`) | **layout 가드**(유일). `NEXT_PUBLIC_ZENV === 'prd'`면 사용 불가 안내 | `PAGE_CARE_QA` |
| `/pro` (+`/pro/:slug*` rewrite) | `ConsoleIframe`으로 `pro.care.bznav.com/#/<slug>` iframe | `PAGE_CARE_PRO` |
| `/logout`, `/unauthorized`, `not-found`, `api/{auth,logout,ping}` | 시스템 | — |

도메인 하위 관례: `_components/`, `_hooks/`, `_utils/`, `stores/`(zustand), `schemas/`(zod), `hooks/`(`useInit<Domain>Form`), `utils/`, `constants/`. `promotion-page`가 가장 정돈된 골격.

## 스크립트
| 명령 | 내용 |
|---|---|
| `pnpm dev` | `next dev -p 13001` (webpack) |
| `pnpm lint` / `lint:check` | eslint + prettier |
| `pnpm genapi:local` / `genapi:pr` / `genapi` | Orval 재생성 (`.env.local` / `.env` / env) |
| `pnpm gen:env` | `generate-env.mjs --env=dev --app=care` (SSM, 루트 `.env` 생성 — `.env.local`이 아님) |
| `pkg:link` / `pkg:unlink` / `use:dev-pkgs` | zent-packages 로컬 링크 |

**`typecheck`·`test` 스크립트 없음.** 표준 검증 `scripts/verify/client-brics-care.sh`(lint:check + `tsc --noEmit`).
