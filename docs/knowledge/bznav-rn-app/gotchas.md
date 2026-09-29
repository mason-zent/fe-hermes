# bznav-rn-app 함정·이력

작업 중 알게 된 것을 날짜와 함께 쌓는다. `/sync`가 자동으로 채우지 않는다. 최초 작성 2026-09-29, 기준 `origin/prd` `a161710`.

## 브랜치·체크아웃
- **`main` 은 옛 코드다**(마지막 2025-12-15, `develop` 2025-12-03). expo-router `app/` 구조·Expo 53 이라 prd(Expo 55·React Navigation·`src/`)와 전혀 다르다. 로컬 메인 체크아웃(`repos/bznav-rn-app`)이 `main` 이면 그 파일을 읽고 판단하지 않는다. `origin/HEAD` 도 `main` 을 가리켜 `git clone`·`git log` 기본값이 틀린 쪽이다
- **운영 반영은 `prd`, PR 은 같은 브랜치로 prd·dev 양쪽**(예 SENA-269 → PR #90 prd, #91 dev). 그래서 prd 와 dev 가 조금씩 어긋난다(2026-09-29 기준 dev 에만 4커밋, prd 에만 1커밋). 한쪽만 머지하면 다음 릴리스에서 빠진다
- 작업 브랜치의 기준이자 PR base 가 모두 `prd` 다(`hermes.config.json` `prBase: prd`) — 다른 콘솔 레포의 "prBase=dev" 습관대로 dev 에서 따지 않는다
- 릴리스·핫픽스 브랜치 이름 표기가 흔들린다(`release/v.2026.09.310_…`, `release/v26.09.200_…`, `release/v2026.08.100_…_1`, 옛 `release/v5.1.1_codepush_20260731_1`). 규칙을 새로 만들지 말고 최근 것을 따른다
- 패키지 매니저는 yarn 1(`yarn.lock`)이다. `pnpm-lock.yaml`·`package-lock.json` 을 만들지 않는다. 트리에 남이 만든 다른 lockfile 이 있으면 커밋·사용하지 않고 지우지도 않는다(남의 작업일 수 있다)

## 설치·검증
- `yarn expo lint` 를 직접 돌리지 않는다 — package.json 에 lint 스크립트가 없으면 `"lint": "expo lint"` 를 **추가해** 추적 파일을 바꾼다(commit.sh 가 "작업 트리가 바뀌었다" 로 거부). 표준 검증은 같은 일을 하는 `yarn eslint src --cache …` 를 쓴다(2026-09-29 실전 시험에서 발견)
- **lint 가 prd 에서 아예 돌지 않는다** — `npx eslint src`/`yarn eslint src` → `could not find plugin "@typescript-eslint"`(ESLint 9.32.0). `eslint.config.js` 가 files 제한 없는 전역 블록에서 `@typescript-eslint/no-use-before-define` 을 켜는데 `eslint-config-expo/flat` 은 그 플러그인을 `**/*.ts, **/*.tsx` 블록에만 등록한다. 헤르메스 이슈 `issues/20260929-bznav-rn-app-eslint-config.md`. `scripts/verify/bznav-rn-app.sh` 는 "⏭ 건너뜀(설정 오류)"로 표시하고, 엄격 모드(커밋)는 `--allow-skip "yarn eslint src"` 가 있어야 통과한다. **eslint 설정을 몰래 고쳐 lint 를 살리지 않는다** — 고치면 그동안 쌓인 lint 오류가 한꺼번에 나올 수 있어 별도 작업이다
- `yarn tsc --noEmit` 은 통과한다(2026-09-29). 실질 게이트는 이것 하나다
- package.json 에 **lint·typecheck·test 스크립트가 없다**. README 의 `npm run lint` 는 존재하지 않는 명령이다. 테스트 러너도 없다
- **Node 20 필수**: Node 24 로 `yarn install` 하면 `superstatic`(firebase-tools 의존) engine 제한(18||20||22)에 걸려 설치가 실패한다. `.nvmrc` 는 `20.19.4` 이고 검증 스크립트는 **정확히 일치하지 않으면** "Node 버전" 건너뜀으로 기록한다(20.20.x 도 경고)
- 설치는 `yarn install --frozen-lockfile`. `postinstall` = `patch-package` 가 `patches/` 의 `@react-native-firebase/messaging` · `react-native-enriched-markdown` 패치를 적용한다. 패치가 안 맞으면 설치가 깨진다 — 해당 패키지 버전을 올리지 않는다
- `app.config.js` 는 **`APP_VARIANT` 가 없으면 throw** 한다. `expo` CLI 가 설정을 읽는 명령(`expo start`·`prebuild`·`run`·`config`)은 `APP_VARIANT=development|production` 을 붙인 package 스크립트로 돌린다. `yarn start`(순수 `expo start`)·`yarn ios`·`yarn android` 는 변수가 없어 실패한다(`app.config.js` 최상단 throw — 코드로 확인, 기기 실행은 안 함)
- README 는 **낡았다**: Expo 53·RN 0.79.5·React 19.0·TS 5.8·Node 18+·"npm 또는 yarn"·`main/develop` 브랜치 전략. 스택·명령은 `package.json`·`structure.md` 로 확인한다. README 의 versionCode 공식(5.1.2 → 5010200)도 실제 값 `5120000` 과 다르다
- `package.json` `version` 은 `5.0.0`, 실제 앱 버전은 `app.config.js` `version: "5.1.2"`. 앱 버전 판단은 `app.config.js` 로 한다

## 배포(코드 푸시·스토어)
- **`yarn update:*` 한 줄이 실제 배포다** — prebuild → `.env` 로드 → `eas update`(`update:dev*` 는 `development` 브랜치·환경 = 개발 빌드 설치자, `update:prod*` 는 `production` = 운영 앱) → Sentry 소스맵 업로드. "빌드 확인용"으로도 실행하지 않는다. `yarn env:*` 도 EAS 시크릿을 `.env` 에 쓴다
- `runtimeVersion.policy = "appVersion"` 라 코드 푸시는 **같은 `version` 바이너리에만** 닿는다. 네이티브 변경·버전 변경이 섞인 작업을 "코드 푸시로 나가면 된다"고 보고하면 운영에서 크래시·기능 누락이 난다(`workflows.md` E)
- `updates.checkAutomatically: "NEVER"` — 업데이트 확인은 `src/components/BznavSplashScreen.tsx` 가 매 실행 수동으로 한다. 스플래시 흐름을 바꾸면 코드 푸시 수신이 끊길 수 있다. reload 직전 딥링크 intent 를 `PENDING_NAVIGATION_REQUEST` 에 저장·`App.tsx` 에서 복원하는 짝도 같이 유지한다
- `ios/`·`android/` 는 gitignore(CNG). 거기 직접 고친 것은 다음 prebuild 에서 사라진다 — `app.config.js`·`plugins/**`·`patches/**` 로만
- `plugins/fcm-routing/android.js` 는 `@react-native-firebase/messaging`·MCE 플러그인 **뒤에** 있어야 manifest merge 가 최종 반영된다(`app.config.js` 주석). plugins 순서를 바꾸지 않는다
- Android `kakao{appKey}` scheme 을 MainActivity 에 추가하면 카카오 OAuth 콜백이 SDK 로 안 가 로그인이 멈춘다(`app.config.js` 주석)

## 시크릿·보안
- 레포에 커밋된 민감 파일·값: `assets/firebase/{google-services.json,GoogleService-Info.plist}`, `app.config.js` 의 Salesforce MCE `appId`·`accessToken`(하드코딩, `env.example` 의 `MCE_*` 키는 실제로 읽지 않는다)·EAS projectId, `App.tsx` 의 Sentry DSN. **값을 출력·인용·다른 파일로 옮기지 않는다.** 정리가 필요하면 보고만
- `env.example` 의 `EXPO_PUBLIC_API_URL_*` 는 코드에서 쓰지 않는다 — API URL 은 `src/config/axios.ts`·각 서비스 파일에 dev/prod 로 하드코딩돼 있다
- `security-audit-report.md`(2026-04-24) 반영 상태(prd 기준, 추측 없이 코드로 확인한 것만):
  - 토큰 평문 저장 → **반영됨**: 액세스 토큰은 `expo-secure-store`(`src/utils/secureStorage.ts`)
  - 탭 웹뷰 메시지 origin 검증 → **반영됨**: `*.bznav.com` + sender 3종(`webViewMessageHandler.ts`)
  - `originWhitelist: ["*"]` → **그대로**(`src/config/webView.ts`)
  - `WebViewModal` 의 `onMessage` 는 **origin·sender 검증 없이** `closeWebView`·`onSignOut` 을 처리한다. 딥링크 v2 `OPEN_WEB_MODAL` 은 url 도메인을 검사하지 않는다(`src/handlers/deepLinkHandler.ts:188-200`). v1 도 도메인이 `bznav.com` 으로 **끝나는지가 아니라 그 문자열이 들어 있는지만** 본다(`deepLinkHandler.ts:287` `domain.includes("bznav.com")`). 같은 부분 문자열 검사가 **웹뷰 안 링크 클릭 분류**에도 따로 있다 — `src/utils/linkHandler.ts:127` `handleLinkClick`(호출: `BottomTabWebView.tsx:333`·`WebViewModal.tsx:142`·`useChannelTalk.ts:195`). 둘 다 탭 웹뷰 메시지의 `hostname.endsWith(".bznav.com")`(`webViewMessageHandler.ts:66`)보다 느슨하다. 모달에 새 액션을 붙일 때 이 점을 고려한다
  - 로그 노출 → `APP_VARIANT=production` 번들은 babel·metro 가 `console.log` 를 제거. development 변형은 남는다 — 브릿지 메시지 `data` 는 무조건 로그, axios 요청 헤더(`Authorization` 포함)·바디는 `__DEV__`(디버그 번들)에서 찍힌다
  - 401·토큰 만료 처리는 없다(`src/config/axios.ts` `// TODO`)

## 코드·규칙 문서 불일치
- **레포 가이드 문서가 코드보다 낡은 곳**(코드를 따른다):
  - `ai_prompt/component-development-rules.md` 의 `export default function` 예시 ↔ eslint `func-style: expression`(arrow 강제). `useScreenLifecycle((status) => switch …)` 시그니처 ↔ 실제 `useScreenLifecycle({ firstFocus, focus, blur, unmount })`
  - `ai_prompt/zustand-development-guidelines.md` 의 파일명 kebab-case·`/store/<기능>/` 폴더 ↔ 실제 `src/store/camelCaseStore.ts` 평면 구조
  - `prompt_rules.md` 가 가리키는 `ai_prompt/design-system-rules.md`·`apptext-usage-rules.md` 는 **없다** → `.claude/rules/design-system-core.md` + `.claude/skills/design-system-*` 가 대체
  - `design-system-core.md` 가 "자동 로드 규칙 파일 `design-system-colors.md`…"라고 하지만 실제로는 `.claude/skills/design-system-*/SKILL.md` 스킬이다. hermes 에이전트 pane 에선 스킬이 자동 로드되지 않으니 파일을 직접 읽는다
  - `docs/plans/navigation-intent-v2-plan.md` 의 `OPEN_WEB_URL`·`START_AGENT_CHAT`·`screen=CALCULATOR_SALARY` 등은 **구현되지 않았다**. 실제 action 5종과 `screen` = RootStack 라우트 이름(`patterns.md` §7)
  - `docs/plans/sena-notification-bridge-interface.md` 는 `displayPushNotification`·`openAppSettings` 에 성공/실패 **응답**을 정의하지만 코드는 응답을 보내지 않는다(실패 시 `console.warn` 후 return). 웹이 응답을 기다리게 짜면 안 된다
  - `src/config/react-query.ts` 주석은 "gcTime 5분"이라 하지만 값은 `STALE_TIME + 0` = **0** 이다. 화면을 벗어나면 캐시가 바로 사라진다
  - `WebViewResponseMessage.sender` 주석은 `'zent'` 지만 실제 전송값은 `"bznav-app"`
- `OPEN_SCREEN` 은 화이트리스트 없이 `navigate(screen)` — **라우트 이름을 바꾸면 이미 발송된 푸시·마케팅 링크가 조용히 깨진다**. `SettingScreen`·`NotificationScreen` 처럼 이름이 어색해도 그대로 둔다
- 탭 웹뷰 메시지는 sender `bznav-refund|bznav-sena|bznav-care` 만 받는다. plus·calc 웹(전체 탭에서 `WebViewModal` 로 여는 것)은 탭 브릿지를 못 쓴다. 대신 `WebViewModal` 이 `src/utils/calcPlusWebViewAuth.ts` 로 인증 쿠키를 주입한다(`patterns.md` §3) — 이 파일은 쓰이는 중이다
- **케어 탭 `FORCE_SHOW_CHANNEL_TALK_BUTTON = true`**(`src/screens/tabs/CareContainerScreen.tsx`, 주석 "QA용 상시 노출. 배포 전 false로 되돌린다")가 prd 에 들어가 있다. 의도 확인 전 임의로 바꾸지 않는다 — `issues/20260929-bznav-rn-app-channeltalk-qa-flag.md`
- Android: 비활성 탭 웹뷰의 postMessage 가 큐에 쌓이는 문제 때문에 `detachInactiveScreens` 를 Android 에서만 끈다(`MainTabNavigator.tsx`). 앱→웹 전송은 Android 에서 `postMessage` 대신 `injectJavaScript` 로 `window` 에 dispatch(`webViewUtils.ts`) — 웹이 `document` 만 들으면 못 받는다. Android `event.nativeEvent.url` 은 origin 만 준다 → 경로 판단엔 `currentUrl` 을 쓴다
- 딥링크·푸시 핸들러는 `index.js` 에서 `registerRootComponent` **전에** 등록해야 한다(디퍼드 딥링크·백그라운드 푸시 유실 이력, `index.js` 주석). App.tsx `useEffect` 로 옮기지 않는다
- `Text`·`TextInput` 의 `allowFontScaling` 을 `App.tsx` 에서 전역 false 로 막는다(`@ts-expect-error`). 시스템 글꼴 크기 대응을 기대하지 않는다
- `App.tsx` `isShowCaseMode` 를 true 로 두고 커밋하면 운영 앱이 쇼케이스로 뜬다
- `src/components/toast/lib/` 는 vendored JS(`.js`+`.d.ts`) — 수정·포맷하지 않는다
- **설치만 되어 있고 import 0건**(2026-09-29 grep, 동적 require 는 미확인): `react-native-enriched-markdown`(패치까지 있음), `@shopify/flash-list`, `crypto-js`, `expo-symbols`, `expo-intent-launcher`, `@preeternal/react-native-cookie-manager`, `react-native-marketingcloudsdk`(git 의존), `@react-navigation/elements`. `expo-image`·`expo-mail-composer` 는 config plugin 으로만 등록. 관례로 쓰지 않는다. 지우는 것도 네이티브 변경(스토어 빌드)이라 범위 밖
- 마크다운 렌더는 `@ronradtke/react-native-markdown-display`(`components/chat/AnswerMarkdown.tsx` 쪽)만 실제로 쓴다

## 레포 설정 파일
- 레포 `.claude/settings.json` 의 permissions 에 **다른 개발자 로컬 경로**(`/Users/edin/Documents/bznav-rn-app/...`)의 `mv`·`curl` 명령과 `Bash(xargs sed *)`, 외부 MCP 플러그인 허용이 커밋돼 있다. 우리 환경에선 의미가 없고 `xargs sed *` 는 범위가 넓다. 고치지 말고(범위 밖) 필요하면 보고
- `package.json` `sentry:upload:dsym` 도 `/Users/edin/Downloads/dSYMs` 하드코딩
- `.claude/commands/speckit.*`·`.specify/` 는 spec-kit 용. hermes FE pane 에서는 슬래시 커맨드가 노출되지 않는다
- `harness-engineering-plan.md`(2026-04) 의 husky·lint-staged·dependency-cruiser·`AGENTS.md` 는 prd 에 없다 — 계획일 뿐이다
