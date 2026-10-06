# refund-web QA TC — 비즈넵 환급 사용자 웹

> 2026-10-02 · 조사 기준 로컬 작업 트리(브랜치가 prd-refund 인지는 확인 안 함) · **Pages Router** · 경로는 `repos/bznav-web/apps/refund-web/` 기준, 패키지는 `pkg:` = `repos/bznav-web/packages/`
> 지금 돌아가는 설정: `scripts/qa/routes/refund-web.json` · 흐름 씬 `scripts/qa/scenarios/refund-web/01~05`
> 묶음 안내·자동화 방식 뜻: [README.md](README.md)

## 먼저 알아둘 것
1. **본인인증 가드는 로그인 가드 안에** — `AuthGuard` 가 항상 `<CiGuard/>` 를 함께 렌더(`pkg:user-session/src/components/AuthGuard.tsx:28-33`). 쿠키 `BZNAV_SIGN_REQUIRED_STEP.<ZENV>.ciAuthentication` 이 true 일 때만 `/auth/ci-request?return_url=<현재경로+쿼리>`(`:52-60`) · `/auth/ci-request`·`/auth/ci-authentication` 에서는 건너뜀 · 토스 계열은 `isUseCI=!isTossPlatform` 이라 안 걸림(`components/layout/RefundAppContents.tsx:44`)
2. **로그아웃이면 바로 sign-in 이 아니다** — AuthGuard → `/auth/sign-out` → `working_platform` 이 web/app 일 때만 `/auth/sign-in` 으로 replace(`pages/auth/sign-out/index.tsx:27-31`). 다른 플랫폼은 "비즈넵 환급 로그인 인증이\n만료되었어요" 화면에 머문다
3. 로그인했지만 `signAppIds` 에 refund 가 없으면 `/auth/sign-up/terms`(`AuthGuard.tsx:20-23`)
4. ⚠ **GraphQL 엔드포인트가 하나**(`POST NEXT_PUBLIC_GQL_API_SERVER`, body `{query, variables}`, operationName 없음 — `lib/relay/use-fetch-relay-factory.ts:55-80`). 지금 씬 `mock` 은 URL·method 만이라 **GraphQL 연산별 응답 흉내는 아직 안 된다** → body 의 `query` 문자열(예: `mutation applyRefundMutation`)로 고르는 옵션 필요. REST(`/ci/v2/prepare`·`/signin/v2`·`/withdraw`)는 지금도 된다
5. **시간 분기** — 0~6시 조회 불가 · 재수집 알림톡 9시 전 불가(`lib/utils/check-times.ts:8-12`) · 23:50~00:30 은행망 안내. 시계 조작 단계(`page.clock`)가 필요
6. **점검(service-down)은 서버 미들웨어** — `proxy.ts` 가 edge-config `refund/management.json` 을 읽어 redirect(`proxy.ts:21,34-55`). 브라우저 흉내로 재현 불가 · 우회 `?zent=admin` · 점검이 꺼져 있으면 `/service-down` → `/home`

## A) 화면 (● 있음 / – 없음 · 본인인증 ● = AuthGuard 안 CiGuard)

| 라우트 | 그룹 | 로그인 | 본인인증 | 동적 샘플 | 단계형 | 근거 |
|---|---|---|---|---|---|---|
| `/` → rewrite `/home/landing` | 랜딩 | – | – | `?utm_source=imbank\|kbcardevent\|kakaopay` | – | pages/home/landing/index.tsx, next.config.mjs:55 |
| `/home/[...content]` | 랜딩(어드민) | – | – | `/home/event/refundbada`(sitemap 정적) · `/home/capital-gain` · depth>3 이면 404 | – | lib/content-page/path.ts:11-18 |
| `/landing/[...slug]`, `/event/[...slug]` | 랜딩·이벤트(어드민) | – | – | 코드에 없음 → `/sitemap.xml`(BE 목록)에서 | – | pages/landing·event |
| `/home` | 환급 홈 | ● | ● | – | – | pages/home/index.tsx:73-79 |
| `/home/reviews` · `/home/event/share` · `/home/event/share/terms/privacy` | 랜딩·이벤트 | – | – | – | – | pages/home/* |
| `/home/event/share/redirect` | 이벤트 | – | – | `?invite_code=X&promotion_code=INVITATION_NAVER_PAY_POINT` | 즉시 `/` | share/redirect/index.tsx:13-19 |
| `/redirect` | 진입 허브 | – | – | `?ext_id=…` → `/auth/sign-in` | 로그인 직후 | pages/redirect.tsx:116-143 |
| `/auth/{sign-in,sign-out,sign-up/input,sign-up/terms,forgot-password}` | 회원 | – | – | – | 가입 진행 | pages/auth/* |
| `/auth/reset-password` | 회원 | – | – | `?code=`(메일) — 없으면 안내 | ● | ManagePassword.tsx:144 |
| `/auth/ci-request` | 본인인증 | ● | (건너뜀) | `?return_url=` | – | ci-request/index.tsx:56 |
| `/auth/ci-authentication` | 본인인증 | – | (건너뜀) | `?state=success&request_type=ci_collection` | ● 인증사 복귀 | CIAuthentication.tsx:130-140 |
| `/auth/withdraw/reason` · `/auth/withdraw/confirm` | 탈퇴 | ● | ● | confirm `?verification_code=` | ● sessionStorage `withdraw-reason` | WithdrawContent.tsx:29-42 |
| `/hometax-auth/select-method` | 홈택스 인증 | ● | ● | `?type=indis\|corps\|decision` — 없거나 틀리면 404 | – | select-method/index.tsx:41-50 |
| `/hometax-auth/simple-auth/input` | 홈택스 인증 | ● | ● | `?from=home\|lookup\|decision\|alimtalk…` — 틀리면 "페이지에 접근할 수 없어요" | – | simple-auth/input/index.tsx:27,48-69 |
| `/hometax-auth/simple-auth/{confirm,confirm-auto}` | 홈택스 인증 | ● | ● | – | ● 입력 credential | SimpleAuthConfirmContainer.tsx |
| `/hometax-auth/id-auth` | 홈택스(법인) | ● | ● | – | – | id-auth/index.tsx |
| `/hometax-auth/joint-certificate/{install,select}` | 공동인증서 | ● | ● | `?type=indis\|corps\|decision\|result` — 없으면 404 | ● 로컬 프로그램 `https://127.0.0.1:16566` | joint-certificate.ts:3-7 |
| `/tax/refund/lookup/request` | 조회 | ● | ● | `?type=indis\|corps` | ● refundToken | lookup/request/index.tsx:98-104 |
| `/tax/refund/lookup/queue` | 조회 | ● | ● | `?type=` | – (⚠ **열기만 해도 알림 신청 뮤테이션**) | QueueContent.tsx:33-74 |
| `/tax/refund/lookup/result` | 조회 결과 | ● | ● | `?type=` — 없으면 Spinner | ● sessionStorage 조회 데이터 | lookup/result/index.tsx |
| `/tax/refund/{lookup,apply}/reenactment` | 재현 | – | – | `?snapshot_code=` | ● | */reenactment |
| `/tax/refund/bank-account` | 신청 | ● | ● | `?mode=update&type=indis` · 기본 apply | ● 조회 데이터 | BankAccountContext.tsx:23-36 |
| `/tax/refund/phone-number` | 신청 | ● | ● | – | ● 계좌 뒤 | pages/tax/refund/phone-number |
| `/tax/refund/payment-card{,/input}` | 신청·내 정보 | **–**(가드 없음) | – | `?fromLookup=true` | ● | pages/tax/refund/payment-card/* |
| `/tax/refund/apply/{complete,result}` | 신청 | ● | ● | `?type=indis\|corps\|*tritx*` | complete 는 신청 뒤 | apply/result/index.tsx:69-75 |
| `/tax/refund/cancel/{prevention,reason}` | 취소 | ● | ● | `?type=` | ● cancelData atom | ApplyResultApplyCompleteCheckContent.tsx:86-95 |
| `/tax/refund/test` | 개발용 링크 | – | – | – | – | pages/tax/refund/test |
| `/trp` · `/trp/{cancel,success}` | 결제 링크 | – | – | `?token=`(없으면 `/404`) · success 는 PG POST | ● | pages/trp/* |
| `/trr` | 알림톡 진입 | ●(로그아웃이면 `/error/unauthorized`) | ● | `?code=&actionCode=&type=recollect\|checkDecision\|job_retention` | – | pages/trr/index.tsx:24-40 |
| `/simple/[corpType]/apply` | 간편신청 | ●(로그아웃이면 `/simple/timeout`) | ● | `indis`·`corps` | ● 알림톡 code | simple/[corpType]/apply/index.tsx:28-48 |
| `/simple/[corpType]/apply/success`, `/simple/timeout` | 간편신청 | – | – | `/simple/indis/apply/success` | – | 같은 폴더 |
| `/follow-up/{request,result/*,personal-deduction/collect}` | 사후관리 | ● | ● | `?source=service\|message&task=` | ● 인증 뒤 | use-follow-up-request.ts |
| `/follow-up/personal-deduction` | 사후관리 | – | – | `?from=` | – | 같은 폴더 |
| `/survey/{start,intro,home}`, `/survey/business/*`(12), `/survey/employment/*` | 설문 | ●(SurveyProvider) | ● | employment form `?id=` | ● refundHistoryId·현재 사업장 | SurveyProvider.tsx:24-31 |
| `/survey/{completed,expired}` | 설문 | – | – | – | – | pages/survey/* |
| `/survey/reopen{,/[questionCode],/complete}` | 설문 재개 | ● | ● | `/survey/reopen/INDUSTRY` | ● | ReopenSurveyContent.tsx:29 |
| `/menu`, `/menu/my`, `/menu/my/notification` | 회원 메뉴 | ● | ● | my `?state=after_ci&request_type=user_update&ci_result=success\|failure` | – | MyPageContent.tsx:121-131 |
| `/menu/my/password` | 회원 메뉴 | **–**(UI 진입 링크 못 찾음) | – | – | ● 2단계 | pages/menu/my/password |
| `/menu/refund-history` | 회원 메뉴 | **–**(토큰 없으면 빈 화면) | – | – | – | RefundItemFetchGuard.tsx |
| `/menu/terms`, `/help`, `/help/faq` | 메뉴·도움말 | – | – | – | – | pages/* |
| `/help/guide/[slug]` | 도움말 | – | – | `tax-refund-check`·`business-tax-refund`·`correction-claim`·`income-tax-refund` | – | lib/constants/refund-guide.ts:36-134 |
| `/help/deposit-method` | 도움말 | ● | ● | – | – | pages/help/deposit-method |
| `/error/{unauthorized,network,unexpected}` · `/error/hometax/{no-bman,equal-tin,unavailable-time,overload-control}` · `/error/payment/*` | 에러 | – | – | network `?return_url=` · `?request-type=` | – | pages/error/* |
| `/error/temporary` · `/error/hometax/{timeout,session,server-fix,etc}` | 에러 | ● | ● | `?business-type=indis\|corps` | – | pages/error/* |
| `/service-down` | 점검 | – | – | 점검 꺼지면 `/home` | – | proxy.ts:50 |
| `/404`, `/_error` | 공통 | – | – | – | – | pages/404.tsx |

## B) TC

자동화: 스모크 = URL 직접 · 씬 = 흐름 씬 · 응답 흉내 = mock · 사람 단계 · 수동. "(GQL)" 은 러너 확장(연산 이름으로 고르기) 뒤에 된다.

| ID | 분류 | 제목 | 세션 | 뷰포트 | 사전 조건 | 단계 | 기대 결과 | 자동화 | 우선 | 근거 |
|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | 스모크 | 공개 그룹 (랜딩·help·guide 4종·faq·reviews·share·terms·survey completed/expired·simple timeout/success·404) | logout | 둘다 | – | 화면 표 "로그인 –" 화면 차례로 | 200 · 콘솔 에러 0 · 로그인으로 안 감 | 스모크 | P1 | 화면 표 |
| RF-002 | 스모크 | 로그인 그룹 (/home·/menu·/menu/my·notification·deposit-method·survey/reopen·select-method?type=indis\|corps·simple-auth/input?from=home) | verified | 둘다 | verified 세션 | 그대로 열기 | 그 화면에 머묾(`stay`) | 스모크 | P0 | routes profiles |
| RF-003 | 스모크 | 에러 화면 그룹 | verified | mobile | – | `/error/*` 15개 `?business-type=indis` | 각 제목(no-bman "신고 내역이 없어\n환급액을 조회할 수 없어요", server-fix "현재 홈택스 점검으로…") | 스모크 | P1 | error-view/* |
| RF-004 | 스모크 | 어드민 콘텐츠 catch-all | logout | 둘다 | 살아 있는 slug | `/home/event/refundbada`, `/event/a/b/c` | 콘텐츠 렌더 / 404 "404\n페이지를 찾을 수 없습니다" | 스모크 | P1 | content-page/path.ts:14-18 |
| RF-005 | 가드 | 로그아웃 → 로그인 | logout | mobile | – | `/home` | `/auth/sign-out` 거쳐 `/auth/sign-in` | 씬 (**있음 01**) | P0 | AuthGuard.tsx:18-19 |
| RF-006 | 가드 | 본인인증 전 → ci-request, return_url 유지 | login | mobile | CI 필요 쿠키 | `/tax/refund/lookup/result?type=indis` | `/auth/ci-request?return_url=%2Ftax%2Frefund%2Flookup%2Fresult%3Ftype%3Dindis` · "휴대폰 본인인증을 진행해주세요" | 씬 (**02 확장**) | P0 | AuthGuard.tsx:52-60 |
| RF-007 | 가드 | 알림톡 진입 로그아웃 | logout | mobile | – | `/trr?code=x` → "로그인" | `/error/unauthorized` "서비스 이용을 위해\n로그인을 해주세요" | 씬 | P1 | trr/index.tsx:24 |
| RF-008 | 가드 | 간편신청 로그아웃 → 만료 | logout | mobile | – | `/simple/indis/apply` | `/simple/timeout` "동의 가능한\n유효 시간이 지났어요" | 씬 | P1 | simple/[corpType]/apply/index.tsx:30 |
| RF-009 | 가드 | 쿼리 검증 → 404·접근 불가 | verified | mobile | – | select-method(type 없음) · install?type=x · simple-auth/input?from=zzz · `/trp`(token 없음) | 404 · 404 · "페이지에 접근할 수 없어요" + "뒤로가기" · `/404` | 스모크 | P1 | select-method:44, install:33 |
| RF-010 | 가드 | 다른 앱만 가입한 계정 → 약관 | 다른 앱 계정 | mobile | refund 미가입 통합 계정 | `/home` | `/auth/sign-up/terms` "서비스를 이용하기 전에\n약관에 먼저 동의해주세요" | 수동 (계정) | P2 | AuthGuard.tsx:20-23 |
| RF-011 | 흐름 | 본인인증 성공 복귀 | login | mobile | – | 씬 03 | `/auth/ci-authentication` "인증이 안전하게 완료됐어요" → "다음" | 응답 흉내 (**있음 03**) | P0 | CIAuthentication.tsx:151-156 |
| RF-012 | 에러 | 본인인증 준비 실패 | login | mobile | – | 씬 04 | "본인인증 요청을 실패했어요" · 머묾 | 응답 흉내 (**있음 04**) | P1 | use-prepare-ci-auth-data.ts:27-46 |
| RF-013 | 흐름 | 실제 본인인증 | login | desktop | headed | 씬 05 | ci-authentication 복귀 | 사람 단계 (**있음 05**) | P1 | scenarios/05 |
| RF-014 | 흐름 | 랜딩 CTA 분기 | logout / verified | 둘다 | – | `/` "내 환급금 무료조회" | logout `/auth/sign-in` · verified `/home` · 대기 모달이면 대기 후 | 씬 | P0 | LandingCtaButton.tsx:38,58-73,87 |
| RF-015 | 흐름 | 파트너 UTM 첫 이미지 | logout | mobile | – | `/?utm_source=imbank`(kakaopay·kbcardevent·대문자 IMBANK) · `/?utm_source=naver` | 첫 섹션 img `main-introduce-imbank.png`(SSR) · 기본 `main-introduce.png` | 스모크 (DOM) | P1 | use-partner-main-image.ts:11,22-30,68-75 |
| RF-016 | 흐름 | 파트너 할인 툴팁 | logout | mobile | `benefitRefundPartnerQuery` 흉내 | `/?utm_campaign=x` | "… 고객님은 제휴 할인 N% 혜택까지!" | 응답 흉내 (GQL) | P2 | LandingCtaButton.tsx:95-112 |
| RF-017 | 에러 | 이메일 로그인 실패 | logout | mobile | `**/signin/v2` 실패 흉내 | "이메일로 로그인" → 입력 → "로그인" | "로그인을 실패했어요" | 응답 흉내 (REST) | P1 | SignItems.tsx:60,96-98,149 |
| RF-018 | 흐름 | 파트너 진입 ext_id | logout | mobile | – | `/redirect?ext_id=abc` | sessionStorage `B_PARTNER_EXTERNAL_ID=abc` · `/auth/sign-in` | 씬 | P2 | redirect.tsx:138-143 |
| RF-019 | 흐름 | 홈 개인 "환급조회" → 간편인증 | verified | mobile | 조회 이력 없음 | `checkSearchStatusQuery` 흉내 → "환급조회"(개인·개인사업자) | 비 Windows `/hometax-auth/simple-auth/input?from=home` · Windows UA `select-method?from=home&type=indis` | 응답 흉내 (있음 07) | P0 | RefundHomeContent.tsx:64-87,244-251 |
| RF-020 | 흐름 | 홈 법인 → 홈택스 아이디 | verified | desktop | – | "환급조회"(법인사업자) → "30초 만에 조회하기" | `select-method?type=corps` → `/hometax-auth/id-auth` | 씬 | P1 | SelectHometaxIdOrJointCert.tsx:22-31 |
| RF-021 | 흐름 | 진행 중·완료 조회 있음 | verified | mobile | – | `checkSearchStatusQuery` progress '100' / '40' → "환급조회" | '100' "조회 완료된 내역이 있어 먼저 불러올게요…" 6초 뒤 reload · 그 외 "환급 조회 중인 내역이 있어요…" 후 인증 | 응답 흉내 (GQL) | P2 | RefundHomeContent.tsx:128-146 |
| RF-022 | 에러 | 0~6시 조회 시도 | verified | mobile | 시계 02:00 | "환급조회" | `/error/hometax/unavailable-time?business-type=indis&nav-left-button=back&lookup-type=lookup_first` · ⚠ `reserveHometaxMaintenanceExitAlimtalkMutation` 이 나감 → 흉내 필수 | 응답 흉내 + 시계 | P1 | RefundHomeContent.tsx:117-127 |
| RF-023 | 흐름 | 간편인증 입력 → 확인 | verified | mobile | `simpleAuthRequestTokenMutation` 흉내 | 이름·휴대폰·생년월일, "네이버" → "다음" | `/hometax-auth/simple-auth/confirm` (카카오 + from=home 은 `confirm-auto`) | 응답 흉내 (GQL) | P0 | SimpleAuthInputContainer.tsx:40-41,121-227 |
| RF-024 | 에러 | 간편인증 요청 서버 오류 | verified | mobile | `hometaxSimpleAuth.errors.message` 흉내 | "다음" | 그 메시지 warning 토스트 · 머묾 | 응답 흉내 (GQL) | P2 | SimpleAuthInputContainer.tsx:199-204 |
| RF-025 | 흐름 | 실제 간편인증 → 조회 | verified | mobile | headed · 실제 홈택스 회원 | 앱 인증 → "인증 완료" | `/tax/refund/lookup/request?type=indis` · 미인증 "{카카오\|네이버}앱에서 인증을 완료해 주세요." | 사람 단계 | P0 | SimpleAuthConfirmContainer.tsx:140-156 |
| RF-026 | 흐름 | 조회 요청 → 결과 | verified | mobile | refundToken | `searchRefundV2Mutation` 성공 + `checkSearchStatusQuery` '100' 흉내 | `/tax/refund/lookup/result?type=indis` | 응답 흉내 (GQL) | P0 | LookupRefundRequestContent.tsx:308-345 |
| RF-027 | 에러 | 조회 오류코드 → 에러 화면 매핑 | verified | mobile | 같음 | `searchRefundV2.errors.code` = NO_BMAN / TIMEOUT / IMPOSSIBLE / SERVER_FIX / SESSION / ETC / COLLECT / 미정의(indis·corps) | no-bman / timeout / unavailable-time / server-fix / session / etc / temporary · 미정의 indis=temporary, corps=etc | 응답 흉내 (GQL) | P0 | lib/utils/url.ts:51-75 |
| RF-028 | 에러 | 대기열 켜짐 → queue | verified | mobile | `hometaxBlockSettingsQuery` 흉내(queueScreenEnabled, BEFORE_AUTH) | "환급조회" 또는 simple-auth/input | `/tax/refund/lookup/queue?type=indis` "홈택스 이용자가 많아\n환급 조회에 시간이 걸려요" · ⚠ `requestHometaxBlockNotificationMutation` 자동 → 흉내 | 응답 흉내 (GQL) | P1 | QueueContent.tsx:33-74 |
| RF-029 | 흐름 | 결과 → 동의 드로워 → 계좌 | verified | mobile | 환급 가능 데이터 | "N원 환급 신청" → "전체 동의" → "다음" | 카드 필요 `/tax/refund/payment-card?fromLookup=true` · 아니면 `/tax/refund/bank-account` (snapshotSaveMutation) | 사람 단계 / 응답 흉내 | P0 | ApplyPossibleContent.tsx:126-162 |
| RF-030 | 흐름 | 계좌 확인 분기 | verified | mobile | 앞 단계 | `checkBankAccountMutation` 흉내 → 은행·계좌 → "다음" → "네, 맞아요" | 휴대폰 없으면 `/tax/refund/phone-number` · 있으면 **곧바로 applyRefund(금지 → 흉내)** | 응답 흉내 (GQL) | P0 | CheckAccountNameDrawer.tsx:155-174,229-234 |
| RF-031 | 에러 | 없는 계좌 | verified | mobile | result false 흉내 | "다음" | "계좌를 다시 입력해 주세요" · 23:50~00:30 은행망 문구 | 응답 흉내 (GQL) | P2 | RefundBankAccountContent.tsx:92-99 |
| RF-032 | 흐름 | 휴대폰 → 신청 완료 | verified | mobile | 계좌 뒤 | `applyRefundMutation` 성공 흉내 → 휴대폰 → "확인" | `/tax/refund/apply/complete?type=indis` · ⚠ **실제 호출 금지** | 응답 흉내 (GQL) | P0 | PhoneNumberContent.tsx:37-90, use-both-apply-refund.ts:40-97 |
| RF-033 | 흐름 | 신청 취소 화면(제출 직전까지) | verified | mobile | 신청 완료(Review) 건 | "신청 취소" → "환급 취소하기" → 사유 → "환급 취소하기" | prevention "정말로 환급 신청을\n취소하시겠어요?" → reason · ⚠ 마지막 "환급 취소" 는 누르지 않음("아니요") · "환급 계속 진행하기" → "환급을 계속 진행할게요" | 씬 (cancelApply 흉내) | P1 | CancelReasonContent.tsx:109-111,147-177 |
| RF-034 | 흐름 | 설문 시작 분기 | verified | mobile | 설문 대상 또는 init 흉내 | `/survey/start` "답변 시작하기" | 근로자 있으면 `/survey/employment/special-relationships` · 끝난 사업장 있으면 `/survey/home` · 아니면 `/survey/intro` · "나가기" "나가시면 환급 일정이 늦어져요" | 응답 흉내 (GQL) / 수동 | P1 | StartSurveyContainer.tsx:26-41,64-82 |
| RF-035 | 에러 | 설문 대상 아님·완료·만료 | verified | mobile | – | init 실패 / `getSurveyStatus.errors.code` COMPLETED·EXPIRED·기타 | "설문 정보가 유효하지 않거나,\n설문의 대상자가 아닙니다." / `/survey/completed` / `/survey/expired` / "일시적인 오류가 발생했어요…" | 응답 흉내 (GQL) | P1 | SurveyProvider.tsx:47-60,98-118 |
| RF-036 | 흐름 | 설문 제출 (흉내만) | verified | mobile | 답변 완료 | `/survey/home` "제출하고 검토 요청하기" | 인적공제 필요면 `/follow-up/personal-deduction` · 아니면 `/survey/completed` · ⚠ 실제 제출 금지 | 응답 흉내 (GQL) | P2 | SurveyHomeContainer.tsx:67-103 |
| RF-037 | 흐름 | 설문 재개 | verified | mobile | 재개 대상 | `/survey/reopen` "시작하기" → 답 → "다음"/"제출하기" | `/survey/reopen/INDUSTRY` → … → complete · 문항 없으면 "문항 정보를 찾을 수 없어요"+"홈으로 이동" · ⚠ "다음" 마다 저장 | 응답 흉내 (GQL) | P2 | ReopenSurveyContent.tsx:29-52,141-172 |
| RF-038 | 흐름 | 회원 메뉴 → 내 정보 | login / verified | 둘다 | – | `/menu` "내 정보" | CI 필요 `/auth/ci-request?return_url=%2Fmenu%2Fmy` · 아니면 `/menu/my`(이메일·이름·가입 일자) | 씬 (있음 06) | P0 | MySection.tsx:32-46 |
| RF-039 | 흐름 | 알림 설정 토글 | verified | mobile | – | "혜택·이벤트 알림" → Switch | `marketingTermUpdateMutation` · ⚠ 수신 동의 → 흉내 또는 원복 | 응답 흉내 (GQL) | P2 | MyNotificationContent.tsx:24,44,61-65 |
| RF-040 | 흐름 | 비밀번호 변경 2단계 | verified(이메일) | mobile | – | 현재 → "다음" → 새·확인 → "다음" | `passwordCheckQuery` → `passwordUpdateMutation` → "비밀번호가 변경되었어요." → `/menu/my` · ⚠ 변경은 흉내 | 응답 흉내 (GQL) | P2 | NewPasswordForm.tsx:20-31 |
| RF-041 | 흐름 | 탈퇴 사유 화면(제출 안 함) | verified | mobile | 휴대폰 등록·canLeave | `/menu/my` "회원탈퇴" → 이유("기타" textarea) | `/auth/withdraw/reason` "비즈넵 환급을 탈퇴하려는\n이유가 궁금해요" · "의견 제출하기" 보임(⚠ 누르지 않음) · 휴대폰 없으면 "…먼저 등록해주세요" · canLeave false "탈퇴가 불가한 상태입니다." | 씬 | P1 | ReasonContent.tsx:21-71 |
| RF-042 | 흐름 | 친구초대 이벤트 | logout / verified | mobile | – | `/home/event/share` · `/home/event/share/redirect?invite_code=A&promotion_code=INVITATION_NAVER_PAY_POINT` | logout "로그인하고 초대하기" → `/auth/sign-in?return_url=/home/event/share` · verified "링크 공유하기"·"카카오톡 초대" · redirect 는 세션에 코드 저장 후 `/` | 씬 | P2 | InviteEventActionButtons.tsx:40,69-102 |
| RF-043 | 에러 | 결제 링크 분기 | logout | mobile | `paymentCardsLinkQuery` 흉내(ERR_EXPIRE_URL / 기타) | `/trp?token=t` · `POST /trp/success` `outStatCd=0031` | link-expired "결제 링크가 만료되었어요" / link-default "잘못된 접근입니다" · POST → 303 `/error/payment/fail` · ⚠ 성공 응답은 외부 PG 로 → 흉내만 | 응답 흉내 (GQL) + HTTP | P1 | TrpContent.tsx:22-37, trp/success/index.tsx:15-48 |
| RF-044 | 에러 | 알림톡 진입 예외 | verified | mobile | – | `/trr?type=bogus` · 시계 07:00 `?type=recollect` · hometaxBlockSettings(queueScreenEnabled) | "잘못된 접근입니다." → `/home` / "아침 9시 이후에\n다시 진행해주세요" / `/error/hometax/overload-control` | 응답 흉내 + 시계 | P1 | TrrEntryGuard.tsx:20-54 |
| RF-045 | 에러 | 점검·홈택스 점검 | logout / verified | 둘다 | dev edge-config 점검 ON | level=service `/home`·`/menu` · `/?zent=admin` · OFF `/service-down` · level=hometax `/home` "환급조회"·`/trr` | `/service-down`(쿼리 유지) · `/`·`/redirect` 허용 · bypass 통과 · OFF `/home` · hometax 레벨은 홈 점검 다이얼로그, /trr 은 service-down | 수동 (서버 설정) | P1 | proxy.ts:19-55 |

반응형: RF-001·002 가 두 뷰포트를 다 찍는다. 플랫폼별 헤더(webview close / 웹 back, `/home` 왼쪽 close·grayLogo)는 `working_platform` 쿼리로 바꿔 보는 TC 를 하나 더 둘 수 있다(값 목록 미확인).

## 누르면 안 되는 것
| 동작 | 트리거 | API | 대안 |
|---|---|---|---|
| 환급 신청 | 휴대폰 "확인" / 계좌 "네, 맞아요"(휴대폰 등록 계정) | applyRefundMutation · tritxApplyRefundMutation | GQL 흉내 |
| 간편신청(알림톡) | "환급 신청하기" → 확인 | checkTokenAndBankAccountMutation → simpleApplyMutation | 흉내 |
| 신청 취소 · 취소 철회 | "환급 취소" · StatusManualSection | cancelApplyMutation·cancelTritxApplyCancelMutation · revokeCancelMutation·tritxRevokeCancelMutation | 흉내 |
| 환급 계좌 변경 | `bank-account?mode=update` "네, 맞아요" | applyRefundChangeBankAccountMutation | 흉내 |
| 결제 카드 등록·변경 · 카드 결제 | "입력 완료" · `/trp?token` 성공 → 외부 PG | createPaymentCardMutation·updatePaymentCardMutation · paymentCardsLinkQuery | 흉내(오류 분기만) |
| 회원 탈퇴 | confirm "비즈넵 환급 탈퇴하기" | REST `/withdraw` | 사유 화면까지 |
| 회원가입 · 비밀번호 재설정 메일 · 비밀번호 변경 · 마케팅 토글 | 각 버튼 | `/signup/v2` · `/password/forgot/v2` · passwordUpdateMutation · marketingTermUpdateMutation | 흉내 |
| 홈택스 수집 시작 | `/tax/refund/lookup/request` 열면 자동 | searchRefundV2Mutation(홈택스 실조회) | 사람 단계일 때만 · 흉내 |
| 대기열 알림 신청 | `/tax/refund/lookup/queue` **열기만 해도** | requestHometaxBlockNotificationMutation(알림톡 예약) | 스모크 전에 흉내 |
| 점검 종료 알림톡 예약 | 0~6시 "환급조회" | reserveHometaxMaintenanceExitAlimtalkMutation | 흉내 |
| 설문 저장·제출 · 친구초대 동의 | 각 "다음"·제출 · 초대 | business*·employment*Mutation·submitSurveyMutation·reopenSaveSurveyAnswerMutation · shareEventActionButtonsPrivacyMutation | 흉내 |
| 본인인증 | "휴대폰 본인인증 하기" | REST `/ci/v2/prepare` → PASS | 흉내(씬 03/04) · 사람(05) |

## 에러·예외
| 화면 | 언제 |
|---|---|
| `/error/hometax/no-bman` | ERR_HOMETAX_NO_BMAN |
| `/error/hometax/timeout` | ERR_HOMETAX_TIMEOUT · 조회 15분 초과(LookupRefundRequestContent.tsx:43,418-423) |
| `/error/hometax/unavailable-time` | ERR_HOMETAX_IMPOSSIBLE · 0~6시 · 정의 안 된 코드를 0~6시에 · `/trr` 시간 외 |
| `/error/hometax/server-fix` · `session` · `etc` | SERVER_FIX · SESSION("다시 조회" → 방식별 재인증) · ETC·법인 미정의·searchRefund 네트워크 실패 5회 |
| `/error/temporary` | COLLECT·CALCULATE · 개인 미정의 |
| `/error/hometax/equal-tin` · `overload-control` | 사후관리 ERR_NO_EQUAL_TIN · `/trr` queueScreenEnabled |
| `/error/network` · `unexpected` · `unauthorized` | 사후관리 네트워크(`return_url`) · 사후관리 기타 · `/trr` 로그아웃 |
| `/error/payment/*` · `/simple/timeout` · `/service-down` | trp · 간편신청 로그아웃·만료 · 점검 |
| 404 | 필수 쿼리 누락 · catch-all depth 초과 · BE 콘텐츠 없음 · guide slug 미등록 · trp token 없음 |
| 콘텐츠 fallback | BE 콘텐츠 API 장애 시 **모든 catch-all 콘텐츠가 메인 랜딩으로 대체**(404 아님) |
| 강제 로그아웃 | GraphQL errors code FORBIDDEN → setStatusSignOut → sign-out (흉내로 TC 하나 더 가능) |

## 확인 못 한 것·추측
- **씬 02 기대 문구**: "휴대폰 본인인증을 진행해주세요" 는 대조군 문구 — UTM `utmMedium=crm` 유입이 50% 실험군이면 "환급금을 조회하기 전\n휴대폰 본인인증이 필요해요" 가 떠서 씬이 깨진다(ci-request/index.tsx:26,100-122). QA 계정은 crm 쿠키가 없다고 봄(추측)
- 씬 03 의 CI 성공 흉내 뒤 `resetRequiredAuthStep()`·`getUser()` 가 쿠키 플래그를 지울 수 있다 — 러너는 씬마다 컨텍스트를 새로 만든다(확인: `run.mjs runScenarios`)
- `/menu/my/password` UI 진입 링크 못 찾음 · `/landing/*`·`/event/*` 살아 있는 slug 는 `/sitemap.xml` 에서 · `/home/capital-gain` 생존 미확인
- `working_platform` 값 목록·webview 판정 미열람 · `/home` "다시조회"·"환급받기"·"상세", 결과 템플릿 v-20260820/EXPERIMENT_B 본문, 사후관리, id-auth 오류, 카드 폼, 설문 business 문항 버튼 문구는 다 읽지 않음
- 결과 템플릿 `FIXED_LAB_ID='EXPERIMENT_A'` → `v-20260820/EXPERIMENT_B` 인데 `CURRENT_LOOKUP_RESULT_TERMPLATE_VERSION='v-20260527'` 쓰임새 미확인
- `/tax/refund/lookup/result` 를 세션 데이터 없이 열면 `UnderRefundContent`(추측)
- GraphQL 실제 호스트 미열람 — mock 패턴 `**/graphql` 은 추정

## scripts/qa 반영 상태
- 있음: 화면 설정 `routes/refund-web.json`(샘플·entry·profiles) · 씬 01(RF-005) · 02(RF-006 일부) · 03(RF-011) · 04(RF-012) · 05(RF-013)
- 고칠 것: `routes/refund-web.json` 에 `/menu/refund-history`·`/tax/refund/payment-card*`·`/menu/my/password` 는 가드 없음 표시 · `/hometax-auth/select-method` 샘플 `?type=indis` · `/tax/refund/lookup/queue` 는 **스모크에서 빼거나 흉내 먼저**(열기만 해도 알림 신청)
- 러너에 필요한 것: GraphQL 연산 이름으로 고르는 응답 흉내 · 시계 조작 · 쿠키 주입 · HTTP 요청 단계(RF-043 POST)
