# refund-web QA TC — 비즈넵 환급 사용자 웹

> 2026-10-07 · 기준 `origin/prd-refund` `75ad3aefe`(2026-10-06 v.26.10.103-Refund) — 로컬 `dev`(`4b382c733`)는 이보다 29 앞·41 뒤라 운영 브랜치 스냅샷을 읽었다(이전판 2026-10-02 은 로컬 dev 기준) · **Pages Router** · 경로는 `repos/bznav-web/apps/refund-web/` 기준, 패키지는 `pkg:` = `repos/bznav-web/packages/`
> 지금 돌아가는 설정: `scripts/qa/routes/refund-web.json` · 흐름 씬 `scripts/qa/scenarios/refund-web/01~07` · 초안 `_draft/08~13`(미실행)
> 묶음 안내·자동화 방식 뜻: [README.md](README.md)

## 먼저 알아둘 것
1. **본인인증 가드는 로그인 가드 안에** — `AuthGuard` 가 항상 `<CiGuard/>` 를 함께 렌더(`pkg:user-session/src/components/AuthGuard.tsx:28-33`). 쿠키 `BZNAV_SIGN_REQUIRED_STEP.<ZENV>.ciAuthentication` 이 true 일 때만 `/auth/ci-request?return_url=<현재경로+쿼리>`(`:52-60`) · `/auth/ci-request`·`/auth/ci-authentication` 에서는 건너뜀 · 토스 계열은 `isUseCI=!isTossPlatform` 이라 안 걸림(`components/layout/RefundAppContents.tsx:44`)
2. **로그아웃이면 바로 sign-in 이 아니다** — AuthGuard → `/auth/sign-out` → `working_platform` 이 web/app 일 때만 `/auth/sign-in` 으로 replace(`pages/auth/sign-out/index.tsx:27-31`). 다른 플랫폼은 "비즈넵 환급 로그인 인증이\n만료되었어요" 화면에 머문다
3. 로그인했지만 `signAppIds` 에 refund 가 없으면 `/auth/sign-up/terms`(`AuthGuard.tsx:20-23`)
4. **GraphQL 엔드포인트가 하나**(`POST NEXT_PUBLIC_GQL_API_SERVER`, body `{query, variables}`, operationName 없음 — `lib/relay/use-fetch-relay-factory.ts:55-80`). 씬 `mock` 은 이제 **`operation`(본문 `query` 의 연산 이름)으로 고를 수 있고**(씬 07), 씬 안에서 흉내 없는 mutation 은 러너가 막는다(`scenario.mjs` 머리 주석 · `allowMutations` 로만 통과). 그래서 아래 "(GQL)" TC 는 지금 씬으로 옮길 수 있다. 서버(getServerSideProps)에서 나가는 요청은 못 잡는다
5. **시간 분기** — 0~6시 조회 불가(`getHours() >= 6`) · 재수집 알림톡 9시 전 불가(`>= 9`)(`lib/utils/check-times.ts:8-12`) · 23:50~00:30 은행망 안내(`:14-25`, 문구는 "23:50~24:30") · 간편인증 5분 타이머·[재인증 요청] 첫 30초 비활성(RF-053). 시계 조작 단계(`page.clock`)가 필요
6. **점검(service-down)은 서버 미들웨어** — `proxy.ts` 가 edge-config `refund/management.json` 을 읽어 redirect(`proxy.ts:21,34-55`). 브라우저 흉내로 재현 불가 · 우회 `?zent=admin` · 점검이 꺼져 있으면 `/service-down` → `/home`
7. **OS(UA) 분기** — 법인 인증 방법 선택은 윈도우면 공동인증서가 위, 아니면 홈택스 아이디가 위이고 공동인증서를 누르면 PC 인계 다이얼로그(`components/hometax-auth/select-method/SelectHometaxIdOrJointCert.tsx:19,28-37,39`). 개인 홈 [환급조회] 도 Windows UA 면 인증 방법 선택으로 간다(RF-019). QA 브라우저는 윈도우 UA 가 아니라 **윈도우 갈래는 UA 바꾸기가 필요**하다
8. **이벤트 이름** — `sendClickEvent(x)` → `x_clicked` · `sendViewEvent(x)`·`PageViewEventLogger(pageName, eventName)` → `(eventName ?? pageName)_viewed` · `sendEvent(x)` 는 그대로(`pkg:tracking-service/src/components/EventTrackingProvider.tsx:150-173`, `PageViewEventLogger.tsx:32-35`)

## A) 화면 (● 있음 / – 없음 · 본인인증 ● = AuthGuard 안 CiGuard)

`pages/**` 화면 파일 107개(`_app`·`_document`·`api/*` 제외 — `impact.mjs --all` 106 + 운영에만 있는 `/joint-cert-handoff`). 아래는 묶어서 적었다

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
| `/hometax-auth/select-method` | 홈택스 인증 | ● | ● | `?type=indis\|corps\|decision` — 없거나 틀리면 404 · corps 는 OS 분기(윈도우 아니면 공동인증서 → PC 인계 다이얼로그) | – | select-method/index.tsx:42-50, SelectHometaxIdOrJointCert.tsx:28-37 |
| `/hometax-auth/simple-auth/input` | 홈택스 인증 | ● | ● | `?from=lookup\|home\|decision\|alimtalk\|personal-deduction` — 틀리면 "페이지에 접근할 수 없어요"(`from in FROM_TYPE_CONFIG`) · 대기열 BEFORE_AUTH 면 queue 로 | – | simple-auth/input/index.tsx:27,34-46,48-69, lib/constants/auth.ts:26 |
| `/hometax-auth/simple-auth/{confirm,confirm-auto}` | 홈택스 인증 | ● | ● | – | ● 입력 credential · 카카오 + from=home·decision·alimtalk(checkDecision) 은 confirm-auto(폴링, [인증 완료] 버튼 없음) · 그 외 confirm | SimpleAuthInputContainer.tsx:36-39, SimpleAuthConfirmContainer.tsx |
| `/hometax-auth/id-auth` | 홈택스(법인) | ● | ● | – | – | id-auth/index.tsx |
| `/hometax-auth/joint-certificate/{install,select}` | 공동인증서 | ●(`type=result` 는 가드 밖) | ● | `?type=indis\|corps\|decision\|result` — 없거나 틀리면 404 · corps + `?hid=` 면 PC 인계 이벤트 | ● 로컬 프로그램 `https://127.0.0.1:16566` | install/index.tsx:16-37,47-55, joint-certificate.ts:3-7 |
| `/joint-cert-handoff` | 공동인증서 PC 인계(알림톡 진입) | – | – | `?hid=…`(쿼리 유지, `type` 은 corps 로 덮어씀) | 즉시 302 → `/hometax-auth/joint-certificate/install?…&type=corps` | pages/joint-cert-handoff/index.tsx:13-20 |
| `/tax/refund/lookup/request` | 조회 | ● | ● | `?type=indis\|corps` | ● refundToken | lookup/request/index.tsx:98-104 |
| `/tax/refund/lookup/queue` | 조회 | ● | ● | `?type=` | – (⚠ **열기만 해도 알림 신청 뮤테이션**) | QueueContent.tsx:33-74 |
| `/tax/refund/lookup/result` | 조회 결과 | ● | ● | `?type=` — 없으면 Spinner | ● sessionStorage 조회 데이터 | lookup/result/index.tsx |
| `/tax/refund/{lookup,apply}/reenactment` | 재현 | – | – | `?snapshot_code=` | ● | */reenactment |
| `/tax/refund/bank-account` | 신청 | ● | ● | `?mode=update&type=indis` · 기본 apply | ● 조회 데이터 | BankAccountContext.tsx:23-36 |
| `/tax/refund/phone-number` | 신청 | ● | ● | `?type=` 없으면 Spinner · 다른 값도 개인처럼 그려짐(검증 없음) | ● 계좌 뒤 | pages/tax/refund/phone-number/index.tsx |
| `/tax/refund/payment-card{,/input}` | 신청·내 정보 | **–**(가드 없음) | – | `?fromLookup=true` | ● | pages/tax/refund/payment-card/* |
| `/tax/refund/apply/{complete,result}` | 신청 | ● | ● | `?type=indis\|corps\|*tritx*` | complete 는 신청 뒤 | apply/result/index.tsx:69-75 |
| `/tax/refund/cancel/{prevention,reason}` | 취소 | ● | ● | `?type=` | ● cancelData atom | ApplyResultApplyCompleteCheckContent.tsx:86-95 |
| `/tax/refund/test` | 개발용 링크 | – | – | – | – | pages/tax/refund/test |
| `/trp` · `/trp/{cancel,success}` | 결제 링크 | – | – | `?token=`(없으면 `/404`) · success 는 PG POST | ● | pages/trp/* |
| `/trr` | 알림톡 진입 | ●(로그아웃이면 `/error/unauthorized`) | ● | `?code=&actionCode=&type=recollect\|checkDecision\|job_retention` | – | pages/trr/index.tsx:24-40 |
| `/simple/[corpType]/apply` | 간편신청 | ●(로그아웃이면 `/simple/timeout`) | ● | `indis`·`corps` — 그 밖은 404(`fallback: false`) | ● 알림톡 code | simple/[corpType]/apply/index.tsx:28-49 |
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

자동화: 스모크 = URL 직접 · 씬 = 흐름 씬 · 응답 흉내 = mock · 사람 단계 · 수동. "(GQL)" 은 `mock.operation`(연산 이름)으로 지금 씬에 옮길 수 있다 · **(있음 NN)** = `scenarios/refund-web/NN-*.json` · **초안 NN** = `_draft/NN-*.json`(아직 안 돌려 봄). 경계값 TC(RF-050~064)의 분류는 오류 문구를 보는 것이라 "에러"로 뒀다.

| ID | 분류 | 제목 | 세션 | 뷰포트 | 사전 조건 | 단계 | 기대 결과 | 자동화 | 우선 | 근거 |
|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | 스모크 | 공개 그룹 (랜딩·help·guide 4종·faq·reviews·share·terms·survey completed/expired·simple timeout/success·404) | logout | 둘다 | – | 화면 표 "로그인 –" 화면 차례로 | 200 · 콘솔 에러 0 · 로그인으로 안 감 | 스모크 | P1 | 화면 표 |
| RF-002 | 스모크 | 로그인 그룹 (/home·/menu·/menu/my·notification·deposit-method·survey/reopen·select-method?type=indis\|corps·simple-auth/input?from=home) | verified | 둘다 | verified 세션 | 그대로 열기 | 그 화면에 머묾(`stay`) | 스모크 | P0 | routes profiles |
| RF-003 | 스모크 | 에러 화면 그룹 | verified | mobile | – | `/error/*` 15개 `?business-type=indis` | 각 제목(no-bman "신고 내역이 없어\n환급액을 조회할 수 없어요", server-fix "현재 홈택스 점검으로…") | 스모크 | P1 | error-view/* |
| RF-004 | 스모크 | 어드민 콘텐츠 catch-all | logout | 둘다 | 살아 있는 slug(`/sitemap.xml` BE 목록 — `/home/event/refundbada` 는 정적 sitemap 에서 빠졌다) | sitemap 의 콘텐츠 주소 하나, `/event/a/b/c` | 콘텐츠 렌더 / 404 "404\n페이지를 찾을 수 없습니다" | 스모크 | P1 | content-page/path.ts:14-18, lib/seo-policy.mjs:1 |
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
| RF-020 | 흐름 | 홈 법인 → 홈택스 아이디 | verified | desktop | 윈도우 아닌 UA(QA 기본) | "환급조회"(법인사업자) → "30초 만에 조회하기" | `select-method?type=corps` "어떤 방법으로 조회할까요?"(`corps-selectauth_viewed`) → `/hometax-auth/id-auth`(`corps-selectauth_hometaxid_large_clicked` · `after_handoff_dialog=false`) · 윈도우 UA 면 같은 버튼이 공동인증서 → `/hometax-auth/joint-certificate/install?type=corps` | 씬 (윈도우 갈래는 UA 필요) | P1 | SelectHometaxIdOrJointCert.tsx:21-37,39-92 |
| RF-021 | 흐름 | 진행 중·완료 조회 있음 | verified | mobile | – | `checkSearchStatusQuery` progress '100' / '40' → "환급조회" | '100' "조회 완료된 내역이 있어 먼저 불러올게요…" 6초 뒤 reload · 그 외 "환급 조회 중인 내역이 있어요…" 후 인증 | 응답 흉내 (GQL) | P2 | RefundHomeContent.tsx:128-146 |
| RF-022 | 에러 | 0~6시 조회 시도 | verified | mobile | 시계 02:00 | "환급조회" | `/error/hometax/unavailable-time?business-type=indis&nav-left-button=back&lookup-type=lookup_first` · ⚠ `reserveHometaxMaintenanceExitAlimtalkMutation` 이 나감 → 흉내 필수 | 응답 흉내 + 시계 | P1 | RefundHomeContent.tsx:117-127 |
| RF-023 | 흐름 | 간편인증 입력 → 확인 | verified | mobile | 네이버앱 `simpleAuthRequestTokenMutation` · 카카오지갑 `simpleAuthPollingRequestTokenMutation` 흉내 | 이름·생년월일·휴대폰, "네이버앱" → "다음" | `indis-simplecert_next_clicked` → `/hometax-auth/simple-auth/confirm`(replace) · "카카오지갑" + from=home·decision·alimtalk(checkDecision) 은 `confirm-auto` · 응답에 reqTxId·cxId 가 없으면 "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요." | 응답 흉내 (GQL) | P0 | SimpleAuthInputContainer.tsx:36-39,101-206 |
| RF-024 | 에러 | 간편인증 요청 서버 오류 | verified | mobile | `hometaxSimpleAuth(Polling).errors` 흉내 | "다음" | code `ERR_HOMETAX_SIMPLE_AUTH` + message → 그 메시지 토스트 · 그 밖의 code·GraphQL errors·네트워크 실패 → "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요." · 모두 입력 화면에 머묾(REF-3854) | 응답 흉내 (GQL) — **초안 10** | P2 | SimpleAuthInputContainer.tsx:123-135,166-179,203-205 |
| RF-025 | 흐름 | 실제 간편인증 → 조회 | verified | mobile | headed · 실제 홈택스 회원 · ⚠ 실제 인증 요청이 휴대폰으로 간다 | 네이버앱: 앱 인증 → "인증 완료" · 카카오지갑(from=home): 앱 인증만 하면 폴링으로 자동 이동 | `/tax/refund/lookup/request?type=indis`(`indis-simplecert_confirm_next_clicked`) · 미인증 "{카카오\|네이버}앱에서 인증을 완료해 주세요." · 5분 지나면 "인증 유효 시간이 지났어요. 재인증 요청을 눌러 다시 진행해주세요." | 사람 단계 | P0 | SimpleAuthConfirmContainer.tsx:172-238 |
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
| RF-046 | 흐름 | 법인 공동인증서(윈도우 아님) → PC 인계 다이얼로그 | verified | 둘다 | 윈도우 아닌 UA · `sendCommonCertPcLinkMutation` 흉내(⚠ 실제는 알림톡 발송) | `select-method?type=corps` → "공동인증서로 조회하기" → "카카오톡으로 링크 받기" / "닫기" | `corps-selectauth_commoncert_clicked` → "윈도우 PC에서 진행해주세요"(휴대폰 있으면 "카카오톡 받을 번호") · `corps-selectauth_pc-handoff-dialog_viewed`{entry_point=corps} · 보내기 `…_kakao-link_clicked`{handoff_id, click_seq, entry_point} → result true "카카오톡으로 링크를 보냈어요." · false 면 errors.message 또는 "링크를 보내지 못했어요. 잠시 후 다시 시도해주세요." · 닫기 `…_pc-handoff-dialog_close_clicked` · 그 뒤 홈택스 아이디 클릭은 `after_handoff_dialog=true` | 씬 — **초안 08** | P1 | use-joint-certificate-handoff-dialog.ts:24-55, JointCertificateHandoffDialog.tsx:30-48 |
| RF-047 | 가드 | PC 인계 알림톡 진입 `/joint-cert-handoff` | verified / logout | desktop | – | `/joint-cert-handoff?hid=qa-1&type=indis` | 302 → `/hometax-auth/joint-certificate/install?hid=qa-1&type=corps`(type 덮어씀) · `pc-handoff_landing_viewed`{handoff_id, is_windows} · `corps-commoncert_install_viewed`{handoff_id} · 프로그램 없으면 `pc-handoff_context_restored`{restored_step=install} 후 머묾 · logout 은 설치 화면 AuthGuard → 로그인 · hid 없으면 인계 이벤트 없음 | 씬 — **초안 09** | P1 | joint-cert-handoff/index.tsx:13-20, install/index.tsx:17-37, use-joint-certificate-handoff-tracking.ts:17-33, JointCertificateInstallContent.tsx:50-61 |
| RF-048 | 에러 | 간편인증 [인증 완료] 오류코드별 안내 | verified | mobile | 네이버앱 · from=home · `simpleAuthConfirmRequestTokenMutation`·`simpleAuthRequestRefundTokenForLookupMutation` 흉내 | confirm "인증 완료" | `ERR_HOMETAX_SESSION` "홈택스 간편인증 로그인 지연 안내"(남은 시간 00:00) · `ERR_HOMETAX_SIMPLE_AUTH` 서버 message 토스트 · `ERR_HOMETAX_NO_USER` "홈택스 회원가입이 필요해요"("홈택스로 이동" = 새 창 + 입력 화면) · `ERR_NO_EQUAL_TIN` "{이름}님의 정보로 인증해주세요" · `ERR_EXIST_FINISH_REFUND` + lastLoginType "이미 환급을 신청하셨네요!" / 없으면 "환급 신청이 어려워요" · 그 밖 "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요." · 이벤트 `indis-simplecert_confirm_{fail\|error-nouser\|error-tin\|sametin\|sametin-nodata}_viewed`(추측: 갈래별 이름은 Dialogs.tsx 조건 따라) | 응답 흉내 (GQL) | P1 | SimpleAuthConfirmContainer.tsx:112-147,226-241, Dialogs.tsx:59-200 |
| RF-049 | 에러 | 간편인증 자동 확인(confirm-auto) 실패·만료 | verified | mobile | 카카오지갑 · from=home · `simpleAuthStatusQuery` 흉내 | 대기(폴링 3초) · "인증 다시 받기" | 상태 FAILED/EXPIRED·서버 실패 5회 → "인증을 다시 진행해주세요" → "확인" = 입력 화면 · 5분 지남 → 만료 다이얼로그 한 번만 · 환급 토큰 단계 오류는 RF-048 과 같은 문구 + 남은 시간 00:00 · 이벤트 `indis-simplecert_confirm-auto_fail_viewed`{reason} | 응답 흉내 (GQL) + 대기 | P2 | SimpleAuthAutoConfirmContainer.tsx:43-44,173-229,263-323,345-410 |
| RF-050 | 에러 | 입력 경계 — 간편인증 이름 | verified | mobile | `?from=home` · 수단 선택 | 이름 칸: 빈 값 · 공백만 · "홍"(1자) · "홍길"(2자) · 50자 · 51자 · "홍길동!" · "ㅎㄱㄷ"(자모) · "홍길동1" · 앞뒤 공백 붙여넣기 → "다음" | 빈 값·공백만(입력 때 trim) "이름을 입력해주세요." · 1자·특수문자·자모 "이름을 올바르게 입력해주세요." · 2자·50자·숫자 섞임 통과 · 51번째 글자는 안 들어감(maxLength 50) · 서버 요청 없음 | 씬 — **초안 10** | P1 | personal-info.ts:14-18, simple-auth.ts:19-29, hometax-auth.tsx:24-33 |
| RF-051 | 에러 | 입력 경계 — 간편인증 생년월일 | verified | mobile | 같음 | "19900101" · "1990010"(7자리) · "199001011"(9자리) · "1899.12.31" · "1990.13.01" · "1990.00.15" · "1990.02.30" · "1990.01.32" · "1990-01-01" · "1990a101" · 빈 값 | 8자리는 "1990.01.01" 로 자동 점 · 7·9자리·1899년·13월·32일·하이픈·문자 "8자리 숫자로 입력해주세요. 예) 19900101" · 빈 값 "생년월일을 입력해주세요." · ⚠ "1990.00.15"(0월)·"1990.02.30" 은 통과(정규식이 월 `0[0-9]`, 달력 검사 없음) | 씬 — **초안 10** | P1 | personal-info.ts:8-12, simple-auth.ts:12-17 |
| RF-052 | 에러 | 입력 경계 — 간편인증 휴대폰·수단·버튼 | verified | mobile | 같음 | "01012345678" · "0101234567"(10자리) · "010123456" · "010-12345678" · "02012345678" · 12자리 · 빈 값 · 수단 안 고르고 "다음" · 오류 뒤 한 칸 고치기 | 11자리 "010-1234-5678" 자동 하이픈 통과 · "010-12345678" 도 정규화돼 통과 · 10자리("010-123-4567", 12자)·9자리·02 시작·12자리 "올바른 휴대폰번호를 입력해주세요."(13자 고정) · 빈 값도 같은 문구(추측: length 검사가 먼저) · 수단 "본인인증 수단을 선택해주세요." · 제출 뒤 오류가 있으면 "다음" 비활성, 그 칸을 다시 입력하면 오류가 지워져 활성 | 씬 — **초안 10**(비활성 확인 단계는 러너에 없음) | P1 | simple-auth.ts:5-10,21-28, SimpleAuthInputContainer.tsx:250-258,303 |
| RF-053 | 흐름 | 간편인증 [재인증 요청] 30초·5분 경계 | verified | mobile | 네이버앱 confirm · `simpleAuthRequestTokenMutation` 흉내(⚠ 실제는 인증 요청 재발송) | confirm 열고 4:31 · 4:30 · 0:00 에 "재인증 요청" · 0:00 뒤 "인증 완료" | 남은 시간 4:30 초과는 "재인증 요청" 비활성 · 4:30 이하 활성 → `indis-simplecert_confirm_retry_clicked` → 성공 시 5:00 재시작 · 오류는 RF-024 와 같은 토스트 · 0:00 "인증 유효 시간이 지났어요. 재인증 요청을 눌러 다시 진행해주세요." 한 번(오류로 멈춘 0:00 은 안 뜸) | 응답 흉내 (GQL) + 시계 | P2 | ContentItem.tsx:56-86, SimpleAuthConfirmContainer.tsx:172-176,267-312 |
| RF-054 | 에러 | 입력 경계 — 신청 휴대폰 번호 | verified | mobile | 계좌 다음 단계(`?type=indis`) | "01012345678" · "0101234567" · "010-1234-567" · "010abcd5678" · " 01012345678 "(공백) · 빈 값 → 칸 밖 | 11자리 "010-1234-5678" · 그 밖 "올바른 휴대폰 번호를 입력해주세요."(칸 떠날 때) · 문자는 지우지 않아 그대로 오류 · 앞뒤 공백 trim · 유효할 때만 "확인" 활성 · ⚠ "확인" = 실제 신청 | 씬 — **초안 11** | P1 | PhoneNumberContent.tsx:25-35,69-91, apply-phone-number.ts:5-13 |
| RF-055 | 에러 | 입력 경계 — 환급 계좌번호 | verified | mobile | 조회 결과 → 계좌 화면(세션 데이터) | 은행 고르고 계좌 9 · 10 · 14 · 15자리 · "123-456"(하이픈) · "1234.567890" · 은행 안 고름 · `mode=update` 에 기존과 같은 계좌 · `checkBankAccountMutation` result false · 23:50 | 9·15자리 "계좌번호를 정확히 입력해주세요." + "다음" 비활성 · 10·14자리 통과 · 하이픈·문자는 지워짐 · ⚠ "."은 남아 오류 · 은행 없음·기존과 같음 "다음" 비활성 · result false "계좌를 다시 입력해 주세요"(23:50~00:30 은 은행망 문구 추가) · `{page}_bankaccount_next_clicked` | 사람 단계 / 응답 흉내 (세션 주입 필요) | P1 | RefundBankAccountContent.tsx:43-50,63-113,140-155 |
| RF-056 | 에러 | 입력 경계 — 간편신청 휴대폰·계좌·약관 | verified | mobile | `/simple/indis/apply?code=x` | 휴대폰 10자리·문자 섞임 · 계좌 빈 값·9자리·10자리 · 약관 미동의 · `checkBankAccountByCode` result false / `ERR_EXPIRE_URL` 흉내 | 휴대폰 "올바른 휴대폰 번호를 입력해주세요."(숫자 외 지움) · 계좌 "계좌번호를 입력해주세요." / "올바른 계좌번호를 입력해주세요." · 약관까지 맞아야 "환급 신청하기" 활성 · false 면 "계좌를 다시 입력해 주세요" + 칸 오류 "존재하지 않는 계좌번호예요. 계좌번호를 다시 확인해주세요." · 만료 → `/simple/timeout` · ⚠ 예금주 확인 뒤 "네" = 실제 신청 | 씬 + 응답 흉내 (GQL) | P1 | simple-apply.ts:6-17, PhoneNumberForm.tsx:33-63, BankAccountForm.tsx:33-76, SimpleTermsContent.tsx:105-186 |
| RF-057 | 에러 | 입력 경계 — 결제 카드 | verified | mobile | – | 카드번호 빈·12·13·16·17자리 · 유효기간 빈·"1326"·"0027"·3자리·지난 달·이번 달·2달 뒤·4달 뒤·현재+10년·+11년 · 비밀번호 빈·1·3자리 · 생년월일 빈·5자리·"901301"·"900132"·"900231" · 약관 | 카드 "카드번호를 입력해주세요." / 13자리 미만 "올바른 카드번호를 입력해주세요." · 17번째 안 들어감 · 유효기간 "유효기간을 입력해주세요." / 13월·0월·3자리·+11년 "올바른 유효기간을 입력해주세요." / 지난 달 "유효기간이 지났어요." / 3달 안 "90일 이상 남은 카드만 가능해요." · 비밀번호 "비밀번호 앞 2자리를 입력해주세요." / 1자리 "올바른 비밀번호를 입력해주세요." · 생년월일 "생년월일을 입력해주세요." / "6자리 숫자로 입력해주세요." / 월·일 범위 밖 "올바른 생년월일을 입력해주세요."(2월 31일은 통과) · 버튼 "정보를 모두 입력해주세요" → 다 맞고 약관 동의면 "입력 완료" · `card-input_viewed` · `card-input_terms_all_clicked`{checked} · ⚠ "입력 완료" = 카드 등록 | 씬 — **초안 12** | P1 | PaymentCardInputContent.tsx:47-155,157-191,221-225,453-456 |
| RF-058 | 에러 | 입력 경계 — 법인 홈택스 아이디 로그인 | verified | desktop | – | 아이디·비밀번호에 공백 · 주민번호 앞 "9013"(5자 미만)·"901301"·"900100"·"900101" · 뒷자리 0·7·8·9·1 · 네 칸 중 하나 비움 | 공백은 지워짐 · 앞자리 칸 떠날 때 6자리 아님·13월·0일 "올바른 생년월일을 입력해주세요." · 뒷자리 칸 떠날 때 앞이 6자리 아니면 "6자리 숫자로 입력해주세요." · 뒷자리는 1~6만 들어감 · 네 칸 다 차고 오류 없을 때만 "다음" 활성 · 비밀번호 "영문·숫자·특수문자 조합, 9~15자리" 는 안내만(검사 없음) · ⚠ "다음" = 실제 홈택스 로그인(5회 틀리면 잠금) | 수동 (러너에 칸 고르는 선택자 필요) | P1 | HometaxIdAuthContent.tsx:37-46,175-253,277 |
| RF-059 | 에러 | 입력 경계 — 이메일 로그인 | logout | 둘다 | – | "이메일로 로그인" → 이메일 빈 값·"qa @x.com"·"qa@example"·"qa@example.com" · 비밀번호 빈 값·"12 34 5"·5자·6자·251자 · Enter | "이메일 주소를 입력해주세요." / "이메일 주소에 공백을 넣을 수 없습니다." / "올바른 이메일 주소를 입력해주세요." · "비밀번호를 입력해주세요." / "비밀번호에 공백을 넣을 수 없습니다." / "비밀번호는 6자 이상 입력해주세요." / "비밀번호는 250자 이하로 입력해주세요." · 둘 다 유효해야 "로그인" 활성 · Enter 도 로그인 시도 | 씬 — **초안 13** | P1 | pkg:user-sign/src/utils.ts:19-46, SignItems.tsx:19-97 |
| RF-060 | 에러 | 입력 경계 — 회원가입 입력 | logout | mobile | 이메일 중복 확인 REST 흉내 | 이름 "홍"·21자·"홍 길동"·"홍길동1"·"hong_gil" · 비밀번호 확인 불일치 · 휴대폰 9·10·12자리·"0201234567"·공백 · 가입된 이메일 → "이메일로 가입하기" | "이름은 2자 이상 입력해주세요." / "이름은 20자 이하로 입력해주세요." / "이름에 공백을 넣을 수 없습니다." / "이름은 한글, 영문만 사용할 수 있습니다."(`_`·`-` 는 통과) · "비밀번호가 일치하지 않습니다." · "올바른 휴대폰 번호를 입력해주세요." / "휴대폰 번호가 너무 깁니다." / "올바른 휴대폰 번호 형식이 아닙니다." / "휴대폰 번호에 공백을 넣을 수 없습니다."(10자리 01x 는 통과) · 중복 "이미 가입된 이메일이에요" + 칸 "사용할 수 없는 이메일 입니다." · ⚠ 비밀번호 placeholder "영문, 숫자, 특수문자 포함 8자 이상" 과 검사(6자 이상)가 다름 | 씬 + 응답 흉내 (REST) | P2 | pkg:user-sign/src/utils.ts:1-84, SignUpInput.tsx:15-90 |
| RF-061 | 에러 | 입력 경계 — 비밀번호 재설정 메일·새 비밀번호 | logout | mobile | ⚠ 메일 발송 `/password/forgot/v2` 흉내 | forgot 이메일 RF-059 경계값 · reset `?code=` 없음 · 새 비밀번호 5자·확인 불일치 | 이메일이 유효할 때만 버튼 활성 → "비밀번호 재설정 메일을 발송했어요." · code 없음 "비밀번호 재설정 링크가 유효하지 않습니다. 다시 시도해주세요." · "비밀번호는 6자 이상 입력해주세요." / "비밀번호가 일치하지 않습니다." · `forgot-password_viewed` · `reset-password_viewed` | 씬 + 응답 흉내 (REST) | P2 | pkg:user-sign/src/components/ManagePassword.tsx:21-73,87-190 |
| RF-062 | 에러 | 입력 경계 — 비밀번호 변경 | verified(이메일) | mobile | ⚠ 변경은 `passwordUpdateMutation` 흉내 | 현재 비밀번호 5자·6자·틀린 값 → 새 비밀번호 빈 값·5자 · 확인 불일치 → "다음" | 현재 5자 "다음" 비활성(6자 미만) · 틀림 "비밀번호가 일치하지 않아요. 다시 입력해주세요." · 새 비밀번호 칸 떠날 때 "비밀번호를 입력해주세요." / "6자 이상 입력해주세요." · 확인 불일치 "비밀번호가 일치하지 않아요. 다시 입력해주세요." · 성공 "비밀번호가 변경되었어요." → `/menu/my` · ⚠ 불일치여도 "다음" 을 막지 않는다(추측 — 확인 칸 값으로 변경 요청) · `pw-check_viewed` · `pw-change_bottom_complete_clicked` | 응답 흉내 (GQL) | P2 | ChangePasswordProvider.tsx:44-83, password-input.tsx:9-75, NewPasswordForm.tsx:23-55, use-password-error.ts:4 |
| RF-063 | 에러 | 입력 경계 — 자유 입력 500자(탈퇴·취소·설문 재개) | verified | mobile | 각 화면 진입 조건 | "기타" 고르고 빈 값 · 공백만 · 500자 · 501자 붙여넣기 | 500자까지 들어가고 501번째는 잘림 · 탈퇴 카운터 "500 / 500" · 취소 "기타" 빈 값·공백만 → "고민 사유를 입력해주세요." · 탈퇴는 이유를 안 고르면 "의견 제출하기" 가 아무 일도 안 함, "기타" 빈 값은 그대로 진행(본인인증 준비 `/ci/v2/prepare` 흉내) | 씬 + 응답 흉내 | P2 | ReasonContent.tsx:21-61, CancelReasonContent.tsx:118-124, CancelReasonList.tsx:82-90, ReopenSurveyContent.tsx:221-224 |
| RF-064 | 에러 | 입력 경계 — 설문 특수관계인 이름·생년월일 | verified | mobile | 설문 대상 | 이름 빈 값·"홍1"·"1홍"·공백만 · 생년월일 "9001"·"901301"·"900132"·"900101"·빈 값 | 이름 "이름을 입력해주세요." / 끝 글자가 숫자 "올바른 이름을 입력해주세요." · ⚠ "1홍"·공백만은 통과(끝 글자만 검사) · 생년월일 "6자리 숫자로 입력해주세요. 예) 900101" / "올바른 생년월일을 입력해주세요." · 빈 생년월일 허용 · 이름이 있고 오류 없을 때만 "입력 완료" 활성 | 응답 흉내 (GQL) | P2 | UserInputEmployeeFormContainer.tsx:125-178 |
| RF-065 | 가드 | 쿼리 경계 — 간편인증 from | verified | mobile | – | simple-auth/input `?from=`(빈 값) · `?from=HOME` · `?from=lookup` · `?from=personal-deduction` · `?from=constructor` | 빈 값·대문자 "페이지에 접근할 수 없어요" + "뒤로가기" · lookup·personal-deduction 은 입력 화면 · ⚠ `constructor`·`toString` 은 `in` 검사를 통과해 설정이 없는 채로 그린다(추측: 런타임 오류) | 스모크 | P2 | simple-auth/input/index.tsx:27,48-69 |
| RF-066 | 가드 | 쿼리 경계 — 간편신청 corpType · 신청 type · 공동인증서 result | logout / verified | mobile | – | `/simple/xyz/apply` · `/tax/refund/phone-number`(type 없음) · `?type=xyz` · `/hometax-auth/joint-certificate/install?type=result`(logout) · `?type=RESULT` | 404 · Spinner 에 머묾 · 개인 화면처럼 그림(`indis-request_phonenumber_viewed`) · result 는 로그인 없이 설치 화면 · 대문자는 404 | 스모크 | P2 | simple/[corpType]/apply/index.tsx:40-49, phone-number/index.tsx, install/index.tsx:26-55 |
| RF-067 | 에러 | 시간 경계 — 홈택스 06:00·재수집 09:00·은행망 | verified | mobile | 시계 05:59·06:00 · 08:59·09:00(`/trr?type=recollect`) · 23:49·23:50·00:30·00:31 | 홈 "환급조회" · 알림톡 진입 · 계좌 "다음"(result false 흉내) | 05:59 unavailable-time(RF-022) · 06:00 정상 · recollect 08:59 "아침 9시 이후에\n다시 진행해주세요" · 09:00 정상 · 은행망 문구는 23:50~00:30 에만("*23:50~24:30 사이에는 은행망 점검으로 …") | 응답 흉내 + 시계 | P2 | check-times.ts:8-25 |
| RF-068 | 흐름 | 법인 공동인증서 인증 결과 이벤트 | verified | desktop | 윈도우 PC · 공동인증서 프로그램 · 실제 인증서 · PC 인계로 들어온 세션(hid) | select 화면에서 인증서 고르고 인증 | 성공 `corps-commoncert_auth_complete`{handoff_id} → `/tax/refund/lookup/request?type=corps` · 실패 `corps-commoncert_auth_fail`{handoff_id, fail_reason} + 오류 다이얼로그 · 조회 결과 화면 view 에 handoff_id | 사람 단계 | P2 | JointCertificateSelectContent.tsx:104-125, ResultPageLayout.tsx |

반응형: RF-001·002 가 두 뷰포트를 다 찍는다. 플랫폼별 헤더(webview close / 웹 back, `/home` 왼쪽 close·grayLogo)는 `working_platform` 쿼리로 바꿔 보는 TC 를 하나 더 둘 수 있다(값 목록 미확인). 폭이 아니라 **OS(UA)** 로 갈리는 화면 — 법인 인증 방법 선택(RF-020·046), 홈 [환급조회](RF-019) — 은 윈도우 UA 를 따로 줘야 한다.

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
| 간편인증 요청 · 재요청 | 입력 "다음" · confirm "재인증 요청" · confirm-auto "인증 다시 받기" | simpleAuthRequestTokenMutation · simpleAuthPollingRequestTokenMutation(입력한 휴대폰으로 실제 인증 요청이 간다) | 흉내(초안 10) · 사람(RF-025) |
| PC 인계 링크 발송 | 법인 공동인증서 다이얼로그 "카카오톡으로 링크 받기" | sendCommonCertPcLinkMutation(계정 휴대폰으로 알림톡) | 흉내(초안 08) |
| 홈택스 아이디 로그인 | `/hometax-auth/id-auth` "다음" | checkHometaxAccountMutation(실제 홈택스 로그인 — 틀리면 횟수가 쌓여 5회에 계정 잠금) | 흉내 · 버튼 활성까지만 |
| 공동인증서 인증 | select 화면 인증서 선택 → 인증 | hometaxLoginMutation(홈택스 실로그인) | 사람 단계(RF-068) |

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
| 간편인증 다이얼로그(REF-3854) | "홈택스 간편인증 로그인 지연 안내"(SESSION) · "홈택스 회원가입이 필요해요"(NO_USER) · "{이름}님의 정보로 인증해주세요"(NO_EQUAL_TIN) · "이미 환급을 신청하셨네요!" / "환급 신청이 어려워요"(EXIST_FINISH_REFUND) · "인증을 다시 진행해주세요"(SIMPLE_AUTH·만료·네트워크 — confirm-auto) · 그 밖 토스트 "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요." (RF-048·049) |
| 법인 홈택스 로그인 오류 | "아이디 또는 비밀번호가 일치하지 않아요" · "입력한 계정이 일시 잠금됐어요" · "법인 홈택스 계정을 연동해주세요" 등 7종 + 그 밖 "홈택스 로그인에 문제가 발생했어요"(`corps-hometax_error_viewed`{error}) — HometaxIdAuthContent.tsx:48-137 |

## 확인 못 한 것·추측
- **씬 02 기대 문구**: "휴대폰 본인인증을 진행해주세요" 는 대조군 문구 — UTM `utmMedium=crm` 유입이 50% 실험군이면 "환급금을 조회하기 전\n휴대폰 본인인증이 필요해요" 가 떠서 씬이 깨진다(ci-request/index.tsx:26,100-122). QA 계정은 crm 쿠키가 없다고 봄(추측)
- 씬 03 의 CI 성공 흉내 뒤 `resetRequiredAuthStep()`·`getUser()` 가 쿠키 플래그를 지울 수 있다 — 러너는 씬마다 컨텍스트를 새로 만든다(확인: `run.mjs runScenarios`)
- `/menu/my/password` UI 진입 링크 못 찾음 · `/landing/*`·`/event/*` 살아 있는 slug 는 `/sitemap.xml` 에서 · `/home/capital-gain` 생존 미확인
- `working_platform` 값 목록·webview 판정 미열람 · `/home` "다시조회"·"환급받기"·"상세", 결과 템플릿 v-20260820/EXPERIMENT_B 본문, 사후관리, 설문 business 문항 버튼 문구는 다 읽지 않음(id-auth 오류·카드 폼은 2026-10-07 에 읽음 — RF-057·058)
- 결과 템플릿 `FIXED_LAB_ID='EXPERIMENT_A'` → `v-20260820/EXPERIMENT_B` 인데 `CURRENT_LOOKUP_RESULT_TERMPLATE_VERSION='v-20260527'` 쓰임새 미확인
- `/tax/refund/lookup/result` 를 세션 데이터 없이 열면 `UnderRefundContent`(추측)
- GraphQL 실제 호스트 미열람 — 씬은 `mock.operation` 으로 연산 이름만 보므로 호스트와 무관
- **입력 검증에서 본 문제 후보**(코드로 확인, 실행 안 함 — 이슈 등록은 확인 뒤):
  - 간편인증 생년월일 정규식이 월 `0[0-9]` 라 "1990.00.15" 가 통과하고, 달력 검사가 없어 "1990.02.30" 도 통과(`lib/regex/personal-info.ts:11`) — RF-051
  - 간편인증 휴대폰은 하이픈 포함 13자 고정(`.length(13)`)이라 정규식이 허용하는 10자리(011-123-4567)를 거부한다 — RF-052 · 신청 휴대폰(RF-054)·간편신청(RF-056)도 같다. 회원가입(RF-060)은 10자리를 받는다 — 화면마다 규칙이 다르다
  - 간편인증 입력에서 수단을 안 고르고 "다음" → 수단 오류가 생긴 뒤 수단을 골라도 오류가 안 지워져(`reValidateMode: 'onSubmit'`, 수단 칸은 clearErrors 없음) "다음" 이 계속 비활성일 수 있다(추측) — RF-052
  - `?from=constructor`·`toString` 이 `from in FROM_TYPE_CONFIG` 를 통과한다 → 설정 없는 fromType 으로 그려 런타임 오류(추측) — RF-065
  - 회원가입 비밀번호 placeholder "영문, 숫자, 특수문자 포함 8자 이상" 과 실제 검사(6자 이상, 조합 검사 없음)가 다르다(`pkg:user-sign` SignUpInput.tsx:33-37, utils.ts:32-46) — RF-060
  - 비밀번호 변경 새 비밀번호·확인이 달라도 "다음" 을 막지 않고 확인 칸 값으로 변경 요청(추측 — NewPasswordForm.tsx:23-55 에 일치 검사 없음) — RF-062
  - 설문 특수관계인 이름은 끝 글자만 검사(`/[가-힣a-zA-Z\s]$/`)라 공백만·"1홍" 이 통과 · 생년월일 칸 maxLength 6 인데 표시값에 점이 들어가(`toggleBirthdayDot`) 6자리를 다 못 넣을 수 있다(추측) — RF-064
  - 환급 계좌번호는 숫자 외에 `.` 을 남긴다(`/[^0-9.]/g`) — 붙여넣기한 "123.456…" 이 오류로 남는다 — RF-055
  - 탈퇴 "기타" 는 빈 사유로도 진행된다(취소 "기타" 는 막음) — RF-063
- 검증 규칙이 코드에 없어 TC 를 만들지 않은 것: 법인 홈택스 비밀번호(안내 문구 "9~15자리" 만) · 홈택스 아이디(공백 제거만) · 설문 재개·취소·탈퇴 자유 입력의 최소 길이
- PC 인계 진입 이벤트 `pc-handoff_landing_viewed` 는 설치 화면 `useMount`(AuthGuard 밖)에서 나간다 — 로그아웃 상태에서도 나가는지, `sendEvent` 가 로그인 전 사용자를 보내는지 미확인 — RF-047
- 이벤트 이름 중 `indis-simplecert_viewed`·`indis-request_phonenumber_viewed`·`corps-commoncert_install_viewed`·`corps-selectauth_viewed` 는 `PageViewEventLogger` 규칙으로 만든 이름(실제 Mixpanel 수신 미확인) · `impact.mjs --events` 는 동적 이름(`${pageName}_…`)을 못 잡는다
- **이번 판은 `origin/prd-refund` 를 읽었다**. 로컬 `dev`(`4b382c733`)에는 REF-3856(PC 인계)·REF-3854(간편인증 오류 통일) 변경이 아직 없어서, 로컬 dev 서버로 QA 를 돌리면 RF-046·047·048·024 가 다르게 나온다

## scripts/qa 반영 상태
- 있음: 화면 설정 `routes/refund-web.json`(샘플·entry·profiles · queue·request `skip` · select-method·joint-certificate·simple-auth input 샘플) · 씬 01(RF-005) · 02(RF-006 일부) · 03(RF-011) · 04(RF-012) · 05(RF-013) · 06(RF-038) · 07(RF-019)
- 초안(`_draft/`, 미실행 — 한 번 돌려 보고 옮긴다): 08(RF-046) · 09(RF-047) · 10(RF-050·051·052·024) · 11(RF-054) · 12(RF-057) · 13(RF-059)
- 고칠 것(routes·씬 — 이 문서 작업에서는 안 고쳤다):
  - 씬 01~05 에 `"tc"` 가 없다 → 01 `["RF-005"]` · 02 `["RF-006"]` · 03 `["RF-011"]` · 04 `["RF-012"]` · 05 `["RF-013"]`
  - `routes/refund-web.json` 에 `/joint-cert-handoff` 기대값 — 항상 `/hometax-auth/joint-certificate/install` 로 간 뒤 AuthGuard(logout `/auth/sign-` · login `/auth/ci-request` · verified `stay`). 샘플 `?hid=qa-smoke` 를 주면 인계 이벤트도 찍힌다
  - `/hometax-auth/joint-certificate/install` 샘플에 `?type=result`(가드 밖 — logout 에서도 머묾) 추가 후보
  - 이전판의 "select-method 샘플·queue skip" 은 반영됨. "`/menu/refund-history`·`/tax/refund/payment-card*`·`/menu/my/password` 가드 없음 표시" 는 `impact.mjs` 가 AuthGuard 를 직접 찾으므로(`auth:false`) 따로 적을 필요 없음 — 남은 것은 이 화면들에 로그아웃 기대값(머묾)을 확인하는 것
- 러너에 필요한 것(지금 없음): 시계 조작(RF-022·044·053·067) · 쿠키·sessionStorage 주입(RF-055 계좌·RF-029~032 신청 흐름) · HTTP 요청 단계(RF-043 POST) · **UA 바꾸기**(윈도우 갈래 RF-019·020·046) · **버튼 비활성 확인 단계**(`expectDisabled` — 경계값 TC 가 대부분 "버튼 비활성" 을 기대) · **칸 떠나기(blur)·키 입력 단계**(지금은 다른 칸을 눌러 대신한다) · 같은 글자가 여러 칸에 있을 때 n번째 고르기(RF-058 주민번호 앞·뒤 칸)
- GraphQL 연산별 흉내(`mock.operation`)·흉내 없는 mutation 차단·이벤트 확인(`expectEvent`)은 이제 된다(씬 06·07)
