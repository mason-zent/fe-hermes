# 07. 환급 조회

> [README](./README.md) · API 11개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [07-01](#07-01) | `searchRefundV2` | 변경 | 환급 조회 시작 | | ☐ | ☐ |
| [07-02](#07-02) | `checkSearchStatus` | 조회 | 조회 진행 상태 확인(폴링) | | ☐ | ☐ |
| [07-03](#07-03) | `checkRefund` | 조회 | 종합소득세 환급 조회 결과 확인 | | ☐ | ☐ |
| [07-04](#07-04) | `checkTritxRefund` | 조회 | 양도세 환급 조회 결과 확인 | | ☐ | ☐ |
| [07-05](#07-05) | `checkLookPage` | 변경 | 결과 화면 열람 확인·기록 | | ☐ | ☐ |
| [07-06](#07-06) | `searchHometaxRefundResult` | 변경 | 알림톡 링크로 환급 결과 조회 | | ☐ | ☐ |
| [07-07](#07-07) | `searchHometaxRefundResultByLogin` | 변경 | 로그인 상태로 환급 결과 조회 | | ☐ | ☐ |
| [07-08](#07-08) | `reload` | 변경 | 알림톡 링크로 다시 수집 | | ☐ | ☐ |
| [07-09](#07-09) | `loadEmployeeIncrease` | 변경 | 고용 증대 추가 수집 | | ☐ | ☐ |
| [07-10](#07-10) | `searchPersonalDeductionByLogin` | 변경 | 인적공제 수집 | | ☐ | ☐ |
| [07-11](#07-11) | `applyRefundPossibleAlarm` | 변경 | 환급 가능 알림 신청 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `AffiliateName`: `Pincrux` · `Buzzvil` · `Adison` · `Tnk`
- `CancelStage`: `Canceling` · `CancelPossibleBeforeDeclare` · `CancelPossibleAfterDeclare` · `CancelPossibleImmediately` · `CancelImpossible`
- `CorpTypeEnum`: `INDIS` · `CORPS`
- `PageType`: `SearchRefundAmt`
- `RefundStage`: `Unknown` · `Review` · `Declare` · `RefundPreDetermine` · `RefundDetermine` · `RefundCompleteA` · `RefundCompleteB` · `PaymentComplete`
- `RefundStatus`: `None` · `Impossible` · `Possible` · `Complete` · `ApplyImpossible` · `ApplyPossible` · `ApplyComplete` · `Retry` · `RefundImpossible` · `RefundFinish`
- `SearchHometaxRefundResult`: `None` · `Reject` · `Accept`
- `ErrorType`(에러 코드) 은 [README 5-3](./README.md#5-3-에러-코드)

## 프론트 작업 파일 (17) — `apps/refund-web/` 기준

- `components/follow-up/personal-deduction/PersonalDeductionCollectContent.tsx`
- `components/tax-refund/lookup/request/LookupRefundRequestContent.tsx`
- `components/tax-refund/lookup/result/under-refund/RefundAvailabilityAlarmButton.tsx`
- `graphql/mutation/tax-refund/apply-refund-possible-alarm.ts`
- `graphql/mutation/tax-refund/check-look-page.ts`
- `graphql/mutation/tax-refund/search-hometax-refund.ts`
- `graphql/mutation/tax-refund/search-personal-deduction-by-login.ts`
- `graphql/mutation/tax-refund/search-refund-v2.ts`
- `graphql/query/tax-refund/check-refund.ts`
- `graphql/query/tax-refund/check-search-status.ts`
- `graphql/query/tax-refund/check-tritx-refund.ts`
- `lib/hooks/marketing/use-affiliate.ts`
- `lib/hooks/refund/api/use-check-look-page.ts`
- `lib/hooks/refund/api/use-check-search-status.ts`
- `lib/hooks/refund/api/use-search-refund.ts`
- `lib/hooks/refund/follow-up/use-follow-up-request.ts`
- `lib/types/follow-up.ts`

## API 상세

---

<a id="07-01"></a>

### 07-01 `searchRefundV2` — 환급 조회 시작

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `corpType` | `CorpTypeEnum` | ✅ | 보냄 |  |
| `refundToken` | `string` | ✅ | 보냄 |  |
| `regNo` | `string | null` |  | 보냄 |  |
| `clientId` | `string | null` |  | 보냄 | SSO 클라이언트 ID |
| `reSearchRequestId` | `number | null` |  | 보냄 | 다시조회 대상 ID(종소세) |
| `tritxReSearchRequestId` | `number | null` |  | 보냄 | 다시조회 대상 ID(양도세) |
| `optionalTerms` | `OptionalTerms | null` |  | 보냄 |  |
| `optionalTerms.marketingAgree` | `boolean` | ✅ | 보냄 |  |
| `optionalTerms.thirdAgree` | `boolean` | ✅ | 보냄 |  |
| `searchUtm` | `RefundUtm | null` |  | 보냄 |  |
| `searchUtm.source` | `string | null` |  | 보냄 |  |
| `searchUtm.medium` | `string | null` |  | 보냄 |  |
| `searchUtm.campaign` | `string | null` |  | 보냄 |  |
| `searchUtm.term` | `string | null` |  | 보냄 |  |
| `searchUtm.content` | `string | null` |  | 보냄 |  |
| `promotionData` | `PromotionData | null` |  | 보냄 |  |
| `promotionData.inviteCode` | `string` | ✅ | 보냄 |  |
| `promotionData.promotionCode` | `string` | ✅ | 보냄 |  |
| `affiliateData` | `AffiliateData | null` |  | 보냄 |  |
| `affiliateData.name` | `AffiliateName` | ✅ | 보냄 |  |
| `affiliateData.appKey` | `string | null` |  | 보냄 | 제휴사 앱 키 (있는 경우) |
| `affiliateData.trackingId` | `string` | ✅ | 보냄 | 제휴사 트래킹 ID |
| `metaProperties` | `string | null` |  | 보냄 | 메타 픽셀 전환 API 데이터 (JSON String) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SearchRefundV2Output`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_HOMETAX_ETC` `ERR_HOMETAX_IMPOSSIBLE` `ERR_HOMETAX_NO_BMAN`

**프론트**
- 연산: `searchRefundV2Mutation` (`graphql/mutation/tax-refund/search-refund-v2.ts`)
- 쓰는 파일 (3): `components/tax-refund/lookup/request/LookupRefundRequestContent.tsx`, `lib/hooks/marketing/use-affiliate.ts`, `lib/hooks/refund/api/use-search-refund.ts`

---

<a id="07-02"></a>

### 07-02 `checkSearchStatus` — 조회 진행 상태 확인(폴링)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 폴링 — 3초마다, 조회가 끝날 때까지. 화면 진입 시 진행 중인 조회가 있는지 먼저 한 번 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `corpType` | `CorpTypeEnum` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckSearchStatusOutput`)

```ts
{
  result: boolean;
  progress: string | null;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  refundInfo: { // RefundHistoryType
    refundId: string;
    refundStatus: RefundStatus;
    refundStage: RefundStage | null;
    refundAmount: string;
    snmcSpcTxreAmt: number | null;
    cenSnmcTxreAmt: number | null;
    empIncrEtrpTxamtDdcAmt: number | null;
    intgEmpTxamtDdcAmt: number | null;
    sctyInfeeTxamtDdcAmt: number | null;
    crfwDficRssmAmt: number | null;
    reSearchRequestId: number | null;
    businessInfo: { // BusinessInfo
      hometaxBizName: string | null;
      hometaxBizNo: string | null;
      taxpayerName: string | null;
    } | null;
  } | null;
  tritxRefundInfo: { // RefundHistoryType
    refundId: string;
    refundStatus: RefundStatus;
    refundStage: RefundStage | null;
    refundAmount: string;
    tritxReSearchRequestId: number | null;
    businessInfo: { // BusinessInfo
      hometaxBizName: string | null;
      hometaxBizNo: string | null;
      taxpayerName: string | null;
    } | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_HOMETAX_ETC` `ERR_HOMETAX_IMPOSSIBLE` `ERR_HOMETAX_NO_BMAN`

**프론트**
- 연산: `checkSearchStatusQuery` (`graphql/query/tax-refund/check-search-status.ts`)
- 쓰는 파일 (2): `components/tax-refund/lookup/request/LookupRefundRequestContent.tsx`, `lib/hooks/refund/api/use-check-search-status.ts`

---

<a id="07-03"></a>

### 07-03 `checkRefund` — 종합소득세 환급 조회 결과 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckRefundOutput`)

```ts
{
  result: boolean;
  refundStage: RefundStage | null;
  refundStatus: RefundStatus | null;
  cancelStage: CancelStage | null;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `checkRefundQuery` (`graphql/query/tax-refund/check-refund.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)

---

<a id="07-04"></a>

### 07-04 `checkTritxRefund` — 양도세 환급 조회 결과 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckRefundOutput`)

```ts
{
  result: boolean;
  refundStage: RefundStage | null;
  refundStatus: RefundStatus | null;
  cancelStage: CancelStage | null;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `checkTritxRefundQuery` (`graphql/query/tax-refund/check-tritx-refund.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)

---

<a id="07-05"></a>

### 07-05 `checkLookPage` — 결과 화면 열람 확인·기록

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundId` | `string` | ✅ | 보냄 |  |
| `pageType` | `PageType` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckLookPageOutput`)

```ts
{
  result: boolean;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `checkLookPageMutation` (`graphql/mutation/tax-refund/check-look-page.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/api/use-check-look-page.ts`

---

<a id="07-06"></a>

### 07-06 `searchHometaxRefundResult` — 알림톡 링크로 환급 결과 조회

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundToken` | `string` | ✅ | 보냄 |  |
| `code` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SearchHometaxRefundResultOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  taxpayerName: string | null;
  hometaxRefundResult: SearchHometaxRefundResult | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_HOMETAX_ETC` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `searchHometaxRefundResultMutation` (`graphql/mutation/tax-refund/search-hometax-refund.ts`)
- 쓰는 파일 (2): `lib/hooks/refund/follow-up/use-follow-up-request.ts`, `lib/types/follow-up.ts`

---

<a id="07-07"></a>

### 07-07 `searchHometaxRefundResultByLogin` — 로그인 상태로 환급 결과 조회

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundToken` | `string` | ✅ | 보냄 |  |
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SearchHometaxRefundResultOutput`)

```ts
{
  result: boolean;
  hometaxRefundResult: SearchHometaxRefundResult | null;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  taxpayerName: string | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_HOMETAX_ETC` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `searchHometaxRefundResultByLoginMutation` (`graphql/mutation/tax-refund/search-hometax-refund.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/follow-up/use-follow-up-request.ts`

---

<a id="07-08"></a>

### 07-08 `reload` — 알림톡 링크로 다시 수집

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundToken` | `string` | ✅ | 보냄 |  |
| `code` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ReloadOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  taxpayerName: string | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_HOMETAX_ETC` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `searchHometaxRefundReloadMutation` (`graphql/mutation/tax-refund/search-hometax-refund.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/follow-up/use-follow-up-request.ts`

---

<a id="07-09"></a>

### 07-09 `loadEmployeeIncrease` — 고용 증대 추가 수집

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundToken` | `string` | ✅ | 보냄 |  |
| `code` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `EmployeeIncreaseOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  taxpayerName: string | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_HOMETAX_ETC` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `searchHometaxRefundLoadEmployeeIncreaseMutation` (`graphql/mutation/tax-refund/search-hometax-refund.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/follow-up/use-follow-up-request.ts`

---

<a id="07-10"></a>

### 07-10 `searchPersonalDeductionByLogin` — 인적공제 수집

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundToken` | `string` | ✅ | 보냄 |  |
| `refundId` | `string | null` |  | 안 보냄 |  |
| `refundHistoryId` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SearchPersonalDeductionOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  name: string | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `searchPersonalDeductionByLoginMutation` (`graphql/mutation/tax-refund/search-personal-deduction-by-login.ts`)
- 쓰는 파일 (1): `components/follow-up/personal-deduction/PersonalDeductionCollectContent.tsx`

---

<a id="07-11"></a>

### 07-11 `applyRefundPossibleAlarm` — 환급 가능 알림 신청

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ApplyRefundPossibleAlarmOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `RefundAvailabilityAlarmButtonMutation` (`components/tax-refund/lookup/result/under-refund/RefundAvailabilityAlarmButton.tsx`), `applyRefundPossibleAlarmMutation` (`graphql/mutation/tax-refund/apply-refund-possible-alarm.ts`)
- 쓰는 파일 (1): `components/tax-refund/lookup/result/under-refund/RefundAvailabilityAlarmButton.tsx`
