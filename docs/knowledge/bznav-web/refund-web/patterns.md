# bznav-web apps/refund-web 대표 패턴 파일

경로 `apps/refund-web/` 기준, `origin/dev` `0b713b4`. **Pages Router 앱** — App Router 패턴(`app/`, `'use client'`, 서버 컴포넌트, `next/navigation`) 금지.

## P1. 페이지 골격 — 함수 컴포넌트 + `Page.getLayout` + (필요시) 얇은 gSSP
- `getLayout` 85파일(`_app.tsx`의 `PageContents`가 호출). gSSP 33/109, gSP 8/109, 나머지 순수 CSR
- gSSP는 거의 **쿼리·쿠키 → props**만: `pages/menu/my/index.tsx`, `pages/trr/index.tsx`(`setCookieData(ALIMTALK_CODE…, { req, res })`), `pages/tax/refund/lookup/result/index.tsx`(`satisfies GetServerSideProps`)
- **Relay 프리로드를 gSSP에서 하지 않는다**: Relay는 클라 전용(Suspense 게이트에서 SSR bail). SEO 데이터는 `lib/graphql/server-fetch.ts` raw fetch
```tsx
Page.getLayout = (page: ReactElement) => (
  <AuthGuard><DefaultLayout leftItem={'back'} rightItems={['inquiryTextButton']}>{page}</DefaultLayout></AuthGuard>
);
```
`AuthGuard` 40파일, `DefaultLayout` 59파일. gSP에 데이터 없으면 `emptyStaticProps`(`lib/utils/common-ssr.ts`)

## P2. Relay
- 정의는 **항상 `graphql/query|mutation/**`**, 페이지는 import만: `export const applyPossibleContentQuery = graphql\`query applyPossibleQuery($refundId: String!) {…}\``(`graphql\`` 66파일). 타입은 `@/graphql/__generated__/<opName>.graphql`(haste)
- 훅 빈도: `useMutation` 29 > `useLazyLoadQuery` 22 > `useQueryLoader`/`usePreloadedQuery` 19 > `useFragment` 3(홈 3곳)
- **`useQueryLoader` + `usePreloadedQuery` 쌍이 survey 표준**: 페이지 `const [queryRef, loadQuery] = useQueryLoader(q)` → `useEffect`에서 `loadQuery(vars, { fetchPolicy: 'network-only' })` → `if (!queryRef) return <Spinner/>` → 자식 Container가 `usePreloadedQuery`(`pages/survey/business/signboard.tsx` + `components/survey/business/signboard/SignboardContainer.tsx`)
- 명령형 `fetchQuery(relayEnvironment, q, vars).toPromise()`(`lib/hooks/refund/api/use-check-search-status.ts`). 뮤테이션은 `lib/hooks/**/api/use-*.ts` 래퍼로 commit + onCompleted/onError + toast/dialog(`use-apply-refund.ts`)
- 환경 `lib/relay/relay-environment.ts`: 싱글턴, `relayApiToken` 바뀌면 재생성, `ENABLE_RELAY_RESOLVERS`, 서버에서는 캐시 안 함. 주입 `components/common/RelayEdkForAccessTokenProvider.tsx`. fetch(`use-fetch-relay-factory.ts`): `NEXT_PUBLIC_GQL_API_SERVER`, Bearer, `X-Zent-Session-Id`, uploadables면 multipart, `FORBIDDEN`이면 `setStatusSignOut()`

## P3. Jotai (`useAtom` 71 · `useAtomValue` 64 · `useSetAtom` 20)
- `export const xxxAtom = atom<T>(init)` / 파생 `atom(get => …)`(`lib/stores/survey/common.ts`)
- **storage atom은 전부 sessionStorage**: `atomWithStorage('bznav_refund-token', null, createJSONStorage(() => sessionStorage))` — 5파일(`ads, auth, biz-message, cancel-data, survey/common`). localStorage 선례 없음
- Provider: `_app.tsx` 전역 + **survey는 `SurveyProvider` 안 중첩 `JotaiProvider`**(스코프 격리, 추측)
- 함수형 sessionStorage 모듈도 공존: `lib/stores/refund/result-refund-data.ts`(TODO). `sessionStorage.getItem` 생 접근 여럿

## P4. xstate — **사용 0(설치만)**. 간편인증 폴링 등은 React state + Jotai. jspdf/html2canvas도 0

## P5. 랜딩 / 어드민 콘텐츠 페이지 (최근 핵심)
- 공용 gSSP 팩토리 `lib/content-page/server.ts`의 `createContentPageServerSideProps(resolvePath, { fallbackNotFoundToMain })`: BE path 해석(depth≤3), variant 쿠키(`variant_<path>`, **cookies-next 6은 gSSP에서 Promise 반환 → `await getCookieData`**), `?preview=true`, BE 장애 → `fallbackToMain`, `seoHead: { og, canonicalUrl }`
- `pages/{event,landing}/[...slug].tsx`, `home/[...content].tsx`는 **동일 15줄 골격** — 새 prefix는 그대로 복제
- 렌더 `components/landing/ContentPage.tsx`: `ContentPageBody`(sr-only `seoText` + 이미지 섹션 + IMC 배너), `ContentPageStickyCta`(내부 경로면 `preventDefault` + `router.push` — Mixpanel 유실 방지), `getLabAttributes(variant)`
- 파트너 UTM `lib/hooks/marketing/use-partner-main-image.ts`: `PARTNER_UTM_SOURCES = ['imbank','kbcardevent','kakaopay']`, URL UTM 우선 → 쿠키(`BZNAV_UTM_KEY`, `'referer'` 제외), 이미지 `main-introduce-<partner>.png`, SSR(`getServerPartnerMainImage`) + 클라 이중, `initial !== undefined`면 서버값 고수
- 어필리에이트 `use-affiliate.ts`(Pincrux/Buzzvil/Adison/Tnk → sessionStorage). FE 하드코딩 랜딩 `components/landing/{MainLanding,…}` + `lib/constants/home-landing-seo.ts`

## P6. SEO
- `_app.tsx` 단일 진입: `seoHead` 우선, 없으면 `getOgMetaData(asPath)`(`components/layout/OgMetaHead.tsx` 경로 맵). canonical `getCanonicalUrl` — `isNoindexPath()`면 null
- noindex는 `next.config.mjs` `X-Robots-Tag`(`NOINDEX_HEADER_SOURCES`). sitemap `pages/api/sitemap.ts`(BE 엔트리 + `SITEMAP_PUBLIC_ENTRIES`, 실패 시 정적만, `s-maxage=3600`). robots `pages/api/robots.ts`(`ROBOTS_POLICIES`, AI 봇별)
- JSON-LD 3곳(`help/index`, `help/guide/[slug]`, `RefundbadaLanding`): `JSON.stringify(ld).replace(/</g,'\\u003c')`

## P7. 트래킹 (`@repo/tracking-service`, 188파일)
- `const { sendClickEvent } = useUserEventLogger()` → `sendClickEvent('indis-request_phonenumber_next')`(117/111파일)
- `<PageViewEventLogger pageName properties eventOption={{ sendTargets: SEND_TARGETS.MIXPANEL_AIRBRIDGE_GA }}>`로 감싸기(77). `useEffect` 1회 발송은 레이스로 드롭(주석)
- 초기화 `components/layout/RefundAppContents.tsx`의 `<EventTrackingProvider>`(Mixpanel+세션리플레이 비율 Firebase RC, Airbridge, 픽셀들, Datadog)

## P8. 채널톡 `lib/channel-talk/` — `useInitChannelTalk`, `useChannelTalk().openChannelTalk`: 링크 끝 세그먼트를 botId로 `openSupportBot`, 아니면 `openWindow`. 링크 `lib/constants/link.ts` `SUPPORT_BOT_LINK`

## P9. 스타일 — **Tailwind 기본**(218파일), SCSS 모듈 19파일(레거시 랜딩·레이아웃·survey 공용 UI). 신규는 Tailwind(추측, 최근 파일 전부). 전역 `lib/styles/index.scss`. 토큰 `gap-normal-small`, `rounded-bzc-large`, `container-medium`

## P10. 폼 — RHF + yup **6파일만**(`simple-terms/*`, `phone-number`, `simple-auth/input`). 스키마 `lib/regex/*.ts`. 나머지 입력은 `useState` + `@repo/ui` `TextField`

## P11. 패키지 사용 — `@repo/ui` 201(Button/BoxButton, MainTitle, List, Svg, TextField, StickyBottomWrapper, `useToast`, `useDialog`, BaseTopNavigation) · `@repo/user-session` 63(`AuthProvider/AuthGuard/useAuthContext`) · `@repo/common-utils` 60 · `@repo/platform` 50(`useUTM`, `useWorkingPlatform`, `usePageRouterAdapter`) · `@repo/user-sign` 21 · `@zenterprise-inc/ui`(deprecated) 27 — 신규는 `@repo/ui`. 모달 nice-modal 30. 라우팅 `next/router` `useRouter` 123(`useCommonRouter` 1). 이미지는 생 `<img>` + CDN(`next/image` 4)

## P12. 홈택스 인증 — `select-method` → 간편(`simple-auth/input` → `confirm`|`confirm-auto`) / ID / 공동인증서(`install` → `select`). 훅 `lib/hooks/hometax-auth/api/use-hometax-auth.ts`(`useRequestSimpleAuthToken/PollingToken/ConfirmToken`), `use-simple-auth-status-polling.ts`. `?from=` → `simpleAuthFromTypeAtom` + `FROM_TYPE_CONFIG`. 자동 폴링은 `simpleAuthAuto*Atom` 분리. 대기열 `hometaxBlockSettingsAtom`. 공동인증서만 axios(`lib/utils/joint-certificate.ts`). 에러 매핑 `components/tax-refund/common/error/error.ts`

## P13. 설문 — `SurveyProvider` = `AuthGuard` → 스코프 `JotaiProvider` → `SurveyInitProvider`(`fetchQuery(refundHistoryIdQuery)` → `loadQuery(surveyInitQuery)` → atom 주입). 문항 페이지 `getLayout = <SurveyProvider><BusinessProvider>…` + `useQueryLoader`/`network-only` + `PageViewEventLogger`. 공용 UI `components/survey/common/ui/`. 경로 `SURVEY_PAGES`(한글 키)

## P14. A/B·롤아웃 — `use-lookup-result-lab.ts`(`FIXED_LAB_ID = 'EXPERIMENT_A'`, 템플릿 폴더 매핑, 과거 버전 유지), variant 쿠키, `feature-rollout.ts`(djb2 버킷), Firebase RC `useRemoteConfig`

## 사용 적은 라이브러리
xstate 0 · jspdf/html2canvas 0 · axios 1 · bignumber.js 1 · cmdk 1 · react-markdown 1 · react-error-boundary 1 · firebase 6 · es-toolkit 9 · date-fns 9 · react-use 15
