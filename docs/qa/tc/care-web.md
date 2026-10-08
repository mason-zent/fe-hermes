# care-web QA TC — 비즈넵 케어 사용자 웹 (세무기장 구독)

> 2026-10-02 · 조사 기준 `dev` `4b382c733` — `apps/care-web` 은 운영 `origin/prd-care`(`4eae065aa`)와 diff 없음 · **App Router**(`app/`, page 266개, 미들웨어 `proxy.ts`) · 경로는 `repos/bznav-web/apps/care-web/` 기준
> 묶음 안내·자동화 방식 뜻: [README.md](README.md)

## 먼저 알아둘 것
- **로그인 가드** `components/common/auth/CareAuthGuard.tsx:9-26`(→ `@repo/user-session` `AuthGuard`) — 로그아웃이면 `/login?<원래 쿼리>`, 돌아올 주소 `saveReturnUrl` · 로그인했어도 `signAppIds` 에 `bznav-care` 가 없으면 `/sign-up-terms`
- **본인인증(CI) 가드**는 로그인 가드가 있는 **모든 화면**에 함께 걸린다 — 쿠키 `BZNAV_SIGN_REQUIRED_STEP.<ZENV>` 의 `ciAuthentication=true` 면 `/ci-request?return_url=…`(`AuthGuard.tsx:36-62`). 그래서 표의 본인인증은 전부 "조건부"
- **홈택스 간편인증(카카오)**은 가드가 아니라 수임동의·이용료 조회·연말정산 근로자 흐름 안의 단계 · `HometaxGuard` 는 KST 0~6시면 `/user-status/hometax-service-closed`
- 미들웨어 순서(`proxy.ts:20-28`): 점검 → 차단 랜딩 → 플랫폼 → 위험 리다이렉트 파라미터 제거 → AB 테스트 → 부가세 → 요금제
- ⚠ **API 는 GraphQL 한 엔드포인트**(`POST ${NEXT_PUBLIC_GQL_API_CARE_SERVER}`, `libs/relay/fetchGraphQLFactory.ts:31,108`) — 오퍼레이션 이름은 본문 `query` 안에만 있다. **더미 응답는 요청 본문의 오퍼레이션 이름으로 골라야 한다**(지금 `scenario.mjs` mock 은 URL+method 만 — 기능 추가 필요). `errors` FORBIDDEN `0001` → NoAuth · `0002` → NotBookUser · 그 밖 TemporaryError → `app/error.tsx:21-35`
- **사용자 상태 더미의 핵심 `meQuery`**(`graphql/me.ts`): `serviceStatus`(SERVICE_ACTIVE/WAITING) · `CareRegistrationStatus` · `hometaxConnected` · `isInputTaxAgent` · `hometaxId`
- **기장 신청 4단계**: `/delegation`(수임동의) → `/linkhometax`(홈택스 연동) → `/taxagentinput`(세무대리인) → `/billing/checkout`(정기 결제) → `/complete` · `?onestep=Y` 면 단계별 완료 화면에서 끝
- **결제 PG = 헥토(세틀뱅크)**: 카드는 앱 폼 → `createRegularPaymentMutation(Card)`(서버 대 서버, 약관 `hecto-service/collection/3rdagree`) · 계좌는 `initMyBankPaymentQuery` → `window.SettlePay.execute` → `POST /api/my-account-result/success|cancel` → `/my-account-gateway/*` · 첫 결제 `prePaymentMutation` · 종소세 조정료 `createPaymentLinkMutation` → 헥토 링크(`outStatCd==='0031'` 이면 실패)
- ⚠ **로그인 화면에 이메일 로그인이 없다**(`signItems={['kakao','naver','apple']}`, `app/(login)/login/page.tsx:63`) — 간편로그인은 localhost 로 안 돌아오므로 **세션 만들기가 과제**. 세션 쿠키 `B_AT….<ZENV>`, domain 은 loc 이면 `localhost`, 그 밖은 `.bznav.com`

## A) 화면 (묶음)

| 라우트 | 그룹 | 로그인 | 본인인증 | 동적 샘플 | 단계형 | 근거 |
|---|---|---|---|---|---|---|
| `/` | (landing) | N (앱 웹뷰 로그인이면 `/home`) | - | - | - | `app/(landing)/page.tsx` |
| `/premium`, `/events` | performance-landing | N | - | - | - | `(performance-landing)/*` |
| `/single-person-business` `/beauty-industry` `/food-industry` `/mail-order-industry` `/income-tax` | (landing) | N — **미들웨어가 `/` 로 차단** | - | - | - | `withLandingRedirectMiddleware.ts:7-31` |
| `/login` | (login) | N (로그인이면 `signInSuccessUrl`) | - | - | - | `(login)/login/layout.tsx:28-32` |
| `/sign-up-terms`, `/ci-request`, `/ci-authentication` | (login) | N | CI 자체 | - | 약관→CI | `@repo/user-sign` |
| `/delegation{,/corporations{,/inputrrn},/complete,/alreadyFinish}` | (auth)/(homeTax) | Y | 조건부 + 간편인증 | - | 1/4 | `(auth)/layout.tsx:25-29` |
| `/linkhometax{,/passwordchange{,/simpleauth},/complete,/alreadyFinish}` | (auth)/(homeTax) | Y | 조건부 | - | 2/4 | `linkhometax/components/HometaxGuard.tsx:20-26` |
| `/taxagentinput{,/complete,/alreadyComplete}` | (auth) | Y | 조건부 | - | 3/4 | `taxagentinput/(stage)/layout.tsx:13-15` |
| `/billing/checkout{,/complete,/alreadyFinish}` | billing | Y | 조건부 | - | 4/4 | `RegisterGuard.tsx:16-21` |
| `/billing`, `/billing/unpaid`, `/billing/renewal{,/complete,/alreadyComplete,/bankMaintenance}` | billing | Y | 조건부 | - | - | `billing/page.tsx` |
| `/billing/payment-method/[bizNo]/card` | billing | Y | 조건부 | `orgsRegularPaymentMethodQuery` 사업장 bizNo | - | `card/page.tsx:37-45` |
| `/four-insurance{,/agreements{,/pdf{,/[bmanTin]}},/complete,/already-finish}` | (auth) | Y | 조건부 | `fourInsureDelegationOrgsQuery` bmanTin | 사업장→동의 | `four-insurance/layout.tsx` |
| `/complete` | (auth) | Y | 조건부 | - | 마지막 | `(auth)/complete/page.tsx:61` |
| `/home`, `/my-info{,/notification,/refund-account}`, `/my-book{,/sales,/purchase}`, `/my-book/export/{setting,processing,complete}` | (my-info) | Y | 조건부 | - | 내보내기 3단계 | `(my-info)/layout.tsx` |
| `/pricing`(→verification/user), `/pricing/verification/{user,hometax,business-query,employee}`, `/pricing/{result,complete}` | pricing | Y (+HometaxGuard) | 조건부 + 간편인증 | `marketingId`(API) | user→hometax→business-query→employee→result | `pricing/layout.tsx` |
| `/pricing/{representative,site,employee,additional-information}` | pricing | (미들웨어 리다이렉트) | - | - | - | `withPricingRedirectMiddleware.ts:16-24` |
| `/vat/{org-status,history{,/detail,/preview},estimated-tax{,/deduction,/complete},refund-account,tax-result{,/preview}}` | vat | Y | 조건부 | `?bmanTin=` | 예상세액→환급계좌→결과 | `vat/layout.tsx` |
| `/vat/submit-material` + 카테고리(online·delivery·car·cash-sales·duplicate-sales·export·buying-agency·card-expense·paper-tax-invoice·real-estate) + 연결(connect-account·verify·processing·connect-complete) | vat | Y | 조건부 | bmanTin | 카테고리마다 단계형 | `vat/submit-material/*` |
| `/vat/service-connect/*` | vat | Y | 조건부 | - | **현재 날짜 기준 `/vat-gateway` 로** | `withVatRedirectMiddleware.ts:10-16` |
| `/global-income`(→`/global-income/incomeamt`, **페이지 없음**) | global-income | Y | 조건부 | - | - | `global-income/(auth)/page.tsx:6` |
| `/global-income/{flowstatus,intro,main,estimated-tax{,/business-expenses},refund-account,tax-result{,/preview},history{,/detail,/preview},payment-agree{,/complete}}`, `/global-income/billing` + 자료제출 하위 약 50개 | global-income | Y | 조건부(+일부 간편인증) | - | 결제동의→자료제출→예상세액→환급계좌→결과 | `GLOBAL_INCOME_PATH`(`constants/paths.ts:166-223`) |
| `/payroll/*`(input·status·finish·result·submit·manual·part-timers) | payroll | Y | 조건부 | `?type=new` | 수기 입력·등록 단계형 | `PAYROLL_PATHS`(`paths.ts:344-377`) |
| `/year-end-tax`(→작년), `/year-end-tax/[year]{,/[employeeId]{,/result}}` | year-end-tax | Y | 조건부 | year=`2025` · employeeId=`getYearEndTaxEmployeesQuery` | - | `year-end-tax/[year]/layout.tsx` |
| `/year-end-tax/employee/[year]/[employeeId]{,/result,/auth}`, `/year-end-tax/employee/submit-complete` | year-end-tax | **N**(근로자용, 홈택스 토큰 없으면 `/auth`) | 간편인증 | 알림톡 링크(추측) | auth→제출 | `(authenticate)/layout.tsx:19-26` |
| `/additional-expense/*`, `/business-card/*`, `/certificate{,/processing,/preview}` | 각 그룹 | Y | 조건부 | - | 단계형 | 각 layout |
| `/startup-check{,/result}` / `/startup-check/input` | startup-check | N / **Y** | - / 조건부 | - | - | `startup-check/input/layout.tsx` |
| `/add-manager{,/result}` | kakaoTalk-notification | Y | 조건부 | `token`(추측) | - | `add-manager/layout.tsx` |
| `/landing-gateway` | gateway | **Y** | 조건부 | - | - | `landing-gateway/page.tsx:12-19` |
| `/{delegation,vat,global-income,payroll,cashnote,pro,payhere,external,logout,switch-account}-gateway`, `/payment-gateway/*`, `/my-account-gateway/*` | gateway | N | - | 쿼리(`redirect`·`access_token`·`ordNo`) | - | `(gateway)/*` |
| `/payment-complete`, `/payment-failed`, `/payment-expired`, `POST /payment-result/*`, `POST /api/my-account-result/*` | payment | N | - | - | - | `(payment)/*`, `app/api/*` |
| `/file-download/*` | external-file-download | N(`token` 쿼리) | - | `token`·`bmantin` | - | `(external-file-download)/*` |
| `/cs-center`, `/cs-center/detail/[slug]` | cs-center | N | - | slug=노션 페이지 ID(목록 링크) | - | `cs-center/detail/[slug]/page.tsx:20-23` |
| `/card-expense/download-guide`, `/user-status/*`(9개), `/service-maintenance`(점검 아니면 `/`), `/test{,/e2e}`(prd 는 `/`) | 기타 | N | - | - | - | 각 page |

## B) TC

세션: logout / login(로그인만, 약관·CI 전) / verified(care 약관 + CI 완료, dev 기장 계정)

| ID | 분류 | 제목 | 세션 | 뷰포트 | 사전 조건 | 단계 | 기대 결과 | 자동화 | 우선 | 근거 |
|---|---|---|---|---|---|---|---|---|---|---|
| CR-001 | 스모크 | 공개 화면 묶음 | logout | 둘다 | - | `/` `/premium` `/events` `/cs-center` `/login` `/card-expense/download-guide` `/startup-check` | 에러 없이 렌더 · `/` 하단 CTA `월 5만원 세무기장 시작하기` | 스모크 | P0 | `LandingCta.tsx:50` |
| CR-002 | 스모크 | 로그인 영역 묶음 | verified | 둘다 | 기장 계정 | `/home` `/my-info` `/billing` `/vat/org-status` `/global-income/flowstatus` `/payroll/input` `/business-card/status` `/additional-expense/status` `/my-book` | 각 화면 유지 · 에러 화면 없음 | 스모크 | P0 | 각 layout `CareAuthGuard` |
| CR-003 | 스모크 | 안내(user-status) 묶음 | logout | mobile | - | `/user-status/*` 9개 | 가드 없이 렌더 · `hometax-service-closed` "아침 6시 이후에 다시 조회해주세요" + `홈으로` | 스모크 | P2 | `user-status/hometax-service-closed/page.tsx:23` |
| CR-004 | 반응형 | 랜딩 상단 바·사이드바 | logout | 둘다 | 웹 | `/` → `앱 설치` → 메뉴 → `로그인`/`이용료 조회` | `앱 설치` + 사이드바 · 하단 CTA 최대 520px 가운데 | 씬 | P2 | `TopNavPlatformActions.tsx:20-58` |
| CR-005 | 가드 | 로그아웃 → 로그인 + 돌아올 주소 | logout | mobile | - | `/home` | `/login` · 로그인 뒤 `/home` 복귀 | 씬 (복귀는 사람 단계) | P0 | `CareAuthGuard.tsx:14-26` |
| CR-006 | 가드 | 쿼리 보존 | logout | desktop | - | `/vat/org-status?bmanTin=1234567890` | `/login?bmanTin=…` · 돌아올 주소에 쿼리 | 씬 | P1 | `CareAuthGuard.tsx:16-21` |
| CR-007 | 가드 | care 약관 미동의 계정 | login | mobile | signAppIds 에 `bznav-care` 없음 | `/home` → 약관 → `동의 완료` | `/sign-up-terms` · 동의 전 `약관에 동의해주세요` | 씬 / 사람 단계 | P0 | `AuthGuard.tsx:21-23`, `SignTerms.tsx:143` |
| CR-008 | 가드 | 본인인증 필요 → CI (더미) | login | mobile | 쿠키 `BZNAV_SIGN_REQUIRED_STEP.<env>={"ciAuthentication":true}` | `/home` → `[필수]` → `휴대폰 본인인증 하기`(`**/ci/v2/prepare` 더미) | `/ci-request?return_url=%2Fhome` → `/ci-authentication` | 더미 응답 | P0 | `AuthGuard.tsx:55-60` |
| CR-009 | 가드 | 로그인 상태 /login | verified | mobile | - | `/login` | 폼 없이 `/home` | 씬 | P1 | `SignInContent.tsx:84-87` |
| CR-010 | 가드 | 차단된 퍼포먼스 랜딩 | logout | mobile | - | `/beauty-industry?utm_source=x` 등 6개 | `/` 로, 쿼리 비움 | 씬 | P1 | `withLandingRedirectMiddleware.ts:7-31` |
| CR-011 | 가드 | 외부 리다이렉트 파라미터 차단 (보안) | logout | desktop | - | `/login?returnUrl=//evil.com`, `/vat-gateway?redirect=%2F%2Fevil.com` | 파라미터를 지운 주소로 · 외부로 안 나감 | 씬 | P0 | `withSafeReturnUrlMiddleware.ts:10-31` |
| CR-012 | 가드 | 부가세 선오픈 경로 | verified | mobile | 날짜 ≥ 2026-07-06 11:00 | `/vat/service-connect` | `/vat-gateway?redirect=/vat/org-status` → 3초 뒤 `/vat/org-status` | 씬 | P2 | `withVatRedirectMiddleware.ts:10-16` |
| CR-013 | 가드 | 옛 요금제 경로 | verified | mobile | - | `/pricing/site` / `?utm_source=<cashNote utm>` | `/pricing/verification/user` / `/cashnote-gateway` | 씬 | P2 | `withPricingRedirectMiddleware.ts:16-24` |
| CR-014 | 가드 | 홈택스 점검 시간(0~6시) | verified | mobile | 시계 KST 01:00 | `/delegation`·`/pricing/verification/user` | `/user-status/hometax-service-closed` | 씬 (시계 조작) | P1 | `HometaxGuard.tsx:18-20` |
| CR-015 | 가드 | 신고 기간 신규 수임 차단 | verified | mobile | 시계 2026-07-10 | `/delegation` / `?onestep=Y` | `/user-status/tax-period-closed`("부가세 신고 기간으로…") / onestep 은 진행 | 씬 (시계 조작) | P1 | `(auth)/layout.tsx:19-27` |
| CR-016 | 가드 | 이미 완료한 단계 | verified | mobile | meQuery 더미 `hometaxConnected:true` / `isInputTaxAgent:true` | `/linkhometax`, `/taxagentinput` | `/linkhometax/alreadyFinish` / `/taxagentinput/alreadyComplete` | 더미 응답 (오퍼레이션별) | P1 | `HometaxGuard.tsx:20-24` |
| CR-017 | 가드 | 결제할 사업장 없음 | verified | mobile | 결제수단 모두 완료 | `/billing/checkout` (`?onestep=Y`) | `/complete` / `/billing/checkout/alreadyFinish` | 씬 (계정 상태) | P1 | `RegisterGuard.tsx:16-21` |
| CR-018 | 가드 | 연말정산 근로자 화면 인증 없이 | logout | mobile | - | `/year-end-tax/employee/2025/1` | `/…/auth` | 씬 | P2 | `(authenticate)/layout.tsx:19-26` |
| CR-019 | 흐름 | 랜딩 CTA → 로그인 | logout | 둘다 | - | `/` → `월 5만원 세무기장 시작하기` | `/landing-gateway?…` → `/login` | 씬 | P0 | `LandingCta.tsx:57-60` |
| CR-020 | 흐름 | 랜딩 게이트웨이 분기 | verified | mobile | meQuery 더미 | `/landing-gateway` (a) SERVICE_ACTIVE (b) WAITING (c) 그 밖 | (a)(b) `/home` (c) `/pricing/verification/user` | 더미 응답 | P0 | `useGetSubscriptionStatus.ts:16-27` |
| CR-021 | 흐름 | 이용료 조회 입력 검증 | verified | mobile | 06~24시 | 대표자명·휴대폰·생년월일 | 비면 `모든 정보를 입력해주세요`(비활성) · `올바른 휴대폰번호를 입력해주세요.` · 다 맞으면 `인증하기` | 씬 | P1 | `verification/user/page.tsx:106-139` |
| CR-022 | 흐름 | 이용료 조회 간편인증 요청 (더미) | verified | mobile | `hometaxSimpleLoginMutation` 성공/실패 더미 | `인증하기` | 성공 `/pricing/verification/hometax` · 실패 `인증에 실패했습니다. 다시 시도해주세요.` | 더미 응답 | P0 | `useHometaxSimpleAuth.ts:37-60` |
| CR-023 | 흐름 | 카카오 인증 확인 | verified | mobile | `hometaxSimpleLoginConfirmMutation` 더미 | `인증 완료 후 눌러주세요` | NoConfirm `카카오톡 앱에서 인증을 완료해주세요.` · 성공 `/pricing/verification/business-query` | 더미 응답 (실제는 사람 단계) | P0 | `verification/hometax/page.tsx:41-66` |
| CR-024 | 흐름 | 사업장 조회 결과 분기 | verified | mobile | `hometaxOrgsV2Query` 더미(1.5초 재조회) | business-query | `CalcFeeAndHometaxOrgs`→`employee?marketingId=` · `HometaxOrgNotFound`→`no-org` · `NoCareTarget`→`restricted-business` · `OnlyPermanentlyClosed`→`closed-business-only` · `TaxFreeBmanError`→`tax-free-limited` · `CarePlus*`→`care-plus-*` · 그 밖 다이얼로그 | 더미 응답 | P0 | `useGetHometaxOrg.ts:69-160` |
| CR-025 | 흐름 | 근로자 정보 → 견적 결과 | verified | mobile | `saveLeadEmployeeInfoMutation` 더미 | 두 질문 → `내 이용료 확인하기` | `/pricing/result?…` | 더미 응답 | P1 | `useSaveLeadEmployeeInfo.ts:32` |
| CR-026 | 흐름 | 견적 → 수임동의 진입 | verified | 둘다 | 평시 / 차단기간 | `지금 세무 기장 시작하기`(차단기간 `세무기장 이용 예약하기`) | `/delegation-gateway?autopricing=Y` → `/delegation/corporations` 또는 `/delegation` / 차단기간 `/pricing/complete` | 씬 | P0 | `PricingResultStickyBottom.tsx:23-36` |
| CR-027 | 흐름 | 1/4 수임동의 (더미) | verified | mobile | `taxAgencyAgreeMutation` 더미 | 입력 → `인증 요청` → (사람) 카카오 → `수임 동의` | `홈택스 수임동의가 완료되었어요.` → `/linkhometax` · `ExsitOtherAgency` 다이얼로그 · `CarePlusHistoryNotAllowedForDelegation` → `care-plus-history` | 더미 응답 + 사람 단계 | P0 | `useTaxAgencyAgree.ts:64-91` |
| CR-028 | 흐름 | 2/4 홈택스 연동 (더미) | verified | mobile | `hometaxIdConnectMutation` 더미 | 아이디·비번 → `홈택스 연동` | `홈택스 연동이 완료되었어요.` → `/taxagentinput` · `비밀번호를 잊어버렸다면` → passwordchange | 더미 응답 | P1 | `linkhometax/(stage)/page.tsx:59-87` |
| CR-029 | 흐름 | 3/4 세무대리인 입력 | verified | mobile | `surveyMutation` 더미 | 칩 → `저장하고 다음` | `이전 세무대리인 정보 입력이 완료되었어요.` → `/billing/checkout` · 선택 전 `선택해주세요` | 더미 응답 | P1 | `taxagentinput/(stage)/page.tsx:64-98` |
| CR-030 | 흐름 | 4/4 카드 등록 (더미) | verified | 둘다 | 결제수단 없음 · `createRegularPaymentMutation` 더미 | `결제 수단을 등록해주세요`(비활성) → 결제수단 → `카드 결제` → 카드 폼 + `[필수]` 3개 → `저장` | `/billing/payment-method/{bizNo}/card?redirectType=checkout` · Succeed → checkout 복귀 · `PgError` 다이얼로그 | 더미 응답 | P0 | `useCardEvent.ts:55-67` |
| CR-031 | 흐름 | 4/4 이용료 결제 (더미) | verified | mobile | 결제수단 있음 · `prePaymentMutation` 더미 | `N원 결제하기` → `동의하고 결제하기` | Succeed `/complete`("수임이 완료되었어요!"·`홈으로`) · onestep `/billing/checkout/complete` · `PrePaymentFailed` "결제되지 않은 사업장이 있어요" · TemporaryError "앗, 예상하지 못한 문제가 발생했어요" | 더미 응답 | P0 | `CheckoutConfirmDrawer.tsx:166-199,282` |
| CR-032 | 흐름 | 내통장결제 취소 복귀 | verified | desktop | - | `계좌 이체` → 헥토 창 / `POST /api/my-account-result/cancel?pageType=checkout` | `/my-account-gateway/cancel?pageType=checkout` · 헥토 창은 사람 | 수동 / 사람 단계 | P1 | `useInitMyBankPayment.ts:49-62` |
| CR-033 | 흐름 | 결제 관리·미납 | verified | 둘다 | 미납 / 정상 | `/my-info` → 결제 관리 → 카드 변경(더미) | `결제 관리` · 미납 알림 → `/billing/unpaid` · "결제 수단이 바뀌었어요.…" | 더미 응답 | P1 | `billing/page.tsx:22-40` |
| CR-034 | 흐름 | 홈 상태별 분기 | verified | 둘다 | meQuery 더미 수임 전 / WAITING / ACTIVE | `/home` | 수임 전 `내 이용료 알아보기` · WAITING `신청 완료하기` → `/delegation` · ACTIVE 링크 카드(`사업용 신용카드 관리`·`급여 자료 제출`·`부가가치세 신고 내역`) | 더미 응답 | P0 | `HomeContentsWrapper.tsx:8-15` |
| CR-035 | 흐름 | 내 정보 메뉴·로그아웃 | verified | mobile | - | `알림 설정` / `회원 탈퇴` / `로그아웃` | `/my-info/notification` · 탈퇴는 채널톡만(실제 탈퇴 없음) · 로그아웃 → `/` → `/home` 은 `/login` | 씬 (⚠ 로그아웃은 세션을 끊는다 — 마지막에) | P1 | `UserAuthList.tsx:18,35,54,63` |
| CR-036 | 흐름 | 부가세 자료 제출 완료 (더미) | verified | mobile | bmanTin · `vatMaterialCompleteMutation` 더미 | `/vat/org-status` → 자료제출 → `이대로 제출하기`(없으면 `추가 없이 신고 진행하기`) | `/vat/submit-material/submit-result?…` · 그 밖 임시오류 | 더미 응답 | P0 | `useSubmitMaterial.ts:50-69` |
| CR-037 | 흐름 | 부가세 신고 확정 (더미) | verified | mobile | `vatDeclareEstimatedTaxConfirmMutation` 더미 | `이대로 신고하기` → "이대로 신고서를 제출할까요?" → `제출하기` | 환급이면 `/vat/refund-account?…` | 더미 응답 | P0 | `DeclareConfirmDialog.tsx:34-68` |
| CR-038 | 흐름 | 종소세 결제동의·진입 분기 | verified | mobile | `checkIncomeIntroStatusQuery`(`stlAgrAt:null` / `NoTargetIncomeTaxDeclare`) + `incomeTaxStlAgreeMutation` 더미 | `/global-income/flowstatus` → `자동 결제에 동의해요` | `/global-income/payment-agree` → `/payment-agree/complete` · 대상 아님 오류 화면 | 더미 응답 | P0 | `useCheckIncomeIntroStatus.ts:24-31` |
| CR-039 | 흐름 | 종소세 예상세액 확정 (더미) | verified | mobile | `incomeTaxDeclareStageConfirmMutation` 더미 | `이대로 신고하기` | Succeed `/global-income/flowstatus` · `RequiredRefundAccountInput` → 드로어 또는 `/global-income/refund-account` | 더미 응답 | P1 | `useEstimatedTaxComplete.ts:26-90` |
| CR-040 | 흐름 | 종소세 조정료 결제 결과 (더미) | verified | mobile | `createPaymentLinkMutation` 더미(`AlreadyPaid` / `CreateLinkSucceed`) | 결제 버튼 → 결과 route `POST outStatCd=0031` | AlreadyPaid `/payment-gateway/success`("결제를 처리하고 있어요") → 1.5초 → flowstatus · 0031 `/payment-gateway/failed`("결제 요청 중 문제가 발생했어요"·`이전 페이지로`) | 더미 응답 | P1 | `useCreatePaymentLink.ts:18-40` |
| CR-041 | 흐름 | 급여 "지급한 급여 없음" (더미) | verified | mobile | `updateNoPayrollMutation` 더미 | `/payroll/input` → 사업장·월 → `N월에 지급한 급여가 없어요` → `네, 없어요` | `/payroll/finish?status=noPayroll` · 선택 전 `선택해주세요` · 완료월 `제출 내역 확인` | 더미 응답 | P1 | `CtaWrapper.tsx:67-70,117` |
| CR-042 | 흐름 | 연말정산 진입 | verified | mobile | 대상 아님 계정 | `/year-end-tax` | `/year-end-tax/2025` · 대상 아니면 오류 화면 | 씬 | P2 | `year-end-tax/page.tsx:6-9` |
| CR-043 | 에러 | GraphQL 오류 → 오류 화면 | verified | 둘다 | GraphQL URL 전체 `errors` 더미: FORBIDDEN `0001` / `0002` / 그 밖 | `/vat/org-status` | "서비스 이용을 위해 로그인을 해주세요" / "케어 기장 이용 중인 계정으로 로그인해주세요" / "예상하지 못한 문제가 발생했어요" | 더미 응답 (URL 하나 — **지금 러너로 바로 됨**) | P0 | `fetchGraphQLFactory.ts:117-129`, `app/error.tsx:21-35` |
| CR-044 | 에러 | 404·종소세 루트 (버그 후보) | verified | mobile | - | `/no-such-page` / `/global-income` | "페이지를 찾을 수 없어요"·`이전으로`·`문의하기` / **`/global-income/incomeamt` 로 가서 404** | 스모크 | P1 | `not-found.tsx:17-24`, `global-income/(auth)/page.tsx:6`, `paths.ts:253` |
| CR-045 | 에러 | 점검 모드·만료 링크 | logout | mobile | 점검 아님 | `/service-maintenance` / `/file-download/expired-token` / `/payment-expired` | `/` 로 / 만료 안내 / "결제 링크가 만료되었어요"·`문의하기` · 점검 중은 수동 | 스모크 / 수동 | P2 | `withServiceMaintenanceMiddleware.ts:47-60` |

## 누르면 안 되는 것 (dev 라도 실서비스·홈택스와 연결될 수 있음 — 추측, 보수적으로 분류)
| 동작 | 버튼 | API | 대신 |
|---|---|---|---|
| 홈택스 수임동의 | `수임 동의`·`다음` | `taxAgencyAgreeMutation` | 더미 응답 |
| 홈택스 비밀번호 변경 | - | `hometaxChangePasswordMutation` | 더미 응답 |
| 카드 정기결제 등록 | `저장` | `createRegularPaymentMutation(Card)` — 헥토 실제 등록 | 더미 응답 |
| 계좌 등록 | - | `initMyBankPaymentQuery` + SettlePay → `createRegularPayment(Bank)` | 수동 |
| 첫 이용료 결제 | `동의하고 결제하기` | `prePaymentMutation` | 더미 응답 |
| 결제수단 재사용 | - | `refCreateRegularPaymentMutation` | 더미 응답 |
| 종소세 자동결제 동의 · 조정료 결제 | `자동 결제에 동의해요` | `incomeTaxStlAgreeMutation` · `createPaymentLinkMutation` | 더미 응답 |
| 부가세 자료 제출 · 자료 없이 제출 · 신고 확정 | `이대로 제출하기` · `제출하기` | `vatMaterialCompleteMutation` · `savePassMaterialStatusMutation` · `vatDeclareEstimatedTaxConfirmMutation` | 더미 응답 |
| 종소세 신고 확정 | `이대로 신고하기` | `incomeTaxDeclareStageConfirmMutation` | 더미 응답 |
| 환급계좌 · 4대보험 위임 · 급여 제출/없음 · 연말정산 상태 · 증명서 발급 · 부계정 추가 | - | `declareRefundAccountMutation`·`registerRfndAccMutation` · `fourInsureDelegationAgreementMutation` · `updatePayrollMutation`/`updateNoPayrollMutation` · `updateYearEndTaxEmployeePrgrStatMutation` · `issueTmpCrdtlsCer`/`redeemTmpCrdtlsCer` · `addSubAccountMutation` | 더미 응답 |
| 홈택스 간편인증 요청 | `인증하기` | `hometaxSimpleLoginMutation` — **실제 카카오톡 인증 요청 발송** | 사람 단계 또는 더미 응답 |

모든 mutation 은 `__typename` 유니온으로 성공/실패를 가른다 → `{"data":{"<필드>":{"__typename":"…","message":""}}}` 로 분기 검증

## 에러·예외 요약
- GraphQL 오류 → `app/error.tsx` 가 NoAuth · NotBookUser · NoCareTarget · NoTargetVatDeclare · afterTaxConfirm · NoFourInsureDelegation · NOT_GLOBAL_INCOME_TARGET · 그 밖 CommonError 로 고른다
- 영역별: `(auth)/billing/error.tsx`(`NoWithdrawOrg` → "정기 결제를 시작할 사업장이 없어요") · `year-end-tax/error.tsx`(4종) · `global-income/error.tsx`·`(auth)/error.tsx` · `business-card/error.tsx`
- 홈택스: 시간대 차단 · `HometaxExpiredSession` · `HometaxTimeout` · `NotEqualRpnTin` · `JoinedOtherEmail` 다이얼로그(`verification/components/*Dialog.tsx`)
- 토큰 만료 → "로그인 해주세요" → `/login`(`use-app-sign-flow.ts:100-110`) · logout-gateway INIT_URL 없으면 `notFound()`

## 확인 못 한 것·추측
- GraphQL URL(env) 미열람 — 더미 패턴은 실제 값 확인 필요
- **세션 만들기**: 이메일 로그인이 없어 `login.mjs` 에서 소셜 로그인해야 하는데 localhost 로 안 돌아온다. dev env 로 띄우면 쿠키 domain 이 `.bznav.com` 이라 localhost 에 안 붙을 수 있다 → loc env 필요(추측). refund-web 세션 재사용 여부 미확인(쿠키 이름에 `APP_SUFFIX`)
- `/global-income` → `/incomeamt` 404 는 코드상 확실(페이지·rewrite 없음), 실제 메뉴에서 쓰이는지 미확인 · `HometaxGuard type='incomeTax'` 도 같은 경로
- `$>;` 표기는 UI 내부에서 화살표 아이콘으로 바꾸는 관례(추측) · `/test/e2e` MOCK_USER 는 옛 방식(효과 없음 추측)
- bizNo 형식·연말정산 employeeId·`/add-manager` token 실제 샘플 미확인 · 헥토 내통장결제 창이 팝업인지 이동인지 미확인
- dev 에서 결제·수임이 외부 운영으로 나가는지 테스트 망인지 미확인 — 그래서 "누르지 말 것" 표는 보수적
- 점검 모드(Firebase)·AB 테스트 쿠키 값 · `billing/refactor/` 신·구 UI 전체 대조 · 종소세·부가세 하위 화면 버튼 문구(대표만 확인)

## scripts/qa 로 옮길 때
- `routes/care-web.json`: devPort 3100 · signInPath `/login` · ciPath `/ci-request` · profiles logout·login·verified · 동적 샘플 대부분 dev 데이터 필요
- 러너에 필요한 것: **GraphQL 오퍼레이션 이름으로 고르는 더미 응답**(CR-016·020·022~041 의 전제) · 시계 조작(`page.clock` — CR-014·015·026) · 쿠키 주입 · App Router 화면 목록 · **세션 만들기**(소셜 로그인 전용 — 별도 결정 필요)
