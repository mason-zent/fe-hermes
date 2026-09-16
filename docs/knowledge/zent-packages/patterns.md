# zent-packages frontend/ 대표 패턴 파일

경로는 레포 루트 기준, `origin/main` `b22d000`. brics(React 18 계열, 세미콜론 없음)와 bznav(React 19, 세미콜론 있음) **두 라인을 섞지 않는다**.

## P1. brics-fe-ui 컴포넌트 — 2계층
- `src/components/ui/*` = shadcn 원본. 대표 `frontend/brics/ui/src/components/ui/button.tsx`: `cva()` variants → `interface ButtonProps extends …, VariantProps<typeof buttonVariants> { asChild? }` → `forwardRef` + `Slot` → `cn(buttonVariants({…}))` → `displayName` → **named export** `{ Button, buttonVariants }`
- `src/components/*` = 콘솔 도메인 래퍼. `./ui` 배럴에서 조합, **`export default`**, `FC<Props>` 스타일
- `cn` = `twMerge(clsx(inputs))`(`src/utils.ts`). 아이콘 `lucide-react`. `'use client'`는 훅·이벤트 쓰는 파일만
- 소비 측 import는 항상 서브패스: `@zenterprise-inc/brics-fe-ui/components/Pagination`, `…/components/ui/button` (루트 배럴 없음)

## P2. brics-fe-ui 주요 prop 계약 (실측)
- `RootWrapper`: props `PropsWithChildren`만. 내부에서 `useSessionTimeout()` → `{session, status}`, `AXIOS_INSTANCE.defaults.headers.common.Authorization`을 `useEffect([session?.id_token])`에서 세팅, `unauthenticated`면 `ZENT_COOKIE_REDIRECT_URL` 저장 후 `/`. 메뉴바 상태 쿠키 `ZENT_COOKIE_MENUBAR_OPEN`. DOM id `brics_root`/`brics_content`. **콘솔은 이걸 감싸면 사이드바+브레드크럼+세션이 통째로**
- `ConfirmModal`: `{ title?, open, confirmLabel='승인', cancelLabel='취소', onClose(result: boolean), onClickConfirm?, confirmButtonVariant?, isLoading? }`. **`onClose`가 boolean** — 확인 시 `onClickConfirm?.()` 후 `onClose(true)`
- `Pagination`: `PaginationProps { current, totalItemsCount, pagePerItemsCount, className?, onPageChange(page) }`(타입은 named export). `VIEW_PAGE_COUNT=9`
- `SkeletonTableBody { rows, cols }`: `<TableBody>`를 직접 렌더 → `<Table>` 안에. ⚠️ 셀 너비 `Math.random()` + 동적 클래스 → JIT 누락·하이드레이션 불일치 소지(추측)
- `Datepicker`: `ComponentProps<typeof DayPicker> & { name?, className? }`, hidden input에 `yyyy-MM-dd` → 폼 전송 호환
- `RootSidebar/index.tsx`: `isShow: session?.user?.functions?.includes(AuthFunction.X)`로 메뉴 노출. **works 계열 콘솔 메뉴 추가 = 이 파일 + `AuthFunction`**(hub는 DB 메뉴로 내재화됨)

## P3. brics-fe-zent-auth
- `lib/AuthOption.ts`: `serverAuthOptions satisfies NextAuthConfig`. Cognito(`checks:['state','nonce']`), 쿠키 `brics.session-token.<ZENT_ENV>`, domain loc=`localhost`/그 외 `.zent.kr`. **`MAX_AGE = 2h`, `UPDATE_AGE = 5m`**(슬라이딩은 updateAge가 만든다). `callbacks.redirect` 오픈 리다이렉트 차단 + `BASE_PATH`. `jwt`에서 `getMyInfo(id_token)`(`/users/zent/me`) → `{id,name,zenv,email,image,role,functions}`, 만료 시 Cognito refresh, 실패 `error:'RefreshAccessTokenError'`. `declare module 'next-auth'`로 `Session.id_token`·`User.{zenv,role,functions}` 보강
- `lib/fetcher.ts`: 모듈 싱글턴 `AXIOS_INSTANCE`(baseURL `NEXT_PUBLIC_API_URL`, `qs.stringify(indices:false)`). request 인터셉터 `X-Requested-From` + `createDatadogTraceHeaders()`. response: **401 → `_retry` 1회 `/api/auth/session` 재조회 → 헤더 주입 → 재시도**, 실패 시 `handleSessionExpired()`(300ms 디바운스 alert + `signOut`). **인플라이트 디듀핑**(`inflightSessionRequest`). 인터셉터는 모듈 로드 1회
- `hooks/useSessionTimeout(options?) → { session, status }`: `activityDebounceMs`(1000), `extendThrottleMs`(5분), `checkIntervalMs`(60초). 이벤트 `mousedown/keydown/scroll/touchstart` — **`visibilitychange` 없음**(next-auth와 중복, ⚠️ 주석), `keydown`(한글 IME). 리스너 1회 등록 + `latestRef`
- `AuthFunction` 74개: 값=키가 원칙, **예외 1건** `PAGE_REFUND_ALLOWED_MINIMUM_APP_VERSION = 'PAGE_REFUND_APP_VERSION'`. 접두사 `PAGE_`/`COMPONENT_`/`FUNCTION_`/`PERMISSION_`. 시간순 추가(알파벳 아님)
- `ConsoleAuthGuard`는 FE에 없다(`backend/zent-auth` NestJS). FE 게이트는 `functions.includes` 패턴만

## P4. resource-manager
- orval `client:'swr'`, `tags-split`, input `${NEXT_PUBLIC_RESOURCE_CENTER_API_URL}/api-yaml`, 필터 `/Resource/`. `src/api/{axios,hooks}/index.ts`가 긴 orval 이름을 짧게 재노출(`uploadResource`, `useGetResources`)
- `uploadResource(body)` → `formdataFn` → `fetcher<boolean>({ url:'/resources', method:'POST', multipart })` → **`boolean` 반환**
- ⚠️ `src/lib/fetcher.ts`는 zent-auth 복제본인데 **`fetcher()` 호출마다 request 인터셉터를 등록**(누적 버그로 보임)

## P5. datadog-trace — RUM 아님
- `createDatadogTraceHeaders()` → `x-datadog-trace-id`, `x-datadog-parent-id`, `x-datadog-origin:'browser'`, `x-datadog-sampling-priority:'1'`. `crypto` 없으면 `{}`. `generateTraceId()`
- RUM 초기화는 bznav `tracking-service/src/services/DatadogService.ts`. 소비 앱이 직접 부를 일 없음(zent-auth `AXIOS_INSTANCE`가 붙임). BE CORS `allowedHeaders`에 4개 헤더 필요

## P6. bznav-fe-ui 컴포넌트·스토리
- `frontend/bznav/ui/src/components/button/BoxButton.tsx`: variant 맵 상수 → `cva`, size 4단계, `forwardRef`, 로딩 오버레이 `LOADING_COLOR[variant]`(테마 토큰), `displayName`, **named export**. `BaseButton → BoxButton/TextButton/IconButton` 2층
- 토큰 클래스 `bg-primary-background-main`, `label-medium-semibold`, `rounded-bzc-small`, `px-normal-large`. 토큰은 `src/theme/*.ts` + `tailwind.config.ts`
- 스토리: `Meta/StoryObj`(`@storybook/react`) + `fn`(`@storybook/test`), `title: 'Bznav-UI/<그룹>/<이름>'`, `tags:['autodocs']`, 한국어 description/argTypes, `Default` + `Sizes/Variants/States` render 스토리
- **배럴 2단**: `src/components/index.ts`에 `export *` + 루트 `index.ts` named 목록 둘 다 추가해야 외부 노출. ⚠️ `src/components/index.ts`에 중복 `export *` 7군데

## P7. bznav-fe-platform
- `client.ts`/`server.ts`가 엔트리. `server.ts`는 `from './src/constants.ts'` **확장자 명시**. `RouterProvider`/`useCommonRouter` + `useAppRouterAdapter`/`usePageRouterAdapter`(App/Pages Router 흡수), RN 브릿지 4종

## P8. tracking-service 어댑터
- `BaseService`(abstract: `commonAttributes`, `init/setUser/sendEvent/unsetUser`) → 8 구현체. 모듈 레벨 `isXInitialized` 가드. `DatadogService.init()`이 RUM+logs+session replay, `sendEvent`는 `_viewed`만 RUM action
- 새 채널 = `BaseService` 상속 + `EventTrackingController` 등록 + `SEND_TARGETS`/타입

## P9. user-session / user-sign
- `AuthProvider(appId, clientId, signPaths, navigationEvent, isUseCI)` → `AuthService` 1회 생성 → `useAuthSession`(`checking|login|logout`, `isCurrentAppActive`) + `useAppSignFlow`. `AuthGuard`는 `checking`이면 판정 안 함, logout→`signPaths.signOut`, login인데 `signAppIds`에 앱 없으면 `saveReturnUrl` 후 `signUpTerms`. `CiGuard`는 쿠키 플래그로 본인인증 강제

## P10. devkit
- `link on`: `git update-index --skip-worktree package.json pnpm-lock.yaml` → 루트 `pnpm.overrides[pkg] = 'link:<상대경로>'` → `pnpm install`. 탐색 `ZENT_LOCAL_PATH` → `BRICS_LOCAL_PATH` → `../zent-packages` → `../../zent-packages`
- `link off`: `--no-skip-worktree` → overrides만 삭제(미커밋 변경 보존) → lockfile checkout → install
- `use-dev`: `ZENT_DEV_TAG || BRICS_DEV_TAG || 'dev'`, `pnpm view <pkg>@<tag>` 확인 → 없으면 `@dev` 폴백
- `withZentDevkit`: 링크 중에만 `turbopack.root`/`outputFileTracingRoot` 확장 + `SINGLETONS = ['react-hook-form','next-themes','react-cookie','next-auth']` dedupe(react/next 제외). 비링크 시 no-op

## P11. changeset md 형태
```md
---
'@zenterprise-inc/brics-fe-zent-auth': minor
'@zenterprise-inc/brics-fe-ui': patch
---

한 줄 요약 (breaking 이면 "(breaking)")

- 무엇을 어떻게 + **왜**. 심볼은 백틱. breaking 항목은 `**breaking**` 접두
- > 소비 레포 액션은 인용 블록
```
파일명은 의미 있는 슬러그(`session-sliding-fe-ui.md`)가 다수. 이슈키는 `REF-3584 …` 접두. 한국어
