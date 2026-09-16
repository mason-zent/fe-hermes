# bznav-web packages/* 구조 맵
기준 `origin/dev` `0b713b4`, `packages/` 642파일. 레포 공통 `../common.md`. **`@repo/channel-talk`는 2026-09-08 제거됨**(소비 앱으로 내재화) — 옛 문서 참조 금지.

| 패키지 | name | main | exports | 내부 deps | 특징 |
|---|---|---|---|---|---|
| `common-utils` | `@repo/common-utils` | `index.ts` | `.` | **없음**(설명에 "다른 내부 패키지 설치 금지") | src 없이 `constants/`·`types/`·`utils/` 평면. deps `@aws-crypto/sha256-js`, `cookies-next@6.1.1`, `isomorphic-fetch`, `ua-parser-js@2` |
| `platform` | `@repo/platform` | `client.ts` | `.`→client, `./server`→server | common-utils | jotai, react, next |
| `project-config` | `@repo/project-config` | — | 없음(경로 직접) | 없음 | `lint/eslint.config.js`, `lint/.stylelintrc.mjs`, `typescript/{base,library,nextjs}.json` |
| `tracking-service` | `@repo/tracking-service` | `index.ts` | `.` | common-utils, platform | Datadog logs/rum 6.10, airbridge, mixpanel. **`private` 없음** |
| `ui` | `@repo/ui` | `index.ts` | `.`, `./globals.css`, `./postcss.config`, `./tailwind.config` | common-utils | Radix 9종, CVA, tailwind-merge, vaul, lucide, react-day-picker, nice-modal, lottie, zod@4. `storybook/build-storybook/chromatic` |
| `ui-deprecated` | **`@zenterprise-inc/ui`** 0.3.35 | `./src/index.ts` | `.`, `./tailwind.config` | 없음 | SCSS 모듈, headlessui, react-use. `@deprecated` shim |
| `user-session` | `@repo/user-session` | `index.ts` | `.` | common-utils, platform, **ui** | **`private` 없음**, `.stylelintrc.mjs` 없음 |
| `user-sign` | `@repo/user-sign` | `index.ts` | `.` | common-utils, platform, tracking-service, ui, user-session | nice-modal, jotai, crypto-js |

- 모두 `"type": "module"`, `types` 필드 없음(TS 소스 직접 소비, 빌드 산출물 없음)
- **의존 방향(선언)**: `common-utils ← platform ← tracking-service` / `common-utils ← ui` / `common-utils, platform, ui ← user-session` / 전부 ← `user-sign`. 순환 없음. **ui는 platform에 의존하지 않고, user-session은 tracking-service에 의존하지 않는다**

## src 구성
- **common-utils**: `utils/{cookie,datetime,device,fetch,hooks,objects,session,strings}.ts`, `constants/{session,storage-keys}.ts`
- **platform**: `src/components/{PageNavigationEventProvider,RouterProvider}.tsx`, `src/hooks/use-*.ts`(10), `src/services/BznavReactNativeBridge.ts`, `src/utils/{middleware,platform-detector-client/server,react-native-bridge}.ts`
- **tracking-service**: `src/EventTrackingController.ts`, `src/components/{EventTrackingProvider,EventTrackingScripts,PageViewEventLogger}.tsx`, `src/services/{Base,Airbridge,Datadog,GoogleAnalytics,KakaoPixel,MetaPixel,Mixpanel,NaverPixel,TiktokPixel}Service.ts`
- **ui**: `src/components/**`(tsx 126), `src/theme/*`(11 토큰), `src/styles/globals.css`, `src/hooks/{use-dialog,use-window-size}`, `src/libs/utils.ts`(`cn`), `src/constant/url.ts`, `tailwind.config.ts`, `.storybook/`. 스토리 52
- **user-session**: `src/components/{AuthGuard,AuthProvider}`, `src/contexts/AuthServiceContext`, `src/hooks/{use-app-sign-flow,use-auth-session}`, `src/services/{AuthService,BaseAuthService,SignService}`
- **user-sign**: `src/components/*`(14: SignInContent, SignTerms(+Experiment), SignUpInput, CIAuthentication, CICollectionRequest, TermDrawer, WithdrawContent …), `src/hooks/use-*`(6), `src/store.ts`

## 앱 × 패키지 사용 (파일 수)
| | brand | care | plus | refund | sena |
|---|---|---|---|---|---|
| `@repo/ui` | 14 | **1121** | 91 | 199 | 70 |
| `@repo/platform` | 6 | 34 | 13 | 49 | 48 |
| `@repo/common-utils` | 4 | 11 | 25 | 59 | 18 |
| `@repo/tracking-service` | 3 | 4 | 35 | 187 | 63 |
| `@repo/user-session` | — | 40 | — | 62 | 26 |
| `@repo/user-sign` | — | 8 | — | 20 | 16 |
| `@zenterprise-inc/ui`(deprecated) | — | **38** | — | **27** | — |
**`@repo/ui` 변경은 사실상 care-web 전체 영향.** 주요 심볼: care `BoxButton` 496, `Svg` 392, `MainTitle` 227, `Drawer*` 150+; platform `useWorkingPlatform` 67; tracking `useUserEventLogger` 203, `PageViewEventLogger` 108; user-session `useAuthContext` 82, `AuthGuard` 42
