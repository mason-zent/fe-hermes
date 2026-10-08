# 01. 공통·내 정보

> [README](./README.md) · API 10개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [01-01](#01-01) | `me` | 조회 | 내 정보·구독 상태 조회 (스키마 설명 없음) | | ☐ | ☐ |
| [01-02](#01-02) | `orgList` | 조회 | 내 사업장 목록(장부 상태로 거름) (스키마 설명 없음) | | ☐ | ☐ |
| [01-03](#01-03) | `Ledger` | 조회 | 장부 | | ☐ | ☐ |
| [01-04](#01-04) | `getRfndAccs` | 조회 | 등록된 환급 계좌 조회 (스키마 설명 없음) | | ☐ | ☐ |
| [01-05](#01-05) | `registerRfndAcc` | 변경 | 환급 계좌 등록 (스키마 설명 없음) | | ☐ | ☐ |
| [01-06](#01-06) | `findMarketingTerms` | 조회 | 마케팅 수신 동의 조회 (스키마 설명 없음) | | ☐ | ☐ |
| [01-07](#01-07) | `approveMarketingTerms` | 변경 | 마케팅 수신 동의 (스키마 설명 없음) | | ☐ | ☐ |
| [01-08](#01-08) | `withdrawMarketingTerms` | 변경 | 마케팅 수신 동의 철회 (스키마 설명 없음) | | ☐ | ☐ |
| [01-09](#01-09) | `addSubAccount` | 변경 | 부계정 등록 | | ☐ | ☐ |
| [01-10](#01-10) | `mktEvent` | 조회 | 마케팅 이벤트(빌더 랜딩 /events) 조회 (스키마 설명 없음) | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `BookStatusEnum`: `WAIT` · `ONLY_DECLARE` · `BOOK_IN_PROGRESS` · `BOOK_STOP_CANCEL` · `BOOK_STOP_CLOSED`
- `CareRegistrationStatus`: `NOT_DELEGATION` · `IN_PROGRESS` · `UNDER_REVIEW` · `COMPLETED`
- `CareType`: `Vat` · `Book` · `IncomeTax` · `NotSupport`
- `DeductionType`: `ALL` · `DEDUCTIBLE` · `NON_DEDUCTIBLE` · `SIMPLE` · `TAX_FREE` · `PENDING`
- `MarketingTermKey`: `Marketing` · `ItMarketing`
- `TradeType`: `ALL` · `SALES` · `EXPENSE`
- `UtlStatusNm`: `SERVICE_ACTIVE` · `SERVICE_INACTIVE` · `WAITING` · `EMPTY`

## 프론트 작업 파일 (38) — `apps/care-web/` 기준

- `app/(auth)/complete/page.tsx`
- `app/(kakaoTalk-notification)/add-manager/graphql/addSubAccount.ts`
- `app/(kakaoTalk-notification)/add-manager/hooks/useAddSubAccount.ts`
- `app/(kakaoTalk-notification)/add-manager/result/page.tsx`
- `app/(landing)/(performance-landing)/events/graphql/mktEvent.ts`
- `app/(landing)/(performance-landing)/events/page.tsx`
- `app/(login)/login/layout.tsx`
- `app/(my-info)/constants/constant.ts`
- `app/(my-info)/graphql/ledger.ts`
- `app/(my-info)/hooks/useGetOrgOrderBySales.ts`
- `app/(my-info)/hooks/useLedgerSummary.ts`
- `app/(my-info)/my-book/components/AccountHistory.tsx`
- `app/(my-info)/my-book/components/DeductionFilterDrawer.tsx`
- `app/(my-info)/my-book/hooks/useGetAccountBook.ts`
- `app/(my-info)/my-book/hooks/useMyBookFilters.ts`
- `app/(my-info)/my-book/page.tsx`
- `app/(my-info)/my-book/purchase/page.tsx`
- `app/(my-info)/my-book/sales/page.tsx`
- `app/(my-info)/my-book/store/myBookFiltersAtom.ts`
- `app/(my-info)/my-info/components/UserInfo.tsx`
- `app/(my-info)/my-info/graphql/registerRfndAcc.ts`
- `app/(my-info)/my-info/notification/components/NotificationList.tsx`
- `app/(my-info)/my-info/notification/graphql/approveMarketingTerms.ts`
- `app/(my-info)/my-info/notification/graphql/findMarketingTerms.ts`
- `app/(my-info)/my-info/notification/graphql/withdrawMarketingTerms.ts`
- `app/(my-info)/my-info/notification/hooks/useMarketingTerms.ts`
- `app/(my-info)/my-info/refund-account/hooks/useRegisterRefundAccount.ts`
- `app/additional-expense/status/hooks/useOrgList.ts`
- `graphql/getOrgs.ts`
- `graphql/getRfndAccs.ts`
- `graphql/me.ts`
- `hooks/useGetCareUserInfo.ts`
- `hooks/useGetMyOrgs.ts`
- `hooks/useGetOrgOrderBySales.ts`
- `hooks/useGetRefundAccount.ts`
- `libs/kakao/openKakaoTalk.ts`
- `libs/provider/CareUserInfoProvider.tsx`
- `store/userInfoAtom.ts`

## API 상세

---

<a id="01-01"></a>

### 01-01 `me` — 내 정보·구독 상태 조회 (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `MeOutput` · union 2종)

```ts
{
  __typename: 'Me';
  careType: CareType | null;
  serviceStatus: UtlStatusNm | null;
  name: string | null;
  phone: string | null;
  contactPhone: string | null;
  userId: string;
  birthday: string | null;
  hometaxId: string | null;
  isInputTaxAgent: boolean;
  hometaxConnected: boolean | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  isPrepaid: boolean | null;
  isDelegation: boolean;
  isServiceEnd: boolean;
  CareRegistrationStatus: CareRegistrationStatus;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `Me` `TemporaryError`

**프론트**
- 연산: `meQuery` (`graphql/me.ts`)
- 쓰는 파일 (8): `app/(auth)/complete/page.tsx`, `app/(kakaoTalk-notification)/add-manager/result/page.tsx`, `app/(login)/login/layout.tsx`, `app/(my-info)/my-info/components/UserInfo.tsx`, `hooks/useGetCareUserInfo.ts`, `libs/kakao/openKakaoTalk.ts`, `libs/provider/CareUserInfoProvider.tsx`, `store/userInfoAtom.ts`

---

<a id="01-02"></a>

### 01-02 `orgList` — 내 사업장 목록(장부 상태로 거름) (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bookStatus` | `BookStatusEnum[] \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `OrgListOutPut` · union 2종)

```ts
{
  __typename: 'OrgListResult';
  orgList: { // OrgList
    bizName: string;
    bizNo: string;
    bmanTin: string;
    status: string;
    rpnTin: string;
    bookStatus: string;
    closedBizAt: string | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `getOrgsQuery` (`graphql/getOrgs.ts`)
- 쓰는 파일 (1): `hooks/useGetMyOrgs.ts`

---

<a id="01-03"></a>

### 01-03 `Ledger` — 장부

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `input` | `LedgerInput` | ✅ | 보냄 |  |
| `input.bizNos` | `string[]` | ✅ | 보냄 |  |
| `input.startDate` | `unknown /* DateTime */` | ✅ | 보냄 |  |
| `input.endDate` | `unknown /* DateTime */` | ✅ | 보냄 |  |
| `input.tradeType` | `TradeType \| null` |  | 보냄 |  |
| `input.deductionType` | `DeductionType[] \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `LedgerOutput` · union 2종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'LedgerResults';
  status: string;
  ledgers: { // LedgerResult
    bizNo: string;
    sales: { // SalesType
      amount: number;
      price: number | null;
      vat: number | null;
    };
    purchase: { // PurchaseType
      amount: number;
      price: number | null;
      vat: number | null;
    };
    bills: { // BillType
      id: string;
      billDate: string;
      billType: string;
      partnerName: string;
      tradeAmount: number;
      gbn: string;
      deductionType: DeductionType | null;
    }[] | null;
  }[] | null;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `LedgerResults`

**프론트**
- 연산: `ledgerQuery` (`app/(my-info)/graphql/ledger.ts`)
- 쓰는 파일 (13): `app/(my-info)/constants/constant.ts`, `app/(my-info)/hooks/useGetOrgOrderBySales.ts`, `app/(my-info)/hooks/useLedgerSummary.ts`, `app/(my-info)/my-book/components/AccountHistory.tsx`, `app/(my-info)/my-book/components/DeductionFilterDrawer.tsx`, `app/(my-info)/my-book/hooks/useGetAccountBook.ts`, `app/(my-info)/my-book/hooks/useMyBookFilters.ts`, `app/(my-info)/my-book/page.tsx`, `app/(my-info)/my-book/purchase/page.tsx`, `app/(my-info)/my-book/sales/page.tsx`, `app/(my-info)/my-book/store/myBookFiltersAtom.ts`, `app/additional-expense/status/hooks/useOrgList.ts`, `hooks/useGetOrgOrderBySales.ts`

---

<a id="01-04"></a>

### 01-04 `getRfndAccs` — 등록된 환급 계좌 조회 (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetRfndAccsOutput` · union 2종)

```ts
{
  __typename: 'GetRfndAccsResult';
  acc: { // RfndAcc
    accno: string;
    bankNm: string;
    bankCd: string;
    dpsrNm: string;
  }[];
  count: number;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `getRfndAccsQuery` (`graphql/getRfndAccs.ts`)
- 쓰는 파일 (1): `hooks/useGetRefundAccount.ts`

---

<a id="01-05"></a>

### 01-05 `registerRfndAcc` — 환급 계좌 등록 (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bankCd` | `string` | ✅ | 보냄 |  |
| `accno` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RegisterRfndAccOutput` · union 5종)

```ts
{
  __typename: 'RegisterRfndAccSucceed';
  message: string;
}
| {
  __typename: 'AccountNumberNotValidOutput';
  message: string;
}
| {
  __typename: 'AccountInquiryRequestFailedOutput';
  message: string;
}
| {
  __typename: 'DepositorNotMatchedOutput';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `RegisterRfndAccSucceed`

**프론트**
- 연산: `registerRfndAccMutation` (`app/(my-info)/my-info/graphql/registerRfndAcc.ts`)
- 쓰는 파일 (1): `app/(my-info)/my-info/refund-account/hooks/useRegisterRefundAccount.ts`

---

<a id="01-06"></a>

### 01-06 `findMarketingTerms` — 마케팅 수신 동의 조회 (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `FindMarketingTermsOutput` · union 2종)

```ts
{
  __typename: 'FindMarketingTermsSucceed';
  terms: { // MarketingTerm
    termKey: MarketingTermKey;
    isApproved: boolean;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `FindMarketingTermsSucceed` `TemporaryError`

**프론트**
- 연산: `findMarketingTermsQuery` (`app/(my-info)/my-info/notification/graphql/findMarketingTerms.ts`)
- 쓰는 파일 (1): `app/(my-info)/my-info/notification/hooks/useMarketingTerms.ts`

---

<a id="01-07"></a>

### 01-07 `approveMarketingTerms` — 마케팅 수신 동의 (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `termKeys` | `MarketingTermKey[]` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `MarketingTermsOutput` · union 2종)

```ts
{
  __typename: 'MarketingTermsSucceed';
  terms: { // MarketingTerm
    termKey: MarketingTermKey;
    isApproved: boolean;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `MarketingTermsSucceed` `TemporaryError`

**프론트**
- 연산: `approveMarketingTermsMutation` (`app/(my-info)/my-info/notification/graphql/approveMarketingTerms.ts`)
- 쓰는 파일 (2): `app/(my-info)/my-info/notification/components/NotificationList.tsx`, `app/(my-info)/my-info/notification/hooks/useMarketingTerms.ts`

---

<a id="01-08"></a>

### 01-08 `withdrawMarketingTerms` — 마케팅 수신 동의 철회 (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `termKeys` | `MarketingTermKey[]` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `MarketingTermsOutput` · union 2종)

```ts
{
  __typename: 'MarketingTermsSucceed';
  terms: { // MarketingTerm
    termKey: MarketingTermKey;
    isApproved: boolean;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `MarketingTermsSucceed` `TemporaryError`

**프론트**
- 연산: `withdrawMarketingTermsMutation` (`app/(my-info)/my-info/notification/graphql/withdrawMarketingTerms.ts`)
- 쓰는 파일 (1): `app/(my-info)/my-info/notification/hooks/useMarketingTerms.ts`

---

<a id="01-09"></a>

### 01-09 `addSubAccount` — 부계정 등록

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `token` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `AddSubAccountOutput` · union 6종)

```ts
{
  __typename: 'AddSubAccountSucceed';
  message: string;
  companyOwnerName: string;
}
| {
  __typename: 'AlreadySubAccount';
  message: string;
  companyOwnerName: string;
}
| {
  __typename: 'CareUserForbiddenSubAccount';
  message: string;
  companyOwnerName: string;
}
| {
  __typename: 'ExpiredSubAccountLink';
  message: string;
  companyOwnerName: string;
}
| {
  __typename: 'SubAccountLimitExceeded';
  message: string;
  companyOwnerName: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `TemporaryError`

**프론트**
- 연산: `addSubAccountMutation` (`app/(kakaoTalk-notification)/add-manager/graphql/addSubAccount.ts`)
- 쓰는 파일 (1): `app/(kakaoTalk-notification)/add-manager/hooks/useAddSubAccount.ts`

---

<a id="01-10"></a>

### 01-10 `mktEvent` — 마케팅 이벤트(빌더 랜딩 /events) 조회 (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `urlPath` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `MktEventOutput` · union 2종)

```ts
{
  __typename: 'MktEventResult';
  json: unknown /* JSON */;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `MktEventResult` `TemporaryError`

**프론트**
- 연산: `mktEventQuery` (`app/(landing)/(performance-landing)/events/graphql/mktEvent.ts`)
- 쓰는 파일 (1): `app/(landing)/(performance-landing)/events/page.tsx`
