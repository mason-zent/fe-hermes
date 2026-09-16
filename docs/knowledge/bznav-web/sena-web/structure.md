# bznav-web apps/sena-web 구조 맵
기준 `origin/prd-sena` `67795fe08`, 파일 236개, 최근 180일 커밋 220건(가장 활발). 경로 `apps/sena-web/` 기준. 레포 공통 `../common.md`.

## app/
| 경로 | 역할 |
|---|---|
| `page.tsx` | 홈(서버). `checkShowHeader()` + `getServerWorkingPlatform` → `Promise.all(getContents, getHomeAdCards)` → `LogoLayout` + `MainChat` + `ContentCardSection` |
| `chat/[[...chatId]]/page.tsx` | optional catch-all. 내용은 `PageViewEventLogger`만 |
| **`chat/layout.tsx`** | 채팅 본문 `<ChatContent/>`를 **layout에서 렌더**(`/chat` ↔ `/chat/[id]` 전환 시 리마운트 방지) |
| `chat/_components/` | `ChatContent.tsx`(코어), `ChatItems.tsx`, `DislikeFeedbackDrawer.tsx` |
| `(authenticated)/` | `layout.tsx` = `<AuthGuard logoutPagePath="/">`. `my/`, `notification/`, `policies/`, `withdraw/`, `user-type-survey/`(5단계) |
| `(login)/` | `signin`, `signup/{terms,input}`, `ci-request`, `ci-authentication`, `duplicate-account` — 본문은 `@repo/user-sign` 컴포넌트 그대로 |
| `contents/` | `(conversion)/[id]` 상세, `gone/`, `_components/` |
| `about/`(+`_hooks/`) · `app-menu/` · `search-chat/` · `system-maintenance/` · `not-found.tsx` | |
| `api/` | `maintenance`(Firebase Storage 프록시), `partner/v2/chat/completions`, `partner/v2/chat/streams/[requestUuid]/[action]` — **제휴사 토큰 은닉 프록시** |
| `_components/` | `chat-content/`(13), `chat-list/`(8), `sidebar/`, `layout-content/{Layouts,LayoutItems,HeaderItems,ChatTitleHeader,SenaAppContent}`, `ads/`, `cta-content/`, `menu-drawer/`, `GlobalErrorBoundary`, `LoginRequiredDialog`, `SenaIntroduceModal`, `SurveyGuard` |

## 디렉터리
`lib/api/`(9: `chat.ts` 최대, contents, user, survey, plan, terms, withdraw, system, ad-slots) · `lib/stores/`(5: `chat.ts` 최대, home, user, plan, survey) · `lib/hooks/`(26, kebab `use-*`, 채팅 8개) · `lib/utils/`(17, `request.ts` 관문, `chat-sse.ts`, `chat-stream-storage.ts`, `page-control.ts`, `strings.ts`(marked), `server/platform.ts` `'use server'`) · `lib/constants/`(10, `paths.ts` `PATHS`) · `styles/{default,markdown,variables}.scss` · `public/robots.txt`(커밋)

## 스크립트·설정
- `dev`: `pnpm gen:env && next dev -p 3300 --turbo`(**gen:env 자동**, SSM loc). **`postbuild` 없음, next-sitemap 없음** — sitemap은 API 서버가 제공(rewrite)
- `next.config.mjs`: assetPrefix `${CDN}/bznav-sena-web/${BUILD_ID}`(**유일하게 빌드 ID**), rewrite `/sitemap*.xml` → `NEXT_PUBLIC_SENA_API_SERVER`, redirect `/home` → `/`, `/calc/*` → `calc.bznav.com`
- `proxy.ts`(3앱 중 가장 무거움): ① `/content(s)/:id` BE 조회(1.5s) → 404/410이면 `/contents/gone` rewrite(404 + noindex) ② `bypassActionResponse` ③ Firebase 점검 설정 → `level: 'service'|'chat'` 리다이렉트 ④ working-platform·UTM·maintenance 쿠키. `matcher` 없음
