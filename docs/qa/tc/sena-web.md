# sena-web QA TC — 비즈넵 세나 (AI 비즈니스 상담 챗)

> 2026-10-02 · 조사 기준 로컬 `dev` `4b382c733` — 운영 `origin/prd-sena`(`714b344`)보다 sena-web 커밋 9개 앞섬(SENA-744 비정수 콘텐츠 ID 404 · 채팅 목록 고정·안읽음 뱃지 · ☰ 안읽음 점은 운영에 아직 없음) · 출발점: bznav-sena-fe 인수인계 `.qa-runs/handoff-sena-web-20261002/`(화면 20개 · 입력 시나리오 6개 → "(인수인계)" 표시) · 경로는 `repos/bznav-web/apps/sena-web/` 기준(packages 는 `packages/…`)
> 묶음 안내·자동화 방식 뜻: [README.md](README.md)

## 먼저 알아둘 것
- **이메일 로그인은 dev/loc 에서만 보인다** — prd·stg 는 숨김(`SignInContent.tsx:29`). 간편로그인은 localhost 로 안 돌아온다 → 로그인 TC 는 dev/loc 에서만
- **폭 경계**(`packages/ui/src/theme/mediaQuery.ts`): compact ≤743 모바일(사이드바 숨김·☰) · medium 744–1023 · expanded ≥1024 사이드바 · xs ≤360 "무료로 회원가입" 숨김
- **SSE 구분자 `<ENDLINE>`**(`lib/utils/chat-sse.ts:34`) — 응답 흉내 본문은 `data: {json}<ENDLINE>`. 프레임: `meta`(requestUuid·roomUuid) · `progress`(message) · `rate_limit`(rateLimitRemaining) · 답변 조각(`answer`·`qaHistoryId`·`title`/`roomTitle`) · `done` · `error`(message·retryable) — `lib/hooks/use-chat-message.ts:253-375`
- **답변 대기는 `networkidle` 금지**(SSE 가 열려 있다) — 인수인계 방식 "입력창 다시 켜짐 + 본문 변화 30자 이내 2회, 최대 90초"
- **물결표 이슈의 실제 증상**: 취소선이 아니라 `~` 가 사라진다 — `lib/utils/strings.ts:15` 가 `<del>` 을 벗겨냄. 판정은 "`~` 사라짐(1월 1일6월 30일)". `issues/20261002-bznav-web-sena-markdown-tilde-strikethrough.md` 의 "취소선이 그어져" 는 부정확

## A) 화면

| 라우트 | 그룹 | 로그인 | 본인인증 | 동적 샘플 | 단계형 | 근거 |
|---|---|---|---|---|---|---|
| `/` | 루트 | 불필요 | — | — | — (콘텐츠 카드 무한 스크롤 → 스크롤 끝 미도달 `✗끝`) | `app/page.tsx` |
| `/chat`, `/chat/[id]` | `chat/[[...chatId]]` | 게스트 질문 가능 · 방 조회는 회원(401/ENTITY_NOT_FOUND → `/chat`) · `?secure-chat=true` 는 로그인 필요(다이얼로그) | — | `/chat/2026649c-6537-4031-9eee-3367a313c386`(QA 계정 방) · `?qaHistoryId=<n>` · `?secure-chat=true` | — | `app/chat/layout.tsx`, `ChatContent.tsx:110-123`, `use-chat-room-content.ts:92-131` |
| `/search-chat` | 클라 가드 | 필요 — `!isCurrentAppActive` 면 `push('/')`(status 안 봄 · 알려진 예외) | — | — | — | `app/search-chat/layout.tsx:15-19` |
| `/contents/[id]` (`/content/[id]` 도 proxy) | `contents/(conversion)` | 불필요 | — | `1658484` · 비정수 `abc` → 404(dev 만) · 삭제 ID → `/contents/gone` rewrite + 404 · `315976` noindex | — | `contents/(conversion)/[id]/page.tsx:24-38,52,91`, `proxy.ts:82-98` |
| `/contents/gone` | contents | 불필요 | — | 직접 200 · proxy rewrite 면 404 + `X-Robots-Tag: noindex` | — | `app/contents/gone/page.tsx` |
| `/about` · `/app-menu` | — | 불필요 | — | — | — | `app/about/*`, `app/app-menu/page.tsx` |
| `/system-maintenance` | — | 불필요 · 점검 꺼짐이면 proxy 가 `/` 로 | — | — | — | `proxy.ts:113-127` |
| `/signin` | (login) | 로그인 상태면 `/` 로 replace · 세나 미가입 → `/signup/terms` · app 이면 dupKey → `/duplicate-account` | — | `?return_url=` `?error_code=` | — | `packages/user-sign/src/components/SignInContent.tsx:84-121` |
| `/signup/input` | (login) | 불필요 | — | — | 가입 1/2 → `/signup/terms?state=` | `SignUpInput.tsx` |
| `/signup/terms` | (login) | 불필요(로그인·미가입이면 addSignedApp) | — | `?state=`(이메일) / `?code=`(소셜) | 가입 2/2 | `SignTerms.tsx:137-143` |
| `/ci-request` | (login) | CiGuard: 로그인 + 쿠키 `BZNAV_SIGN_REQUIRED_STEP.<ZENV>`.ciAuthentication | 시작 | `?return_url=` | CI 1/2 | `AuthGuard.tsx:36-62`, `CICollectionRequest.tsx` |
| `/ci-authentication` | (login) | — | 결과 | `?state=success\|failure&request_type=&error_code=&verification_code=` | CI 2/2 (state 없으면 스피너만) | `CIAuthentication.tsx:85-153` |
| `/duplicate-account` | (login) | — | — | `?dupKey=`(없으면 빈 화면이 정상) | — | `DuplicateAccountContent.tsx:63-66` |
| `/my` · `/notification` · `/policies` | (authenticated) | AuthGuard: logout → `/` · 미가입 → `/signup/terms` | CiGuard | — | — | `app/(authenticated)/layout.tsx`, `AuthGuard.tsx:18-24` |
| `/user-type-survey` | (authenticated) | 위와 같음 + SurveyGuard | — | `?step=intro\|user-type\|industry\|office-info\|interest\|completed` | 6단계(중간 step 직접 진입 → intro) | `user-type-survey/page.tsx:47-57`, `SurveyGuard.tsx:26-43` |
| `/withdraw` · `/withdraw/confirm` | (authenticated) | 위와 같음 | 탈퇴 직전 매번 CI · confirm 은 `verification_code` 필요 | `?verification_code=` | 탈퇴 1/2 · 2/2 | `WithdrawPageContent.tsx:63-103`, `WithdrawContent.tsx:30-40` |
| (not-found) | — | — | — | `/forgot-password`(알려진 404) | — | `app/not-found.tsx` |
| API `/api/maintenance` · `/api/partner/v2/chat/completions` · `/api/partner/v2/chat/streams/[requestUuid]/[action]` | app/api | — | — | — | — | `app/api/**/route.ts` |

`PATHS` 의 `/gone`·`/redirect`·`/signup/duplicate` 는 페이지도 사용처도 없다.

## B) TC

| ID | 분류 | 제목 | 세션 | 뷰포트 | 사전 조건 | 단계 | 기대 결과 | 자동화 | 우선 | 근거 |
|---|---|---|---|---|---|---|---|---|---|---|
| SN-001 | 스모크 | (인수인계) 비로그인 공개 화면 묶음 | logout | 둘다 | next start :3300, loc | `/` `/chat` `/contents/1658484` `/contents/gone` `/about` `/app-menu` `/signin` `/signup/terms` `/signup/input` `/ci-request` `/ci-authentication` `/duplicate-account` 열고 스크롤 | 200 · 경로 유지 · pageerror/console error 0(`/forgot-password` 제외) · 가로 넘침 0 · 깨진 이미지 0 | 스모크 | P0 | `qa-all.mjs:25-46,123-151` |
| SN-002 | 스모크 | (인수인계) 로그인 회원 화면 묶음 | login | 둘다 | 이메일 로그인 | SN-001 + `/my` `/notification` `/policies` `/user-type-survey` `/withdraw` `/withdraw/confirm` | 회원 화면 6개 경로 유지 · 에러 0 | 스모크 | P0 | `qa-all.mjs:256-275` |
| SN-003 | 가드 | (인수인계) 비로그인 회원 화면 직접 진입 | logout | 둘다 | — | `/my` `/notification` `/policies` `/user-type-survey` `/withdraw` `/withdraw/confirm` `/search-chat` | 모두 최종 `/` | 스모크 | P0 | `AuthGuard.tsx:18-19`, `search-chat/layout.tsx:15-19` |
| SN-004 | 가드 | (인수인계) 점검 꺼짐 `/system-maintenance` | 둘다 | 둘다 | 점검 status=false | `/system-maintenance` | 최종 `/` | 스모크 | P1 | `proxy.ts:124-125` |
| SN-005 | 가드 | (인수인계) 로그인 상태 `/signin` | login | 둘다 | — | `/signin` | `/` 로 replace · 로그인 폼 안 보임 | 스모크 | P1 | `SignInContent.tsx:84-87,112-125` |
| SN-006 | 가드 | (인수인계·알려진 예외) 로그인 `/search-chat` 직접 진입 | login | 둘다 | — | `/search-chat` 새로고침 | 현재 `/`(issue) · 고쳐지면 유지 | 스모크 | P2 | issue search-chat-direct-url-redirect |
| SN-007 | 가드 | 비로그인 임시 채팅 | logout | 둘다 | — | `/chat?secure-chat=true` → "취소" / 다시 "로그인" | 다이얼로그 "로그인이 필요해요" + "임시 채팅은 로그인 후 이용할 수 있어요." · 취소 → `/chat` · 로그인 → `/signin?return_url=%2Fchat%3Fsecure-chat%3Dtrue` | 씬 | P1 | `ChatContent.tsx:115-121`, `LoginRequiredDialog.tsx:40-47` |
| SN-008 | 가드 | 비로그인 데스크톱 "채팅 검색" | logout | desktop | 폭 ≥744 | readonly "채팅 검색" → "로그인" | "로그인하면 저장된 채팅을 검색할 수 있어요." → `/signin?return_url=%2Fsearch-chat` | 씬 | P1 | `Sidebar.tsx:274-287,299` |
| SN-009 | 가드 | CI 필요 계정 → `/ci-request` | login | 둘다 | 쿠키 `BZNAV_SIGN_REQUIRED_STEP.<ZENV>`={"ciAuthentication":true} | `/my` | `/ci-request?return_url=%2Fmy` | 응답 흉내(쿠키) | P1 | `AuthGuard.tsx:55-61` |
| SN-010 | 가드 | 세나 미가입 SSO 계정 | login(미가입) | 둘다 | signAppIds 에 bznav-sena 없음 | `/my` 또는 로그인 직후 | `/signup/terms` replace (app 이면 dupKey 있을 때 `/duplicate-account?dupKey=`) | 수동 | P2 | `AuthGuard.tsx:20-24` |
| SN-011 | 흐름 | (인수인계) 게스트 홈 질문 → 스트리밍 답변 | logout | mobile | — | textarea "세나에게 질문해보세요" 에 "부가세 신고 기간이 언제인가요?" → Enter | `/chat` · 질문 말풍선 · 헤더 "질문을 읽고 있어요" → progress → "답변을 정리하고 있어요" → "세나의 답변" · 입력창 다시 켜짐 · API `GET /api/maintenance`, `POST /api/bznav/v2/chat/guest/completions`(`X-Device-Id`), `GET /api/bznav/v1/guest/chat/limit` | 씬 (networkidle 금지) | P0 | `use-submit-question.ts:32-45`, `use-chat-message.ts:470-476,570-580` |
| SN-012 | 흐름 | (인수인계) 로그인 질문 → 방 생성 | login | mobile | — | 홈에서 "간이과세자 기준 금액이 얼마인가요?" | meta roomUuid 로 `/chat/<uuid>` replace · 목록 임시 제목 → title 프레임 이름 · `POST /api/bznav/v2/chat/completions` {roomUuid:null} · ⚠ 방이 생긴다 | 씬 | P0 | `use-chat-message.ts:256-328,467` |
| SN-013 | 흐름 | 같은 방 이어 질문·입력 상태 | login | 둘다 | SN-012 방 | 공백만 → 실제 질문 → 답변 중 상태 | 공백이면 `aria-label="전송하기"` disabled · 답변 중 textarea disabled, placeholder "세나가 답변을 작성하고 있어요", 버튼 `aria-label="취소하기"` · URL 유지 · roomUuid=현재 방 | 씬 | P1 | `ChatTextarea.tsx:63-67,141-150,215`, `ChatSendButton.tsx:57-68` |
| SN-014 | 흐름 | 답변 정지 | login | 둘다 | 답변 중 | "취소하기" | 질문 아래 "취소됨" · `POST /api/bznav/v2/chat/streams/<requestUuid>/cancel`(keepalive) · 입력창 다시 켜짐 | 씬 | P1 | `use-chat-message.ts:589-614` |
| SN-015 | 흐름 | 게스트 일일 한도 → 로그인 유도 | logout | 둘다 | `guest/chat/limit` → `{remaining:0}` 흉내 (또는 SSE `rate_limit` 0) | `/chat` 질문 | 전송 안 됨 · 드로어 "로그인 후 질문을 이어가 보세요"/"가입만으로 스탠다드 플랜을 무료로 이용할 수 있어요" · "세나 로그인하기" → `/signin?return_url=%2Fchat` · 배너 "세나 로그인하고 질문 계속하기" + "로그인" | 응답 흉내 | P1 | `use-submit-question.ts:33-35`, `LoginPromptDrawer.tsx:43-77` |
| SN-016 | 에러 | SSE `error` 프레임 | 둘다 | 둘다 | completions 를 `meta` 뒤 `error` 로 흉내 | ① message="X", retryable=false ② message·retryable 없음 | ① "X", "다시 시도" 없음 ② "답변을 생성하지 못했어요. 다시 시도해 주세요." + "다시 시도" → 같은 질문 재전송 | 응답 흉내 | P0 | `use-chat-message.ts:263-268`, `chat-answer-error.ts:9-23` |
| SN-017 | 에러 | completions 5xx·본문 없음 | 둘다 | 둘다 | 500(본문 비움) | 질문 | 기본 문구 + "다시 시도" · 이벤트 `chat_answer-error` | 응답 흉내 | P1 | `use-chat-message.ts:389-394,494-495` |
| SN-018 | 에러 | meta 뒤 끊김 → 이어받기 | login | desktop | meta 만 보내고 종료 · `/streams/<uuid>/live` 404 · `/status` completed 또는 failed·cancelled | 질문 | `/live` 최대 2회 → `/status` 2.5초 간격 · completed → 답변 · failed/cancelled → 오류 · meta 없이 끊기면 바로 오류 | 응답 흉내 | P1 | `use-chat-stream-recovery.ts:13-22,81-118,193-245` |
| SN-019 | 에러 | 오프라인 | 둘다 | mobile | `setOffline` | ① 답변 중 오프라인 → 복구 ② 오프라인 전송 → 복구 | "인터넷 연결이 끊겼어요. 다시 연결되면 답변을 자동으로 불러올게요." → online 이어받기 · ② 3초 또는 online 시 같은 턴 재전송 | 씬 | P1 | `use-chat-message.ts:487-529,688-693` |
| SN-020 | 에러 | 느린 응답·새로고침 복구 | login | desktop | meta 뒤 `progress` 만 수십 초 | 대기 → F5 | progress 1초 주기 변경 · 입력창 disabled · F5 뒤 sessionStorage `sena:pending-stream` 으로 `/live` 재연결 · 탭 복귀 시 `/status` 1회 | 응답 흉내 | P1 | `chat-stream-storage.ts:5,18-43`, `use-chat-message.ts:617-683,699-708` |
| SN-021 | 흐름 | 마크다운 렌더(표·링크·코드·`~`) | 둘다 | 둘다 | 답변 흉내에 GFM 표·링크·`code`·코드블록·줄바꿈·"1월 1일~6월 30일" | 질문 | `.answer-mark-down` 표가 `div.table-container > div.table-wrap > table` · 모바일 가로 넘침 없음 · 단일 줄바꿈 `<br>` · `<del>` 없음 · `~` 사라짐(알려진 예외) | 응답 흉내 | P1 | `lib/utils/strings.ts:3-21` |
| SN-022 | 흐름 | 답변 부가 기능 | 둘다 | 둘다 | 완료 답변 | 복사 → "좋아요" → 다시 → "싫어요" → 관련 법령 칩 → "관련 질문들을 찾아봤어요" 항목 | 복사 → 체크 아이콘 · 좋아요 `PUT …/chat/answers/<uuid>/feedback`(게스트 `/chat/guest/answers/…`) + 토스트 "소중한 의견 감사해요." · 다시 → DELETE · 싫어요 → 사유 드로어 · 칩 → google 새 창 · 관련 질문 → 새 질문 | 씬 | P2 | `ChatItems.tsx:286-339,399-454,465-483` |
| SN-023 | 흐름 | (인수인계) 데스크톱 채팅 검색 | login | desktop | 채팅 기록 | "채팅 검색"(readonly) → '보험' → 결과 클릭 | `/search-chat` · "'보험'과(으)로 일치하는 검색 결과 N개" · `GET /api/bznav/v1/chats/search?keyword=보험&offset=0&limit=10` · 1글자면 "최근 채팅 목록" · 결과 → `/chat/<uuid>?qaHistoryId=` 스크롤 후 파라미터 제거 | 씬 | P0 | `Sidebar.tsx:186-191`, `SearchChatList.tsx:69-80,144-147` |
| SN-024 | 흐름 | (인수인계) 모바일 메뉴 채팅 검색 | login | mobile | — | `button[aria-label="app-menu"]` → `:not([readonly])` "채팅 검색" 에 '보험' / 'zzqq' | 이동 없이 메뉴 안 결과 N개 · 없음 "'zzqq'과(와) 일치하는 검색 결과가 없어요." + "새 채팅" · `close-menu` 로 닫으면 초기화 | 씬 | P0 | `MenuDrawer.tsx:28,86-90,136,155-157` |
| SN-025 | 흐름 | 채팅 고정·이름 바꾸기·삭제 | login | 둘다 | 테스트 방(SN-012) | 방 메뉴(`chat-more-actions` / 모바일 드로어) → "채팅 고정" / "이름 바꾸기" → "바꾸기" / "채팅 삭제" → "채팅을 삭제할까요?" | 고정 → "고정된 목록" · 11번째(POLICY_LIMIT_EXCEEDED) 토스트 "10개까지 고정할 수 있어요" · 같은·빈 이름이면 "바꾸기" disabled · 삭제 `DELETE /api/bznav/v1/chats/<uuid>` · ⚠ 삭제는 테스트 방만 | 씬 (삭제·한도는 응답 흉내) | P1 | `use-chat-actions.ts:20-160` |
| SN-026 | 에러 | 없는 방·남의 방 | login | 둘다 | — | `/chat/00000000-0000-0000-0000-000000000000` | 토스트 "채팅방을 찾을 수 없습니다" → `/chat` · 401 이면 `/chat` | 스모크 | P1 | `use-chat-room-content.ts:92-106,127-131` |
| SN-027 | 흐름 | 임시 채팅 | login | 둘다 | 새 채팅 | `aria-label="secure-chat"`(툴팁 "임시 채팅") → 질문 | `/chat?secure-chat=true` · "마음 편히 질문할 수 있는\n임시 채팅으로 전환했어요" · `POST /api/bznav/v2/chat/secret/completions` · URL·목록 변화 없음 | 씬 | P2 | `HeaderItems.tsx:43,167-181`, `ChatContent.tsx:252-271` |
| SN-028 | 흐름 | 답변 완료 알림(다른 방 이동) | login | 둘다 | 방 2개 | 방 A 긴 질문 → 방 B 이동 → 완료 → 배너 클릭 | 배너 "답변이 완료됐어요" · 목록 A 안읽음 뱃지 · 모바일 ☰ 빨간 점(dev 만) · 배너 → 방 A, 뱃지 사라짐 · `POST /streams/<uuid>/ack` | 씬 | P1 | `use-answer-notification.ts:52-95` |
| SN-029 | 흐름 | 웹 푸시 CTA | login | desktop | 데스크톱 UA, push enabled, 권한 default·denied | 질문 → 1.5초 뒤 CTA → "나중에" / "알림 켜기" | "답변 완료 알림 받기" · 나중에 → 숨김·유예 · 알림 켜기 → 권한 → `GET …/push/vapid-public-key`, `POST …/push/subscriptions` · denied 안내 · 실패 "알림을 켜지 못했어요. 잠시 후 다시 시도해주세요" | 사람 단계(권한) | P2 | `use-push-permission-cta.ts:26-156` |
| SN-030 | 흐름 | 콘텐츠 상세 | 둘다 | 둘다 | — | `/contents/1658484` 스크롤 → 관련 질문 | title=질문 · canonical `https://ai.bznav.com/contents/1658484` · "관련 질문들을 찾아봤어요" · "이런 질문은 궁금하지 않으세요?" + "더보기"(→`/`) · footer 지나면 sticky 입력창 · 관련 질문 → `/chat` 새 질문(게스트 한도 0 이면 로그인 드로어) | 씬 | P1 | `contents/(conversion)/[id]/page.tsx:48-125`, `StickyChat.tsx:64-79` |
| SN-031 | 에러 | 잘못된·삭제된 콘텐츠 | logout | 둘다 | 삭제 ID 는 실제 ID 또는 BE 흉내(서버 fetch 라 브라우저 흉내 불가) | `/contents/abc`, `/contents/<삭제ID>`, `/content/<삭제ID>`, `/forgot-password` | `abc` → 404(dev 만, 운영은 SENA-744 미반영) · 삭제 ID → 404 + `X-Robots-Tag: noindex, nofollow` + gone(사이드바 없음) · `/forgot-password` 404(알려진 예외) | 스모크 / 수동 | P1 | `proxy.ts:23-79,82-98` |
| SN-032 | 에러 | 시스템 점검 | 둘다 | 둘다 | ① proxy Firebase(서버 fetch) ② `/api/maintenance` → `{status:true}` | ① level=service 아무 경로 · level=chat `/chat` · `?zent=admin` ② 홈 질문 | ① 302 → `/system-maintenance`, 설정 title/description 또는 "시스템을 점검하고 있어요" · chat 레벨은 `/chat*` 만 · admin 통과 ② 스트림 제거 후 `/system-maintenance` push | ① 수동 ② 응답 흉내 | P1 | `proxy.ts:105-127`, `use-chat-message.ts:570-578` |
| SN-033 | 흐름 | (인수인계) 이메일 로그인·검증 | logout | desktop | dev/loc · 계정은 사람이 입력(D16) | "이메일로 로그인" → "이메일 주소"/"비밀번호" → "로그인" · 틀린 비밀번호 · 형식 오류 | 성공 `/` 착지 · `/my` 유지 · 실패 "로그인을 실패했어요"/"입력하신 이메일 주소와 비밀번호가 일치하지 않아요." · blur "올바른 이메일 주소를 입력해주세요."·"비밀번호는 6자 이상 입력해주세요." · 형식 틀리면 "로그인" disabled | 사람 단계 (검증 문구는 씬) | P0 | `SignItems.tsx:40-103,149`, `user-sign/src/utils.ts:19-45` |
| SN-034 | 흐름 | 회원가입 입력 | logout | 둘다 | — | `/signup/input` → "이메일로 가입하기" · 가입된 이메일 | 유효 전 disabled · 가입된 이메일 "사용할 수 없는 이메일 입니다." + "이미 가입된 이메일이에요" · 정상 → `/signup/terms?state=<암호문>`(계정 생성 전) | 씬 | P1 | `SignUpInput.tsx:17-49,64-105` |
| SN-035 | 흐름 | (인수인계) 약관 동의 | logout | 둘다 | state·code 없이 | "약관에 모두 동의" → "동의 완료" · › | 미동의 "약관에 동의해주세요"(disabled) → "동의 완료" · state·code 없으면 "회원가입에 필요한 필수 정보가 없습니다.\n다시 시도해주세요."(가입 안 됨) · › 약관 드로어 · ⚠ `?state=` 있거나 로그인·미가입이면 실제 가입 | 씬 | P1 | `SignTerms.tsx:55-143` |
| SN-036 | 흐름 | 본인인증 요청·결과 | login | 둘다 | — | `/ci-request` 체크 → "휴대폰 본인인증 하기"(NICE 는 사람) · `?state=success` · `?state=failure&error_code=ci_mismatch` | 체크 전 disabled · success "인증이 안전하게 완료됐어요" + "다음" · failure "본인인증 정보가 일치하지 않아요" → `/ci-request` · state 없으면 스피너 | 사람 단계 / 응답 흉내(쿼리) | P1 | `CICollectionRequest.tsx:34-70`, `CIAuthentication.tsx:55-153` |
| SN-037 | 흐름 | 중복 계정 | logout | 둘다 | getDuplicateUser 흉내 | `/duplicate-account` · `?dupKey=X` · 나가기 | 없으면 빈 화면 · 있으면 "비즈넵 통합 계정에 가입되어 있어요\n기존 계정으로 로그인해주세요" + "기존 계정으로 로그인" · 나가기 → `/signin`(app 은 `/about`) | 응답 흉내 | P2 | `DuplicateAccountContent.tsx:30-48,60-90` |
| SN-038 | 흐름 | 내 정보·약관·로그아웃 드로어(취소만) | login | 둘다 | — | `/my` → "알림" → 뒤로 → "약관 및 정책" → 뒤로 → "로그아웃" → "아니요" | "내 정보"(이메일·로그인 방법·이름·휴대폰·가입 일자) · `GET /api/bznav/v1/users/me/profile` · `/policies` 링크 4개 · "아래 계정을 로그아웃할까요?" → "아니요" · ⚠ "로그아웃" 은 누르지 않음 | 씬 | P1 | `MyPageContent.tsx:59-155`, `LogoutDrawer.tsx:28-70` |
| SN-039 | 흐름 | 알림 설정 토글 | login | 둘다 | SSO `/update/user/terms` 흉내 권장 | `/notification` "혜택·이벤트 정보 알림" 스위치 · 하위 항목 | 성공 "yy년 M월 d일, …에 동의했어요."/"… 동의를 철회했어요." · 실패 "알림 설정 변경에 실패했어요." + 원상복구 · 하위 항목 → 약관 모달 | 응답 흉내 | P2 | `NotificationPageContent.tsx:22-29,60-153` |
| SN-040 | 흐름 | 온보딩 설문(제출 안 함) | login | 둘다 | 설문 미완료 | "설정 시작하기" → 선택 → "다음" … ("설정 완료하기" 누르지 않음) · `?step=industry` 직접 · 나가기 | "<이름>님께 딱 맞는\n세나를 설정해 드릴게요" · 선택해야 "다음" · 초과 "최대 N개까지 선택 가능해요." · 직접 step → intro · 나가기 `/` · 제출 `POST /api/bznav/v1/surveys/onboarding/response` | 씬 (제출은 응답 흉내) | P2 | `user-type-survey/page.tsx:47-135` |
| SN-041 | 가드 | SurveyGuard 자동 이동 | login | 둘다 | 가입 24시간↑ + 미완료 + localStorage `SURVEY_VISITED_KEY` 없음 | `/` → 나가기 → `/` | 첫 진입 → `/user-type-survey` · 한 번 본 뒤엔 안 보냄 | 응답 흉내 | P2 | `SurveyGuard.tsx:26-43` |
| SN-042 | 흐름 | 탈퇴(제출 안 함) | verified | 둘다 | — | `/withdraw` 사유 → "제출하고 계속" → 다이얼로그 "취소" · `/withdraw/confirm`(code 없음) → "비즈넵 세나 탈퇴하기" | "탈퇴하면 세나와의 채팅 기록들이 모두 삭제돼요." · `GET …/withdraw/reasons` · "탈퇴 전 본인인증이 필요해요" 에서 취소 · confirm 은 "비정상적인 접근이에요" 후 back(탈퇴 API 안 부름) · ⚠ "인증하기"·code 있는 confirm 금지 | 씬 (이후 수동) | P1 | `WithdrawPageContent.tsx:54-103`, `WithdrawContent.tsx:30-40` |
| SN-043 | 반응형 | 폭 경계 헤더·사이드바 | 둘다 | 둘다 | — | 360·390·743·744·1023·1024·1280 에서 `/`, `/chat`, `/contents/1658484` | ≤743 사이드바 없음, 비로그인 "시작하기" + ☰ · ≥744 사이드바(`사이드바 열기`), "무료로 회원가입"(≤360 숨김) + "로그인" · gone 사이드바 없음 · 가로 넘침 0 | 스모크 | P1 | `mediaQuery.ts:1-5`, `HeaderItems.tsx:68-121,223-241` |
| SN-044 | 반응형 | 질문 말풍선 복사 | 둘다 | 둘다 | 질문 있음 | 모바일 길게 누름 → "복사"/"텍스트 선택" · 데스크톱 hover → `복사` | "복사되었어요." · 바깥 탭 해제 · 체크 아이콘 | 씬 | P2 | `ChatItems.tsx:64-137,205-253` |
| SN-045 | 흐름 | 제휴사 모드(kbank·joins-hr) | logout | mobile | `?working_platform=kbank` | `/` → 질문 | 로그인·가입·메뉴 없음 · "이용 안내" · 광고 없음 · `POST /api/partner/v2/chat/completions` · 게스트 한도 건너뜀 | 씬 | P2 | `platform/src/utils/middleware.ts:22-41`, `HeaderItems.tsx:124-164` |

## 되돌릴 수 없는 동작 · 응답 흉내
- **누르지 않는다**: 로그아웃 · 탈퇴("인증하기" 이후, code 있는 confirm) · `/signup/terms` 에 state·code 있을 때·로그인 미가입 상태 "동의 완료" · 설문 "설정 완료하기" · 휴대폰번호 변경 · 알림 동의 토글(이력 남음) · 웹 푸시 구독(DELETE 로 되돌림) · 채팅방 삭제(테스트 방만) · 로그인 질문(방이 생기고 일일 사용량 감소)
- **응답 흉내**(`page.route`, 본문 `data: {...}<ENDLINE>`): `POST /api/bznav/v2/chat/{completions|guest/completions|secret/completions}` — error 프레임(retryable true/false/없음) · 본문 없음·5xx · meta 만 · progress 만(느림) · `rate_limit` 0 · 마크다운 픽스처 / `…/streams/<uuid>/{live|status|cancel}` — live 404 · status completed/failed/cancelled/blocked / `GET …/guest/chat/limit` → `{remaining:0}` / `GET /api/maintenance` → `{status:true}` / `PATCH …/chats/<uuid>` → POLICY_LIMIT_EXCEEDED / `GET …/chats/<uuid>/messages` → ENTITY_NOT_FOUND·401 / SSO `/update/user/terms`·`/marketing/terms` / duplicate user / 쿠키 `BZNAV_SIGN_REQUIRED_STEP.<ZENV>`·`BZNAV_WORKING_PLATFORM.bznav-sena`
- **브라우저에서 못 가로챔**: proxy 의 Firebase 점검 설정·콘텐츠 존재 확인(`/api/bznav/v1/contents/:id`, 1.5초 제한) — 서버 fetch. 환경 설정·실제 삭제 ID 필요

## 에러·예외 요약
| 경우 | 동작 | 근거 |
|---|---|---|
| 점검 켜짐 | `level:'service'` 전체 · `'chat'` 은 `/chat*` 만 302 → `/system-maintenance` · `?zent=admin`·쿠키 `MAINTENANCE_BYPASS_QUERY=admin` 통과 | `proxy.ts:105-127` |
| 점검 꺼짐 | `/system-maintenance` → `/` | `proxy.ts:124-125` |
| 질문 직전 점검 확인 | `/api/maintenance` true → push | `use-chat-message.ts:570-578` |
| 콘텐츠 삭제(BE 404/410 또는 "해당 데이터를 찾을 수 없습니다.") | gone rewrite · 404 + noindex | `proxy.ts:23-98` |
| 콘텐츠 비정수 ID | `notFound()`(dev 만) | `page.tsx:24-28` |
| 콘텐츠 BE 오류(404 아님) | throw → `GlobalErrorBoundary` "에러가 발생했어요"(추측) | `page.tsx:40-43` |
| 인증 오류 코드(`INVALID_TOKEN`·`MISSING_USER_ID`·`USER_LOAD_ERROR`·`AUTH_REQUIRED`) | 푸시 해제 → 로그아웃 → `/signin` | `auth-error-handler.ts:1`, `SenaAppContent.tsx:123-128` |
| 로그인 `?error_code=` | `kakao_email_required`·`under_age_signup`·`sign_failed` 다이얼로그 | `SignInContent.tsx:41-121` |

## 확인 못 한 것·추측
- 조사는 로컬 `dev`(`4b382c733`), knowledge 는 운영(`714b344`), 인수인계 QA 는 `feature/zent-pkg-sena` — 돌릴 브랜치에 SENA-744·안읽음 뱃지가 있는지 먼저 확인
- "확인하고 있어요"(인수인계의 긴 답변 판정 문구)는 앱 코드에 없다 — 서버 progress 문구로 보임(추측)
- 게스트 completions 가 roomUuid 를 안 줘 `/chat` 에 머무는지는 주석(`use-chat-message.ts:318`)으로만 확인
- 요금제·결제 화면은 없다(`GET /api/bznav/v1/users/me/plan` 만). 회원 한도 초과는 서버 error 프레임일 것(추측)
- 삭제된 콘텐츠의 실제 ID 샘플 없음
- iOS 앱 웹뷰 AI 동의 드로어·앱 네이티브 알림·강제 업데이트는 웹 QA 범위 밖
- `/ci-authentication?state=success` 를 쿼리만으로 열면 `resetRequiredAuthStep`·`getUser`·약관 갱신이 돌 수 있다(`CIAuthentication.tsx:103-111`) — 테스트 계정에서만
- 비밀번호 칸이 `type="text"` + masked(`SignItems.tsx:166-167`)인데 `input[type="password"]` 로 찾아도 됐다 — 내부에서 바꾸는 것으로 보임(추측)
- `DislikeFeedbackDrawer` 사유 문구·`ChatRoomActionsMenu` 모바일 진입·Shift+Enter 는 읽지 않음

## scripts/qa 로 옮길 때
- `routes/sena-web.json`: devPort 3300 · 서버는 `next start`(빌드, next dev postcss 폭주 이력) · profiles logout·login(·verified) · samples `/chat/[[...chatId]]`·`/contents/[id]` · ignore `/forgot-password` 404(`message.location().url`)
- 러너에 필요한 것: App Router 화면 목록 · SSE 응답 흉내(`<ENDLINE>` 프레임) · 답변 완료 대기 단계 · 오프라인 단계 · 쿠키 주입 단계 · 가로 넘침·무한 스크롤 검사 · 새 탭 URL 확인
