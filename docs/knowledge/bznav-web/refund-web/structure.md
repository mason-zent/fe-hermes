# bznav-web apps/refund-web 구조 맵

기준 `origin/prd-refund` `4be90b5eb` (2026-09-16), 파일 625개, `pages/*.tsx` 109개. 경로는 `apps/refund-web/` 기준. 레포 공통은 `../common.md`.

## 앱 메타 / 스크립트
- `refund-web` v26.9.161, `"type": "module"`. `exports: { ".": "./index.ts" }`는 **존재하지 않는 파일** 참조(죽은 필드)
- `dev`: `pnpm gen:env && pnpm gen:relay && next dev -p 3200 --webpack` · `build`: `pnpm gen:relay && next build` · `gen:api` = `gen:schema` → `gen:survey-schema` → `gen:relay` · `gen:env`: SSM(`--env=loc`) · `gen:schema`: `dev-gateway.api.bznav.com/graphql` → `graphql/schema/schema.graphql` · `gen:survey-schema`: openapi-typescript → `graphql/schema/survey-model.ts`(gitignore) · `gen:relay`: `relay-compiler relay.config.json`
- 런타임 deps: next 16.2.5, react 19.2.6, react-relay 18.2 / relay-runtime 20.1, jotai 2.17, `@repo/{ui,platform,tracking-service,user-session,user-sign,common-utils}`, `@zenterprise-inc/ui`(deprecated), nice-modal, channel-talk loader, RHF+yup, react-use, es-toolkit, firebase, clsx, date-fns, cmdk, react-markdown, bignumber.js, axios, react-error-boundary. **xstate/@xstate/react, jspdf/html2canvas는 사용 0(설치만)**

## pages/ 라우트
| 그룹 | 경로 | 역할 |
|---|---|---|
| 랜딩·콘텐츠 | `home/landing/index.tsx`(`/`의 rewrite 목적지) · `home/[...content]`, `landing/[...slug]`, `event/[...slug]`(어드민 콘텐츠 catch-all, depth≤3) · `home/index.tsx`(환급 홈) · `home/reviews` | BE 어드민 콘텐츠 + 파트너 UTM 이미지 SSR |
| 이벤트 | `home/event/{share,redirect,terms/privacy}` | 친구초대 |
| survey | `survey/{start,intro,home,completed,expired}` · `survey/business/*`(11) · `survey/employment/*` · `survey/reopen/{index,[questionCode],complete}` | 창업감면·고용증대 설문 |
| tax(본류) | `tax/refund/lookup/{request,queue,result,reenactment}` · `apply/{complete,result,reenactment}` · `{bank-account,phone-number,payment-card(/input)}` · `cancel/{prevention,reason}` · `test` | 조회 → 신청 → 취소 |
| trp / trr | `trp/{index,cancel,success}`(결제 링크 `?token=`) · `trr/index.tsx`(알림톡 코드 → 쿠키) | |
| hometax-auth | `select-method`, `id-auth`, `simple-auth/{input,confirm,confirm-auto}`, `joint-certificate/{install,select}` | 홈택스 인증 3방식 |
| follow-up | `request`, `result/{success,wait,impossible}`, `personal-deduction/{index,collect}` | 사후관리 |
| help | `help/index`(허브), `guide/[slug]`, `faq`, `deposit-method` | SEO 콘텐츠(getStaticProps + JSON-LD) |
| simple | `simple/[corpType]/apply/{index,success}`, `simple/timeout` | 알림톡 간편 신청 |
| menu · auth · error | `menu/{index,my/*,refund-history,terms}` · `auth/*`(`@repo/user-sign` 위임) · `error/hometax/*`(8), `error/payment/*`(3), 기타 4 | |
| 기타 | `redirect.tsx`(로그인/파트너 진입 분기 허브) · `service-down`(점검, `proxy.ts`가 rewrite) · `api/{sitemap,robots}.ts` | |

## components/ · graphql/ · lib/
- `components/`: `common/`(+`context`, `refund-agreement`), `event/`, `follow-up/`, `help/`, `hometax-auth/*`, `landing/`, `layout/`, `menu/*`, `simple-terms/`, `survey/*`(+`common/ui`), `tax-refund/*`, `trp/`. **조회 결과 화면은 템플릿 버전 폴더**(`tax-refund/lookup/result/apply-possible/template/v-2026MMDD/…`) — 삭제 금지
- `graphql/query/`(30) · `graphql/mutation/`(29) · `graphql/schema/schema.graphql`(커밋) · `graphql/__generated__/`(**`__generated__.md`만 커밋**)
- `lib/stores/`(Jotai: 루트 8 + `refund/` 4 + `survey/` 3) · `lib/relay/`(`relay-environment`, `use-fetch-relay-factory`, `relay-loggers`) · `lib/hooks/`(50+, 도메인별 `api/`) · `lib/utils/`(`common-ssr`, `feature-rollout`, `joint-certificate`, `url`, `z-currency` …) · `lib/constants/`(20, `paths.ts` 한글 키) · `lib/content-page/`(`api.ts`, `server.ts` 공용 gSSP 팩토리, `path.ts`) · `lib/channel-talk/` · `lib/graphql/server-fetch.ts`(gSSP raw fetch) · `lib/styles/index.scss` · `lib/regex/`(yup 스키마) · `lib/sitemap.mjs` · `lib/seo-policy.mjs`(**`.mjs`를 `.tsx`에서 확장자 포함 import**)
- 루트: `next.config.mjs`, `relay.config.json`, `tailwind.config.ts`, `tsconfig.json`(`@/*`), `declaration.d.ts`(`*.svg → any`), **`proxy.ts`**(Next 16 미들웨어: 점검 rewrite, working-platform·UTM·maintenance 쿠키)
