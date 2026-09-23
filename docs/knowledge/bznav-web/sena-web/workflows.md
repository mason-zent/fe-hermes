# bznav-web apps/sena-web 반복 작업 절차
## 새 페이지
1. 인증 필요 → `app/(authenticated)/<route>/`(AuthGuard 자동), 로그인 플로우 → `app/(login)/`
2. `layout.tsx`에서 `Layouts.tsx` 3종 중 선택 + 플래그. 헤더는 `await checkShowHeader()` → `isUseHeader`
3. 경로 상수 **`lib/constants/paths.ts`의 `PATHS`**(하드코딩 거의 없음)
4. `page.tsx` 말미 `<PageViewEventLogger pageName="…"/>`
5. 크롤링 제한은 `public/robots.txt` Disallow (sitemap 은 API 서버 생성). ⚠️ **Disallow 는 크롤링을 막는 것이지 색인 제외를 보장하지 않는다** — 색인에서 빼려면 해당 페이지에 `noindex` 를 넣어야 한다
6. `proxy.ts`의 점검 리다이렉트·콘텐츠 gone 판정에 걸리는 경로인지 확인
## 스토어 — `lib/stores/<도메인>.ts`에 `atom` + 파생 atom. 비직렬 공유 상태(AbortController)는 atom 아닌 **모듈 스코프 Map** 관례
## 챗 흐름 수정 순서
1. `lib/stores/chat.ts`(관여 atom·파생) → 2. `lib/hooks/use-submit-question.ts`(진입 가드) → 3. `lib/hooks/use-chat-message.ts`(스트림 생성·취소, Map) → 4. `lib/api/chat.ts`(**4갈래 전부**) → 5. `lib/utils/chat-sse.ts`(`ChatSseFrame`) → 6. `chat-stream-storage.ts` + `use-chat-stream-recovery.ts`(복귀 재연결) → 7. `app/chat/layout.tsx` ↔ `ChatContent.tsx` 리마운트 경계 → 8. 제휴사면 `app/api/partner/v2/chat/**/route.ts`
## 검증 — `scripts/verify/bznav-web.sh sena-web`
