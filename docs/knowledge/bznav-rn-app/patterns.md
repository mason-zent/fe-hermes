# bznav-rn-app 대표 패턴 파일

"이런 걸 만들 땐 이 파일을 보고 따라라." 경로는 레포 루트(`repos/bznav-rn-app`) 기준, `origin/prd` `a161710`. **`main` 의 `app/`(expo-router) 파일은 참고하지 않는다.**

## 0. 전제
- 앱은 **하이브리드**다. 서비스 화면(환급·세나·케어)은 탭의 웹뷰(bznav-web 앱)이고, 앱이 직접 그리는 것은 로그인·약관·본인인증·알림·설정·탈퇴·전체 메뉴·AI 채팅(ChatRoom)·설문 정도다. 웹 화면 변경은 이 레포 일이 아니다
- 별칭 `@/*` = `src/*`, `@assets/*` = `assets/*`. SVG 는 `import IcX from "@assets/svg/icons/ic_x.svg"` 로 컴포넌트처럼 쓴다(`svgTransformer.js`, `src/types/svg.d.ts`)
- 컴포넌트는 arrow function(`func-style`), 본문 순서 변수·상태 → 라이프사이클 → 함수 → 기타 훅 → UI

## 1. 네이티브 화면 추가
- **보고 따라라**: `src/screens/CustomerServiceScreen.tsx`(정석 — `BackbuttonTopNavigation` + `ScrollView` + `AppText` + `BoxButton` + `useDialog` + `toast`) · 짧은 것 `src/screens/TermsAndPoliciesScreen.tsx` · 파라미터 받는 것 `src/screens/ServiceNotificationSettingsScreen.tsx`
- 골격: `const XScreen = ({ navigation, route }: XScreenProps) => { … }` + `export default XScreen`. props 타입은 `src/navigation/types.ts` 에 `NativeStackScreenProps<RootStackParamList, "X">` 로 선언
- 루트 `<SafeAreaView className="flex-1 bg-neutral-background-main">`(`react-native-safe-area-context`) → 상단 `BackbuttonTopNavigation`/`CloseButtonTopNavigation`(`src/components/topNavigation/`) → 본문 `container-padding-medium` → 하단 고정 버튼은 `organisms/stickyBottom/StickyBottomWrapper`
- 스크린 라이프사이클은 `useScreenLifecycle({ firstFocus, focus, blur, unmount })`(`src/hooks/useScreenLifecycle.ts`). 예 `src/screens/WebViewModal.tsx`
- 화면 조회 트래킹은 `useFocusEffect` + `TrackingService.sendViewEvent`(예 `src/screens/tabs/SenaContainerScreen.tsx`)

## 2. 내비게이션 등록
- 3곳을 함께 바꾼다: `src/navigation/types.ts`(`RootStackParamList` 에 `X: {...} | undefined` + `XScreenProps`) → `src/navigation/RootStackNavigator.tsx`(`<Stack.Screen name="X" component={XScreen} options={…}/>`) → 배럴 `src/screens/index.ts`(선택)
- 뒤로가기 막기 `options={{ gestureEnabled: false }}`(UpdateTerms·UserCiVerification·Survey), 아래서 올라오는 전환 `animation: "slide_from_bottom"`(DuplicateAccount)
- 컴포넌트 밖에서 이동: `navigate("X", params)` / `goBack()` / `getCurrentRouteName()`(`src/navigation/navigationRef.ts`)
- 완료 후 동작을 파라미터로 넘기는 패턴 `CompletionActionType`(`GO_BACK` / `NAVIGATE_TO_MAIN` / `NAVIGATE_TO_CI`) — 약관·본인인증 화면(`UpdateTermsScreen`, `UserCiVerificationScreen`)
- **탭을 늘리는 건 별개 작업**: `src/types/tabs.ts` `TAB_CONFIG` + `MainTabNavigator.tsx` `MainTabParamList`·`<Tab.Screen>` + `CustomTabBar.tsx` 아이콘 + `src/config/url.ts` `getWebviewUrls`·도메인 매핑 + `TargetApp`(`src/types/common.ts`)

## 3. 웹뷰 탭 · 웹뷰 모달
- 탭 웹뷰: `src/components/BottomTabWebView.tsx`(689줄) — 인증 쿠키 주입(`createAuthCookiesForApp` + `generateCookieInjectionScript`, `src/utils/{createAuthCookies,webViewUtils}.ts`), `injectedJavaScriptBeforeContentLoaded`, 로그인 후 초기 경로 복원(`getInitialRouteStorageKey`), 링크 가로채기 `onShouldStartLoadWithRequest` → `handleLinkClick`(`src/utils/linkHandler.ts`) → 같은 탭/다른 탭/`WebViewModal`/인앱 브라우저/외부·intent:// 분기, `navigationRequestStore` 의 `OPEN_TAB_WEBVIEW` 소비
- 래퍼: `src/screens/tabs/SenaContainerScreen.tsx`(`TabWebViewContext` 에 ref 등록, `getUrlConfigInstance().webviewUrls[TAB_ID]`)
- 공통 WebView props 는 `src/config/webView.ts` `commonWebViewConfig` 를 펼쳐 쓴다
- 모달 웹뷰: `navigate("WebViewModal", { url, presentation?: "modal"|"push", showHeader? })` — `src/screens/WebViewModal.tsx`. 여기 `onMessage` 는 `closeWebView`·`onSignOut` 만 처리한다. plus·calc 웹은 `isCalcOrPlusUrl` 이면 `src/utils/calcPlusWebViewAuth.ts` 의 `getCalcPlusAuthCookieInjectionScript` 로 인증 쿠키를 주입한다
- 환경별 URL은 `src/config/url.ts`(prod 고정값, dev 는 `devUrlPresets.ts` 프리셋 + `DevUrlSwitcher`). URL 을 컴포넌트에 하드코딩하지 않는다

## 4. 브릿지 메시지 (웹 ↔ 앱)
- **규약**: `src/types/webViewMessage.ts` — `PostMessageAction` enum, `WebViewRequestMessage{ messageId?, sender, actionName, data? }`, `WebViewResponseMessage{ messageId, sender:"bznav-app", isSuccess, data?, error?{code,message} }`, 액션별 `XxxMessage` 인터페이스. 외부 원문 `[P31-PLN]20250902-앱 <-> 웹 통신 인터페이스`, 추가분 `docs/plans/sena-notification-bridge-interface.md`
- **웹 → 앱 처리**: `src/handlers/webViewMessageHandler.ts` `handleWebViewMessage` — origin `*.bznav.com` 검증 → JSON 파싱 → sender 가 `bznav-refund|bznav-sena|bznav-care` 인지 → `switch (actionName)` → `handleXxx`. 액션별 sender 제한은 핸들러 안에서(`displayPushNotification`·`setTabBadge`·`openAppSettings` 는 세나만)
  - 현재 처리: `getAppVersion` · `fileDownload` · `navigateUrl` · `setSignInInitialRoute` · `onSignInSuccess` · `onSignOut` · `senaAiAgree` · `openChannelTalk` · `displayPushNotification` · `setTabBadge` · `openAppSettings`
  - 응답이 필요한 액션은 `sendResponseToWebView(webViewRef.current, message.messageId || "", isSuccess, data, error)` — 예 `handleGetAppVersion`
- **앱 → 웹 전송**: `sendActionToWebView(ref, PostMessageAction.X, data)`(`src/utils/webViewUtils.ts`, messageId `app_<ts>_<rand>` 생성, Android 는 `injectJavaScript` 로 `window` 에 dispatch). 현재 쓰는 액션 `updateCookies`(`BottomTabWebView.tsx`) · `pageNavigation`(`sendPageNavigationToWebView`)
- 쿠키 전파는 `src/store/cookieStore.ts` → `BottomTabWebView` 가 구독해 `updateCookies` 전송. 권한 쿠키 예 `src/utils/pushPermissionCookie.ts`(`BZNAV_APP_PUSH_ENABLED`)
- 앱 상태를 웹이 지정하는 예: `setTabBadge` → `src/store/tabBadgeStore.ts` → `CustomTabBar.tsx`

## 5. API · React Query
- **세로 한 벌 보고 따라라**: 타입 `src/interface/survey.ts` → 서비스 `src/services/surveyService.ts` → 훅 `src/hooks/api/useSurvey.ts` → 키 `src/hooks/api/queryKeys.ts` → 사용 `src/screens/survey/SurveyScreen.tsx`
- 서비스: `axiosInstance`(`src/config/axios.ts`, 기본 baseURL = SSO API) 로 호출, `AppResponseDto<T>`(`src/interface/auth.ts`, `{result, status, message?, data?}`)를 그대로 반환, `try/catch` 에서 `console.error` 후 `throw`. 다른 서버는 요청 옵션 `{ baseURL: getXBaseURL() }`(예 survey·agentChat → plus API, `versionService` → edge-config CDN, `sessionService` → core API)
- 요청 옵션 확장(`src/types/axios.d.ts`): `showGlobalLoading: false`(POST/PUT/PATCH/DELETE 는 기본으로 전역 로딩 오버레이가 뜬다), `skipAuth: true`(Bearer 제외). 인터셉터가 `Authorization`·`x-device-id`·`X-User-Id` 를 붙이고 에러를 Sentry 로 보낸다
- 훅: `useXQuery(params, options?: Omit<UseQueryOptions<…>, "queryKey"|"queryFn">)` → `useQuery({ queryKey: queryKeys.x.y(params), queryFn, ...options })`, mutation 은 `useXMutation(options?: UseMutationOptions<…>)` → `useMutation({ mutationFn, ...options })`(예 `src/hooks/api/useUser.ts`)
- 쿼리 키는 **반드시 `queryKeys`** 에 추가(`all` → 하위 함수 계층). 훅 밖에서 같은 키가 필요하면 파라미터 상수를 export(예 `UNREAD_NOTIFICATION_LIST_PARAMS`, `useNotification.ts`)
- 새 훅은 `src/hooks/api/index.ts` 에 export 추가. 서비스는 `src/services/index.ts`(단 agentChat·aiChat 은 배럴에 없다)
- 기본값(`src/config/react-query.ts`): `staleTime 0`, `gcTime 0`, 4xx 재시도 없음·그 외 2회, `refetchOnWindowFocus false`, mutation 재시도 없음. 캐싱이 필요하면 쿼리별 `staleTime`(예 설문 정의 5분). `gcTime 0` 이라 화면을 벗어나면 캐시가 바로 사라지니, 보존이 필요하면 `gcTime` 도 따로 명시
- 스트리밍(AI 채팅)은 axios 가 아니라 XHR `responseText` 증분 파싱 — `src/services/agentChatService.ts`, `src/hooks/api/useAgentChat.ts`

## 6. zustand 스토어
- **보고 따라라**: `src/store/tabBadgeStore.ts`(짧은 정석 — 인터페이스 + `create<XState>((set, get) => …)` + 같은 값이면 set 생략) · `src/store/userStore.ts`(Sentry·Mixpanel 연동 부가효과)
- 컴포넌트는 셀렉터로 구독 `useXStore((state) => state.y)`. 컴포넌트·훅 밖(핸들러·인터셉터)에서는 `useXStore.getState()`
- persist 미들웨어는 쓰지 않는다. 영속이 필요하면 `AsyncStorage`(키는 `src/constants/storageKeys.ts` `STORAGE_KEYS` 에 추가), 토큰은 `secureStorage`(`src/utils/secureStorage.ts`, expo-secure-store)
- 화면 이동 의도 공유는 `src/store/navigationRequestStore.ts`(§7)

## 7. 딥링크 · 푸시 → 화면 이동
- 공통 모델 `NavigationIntent`(`src/constants/navigationActions.ts`): `OPEN_TAB` · `OPEN_TAB_WEBVIEW{url, tab, forceNavigate?}` · `OPEN_WEB_MODAL{url, tab?, showHeader?}` · `OPEN_SCREEN{screen, tab?, params?}` · `OPEN_CHANNEL_TALK{tab?}`
- 흐름: 입력(딥링크·푸시) → 파서 → `executeNavigationIntent`(`src/handlers/navigationHandler.ts`) = `navigationRequestStore.setNavigationRequest` → `MainTabNavigator.tsx` 의 effect 가 소비(필요하면 `prepareRootStackForNavigationIntent` 로 스택을 Main 까지 pop → 탭 전환 → 목적지)
- 딥링크 `src/handlers/deepLinkHandler.ts` `handleDeepLink`: Airbridge 추적 URL → `Airbridge.click` / v1 `bznav://open?url=…`(도메인→탭, 그 외 `*.bznav.com` 은 전체 탭 위 `OPEN_WEB_MODAL`) / v2 `bznav://navigate?action=…` → `parseNavigateIntent`
- **`OPEN_SCREEN` 의 `screen` 은 RootStack 라우트 이름 그대로**(`ChatRoom`, `Survey`, `NotificationScreen` …) — 화이트리스트 없이 `navigate(screen)` 한다. 설계 문서의 `CALCULATOR_SALARY` 같은 상수는 코드에 없다
- 푸시 `src/handlers/pushNotificationHandler.ts` `navigateFromPushData`: ① `data.type` 커스텀(`src/handlers/pushTypeHandlers.ts` `PUSH_TYPE_INTENT_BUILDERS`) ② flat `action` 파라미터(`parseNavigateIntent` 재사용) ③ `openDirectUrl`/`url` → `handleDeepLink`
- **새 푸시 type 추가 = `PushType` 에 값 + `PUSH_TYPE_INTENT_BUILDERS` 에 빌더 하나**(선례 `chat_answer_completed` → 세나 채팅방 `OPEN_TAB_WEBVIEW` + `forceNavigate`)
- 콜드스타트 순서: `index.js` 에서 Airbridge·FCM 백그라운드·notifee 핸들러를 `registerRootComponent` 전에 등록 → 스토어에 intent 저장 → Main 진입 후 소비. 코드 푸시 reload 직전 intent 는 `PENDING_NAVIGATION_REQUEST` 로 저장했다가 `App.tsx` `handleSplashFinish` 에서 복원
- 인앱 푸시 카드 `showInAppPushToast`(`src/components/toast/`), 채널톡 푸시 `useChannelTalk`·`ChannelTalkPushDrawer`

## 8. NativeWind · 디자인 시스템 컴포넌트
- 규칙 `.claude/rules/design-system-core.md`, 토큰·컴포넌트 표 `.claude/skills/design-system-*/SKILL.md`(colors·typography·spacing·components·layout). 토큰 정의는 `src/theme/*` → `tailwind.config.js`
- 텍스트 `AppText`(`src/components/AppText.tsx`) + 타이포 클래스 `{display|heading|body|caption|label}-{size}-{weight}`(예 `body-medium-regular`) + 색 `text-neutral-foreground-main`
- 조건부 클래스 `cn()`(`src/utils/cn.ts`, clsx + tailwind-merge). `style={{}}` 은 애니메이션 등 NativeWind 불가 시만. JS 에서 색이 필요하면 `semanticColor`/`primitiveColor`(`src/theme/`) 참조(예 SVG `color`)
- 공통 컴포넌트: `button/`(`BoxButton` variant·size, `IconButton`) · `checkbox/` · `divider/` · `list/List` · `card/Card` · `input/Textarea` · `atoms/Switch` · `progress/` · `skeleton/` · `topNavigation/` · `organisms/*`
- 다이얼로그 `const { showDialog } = useDialog()` → `showDialog({ title, description, buttons: { primary: { text, onClick }, secondary: { text } } })`(`src/hooks/useDialog.ts`, 예 `CustomerServiceScreen.tsx`). 바텀시트 `@gorhom/bottom-sheet`(예 `components/chat/AiChatIntroBottomDrawer.tsx`)
- 토스트 `toast({ variant: "enabled"|"success"|"warning"|"loading", title })` 또는 `useToast()`(`src/components/toast/useToast.ts`). `src/components/toast/lib/` 는 vendored 라이브러리 JS — 고치지 않는다
- 쇼케이스 `src/screens/showcase/showcases/*Showcase.tsx` — 새 DS 컴포넌트를 만들면(허락받은 경우) 여기에도 추가

## 9. 트래킹 (Mixpanel)
- 규칙 `.claude/rules/tracking.md`, 진입점 `src/tracking/TrackingService.ts`: `sendViewEvent`(action `viewed`) · `sendClickEvent`(`clicked`) · `sendEvent`(그 외 action 명시). 이벤트명은 `category_object_detail_action` 을 `buildEventName` 이 조합 — 문자열 리터럴 금지
- 예: 탭 클릭 `TrackingService.sendClickEvent({ category: "gnb", object: "tab", attributes: { title: tab } })`(`MainTabNavigator.tsx`), 탭 조회 `sendViewEvent`(`SenaContainerScreen.tsx`)
- `zenv`·`app_id`·UTM 은 자동 부착 — 호출부에서 넘기지 않는다. UTM 저장은 `attributionStore.setAttribution()`(Airbridge 어트리뷰션 `src/handlers/airbridgeAttributionHandler.ts`)

## 10. 네이티브 설정 · config plugin
- 권한 문구·도메인·intent filter·SDK 키 주입은 `app.config.js`, 네이티브 파일 수정이 필요하면 로컬 plugin(`plugins/fcm-routing/android.js` — `withAndroidManifest` + `withDangerousMod` 로 Kotlin 서비스 생성, `plugins/channeltalk/ios.js` — `withAppDelegate`). 인라인 plugin 예 `app.config.js` 하단(AndroidManifest `tools:replace`, gradle.properties jvmargs)
- 서드파티 네이티브 버그는 `patches/*.patch`(patch-package)
- 이 절의 변경은 모두 **스토어 빌드 대상**(`workflows.md` E·G)

## lint 규칙 상세 (`eslint.config.js`)
- 구성: `eslint-config-expo/flat` + `@tanstack/eslint-plugin-query` `flat/recommended` + 레포 규칙
- `func-style: expression`(arrow 허용) — `ai_prompt/component-development-rules.md` 예시의 `export default function` 은 따르지 않는다
- `@typescript-eslint/no-use-before-define` — `functions:false`, `variables:false` 라 컴포넌트 안에서 아래에 정의한 핸들러를 위쪽 콜백·effect 에서 참조하는 건 허용(`MainTabNavigator.tsx`). `classes`·`typedefs` 는 검사
- `no-var`, `prefer-const`
