# bznav-web apps/care-web 구조 맵

기준 `origin/dev` `0b713b4` (2026-09-16), 파일 2,470개. 경로는 `apps/care-web/` 기준. 레포 공통은 `../common.md`. **2026-09 NEWCARE-633/634 리팩터링 반영**(`constant/`→`constants/`, 도메인 파일을 라우트 폴더로, `libs/hooks`·`libs/store`→루트 `hooks/`·`store/`).

## 앱 성격
- Next 16.2.5 App Router, `output: 'standalone'`, dev 3100 `--turbo`. **모든 라우트가 동적 렌더**: `app/layout.tsx`의 `await getServerWorkingPlatform()`(sena와 같은 관례, 랜딩 SEO용 서버 HTML)
- `'use client'` **1,376파일** — 클라이언트 컴포넌트가 기본. 서버 컴포넌트는 `cs-center`, `api/*`, 메타데이터 전용 layout

## app/ 라우트 (파일 수)
| 경로 | 수 | 역할 |
|---|---|---|
| `global-income/` | 504 | 종합소득세. `(auth)/(submit-material)`, `billing/` |
| `vat/` | 477 | 부가세. `(status)`, `submit-material/(submitMaterial)/(category\|connection)`, `service-connect`, `estimated-tax`, `tax-result`, `history`, `refund-account` |
| `payroll/` | 370 | 급여·원천세. `(part-time)`, `input`, `submit`, `status`, `result`, `finish` |
| `(auth)/` | 215 | 로그인 필수 온보딩: `(homeTax)/{delegation,linkhometax}`, `billing/*`(+`refactor/` 신 UI), `four-insurance/*`, `taxagentinput`, `complete` |
| `additional-expense/` | 97 | 추가경비증빙(OCR) |
| `pricing/` | 87 | 이용료 조회. `(form)`, `(experiment)/verification` |
| `(my-info)/` | 86 | `home`, `my-book`, `my-info` |
| `year-end-tax/` | 71 | 연말정산 `[year]`, `employee/[year]/[employeeId]` |
| `business-card/` 65 · `startup-check/` 63 · `certificate/` 32 · `card-expense/` 3 | | |
| `(landing)/` | 55 | `(performance-landing)/{beauty-industry,food-industry,mail-order-industry,single-person-business,income-tax,events,premium}` — 대부분 미들웨어로 차단, **`/premium`만 활성** |
| `(external-file-download)/` | 20 | `file-download/{vat,payroll,my-book,…}` |
| `(gateway)/` | 18 | 외부 진입/복귀 14종(`payment-gateway/{success,failed,cancel}`, `cashnote-gateway`, `pro-gateway`, …) |
| `cs-center/` | 13 | 도움말 센터(노션 렌더 + JSON-LD, 서버 컴포넌트) |
| `user-status/` 11 · `(login)/` 10 · `api/` 7 · `(registry)/` 7 · `(payment)/` 6 · `(kakaoTalk-notification)/` 5 · `test/` 3 · `service-maintenance/` 1 | | |
| 루트 | | `layout.tsx`(metadata, `GlobalProviders` → `Toaster` → Registry 4), `GlobalProvider.tsx`, `error.tsx`, `not-found.tsx`, `globals.css` |

## `GlobalProvider.tsx` 중첩 (바깥→안)
`GlobalErrorBoundary` → `InitUtm` → [조건부 deprecated `ToastProvider`] → `PageNavigationEventProvider` → `CareAuthProvider` → `CareEventTrackingProvider` → `RelayProvider` → `CareAuthSignProvider` → `EventLoggerProvider` → `SidebarProvider` → `GlobalAtomProvider` → `DialogProvider` → `TooltipProvider` → `NiceModal.Provider` → `CareUserInfoProvider` → `CacheProvider` → `SplashWrapper` → (`AppSidebar`, `InitChannelTalk`, children)
- ⚠️ `SSR_PATHS = ['/', '/cs-center']`에서만 deprecated `ToastProvider`(`@zenterprise-inc/ui`)를 벗긴다(SSR 차단 때문). 여기에 deprecated `useToast`를 쓰는 경로(vat·billing·four-insurance)를 넣으면 **런타임 throw**

## `proxy.ts` (Next 16 미들웨어)
`composeMiddleware(...)`가 `reduceRight` → **인자 앞쪽이 먼저 실행**: `withServiceMaintenanceMiddleware` → `withLandingRedirectMiddleware` → `withSetWorkingPlatform` → `withSafeReturnUrlMiddleware` → `withAbTestMiddleware` → `withVatRedirectMiddleware` → `withPricingRedirectMiddleware`. 구현 `libs/hoc/`

## 루트 폴더
- `components/common/`: `appSideBar/`(shadcn 복사본 sidebar·sheet), `auth/CareAuthGuard.tsx`, `errors/`, `eventLogger/ViewEventLogger`, `guard/HometaxGuard`, `layout/CareLayout`, `logoTopNavigation/`, `pdfComponents/`, `topNavigation/` 등. 빈도: `ClickEventLogger` 248 · `CareLayout` 216 · `ViewEventLogger` 161 · `CareAuthGuard` 15
- `constants/`(20): **`paths.ts`**(430줄, `CARE_PATHS` 한글 키 + 도메인별 `*_PATHS` 객체, 참조 264파일), `careEvent`, `storageKey`(`STORAGE_KEYS`), `formSchema`, `metadata`, `abTestValue`, `vatPeriod` …
- `hooks/`(30 공용) · `store/`(루트 atom 5) — 도메인 atom은 라우트 옆 `store/`(트리 전체 95파일)
- `libs/`: `relay/`(`relayEnvironment`, `fetchRelayFactory`), `provider/`(Care*Provider 7), `hoc/`(미들웨어 7 + compose), `eventLogger/`(`useCareEventLogger`, `ClickEventLogger` 등), `channelTalk/`(`openChannelTalk`, `nativeBridge`), `kakao/`, `social/`, `imageResizer/`
- GraphQL: 정의는 **라우트 옆 `graphql/`**(경로에 `/graphql/` 236파일) + 루트 `graphql/`(공용 6). `schema/schema-care.graphql`(커밋). `__generated__/`(`.gitignore`, md만)
- 테스트: `__test__/unit/`(10, util 함수만), `jest.config.mjs`(next/jest, jsdom), `__mocks__/svgrMock.js`

## 스크립트
`dev`(`pnpm relay && next dev -p 3100 --turbo`) · `build`(`pnpm relay && next build`) · `postbuild`(next-sitemap) · `relay` · **`type-check`** · `lint`(eslint+stylelint) · **`test:unit`** · `gen:schema:dev|dev2|prd`. **`gen:env` 없음**(Secrets Manager 수동). 표준 검증 `scripts/verify/bznav-web.sh care-web`
