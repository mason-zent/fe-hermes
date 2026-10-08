# 07. 부가세 예상세액·신고 결과

> [README](./README.md) · API 9개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [07-01](#07-01) | `vatDeclareStatus` | 조회 | 부가세 신고 단계 확인 | | ☐ | ☐ |
| [07-02](#07-02) | `allVatMaterialAppliedCheck` | 조회 | 부가세 제출자료 모두 반영 여부 (스키마 설명 '이전 등록된 임대차 존재여부' 는 복사 실수로 보임) | | ☐ | ☐ |
| [07-03](#07-03) | `vatDeclareEstimatedTax` | 조회 | 부가세 예상세액 | | ☐ | ☐ |
| [07-04](#07-04) | `getDeductionSummary` | 조회 | 부가세 공제/불공제 요약 | | ☐ | ☐ |
| [07-05](#07-05) | `myBankAccount` | 조회 | 이전신고 입력 된 환급 계좌 조회 | | ☐ | ☐ |
| [07-06](#07-06) | `vatDeclareEstimatedTaxConfirm` | 변경 | 부가세신고 예상세액 확인완료 | | ☐ | ☐ |
| [07-07](#07-07) | `vatDeclareResult` | 조회 | 부가세 신고 결과 | | ☐ | ☐ |
| [07-08](#07-08) | `vatDeclareResultList` | 조회 | 부가세 신고 완료 내역 | | ☐ | ☐ |
| [07-09](#07-09) | `vatDeclareResultById` | 조회 | 부가세 신고 결과(신고 ID로 조회) | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `DeductibleType`: `DEDUCTIBLE` · `NON_DEDUCTIBLE_CHANGEABLE` · `NON_DEDUCTIBLE_UNCHANGEABLE`
- `ExpenseBillTypeEnum`: `BUSINESS_CREDIT_CARD` · `PRIVATE_CREDIT_CARD` · `CASH_RECEIPT`
- `NonDeductibleUnChangeableType`: `SIMPLE` · `TAX_FREE` · `DUPLICATE_ISSUE`
- `TaxBillTypeEnum`: `None` · `Payment` · `Refund`
- `TaxationTypeEnum`: `Simplified` · `General` · `TaxFree`
- `VatDeclareStageEnum`: `None` · `RequireMaterial` · `AdditionalRequireMaterial` · `SubmitCompleteMaterial` · `ReviewMaterial` · `InWriteTaxReturn` · `RequireEstimatedTax` · `EstimatedTaxConfirm` · `CompletedDeclare`

## 프론트 작업 파일 (33) — `apps/care-web/` 기준

- `app/(my-info)/hooks/useGetVatStatus.ts`
- `app/vat/(status)/org-status/components/SummarySection.tsx`
- `app/vat/(status)/org-status/components/VatCompletedDeclareVatTax.tsx`
- `app/vat/(status)/org-status/components/VatOrgCard.tsx`
- `app/vat/(status)/org-status/components/VatStatus.tsx`
- `app/vat/(status)/org-status/graphql/vatDeclareStatus.ts`
- `app/vat/(status)/org-status/hooks/useVatStatus.ts`
- `app/vat/estimated-tax/(main)/components/VatEstimatedLookUp.tsx`
- `app/vat/estimated-tax/(main)/components/VatEstimatedLookUpComplete.tsx`
- `app/vat/estimated-tax/(main)/graphql/allVatMaterialAppliedCheck.ts`
- `app/vat/estimated-tax/(main)/graphql/myBankAccount.ts`
- `app/vat/estimated-tax/(main)/graphql/vatDeclareEstimatedTax.ts`
- `app/vat/estimated-tax/(main)/graphql/vatDeclareEstimatedTaxConfirm.ts`
- `app/vat/estimated-tax/(main)/hooks/useCheckAllVatMaterialApplied.ts`
- `app/vat/estimated-tax/(main)/hooks/useVatDeclareEstimatedTaxConfirm.ts`
- `app/vat/estimated-tax/(main)/page.tsx`
- `app/vat/estimated-tax/deduction/components/VatDeductionList.tsx`
- `app/vat/estimated-tax/deduction/components/VatDeductionListItem.tsx`
- `app/vat/estimated-tax/deduction/components/VatDeductionView.tsx`
- `app/vat/estimated-tax/deduction/constants/expense.ts`
- `app/vat/estimated-tax/deduction/graphql/getDeductionSummary.ts`
- `app/vat/estimated-tax/deduction/hooks/useDeductionSummaryLoader.ts`
- `app/vat/history/graphql/vatDeclareResultById.ts`
- `app/vat/history/graphql/vatDeclareResultList.ts`
- `app/vat/history/hooks/useVatDeclareResultById.ts`
- `app/vat/history/hooks/useVatDeclareResultList.ts`
- `app/vat/provider/VatOrgProvider.tsx`
- `app/vat/tax-result/(guide)/components/PaymentGuideDetail.tsx`
- `app/vat/tax-result/(guide)/components/VatPaymentGuideLookUp.tsx`
- `app/vat/tax-result/(guide)/components/VatPaymentGuideLookUpComplete.tsx`
- `app/vat/tax-result/(guide)/page.tsx`
- `app/vat/tax-result/graphql/vatDeclareResult.ts`
- `app/vat/utils/isNotVatTarget.ts`

## API 상세

---

<a id="07-01"></a>

### 07-01 `vatDeclareStatus` — 부가세 신고 단계 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatDeclareStatusOutput` · union 3종)

```ts
{
  __typename: 'VatDeclareStatus';
  orgVats: { // OrgVat
    vatDeclareId: number;
    isFirst: boolean;
    taxationType: TaxationTypeEnum | null;
    taxationStart: string;
    taxationEnd: string;
    bmanTin: string;
    bizNo: string | null;
    orgName: string;
    stage: VatDeclareStageEnum;
    declareResult: { // TaxInfo
      amount: string;
      type: TaxBillTypeEnum;
    };
  }[];
}
| {
  __typename: 'NoTargetVatDeclare';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `NoTargetVatDeclare` `VatDeclareStatus`

**프론트**
- 연산: `vatDeclareStatusQuery` (`app/vat/(status)/org-status/graphql/vatDeclareStatus.ts`)
- 쓰는 파일 (8): `app/(my-info)/hooks/useGetVatStatus.ts`, `app/vat/(status)/org-status/components/SummarySection.tsx`, `app/vat/(status)/org-status/components/VatCompletedDeclareVatTax.tsx`, `app/vat/(status)/org-status/components/VatOrgCard.tsx`, `app/vat/(status)/org-status/components/VatStatus.tsx`, `app/vat/(status)/org-status/hooks/useVatStatus.ts`, `app/vat/provider/VatOrgProvider.tsx`, `app/vat/utils/isNotVatTarget.ts`

---

<a id="07-02"></a>

### 07-02 `allVatMaterialAppliedCheck` — 부가세 제출자료 모두 반영 여부 (스키마 설명 '이전 등록된 임대차 존재여부' 는 복사 실수로 보임)

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `AllVatMaterialAppliedAOutput` · union 2종)

```ts
{
  __typename: 'AllVatMaterialApplied';
  appliedYn: boolean;
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
- 연산: `allVatMaterialAppliedCheckQuery` (`app/vat/estimated-tax/(main)/graphql/allVatMaterialAppliedCheck.ts`)
- 쓰는 파일 (1): `app/vat/estimated-tax/(main)/hooks/useCheckAllVatMaterialApplied.ts`

---

<a id="07-03"></a>

### 07-03 `vatDeclareEstimatedTax` — 부가세 예상세액

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
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatDeclareEstimatedTaxOutput` · union 3종)

```ts
{
  __typename: 'VatDeclareEstimatedTax';
  filingInfo: { // VatFilingInfo
    bizNo: string | null;
    bizName: string | null;
    bizTypeName: string | null;
    taxType: string | null;
    taxPeriod: string | null;
  };
  vatEstimatedTaxInfo: { // VatEstimatedTaxInfo
    totalVatTax: { // TaxInfo
      type: TaxBillTypeEnum;
      amount: string;
    };
    purchaseVat: string;
    salesVat: string;
    additionalDeduction: { // VatDefaultList
      amount: number | null;
      items: { // VatListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    };
    penaltyTax: { // VatDefaultList
      amount: number | null;
      items: { // VatListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    };
    paidTax: { // VatDefaultList
      amount: number | null;
      items: { // VatListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    };
  };
  comparison: { // Comparison
    previous: { // ComparisonItem
      taxPeriod: string | null;
      taxType: string | null;
      salesTotalAmt: number | null;
      salesTaxBillAmt: number | null;
      billAmt: number | null;
      salesCardAndCashReceiptAmt: number | null;
      salesCashAndOnlineAmt: number | null;
      purchaseTotalAmt: number | null;
      purchaseTaxBillAmt: number | null;
      purchaseCardAndCashReceiptAmt: number | null;
      paidAmt: number | null;
      prePaidAmt: number | null;
      deductionAmt: number | null;
      penaltyAmt: number | null;
      deductedPaidAmt: number | null;
    } | null;
    current: { // ComparisonItem
      taxPeriod: string | null;
      taxType: string | null;
      salesTotalAmt: number | null;
      salesTaxBillAmt: number | null;
      billAmt: number | null;
      salesCardAndCashReceiptAmt: number | null;
      salesCashAndOnlineAmt: number | null;
      purchaseTotalAmt: number | null;
      purchaseTaxBillAmt: number | null;
      purchaseCardAndCashReceiptAmt: number | null;
      paidAmt: number | null;
      prePaidAmt: number | null;
      deductionAmt: number | null;
      penaltyAmt: number | null;
      deductedPaidAmt: number | null;
    } | null;
  };
  salesList: { // SalesList
    onlineSales: { // VatListItem
      typeName: string | null;
      amount: number | null;
    }[] | null;
    exportSales: number | null;
    cashSales: number | null;
  };
  purchaseList: { // PurchaseList
    businessCreditCard: { // PurchaseItem
      deductionAmt: number | null;
      nonDeductionAmt: number | null;
    } | null;
    privateCreditCard: { // PurchaseItem
      deductionAmt: number | null;
      nonDeductionAmt: number | null;
    } | null;
    cashReceipt: { // PurchaseItem
      deductionAmt: number | null;
      nonDeductionAmt: number | null;
    } | null;
  };
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| { __typename: 'VatEstimatedTaxIsNone' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `VatEstimatedTaxIsNone`

**프론트**
- 연산: `vatDeclareEstimatedTaxQuery` (`app/vat/estimated-tax/(main)/graphql/vatDeclareEstimatedTax.ts`)
- 쓰는 파일 (3): `app/vat/estimated-tax/(main)/components/VatEstimatedLookUp.tsx`, `app/vat/estimated-tax/(main)/components/VatEstimatedLookUpComplete.tsx`, `app/vat/estimated-tax/(main)/page.tsx`

---

<a id="07-04"></a>

### 07-04 `getDeductionSummary` — 부가세 공제/불공제 요약

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
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeductionSummaryOutput` · union 2종)

```ts
{
  __typename: 'DeductionSummary';
  deductibleList: { // DeductibleItem
    expenseBillType: ExpenseBillTypeEnum;
    deductionAmt: number;
    bizName: string | null;
    totalAmt: number;
    totalCnt: number;
  }[] | null;
  nonDeductibleList: { // NonDeductibleItem
    expenseBillType: ExpenseBillTypeEnum;
    nonDeductibleType: DeductibleType;
    nonDeductibleUnChangeableType: NonDeductibleUnChangeableType | null;
    bizName: string | null;
    totalAmt: number | null;
    totalCnt: number | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeductionSummary` `TemporaryError`

**프론트**
- 연산: `getDeductionSummaryQuery` (`app/vat/estimated-tax/deduction/graphql/getDeductionSummary.ts`)
- 쓰는 파일 (5): `app/vat/estimated-tax/deduction/components/VatDeductionList.tsx`, `app/vat/estimated-tax/deduction/components/VatDeductionListItem.tsx`, `app/vat/estimated-tax/deduction/components/VatDeductionView.tsx`, `app/vat/estimated-tax/deduction/constants/expense.ts`, `app/vat/estimated-tax/deduction/hooks/useDeductionSummaryLoader.ts`

---

<a id="07-05"></a>

### 07-05 `myBankAccount` — 이전신고 입력 된 환급 계좌 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `MyBankAccountOutput` · union 3종)

```ts
{
  __typename: 'MyBankAccount';
  accountNo: string;
  accountOwner: string;
  bank: string;
}
| {
  __typename: 'NoMyBankAccount';
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
- 연산: `myBankAccountQuery` (`app/vat/estimated-tax/(main)/graphql/myBankAccount.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)

---

<a id="07-06"></a>

### 07-06 `vatDeclareEstimatedTaxConfirm` — 부가세신고 예상세액 확인완료

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
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatDeclareEstimatedTaxConfirmOutput` · union 2종)

```ts
{
  __typename: 'VatDeclareEstimatedTaxConfirmSucceed';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `VatDeclareEstimatedTaxConfirmSucceed`

**프론트**
- 연산: `vatDeclareEstimatedTaxConfirmMutation` (`app/vat/estimated-tax/(main)/graphql/vatDeclareEstimatedTaxConfirm.ts`)
- 쓰는 파일 (1): `app/vat/estimated-tax/(main)/hooks/useVatDeclareEstimatedTaxConfirm.ts`

---

<a id="07-07"></a>

### 07-07 `vatDeclareResult` — 부가세 신고 결과

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
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatDeclareResultOutput` · union 2종)

```ts
{
  __typename: 'VatDeclareResult';
  bmanTin: string;
  taxReturn: string;
  taxResult: { // TaxResultInfo
    type: TaxBillTypeEnum;
    taxBill: string | null;
    amount: string;
  } | null;
  taxationType: string;
  taxationPeriod: string;
  bizNo: string;
  orgName: string;
  reportDate: string;
  reportCategory: string;
  refundAccount: { // RefundAccount
    accountNo: string;
    bank: string;
  } | null;
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
- 연산: `vatDeclareResultQuery` (`app/vat/tax-result/graphql/vatDeclareResult.ts`)
- 쓰는 파일 (4): `app/vat/tax-result/(guide)/components/PaymentGuideDetail.tsx`, `app/vat/tax-result/(guide)/components/VatPaymentGuideLookUp.tsx`, `app/vat/tax-result/(guide)/components/VatPaymentGuideLookUpComplete.tsx`, `app/vat/tax-result/(guide)/page.tsx`

---

<a id="07-08"></a>

### 07-08 `vatDeclareResultList` — 부가세 신고 완료 내역

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatDeclareResultListOutput` · union 3종)

```ts
{
  __typename: 'VatDeclareResultList';
  vatDeclareResultList: { // VatDeclareResultListItem
    vatDeclareId: number;
    bmanTin: string;
    orgName: string;
    bizNo: string;
    taxationQuarter: string;
    declareYearMonth: string;
    taxInfo: { // TaxInfo
      type: TaxBillTypeEnum;
      amount: string;
    } | null;
  }[];
}
| {
  __typename: 'NoVatDeclareResultList';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `VatDeclareResultList`

**프론트**
- 연산: `vatDeclareResultListQuery` (`app/vat/history/graphql/vatDeclareResultList.ts`)
- 쓰는 파일 (1): `app/vat/history/hooks/useVatDeclareResultList.ts`

---

<a id="07-09"></a>

### 07-09 `vatDeclareResultById` — 부가세 신고 결과(신고 ID로 조회)

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
| `vatDeclareId` | `number` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatDeclareResultOutput` · union 2종)

```ts
{
  __typename: 'VatDeclareResult';
  bmanTin: string;
  orgName: string;
  bizNo: string;
  taxationType: string;
  reportDate: string;
  reportCategory: string;
  taxationPeriod: string;
  taxReturn: string;
  taxResult: { // TaxResultInfo
    type: TaxBillTypeEnum;
    amount: string;
    taxBill: string | null;
  } | null;
  refundAccount: { // RefundAccount
    bank: string;
    accountNo: string;
  } | null;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `TemporaryError` `VatDeclareResult`

**프론트**
- 연산: `vatDeclareResultByIdQuery` (`app/vat/history/graphql/vatDeclareResultById.ts`)
- 쓰는 파일 (1): `app/vat/history/hooks/useVatDeclareResultById.ts`
