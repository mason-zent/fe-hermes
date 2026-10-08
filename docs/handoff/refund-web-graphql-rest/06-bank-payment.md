# 06. 계좌·결제 카드

> [README](./README.md) · API 9개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [06-01](#06-01) | `bankList` | 조회 | 은행 목록 조회 | | ☐ | ☐ |
| [06-02](#06-02) | `checkBankAccount` | 변경 | 계좌 확인(예금주) | | ☐ | ☐ |
| [06-03](#06-03) | `checkBankAccountByCode` | 변경 | 링크 코드로 계좌 확인(간편 신청) | | ☐ | ☐ |
| [06-04](#06-04) | `changeBankAccount` | 변경 | 환급 계좌 변경 | | ☐ | ☐ |
| [06-05](#06-05) | `paymentCards` | 조회 | 등록된 결제 카드 조회 | | ☐ | ☐ |
| [06-06](#06-06) | `checkNeedPaymentCard` | 조회 | 결제 카드 등록 필요 여부 | | ☐ | ☐ |
| [06-07](#06-07) | `refundPaymentCardLink` | 조회 | 결제 카드 등록 링크 정보(TRP) | | ☐ | ☐ |
| [06-08](#06-08) | `createPaymentCard` | 변경 | 결제 카드 등록 | | ☐ | ☐ |
| [06-09](#06-09) | `updatePaymentCard` | 변경 | 결제 카드 변경 | | ☐ | ☐ |

## 프론트 작업 파일 (21) — `apps/refund-web/` 기준

- `components/menu/my/page/MyPageContent.tsx`
- `components/simple-terms/SimpleTermsContent.tsx`
- `components/tax-refund/bank-account/RefundBankAccountContent.tsx`
- `components/tax-refund/common/drawers/CheckAccountNameDrawer.tsx`
- `components/tax-refund/home/StatusManualSection.tsx`
- `components/tax-refund/lookup/result/apply-possible/ApplyPossibleContent.tsx`
- `components/tax-refund/payment-card/PaymentCardInputContent.tsx`
- `components/trp/TrpContent.tsx`
- `graphql/mutation/payment-card/create-payment-card.ts`
- `graphql/mutation/payment-card/update-payment-card.ts`
- `graphql/mutation/tax-refund/apply-refund.ts`
- `graphql/mutation/tax-refund/check-bank-account.ts`
- `graphql/mutation/tax-refund/check-token-and-bank-account.ts`
- `graphql/query/payment/payment-cards.ts`
- `graphql/query/survey/init.ts`
- `graphql/query/tax-refund/bank-list.ts`
- `lib/hooks/bank/api/use-bank-list.ts`
- `lib/hooks/bank/api/use-check-bank-account.ts`
- `lib/hooks/bank/api/use-check-token-and-bank-account.ts`
- `lib/hooks/payment/use-payment-card.ts`
- `lib/stores/payment-card.ts`

## API 상세

---

<a id="06-01"></a>

### 06-01 `bankList` — 은행 목록 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `BankListOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  banks: { // BankInfo
    bankCode: string;
    bankName: string;
    bankIconFileName: string;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `bankListQuery` (`graphql/query/tax-refund/bank-list.ts`)
- 쓰는 파일 (1): `lib/hooks/bank/api/use-bank-list.ts`

---

<a id="06-02"></a>

### 06-02 `checkBankAccount` — 계좌 확인(예금주)

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
| `bankCode` | `string` | ✅ | 보냄 |  |
| `account` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckBankAccountOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
  name: string | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_DUPLICATE_APPLY` `ERR_EXPIRE_URL`

**프론트**
- 연산: `checkBankAccountMutation` (`graphql/mutation/tax-refund/check-bank-account.ts`)
- 쓰는 파일 (3): `components/simple-terms/SimpleTermsContent.tsx`, `components/tax-refund/bank-account/RefundBankAccountContent.tsx`, `lib/hooks/bank/api/use-check-bank-account.ts`

---

<a id="06-03"></a>

### 06-03 `checkBankAccountByCode` — 링크 코드로 계좌 확인(간편 신청)

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
| `code` | `string` | ✅ | 보냄 |  |
| `bankCode` | `string` | ✅ | 보냄 |  |
| `account` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckTokenAndBankAccountOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
  taxpayerName: string | null;
  hometaxBizName: string | null;
  name: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `checkTokenAndBankAccountMutation` (`graphql/mutation/tax-refund/check-token-and-bank-account.ts`)
- 쓰는 파일 (1): `lib/hooks/bank/api/use-check-token-and-bank-account.ts`

---

<a id="06-04"></a>

### 06-04 `changeBankAccount` — 환급 계좌 변경

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
| `bankCode` | `string` | ✅ | 보냄 | 표준은행코드 3자리 |
| `accountOwner` | `string` | ✅ | 보냄 |  |
| `accountNo` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ChangeBankAccountOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_BANK_CHANGE_NOT_ALLOWED`

**프론트**
- 연산: `applyRefundChangeBankAccountMutation` (`graphql/mutation/tax-refund/apply-refund.ts`)
- 쓰는 파일 (1): `components/tax-refund/common/drawers/CheckAccountNameDrawer.tsx`

---

<a id="06-05"></a>

### 06-05 `paymentCards` — 등록된 결제 카드 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | `initialSurveyHomeStatusManualSectionQuery`(3개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PaymentCardInfoOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  cards: { // PaymentCard
    id: string;
    cardNo: string;
    cardNm: string;
    cardCd: string;
    expireYear: string;
    expireMonth: string;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_ETC` `ERR_SURVEY_COMPLETED`

**프론트**
- 연산: `paymentCardsQuery` (`graphql/query/payment/payment-cards.ts`), `initialSurveyHomeStatusManualSectionQuery` (`graphql/query/survey/init.ts`)
- 쓰는 파일 (3): `components/tax-refund/home/StatusManualSection.tsx`, `lib/hooks/payment/use-payment-card.ts`, `lib/stores/payment-card.ts`

---

<a id="06-06"></a>

### 06-06 `checkNeedPaymentCard` — 결제 카드 등록 필요 여부

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `paymentCardsNeedPaymentCardQuery` (`graphql/query/payment/payment-cards.ts`)
- 쓰는 파일 (1): `components/tax-refund/lookup/result/apply-possible/ApplyPossibleContent.tsx`

---

<a id="06-07"></a>

### 06-07 `refundPaymentCardLink` — 결제 카드 등록 링크 정보(TRP)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `talkToken` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PaymentCardOutput`)

```ts
{
  result: boolean;
  paymentUrl: string | null;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_EXPIRE_URL`

**프론트**
- 연산: `paymentCardsLinkQuery` (`graphql/query/payment/payment-cards.ts`)
- 쓰는 파일 (1): `components/trp/TrpContent.tsx`

---

<a id="06-08"></a>

### 06-08 `createPaymentCard` — 결제 카드 등록

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
| `paymentCardInfoInput` | `PaymentCardInfoInput` | ✅ | 보냄 |  |
| `paymentCardInfoInput.cardNumber` | `string` | ✅ | 보냄 |  |
| `paymentCardInfoInput.password` | `string` | ✅ | 보냄 |  |
| `paymentCardInfoInput.birth` | `string` | ✅ | 보냄 |  |
| `paymentCardInfoInput.expireYear` | `string` | ✅ | 보냄 |  |
| `paymentCardInfoInput.expireMonth` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_CARD_BIRTH` `ERR_CARD_EXPIRED` `ERR_CARD_NUMBER` `ERR_CARD_PASSWORD` `ERR_CARD_PASSWORD_FIVE_TIMES` `ERR_ETC` `ERR_HECTO_ETC`

**프론트**
- 연산: `createPaymentCardMutation` (`graphql/mutation/payment-card/create-payment-card.ts`)
- 쓰는 파일 (1): `components/tax-refund/payment-card/PaymentCardInputContent.tsx`

---

<a id="06-09"></a>

### 06-09 `updatePaymentCard` — 결제 카드 변경

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
| `updatePaymentCardInput` | `PaymentCardInfoInput` | ✅ | 보냄 |  |
| `updatePaymentCardInput.cardNumber` | `string` | ✅ | 보냄 |  |
| `updatePaymentCardInput.password` | `string` | ✅ | 보냄 |  |
| `updatePaymentCardInput.birth` | `string` | ✅ | 보냄 |  |
| `updatePaymentCardInput.expireYear` | `string` | ✅ | 보냄 |  |
| `updatePaymentCardInput.expireMonth` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_CARD_BIRTH` `ERR_CARD_EXPIRED` `ERR_CARD_NUMBER` `ERR_CARD_PASSWORD` `ERR_CARD_PASSWORD_FIVE_TIMES` `ERR_ETC` `ERR_HECTO_ETC`

**프론트**
- 연산: `updatePaymentCardMutation` (`graphql/mutation/payment-card/update-payment-card.ts`)
- 쓰는 파일 (2): `components/menu/my/page/MyPageContent.tsx`, `components/tax-refund/payment-card/PaymentCardInputContent.tsx`
