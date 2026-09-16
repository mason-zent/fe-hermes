# client-brics-refund 구조 맵

기준 `origin/dev` `34966dd` (2026-09-14). `/sync`가 사실 부분을 갱신한다. 규칙 `rules.md`, 예시 `patterns.md`, 절차 `workflows.md`, 함정 `gotchas.md`.

## 루트
| 경로 | 역할 |
|---|---|
| `app/` | Next 15 App Router. page 52개, layout 26개. **전 화면이 `app/refund-service/<도메인>/<화면>`** 아래 |
| `app/_components/` | 전역 공통 9개(DialogProvider, UnmaskToggle, BaseFileUploader, LoadingSpinner, NiceModalProvider, PrivateAccessDialog, SigninCard, AuthForm, PaginationLimitSelector) + `modals/UserSearchModal.tsx` |
| `app/_lib/` | `masking.ts`, `privateAccess.ts`, `usePrivateAccessState.ts`, `hooks/`(useUnmaskedEndpoints, useCsvDownload 등 3개) |
| `lib/` | `constants/`(common·advertisement·landing-seo·partner) · `types/`(도메인별 **zod 스키마** 15파일) · `utils/`(datetime·strings·api-error·image) · `swr/`(수동 훅 틀) · `orval-fetcher.ts` · `formdata.ts` · `crmListUploadHelper.ts` |
| `__generated__/` | Orval 생성물, **git 커밋됨**. `endpoints/<태그>/<태그>.ts` 23개 — **태그 디렉터리명이 한글**(`제휴처`, `광고구좌`, `알림톡`, `파이프-드라이브`, `콘텐츠-페이지-어드민`, `sso-약관` …) + `models/`. 별칭 `@/generated/*` |
| `docs/landing-seo-claude.md` | 랜딩 SEO Claude 프롬프트 문서 |
| 기타 | `orval.config.ts`, `generate-env.mjs`(SSM→.env), `next.config.mjs`(`distDir: dist`, svgr), `.github/workflows` 4개, `Dockerfile(.preview)` |

`middleware.ts` 없음 → **권한 가드는 전부 `layout.tsx`**. `app/layout.tsx` = ThemesProvider > SessionProvider > NiceModalProvider > DialogProvider > `@ui` RootWrapper + Toaster.

## app/refund-service/ 라우트
| 라우트 | 화면 | 가드 (layout의 AuthFunction) |
|---|---|---|
| `refund-overview/[refundType]`(+`[id]`) | 환급 목록·상세(indis/indis-tritx/corps), unmask | `PAGE_REFUND_OVERVIEW` |
| `user/all` | 회원 목록(검색·unmask·Context) | `PAGE_REFUND_ALL_USER` |
| `partner/discount`(+create/edit) | **표준 CRUD 3화면 — 복사 원본** | `PAGE_REFUND_PARTNER_DISCOUNT` |
| `advertisement/ad-slots`(+detail) | 광고구좌. page가 `dynamic(…, {ssr:false})` | `PAGE_REFUND_AD_SLOTS` |
| `advertisement/landing-modals`(+create/edit) | CRUD | `PAGE_REFUND_LANDING_MODAL` |
| `advertisement/promotion`(+create/edit/user) | CRUD + 참여자·엑셀 | `PAGE_REFUND_LANDING_MODAL` ⚠️ landing-modals와 동일(복붙 추정) |
| `advertisement/landing-seo`(+detail/[id]) | 랜딩 SEO(ZIP 임포트·Claude 프롬프트·미리보기) | **없음** — 로그인만 + TODO |
| `advertisement/cpa-benefit` | 대량 전화번호 조회(폼→결과) | `PAGE_REFUND_CPA_BENEFIT` |
| `business-message/{crm,history,template}` · `crm/register-users` | CRM·이력·템플릿, CSV 대량 업로드 | 상위 layout `PAGE_REFUND_BUSINESS_MESSAGE` |
| `business-message/auto-crm-control` | 카드형 on/off + 이력 | `PAGE_AUTO_CRM_CONTROL` |
| `hometax-block`(+`/m`, `wait-screen-log/[logId]`) | 탭 3개 로그, 모바일 오버레이 | `PAGE_REFUND_HOMETAX_BLOCK` |
| `content/terms`(+create/edit) · `content/sso-terms` | 약관 CRUD / SSO 약관 | `PAGE_REFUND_CONTENT_TERMS` / `PAGE_REFUND_SSO_TERMS` |
| `emergency/{notice,maintenance}` | 공지·점검 | `PAGE_REFUND_EMERGENCY_NOTICE` / `PAGE_REFUND_MAINTENANCE` |
| `card-register/criteria`(+create) | 카드 표기 기준 | `PAGE_REFUND_CARD_CRITERIA` |
| `bznav-app/minimum-version` | 단일 폼 | `PAGE_REFUND_ALLOWED_MINIMUM_APP_VERSION` |
| `pipe-drive/failure-record` | 읽기 전용 목록 | `PAGE_REFUND_PIPE_DRIVE_FAILURE` |
| `research/{history,register}` | 조회/등록 | `PAGE_REFUND_RESEARCH` |
| `simple-apply/create-link` | 검색→숏링크 | `PAGE_REFUND_SIMPLE_APPLY_LINK` |
| `qa/{alimtalk,auto-login-link,hometaxerror,test-account}` | QA 도구 | 각 `PAGE_REFUND_QA_*` |
| `api/{auth,logout,ping}` · `unauthorized` · `not-found` · `logout` | 시스템 | — |

## 스크립트
| 명령 | 내용 |
|---|---|
| `pnpm dev` | `next dev -p 13002` (webpack) |
| `pnpm lint` / `lint:check` | eslint+prettier fix / check (husky + lint-staged) |
| `pnpm gen:env` | SSM → `.env` (`--env=loc --app=refund` 고정) |
| `pnpm gen:api:local` | `rm -rf __generated__ && dotenv -e .env.local -- orval && mv generated __generated__` (**hub의 `genapi`와 이름이 다름**) |
| `pnpm build` / `build:local` | 타입 오류는 여기서만 드러남 |
| `pkg:link` / `pkg:unlink` / `use:dev-pkgs` | zent-packages 로컬 링크 |

**`typecheck`·`test` 스크립트 없음.** 표준 검증은 `scripts/verify/client-brics-refund.sh`(lint:check + `tsc --noEmit`).
