# 04. 결제

> [README](./README.md) · API 12개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [04-01](#04-01) | `orgsRegularPaymentMethod` | 조회 | 사업체별 결제 수단 | | ☐ | ☐ |
| [04-02](#04-02) | `incometaxOrgsRegularPaymentMethod` | 조회 | 종소세용 사업체별 결제 수단 | | ☐ | ☐ |
| [04-03](#04-03) | `myRegularPaymentMethods` | 조회 | 등록된 결제 수단 | | ☐ | ☐ |
| [04-04](#04-04) | `cmsRequiredOrgs` | 조회 | 출금동의 필요 사업체 | | ☐ | ☐ |
| [04-05](#04-05) | `hasPaymentOverdue` | 조회 | rpnTin 기준 미납 row 존재 여부 확인 | | ☐ | ☐ |
| [04-06](#04-06) | `paymentOverdueStats` | 조회 | 사업체별 미납 건수 및 총액 통계 | | ☐ | ☐ |
| [04-07](#04-07) | `checkBankAccount` | 조회 | 예금주 조회 | | ☐ | ☐ |
| [04-08](#04-08) | `initMyBankPayment` | 조회 | 헥토 내통장 결제 등록창 호출 | | ☐ | ☐ |
| [04-09](#04-09) | `createRegularPayment` | 변경 | 신규 정기결제수단 등록 | | ☐ | ☐ |
| [04-10](#04-10) | `refCreateRegularPayment` | 변경 | 기존 정기결제수단 참조 등록 | | ☐ | ☐ |
| [04-11](#04-11) | `prePayment` | 변경 | 선결제 | | ☐ | ☐ |
| [04-12](#04-12) | `createPaymentLink` | 변경 | 결제링크 생성 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `BankCode`: `kdbBank` · `ibkBank` · `kbBank` · `shBank` · `nhBank` · `wooriBank` · `scBank` · `citiBank` · `dgbBank` · `busanBank` · `kjBank` · `jejuBank` · `jbBank` · `knBank` · `kfccBank` · `cuBank` · `postBank` · `hanaBank` · `shinhanBank` · `kBank` · `kakaoBank` · `myassetSecu` · `miraeassetSecu` · `samsungSecu` · `nhSecu` · `daishinSecu` · `shinhanSecu` · `eugeneSecu` · `meritzSecu` · `nfcfBank` · `savingsBank` · `tossBank` · `sbiSavingsBank` · `koreaInvestSecu` · `skSecu` · `sanlimBank`
- `OrgStatus`: `ACTIVE` · `SUSPENDED` · `CLOSED` · `NONE`
- `PfbStatusEnum`: `WITHOUT_CLOSED` · `ALL_STATUS`
- `PromotionCondition`: `NONE` · `UTM` · `CARD_BIN` · `PRE_PAID`
- `RegistrationStatus`: `None` · `Pending` · `Completed`
- `RegularPaymentType`: `Card` · `Cms` · `Bank`

## 프론트 작업 파일 (46) — `apps/care-web/` 기준

- `app/(auth)/billing/components/checkout/CheckoutButton.tsx`
- `app/(auth)/billing/components/checkout/CheckoutConfirmDrawer.tsx`
- `app/(auth)/billing/components/checkout/CheckoutOrg.tsx`
- `app/(auth)/billing/components/promotion/PromotionDetailBenefitCard.tsx`
- `app/(auth)/billing/components/promotion/PromotionRegularBillingDay.tsx`
- `app/(auth)/billing/components/renewal/RenewalOrg.tsx`
- `app/(auth)/billing/components/renewal/RenewalTopBanner.tsx`
- `app/(auth)/billing/graphql/checkBankAccount.ts`
- `app/(auth)/billing/graphql/cmsRequiredOrgs.ts`
- `app/(auth)/billing/graphql/hasPaymentOverdue.ts`
- `app/(auth)/billing/graphql/initMyBankPayment.ts`
- `app/(auth)/billing/graphql/myRegularPaymentMethods.ts`
- `app/(auth)/billing/graphql/orgsRegularPaymentMethod.ts`
- `app/(auth)/billing/graphql/paymentOverdueStats.ts`
- `app/(auth)/billing/graphql/prePayment.ts`
- `app/(auth)/billing/graphql/refCreateRegularPayment.ts`
- `app/(auth)/billing/hooks/useBillingMethod.ts`
- `app/(auth)/billing/hooks/useCheckPaymentOverdue.ts`
- `app/(auth)/billing/hooks/useGetOrgsRegularPaymentMethod.ts`
- `app/(auth)/billing/hooks/useInitMyBankPayment.ts`
- `app/(auth)/billing/hooks/useLookUpRegularPaymentMethods.ts`
- `app/(auth)/billing/hooks/usePaymentOverdueListQuery.ts`
- `app/(auth)/billing/hooks/usePrePayment.ts`
- `app/(auth)/billing/hooks/usePromotionInfo.ts`
- `app/(auth)/billing/payment-method/[bizNo]/card/graphql/createRegularPayment.ts`
- `app/(auth)/billing/payment-method/[bizNo]/card/hooks/useCardEvent.ts`
- `app/(auth)/billing/payment-method/[bizNo]/card/page.tsx`
- `app/(auth)/billing/payment-method/[bizNo]/hooks/useCreateRegularPayments.ts`
- `app/(auth)/billing/payment-method/[bizNo]/hooks/useRefCreateRegularPayment.ts`
- `app/(auth)/billing/refactor/components/PaymentStatusBadge.tsx`
- `app/(auth)/billing/refactor/hooks/useOrgsPaymentInfo.ts`
- `app/(auth)/billing/refactor/hooks/useOrgsPaymentMethodQuery.ts`
- `app/(auth)/billing/refactor/store/prevPaymentMethodsAtom.ts`
- `app/(auth)/billing/unpaid/components/UnpaidOrgCard.tsx`
- `app/(auth)/billing/unpaid/components/UnpaidOrgContents.tsx`
- `app/(auth)/complete/page.tsx`
- `app/(gateway)/my-account-gateway/success/page.tsx`
- `app/global-income/(auth)/graphql/createPaymentLink.ts`
- `app/global-income/(auth)/hooks/useCreatePaymentLink.ts`
- `app/global-income/(auth)/refund-account/hooks/useUpdateDeclareRefundAccount.ts`
- `app/global-income/(auth)/refund-account/page.tsx`
- `app/global-income/billing/graphql/incometaxOrgsRegularPaymentMethod.ts`
- `app/global-income/billing/hooks/useIncometaxOrgPaymentInfo.ts`
- `app/global-income/billing/hooks/useIncometaxOrgPaymentQuery.ts`
- `app/vat/hooks/useAccountRefund.ts`
- `app/vat/refund-account/components/RefundAccountDetail.tsx`

## API 상세

---

<a id="04-01"></a>

### 04-01 `orgsRegularPaymentMethod` — 사업체별 결제 수단

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
| `statusFilter` | `PfbStatusEnum \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `OrgsRegularPaymentMethodOutput` · union 3종)

```ts
{
  __typename: 'OrgsRegularPaymentMethod';
  orgsRegularPaymentMethod: { // OrgRegularPaymentMethod
    bizName: string;
    bizNo: string;
    bmanTin: string;
    orgStatus: OrgStatus;
    cardInfo: { // CardRegularPayment
      cardCode: string;
      cardNumber: string;
      paymentMethodUid: string;
    } | null;
    cmsInfo: { // CmsRegularPayment
      accountNumber: string | null;
      accountOwner: string | null;
      bank: string | null;
      paymentMethodUid: string;
      phone: string | null;
    } | null;
    bankInfo: { // BankRegularPayment
      paymentMethodUid: string;
      accountNumber: string;
      bankCode: BankCode;
    } | null;
    registrationStatus: RegistrationStatus;
    originalBookFee: number;
    failureReason: string | null;
    nextBillingDate: string | null;
    promotionInfo: { // PromotionInfo
      expireDate: string;
      promotionDisplayName: string;
      promotionCondition: PromotionCondition[];
      promotionId: number;
      promotionPattern: { // PromotionPattern
        patternId: number | null;
        cardBin: string | null;
        discountCount: string | null;
        discountRate: string | null;
        freeTrial: number | null;
        regularAmount: number | null;
        actualAmount: number | null;
        discountAmount: number | null;
        prePaid: number | null;
      }[];
    } | null;
    futurePromotionInfo: { // FuturePromotionInfo
      promotionCondition: PromotionCondition[];
      promotionDisplayName: string;
      promotionId: number;
      promotionPattern: { // PromotionPattern
        patternId: number | null;
        cardBin: string | null;
        discountCount: string | null;
        discountRate: string | null;
        freeTrial: number | null;
        regularAmount: number | null;
        actualAmount: number | null;
        discountAmount: number | null;
        prePaid: number | null;
      }[];
    } | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| { __typename: 'NotFoundOrgs' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `TemporaryError`

**프론트**
- 연산: `orgsRegularPaymentMethodQuery` (`app/(auth)/billing/graphql/orgsRegularPaymentMethod.ts`)
- 쓰는 파일 (15): `app/(auth)/billing/components/checkout/CheckoutButton.tsx`, `app/(auth)/billing/components/checkout/CheckoutConfirmDrawer.tsx`, `app/(auth)/billing/components/checkout/CheckoutOrg.tsx`, `app/(auth)/billing/components/promotion/PromotionDetailBenefitCard.tsx`, `app/(auth)/billing/components/promotion/PromotionRegularBillingDay.tsx`, `app/(auth)/billing/components/renewal/RenewalOrg.tsx`, `app/(auth)/billing/components/renewal/RenewalTopBanner.tsx`, `app/(auth)/billing/hooks/useGetOrgsRegularPaymentMethod.ts`, `app/(auth)/billing/hooks/usePromotionInfo.ts`, `app/(auth)/billing/payment-method/[bizNo]/card/page.tsx`, `app/(auth)/billing/refactor/components/PaymentStatusBadge.tsx`, `app/(auth)/billing/refactor/hooks/useOrgsPaymentInfo.ts`, `app/(auth)/billing/refactor/hooks/useOrgsPaymentMethodQuery.ts`, `app/(auth)/complete/page.tsx`, `app/global-income/billing/hooks/useIncometaxOrgPaymentInfo.ts`

---

<a id="04-02"></a>

### 04-02 `incometaxOrgsRegularPaymentMethod` — 종소세용 사업체별 결제 수단

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `OrgsRegularPaymentMethodOutput` · union 3종)

```ts
{
  __typename: 'OrgsRegularPaymentMethod';
  orgsRegularPaymentMethod: { // OrgRegularPaymentMethod
    bizName: string;
    bizNo: string;
    bmanTin: string;
    orgStatus: OrgStatus;
    cardInfo: { // CardRegularPayment
      cardCode: string;
      cardNumber: string;
      paymentMethodUid: string;
    } | null;
    cmsInfo: { // CmsRegularPayment
      accountNumber: string | null;
      accountOwner: string | null;
      bank: string | null;
      paymentMethodUid: string;
      phone: string | null;
    } | null;
    bankInfo: { // BankRegularPayment
      paymentMethodUid: string;
      accountNumber: string;
      bankCode: BankCode;
    } | null;
    registrationStatus: RegistrationStatus;
    originalBookFee: number;
    failureReason: string | null;
    nextBillingDate: string | null;
    promotionInfo: { // PromotionInfo
      expireDate: string;
      promotionDisplayName: string;
      promotionCondition: PromotionCondition[];
      promotionId: number;
      promotionPattern: { // PromotionPattern
        patternId: number | null;
        cardBin: string | null;
        discountCount: string | null;
        discountRate: string | null;
        freeTrial: number | null;
        regularAmount: number | null;
        actualAmount: number | null;
        discountAmount: number | null;
        prePaid: number | null;
      }[];
    } | null;
    futurePromotionInfo: { // FuturePromotionInfo
      promotionCondition: PromotionCondition[];
      promotionDisplayName: string;
      promotionId: number;
      promotionPattern: { // PromotionPattern
        patternId: number | null;
        cardBin: string | null;
        discountCount: string | null;
        discountRate: string | null;
        freeTrial: number | null;
        regularAmount: number | null;
        actualAmount: number | null;
        discountAmount: number | null;
        prePaid: number | null;
      }[];
    } | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| { __typename: 'NotFoundOrgs' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `incometaxOrgsRegularPaymentMethodQuery` (`app/global-income/billing/graphql/incometaxOrgsRegularPaymentMethod.ts`)
- 쓰는 파일 (2): `app/global-income/billing/hooks/useIncometaxOrgPaymentInfo.ts`, `app/global-income/billing/hooks/useIncometaxOrgPaymentQuery.ts`

---

<a id="04-03"></a>

### 04-03 `myRegularPaymentMethods` — 등록된 결제 수단

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `MyPaymentMethodOutput` · union 2종)

```ts
{
  __typename: 'MyRegularPaymentMethod';
  cardInfo: { // CardRegularPayment
    cardCode: string;
    cardNumber: string;
    paymentMethodUid: string;
  }[] | null;
  cmsInfo: { // CmsRegularPayment
    accountNumber: string | null;
    accountOwner: string | null;
    bank: string | null;
    paymentMethodUid: string;
    phone: string | null;
  }[] | null;
  bankInfo: { // BankRegularPayment
    paymentMethodUid: string;
    accountNumber: string;
    bankCode: BankCode;
  }[] | null;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `MyRegularPaymentMethod`

**프론트**
- 연산: `myRegularPaymentMethodsQuery` (`app/(auth)/billing/graphql/myRegularPaymentMethods.ts`)
- 쓰는 파일 (3): `app/(auth)/billing/hooks/useBillingMethod.ts`, `app/(auth)/billing/hooks/useLookUpRegularPaymentMethods.ts`, `app/(auth)/billing/refactor/store/prevPaymentMethodsAtom.ts`

---

<a id="04-04"></a>

### 04-04 `cmsRequiredOrgs` — 출금동의 필요 사업체

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CmsRequiredOrgsOutput` · union 2종)

```ts
{
  __typename: 'CmsRequiredOrgs';
  cmsRequiredOrgs: { // CmsRequiredOrg
    bizName: string;
    bizNo: string;
    bmanTin: string;
    phone: string | null;
    bank: string | null;
    accountNo: string | null;
    accountOwner: string | null;
  }[];
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
- 연산: `cmsRequiredOrgsQuery` (`app/(auth)/billing/graphql/cmsRequiredOrgs.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)

---

<a id="04-05"></a>

### 04-05 `hasPaymentOverdue` — rpnTin 기준 미납 row 존재 여부 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HasPaymentOverdueOutput` · union 2종)

```ts
{
  __typename: 'HasPaymentOverdue';
  hasOverdue: boolean;
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
- 연산: `hasPaymentOverdueQuery` (`app/(auth)/billing/graphql/hasPaymentOverdue.ts`)
- 쓰는 파일 (1): `app/(auth)/billing/hooks/useCheckPaymentOverdue.ts`

---

<a id="04-06"></a>

### 04-06 `paymentOverdueStats` — 사업체별 미납 건수 및 총액 통계

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PaymentOverdueStatsOutput` · union 2종)

```ts
{
  __typename: 'PaymentOverdueStatsList';
  stats: { // OrgOverdueStats
    bmanTin: string;
    bizName: string;
    bizNo: string;
    totalAmount: number;
    count: number;
    orgStatus: OrgStatus;
    cardInfo: { // CardRegularPayment
      cardCode: string;
      cardNumber: string;
      paymentMethodUid: string;
    } | null;
    cmsInfo: { // CmsRegularPayment
      accountNumber: string | null;
      accountOwner: string | null;
      bank: string | null;
      paymentMethodUid: string;
      phone: string | null;
    } | null;
    bankInfo: { // BankRegularPayment
      paymentMethodUid: string;
      accountNumber: string;
      bankCode: BankCode;
    } | null;
  }[];
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
- 연산: `paymentOverdueStatsQuery` (`app/(auth)/billing/graphql/paymentOverdueStats.ts`)
- 쓰는 파일 (3): `app/(auth)/billing/hooks/usePaymentOverdueListQuery.ts`, `app/(auth)/billing/unpaid/components/UnpaidOrgCard.tsx`, `app/(auth)/billing/unpaid/components/UnpaidOrgContents.tsx`

---

<a id="04-07"></a>

### 04-07 `checkBankAccount` — 예금주 조회

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
| `bankCode` | `BankCode` | ✅ | 보냄 |  |
| `account` | `string` | ✅ | 보냄 |  |
| `bizName` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckBankAccountOutput` · union 4종)

```ts
{
  __typename: 'CheckBankAccountSucceed';
  accountOwner: string;
}
| {
  __typename: 'IncorrectBankAccountOwner';
  message: string;
}
| {
  __typename: 'IncorrectBankAccountNumber';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `CheckBankAccountSucceed` `IncorrectBankAccountNumber` `IncorrectBankAccountOwner`

**프론트**
- 연산: `checkBankAccountQuery` (`app/(auth)/billing/graphql/checkBankAccount.ts`)
- 쓰는 파일 (4): `app/global-income/(auth)/refund-account/hooks/useUpdateDeclareRefundAccount.ts`, `app/global-income/(auth)/refund-account/page.tsx`, `app/vat/hooks/useAccountRefund.ts`, `app/vat/refund-account/components/RefundAccountDetail.tsx`

---

<a id="04-08"></a>

### 04-08 `initMyBankPayment` — 헥토 내통장 결제 등록창 호출

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `InitMyBankPaymentOutput` · union 2종)

```ts
{
  __typename: 'InitMyBankPaymentSucceed';
  message: string;
  data: unknown /* JSON */;
  url: string;
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
- 연산: `initMyBankPaymentQuery` (`app/(auth)/billing/graphql/initMyBankPayment.ts`)
- 쓰는 파일 (1): `app/(auth)/billing/hooks/useInitMyBankPayment.ts`

---

<a id="04-09"></a>

### 04-09 `createRegularPayment` — 신규 정기결제수단 등록

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
| `regularPaymentType` | `RegularPaymentType` | ✅ | 보냄 |  |
| `cardRegisterInfo` | `CardRegisterInfo \| null` |  | 보냄 |  |
| `cardRegisterInfo.bmanTin` | `string` | ✅ | 보냄 |  |
| `cardRegisterInfo.cardNum` | `string` | ✅ | 보냄 |  |
| `cardRegisterInfo.password` | `string` | ✅ | 보냄 |  |
| `cardRegisterInfo.yy` | `string` | ✅ | 보냄 |  |
| `cardRegisterInfo.mm` | `string` | ✅ | 보냄 |  |
| `cardRegisterInfo.birth` | `string` | ✅ | 보냄 |  |
| `cmsRegisterInfo` | `CmsRegisterInfo \| null` |  | 보냄 |  |
| `cmsRegisterInfo.bmanTin` | `string` | ✅ | 보냄 |  |
| `cmsRegisterInfo.bizName` | `string` | ✅ | 보냄 |  |
| `cmsRegisterInfo.bizNo` | `string` | ✅ | 보냄 |  |
| `cmsRegisterInfo.birthday` | `string` | ✅ | 보냄 |  |
| `cmsRegisterInfo.phone` | `string` | ✅ | 보냄 |  |
| `cmsRegisterInfo.bank` | `string` | ✅ | 보냄 |  |
| `cmsRegisterInfo.bankCode` | `BankCode \| null` |  | 보냄 |  |
| `cmsRegisterInfo.accountNumber` | `string` | ✅ | 보냄 |  |
| `cmsRegisterInfo.accountOwner` | `string` | ✅ | 보냄 |  |
| `bankRegisterInfo` | `BankRegisterInfo \| null` |  | 보냄 |  |
| `bankRegisterInfo.ordNo` | `string` | ✅ | 보냄 |  |
| `bankRegisterInfo.authNo` | `string` | ✅ | 보냄 |  |
| `bankRegisterInfo.mercntParam1` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CreateRegularPaymentOutput` · union 3종)

```ts
{
  __typename: 'CreateRegularPaymentSucceed';
  message: string;
}
| {
  __typename: 'PgError';
  errorCode: string;
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `CreateRegularPaymentSucceed` `PgError`

**프론트**
- 연산: `createRegularPaymentMutation` (`app/(auth)/billing/payment-method/[bizNo]/card/graphql/createRegularPayment.ts`)
- 쓰는 파일 (3): `app/(auth)/billing/payment-method/[bizNo]/card/hooks/useCardEvent.ts`, `app/(auth)/billing/payment-method/[bizNo]/hooks/useCreateRegularPayments.ts`, `app/(gateway)/my-account-gateway/success/page.tsx`

---

<a id="04-10"></a>

### 04-10 `refCreateRegularPayment` — 기존 정기결제수단 참조 등록

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
| `paymentMethodUid` | `string` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefCreateRegularPaymentOutput` · union 2종)

```ts
{
  __typename: 'RefCreateRegularPaymentSucceed';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `RefCreateRegularPaymentSucceed`

**프론트**
- 연산: `refCreateRegularPaymentMutation` (`app/(auth)/billing/graphql/refCreateRegularPayment.ts`)
- 쓰는 파일 (1): `app/(auth)/billing/payment-method/[bizNo]/hooks/useRefCreateRegularPayment.ts`

---

<a id="04-11"></a>

### 04-11 `prePayment` — 선결제

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
| `prePaymentInfo` | `PrePaymentInfo[]` | ✅ | 보냄 |  |
| `prePaymentInfo.bmanTin` | `string` | ✅ | 보냄 |  |
| `prePaymentInfo.promotionId` | `number \| null` |  | 보냄 |  |
| `prePaymentInfo.promotionPatternId` | `number \| null` |  | 보냄 |  |
| `onestep` | `boolean` | ✅ | 보냄 |  |
| `gaClientId` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PrePaymentOutput` · union 3종)

```ts
{
  __typename: 'PrePaymentSucceed';
  message: string;
}
| {
  __typename: 'PrePaymentFailed';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `PrePaymentFailed` `TemporaryError`

**프론트**
- 연산: `prePaymentMutation` (`app/(auth)/billing/graphql/prePayment.ts`)
- 쓰는 파일 (3): `app/(auth)/billing/components/checkout/CheckoutButton.tsx`, `app/(auth)/billing/components/checkout/CheckoutConfirmDrawer.tsx`, `app/(auth)/billing/hooks/usePrePayment.ts`

---

<a id="04-12"></a>

### 04-12 `createPaymentLink` — 결제링크 생성

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CreatePaymentLinkOutput` · union 5종)

```ts
{
  __typename: 'CreateLinkSucceed';
  paymentLink: string;
}
| {
  __typename: 'CreateLinkFailed';
}
| {
  __typename: 'AdjustmentFeeZero';
}
| {
  __typename: 'AlreadyPaid';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `AdjustmentFeeZero` `AlreadyPaid` `CreateLinkSucceed`

**프론트**
- 연산: `createPaymentLinkMutation` (`app/global-income/(auth)/graphql/createPaymentLink.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/hooks/useCreatePaymentLink.ts`
