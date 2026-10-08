# 13. 추가경비 증빙·사업용 카드

> [README](./README.md) · API 13개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [13-01](#13-01) | `bkpAddXpsPrfList` | 조회 | 추가경비증빙 목록 조회 | | ☐ | ☐ |
| [13-02](#13-02) | `bkpAddXpsPrfInfo` | 조회 | 추가경비증빙 단건 조회 | | ☐ | ☐ |
| [13-03](#13-03) | `bkpAddXpsPrfParsingMultiple` | 변경 | 추가경비증빙 파일 다중 파싱 (최대 10개) | | ☐ | ☐ |
| [13-04](#13-04) | `insertBkpAddXpsPrfInfo` | 변경 | 추가경비증빙 등록 | | ☐ | ☐ |
| [13-05](#13-05) | `updateBkpAddXpsPrfInfo` | 변경 | 추가경비증빙 수정 | | ☐ | ☐ |
| [13-06](#13-06) | `deleteBkpAddXpsPrfInfo` | 변경 | 추가경비증빙 삭제 | | ☐ | ☐ |
| [13-07](#13-07) | `getXpsPrfSbmsBrkds` | 조회 | 경비증빙제출내역 목록 조회 | | ☐ | ☐ |
| [13-08](#13-08) | `getXpsPrfSbmsBrkd` | 조회 | 경비증빙제출내역 단건 조회 | | ☐ | ☐ |
| [13-09](#13-09) | `getCardCompanies` | 조회 | 카드사 목록 조회 | | ☐ | ☐ |
| [13-10](#13-10) | `listCards` | 조회 | 카드 리스트 or 새로고침 | | ☐ | ☐ |
| [13-11](#13-11) | `registerCard` | 변경 | 카드 등록 | | ☐ | ☐ |
| [13-12](#13-12) | `updateCard` | 변경 | 카드 수정 | | ☐ | ☐ |
| [13-13](#13-13) | `removeCard` | 변경 | 카드 삭제 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `BkpAddXpsApplyStatusType`: `UNCONFIRMED` · `NOT_APPLIED` · `APPLIED`
- `CreditCardReqStatus`: `Failed` · `InProgress` · `Completed`
- `CreditCardVldtStatus`: `Registered` · `Expired` · `NoVldtTerm` · `AboutToExpire`
- `ExpenseEvidenceType`: `SIMPLE` · `CEREMONY` · `HAND_TAX` · `HAND_BILL` · `ETC`
- `MateTypeNm`: `RECEIPT` · `TAXFREE` · `YEAREND`
- `StatusTypeEnum`: `Success` · `FailureOfRepVerification` · `NoBizno` · `NoPayroll` · `InvalidBizno` · `InvalidRegno` · `HomeTaxNotConnected` · `AlreadyRegisteredCard` · `Unknown`

## 프론트 작업 파일 (42) — `apps/care-web/` 기준

- `app/additional-expense/constants/event.ts`
- `app/additional-expense/history-legacy/components/DailyExpenseList.tsx`
- `app/additional-expense/history-legacy/graphql/getXpsPrfSbmsBrkd.ts`
- `app/additional-expense/history-legacy/graphql/getXpsPrfSbmsBrkds.ts`
- `app/additional-expense/history-legacy/hooks/useGetLegacyExpense.ts`
- `app/additional-expense/history-legacy/hooks/useGetLegacyExpenseList.ts`
- `app/additional-expense/hooks/useDeleteAdditionalExpenseInfo.ts`
- `app/additional-expense/hooks/useUpdateExpenseInfoRequester.ts`
- `app/additional-expense/status/components/ExpenseList.tsx`
- `app/additional-expense/status/detail/components/ExpenseTableRow.tsx`
- `app/additional-expense/status/detail/hooks/useBkpAddXpsPrfInfo.ts`
- `app/additional-expense/status/detail/hooks/useUpdateExpenseSingleField.ts`
- `app/additional-expense/status/detail/utils/getEditContents.tsx`
- `app/additional-expense/status/detail/utils/getExpenseType.ts`
- `app/additional-expense/status/graphql/bkpAddXpsPrfInfo.ts`
- `app/additional-expense/status/graphql/bkpAddXpsPrfList.ts`
- `app/additional-expense/status/graphql/deleteBkpAddXpsPrfInfo.ts`
- `app/additional-expense/status/graphql/updateBkpAddXpsPrfInfo.ts`
- `app/additional-expense/status/hooks/useExpenseListByYear.ts`
- `app/additional-expense/status/store/expenseEditType.ts`
- `app/additional-expense/status/types/expenseFieldType.ts`
- `app/additional-expense/submit/graphql/bkpAddXpsPrfParsingMultiple.ts`
- `app/additional-expense/submit/graphql/insertBkpAddXpsPrfInfo.ts`
- `app/additional-expense/submit/hooks/useInsertAdditionalExpenseInfo.ts`
- `app/additional-expense/submit/hooks/useOcrParsing.ts`
- `app/additional-expense/submit/input/constants/prfTypeConfig.ts`
- `app/additional-expense/submit/input/page.tsx`
- `app/business-card/graphql/getCardCompanies.ts`
- `app/business-card/graphql/listCards.ts`
- `app/business-card/graphql/registerCard.ts`
- `app/business-card/graphql/removeCard.ts`
- `app/business-card/graphql/updateCard.ts`
- `app/business-card/hooks/useRemoveBusinessCard.ts`
- `app/business-card/status/components/RegistCompleteCardList.tsx`
- `app/business-card/status/detail/components/BusinessCardExpireDateInfo.tsx`
- `app/business-card/status/detail/components/BusinessCardTitle.tsx`
- `app/business-card/status/detail/components/CardExpireDateContentCell.tsx`
- `app/business-card/status/hooks/useGetBusinessCardList.ts`
- `app/business-card/status/hooks/useListCardsQuery.ts`
- `app/business-card/status/hooks/useUpdateCard.ts`
- `app/business-card/submit/input/hooks/useGetCardCompanies.ts`
- `app/business-card/submit/input/hooks/useRegisterCard.ts`

## API 상세

---

<a id="13-01"></a>

### 13-01 `bkpAddXpsPrfList` — 추가경비증빙 목록 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `attrYr` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `BkpAddXpsPrfSummaryOutput` · union 3종)

```ts
{
  __typename: 'BkpAddXpsSummary';
  startYear: string;
  totalAmt: number | null;
  bkpAddXpsSummaryList: { // BkpAddXpsPrfSummaryItem
    bkpAddXpsPrfId: number;
    clplcTnm: string | null;
    wrtDt: string | null;
    totaAmt: number | null;
    prfType: ExpenseEvidenceType | null;
    trtStatNm: BkpAddXpsApplyStatusType | null;
  }[];
}
| {
  __typename: 'UnknownDelegateAt';
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

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `bkpAddXpsPrfListQuery` (`app/additional-expense/status/graphql/bkpAddXpsPrfList.ts`)
- 쓰는 파일 (2): `app/additional-expense/status/components/ExpenseList.tsx`, `app/additional-expense/status/hooks/useExpenseListByYear.ts`

---

<a id="13-02"></a>

### 13-02 `bkpAddXpsPrfInfo` — 추가경비증빙 단건 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `bkpAddXpsPrfId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `BkpAddXpsPrfInfoOutput` · union 2종)

```ts
{
  __typename: 'BkpAddXpsPrfInfo';
  txamt: number | null;
  trsCntn: string | null;
  clplcTnm: string | null;
  wrtDt: string | null;
  url: string | null;
  clplcBsno: string | null;
  fileNm: string | null;
  thumbnailUrl: string | null;
  splCft: number | null;
  prfType: ExpenseEvidenceType | null;
  trtStatNm: string;
  totaAmt: number | null;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `bkpAddXpsPrfInfoQuery` (`app/additional-expense/status/graphql/bkpAddXpsPrfInfo.ts`)
- 쓰는 파일 (8): `app/additional-expense/constants/event.ts`, `app/additional-expense/status/detail/components/ExpenseTableRow.tsx`, `app/additional-expense/status/detail/hooks/useBkpAddXpsPrfInfo.ts`, `app/additional-expense/status/detail/hooks/useUpdateExpenseSingleField.ts`, `app/additional-expense/status/detail/utils/getEditContents.tsx`, `app/additional-expense/status/detail/utils/getExpenseType.ts`, `app/additional-expense/status/store/expenseEditType.ts`, `app/additional-expense/status/types/expenseFieldType.ts`

---

<a id="13-03"></a>

### 13-03 `bkpAddXpsPrfParsingMultiple` — 추가경비증빙 파일 다중 파싱 (최대 10개)

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) · **파일 업로드(multipart)** |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `append` | `File /* Upload — multipart */[]` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `TBkpAddXpsPrfUploadOutput` · union 2종)

```ts
{
  __typename: 'BkpAddXpsPrfUploadParsingMultipleSucceed';
  message: string;
  bkpAddXpsPrfInfoList: { // BkpAddXpsParsingInfo
    fileNm: string | null;
    url: string | null;
    tmpFileId: number | null;
    clplcTnm: string | null;
    clplcBsno: string | null;
    wrtDt: string | null;
    trsCntn: string | null;
    splCft: number | null;
    txamt: number | null;
    totaAmt: number | null;
    prfType: ExpenseEvidenceType | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `BkpAddXpsPrfUploadParsingMultipleSucceed`

**프론트**
- 연산: `bkpAddXpsPrfParsingMultipleMutation` (`app/additional-expense/submit/graphql/bkpAddXpsPrfParsingMultiple.ts`)
- 쓰는 파일 (1): `app/additional-expense/submit/hooks/useOcrParsing.ts`

---

<a id="13-04"></a>

### 13-04 `insertBkpAddXpsPrfInfo` — 추가경비증빙 등록

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
| `bkpAddXpsPrf` | `BkpAddXpsPrfSaveInputType` | ✅ | 보냄 |  |
| `bkpAddXpsPrf.bmanTin` | `string` | ✅ | 보냄 |  |
| `bkpAddXpsPrf.attrYr` | `string` | ✅ | 보냄 |  |
| `bkpAddXpsPrf.tmpFileId` | `number \| null` |  | 보냄 | 임시 파일 Id |
| `bkpAddXpsPrf.clplcTnm` | `string \| null` |  | 보냄 | 거래처 명(경조 당사자 이름) |
| `bkpAddXpsPrf.clplcBsno` | `string \| null` |  | 보냄 | 거래처 사업자번호 |
| `bkpAddXpsPrf.wrtDt` | `string \| null` |  | 보냄 | 작성일자/거래일자(YYYYMMDD) |
| `bkpAddXpsPrf.trsCntn` | `string \| null` |  | 보냄 | 거래 내용(지출 내용) |
| `bkpAddXpsPrf.splCft` | `number \| null` |  | 보냄 | 공급가액 |
| `bkpAddXpsPrf.txamt` | `number \| null` |  | 보냄 | 세액(부가세액) |
| `bkpAddXpsPrf.totaAmt` | `number \| null` |  | 보냄 | 합계금액 |
| `bkpAddXpsPrf.prfType` | `ExpenseEvidenceType \| null` |  | 보냄 | 증빙유형 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `BkpAddXpsPrfInsertOutput` · union 3종)

```ts
{
  __typename: 'BkpAddXpsPrfInsertSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'BsnoInvalid';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `BkpAddXpsPrfInsertSucceed` `BsnoInvalid` `TemporaryError`

**프론트**
- 연산: `insertBkpAddXpsPrfInfoMutation` (`app/additional-expense/submit/graphql/insertBkpAddXpsPrfInfo.ts`)
- 쓰는 파일 (3): `app/additional-expense/submit/hooks/useInsertAdditionalExpenseInfo.ts`, `app/additional-expense/submit/input/constants/prfTypeConfig.ts`, `app/additional-expense/submit/input/page.tsx`

---

<a id="13-05"></a>

### 13-05 `updateBkpAddXpsPrfInfo` — 추가경비증빙 수정

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
| `bkpAddXpsPrfId` | `number` | ✅ | 보냄 |  |
| `bkpAddXpsPrfData` | `BkpAddXpsPrfSaveInputType` | ✅ | 보냄 |  |
| `bkpAddXpsPrfData.bmanTin` | `string` | ✅ | 보냄 |  |
| `bkpAddXpsPrfData.attrYr` | `string` | ✅ | 보냄 |  |
| `bkpAddXpsPrfData.tmpFileId` | `number \| null` |  | 보냄 | 임시 파일 Id |
| `bkpAddXpsPrfData.clplcTnm` | `string \| null` |  | 보냄 | 거래처 명(경조 당사자 이름) |
| `bkpAddXpsPrfData.clplcBsno` | `string \| null` |  | 보냄 | 거래처 사업자번호 |
| `bkpAddXpsPrfData.wrtDt` | `string \| null` |  | 보냄 | 작성일자/거래일자(YYYYMMDD) |
| `bkpAddXpsPrfData.trsCntn` | `string \| null` |  | 보냄 | 거래 내용(지출 내용) |
| `bkpAddXpsPrfData.splCft` | `number \| null` |  | 보냄 | 공급가액 |
| `bkpAddXpsPrfData.txamt` | `number \| null` |  | 보냄 | 세액(부가세액) |
| `bkpAddXpsPrfData.totaAmt` | `number \| null` |  | 보냄 | 합계금액 |
| `bkpAddXpsPrfData.prfType` | `ExpenseEvidenceType \| null` |  | 보냄 | 증빙유형 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateBkpAddXpsPrfOutput` · union 4종)

```ts
{
  __typename: 'UpdateBkpAddXpsPrfSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'BsnoInvalid';
  message: string;
}
| {
  __typename: 'UpdateNotAllowedStatus';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `BsnoInvalid` `UpdateBkpAddXpsPrfSucceed` `UpdateNotAllowedStatus`

**프론트**
- 연산: `updateBkpAddXpsPrfInfoMutation` (`app/additional-expense/status/graphql/updateBkpAddXpsPrfInfo.ts`)
- 쓰는 파일 (1): `app/additional-expense/hooks/useUpdateExpenseInfoRequester.ts`

---

<a id="13-06"></a>

### 13-06 `deleteBkpAddXpsPrfInfo` — 추가경비증빙 삭제

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
| `bkpAddXpsPrfId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteBkpAddXpsPrfOutput` · union 2종)

```ts
{
  __typename: 'DeleteBkpAddXpsPrfSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeleteBkpAddXpsPrfSucceed`

**프론트**
- 연산: `deleteBkpAddXpsPrfInfoMutation` (`app/additional-expense/status/graphql/deleteBkpAddXpsPrfInfo.ts`)
- 쓰는 파일 (1): `app/additional-expense/hooks/useDeleteAdditionalExpenseInfo.ts`

---

<a id="13-07"></a>

### 13-07 `getXpsPrfSbmsBrkds` — 경비증빙제출내역 목록 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `take` | `number` | ✅ | 보냄 |  |
| `page` | `number` | ✅ | 보냄 |  |
| `bmanTin` | `string \| null` |  | 보냄 |  |
| `rpnTin` | `string \| null` |  | 보냄 |  |
| `mateTypeNm` | `string \| null` |  | 보냄 |  |
| `sbmsYr` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetXpsPrfSbmsBrkdsOutput` · union 2종)

```ts
{
  __typename: 'GetXpsPrfSbmsBrkdsResult';
  brkds: { // GetXpsPrfSbmsBrkdResult
    xpsPrfSbmsBrkdId: number;
    bmanTin: string;
    rpnTin: string;
    mateTypeNm: MateTypeNm;
    fileUrl: string;
    sbmsYr: string;
    createdAt: unknown /* DateTime */;
    fileOrcName: string;
  }[];
  count: number;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetXpsPrfSbmsBrkdsResult` `TemporaryError`

**프론트**
- 연산: `getXpsPrfSbmsBrkdsQuery` (`app/additional-expense/history-legacy/graphql/getXpsPrfSbmsBrkds.ts`)
- 쓰는 파일 (2): `app/additional-expense/history-legacy/components/DailyExpenseList.tsx`, `app/additional-expense/history-legacy/hooks/useGetLegacyExpenseList.ts`

---

<a id="13-08"></a>

### 13-08 `getXpsPrfSbmsBrkd` — 경비증빙제출내역 단건 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `xpsPrfSbmsBrkdId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetXpsPrfSbmsBrkdOutput` · union 3종)

```ts
{
  __typename: 'GetXpsPrfSbmsBrkdResult';
  xpsPrfSbmsBrkdId: number;
  bmanTin: string;
  rpnTin: string;
  mateTypeNm: MateTypeNm;
  fileUrl: string;
  sbmsYr: string;
  createdAt: unknown /* DateTime */;
  fileOrcName: string;
}
| {
  __typename: 'NotFound';
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

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `getXpsPrfSbmsBrkdQuery` (`app/additional-expense/history-legacy/graphql/getXpsPrfSbmsBrkd.ts`)
- 쓰는 파일 (1): `app/additional-expense/history-legacy/hooks/useGetLegacyExpense.ts`

---

<a id="13-09"></a>

### 13-09 `getCardCompanies` — 카드사 목록 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CardCompanyOutput` · union 2종)

```ts
{
  __typename: 'CardCompanyResult';
  crcms: { // CardCompany
    crcmNm: string;
    crcmId: number;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `getCardCompaniesQuery` (`app/business-card/graphql/getCardCompanies.ts`)
- 쓰는 파일 (1): `app/business-card/submit/input/hooks/useGetCardCompanies.ts`

---

<a id="13-10"></a>

### 13-10 `listCards` — 카드 리스트 or 새로고침

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `input` | `ListCardsInput` | ✅ | 보냄 |  |
| `input.bsno` | `string` | ✅ | 보냄 | 사업자등록번호 |
| `input.reload` | `boolean \| null` |  | 보냄 | 카드 리스트 새로고침 여부 (기본값: false) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ListCardsOutput` · union 2종)

```ts
{
  __typename: 'ListCardsResult';
  status: StatusTypeEnum;
  updatedTs: number | null;
  reqResults: { // CardReqResult
    status: CreditCardReqStatus;
    cards: { // CreditCard
      crcmId: number | null;
      crcmNm: string;
      cardNo: string;
      gthStrtDt: string | null;
      vldtStatus: CreditCardVldtStatus;
      bid: number;
      aprDt: string | null;
      regDt: string | null;
      cardVldtTerm: string | null;
    }[];
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ListCardsResult` `TemporaryError`

**프론트**
- 연산: `listCardsQuery` (`app/business-card/graphql/listCards.ts`)
- 쓰는 파일 (6): `app/business-card/status/components/RegistCompleteCardList.tsx`, `app/business-card/status/detail/components/BusinessCardExpireDateInfo.tsx`, `app/business-card/status/detail/components/BusinessCardTitle.tsx`, `app/business-card/status/detail/components/CardExpireDateContentCell.tsx`, `app/business-card/status/hooks/useGetBusinessCardList.ts`, `app/business-card/status/hooks/useListCardsQuery.ts`

---

<a id="13-11"></a>

### 13-11 `registerCard` — 카드 등록

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
| `input` | `RegisterCardInput` | ✅ | 보냄 |  |
| `input.bsno` | `string` | ✅ | 보냄 | 사업자등록번호 |
| `input.crcmId` | `number` | ✅ | 보냄 | 카드사 ID |
| `input.cardNo` | `string` | ✅ | 보냄 | 카드번호 |
| `input.cardVldtTerm` | `string` | ✅ | 보냄 | 카드유효기간 MM/YY |
| `input.phone` | `string` | ✅ | 보냄 | 휴대폰번호 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RegisterCardOutput` · union 2종)

```ts
{
  __typename: 'RegisterCardResult';
  status: StatusTypeEnum;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `RegisterCardResult` `TemporaryError`

**프론트**
- 연산: `registerCardMutation` (`app/business-card/graphql/registerCard.ts`)
- 쓰는 파일 (1): `app/business-card/submit/input/hooks/useRegisterCard.ts`

---

<a id="13-12"></a>

### 13-12 `updateCard` — 카드 수정

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
| `input` | `UpdateCardInput` | ✅ | 보냄 |  |
| `input.bsno` | `string` | ✅ | 보냄 | 사업자등록번호 |
| `input.crcmId` | `number` | ✅ | 보냄 | 카드사 ID |
| `input.cardNo` | `string` | ✅ | 보냄 | 카드번호 |
| `input.cardVldtTerm` | `string` | ✅ | 보냄 | 카드유효기간 MM/YY |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateCardOutput` · union 2종)

```ts
{
  __typename: 'UpdateCardResult';
  status: StatusTypeEnum;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdateCardResult`

**프론트**
- 연산: `updateCardMutation` (`app/business-card/graphql/updateCard.ts`)
- 쓰는 파일 (1): `app/business-card/status/hooks/useUpdateCard.ts`

---

<a id="13-13"></a>

### 13-13 `removeCard` — 카드 삭제

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
| `input` | `RemoveCardInput` | ✅ | 보냄 |  |
| `input.bsno` | `string` | ✅ | 보냄 | 사업자등록번호 |
| `input.cardNo` | `string` | ✅ | 보냄 | 카드번호 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RemoveCardOutput` · union 2종)

```ts
{
  __typename: 'RemoveCardResult';
  status: StatusTypeEnum;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `RemoveCardResult`

**프론트**
- 연산: `removeCardMutation` (`app/business-card/graphql/removeCard.ts`)
- 쓰는 파일 (1): `app/business-card/hooks/useRemoveBusinessCard.ts`
