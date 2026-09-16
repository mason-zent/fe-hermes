# bznav-web apps/care-web 대표 패턴 파일

경로 `apps/care-web/` 기준, `origin/dev` `0b713b4`. 문서(`.github/agents/care-web.agent.md`, `.ai/basic-rule.md`)는 `constant/`라 낡았다 — **코드 우선**.

## P1. 페이지 골격 — `'use client'` + `Suspense` + `CareLayout`
- `app/(my-info)/my-book/page.tsx`: `'use client'` → 상태 가드(`useEffect` + `replace(CARE_PATHS.홈)`) → `<Suspense fallback><AccountBook/></Suspense>`. 내부에서 Relay `useLazyLoadQuery` → 바깥 Suspense 필수
- 셸 `<CareLayout topNavigation={<BaseTopNavigation/>} …>`(`components/common/layout/CareLayout.tsx`)
- 최상위 page가 `'use client'`면 `metadata` 불가 → **P2**

## P2. 메타데이터 = 서버 `layout.tsx` + 옆 `metadata.ts`
- `app/(auth)/billing/layout.tsx`: `import { xxxMetadata } from './metadata'; export const metadata = xxxMetadata; const Layout = ({children}) => <>{children}</>`. 공통값 `constants/metadata.ts`(`METADATA`, `SERVICE_ORIGIN`, `OG_IMAGE`)

## P3. 인증 경계 = layout의 `CareAuthGuard` (14개 layout)
- `components/common/auth/CareAuthGuard.tsx` = `@repo/user-session` `AuthGuard` + mount 시 `saveReturnUrl(pathname+query)` + `logoutPagePath={CARE_PATHS.로그인}`. `app/(auth)/layout.tsx`는 신고기간 수임 차단 분기 추가

## P4. `CARE_PATHS` — 한글 키 경로 상수 (`constants/paths.ts`)
- `CARE_PATHS = { 랜딩: '/', 로그인: '/login', '4대보험위임동의_사업장선택': '/four-insurance', 프리미엄_랜딩: '/premium', … }`. 숫자로 시작하면 따옴표·`CARE_PATHS['…']`
- 도메인이 크면 별도 객체 `GLOBAL_INCOME_PATH`, `VAT_PATH`, `PAYROLL_PATHS`, `PRICING_PATHS`, `YEAR_END_TAX_PATHS`(**함수형**), `ADDITIONAL_EXPENSE_PATHS`, `GATEWAY_PATHS`, `PAYMENT_PATH`. `PERFORMANCE_LANDING_PATHS`는 `(performance-landing)/*`와 1:1(주석)

## P5. Relay — 정의는 `graphql/`, 호출은 `hooks/`
- `app/**/graphql/*.ts`: `export const prePayment = graphql\`mutation prePaymentMutation(...) { prePayment(...) { __typename ... on PrePaymentSucceed { message } ... on TemporaryError { message } ... on BaseError { message } } }\`` — **응답 union + `__typename` + `... on BaseError/TemporaryError` 분기가 스키마 전반 관례**
- 훅 빈도: `useMutation` 84 · `useLazyLoadQuery` 74(`store-and-network` 자주) · `useFragment` 45(global-income) · `useQueryLoader`+`usePreloadedQuery` 38(`useEffect`에서 `loadQuery(…,{fetchPolicy:'network-only'})`, `refetch*` 반환)
- 타입 `@/__generated__/<opName>.graphql`(alias 흔함). 환경 `libs/relay/relayEnvironment.ts`(싱글턴, apiToken 변경 시 재생성), `libs/provider/relayProvider.tsx`가 `useAuthContext()` 토큰 주입

## P6. Jotai — 라우트 옆 `store/*Atom.ts`
- 단순 `export const selectedOrgAtom = atom<string>('')`
- 영속(33파일) 3종 세트: `safeSessionStorage`(`@toss/storage`)로 `getInitialValue()` + `createJSONStorage<T>(() => sessionStorage, { reviver })` + `atomWithStorage(STORAGE_KEYS.X, getInitialValue(), storage)`. **키는 `constants/storageKey.ts`의 `STORAGE_KEYS`**
- 파일명 `store/<name>Atom.ts` 권장(일부 `atoms/`, `currentOrg.ts` 혼재). 전역은 루트 `store/`, `libs/provider/GlobalAtomProvider.tsx`

## P7. 이벤트 로깅 (`libs/eventLogger`) — 가장 자주 쓰는 패턴
- 클릭 `<ClickEventLogger careEvent={{ category:'care', object:'app-install' }} attributes={{…}}><BoxButton/></ClickEventLogger>`(248파일, `cloneElement`로 onClick 래핑)
- 뷰 `<ViewEventLogger careEvent>`(161) 또는 `useCareViewEventLogger({careEvent, attributes, isVisible})`. 스크롤 `ScrollEventLogger`
- 코어 `useCareEventLogger()` → `useUserEventLogger().sendEvent(name, attrs, { sendTargets: SEND_TARGETS.MIXPANEL_DATADOG })`. **이벤트명 `[category, object, detail, action].filter(Boolean).join('_')`**, AB테스트 정보 자동 머지. 카테고리 `constants/careEvent.ts`(한글 키)

## P8. 채널톡 (`libs/channelTalk`) — `useChannelTalk().showMessenger` / `openChannelTalk()`(84파일). `openChannelTalk.ts`: 앱 웹뷰면 `nativeBridge`(`sendBznavNativeMessage('openChannelTalk', {type:'messenger'|'chat'|'bot'})`, 브릿지 없으면 `false` → 웹 폴백 `window.open(CHANNEL_TALK_URL)`. 초기화 `components/common/init-channeltalk/InitChannelTalk.tsx` 1회. **`@repo/ui`의 문의 버튼은 제거되어 `app/pricing/components/TopNavigationInquiryButton.tsx`로 이관**

## P9. 카카오 (`libs/kakao`) — `openKakaoTalk(cxId)`(모바일+카톡 인앱만 `kakaotalk://me/cert/sign`), `isKakaoInAppBrowser`, `useKakaoPixel`. 홈택스 간편인증 카카오 UI `app/(auth)/(homeTax)/components/Kakao*`

## P10. 홈택스 — `(auth)/(homeTax)/{delegation,linkhometax}`의 `(stage)`/`(nonStage)` 그룹. `HometaxGuard`, `hooks/useHometax*`, `useCheck*ContinuousFlow`. 자격증명 `STORAGE_KEYS.HOMETAX_*` + `hometaxPasswordAtom`

## P11. 결제·구독 (`(auth)/billing`) — `checkout/(stage|complete|alreadyFinish)`, `payment-method/[bizNo]/card`(+`context/CardFormContext.tsx`), `renewal/*`, `unpaid/*`, **`refactor/*`(신 UI, 신구 공존)**. 가드 `RegisterGuard`, `RenewalGuard`. PG 복귀 `(gateway)/payment-gateway/*` + `api/my-account-result/*`

## P12. 모달·시트 — `@repo/ui` `Drawer`/`Dialog` 압도적(`XxxDrawer.tsx`, `XxxDialog.tsx`, 에러는 `XxxErrorDialog`). 상태는 atom으로 관리하는 경우 많음(`paymentModalStatusAtom`). radix 직접은 `appSideBar/sheet.tsx`만. **nice-modal은 Provider만(useModal 0)**, `@radix-ui/react-accordion` 0

## P13. 폼 — RHF(90) + yup(48) + resolvers(43). 스키마 `constants/formSchema.ts`, 정규식·메시지 `utils/reg.ts`(`*Reg`). 페이지가 `FormProvider`, 하위 `XxxForm`이 `useFormContext<T>()`. **필드 키 한글**(`'담당자이름'`). `setValue` + `getFieldState().isTouched && trigger()` 관용구

## P14. SEO/AEO — JSON-LD 공용 `app/cs-center/components/JsonLd.tsx`(3곳). 통이미지 카피 sr-only: `app/(landing)/constants/landingSeo.ts`의 `CARE_LANDING_SEO`(alt 포함). robots/noindex: `next.config.mjs` `headers()`가 `INDEXABLE_PATHS=['cs-center']` + 루트 외 전부 `X-Robots-Tag: noindex`. sitemap `next-sitemap.config.mjs`(`exclude: ['/*']` + `additionalPaths` 랜딩·cs-center 노션 lastmod)

## P15. 노션 (`cs-center`) — 서버 컴포넌트 `force-dynamic`. `lib/get-notion-record-map` → `sanitize-notion-record-map`(allowlist, 유일한 도메인 테스트) → `components/Renderer.tsx`(`react-notion-x`). 실제 노션 픽스처 커밋 금지(합성만)

## P16. 소켓 — 1곳 `app/vat/service-connect/(connect)/connect-account/hooks/useGetSocketStatus.ts`(`socket.io-client`, `store/SocketStatusAtom`)

## P17. PDF — `react-pdf`+`pdfjs-dist` 뷰어가 도메인별 중복 14파일(공통화 안 됨, TODO). `next.config` `resolve.alias.canvas = false`. rewrites `/pdf/*` GCS, `/vatpdf/*` CloudFront

## P18. 테스트 — `__test__/unit/<domain>/<name>.test.ts`, `import { describe, expect, it } from '@jest/globals'`, 순수 함수만. 컴포넌트·훅 테스트 0(RTL 설치만)

## P19. 패키지 — `@repo/ui` 1,122파일 **배럴 import**(BoxButton, IconButton, TextField, Card, MainTitle, List, Chip, BarTabs, Svg, Drawer, Dialog, Toaster, cn). `@zenterprise-inc/ui` 38(deprecated, billing·four-insurance·vat FAQ + `hooks/useCareToast.ts`). `@repo/user-session` 41, `@repo/platform` 35, `react-use` 102, `@toss/storage` 71, `date-fns` 63, `es-toolkit` 49. Tailwind 토큰 `container-padding-medium`, `py-normal-xlarge`, `bg-neutral-background-lowest`, `bg-bzc-gray-800`

## 설치만 됨 / 불일치
`@radix-ui/react-accordion` 0 · `ts-essentials` 0 · nice-modal `useModal` 0 · `react-inlinesvg` 1 · `html-to-image` 1 · `embla-carousel-react` 1 · `socket.io-client` 1 · `@microsoft/clarity` 1 · **`motion`(deps) 0인데 `framer-motion`(devDeps) 3파일 사용**(추측: 마이그레이션 잔재) · `components.json`의 `aliases.utils: "@/libs/utils"` 실재하지 않음(실제 `utils/`)
