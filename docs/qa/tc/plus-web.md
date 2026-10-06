# plus-web QA TC — 비즈넵 플러스 (세금 계산기·진단·콘텐츠·운세)

> 2026-10-02 · 조사 기준 `dev` `4b382c733` (운영 `origin/prd-plus` `8d108102b` 아님 — 줄 번호는 dev) · 경로는 `repos/bznav-web/apps/plus-web/` 기준
> 묶음 안내·자동화 방식 뜻: [README.md](README.md)

## 먼저 알아둘 것
- **dev ↔ prd-plus 차이**: `tax-check/result/page.tsx` — prd 는 웹에서도 뒤로가기(`showBackOnWeb`, 랜딩으로), dev 는 `exitToAppOnBack`(웹에서 뒤로가기 없음) · `BookQualityDetailDrawer` 문구(prd "월 3만원으로 장부와 절세까지 제대로 관리" / dev "내 사업 상황에 딱 맞는 1:1 맞춤 절세 솔루션") · prd 에만 naver-site-verification·`basePath`
- **App Router** — `app/**/page.tsx` 20개, `not-found.tsx` 없음 · `next.config.mjs` 리다이렉트 `/` → `/calc`(permanent:false) · `proxy.ts` 는 플랫폼 쿠키만 · 루트 layout `force-dynamic`
- **로그인 필수 화면 없음** — `B_AT*` 쿠키가 있으면: 간편인증 입력을 SSO `/oauth/user` 로 미리 채움 · dp-logs 에 `X-User-Id` · 앱 약관 동의 때 `upsert-app-user`(토큰 없으면 "잘못된 접근입니다.")
- dev 포트 3400(`next dev -p 3400`) · `dev` 스크립트에 `gen:env` 없음 — env 는 따로
- **폭 기준 744px**(`packages/ui/src/hooks/use-window-size.ts:36` `isOverTablet`) — 390px 은 단계별 섹션 + "다음", 1280px 은 섹션 전부 열림·"다음" 없음
- ⚠ **큰 결과 숫자는 텍스트로 못 읽는다** — `SlotMachineNumber`(`app/calc/_components/CalcPriceUnit.tsx:19-22`)가 자리마다 0~9 span 을 굴린다. 정확한 값은 **`POST **/api/dp-logs` 본문 `payload.result`**(결과 진입 때 `recalculation:'N'`, `lib/hooks/calc/use-calculator-dp-log.ts:10-33`) 또는 중간 크기 항목(평범한 span · ∞ 도 span)
- ⚠ **노션은 서버에서만** 부른다(api.notion.com·notion-client) — 브라우저 응답 흉내 불가

## A) 화면

| 라우트 | 그룹 | 로그인 | 동적 샘플 | 단계형 | 근거 |
|---|---|---|---|---|---|
| `/` | 리다이렉트 | 불필요 | – | `/calc` 로 | `next.config.mjs` |
| `/calc` | calc 홈 | 불필요 | – | – | `app/calc/(home)/page.tsx` |
| `/calc/menu` | calc 메뉴 (noindex) | 불필요 | – | – | `app/calc/menu/page.tsx` |
| `/calc/sales` | 가게 매출 | 불필요 | – | 모바일 매출→비용→결과 / 데스크톱 2칸 | `use-store-sales.ts:20-33` |
| `/calc/bep` | 손익분기 | 불필요 | – | 모바일 비용→목표 마진→결과 | `use-breakeven.ts:20-34` |
| `/calc/holidaypay` | 주휴수당 | 불필요 | – | 입력→결과 | `app/calc/holidaypay/page.tsx` |
| `/calc/salary` | 계약 연봉 (`(contract)`) | 불필요 | – | 입력→결과 | `app/calc/salary/(contract)/page.tsx` |
| `/calc/salary/actual` | 실수령액 | 불필요 | – | 입력→결과 | `app/calc/salary/actual/page.tsx` |
| `/calc/tax/vat` | 부가세 | 불필요 | – | 입력→결과 | `app/calc/tax/vat/page.tsx` |
| `/calc/tax/simplevat` | 간이과세 | 불필요 | – | 모바일 매출→공제세액→납부한 세액(**7월 이후만**)→결과 | `use-simple-vat.ts:14-42`, `simple-vat.ts:40-43` |
| `/calc/tax/penalty` | 가산세 | 불필요 | – | 모바일 미납세액→납부 정보→결과 | `use-tax-penalty.ts:19-40` |
| `/tax-check` | 진단 랜딩 | 불필요 | `?tin=` 이면 바로 수집 | 진입점 | `CTAButton.tsx:28-46` |
| `/tax-check/simple-auth` | 정보 입력 | 불필요(B_AT 면 미리 채움) | – | 1단계(+약관 drawer) | `SimpleAuthContent.tsx` |
| `/tax-check/simple-auth/confirm` | 인증 확인 | localStorage `simpleAuthToken` 필요 | – | 2단계, entry `/tax-check/simple-auth` | `SimpleAuthConfirmContent.tsx` |
| `/tax-check/collection` | 수집·분석 | `simpleAuthToken` 또는 `tin` 없으면 simple-auth 로 | – | 3단계 | `CollectionContent.tsx:112-122` |
| `/tax-check/collection/error` | 오류 | 불필요 | `?error=nobman` 여부로 2종 | 분기 | `collection/error/_components/*` |
| `/tax-check/result` | 결과 | localStorage `analysisResult` 필요(없으면 빈 본문) | – | 4단계 | `ResultContent.tsx:22` |
| `/tax-content/[slug]` | 세무 콘텐츠 | 불필요 | **샘플 없음** — 노션 DB `name` 컬럼이 slug | – | `[slug]/page.tsx`, `get-notion-database-rows.ts:34-80` |
| `/fortune` | 운세 | 불필요 | – | 입력→결과(같은 화면) | `FortunePage.tsx`, `use-fortune.ts` |
| `/fortune/share` | 운세 | 불필요 | – | `/fortune?utm_source=fortune.share&…` 로 | `app/fortune/share/page.tsx` |

tax-content 는 **목록 화면이 없다**(상세 `[slug]` 만) — "목록→상세" 흐름은 plus-web 안에서 시험할 수 없다.

## B) TC

| ID | 분류 | 제목 | 세션 | 뷰포트 | 사전 조건 | 단계 | 기대 결과 | 자동화 | 우선 | 근거 |
|---|---|---|---|---|---|---|---|---|---|---|
| PL-001 | 스모크 | 계산기 그룹 10화면 | logout | 둘다 | – | `/calc`, `/calc/menu`, 계산기 8개 | h1 "비즈넵 계산기로 가게 운영을 더 간편하게"·"가게 매출 계산기"·"손익분기 계산기"·"주휴수당 계산기"·"계약 연봉 계산기"·"실수령액 계산기"·"부가세 계산기"·"간이과세자 부가세 계산기"·"가산세 계산기" · 콘솔 에러 0 · 계산 버튼 disabled | 스모크 | P0 | `app/calc/*/page.tsx` |
| PL-002 | 스모크 | 리다이렉트 2종 | logout | desktop | – | `/`, `/fortune/share` | `/calc` · `/fortune?utm_source=fortune.share…` | 스모크 | P1 | `next.config.mjs`, `fortune/share/page.tsx:5-7` |
| PL-003 | 스모크 | tax-check·fortune 진입 | logout | 둘다 | localStorage 비움 | `/tax-check`, `/tax-check/simple-auth`, `/fortune` | "간편하게 진단해주는 내 사업장 건강검진" + "진단 받아보기" · "간편인증을 위한 정보 입력" + "정보를 입력해주세요"(disabled) · "오늘의 사업 운세", placeholder "000-00-00000", "운세 조회하기" disabled | 스모크 | P0 | `tax-check/page.tsx:20-26`, `FortuneEntryForm.tsx:50,60,76` |
| PL-004 | 계산 | 부가세 별도·포함 | logout | 둘다 | `/calc/tax/vat` | ① `1000000` "별도" ② 지우기 `10000` "포함" | ① 부가세 **100,000** · 공급가액 **1,000,000** · 공급대가 **1,100,000** ② **909** / **9,091** / **10,000** · 입력 콤마 | 씬 (+dp-logs) | P0 | `lib/utils/calc/vat.ts:8-15` |
| PL-005 | 계산 | 손익분기 기본·소수 원가율 | logout | mobile | `/calc/bep` | ① 원가율 `30`, 고정비 `3000000`, "다음", 목표 `24000000`, "손익분기 계산" ② `30.5`/`1000000`/`10000000` | 비용 헤더 "연 36,000,000원" · ① 연 **85,714,285** 월 **7,142,857** 일 **234,833** ② 연 **31,654,676** 월 **2,637,889** 일 **86,725** (floor((고정비×12+목표)/(1−원가율/100)), 월·일 내림) | 씬 | P0 | `breakeven.ts:10-23` |
| PL-006 | 계산 | 손익분기 원가율 100% | logout | desktop | `/calc/bep` | `100`/`1`/`1` | 연·월·일 **∞원** · `100.1` 무시(최대 100) | 씬 | P1 | `breakeven.ts:12-14` |
| PL-007 | 계산 | 주휴수당 40h·45h | logout | 둘다 | 시급 기본 "10,320" | ① `40` ② `45` | ① **82,560**, 연장 없음 ② **82,560** · 연장 **5시간** · 연장수당 **25,800** · "주휴수당은 1일 8시간, 1주 40시간을 한도로 적용돼요." | 씬 | P0 | `holiday-pay.ts:8-17` |
| PL-008 | 계산 | 주휴수당 미지급·경계 | logout | mobile | – | ① `14`h ② `40`h + 결근 "있음" ③ `15`h "없음" | ①② **0원** "주휴수당은 주 15시간 이상 근무하고 소정근로일 결근하지 않은 경우 지급돼요." ③ **30,960** · `169` 입력 안 됨(최대 168) | 씬 | P1 | `holiday-pay.ts:9-11` |
| PL-009 | 계산 | 실수령액 3,600만 | logout | 둘다 | `/calc/salary/actual` | `36000000`, 비과세·부양가족 비움, "공제 내역" | 월 **2,626,700** · 연 **31,520,400** · 시급 **12,567** · 건보 107,850 / 요양 14,170 / 연금 142,500 / 고용 27,000 / 소득세 74,350 / 지방세 7,430 | 씬 (+dp-logs) | P0 | `salary-actual.ts:60-96`, 간이세액표 `3000000` 행 |
| PL-010 | 계산 | 실수령액 비과세·부양가족 | logout | mobile | 같음 | `60000000`, 비과세 `200000`, 부양가족 `2` | 월 **4,300,320** · 연 **51,603,840** · 시급 **20,575** · 172,560 / 22,670 / 228,000 / 43,200 / 212,050 / 21,200 | 씬 | P1 | `salary-actual.ts:19-29,73-96` |
| PL-011 | 계산 | 계약 연봉 역산 | logout | 둘다 | `/calc/salary` | ① 월 실수령 `2500000` ② `3000000`, 비과세 `200000` | ① **34,108,800** · 세전 월 **2,842,400** · 시급 **13,600** · 공제 342,400 ② **40,952,400** / **3,412,700** / **16,329** | 씬 | P0 | `salary-contract.ts:24-65` |
| PL-012 | 계산 | 실수령↔계약 왕복 오차 기록 | logout | desktop | – | 36,000,000 → 2,626,700 → 계약 연봉에 2,626,700 | **35,979,600**(36,000,000 아님 — 100원 탐색·1.1 보정 근사) · 기록만 | 씬 | P2 | `salary-contract.ts:11,31-47` |
| PL-013 | 계산 | 가게 매출 (부가세 포함 ON·OFF) | logout | mobile | `/calc/sales` | ① ON · `100`/`11000`/`30` "다음" · `30`/`2200000`/`2`/`2500000` "손익 계산" ② OFF · `100`/`10000`/`25` · `40`/`1000000`/`1`/`2000000` | ① 연 순이익 **168,000,000** · 월 **14,000,000** · 연 부가세 **22,800,000** ② **144,000,000** / **12,000,000** / **16,800,000** | 씬 (+dp-logs `sales_amount` 360,000,000) | P0 | `store-sales.ts:17-93` |
| PL-014 | 흐름 | 일 방문객 팝업 계산 | logout | 둘다 | `/calc/sales` | "팝업에서 계산하기" → `20`/`50`/`3` "계산하기" · `1`/`10`/`1` · "닫기" | 칸 **30** · 결과 0 이면 안 바뀜 · "닫기" 는 안 바꿈 | 씬 | P1 | `store-sales.ts:96-98`, `VisitorCalcModal.tsx:51-60` |
| PL-015 | 계산 | 간이과세 기본 4단계 | logout | mobile | 7월 이후 | 연 매출 `50000000`, 음식점업, "다음" · 매입 `20000000`, 카드 `30000000`, "다음" · 예정부과 비움, "부가세 계산", "공제 내역" | "1월 납부 예정 세액" · 차감납부 **260,000** · 매출세액 **750,000** · 부가율 **15%** · 공제 **490,000**(매입 100,000 · 카드 390,000) | 씬 | P0 | `simple-vat.ts:18-64` |
| PL-016 | 계산 | 간이과세 공제 상한·환급 | logout | desktop | 같음 | ① 소매업 `1000000000`, 카드 `1000000000` ② 기타 서비스업 `10000000`, 매입 `100000000`, 카드 `10000000` | ① 카드 공제 **10,000,000** 상한 · 차감 **5,000,000** ② **−330,000** · "차감납부세액이 -로 나왔다면 환급받아요." | 씬 | P1 | `simple-vat.ts:27-33` |
| PL-017 | 에러 | 카드매출 > 연매출 | logout | 둘다 | 같음 | 연 `10000000`, 카드 `20000000` | "연 매출액을 초과할 수 없어요." · 버튼 disabled | 씬 | P1 | `use-simple-vat-form.ts:35-39` |
| PL-018 | 흐름 | 간이과세 7월 이전 | logout | mobile | 시계 2026-03-01 | 매출 → "다음" | "납부한 세액" 없음 · 버튼 "부가세 계산"(7월 이후 "다음") | 씬 (clock 흉내) | P2 | `simple-vat.ts:41-43` |
| PL-019 | 계산 | 가산세 무신고·일반 | logout | mobile | 신고일 기본 오늘 | `1000000`, "무신고"·"일반", "다음" · 신고 2026-01-31, 기한 2026-01-01 | "30일 경과" · **106,600** · 감면 후 **100,000** · 지연 **6,600** · "26년 1월 31일에 기한후 신고하면 감면율 50% 적용돼요." | 씬 | P0 | `tax-penalty.ts:24-123` |
| PL-020 | 계산 | 가산세 과소신고·부당 | logout | desktop | 같음 | ① 과소/일반 1,000,000, 2026-01-01 → 2026-03-15 ② 무신고/부당 10,000,000, 2025-05-31 → 2026-05-31 | ① **41,060**(25,000 + 16,060, 감면 75%, 73일) ② **4,803,000**(4,000,000 + 803,000, 0%, 365일) | 씬 | P1 | `tax-penalty.ts:39-69` |
| PL-021 | 에러 | 날짜 역전·같은 날 | logout | 둘다 | 같음 | ① 기한 2026-03-01 후 신고 2026-02-01 ② 기한 달력 ③ 신고=기한 | ① "신고일보다 앞서야 가산세가 발생해요." disabled ② 신고일 당일부터 선택 불가 ③ 계산됨, 0일·감면 50% **100,000**(확인 필요 엣지) | 씬 | P1 | `PaymentInfoSection.tsx:55-56,76,122` |
| PL-022 | 에러 | 숫자 입력 정제 | logout | mobile | vat·bep | `-5000`·`1.5`·`abc`·`0`·`9999999999999` · 원가율 `3.5.2` | "5,000" / "15" / "" / "0"(disabled) / 999,999,999,999 초과 반영 안 됨 / "3.52" | 씬 | P1 | `sanitize.ts:2-16` |
| PL-023 | 흐름 | 재계산·지우기·dp-log | logout | desktop | 부가세 결과 | 금액 수정, 3초, "지우기" | 바로 재계산 · dp-logs `recalculation:'N'` → 3초 뒤 `'Y'` · 지우기 → 입력 비움·버튼 다시·위로 스크롤 | 응답 확인 (dp-logs) | P1 | `use-vat.ts:19-44` |
| PL-024 | 반응형 | 단계형 계산기 뷰포트 차이 | logout | 둘다 | bep·sales·penalty·simplevat | 390·1280 | 모바일 첫 섹션 + "다음" · 데스크톱 전부 열림, 앞 단계까지 채워야 활성 | 스모크 (+스크린샷) | P1 | `use-breakeven.ts:20-34` |
| PL-025 | 흐름 | 계산기 홈·메뉴·공유 | logout | 둘다 | `/calc` | 링크 9개(`/fortune` 포함) · 배너 · "공유"(desktop) · 메뉴 → "비즈넵 환급"·"서비스 이용약관"·"지엔터프라이즈 회사소개" | 각 계산기 · 배너 새 창 `ab.bznav.com/mv8sgx` · 공유 클립보드 + "링크를 복사했어요."(모바일 navigator.share) · 환급 `ab.bznav.com/ihfiqg` · 약관 모달 iframe `bznav.com/popup/terms/service` · 회사소개 `zent.kr` | 씬 | P1 | `home-menus.ts`, `CommonTopNavigation.tsx:39-74` |
| PL-026 | 흐름 | 상단 바 왼쪽 버튼 | logout | mobile | sessionStorage 비움 | ① bep 처음 ② `/calc` → bep ③ 앱 웹뷰 | ① 로고 ② 뒤로가기 ③ 뒤로가기만, `closeWebView` | 씬 / 수동(③) | P2 | `use-top-navigation-policy.ts:24-57` |
| PL-027 | 에러 | 간편인증 입력 검증·포맷 | logout | mobile | `/tax-check/simple-auth` | 이름 `김`, `19900101`, `01012345678` → `김테스트`, `0101234567` | "1990.01.01"·"010-1234-5678" · 1자 "올바른 이름을 입력해주세요." · 10자리 "올바른 휴대폰번호를 입력해주세요." · 다 맞으면 "다음" | 씬 | P0 | `lib/regex/schema/simple-auth.ts:3-39` |
| PL-028 | 흐름 | 약관 → 간편인증 요청 성공 | logout | mobile | mock `POST **/terms` (필수 4종) · `POST **/api/hometax/simple-auth` `{success:true,authToken,cxId,reqTxId}` | 입력, "네이버 앱", "다음" → "고객님의 동의가 필요해요" → "전체 동의" → "인증 확인 요청" | confirm "지금 메시지를 보냈어요! 네이버에서 확인해주세요." · "남은시간 5:10" · "재인증 요청하기" 30초 disabled · 동의 전 "약관에 동의해주세요" · kakao 는 `kakaotalk://` 로 가니 naver 권장 | 응답 흉내 | P0 | `TermsAgreementDrawer.tsx:59-66,194-242`, `SimpleAuthConfirmContent.tsx:23,120,156-165` |
| PL-029 | 에러 | 간편인증 요청 실패 | logout | mobile | ① 500 `{error:'서버오류'}` ② `{success:false}` | "인증 확인 요청" | ① 토스트 "서버오류" ② "본인 인증에 실패했어요. 입력 정보를 확인해주세요." · 로딩 풀림 | 응답 흉내 | P0 | `SimpleAuthContent.tsx:177-185` |
| PL-030 | 에러 | 약관 API 실패 (버그 후보) | logout | mobile | `POST **/terms` 500 | 입력 → "다음" | drawer 버튼 계속 disabled · `onTermsReady` 안 불려 "간편인증 요청 중" 로딩이 남는지 확인(진행 불가 — 추측) · 콘솔 `fetchTerms Error` | 응답 흉내 | P1 | `TermsAgreementDrawer.tsx:75-99` |
| PL-031 | 흐름 | 인증 완료 → 수집 → 결과 | logout | 둘다 | PL-028 + mock auth-status `completed` · hometax/load `{tin}` · `tax-diagnosis-v2` 결과 | "인증 완료" | "내 사업장 정보를 수집 및 분석하고 있어요" 47→100% → 1초 뒤 `/tax-check/result` · "사장님의 세무는 주의가 필요해요" · "더 낸 세금 있음"/"1,234,567원 환급 가능해요" · "가산세 1건 있음" | 응답 흉내 | P0 | `CollectionContent.tsx:69-175`, `ResultCardList.tsx:50-125` |
| PL-032 | 에러 | 인증 미완료·시간 초과 | logout | mobile | auth-status `pending` | ① "인증 완료" ② 시계 +311초 → "인증 완료", "재인증 요청하기" | ① "네이버에서 인증을 완료해주세요." ② "인증 유효 시간이 지났어요. 재인증 요청을 눌러 다시 진행해주세요." · 재인증 → simple-auth 재호출 | 응답 흉내 (+clock) | P1 | `SimpleAuthConfirmContent.tsx:49-112` |
| PL-033 | 에러 | 사업자 아님(nobman) | logout | mobile | hometax/load `{success:false,errorCode:'E0010'}` | 수집 → "나가기" → "진단 받아보기" → "새로 입력" | `/tax-check/collection/error?error=nobman` "사업자가 아니면 사업 세무 진단이 어려워요" · 이후 "진단 받아보기" 는 바로 nobman(localStorage `nobmanErrorSeen`) · "새로 입력" 은 미리 채우기 없음 | 응답 흉내 | P1 | `NoBmanErrorContent.tsx:20-52` |
| PL-034 | 에러 | 수집 실패·도중 나가기 | logout | mobile | ① load 500 ② diagnosis `{success:false}` ③ 지연 | ①② 수집 ③ 나가기 → "나가기" | ①② "오류가 발생하여 검진을 완료하지 못했어요" + 서버 메시지 · "다시 시도" → simple-auth ③ "정말 나가시겠어요?" → `/tax-check` · 늦은 응답이 결과로 끌고 가지 않음 | 응답 흉내 | P1 | `CollectionErrorContent.tsx:26-43`, `CollectionHeader.tsx:18-40` |
| PL-035 | 에러 | 직접 진입 가드·`?tin` 분기 | logout | desktop | localStorage 비움 | ① `/tax-check/collection` ② `/tax-check/result` ③ confirm → "인증 완료" ④ `/tax-check?tin=1234567890` → "진단 받아보기" | ① "간편인증 후 이용해주세요." → simple-auth ② "진단 결과" 만, 본문 비어 있음 ③ "카카오톡에서 인증을 완료해주세요." ④ `/tax-check/collection`(load 건너뛰고 분석만) | 스모크 / 응답 흉내(④) | P1 | `CollectionContent.tsx:112-133` |
| PL-036 | 흐름 | 결과 상세 drawer·recharts | logout | 둘다 | 경영지표 3개년(−5·10·8%) · 업종 비교(백분위 80·70) | 경영 "상세" → "내 사업장의 매출·소득" → "확인" | 선 그래프 "−5%" · 음수라 0 점선 · **"상위 25%"** · 막대 "평균"·"상위 20%"·"상위 30%" | 응답 흉내 (+스크린샷) | P1 | `ManagementDetailDrawer.tsx:73-117,132,174-189` |
| PL-037 | 흐름 | 결과 CTA·공유 | logout | 둘다 | PL-031 결과 | "환급 신청하기" · "bzc;로 관리 받아보세요" · "주변 사장님에게 세무 진단 추천" · "다시 조회해보기" · "비즈넵 앱에서 쉽게 해결하세요" | 새 창 `refund.bznav.com/auth/sign-in?utm_source=plustaxcheck…` · `care.bznav.com?…plustaxcheck_btm_additional_tax` · 공유 `/tax-check?utm_…plustaxcheck_share` + "링크를 복사하였습니다." · 다시 조회 → simple-auth · 앱 `abr.ge/k6l8cw?…` | 씬 | P1 | `RefundDetailDrawer.tsx:135-142`, `MenuList.tsx:25-75` |
| PL-038 | 에러 | 결과 일부 누락 시 깨짐 (버그 후보) | logout | mobile | `analysisResult` = `{종합등급:'양호'}` 만 | `/tax-check/result` | `ResultCardList.tsx:29` 가 `환급진단.등급` 을 조건 없이 읽어 TypeError 예상(추측) | 응답 흉내 (storage) | P2 | `ResultCardList.tsx:20-41` |
| PL-039 | 흐름 | 세무 콘텐츠 상세 (노션) | logout | 둘다 | 실제 slug(샘플 필요) | `/tax-content/<slug>` → 공유 → "보러가기" → 스크롤 → 맨 위 | h1 노션 title(없으면 slug) · 날짜 "YYYY. M. D." · 띠 배너 "다양한 세무 소식, 비즈넵 앱으로 보세요"·"보러가기" → `abr.ge/iwcvmc?id=<slug>` · 공유 `abr.ge/2vsj3c3?id=<slug>` · "페이지 최상단으로 이동" · 앱이면 배너 없음 | 스모크 (샘플 필요) | P1 | `tax-content/[slug]/page.tsx:44-68` |
| PL-040 | 에러 | 잘못된 slug·노션 실패 | logout | 둘다 | – | ① `/tax-content/없는-slug-zzz` ② `/tax-content` ③ NOTION env 틀림 | ① **404 가 아니라 HTTP 200** "세무 콘텐츠를 불러오지 못했어요"/"빠른 시간 내에 해결하고 다시 찾아뵐게요. 불편을 드려 죄송합니다." ② Next 기본 404 ③ ①과 같음 + 서버 로그 | 스모크 / 수동(③) | P1 | `[slug]/page.tsx:48-72`, `TaxContentErrorView.tsx:13-31` |
| PL-041 | 흐름 | 운세 조회 성공 | logout | 둘다 | mock `POST **/api/open/saju` (사업운 85·재물운 82) | `2368800397` → "운세 조회하기" | "236-88-00397" · "운세를 보고 있어요" · "좋은 날" · 85/82 · 재물운 80↑ 환급 배너 `ab.bznav.com/ybnb68`, 미만 케어 `ac.bznav.com/vpzegf` · localStorage `bznav_last_business_number`·`bznav_fortune_cache_<번호>` | 응답 흉내 | P0 | `FortuneEntryForm.tsx:26-77`, `FortuneResultSection.tsx:12-33` |
| PL-042 | 에러 | 운세 검증·API 실패 | logout | mobile | `/fortune` | ① `2368800398`(체크섬) ② `{success:false}` ③ 500 | ① "올바른 사업자번호를 입력해주세요." ② "사업자번호를 다시 확인해주세요." ③ "조회를 실패했어요. 다시 한번 입력해주세요." | 응답 흉내 | P1 | `bizno-schema.ts:5-13`, `use-fortune-query.ts:13-16,39-60` |
| PL-043 | 흐름 | 운세 재방문·번호 변경·공유 | logout | desktop | PL-041 뒤 | ① 새로고침 ② "다른 사업자번호로 조회하기" → 같은 번호 ③ "주변 사장님에게 공유하기" | ① saju 안 부르고 캐시 ② "기존과 동일한 사업자번호예요." ③ `https://plus.bznav.com/fortune/share` 복사 + "링크를 복사했어요" | 응답 흉내 | P2 | `use-fortune.ts:46-67,96-110` |
| PL-044 | 흐름 | 로그인 간편인증 미리 채우기 | login | mobile | `B_AT*` + mock `GET **/oauth/user` · 탈퇴 `{user:{name:'탈퇴고객'}}` | `/tax-check/simple-auth` | 이름·"010-1234-5678"·"1990.01.01" 채워지고 "다음" · 탈퇴고객이면 앱에서만 "잘못된 접근입니다." → `onSignOut` | 응답 흉내 / 수동(앱) | P2 | `SimpleAuthContent.tsx:100-126` |

## 계산 정확도 근거
- 계산 로직 8개: `lib/utils/calc/{vat,breakeven,holiday-pay,salary-actual,salary-contract,store-sales,simple-vat,tax-penalty}.ts` · 요율·상수 `lib/constants/calc/*.ts`(4대보험 2026 — 국민연금 4.75%(41만~659만) · 건강 3.595% · 장기요양 13.14% · 고용 0.9% · 간이세액표 `simplified-income-tax-table.ts` · 간이과세 업종 부가율 · 가산세 감면율 무신고 50/30/20%, 과소 90/75/50/30/20/10% · 주휴 시급 10,320)
- 기대 숫자는 **코드 로직을 Python 으로 옮겨 계산한 값** — 앱(JS)에서 돌려 보지 않았다. 곱셈은 IEEE double 로 같고, Python `round`(짝수 반올림)와 JS `Math.round` 가 다른 .5 경계 값은 위 샘플에 없다

## 확인 못 한 것·추측
- dev 기준 — 줄 번호가 prd 와 조금 다를 수 있다
- 노션 실제 slug·페이지 id 샘플 없음(노션 DB 에서 받아야 함, env 미열람) · tax-content 목록은 plus-web 에 없음(앱에도 검색되지 않음)
- PL-038(TypeError)·PL-030(로딩 남음)은 코드만 읽은 추측 · PL-021 같은 날 감면 50% 가 의도인지
- "재인증 요청하기$>;" 의 `$>;` 는 DS 아이콘 표기로 추측 · 결과 숫자는 슬롯 애니메이션(~1초) — dp-logs 는 `NEXT_PUBLIC_PLUS_API_SERVER` 가 있을 때만 나간다(env 미확인)
- 간이과세 7월 기준은 브라우저 `new Date()` — 1~6월에 돌리면 PL-015 단계 문구가 달라진다 · kakao `kakaotalk://` 자동화 동작 미확인 · 앱 웹뷰 판별 규칙(`@repo/platform`) 미확인

## scripts/qa 로 옮길 때
- `routes/plus-web.json`: devPort 3400 · signInPath 없음 · profiles logout·login(B_AT) · `"/tax-content/[slug]": { "samples": [], "note": "노션 DB name 컬럼 slug" }` · `"/tax-check/simple-auth/confirm": { "entry": "/tax-check/simple-auth" }` · collection·result 는 localStorage 주입 또는 entry
- 흉내 API(모두 클라이언트): `**/api/hometax/simple-auth` · `**/api/hometax/auth-status/*` · `**/api/hometax/load` · `**/api/tax-diagnosis-v2/` · `**/terms` · `**/oauth/user` · `**/app/upsert-app-user` · `**/api/open/saju` · `**/api/dp-logs`
- 러너에 필요한 것: App Router 화면 목록 · **요청 본문 기대 확인 단계**(dp-logs `payload.result` — 계산 TC 의 정답 확인) · localStorage 주입 단계 · 시계 조작(`page.clock`) · 클립보드 확인
