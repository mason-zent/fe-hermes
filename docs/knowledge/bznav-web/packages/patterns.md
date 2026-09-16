# bznav-web packages/* 대표 패턴
## `@repo/ui` 컴포넌트 (`src/components/button/BoxButton.tsx`)
- `cva()` variants/size → `defaultVariants` → `cn(variants({…}), {조건부})`. `cn` = `twMerge(clsx(inputs))`(`src/libs/utils.ts`)
- `forwardRef<HTMLButtonElement, Props>` + `Props extends VariantProps<typeof xxxVariants>` + `displayName`. 토큰은 Tailwind 클래스(`bg-primary-background-main`) 또는 `semanticColor` 객체
- Radix(accordion, checkbox, dialog, dropdown, switch, toast, tooltip …) + `vaul`(Drawer) + `react-day-picker`(Calendar) + nice-modal(`BankListDrawer`, `IframeModal`)

## 배럴 2단 (중요)
- `src/components/index.ts` `export *` 나열(중복 다수) → **루트 `packages/ui/index.ts`는 named 열거**(101 값 + 15 타입 + theme/`cn`/hooks). 루트에 이름을 적지 않으면 앱에서 못 쓴다. 미노출 확인: `AppSidebar`, `Sidebar`, `Sheet`, `Step`, `TabItem`, `Overlay`, `BasicStepper`, `ProgressStepper`, `StepperTitle`, `DialogContext`

## 스토리 (`BoxButton.stories.tsx`) — `Meta<typeof X> { title: 'Bznav-UI/<그룹>/<이름>', component, tags:['autodocs'], parameters.docs.description(한국어), argTypes, args: { onClick: fn() } }` → `StoryObj` → `Default`

## `globals.css` / `tailwind.config` 상속
- 앱 진입점 `import '@repo/ui/globals.css'`(App Router는 `app/layout.tsx`, refund는 `pages/_app.tsx`). 앱 `tailwind.config.ts`는 `uiConfig` 스프레드, care·refund는 `presets: [deprecatedUiConfig, uiConfig]`
- `@repo/ui/tailwind.config.ts`의 `content`에 `../../packages/ui/src/**`와 **`../../packages/user-sign/src/**` 하드코딩** → 새 공유 패키지가 Tailwind를 쓰면 이 배열에 추가해야 purge 통과. 토큰 `src/theme/*.ts`(11). `@repo/ui/postcss.config` export는 앱 참조 0

## `@repo/platform` client/server
- `client.ts` 훅 11(`useCommonRouter`, `usePageNavigationEvent`, `useAppRouterAdapter`, `usePageRouterAdapter`, `useUTM`, `useWindowOpen`, `useWorkingPlatform`, `useBlockBackNavigation` …) + middleware 유틸 8 + RN 브릿지 4. `server.ts`는 `getServerWorkingPlatform(Type)`, `BROWSER_TYPE`
- `useCommonRouter`(`RouterProvider.tsx`): App/Pages Router를 `RouterAdapter`로 흡수. Provider 밖 호출 시 throw
- `useWorkingPlatform`: 모듈 로드 시 `getClientWorkingPlatform()` 1회로 jotai atom 4개 초기화. 값 `'web'|'app'|'kbank'|'toss'|'joins-hr'|'cashnote'|'app-deprecated'`

## `@repo/tracking-service`
- `BaseService`(abstract, `commonAttributes`) → 8 Service. `EventTrackingController`: 키 있을 때만 lazy 생성, `IS_IFRAME`이면 전부 early return. `sendEvent` 기본 타깃 `['mixpanel']`, mixpanel/airbridge 전송 시 MSK producer(`NEXT_PUBLIC_MSK_API_SERVER`)로 재전송(`loc` 제외)
- `SEND_TARGETS`: `MIXPANEL_ONLY`, `MIXPANEL_AIRBRIDGE`, `MIXPANEL_DATADOG`, `MIXPANEL_AIRBRIDGE_GA`, `TIKTOK_PIXEL_ONLY`
- 앱 API `useUserEventLogger(pageName?)` → `sendViewEvent/sendClickEvent/sendScrollEvent/sendRequestEvent/sendEvent/…`(suffix `_viewed/_clicked/_scrolled/_request` 자동). 중복 방지 `sentEventHistory` ref(`isAllowRetry`면 2초 후 제거), 페이지 이동 시 정리

## `@repo/user-session`
- `AuthProvider(appId, clientId, signPaths, navigationEvent, isUseCI=true)` → `AuthService` 컨텍스트 + `useAuthSession` + `useAppSignFlow`. Apple/Kakao SDK 스크립트 렌더
- `useAuthContext()` → `{ auth, authService, isSignInProgress, requiredAuthStep, accessType, returnUrl, startLoginWithCode, setStatusSignIn/SignOut/SignChecking, isAllowAuthGuard }`. `AuthData = { user, apiToken, status: 'login'|'logout'|'checking', isCurrentAppActive }`
- `AuthGuard`: `router.isReady && !isSignInProgress && status !== 'checking' && isAllowAuthGuard`일 때만. logout → `signPaths.signOut`, `signAppIds`에 앱 없으면 `saveReturnUrl` → `signUpTerms`. `CiGuard` 항상 렌더. 웹뷰 쿠키 동기화 `addBznavMessageListener('updateCookies')`
- `AuthService`: `NEXT_PUBLIC_CORE_API_SERVER`, `NEXT_PUBLIC_SSO_API_SERVER`. `BZNAV_AUTH_SESSION` 쿠키 없으면 로그아웃 처리(앱 제외)

## `@repo/user-sign` — 앱은 셸만, 본문은 패키지 컴포넌트(`SignDefaultLayout/SignBackButtonLayout/…` + `SignInContent`, `SignUpInput`, `SignTerms`(+Experiment), `CICollectionRequest`, `CIAuthentication`, `WithdrawConfirmContent`). `SignInContent`는 platform+user-session+tracking+ui 5패키지 결합점. prd/stg는 `email` 로그인 제외. nice-modal 사용처(`CICollectionRequest`, `SignTerms`, `TermDrawer`, `SignUpSuccessModal`). jotai `atomWithStorage`(`bznav-refund-terms-data` 등)

## `@repo/common-utils` export — 상수(`IS_CLIENT, IS_MOBILE, IS_KAKAO_APP, IS_IFRAME, IS_PRODUCTION, AUTH_COOKIE_DOMAIN`, 스토리지 키 8), strings(`uuidV4, sha256Hash, sharePage, addQueryParamsUrl, convertPhoneNumberFormat`), session(`getSessionId, getClientSessionId`), fetch(`requestFetch/requestPostFetch/requestGetFetch`), cookie 5, hooks(`useIsomorphicLayoutEffect, useTimer`), objects, datetime(`convertUTCDate, formatToKST`), device

## 자산 — `Icon`은 CDN(`ICON_LIST` → `Svg` → `getImageSrc` → `prd.cdn.bznav.com/<serviceName>/<type>/<file>`). `serviceName` 기본값이 `Icon.tsx` `'common'` vs `getImageSrc` `'care'`로 불일치
## `ui-deprecated` 잔존 — 앱 65파일(care 38, refund 27). `src/index.ts`가 `@deprecated` JSDoc shim. 실사용 `Button` 27 > `Description` 10 > `Title/List/BottomDrawer` 9
