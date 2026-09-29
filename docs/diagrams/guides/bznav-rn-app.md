# bznav-rn-app — 다이어그램 서비스 가이드

공통 원칙·archify 제약·검증 명령은 [`../AUTHORING.md`](../AUTHORING.md)에 있다. 이 문서는 bznav-rn-app 에만 해당하는 것만 적는다. 경로는 따로 적지 않으면 레포 루트 기준이다.

⚠️ **웹이 아니라 Expo · React Native 앱이다.** 라우터·page 파일이 없어서 `scripts/diagram-coverage.mjs`(App Router `page.*` · Pages Router `pages/**` 만 센다)로는 화면 전수를 셀 수 없다. 아래 1절의 대조 스크립트를 쓴다.

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/bznav-rn-app` (단일 앱, `hermes.config.json` `appDir: "src"`) |
| 앱 루트 | 레포 루트. 진입 `index.js` → `App.tsx`, 코드 `src/` |
| 기준 ref | `origin/prd` (`hermes.config.json`) — 이 가이드를 쓸 때 `a161710` (2026-09-23, PR #90 `feature/v5.1.2/SENA-269`) |
| 메인 체크아웃 주의 | `repos/bznav-rn-app` 메인 체크아웃은 2025-12 에 멈춘 `main`(expo-router `app/`, Expo 53)이다. **읽지 않는다.** prd 를 임시 워크트리로 받아 읽는다 |
| 스택 | Expo 55 · RN 0.83.6 · React 19.2 · React Navigation 7(native-stack · bottom-tabs) · TanStack Query 5 · zustand 5 · NativeWind 4 · react-native-webview 13.16 |
| 라우터 | `src/navigation/RootStackNavigator.tsx`(Stack.Screen 23, 그중 `Main` 은 탭 내비게이터) → `src/navigation/MainTabNavigator.tsx`(Tab.Screen 4: refund · sena · care · collection) |
| 화면 수 | **src/screens 컴포넌트 37파일**(index.ts 제외) = 내비게이터 등록 26 + 쇼케이스 11(미등록). `*Screen.tsx` 는 25 — 등록 파일 중 `WebViewModal.tsx` 만 이름이 `Screen` 으로 끝나지 않는다 |

화면 수 세는 명령:

```bash
R=<prd 체크아웃>
git -C $R ls-tree -r --name-only HEAD src/screens | grep '\.tsx$'            # 37
grep -cE '<(Stack|Tab)\.Screen' $R/src/navigation/*Navigator.tsx               # 23 · 4
```

화면 전수 대조는 세션 스크래치의 `rn-coverage.py` 로 했다(레포에 넣지 않았다). 규칙: `src/screens/**/*.tsx`(index 제외) 37개가 **화면 전수 탭(`screens.architecture.json`) 한 곳에만** 정확히 한 번씩 있어야 한다. 탭 0 상세와 흐름 탭(웹뷰·푸시·인증)의 화면 파일 인용은 근거 인용이라 세지 않는다. 내비게이터 `component={…}` 를 파일로 풀어 등록 26 과 미등록 11 도 함께 확인한다. 2026-09-29 결과 — 누락 0 · 중복 0 · 없는 경로 0.

## 2. 지금 있는 장

모두 `meta.repository.revision` = `a161710`(40자 SHA)에 고정했다. `node scripts/check-diagrams.mjs` 에서 7장 모두 ✅ 최신(시퀀스는 sources 가 없어 점검 대상이 아니다).

| 종류 | 원본 → 결과 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|---|
| 구조 | `bznav-rn-app.architecture.json` → `bznav-rn-app.html` | `a161710` | 노드 17 · 연결 16. index.js → App.tsx → RootStack → 탭 웹뷰 → 비즈넵 웹, 위아래로 이동 요청 · 브릿지 · 푸시 · 상태 · axios · 외부(Airbridge · EAS · Firebase · Sentry · API) |
| 화면 맵 | `bznav-rn-app.domains.architecture.json` → `bznav-rn-app.domains.html` | `a161710` | 37파일을 18노드로. 탭 4 · 인증 6 · 스택 16 · 쇼케이스 11 |
| 요청 흐름 | `bznav-rn-app.sequence.json` → `bznav-rn-app.sequence.html` | 없음 | 대표 흐름 **세나 탭 첫 진입** — 쿠키 확인 → URL 조립 → 링크 판정 → 로드 → 브릿지 메시지 → 대기 이동 요청 (참여자 8 · 메시지 14) |
| 심층 번들 | `rn-app/build-bundle.py` → `rn-app/rn-app-architecture.html` | `a161710` (첫 탭에서 읽음) | 탭 5장. 목록 카드 링크는 헤르메스가 `scripts/build-diagram-index.mjs` 에 단다 |

## 3. 심층 탭 구성

화면 수는 37이지만 **웹뷰 탭 3개 안에서 bznav-web 수십 화면이 돈다.** 앱 코드의 무게는 화면보다 웹뷰·브릿지·푸시·딥링크·인증 흐름에 있어서 "화면 전수" 1장 + 흐름 3장으로 짰다.

| 탭 | 파일 | 경계 | 화면 | 노드 · 연결 |
|---|---|---|---|---|
| 0 상세 | `rn-app-detail.architecture.json` | 앱 전체. 진입 → 셸 → 스택 → 화면군 → 상태 → 관문 4종 → 외부 | 0 (대표 인용) | 28 · 26 |
| 1 화면 37 | `screens.architecture.json` | `src/screens/**` 전수 | **37** | 21 · 5 |
| 2 웹뷰 · 브릿지 | `webview-bridge.architecture.json` | `BottomTabWebView` 로드 · 링크 8분기 · 웹→앱 11 · 앱→웹 2 | 0 | 19 · 16 |
| 3 푸시 · 딥링크 | `push-deeplink.architecture.json` | 입구 4 → NavigationIntent 한 칸 → MainTab 5 액션 | 0 | 20 · 20 |
| 4 인증 · 세션 | `auth-session.architecture.json` | 재설치 검사 · 시작 라우트 · 소셜 로그인 · 약관·CI · 쿠키 · 로그아웃 | 0 | 17 · 18 |

`build-bundle.py` 의 `DRILL`: 탭 0 `webtabs`·`tabweb`·`bridge` → 2, `intent`·`navreq` → 3, `rootstack`·`auth`·`authstore` → 4, `collection`·`settings`·`feature` → 1 / 탭 1 `refund`·`sena`·`care` → 2, `signin`·`renew` → 4 / 탭 2 `tabnav`·`deeplink` → 3, `authact` → 4 / 탭 3 `consume` → 2, `stackscr` → 1. localStorage 키 `rn-app-diagram-tab`.

### 탭 1 — 화면 37 의 묶음

| 묶음 | 파일 | 화면 | 노드 |
|---|---|---|---|
| 탭 | `src/screens/tabs/` | 4 | `refund` · `sena` · `care` · `collection` |
| 인증 | `src/screens/auth/` | 6 | `signin` · `signup`(2) · `renew`(2) · `dup` |
| 설정 · 계정 | `src/screens/` 루트 — Setting · MyInfo · Withdraw · WithdrawConfirm · BusinessInfo · CustomerService · TermsAndPolicies · OpenSourceLicenses · LicenseDetail | 9 | `setting` · `account`(3) · `info`(3) · `license`(2) |
| 알림 · 기능 | 루트 — NotificationSettingMain · NotificationTotalSettings · ServiceNotificationSettings · Notification · ChatRoom · WebViewModal, `survey/` | 7 | `notiset`(3) · `noti` · `chatroom` · `survey` · `modal` |
| 쇼케이스 (미등록) | `src/screens/showcase/` | 11 | `sc1`~`sc4` |

### 흐름 탭이 근거로 삼는 파일 — 이 파일이 바뀌면 그 탭을 고친다

**탭 2 웹뷰 · 브릿지**
- 로드: `src/components/BottomTabWebView.tsx`(checkTabAuthValue · URL 조립 · onLoadEnd · 리마운트 · 대기 이동 소비) · `src/config/webView.ts` · `src/config/url.ts`
- 쿠키: `src/utils/createAuthCookies.ts` · `src/utils/webViewUtils.ts` `generateCookieInjectionScript` · `src/utils/senaServiceUtil.ts` · `src/utils/pushPermissionCookie.ts` · `src/store/cookieStore.ts`
- 링크 분기: `src/utils/linkHandler.ts` `handleLinkClick`
- 웹→앱: `src/handlers/webViewMessageHandler.ts` · 타입 `src/types/webViewMessage.ts`(PostMessageAction 15)
- 앱→웹: `src/utils/webViewUtils.ts` `sendActionToWebView` · `sendPageNavigationToWebView` · `sendResponseToWebView`
- 모달: `src/screens/WebViewModal.tsx`(자체 onMessage — closeWebView · onSignOut 만)

**탭 3 푸시 · 딥링크**
- 입구: `index.js` · `src/handlers/pushNotificationHandler.ts`(리스너 설정 1141– · 탭 공통 748– · 백그라운드 1207–) · `src/handlers/deepLinkHandler.ts` · `src/handlers/pushTypeHandlers.ts`
- 의도: `src/constants/navigationActions.ts` · `src/handlers/navigationHandler.ts` · `src/store/navigationRequestStore.ts`
- 실행: `src/navigation/MainTabNavigator.tsx` navigationRequest effect(377–465) · `BottomTabWebView.tsx` 513–556
- 코드 푸시 보존: `src/components/BznavSplashScreen.tsx` 140–153 · `App.tsx` 298–

**탭 4 인증 · 세션**
- 시작: `src/components/BznavSplashScreen.tsx` checkFirstLaunch · `src/utils/secureStorage.ts` · `src/utils/getInitialRoute.ts` · `src/services/sessionService.ts`
- 로그인: `src/screens/auth/SignInScreen.tsx` · `src/services/authService.ts` · `SignTermsScreen.tsx` · `SignupCiVerificationScreen.tsx`
- 약관·CI: `UpdateTermsScreen.tsx` · `UserCiVerificationScreen.tsx` · `src/components/organisms/ciVerification/CiVerificationForm.tsx` · `src/navigation/types.ts` CompletionActionType
- Main 진입 재검사: `MainTabNavigator.tsx` `checkUserStatusAndNavigate`(207–273)
- 로그아웃: `src/utils/logout.ts` · `webViewMessageHandler.ts` `handleOnSignOutOrWithdrawal`

## 4. 탭 0 에 들어갈 실제 파일

| 층 | 파일 | 무엇 |
|---|---|---|
| 진입 | `index.js` | `enableScreens` → FCM 백그라운드 → notifee 백그라운드 → Airbridge 콜백 2개 → `registerRootComponent`. 순서가 주석으로 강제돼 있다 |
| 셸 | `App.tsx` | 모듈 수준 `Sentry.init`(106) · `SplashScreen.preventAutoHideAsync` · 준비 전 스플래시(332–337) · Provider 9겹(363–374) · `NavigationContainer`(Sentry 내비 연결) · `Sentry.wrap(App)` |
| 셸 | `src/components/BznavSplashScreen.tsx` | 재설치 검사 → 앱 버전(edge-config) → 운영 빌드만 EAS 업데이트 확인 → IMC 애니메이션 → onFinish |
| 가드 | `src/utils/getInitialRoute.ts` · `src/navigation/MainTabNavigator.tsx` `checkUserStatusAndNavigate` | 시작 라우트(SignIn/Main) · Main 첫 포커스에서 CI·약관 재검사 |
| 화면군 | `src/navigation/RootStackNavigator.tsx` · `MainTabNavigator.tsx` · `src/types/tabs.ts` | 스택 23 · 탭 4 · 기본 탭 refund |
| 상태 | `src/store/*.ts`(zustand 10개) · `src/config/react-query.ts` · `src/hooks/api/*` | 이동 요청 · user · 쿠키 · 배지 등 / Query staleTime 0 |
| 관문 1 | `src/config/axios.ts` | 기본 baseURL SSO API. Bearer · x-device-id · X-User-Id · 전역 로딩 · Sentry |
| 관문 2 | `src/handlers/webViewMessageHandler.ts` · `src/utils/webViewUtils.ts` | 웹뷰 브릿지 |
| 관문 3 | `src/handlers/deepLinkHandler.ts` · `pushNotificationHandler.ts` | 딥링크 · 푸시 → NavigationIntent |
| 관문 4 | `src/services/agentChatService.ts` `sendAgentChatMessage` | AI 상담 스트림 — axios 가 아니라 XHR onprogress |
| 외부 | 비즈넵 웹 3(refund.bznav.com · ai.bznav.com/about · care.bznav.com) · SSO API · core API · plus API · edge-config CDN · FCM · SFMC · 채널톡 · Airbridge · EAS Update · Sentry · Firebase(Analytics · Remote Config) | 박스 밖 |

## 5. 이 서비스만의 주의

- **화면 수로 작업량을 가늠하지 않는다.** 환급·세나·케어 탭은 앱 쪽 화면이 각 1개(`*ContainerScreen`)지만 그 안은 bznav-web 앱이다. 웹 화면은 그 앱의 다이어그램에서 본다
- **탭 3개는 한 컴포넌트다.** 세 컨테이너가 모두 `BottomTabWebView` 를 쓰고 `tabId` 로만 갈린다. 세나 탭은 쿠키 2개가 더 붙고, 환급은 이동 요청을 URL 로드 대신 `pageNavigation` 브릿지로 받고, 케어는 채널톡 버튼이 붙는다. 한 탭 흐름을 다른 탭에 옮겨 그리지 않는다
- **이동은 바로 일어나지 않는다.** 딥링크·푸시·웹뷰 링크·전체 탭 메뉴는 `navigationRequest` 스토어(한 칸)에 의도를 쓰고 `MainTabNavigator` effect 가 처리한다. `OPEN_TAB_WEBVIEW` 만 스토어에 남겨 두고 탭 웹뷰가 로드 뒤 꺼낸다
- **`Survey` · `DuplicateAccount` 는 코드에 navigate 호출이 없다.** `OPEN_SCREEN` 의 screen 문자열로만 열린다. 화면 노드에 "어디서 들어온다" 를 지어내지 않는다
- **쇼케이스 11파일은 화면이지만 라우트가 아니다.** 전수에는 넣되 내비게이터 등록 수(26)와 섞지 않는다
- **파일명과 컴포넌트명이 다른 곳** — `NotificationTotalSettingsScreen.tsx` 의 컴포넌트는 `NotificationSettingsScreen`. `sources` 는 파일 경로로 단다
- **브릿지 액션 수** — `PostMessageAction` enum 은 15개, 탭 웹뷰가 받는 것은 11개(공통 5 · 인증 2 · 세나 전용 4), 앱→웹은 `updateCookies` · `pageNavigation` 2개, `closeWebView` 는 WebViewModal 만, `onWithdrawalComplete` 는 주석 처리. 숫자를 섞어 쓰지 않는다
- **Android 차이** — 앱→웹 액션은 `injectJavaScript` 로 window 에 MessageEvent 를 쏘지만 응답(`sendResponseToWebView`)은 `postMessage` 그대로다. `event.nativeEvent.url` 은 origin 만 준다. 비활성 탭 분리(`detachInactiveScreens`)는 Android 만 끈다
- **CI·약관 판정은 두 곳** — SignIn 직후와 Main 첫 포커스. 한쪽만 그리면 틀린다
- **시크릿** — `src/config/firebase.ts`(Firebase 클라이언트 설정)와 `App.tsx` Sentry DSN, `app.config.js` 의 키 값이 소스에 있다. 그림·카드·보고에 값을 옮기지 않는다. `.env*`·`google-services.json`·`GoogleService-Info.plist` 는 열지 않는다
- 레이아웃: 심층은 `pos` + `meta.viewBox`. 한 행 4칸(폭 300)은 x 60 · 380 · 700 · 1020, 5칸(폭 236)은 60 · 316 · 572 · 828 · 1084 로 두면 AUTHORING 5절 간격 제약을 피한다. 두 노드 사이 가로 연결은 간격 24px 이상이어야 해서 290 폭으로 줄여 맞춘 곳이 있다(탭 3 `v1`·`v2`, 탭 4 `terms`)

## 6. 바뀌면 손볼 곳

| 변화 | 손볼 곳 |
|---|---|
| RootStack 에 화면 추가 | 탭 1 해당 묶음 노드(노드당 3개까지)나 새 노드 + boundary `wraps` · subtitle·카드의 "37 · 26" · 탭 0 `auth`/`settings`/`feature` 문구 · `build-bundle.py` TABS 설명 · 화면 맵 · 구조도 `nav` source 라벨 "Stack 22화면" |
| 탭 추가·순서 변경 (`TAB_CONFIG`) | 탭 1 첫 행 · 탭 0 `webtabs` · 탭 2 `containers` · 구조도 `web` · 시퀀스(세나 탭 대표) 카드 |
| 새 브릿지 액션 | 탭 2 `common`/`authact`/`senaact` sublabel · boundary 라벨 "11종" · 카드 규약 · 시퀀스 postMessage note. 웹 쪽 짝(bznav-web 앱)도 확인 |
| 링크 분기 규칙 (`linkHandler.ts`) | 탭 2 `linkclick` 과 결과 노드 4개 |
| 새 NavigationIntent 액션 · 푸시 type | 탭 3 `v2` · `navfrom` · 액션 행 · 카드 "의도 5종" |
| 로그인 수단 · 로그인 status 추가 | 탭 4 `signin` · `social` · 분기 행 |
| 새 API 서버(baseURL) | 탭 0 `apis`/`plusapi` · 카드 "관문이 하나가 아니다" · 구조도 `api` |
| 스플래시·코드 푸시 순서 | 탭 0 `splash` · 탭 3 `codepush` · 탭 4 `splashclear` |
| prd 가 새 커밋으로 가면 | `node scripts/check-diagrams.mjs` → 🟡 면 `--repin` 후 validate·deliver·번들 재생성. 화면 파일이 늘거나 줄면 1절 대조를 다시 돌린다 |

## 7. 읽을 지식 문서

- `docs/knowledge/bznav-rn-app/structure.md`(RootStack 23 라우트 · MainTab 4 · 화면 표) · `patterns.md`(§4 브릿지 웹→앱 11 · 앱→웹 2, §7 OPEN_SCREEN) · `workflows.md` · `gotchas.md`(Android 브릿지 · 쇼케이스 모드 · lint 설정 오류) · `rules.md`
- 레포 원문 `docs/plans/navigation-intent-v2-plan.md` · `docs/plans/sena-notification-bridge-interface.md` — 설계 문서다. 코드와 다르면 코드가 맞다(예 `CALCULATOR_SALARY` 같은 상수는 코드에 없다, `patterns.md`)
- 에이전트 프로필 `.claude/agents/bznav-rn-app.md`
