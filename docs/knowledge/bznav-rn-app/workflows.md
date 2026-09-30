# bznav-rn-app 반복 작업 절차

체크리스트대로 진행하고, 보고서에 각 항목의 완료 여부를 적는다. 파일 패턴은 `patterns.md` 번호를 참고. 모든 작업 보고에 **배포 경로(코드 푸시 가능 / 스토어 빌드 필요)** 를 적는다(판단은 E).

## 0. 시작 전 (공통)
1. 워크트리 경로에서 `git status --short --branch` — `prd` 에서 딴 `feature/v<앱버전>/<티켓>` 인지. `feature/<티켓>`(헤르메스 `scripts/new-branch.sh` 기본 이름)이면 헤르메스에 이름 확인을 요청하고, `main`·`develop` 위면 멈추고 보고
2. Node·설치는 `rules.md` 필수 절·`gotchas.md` "설치·검증"대로
3. 웹 화면 변경이 섞여 있으면(웹뷰 안 UI·웹 쪽 브릿지 수신) 그 부분은 헤르메스에 넘긴다

## A. 새 네이티브 화면 추가 — 선례 `CustomerServiceScreen`, `ServiceNotificationSettingsScreen`
1. 정말 네이티브여야 하는지 확인. 서비스 콘텐츠면 웹(bznav-web) + `WebViewModal`/탭 웹뷰로 여는 게 기본이다
2. 디자인이 있으면 F(피그마) 절차로 DS 컴포넌트 매칭부터
3. 생성: `src/screens/XScreen.tsx` — arrow function + `export default`, `useScreenLifecycle`, `SafeAreaView` + `topNavigation` + `AppText`(`patterns.md` §1)
4. 등록: `src/navigation/types.ts`(`RootStackParamList.X` + `XScreenProps`) → `RootStackNavigator.tsx` `<Stack.Screen>` → (선택) `src/screens/index.ts`(§2)
5. 진입점 연결: 기존 화면에서 `navigation.navigate("X")`, 또는 딥링크·푸시로 열어야 하면 라우트 이름이 곧 `OPEN_SCREEN` 의 `screen` 값 — 마케팅·서버에 전달할 이름을 보고에 적는다. **라우트 이름은 나중에 바꾸지 않는다**
6. API 가 필요하면 C
7. 트래킹이 필요하면 `.claude/rules/tracking.md` 대로 `TrackingService`(§9)
8. 검증: `scripts/verify/bznav-rn-app.sh`(lint 는 현재 설정 오류로 건너뜀 → tsc 결과가 실질 게이트). 가능하면 `yarn start:dev:lan` + 개발 빌드 앱에서 화면 진입 확인, 못 했으면 "실행 못 함"
9. 배포 경로: JS·에셋만이면 코드 푸시 가능

## B. 브릿지 메시지 추가 (웹 → 앱 액션) — 선례 `setTabBadge`, `displayPushNotification`
1. **규약 먼저 합의** — actionName(camelCase)·`sender` 허용 범위·`data` 필드·응답 유무·에러 코드. 웹 쪽 에이전트(bznav-sena-fe 등)와 같은 스펙을 보도록 계획서에 적는다. 레포 `docs/plans/*bridge*` 형식으로 문서를 남길지 확인
2. `src/types/webViewMessage.ts`: `PostMessageAction` 에 값 추가 + `XxxMessage extends WebViewRequestMessage { data: … }`
3. `src/handlers/webViewMessageHandler.ts`: `switch` 에 `case` 추가 → `handleXxx(message as XxxMessage, …)` 구현. 특정 서비스만 허용이면 핸들러 첫 줄에서 `message.sender` 검사, `data` 는 타입 가드로 검증(`typeof visible !== "boolean"` 식)
4. 응답이 규약에 있으면 성공·실패 모두 `sendResponseToWebView` 로 보낸다(`messageId` 되돌려주기)
5. 모달 웹뷰에서도 받아야 하면 `src/screens/WebViewModal.tsx` `handleWebViewMessage` 에 따로 추가(탭 핸들러와 공유하지 않는다)
6. 앱 → 웹 액션이면 `sendActionToWebView`(Android 는 `injectJavaScript` 경로 — 웹이 `window` 의 `message` 이벤트를 듣는지 웹 쪽과 확인)
7. **구버전 앱 호환**: 이 코드가 나가기 전 앱은 새 액션을 `⚠️ 알 수 없는 액션` 으로 무시한다. 웹이 앱 버전(`getAppVersion`)으로 분기해야 하는지 보고에 적는다
8. 검증 + 가능하면 dev 웹(`DevUrlSwitcher` 로 dev URL)으로 실제 왕복 확인
9. 배포 경로: JS 만이면 코드 푸시 가능. 새 네이티브 모듈이 필요하면 스토어 빌드

## C. API 연동 (React Query)
1. 요청·응답 타입을 `src/interface/<도메인>.ts` 에(`AppResponseDto<T>` 래핑 여부 서버와 확인)
2. `src/services/<도메인>Service.ts` 에 함수 — 기본 서버가 아니면 `{ baseURL }` 옵션, 전역 로딩이 싫으면 `showGlobalLoading: false`
3. `src/hooks/api/queryKeys.ts` 에 키 → `src/hooks/api/use<도메인>.ts` 에 `useXQuery`/`useXMutation` → `index.ts` export
4. 캐싱 필요 시 쿼리에 `staleTime` 명시, 화면을 벗어나도 캐시를 남겨야 하면 `gcTime` 도(기본값은 `patterns.md` §5). mutation 후 갱신은 `queryClient.invalidateQueries({ queryKey: queryKeys.x.all })`
5. 새 API 서버 도메인이면 URL 을 서비스 파일에 dev/prod 로 두는 현 관례를 따르고, 보고에 적는다

## D. 딥링크·푸시 목적지 추가
1. 기존 action 으로 되는지 먼저 본다 — 웹 페이지면 `OPEN_TAB_WEBVIEW`/`OPEN_WEB_MODAL`, 네이티브 화면이면 `OPEN_SCREEN&screen=<라우트명>`. 대부분 **코드 변경 없이** URL·푸시 payload 만으로 된다
2. 새 푸시 `type` 이면 `src/handlers/pushTypeHandlers.ts` 에 `PushType` 값 + 빌더(§7). 새 `NavigationAction` 이 필요하면 `navigationActions.ts` 유니온 + `deepLinkHandler.ts` `parseNavigateIntent` + `MainTabNavigator.tsx` 소비 `switch` 세 곳
3. 새 도메인(Universal Link·App Link)이면 `app.config.js` `associatedDomains`·`intentFilters` → **스토어 빌드 필요**
4. 확인 경로: 콜드스타트(앱 종료 상태에서 탭) · 백그라운드 · 포그라운드 · 코드 푸시 reload 직후(`PENDING_NAVIGATION_REQUEST`) — 기기 확인 못 하면 "실행 못 함"

## E. 코드 푸시 가능 여부 판단 (보고 필수)
`runtimeVersion.policy = "appVersion"` — 코드 푸시는 **같은 앱 버전(`app.config.js` `version`)으로 설치된 바이너리에만** 간다. 스플래시(`BznavSplashScreen.tsx`)가 매 실행 `checkForUpdateAsync` → 받으면 `reloadAsync`.

| 변경 | 배포 경로 |
|---|---|
| `src/**`·`App.tsx`·`index.js` 의 JS/TS, JS 에서 import·require 하는 이미지·SVG·lottie | 코드 푸시 가능 |
| 폰트 | 추측입니다 — `app.config.js` `fonts`(expo-font 플러그인, 네이티브 임베드)와 `src/theme/bznavFonts.ts`(JS 로드) 둘 다 있다. 확인 필요 → 스토어 빌드 가능성으로 보고 |
| `app.config.js` 의 네이티브 반영 항목(plugins·권한 문구·infoPlist·entitlements·associatedDomains·intentFilters·googleServicesFile·fonts 목록·아이콘·스플래시) | **스토어 빌드** |
| `plugins/**`, `patches/**`(네이티브 파일), `package.json` 의 네이티브 모듈 추가·버전 변경, Expo SDK·RN 버전 | **스토어 빌드** |
| `app.config.js` `version`·`runtimeVersion` 변경 | **스토어 빌드**(runtime 이 바뀌어 기존 설치본은 코드 푸시를 못 받는다) |
| `extra`(env 키 값, `Constants.expoConfig.extra`)만 변경 | 추측입니다 — `eas update` 가 매니페스트에 `extra` 를 다시 싣는지 확인 필요. 헤르메스에 보고 |
| `eas.json` | 빌드 설정 — 다음 빌드부터 |

판단이 애매하면 "스토어 빌드 필요 가능성"으로 보고하고 헤르메스가 사용자에게 확인한다. 배포 명령은 어떤 경우에도 실행하지 않는다.

## F. 피그마 화면 개발
1. 피그마는 **DEV 모드**로 본다(크기·간격·색·폰트 수치)
2. 요소마다 DS 매칭: 색 → `design-system-colors`, 텍스트 → `design-system-typography`(`AppText` + `{카테고리}-{크기}-{굵기}`), 간격·반지름·그림자 → `design-system-spacing`(**피그마 변수 `sm/md/lg` ↔ 토큰 `small/medium/large` 매핑표**), 컴포넌트 → `design-system-components`, 레이아웃 → `design-system-layout`(모두 `.claude/skills/`)
3. **DS 에 없는 컴포넌트·옵션(variant·size·아이콘 등)이 있으면 개발을 멈추고** 헤르메스에 보고 — 무엇이 없는지, DS 에 추가할지 질문을 함께. 임의로 새 공통 컴포넌트를 만들거나 hex·픽셀 하드코딩으로 흉내 내지 않는다
4. 아이콘 SVG 가 새로 필요하면 `assets/svg/icons/`(`ic_*`) 또는 `assets/svg/images/`(`icg_*` 등) 명명 관례를 따른다. 에셋 추가는 코드 푸시 가능
5. 구현 후 `ComponentShowcase` 에 해당 컴포넌트가 있으면 모양 비교, 검증 스크립트

## G. 네이티브 설정 변경 (권한·SDK·플러그인)
1. 요청이 정말 네이티브 변경인지 확인하고 **스토어 빌드 필요**를 계획서 단계에서 먼저 알린다
2. `app.config.js`(dev/prod 두 변형 모두 확인 — `IS_PROD` 분기), 로컬 plugin 이면 `plugins/**`, 서드파티 패치면 `patches/`
3. 키·토큰을 새로 넣어야 하면 **값을 코드에 쓰지 않고** env 키 이름만 추가(`process.env.X`) + `env.example` 에 키 이름 — 실제 값 등록(EAS env)은 사람 몫이라고 보고
4. 확인은 `yarn prebuild:clean:dev`(스크립트가 `APP_VARIANT=development` 를 넣는다) 로 생성물(`ios/`·`android/`, gitignore)을 보는 데까지. 실제 빌드·배포 명령은 실행하지 않는다
5. iOS Privacy Manifest·권한 문구 변경은 스토어 심사 영향 — 보고에 적는다
