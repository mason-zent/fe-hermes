# bznav sena-web — 다이어그램 서비스 가이드

공통 원칙·archify 제약·검증 명령은 [`../AUTHORING.md`](../AUTHORING.md)에 있다. 이 문서는 sena-web 에만 해당하는 것만 적는다. 경로는 따로 적지 않으면 `apps/sena-web/` 기준이다.

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/bznav-web` (모노레포) |
| 앱 루트 | `apps/sena-web/` |
| 기준 ref | `origin/prd-sena` (`hermes.config.json`) — 이 가이드를 쓸 때 `714b344` (2026-09-23 커밋) |
| 라우터 | App Router. route group `(authenticated)` · `(login)` · `contents/(conversion)`. `pages/` 없음 |
| 화면 수 | **page.tsx 20개** — 공개 6 · 채팅 2 · `(authenticated)` 6 · `(login)` 6 |
| 화면이 아닌 경로 | Route Handler 3(`app/api/**/route.ts`) · `app/not-found.tsx` · `public/sw.js` — 세지 않는다 |

화면 수 세는 명령:

```bash
git -C repos/bznav-web ls-tree -r --name-only origin/prd-sena apps/sena-web | grep -E '/page\.tsx$'
node scripts/diagram-coverage.mjs docs/diagrams/sena-web
# → 화면 파일 20 (App Router 20 · Pages Router 0) · 다이어그램에 담긴 화면 20 · 탭 5 / 누락 0 · 중복 0 · 없는 경로 0
```

## 2. 지금 있는 장

고정 커밋은 JSON `meta.repository.revision` 앞 7자다. "없음" 인 장은 `repository`·`sources` 가 없어 `check-diagrams.mjs` 가 근거를 점검하지 못한다.

| 종류 | 원본 → 결과 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|---|
| 구조 | `bznav-sena-web.architecture.json` → `bznav-sena-web.html` | `714b344` | 노드 14 · 연결 11. chat layout·ChatContent·채팅 훅·요청 관문·스트림 파서·제휴사 프록시·proxy.ts |
| 화면 맵 | `bznav-sena-web.domains.architecture.json` → `bznav-sena-web.domains.html` | 없음 | 20화면을 12노드로. `(authenticated)`·`(login)` 경계 |
| 요청 흐름 | `bznav-sena-web.sequence.json` → `bznav-sena-web.sequence.html` | 없음 | 대표 흐름 **챗 질문 전송** — 진입 가드 → 스트림 → SSE → 재연결 (참여자 8 · 메시지 14) |
| 화면 상태 | `bznav-sena-web.lifecycle.json` → `bznav-sena-web.lifecycle.html` | 없음 | 챗 스트림 phase(loading·streaming·reconnecting). **2026-09-28 목록에서 뺐다** — 새로 만들지 않는다 |
| 심층 번들 | `sena-web/build-bundle.py` → `sena-web/sena-web-architecture.html` | `714b344` (첫 탭에서 읽음) | 탭 5장. 목록 카드 링크 "심층 · 20화면" (`scripts/build-diagram-index.mjs`) |

## 3. 심층 탭 구성

화면이 20개라 "화면 전수" 1장 + **핵심 흐름을 파일·함수 단위로** 그린 장 3개로 짰다. Provider 가 10겹이고 가드가 여럿이라 셸·가드를 탭 1 로 뺐다(`AUTHORING.md` 4절).

| 탭 | 파일 | 도메인 경계 (경로 접두사) | 화면 | 노드 · 연결 |
|---|---|---|---|---|
| 0 상세 | `sena-web-detail.architecture.json` | 앱 전체. 진입 → 셸 → 가드 → 화면군 → 훅 → 관문 4종 | 0 (대표 인용) | 26 · 25 |
| 1 루트 셸 · 가드 | `shell-guard.architecture.json` | `app/layout.tsx` · `app/_components/layout-content/SenaAppContent.tsx` · 가드 8종 | 0 | 16 · 15 |
| 2 화면 20 | `screens.architecture.json` | 아래 표 | **20** | 16 · 9 |
| 3 채팅 스트림 | `chat-stream.architecture.json` | 채팅 입력 → completions 4갈래 → SSE → 복구 | 0 | 19 · 18 |
| 4 답변 알림 · 웹 푸시 | `answer-push.architecture.json` | done 뒤 ACK · 배너 · 웹 푸시 구독 수명 (SENA-730) | 0 | 17 · 16 |

`build-bundle.py` 의 `DRILL`: 탭 0 `shell`·`guard` → 1, `home`·`etc`·`authed`·`login` → 2, `chat`·`chathooks` → 3, `banner`·`pushhooks`·`sw` → 4 / 탭 1 `banner` → 4 / 탭 2 `chatlayout` → 3 / 탭 3 `frame` → 4.

### 탭 2 — 화면 20 의 도메인 경계

| 묶음 | 경로 접두사 | 화면 | 노드 |
|---|---|---|---|
| 공개 | `app/page.tsx` · `app/contents/` · `app/about/` · `app/app-menu/` · `app/system-maintenance/` | 6 | `home` · `contents`(2) · `about`(2) · `maint` |
| 채팅 | `app/chat/` · `app/search-chat/` | 2 | `chatlayout`·`chatpage` · `searchlayout`·`searchpage` |
| 인증 | `app/(authenticated)/` | 6 | `authlayout` · `my`(3) · `surveypage` · `withdraw`(2) |
| 로그인 | `app/(login)/` | 6 | `signin` · `signup`(2) · `ci`(2) · `dup` |

### 흐름 탭이 근거로 삼는 파일 — 이 파일이 바뀌면 그 탭을 고친다

**탭 1 셸 · 가드**
- Provider 순서: `app/layout.tsx`(JotaiProvider → Toaster → PageNavigationEventProvider) → `app/_components/layout-content/SenaAppContent.tsx`(RouterProvider → AuthProvider → EventTrackingProvider → AnswerNotificationBannerList · Suspense → CiGuard → TooltipProvider → DialogProvider → NiceModal.Provider → SurveyGuard → SenaMainShell → PageContent)
- 렌더를 막거나 돌려보내는 가드: `app/_components/SurveyGuard.tsx` · `app/(authenticated)/layout.tsx`(AuthGuard) · `app/search-chat/layout.tsx`(비로그인이면 홈으로 push)
- 행동을 막는 게이트: `lib/hooks/use-submit-question.ts` · `lib/hooks/use-sena-consent-guard.ts` · `app/chat/_components/ChatContent.tsx`(`?secure-chat=true`) · `lib/utils/auth-error-handler.ts`

**탭 3 채팅 스트림** (지식 문서 `sena-web/workflows.md` "챗 흐름 수정 순서" 와 같은 파일들)
- 입력·진입: `app/_components/chat-content/ChatTextarea.tsx` · `lib/hooks/use-submit-question.ts` · `lib/hooks/use-new-chat.ts`
- 스트림 생성·프레임 처리·취소: `lib/hooks/use-chat-message.ts` (모듈 스코프 Map·Set 포함)
- 요청 4갈래·스트림 경로: `lib/api/chat.ts` · `lib/hooks/use-chat-stream-caller.ts` · `lib/utils/guest-device-id.ts`
- SSE 파서: `lib/utils/chat-sse.ts` (구분자 `<ENDLINE>`)
- 상태·저장: `lib/stores/chat.ts` · `lib/utils/chat-stream-storage.ts`
- 복구: `lib/hooks/use-chat-stream-recovery.ts` · 트리거 `app/chat/_components/ChatContent.tsx`
- 제휴사: `app/api/partner/v2/chat/completions/route.ts` · `app/api/partner/v2/chat/streams/[requestUuid]/[action]/route.ts`
- 그림에 노드가 없는 보조 파일(`use-chat-message.ts` 가 import): `lib/utils/chat-request.ts`(대화 → messages 페이로드) · `lib/utils/chat-draft.ts` · `lib/utils/chat-answer-error.ts`. 이쪽 동작이 바뀌어 흐름에 영향이 있으면 노드를 더한다

**탭 4 답변 알림 · 웹 푸시**
- ACK: `lib/hooks/use-answer-ack.ts` · `lib/utils/answer-notification.ts` · `lib/api/chat.ts` `ackChatStream`
- 배너·네이티브 배너: `lib/hooks/use-answer-notification.ts` · `lib/stores/answer-notification.ts` · `app/_components/answer-notification/AnswerNotificationBannerList.tsx`
- 권한 CTA: `lib/hooks/use-push-permission-cta.ts` · `lib/utils/push-prompt.ts` · `app/_components/chat-content/StickyChat.tsx` · `app/_components/cta-content/notification/AnswerNotificationCta.tsx` · `app/_components/cta-content/notification/PushDeniedGuideDrawer.tsx`
- 구독 수명: `lib/hooks/use-web-push.ts` · `lib/utils/web-push.ts` · `lib/api/push.ts` · `public/sw.js`
- 로그아웃 경로: `app/(authenticated)/my/_components/LogoutDrawer.tsx` · `SenaAppContent.tsx` 인증 오류 핸들러

## 4. 탭 0 에 들어갈 실제 파일

| 층 | 파일 | 무엇 |
|---|---|---|
| 진입 | `proxy.ts` | ① `/content(s)/:id` 를 BE 에 1.5초 제한으로 조회 → 404·410 이면 `/contents/gone` rewrite(404 + noindex, 83–101) ② `bypassActionResponse` ③ Firebase 점검 설정 `level: service·chat`(117–131) ④ 플랫폼·UTM·점검 쿠키. `matcher` 없음 |
| 진입 | `next.config.mjs` | assetPrefix `${CDN}/bznav-sena-web`(loc 은 `''`) · rewrite `/sitemap*.xml` → `NEXT_PUBLIC_SENA_API_SERVER`(15–26) · redirect `/home`→`/`, `/calc/*`→`calc.bznav.com`(27–40) |
| 진입 | `lib/constants/platform.ts` | 점검 설정 URL(Firebase Storage 공개 URL) · 점검 허용 경로 |
| 셸 | `app/layout.tsx` | 서버. `getServerWorkingPlatform()` · 운영에서만 AdSense 스크립트 · Organization JSON-LD → `SenaAppContent` |
| 셸 | `app/_components/layout-content/SenaAppContent.tsx` | Provider 10겹(3절 탭 1). `SenaMainShell` 에서 인증 오류 핸들러 등록(115–125), `PageContent` 에서 `useWebPushLifecycle`(140) |
| 셸 | `app/_components/layout-content/Layouts.tsx` | `LogoLayout` · `BackButtonLayout` · `ConversionLayout` 3종 |
| 가드 | `app/_components/SurveyGuard.tsx` · `app/(authenticated)/layout.tsx` · `app/search-chat/layout.tsx` | 3절 탭 1 |
| 화면군 | `app/chat/layout.tsx` · `app/chat/_components/ChatContent.tsx` | 채팅 본문은 **layout 에서** 렌더 |
| 훅 | `lib/hooks/use-chat-message.ts` · `use-chat-stream-recovery.ts` · `use-submit-question.ts` · `use-answer-ack.ts` · `use-answer-notification.ts` · `use-web-push.ts` · `use-survey-flow.ts` · `use-user-profile.ts` | 채팅 · 알림/푸시 · 계정 |
| 관문 1 | `lib/utils/request.ts` `requestSenaV2Fetch`(41–62) | 대부분의 `lib/api/*`. 실패 body.code 로 인증 오류 판정 |
| 관문 2 | `lib/utils/request.ts` `requestPartnerV2Fetch`(13–32) + `app/api/partner/v2/**` | 제휴사(kbank · joins-hr). 토큰은 Route 에서만 붙인다 |
| 관문 3 | `lib/api/terms.ts` · `lib/api/system.ts` · `app/api/maintenance/route.ts` | `@repo/common-utils` `requestFetch` 직접 — 인증 오류 처리를 타지 않는다 |
| 관문 4 | `public/sw.js` | 브라우저가 띄우는 Service Worker. 앱 코드 관문이 아니다 |
| 서버 fetch | `lib/api/contents.ts` · `lib/api/ad-slots.ts` | 홈·콘텐츠 서버 렌더 |
| 외부 | 세나 API(`NEXT_PUBLIC_SENA_API_SERVER` · `/api/bznav` · `/api/partner`) · SSO API · 브라우저 푸시 서비스 · Firebase Storage · `@repo/user-sign`(로그인 UI) | 박스 밖 |

## 5. 이 서비스만의 주의

- **화면 수로 작업량을 가늠하지 않는다.** 20화면 중 `/chat/[[...chatId]]` 한 화면에 스트림 생성·SSE·재연결·ACK·알림이 다 들어 있다. 그래서 흐름 탭이 셋이다
- **`/chat` 의 page.tsx 는 비어 있다.** `app/chat/[[...chatId]]/page.tsx` 는 `PageViewEventLogger` 한 줄이고 본문 `ChatContent` 는 `app/chat/layout.tsx` 13–14 에 있다(리마운트 방지 주석). 화면 노드의 근거는 page 파일이지만 흐름은 layout 에서 따라간다. optional catch-all 이라 한 파일이 `/chat` 과 `/chat/<id>` 를 받는다
- **로그인 화면 본문은 패키지다.** `(login)` 6화면과 `/withdraw/confirm` 은 `@repo/user-sign` 컴포넌트 하나를 렌더한다(예 `app/(login)/signin/page.tsx`). 그 화면 안을 그리려면 `packages/user-sign` 을 읽어야 하고 수정도 bznav-packages-fe 몫이다
- **`/user-type-survey` 는 한 page 가 `?step=` 으로 여러 화면을 그린다** — intro · user-type · industry · office-info · interest · completed (`app/(authenticated)/user-type-survey/page.tsx` 47–48). 화면 수는 1
- **가드는 한 층이 아니다.** proxy(점검·gone) → SurveyGuard(전역, replace 만) → AuthGuard(`(authenticated)` 한 곳) → search-chat layout(렌더 뒤 push). 채팅은 비회원도 쓴다(`X-Device-Id`)
- **로그인 판정은 `auth.isCurrentAppActive`** 다(`app/search-chat/layout.tsx` 13 · `SenaAppContent.tsx` 112). `auth.status` 로 그리지 않는다
- **인증 오류는 HTTP 401 이 아니라 응답 body.code** 다(`lib/utils/request.ts` 51–59 → `lib/utils/auth-error-handler.ts`)
- **스트림 구분자는 `<ENDLINE>`** (`lib/utils/chat-sse.ts` 34). "표준 SSE" 라고 쓰지 않는다
- **요청은 4갈래, 복구는 3종.** completions 는 회원·임시(secret)·비회원·제휴사 4개(`lib/api/chat.ts`), `/live`·`/status`·`/cancel` 은 `ChatStreamCaller` partner·member·guest 3종(`lib/api/chat.ts` 16–18), `/ack` 는 회원 전용(52–53)
- **sitemap 은 프론트가 만들지 않는다.** next-sitemap·postbuild 없음, API 서버 rewrite. 크롤링 제한은 `public/robots.txt`
- **`/calc/*` 는 외부로 나간다.** sena 안에 `/calc` 화면을 그리지 않는다
- **`firebase-key.json` 이 앱 루트에 커밋되어 있다.** 열거나 인용하지 않는다. 점검 설정은 공개 Storage URL 로 읽는다

## 6. 바뀌면 손볼 곳

| 변화 | 손볼 곳 |
|---|---|
| `app/(authenticated)/` 에 화면 추가 | 탭 2 `my`·`withdraw` 등 해당 노드(노드당 화면 3개까지)나 새 노드 + boundary 두 곳(`app/`·`(authenticated)`) `wraps` · 탭 0 `authed` 문구 "6화면" · 탭 2 subtitle·카드 화면 수 · `build-bundle.py` TABS 설명 "인증 6" |
| `app/(login)/` 에 화면 추가 | 탭 2 `signin`·`signup`·`ci`·`dup` 중 하나 또는 새 노드 · 탭 0 `login` 문구 · 위와 같은 수 문구 |
| 공개 화면 추가 (`app/<새 경로>/`) | 탭 2 공개 줄에 노드 · 탭 0 `home` 또는 `etc` 에 붙이고 `DRILL` 0 → 2 확인 · proxy 점검·gone 판정에 걸리는지 탭 0 `proxy` 카드 |
| 새 route group | 탭 2 에 boundary 를 하나 더 두고 탭 0 화면군 노드 + `DRILL` 0 → 2 |
| 채팅 요청 갈래·스트림 액션 추가 | 탭 3 `lib/api/chat.ts` boundary(`member`·`secret`·`guest`·`partnerchat`) · `caller` · `streamroute` · 카드 "4갈래지만 복구는 3종" |
| 새 SSE 프레임 타입 | 탭 3 `frame`(processStreamFrame) sublabel · done 이면 탭 4 `done` |
| 알림·푸시 조건 변경 | 탭 4 `ackhook`·`notify`·`ctahook`·`subscribe` · 카드 "대상이 아닌 경우" |
| Provider 추가·순서 변경 | 탭 1 boundary `SenaAppContent` 의 번호 노드 순서 · 탭 0 `shell` sublabel |
| 새 관문(fetch 래퍼) | 탭 0 boundary "데이터 관문 4종" 과 카드 "관문이 하나가 아니다" |

## 7. 읽을 지식 문서

- `docs/knowledge/bznav-web/sena-web/structure.md` · `patterns.md` · `workflows.md`(챗 흐름 수정 순서) · `gotchas.md`
- `docs/knowledge/bznav-web/rules.md` (sena-web: `app/chat/` 변경은 상태 전달 흐름부터) · `common.md` · `gotchas.md`(`firebase-key.json`)
- `docs/diagrams/README.md` 대표 화면 표 (챗 스트림)
