# bznav-web apps/sena-web 대표 패턴
## 페이지 골격 / 서버·클라 경계
- 서버에서 쿠키 플랫폼 판정 → 플래그: `lib/utils/server/platform.ts`의 `checkShowHeader()`(`'use server'`, `WORKING_PLATFORM_KEY` 쿠키) → `<LogoLayout isUseHeader={…}>`
- **레이아웃 3종**(`app/_components/layout-content/Layouts.tsx`): `LogoLayout` / `BackButtonLayout` / `ConversionLayout`. 불리언 플래그 props(`isUseHeader`, `isUseStickyChat`, `stickyChatMode`, `isUseDefaultFooter`, `isUseAppMenu`, `isUseShare`)로 조합. 새 페이지는 이 셋 중 택1
- 클라이언트 파일 94 — 서버 컴포넌트는 `page.tsx`/`layout.tsx` 얕은 층만

## 클라이언트 셸 `SenaAppContent.tsx` (가장 깊은 Provider 중첩)
`RouterProvider` → `AuthProvider(isUseCI: true)` → `EventTrackingProvider`(**mixpanel+airbridge+datadog+google**, datadog `appVersion: packageJSON.version`) → `Suspense` → `CiGuard` → `TooltipProvider` → `DialogProvider` → `NiceModal.Provider` → `SurveyGuard` → `SenaMainShell` → `PageContent`(`GlobalErrorBoundary`). `initializeReactNativeBridge(SERVICE_APP_ID)` + `sendBznavNativeMessage('setSignInInitialRoute')`, `registerUnauthorizedHandler(() => { setStatusSignOut(); router.push(PATHS.SIGN_IN) })`, `useForceAppUpdate()`, `import '@/styles/markdown.scss'`

## 데이터 — axios 없음, fetch 래퍼 2개가 관문 (`lib/utils/request.ts`)
- `requestSenaV2Fetch(endpoint, platform, data?, options?)`: `NEXT_PUBLIC_SENA_API_SERVER`, `X-Platform` 헤더, 실패 body `code` → `handleAuthErrorCode`(401 전역)
- `requestPartnerV2Fetch`: 순수 fetch → `app/api/partner/...` 내부 Route
- `lib/api/*.ts`는 이 둘만 호출. **컴포넌트에서 직접 fetch 금지**가 사실상 규칙. API마다 회원/비회원(`X-Device-Id`)/임시(secret)/제휴사 4갈래 반복(`requestChat`/`requestGuestChat`/`requestSecretChat`/`requestPartnerChat`), 스트림 경로는 `ChatStreamCaller {variant}` + `buildChatStreamPath`

## Jotai (`lib/stores/chat.ts`가 표준)
- `export const xxxAtom = atom<T>(init)` 나열, **`atomWithStorage` 미사용**(plus와 대비). **파생 atom 적극**(`allChatListAtom`, `currentRoomKeyAtom`, `isAnsweringCurrentRoomAtom`). 스트림 `chatStreamsAtom: Record<streamId, ChatStream>`(`phase: 'loading'|'streaming'|'reconnecting'`). 상수 `NEW_CHAT_ROOM_KEY='new'`, `SECRET_CHAT_ROOM_KEY='secret'`도 스토어 파일에
- 컴포넌트는 `useAtomValue`/`useSetAtom` 선호, 훅에서 렌더 밖 읽기는 `useStore().get()`

## 채팅 UI·스트리밍·마크다운 (핵심)
- 진입 `useSubmitQuestion().submitQuestion(q, {isSecureChat})` — 비제휴·비로그인·`dailyChatRemaining === 0`이면 `'login-required'`
- `lib/hooks/use-chat-message.ts`(최대 훅): **모듈 스코프 Map/Set**(`streamAbortControllers`, `activeStreamIds` …)으로 인스턴스 간 공유(주석: 여러 곳에서 호출되는 훅이 서로의 스트림을 취소해야 함)
- SSE 파서 `lib/utils/chat-sse.ts` `readChatSseStream` — **구분자 `<ENDLINE>`**(표준 `\n\n` 아님), `data:` 제거 후 JSON
- 복구 `chat-stream-storage.ts` + `use-chat-stream-recovery.ts` + `/streams/{uuid}/{live|status|cancel}`. `ChatContent`가 `visibilitychange`/`online`/`offline`로 재연결
- 마크다운 `lib/utils/strings.ts`(**유일한 `marked` 사용처**, `breaks: true`) → `.answer-mark-down`(`styles/markdown.scss`)
- 스크롤 `lib/utils/page-control.ts`, `ChatContent`의 `useLayoutEffect` `paddingBottom: calc(100dvh - …)`

## 로그인·세션 — `@repo/user-session`(27): 판정은 **`auth.isCurrentAppActive`**(단순 로그인 아님), 준비는 `auth.status !== 'checking'`. `@repo/user-sign`(17): `(login)` 페이지가 `SignInContent`, `SignDefaultLayout` 그대로 — 로그인 UI는 패키지에 있다

## 스타일 — Tailwind 기본. SCSS 모듈 **4개**(`ChatSendButton`, `ChatTextarea`, `MoreQuestion`, `about/QuestionCarousel` — Tailwind로 어려운 애니메이션만). 전역 `default`/`markdown`/`variables.scss`
## 트래킹 64파일 — 페이지 말미 `<PageViewEventLogger pageName="…"/>`(홈 `'main'`, 채팅 `'chat'`), 클릭 `useUserEventLogger().sendClickEvent`
## `@repo/platform` 49 — `useWorkingPlatform()`, 제휴사 `ALL_PARTNERS.includes(workingPlatform)`(`['kbank','joins-hr']`), 헤더 분기 서버 `checkShowHeader()` + 클라 `use-platform.ts`
