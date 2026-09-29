# bznav-rn-app 구조 맵

기준 `origin/prd` `a161710` (2026-09-23, PR #90 `feature/v5.1.2/SENA-269`). 규칙은 `rules.md`, 예시 파일은 `patterns.md`, 절차는 `workflows.md`.

## 스택 (정확한 버전은 `package.json` · 지문 `.sync/snapshots/bznav-rn-app.json` — 여기엔 적지 않는다)
| 항목 | 무엇 |
|---|---|
| 앱 | 비즈넵 (`com.emmental.bznav.mobile`, iOS·Android 동일), scheme `bznav`. 앱 버전·buildNumber·versionCode 는 `app.config.js` (브랜치 이름 `feature/v<앱버전>/…` 의 버전이 이것) |
| 런타임 | Expo SDK · React Native · React · TypeScript (`main` 보다 몇 메이저 앞) |
| 내비게이션 | React Navigation — `@react-navigation/native` · `native-stack` · `bottom-tabs` (expo-router 없음) |
| 데이터·상태 | TanStack Query · zustand · axios |
| 스타일 | NativeWind + tailwindcss 3, `clsx` + `tailwind-merge`(`cn`) |
| 웹뷰 | `react-native-webview` |
| 애니메이션 | reanimated · worklets · lottie · `@gorhom/bottom-sheet` |
| 푸시 | `@react-native-firebase/messaging`(패치 있음) · `expo-notifications` · `@notifee/react-native` · Salesforce MCE(`@allboatsrise/expo-marketingcloudsdk`) · 채널톡(`react-native-channel-plugin`) |
| 딥링크·분석 | Airbridge(SDK + expo 플러그인) · Mixpanel · Firebase Analytics/Remote Config · Sentry |
| 로그인 | 카카오 · 네이버 · Apple |
| OTA | `expo-updates`, `runtimeVersion.policy = "appVersion"`, `checkAutomatically: "NEVER"`(스플래시에서 수동 체크) |
| 도구 | yarn 1(`packageManager`), Node `.nvmrc`, ESLint 9 flat(`eslint-config-expo`) |

## 루트
```
App.tsx  index.js  src/  assets/  plugins/  patches/  scripts/  docs/plans/  ai_prompt/
app.config.js  eas.json  metro.config.js  babel.config.js  tailwind.config.js  global.css  svgTransformer.js
tsconfig.json  eslint.config.js  nativewind-env.d.ts  airbridge.json  firebase.json  .firebaserc  env.example  .nvmrc
.claude/  .cursor/  .specify/  CLAUDE.md  .cursorrules  prompt_rules.md  README.md  harness-engineering-plan.md  security-audit-report.md
```
`ios/`·`android/` 는 **gitignore** — Continuous Native Generation(`expo prebuild`)으로 만든다. 네이티브 수정은 `app.config.js`·`plugins/**`·`patches/**` 로만 한다.

| 경로 | 역할 |
|---|---|
| `index.js` | 진입점. `registerRootComponent` **전에** FCM 백그라운드 핸들러·notifee 백그라운드 핸들러·Airbridge 콜백(딥링크·어트리뷰션) 등록 |
| `App.tsx` | Sentry init, 폰트·Firebase·네이버·게스트 세션 초기화, 스플래시(`BznavSplashScreen`) → Provider 트리(`GestureHandlerRootView` › `SafeAreaProvider` › `QueryClientProvider` › `KeyboardProvider` › `BottomSheetModalProvider` › `LogoutBottomDrawerProvider` › `PushNotificationBottomDrawerProvider` › `DialogProvider` › `DevUrlSwitcherOptional` › `NavigationContainer`) + `GlobalLoadingOverlay` + 토스트 호스트 3종. `isShowCaseMode` 플래그(기본 false)면 `ComponentShowcase` |
| `assets/` | `fonts/`(BZNAVSans 8종) · `images/` · `svg/{icons,images}/`(`react-native-svg-transformer` 로 컴포넌트 import) · `lotties/` · `firebase/`(설정 파일 — 시크릿 취급) · `licenses.json` |
| `plugins/` | 로컬 config plugin — `fcm-routing/android.js`(FCM 단일 진입점: 채널톡 → MCE → expo), `channeltalk/{ios,android}.js` |
| `patches/` | `patch-package` — `@react-native-firebase+messaging+23.8.8`, `react-native-enriched-markdown+0.6.0`(iOS 네이티브) |
| `scripts/` | `firebase-distribute-{android,ios}.sh`, `generate-licenses.js`, `fastlane/`(iOS dev IPA) |

## src/
| 폴더 | 역할 | 대표 파일 |
|---|---|---|
| `navigation/` | RootStack·MainTab·타입·전역 ref | `RootStackNavigator.tsx`, `MainTabNavigator.tsx`, `types.ts`(`RootStackParamList`, 화면별 `XxxScreenProps`), `navigationRef.ts`(`navigate`/`goBack`/`getCurrentRouteName`) |
| `screens/` | 화면. 루트에 스택 화면, `auth/`·`tabs/`·`survey/`·`showcase/` | 아래 화면 표 |
| `components/` | 공통 UI(디자인 시스템) + 기능 컴포넌트 | `AppText.tsx`, `button/`(BoxButton·IconButton), `checkbox/`, `divider/`, `list/`, `card/`, `input/Textarea`, `modal/dialog/`, `toast/`, `topNavigation/`, `progress/`, `skeleton/`, `organisms/`(ciVerification·terms·stickyBottom·title·description), `BottomTabWebView.tsx`, `CustomTabBar.tsx`, `BznavSplashScreen.tsx`, `chat/`, `notification/`, `channelTalk/`, `dev/`(DEV URL 스위처) |
| `handlers/` | 앱 외부 입력 처리 | `webViewMessageHandler.ts`(웹→앱 브릿지), `deepLinkHandler.ts`, `pushNotificationHandler.ts`(1.2k줄), `pushTypeHandlers.ts`, `navigationHandler.ts`, `airbridgeAttributionHandler.ts` |
| `services/` | axios API 함수 | `authService`·`userService`·`termsService`·`versionService`·`notificationService`·`surveyService`·`sessionService`·`agentChatService`·`aiChatService`(SSE 는 XHR) |
| `hooks/api/` | React Query 훅 + `queryKeys.ts` | `useAuth`·`useUser`·`useTerms`·`useVersion`·`useNotification`·`useSurvey`·`useAgentChat`·`useSession`·`useAiChat` |
| `hooks/` | 그 외 훅 | `useScreenLifecycle.ts`, `useDialog.ts`, `useChannelTalk.ts`, `useChannelTalkPushDrawer.ts`, `useTabFocusAnimation.ts` |
| `store/` | zustand (persist 없음) | `userStore`, `navigationRequestStore`, `tabBadgeStore`, `notificationStore`, `mixpanelStore`, `attributionStore`, `loadingStore`, `channelTalkStore`, `cookieStore`, `agentChatSessionStore` |
| `config/` | 환경·클라이언트 | `app.ts`(`Constants.expoConfig.extra`), `axios.ts`, `react-query.ts`, `url.ts`(웹뷰 URL·도메인↔탭), `webView.ts`(공통 WebView props), `devUrlPresets.ts`·`devUrlOverrides.ts`, `firebase.ts`, `remoteConfig.ts` |
| `interface/` | API 요청·응답 타입(`AppResponseDto<T>` 는 `auth.ts`) | `auth`·`notification`·`survey`·`agentChat`·`chat`·`sso`·`withdraw`·`app` |
| `types/` | 앱 타입 | `tabs.ts`(`TAB_CONFIG`), `webViewMessage.ts`(브릿지 규약), `common.ts`(`TargetApp`, `SERVICE_KEYS`), `axios.d.ts`(`showGlobalLoading`·`skipAuth`), `svg.d.ts` |
| `constants/` | 상수 | `navigationActions.ts`(`NavigationIntent`), `storageKeys.ts`, `collectionTabMenus.ts`(전체 탭 메뉴), `AppLinks.ts`, `layout.ts` |
| `tracking/` | Mixpanel 단일 진입점 | `TrackingService.ts`, `buildEventName.ts`, `types.ts` |
| `theme/` | 디자인 토큰(tailwind.config 가 require) | `primitiveColor`, `semanticColor`, `spacing`, `radius`, `container`, `elevation`, `typography`, `bznavFonts` |
| `utils/` | 유틸 | `cn.ts`, `webViewUtils.ts`(앱→웹 전송·쿠키 주입 스크립트), `secureStorage.ts`(expo-secure-store), `createAuthCookies.ts`, `linkHandler.ts`, `fileDownloader.ts`, `logout.ts`, `appUtils.ts`, `migrations/v5_0_5_unifiedLogin.ts` |
| `contexts/` | `tabWebViewContext.ts`, `tabTransitionContext.ts` | |
| `data/` | `licenses.ts` | |

## 내비게이션 구조
```
NavigationContainer (navigationRef)
└─ RootStack (native-stack, headerShown:false, slide_from_right) — initialRoute = getInitialRoute()
   ├─ SignIn · SignTerms · UpdateTerms* · SignupCiVerification · UserCiVerification* · DuplicateAccount(slide_from_bottom)
   ├─ Main ─ MainTab (bottom-tabs, CustomTabBar, backBehavior:none, 마지막 탭 AsyncStorage 복원)
   │         ├─ refund      RefundContainerScreen   웹뷰 refund.bznav.com   (DEFAULT_TAB_ID)
   │         ├─ sena        SenaContainerScreen     웹뷰 ai.bznav.com/about
   │         ├─ care        CareContainerScreen     웹뷰 care.bznav.com (+ 채널톡 버튼)
   │         └─ collection  CollectionScreen        네이티브 "전체" 메뉴(계산기·플러스 등 링크)
   ├─ MyInfo · BusinessInfo · CustomerService · SettingScreen · NotificationScreen
   ├─ NotificationSettingMain · NotificationTotalSettings · ServiceNotificationSettings{serviceKey}
   ├─ Withdraw · WithdrawConfirm{verificationCode} · TermsAndPolicies · OpenSourceLicenses · LicenseDetail{licenseId}
   ├─ WebViewModal{url, presentation?: modal|push, showHeader?}
   ├─ ChatRoom{agent_id, topic_no?, entryPoint?}   네이티브 AI 채팅(SSE)
   └─ Survey*{surveyType, entryPoint?}
   (* gestureEnabled:false)
```
RootStack 23개 라우트(Main 포함), MainTab 4개. 탭 정의는 `src/types/tabs.ts` `TAB_CONFIG`(id·title·hasWebView·targetApp), MainTab 파라미터 타입 `MainTabParamList` 는 `MainTabNavigator.tsx` 안에 있다. 라우트 이름은 **딥링크 `OPEN_SCREEN` 의 `screen` 값**으로 그대로 쓰인다(`patterns.md` §7). 대부분 파일명에서 `Screen` 을 뺀 이름이고 `SettingScreen`·`NotificationScreen` 두 개만 `Screen` 이 붙는다 — 정본은 `src/navigation/types.ts` `RootStackParamList`.

## 화면 목록 (`src/screens/**`)
| 파일 | 라우트 | 성격 |
|---|---|---|
| `auth/SignInScreen.tsx` | SignIn | 소셜 로그인(카카오·네이버·Apple), v5.0.5 레거시 사용자 감지 |
| `auth/SignTermsScreen.tsx` · `auth/UpdateTermsScreen.tsx` | SignTerms · UpdateTerms | 가입 약관 / 약관 재동의 |
| `auth/SignupCiVerificationScreen.tsx` · `auth/UserCiVerificationScreen.tsx` | SignupCiVerification · UserCiVerification | 본인인증(CI) |
| `auth/DuplicateAccountScreen.tsx` | DuplicateAccount | 중복 계정 안내 |
| `tabs/{Refund,Sena,Care}ContainerScreen.tsx` | refund·sena·care | `BottomTabWebView` 래퍼 |
| `tabs/CollectionScreen.tsx` | collection | 네이티브 메뉴·미읽음 알림 |
| `MyInfoScreen` · `BusinessInfoScreen` · `SettingScreen` · `CustomerServiceScreen` | MyInfo · BusinessInfo · **SettingScreen** · CustomerService | 네이티브 |
| `NotificationScreen` · `NotificationSettingMainScreen` · `NotificationTotalSettingsScreen` · `ServiceNotificationSettingsScreen` | **NotificationScreen** · NotificationSettingMain · NotificationTotalSettings · ServiceNotificationSettings | 알림 센터·설정 |
| `WithdrawScreen` · `WithdrawConfirmScreen` | Withdraw · WithdrawConfirm | 탈퇴 |
| TermsAndPolicies · OpenSourceLicenses · LicenseDetail | 약관·라이선스 |
| `WebViewModal.tsx` | WebViewModal | 범용 웹뷰(모달/푸시) |
| `ChatRoomScreen.tsx` | ChatRoom | 네이티브 AI 채팅 (834줄, 최대) |
| `survey/SurveyScreen.tsx` | Survey | 네이티브 설문 |
| `showcase/ComponentShowcase.tsx` + `showcases/*` | (라우트 아님) | DS 컴포넌트 쇼케이스, `App.tsx` `isShowCaseMode` |

export 방식이 섞여 있다 — 대부분 `export default`, `LicenseDetailScreen`·`OpenSourceLicensesScreen`·`auth/*` 는 named. 배럴 `src/screens/index.ts`, `src/screens/auth/index.ts`.

## 설정 파일
| 파일 | 내용 |
|---|---|
| `app.config.js` | **`APP_VARIANT`(development/production) 필수 — 없으면 throw.** 변형별 이름(`비즈넵`/`비즈넵 (Dev)`)·`extra`(environment·키·EAS projectId), iOS infoPlist·associatedDomains·Privacy Manifest, Android intentFilters(airbridge·app.bznav.com), plugins 목록, fonts, `updates`(channel 헤더 `production`/`development`), `runtimeVersion: appVersion` |
| `eas.json` | build 프로필 `development`(internal apk, channel development) · `production`(store, aab) · `production-apk`(internal apk). `appVersionSource: local` |
| `metro.config.js` | `getSentryExpoConfig` + `withNativeWind(input: global.css)` + SVG transformer, production 에서 `drop_console` |
| `babel.config.js` | `babel-preset-expo`(jsxImportSource nativewind) + `nativewind/babel`, non-development 에서 `transform-remove-console` |
| `tailwind.config.js` | `src/theme/*` 토큰을 colors·spacing·radius·lineHeight 로 확장, `containerPadding`·`elevation`·`typoGraphy` 플러그인, 폰트 `bznav` |
| `tsconfig.json` | `expo/tsconfig.base` + strict, paths `@/*`·`@assets/*`, include `src/**`·`App.tsx`·`index.js`·`nativewind-env.d.ts` |
| `eslint.config.js` | expo flat + tanstack query + 커스텀 규칙(`rules.md`) — 현재 로드 실패 |
| `env.example` | 필요한 env 키 이름(값 없음) |

## 스크립트 (package.json)
| 명령 | 용도 | 에이전트 |
|---|---|---|
| `start:{dev,prod}:{lan,tunnel}` | Metro 개발 서버 | 가능 |
| `yarn start` · `yarn ios` · `yarn android` | 순수 `expo start`·`expo run:*` — `APP_VARIANT` 가 없어 `app.config.js` 가 throw 한다 | 쓰지 않는다(`APP_VARIANT=development` 를 붙이면 가능) |
| `ios-device:*` · `android-device:*` | `expo run:*` 로컬 네이티브 빌드·실기기 | 필요 시만(기기 필요) |
| `yarn prebuild:clean:{dev,prod}` | `ios/`·`android/` 재생성 | 필요 시만 |
| `android:clean` | `cd android && ./gradlew clean` — 기존 Android 빌드 산출물 정리 | 필요 시만 |
| `yarn env:{dev,prod}` | `eas env:pull` → `.env` | **금지**(시크릿) |
| `yarn update:{dev,prod}[:ios|:android]` | prebuild → `eas update`(코드 푸시) → Sentry 소스맵 | **금지**(배포) |
| `yarn ios:dev:ipa:local` · `android:{dev,prod}:*:local` | `eas build --local` | **금지**(배포 산출물) |
| `yarn firebase:distribute:{android,ios}` | Firebase App Distribution | **금지**(배포) |
| `yarn sentry:upload:dsym` | dSYM 업로드(다른 사람 로컬 경로 하드코딩) | **금지** |
| `postinstall` | `patch-package` | 자동 |
| (없음) | lint·typecheck·test 스크립트 없음 → `scripts/verify/bznav-rn-app.sh` 가 `yarn eslint src`·`yarn tsc --noEmit` 을 직접 실행 | — |

## 레포 원문 목록 (prd 기준)
| 파일 | 내용 | 상태 |
|---|---|---|
| `CLAUDE.md` | 스택 요약, **피그마 개발 규칙** | 유효 |
| `.claude/rules/design-system-core.md` | NativeWind·`cn()`·금지 사항 | 유효 (상세는 규칙 파일이 아니라 스킬) |
| `.claude/rules/tracking.md` | Mixpanel `TrackingService` 규칙 | 유효 |
| `.claude/skills/design-system-{colors,typography,spacing,components,layout}/SKILL.md` | 디자인 토큰·컴포넌트 사용법 | 유효 |
| `.claude/commands/speckit.*`, `.specify/` | spec-kit 커맨드 | hermes 에이전트엔 노출 안 됨 |
| `.cursorrules` → `prompt_rules.md` → `ai_prompt/*.md` | 컴포넌트·zustand 가이드 | 일부 낡음(위 코드 규칙 참고). 가리키는 `design-system-rules.md`·`apptext-usage-rules.md` 는 없다 |
| `.cursor/rules/design-system-core.mdc` | Cursor 용 DS 규칙 사본 | — |
| `docs/plans/sena-notification-bridge-interface.md` | 세나 알림 브릿지(No.13·14) 규약 | 구현됨, 응답 부분은 코드와 다름(`gotchas.md`) |
| `docs/plans/navigation-intent-v2-plan.md` | 딥링크·푸시 v2 설계 | 설계 문서. 구현은 일부만(`patterns.md` §7) |
| `README.md` | 전반 | **낡음**(Expo 53·RN 0.79·npm·Node 18 기준) |
| `harness-engineering-plan.md` | AI 하네스 구축 계획(2026-04) | 계획. husky·아키텍처 테스트 등 미구현 |
| `security-audit-report.md` | 보안 감사(2026-04-24) | 일부 반영(`gotchas.md`). 값은 옮기지 않는다 |
