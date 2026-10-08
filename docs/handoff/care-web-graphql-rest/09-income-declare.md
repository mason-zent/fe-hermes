# 09. 종소세 진행·예상세액·신고 결과

> [README](./README.md) · API 13개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [09-01](#09-01) | `checkIncomeIntroStatus` | 조회 | 종소세 신고 단계 확인 | | ☐ | ☐ |
| [09-02](#09-02) | `checkIncomeFirstEnter` | 조회 | 첫 종소세 진입여부 확인 | | ☐ | ☐ |
| [09-03](#09-03) | `updateIncomeFirstEnter` | 변경 | 종소세 첫 진입여부 업데이트 | | ☐ | ☐ |
| [09-04](#09-04) | `incomeTaxStlAgree` | 변경 | 종소세 결제 동의 | | ☐ | ☐ |
| [09-05](#09-05) | `checkAllMaterialApplied` | 조회 | 종소세 모든 자료 반영 여부 | | ☐ | ☐ |
| [09-06](#09-06) | `incomeTaxDeclareEstimatedTax` | 조회 | 종소세 예상세액 조회 | | ☐ | ☐ |
| [09-07](#09-07) | `checkBankAccountForDeclare` | 조회 | 신고용 환급 예금주 조회 | | ☐ | ☐ |
| [09-08](#09-08) | `declareRefundAccount` | 변경 | 환급계좌 입력 | | ☐ | ☐ |
| [09-09](#09-09) | `refundClaimList` | 변경 | 경정청구(환급) 내역 홈택스 수집 — 중소기업 감면 화면 (스키마 설명 '연말정산 다운로드' 는 복사 실수로 보임) | | ☐ | ☐ |
| [09-10](#09-10) | `incomeTaxDeclareStageConfirm` | 변경 | 종소세신고 유저 단계 확정 | | ☐ | ☐ |
| [09-11](#09-11) | `incomeTaxDeclareResult` | 조회 | 종소세 신고 결과 | | ☐ | ☐ |
| [09-12](#09-12) | `incomeTaxDeclareList` | 조회 | 종소세 신고 목록 (resultTax 보유분) | | ☐ | ☐ |
| [09-13](#09-13) | `incomeTaxDeclareResultById` | 조회 | declareId로 종소세 신고 결과 조회 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `AdditionalExpenseBillTypeEnum`: `CEREMONY` · `PERSONAL_CARD` · `ETC`
- `BankCode`: `kdbBank` · `ibkBank` · `kbBank` · `shBank` · `nhBank` · `wooriBank` · `scBank` · `citiBank` · `dgbBank` · `busanBank` · `kjBank` · `jejuBank` · `jbBank` · `knBank` · `kfccBank` · `cuBank` · `postBank` · `hanaBank` · `shinhanBank` · `kBank` · `kakaoBank` · `myassetSecu` · `miraeassetSecu` · `samsungSecu` · `nhSecu` · `daishinSecu` · `shinhanSecu` · `eugeneSecu` · `meritzSecu` · `nfcfBank` · `savingsBank` · `tossBank` · `sbiSavingsBank` · `koreaInvestSecu` · `skSecu` · `sanlimBank`
- `DeclareTypeEnum`: `Vat` · `IncomeTax`
- `HtxError`: `HtxDataNotFoundError` · `HtxESubmitError` · `HtxLoginError` · `HtxOrgNotFoundError` · `HtxOverloadError` · `HtxPermissionError` · `HtxRExportError` · `HtxReportError` · `HtxSessionExpireError` · `HtxSimpleCertError` · `HtxTimeoutError` · `HtxUnknownError`
- `IncomeTaxDeclareStageEnum`: `MaterialSubmissionInProgress` · `MaterialReviewInProgress` · `AdditionalMaterialRequested` · `AmountCalculationInProgress` · `AmountNotified` · `AmountConfirmed` · `DeclarationCompleted` · `DeclarationCanceled`
- `TaxBillTypeEnum`: `None` · `Payment` · `Refund`

## 프론트 작업 파일 (40) — `apps/care-web/` 기준

- `app/(my-info)/home/components/InternalLinkSection.tsx`
- `app/global-income/(auth)/(submit-material)/intro/hooks/useCheckIncomeFirstEnter.ts`
- `app/global-income/(auth)/(submit-material)/intro/hooks/useUpdateIncomeFirstEnter.ts`
- `app/global-income/(auth)/(submit-material)/main/hooks/useUpdateIncomeSubmitComplete.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/refund-history/input/components/CollectProcessDrawer.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/refund-history/input/hooks/useRefundClaimList.ts`
- `app/global-income/(auth)/estimated-tax/graphql/checkAllMaterialApplied.ts`
- `app/global-income/(auth)/estimated-tax/graphql/incomeTaxDeclareEstimatedTax.ts`
- `app/global-income/(auth)/estimated-tax/hooks/useCheckAllMaterialApplied.ts`
- `app/global-income/(auth)/estimated-tax/hooks/useEstimatedTaxComplete.ts`
- `app/global-income/(auth)/estimated-tax/hooks/useGetIncomeTaxDeclareEstimatedTax.ts`
- `app/global-income/(auth)/flowstatus/components/status/FlowContents.tsx`
- `app/global-income/(auth)/flowstatus/components/status/flowComponents.ts`
- `app/global-income/(auth)/graphql/checkIncomeFirstEnter.ts`
- `app/global-income/(auth)/graphql/checkIncomeIntroStatus.ts`
- `app/global-income/(auth)/graphql/incomeTaxDeclareStageConfirm.ts`
- `app/global-income/(auth)/graphql/refundClaimList.ts`
- `app/global-income/(auth)/graphql/updateIncomeFirstEnter.ts`
- `app/global-income/(auth)/history/components/GlobalIncomeHistoryList.tsx`
- `app/global-income/(auth)/history/components/GlobalIncomeHistoryListCard.tsx`
- `app/global-income/(auth)/history/constants/taxBillType.ts`
- `app/global-income/(auth)/history/detail/components/GlobalIncomeHistoryDetailContent.tsx`
- `app/global-income/(auth)/history/graphql/incomeTaxDeclareList.ts`
- `app/global-income/(auth)/history/graphql/incomeTaxDeclareResultById.ts`
- `app/global-income/(auth)/history/hooks/useIncomeTaxDeclareList.ts`
- `app/global-income/(auth)/history/hooks/useIncomeTaxDeclareResultById.ts`
- `app/global-income/(auth)/history/page.tsx`
- `app/global-income/(auth)/hooks/useCheckIncomeIntroStatus.ts`
- `app/global-income/(auth)/hooks/useIncomeTaxDeclareStageConfirm.ts`
- `app/global-income/(auth)/payment-agree/graphql/incomeTaxStlAgree.ts`
- `app/global-income/(auth)/payment-agree/hooks/useIncomeTaxStlAgree.ts`
- `app/global-income/(auth)/payment-agree/hooks/usePaymentAgreeRedirect.ts`
- `app/global-income/(auth)/refund-account/graphql/checkBankAccountForDeclare.ts`
- `app/global-income/(auth)/refund-account/graphql/declareRefundAccount.ts`
- `app/global-income/(auth)/refund-account/hooks/useUpdateDeclareRefundAccount.ts`
- `app/global-income/(auth)/tax-result/components/IncomeTaxDeclareDetail.tsx`
- `app/global-income/(auth)/tax-result/graphql/incomeTaxDeclareResult.ts`
- `app/global-income/(auth)/tax-result/hooks/useGetIncomeTaxDeclareResult.ts`
- `app/vat/estimated-tax/(main)/hooks/useDeclareRefundAccount.ts`
- `app/vat/hooks/useAccountRefund.ts`

## API 상세

---

<a id="09-01"></a>

### 09-01 `checkIncomeIntroStatus` — 종소세 신고 단계 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckIncomeIntroStatusOutput` · union 4종)

```ts
{
  __typename: 'IncomeTaxDeclareStage';
  stage: IncomeTaxDeclareStageEnum | null;
  stlAgrAt: unknown /* DateTime */ | null;
}
| {
  __typename: 'NoTargetIncomeTaxDeclare';
}
| {
  __typename: 'IncomeTaxDeclareCancelled';
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeTaxDeclareCancelled` `NoTargetIncomeTaxDeclare`

**프론트**
- 연산: `checkIncomeIntroStatusQuery` (`app/global-income/(auth)/graphql/checkIncomeIntroStatus.ts`)
- 쓰는 파일 (5): `app/(my-info)/home/components/InternalLinkSection.tsx`, `app/global-income/(auth)/flowstatus/components/status/FlowContents.tsx`, `app/global-income/(auth)/flowstatus/components/status/flowComponents.ts`, `app/global-income/(auth)/hooks/useCheckIncomeIntroStatus.ts`, `app/global-income/(auth)/payment-agree/hooks/usePaymentAgreeRedirect.ts`

---

<a id="09-02"></a>

### 09-02 `checkIncomeFirstEnter` — 첫 종소세 진입여부 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeFirstEnterOutput` · union 2종)

```ts
{
  __typename: 'IncomeFirstEnter';
  enterFirstYn: boolean;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `checkIncomeFirstEnterQuery` (`app/global-income/(auth)/graphql/checkIncomeFirstEnter.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/intro/hooks/useCheckIncomeFirstEnter.ts`

---

<a id="09-03"></a>

### 09-03 `updateIncomeFirstEnter` — 종소세 첫 진입여부 업데이트

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
| `firstEnterYn` | `boolean` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateFirstEnterOutput` · union 3종)

```ts
{
  __typename: 'UpdateFirstEnterSucceed';
}
| {
  __typename: 'NotFoundVatDeclare';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdateFirstEnterSucceed`

**프론트**
- 연산: `updateIncomeFirstEnterMutation` (`app/global-income/(auth)/graphql/updateIncomeFirstEnter.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/intro/hooks/useUpdateIncomeFirstEnter.ts`

---

<a id="09-04"></a>

### 09-04 `incomeTaxStlAgree` — 종소세 결제 동의

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeTaxStlAgreeOutput` · union 3종)

```ts
{
  __typename: 'IncomeTaxStlAgreeSucceed';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { __typename: 'NoTargetIncomeTaxDeclare' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeTaxStlAgreeSucceed`

**프론트**
- 연산: `incomeTaxStlAgreeMutation` (`app/global-income/(auth)/payment-agree/graphql/incomeTaxStlAgree.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/payment-agree/hooks/useIncomeTaxStlAgree.ts`

---

<a id="09-05"></a>

### 09-05 `checkAllMaterialApplied` — 종소세 모든 자료 반영 여부

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `AllMaterialAppliedOutput` · union 2종)

```ts
{
  __typename: 'AllMaterialApplied';
  appliedYn: boolean;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `AllMaterialApplied`

**프론트**
- 연산: `checkAllMaterialAppliedQuery` (`app/global-income/(auth)/estimated-tax/graphql/checkAllMaterialApplied.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/estimated-tax/hooks/useCheckAllMaterialApplied.ts`, `app/global-income/(auth)/estimated-tax/hooks/useEstimatedTaxComplete.ts`

---

<a id="09-06"></a>

### 09-06 `incomeTaxDeclareEstimatedTax` — 종소세 예상세액 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeTaxDeclareEstimatedTaxOutput` · union 2종)

```ts
{
  __typename: 'IncomeTaxDeclareEstimatedTax';
  filingInfo: { // FilingInfo
    name: string | null;
    bookkeeping: string | null;
    filingType: string | null;
    reportType: string | null;
  } | null;
  incomeTaxInfo: { // IncomeTaxInfo
    totalAmount: { // FeeInfo
      type: TaxBillTypeEnum | null;
      amount: number | null;
    } | null;
    paidTaxInfo: { // PaidTaxInfo
      paidTax: number | null;
      paidTaxDetailList: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    } | null;
    finalTaxAmount: number | null;
  } | null;
  localTaxInfo: { // FeeInfo
    type: TaxBillTypeEnum | null;
    amount: number | null;
  } | null;
  incomeAndTaxRateInfo: { // IncomeAndTaxRateInfo
    businessIncome: { // BizIncomeItemList
      totalAmount: number | null;
      itemList: { // BizIncomeItem
        bizName: string | null;
        bizNo: string | null;
        netIncome: number | null;
        income: number | null;
        expense: number | null;
        additionalExpenseInfo: { // AdditionalExpenseInfo
          totalAmount: number | null;
          additionalExpenseList: { // AdditionalExpenseListItem
            typeName: AdditionalExpenseBillTypeEnum;
            amount: number;
          }[] | null;
        } | null;
      }[] | null;
    } | null;
    personalServiceIncomeList: { // DetailList
      totalAmount: number | null;
      itemList: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    } | null;
    financialIncomeList: { // DetailList
      totalAmount: number | null;
      itemList: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    } | null;
    earnedIncomeList: { // DetailList
      totalAmount: number | null;
      itemList: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    } | null;
    otherIncomeList: { // DetailList
      totalAmount: number | null;
      itemList: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    } | null;
    pensionIncomeList: { // DetailList
      totalAmount: number | null;
      itemList: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    } | null;
    totalIncomeAmount: number | null;
    taxRate: number | null;
  } | null;
  deductionAndReliefInfo: { // DeductionAndReliefInfo
    incomeDeductionDetail: { // IncomeDeductionDetail
      totalAmount: number | null;
      baseDeduction: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
      additionalDeduction: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
      pensionDeduction: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
      housingPensionInterestDeduction: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
      specialDeduction: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    } | null;
    taxReliefDetail: { // DetailList
      totalAmount: number | null;
      itemList: { // ListItem
        typeName: string | null;
        amount: number | null;
      }[] | null;
    } | null;
  } | null;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `incomeTaxDeclareEstimatedTaxQuery` (`app/global-income/(auth)/estimated-tax/graphql/incomeTaxDeclareEstimatedTax.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/estimated-tax/hooks/useGetIncomeTaxDeclareEstimatedTax.ts`

---

<a id="09-07"></a>

### 09-07 `checkBankAccountForDeclare` — 신고용 환급 예금주 조회

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckBankAccountOutput` · union 4종)

```ts
{
  __typename: 'IncorrectBankAccountOwner';
  message: string;
}
| {
  __typename: 'IncorrectBankAccountNumber';
  message: string;
}
| {
  __typename: 'CheckBankAccountSucceed';
  accountOwner: string;
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
- 연산: `checkBankAccountForDeclareQuery` (`app/global-income/(auth)/refund-account/graphql/checkBankAccountForDeclare.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/refund-account/hooks/useUpdateDeclareRefundAccount.ts`, `app/vat/hooks/useAccountRefund.ts`

---

<a id="09-08"></a>

### 09-08 `declareRefundAccount` — 환급계좌 입력

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
| `declareType` | `DeclareTypeEnum` | ✅ | 보냄 |  |
| `bmanTin` | `string \| null` |  | 보냄 | 부가세 신고 시만 필요 |
| `bank` | `string` | ✅ | 보냄 |  |
| `accountNo` | `string` | ✅ | 보냄 |  |
| `accountOwner` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeclareRefundAccountOutput` · union 2종)

```ts
{
  __typename: 'DeclareRefundAccountSucceed';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeclareRefundAccountSucceed`

**프론트**
- 연산: `declareRefundAccountMutation` (`app/global-income/(auth)/refund-account/graphql/declareRefundAccount.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/refund-account/hooks/useUpdateDeclareRefundAccount.ts`, `app/vat/estimated-tax/(main)/hooks/useDeclareRefundAccount.ts`, `app/vat/hooks/useAccountRefund.ts`

---

<a id="09-09"></a>

### 09-09 `refundClaimList` — 경정청구(환급) 내역 홈택스 수집 — 중소기업 감면 화면 (스키마 설명 '연말정산 다운로드' 는 복사 실수로 보임)

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetRefundClaimListOutput` · union 4종)

```ts
{
  __typename: 'GetRefundClaimListComplete';
  message: string;
}
| {
  __typename: 'HometaxFailed';
  type: HtxError;
  msg: string;
}
| {
  __typename: 'GetRefundClaimListRpnTinMismatch';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetRefundClaimListComplete` `GetRefundClaimListRpnTinMismatch` `HometaxFailed`

**프론트**
- 연산: `refundClaimListMutation` (`app/global-income/(auth)/graphql/refundClaimList.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/reductions-sme/refund-history/input/components/CollectProcessDrawer.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/refund-history/input/hooks/useRefundClaimList.ts`

---

<a id="09-10"></a>

### 09-10 `incomeTaxDeclareStageConfirm` — 종소세신고 유저 단계 확정

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeTaxDeclareStageConfirmOutput` · union 4종)

```ts
{
  __typename: 'IncomeTaxDeclareStageConfirmSucceed';
  message: string;
}
| {
  __typename: 'ExistNotAppliedMaterial';
  message: string;
}
| {
  __typename: 'RequiredRefundAccountInput';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeTaxDeclareStageConfirmSucceed` `RequiredRefundAccountInput`

**프론트**
- 연산: `incomeTaxDeclareStageConfirmMutation` (`app/global-income/(auth)/graphql/incomeTaxDeclareStageConfirm.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/(submit-material)/main/hooks/useUpdateIncomeSubmitComplete.ts`, `app/global-income/(auth)/estimated-tax/hooks/useEstimatedTaxComplete.ts`, `app/global-income/(auth)/hooks/useIncomeTaxDeclareStageConfirm.ts`

---

<a id="09-11"></a>

### 09-11 `incomeTaxDeclareResult` — 종소세 신고 결과

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeTaxDeclareResultOutput` · union 2종)

```ts
{ // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'IncomeTaxDeclareResult';
  declareId: number;
  year: string;
  globalIncomeTax: { // TaxInfo
    type: TaxBillTypeEnum;
    amount: string;
  } | null;
  localIncomeTax: { // TaxInfo
    type: TaxBillTypeEnum;
    amount: string;
  } | null;
  bookType: string;
  reportCategory: string;
  reportType: string;
  reportDate: string;
  refundAccount: { // RefundAccount
    accountNo: string;
    bank: string;
  } | null;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `incomeTaxDeclareResultQuery` (`app/global-income/(auth)/tax-result/graphql/incomeTaxDeclareResult.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/history/detail/components/GlobalIncomeHistoryDetailContent.tsx`, `app/global-income/(auth)/tax-result/components/IncomeTaxDeclareDetail.tsx`, `app/global-income/(auth)/tax-result/hooks/useGetIncomeTaxDeclareResult.ts`

---

<a id="09-12"></a>

### 09-12 `incomeTaxDeclareList` — 종소세 신고 목록 (resultTax 보유분)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeTaxDeclareListOutput` · union 3종)

```ts
{
  __typename: 'IncomeTaxDeclareList';
  groups: { // IncomeTaxDeclareListGroup
    reportYearMonth: string;
    items: { // IncomeTaxDeclareListItem
      declareId: number;
      year: string;
      localIncomeTax: { // TaxInfo
        type: TaxBillTypeEnum;
        amount: string;
      } | null;
      globalIncomeTax: { // TaxInfo
        type: TaxBillTypeEnum;
        amount: string;
      } | null;
    }[];
  }[];
}
| {
  __typename: 'NoIncomeTaxDeclareList';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeTaxDeclareList` `NoIncomeTaxDeclareList` `TemporaryError`

**프론트**
- 연산: `incomeTaxDeclareListQuery` (`app/global-income/(auth)/history/graphql/incomeTaxDeclareList.ts`)
- 쓰는 파일 (5): `app/global-income/(auth)/history/components/GlobalIncomeHistoryList.tsx`, `app/global-income/(auth)/history/components/GlobalIncomeHistoryListCard.tsx`, `app/global-income/(auth)/history/constants/taxBillType.ts`, `app/global-income/(auth)/history/hooks/useIncomeTaxDeclareList.ts`, `app/global-income/(auth)/history/page.tsx`

---

<a id="09-13"></a>

### 09-13 `incomeTaxDeclareResultById` — declareId로 종소세 신고 결과 조회

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
| `declareId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeTaxDeclareDetailOutput` · union 3종)

```ts
{
  __typename: 'IncomeTaxDeclareDetail';
  declareId: number;
  taxpayerName: string;
  year: string;
  reportDate: string;
  bookType: string;
  reportType: string;
  localIncomeTax: { // TaxInfo
    type: TaxBillTypeEnum;
    amount: string;
  } | null;
  globalIncomeTax: { // TaxInfo
    type: TaxBillTypeEnum;
    amount: string;
  } | null;
  refundAccount: { // RefundAccount
    bank: string;
    accountNo: string;
  } | null;
}
| {
  __typename: 'NoIncomeTaxDeclareDetail';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeTaxDeclareDetail` `NoIncomeTaxDeclareDetail` `TemporaryError`

**프론트**
- 연산: `incomeTaxDeclareResultByIdQuery` (`app/global-income/(auth)/history/graphql/incomeTaxDeclareResultById.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/history/hooks/useIncomeTaxDeclareResultById.ts`
