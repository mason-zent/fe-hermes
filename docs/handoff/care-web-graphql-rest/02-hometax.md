# 02. 홈택스 연동·수임 동의·4대보험

> [README](./README.md) · API 11개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [02-01](#02-01) | `hometaxSimpleLogin` | 변경 | 홈택스 간편인증 step1 | | ☐ | ☐ |
| [02-02](#02-02) | `hometaxSimpleLoginConfirm` | 변경 | 홈택스 간편인증 step2 | | ☐ | ☐ |
| [02-03](#02-03) | `hometaxIdConnect` | 변경 | 홈택스 아이디 연동 | | ☐ | ☐ |
| [02-04](#02-04) | `hometaxChangePassword` | 변경 | 홈택스 비밀번호 변경 | | ☐ | ☐ |
| [02-05](#02-05) | `issueTmpCrdtlsCer` | 변경 | 파일 외부 다운로드용 임시 인증 발급 (스키마 설명 없음 — 추측) | | ☐ | ☐ |
| [02-06](#02-06) | `redeemTmpCrdtlsCer` | 변경 | 임시 인증으로 외부 파일 다운로드 권한 교환 (스키마 설명 없음 — 추측) | | ☐ | ☐ |
| [02-07](#02-07) | `hometaxOrgs` | 조회 | 홈택스 사업체 조회 (수임동의요청) | | ☐ | ☐ |
| [02-08](#02-08) | `taxAgencyAgree` | 변경 | 홈택스 수임동의 | | ☐ | ☐ |
| [02-09](#02-09) | `survey` | 변경 | 설문지 작성 | | ☐ | ☐ |
| [02-10](#02-10) | `fourInsureDelegationOrgs` | 조회 | 4대보험 위임 대상 사업장 조회 (스키마 설명 없음) | | ☐ | ☐ |
| [02-11](#02-11) | `fourInsureDelegationAgreement` | 변경 | 4대보험 위임 동의 (스키마 설명 없음) | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `CareType`: `Vat` · `Book` · `IncomeTax` · `NotSupport`
- `EtcSurveyType`: `Tax_Agent`
- `SimpleAuthReqType`: `Delegation` · `Password_Change`

## 프론트 작업 파일 (64) — `apps/care-web/` 기준

- `app/(auth)/(homeTax)/delegation/(stage)/corporations/components/DelegationOrgList.tsx`
- `app/(auth)/(homeTax)/delegation/(stage)/corporations/hooks/useTaxAgencyAgree.ts`
- `app/(auth)/(homeTax)/delegation/(stage)/graphql/hometaxOrgs.ts`
- `app/(auth)/(homeTax)/delegation/(stage)/graphql/hometaxSimpleLogin.ts`
- `app/(auth)/(homeTax)/delegation/(stage)/graphql/taxAgencyAgree.ts`
- `app/(auth)/(homeTax)/delegation/(stage)/hooks/useHometaxOrgQuery.ts`
- `app/(auth)/(homeTax)/linkhometax/(nonStage)/graphql/hometaxChangePassword.ts`
- `app/(auth)/(homeTax)/linkhometax/(nonStage)/passwordchange/hooks/useChangeHometaxPassword.ts`
- `app/(auth)/(homeTax)/linkhometax/(stage)/graphql/hometaxIdConnect.ts`
- `app/(auth)/(homeTax)/linkhometax/hooks/useHometaxIdConnect.ts`
- `app/(auth)/four-insurance/(orgList)/agreements/graphql/fourInsureDelegationAgreement.ts`
- `app/(auth)/four-insurance/(orgList)/agreements/hooks/useFourInsuranceSignature.ts`
- `app/(auth)/four-insurance/(orgList)/agreements/hooks/useFourInsureDelegationAgreement.ts`
- `app/(auth)/four-insurance/(orgList)/agreements/hooks/useGetFilteredOrgList.ts`
- `app/(auth)/four-insurance/components/FourInsuranceOrg.tsx`
- `app/(auth)/four-insurance/components/FourInsuranceOrgList.tsx`
- `app/(auth)/four-insurance/graphql/fourInsureDelegationOrgs.ts`
- `app/(auth)/four-insurance/hooks/useCheckFourInsuranceStatus.ts`
- `app/(auth)/provider/FourInsureDelegationOrgsProvider.tsx`
- `app/(auth)/taxagentinput/(stage)/graphql/survey.ts`
- `app/(auth)/taxagentinput/(stage)/page.tsx`
- `app/(external-file-download)/file-download/vat/book-bill/page.tsx`
- `app/(external-file-download)/hooks/useFileDownloadExternalBase.ts`
- `app/(external-file-download)/hooks/useRedeemTmpCrdtlsCer.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/detail/components/CardDetailView.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/components/MilitarySurveyList.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/components/OrgSurveyList.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/components/ReductionsSmeBottomButton.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/components/SurveyContinueDialog.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/usePrevMilitaryPeriodPrompt.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useSurvey.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/OrgSurveyComponents.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/OrgSurveyFunnel.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/business-address/BusinessAddress.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/co-founder/CoFounder.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/same-business/SameBusiness.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/small-business/SmallBusiness.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/startup-method/StartupMethod.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/constants/initialSurveyData.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useGetSmeInfo.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSessionSurveyData.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSubmitSurvey.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSurveyModalState.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/page.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/page.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/survey-complete/page.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/survey-summary/components/RestartSurveyDialog.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/survey-summary/page.tsx`
- `app/global-income/(auth)/graphql/smeTaxExemptionDetail.ts`
- `app/global-income/(auth)/graphql/smeTaxExemptionMilitaryDetailFields.ts`
- `app/global-income/(auth)/graphql/smeTaxExemptionOrgSurveyDetailFields.ts`
- `app/pricing/(experiment)/verification/business-query/graphql/hometaxOrgsV2.ts`
- `app/pricing/(experiment)/verification/business-query/hooks/useGetHometaxOrg.ts`
- `app/vat/hooks/useBaseFileDownload.ts`
- `app/vat/hooks/useBookBillDownload.ts`
- `app/vat/hooks/useIssueTmpCrdtlsCer.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/components/CardDetailView.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/utils/formattingRealEstateValue.ts`
- `constants/paths.ts`
- `graphql/hometaxSimpleLoginConfirm.ts`
- `graphql/issueTmpCrdtlsCer.ts`
- `graphql/redeemTmpCrdtlsCer.ts`
- `hooks/useGetMktIdRpntin.ts`
- `hooks/useHometaxSimpleAuth.ts`

## API 상세

---

<a id="02-01"></a>

### 02-01 `hometaxSimpleLogin` — 홈택스 간편인증 step1

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
| `requestType` | `SimpleAuthReqType \| null` |  | 보냄 |  |
| `simpleAuthUser` | `SimpleAuthUserType` | ✅ | 보냄 |  |
| `simpleAuthUser.name` | `string` | ✅ | 보냄 |  |
| `simpleAuthUser.phone` | `string` | ✅ | 보냄 |  |
| `simpleAuthUser.birthday` | `string` | ✅ | 보냄 |  |
| `isForeigner` | `boolean \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxSimpleLoginOutput` · union 3종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'ForeignerProhibited';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'HometaxSimpleLoginSucceed';
  cxId: string | null;
  reqTxId: string | null;
  token: string | null;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ForeignerProhibited` `HometaxSimpleLoginSucceed`

**프론트**
- 연산: `hometaxSimpleLoginMutation` (`app/(auth)/(homeTax)/delegation/(stage)/graphql/hometaxSimpleLogin.ts`)
- 쓰는 파일 (1): `hooks/useHometaxSimpleAuth.ts`

---

<a id="02-02"></a>

### 02-02 `hometaxSimpleLoginConfirm` — 홈택스 간편인증 step2

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
| `requestType` | `SimpleAuthReqType \| null` |  | 보냄 |  |
| `simpleAuthUser` | `SimpleAuthUserType` | ✅ | 보냄 |  |
| `simpleAuthUser.name` | `string` | ✅ | 보냄 |  |
| `simpleAuthUser.phone` | `string` | ✅ | 보냄 |  |
| `simpleAuthUser.birthday` | `string` | ✅ | 보냄 |  |
| `simpleAuthToken` | `SimpleAuthTokenType` | ✅ | 보냄 |  |
| `simpleAuthToken.reqTxId` | `string` | ✅ | 보냄 |  |
| `simpleAuthToken.token` | `string` | ✅ | 보냄 |  |
| `simpleAuthToken.cxId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxSimpleLoginConfirmOutput` · union 5종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'HometaxSimpleLoginConfirmSucceed';
  hometaxToken: string;
}
| {
  __typename: 'HometaxSimpleAuthTimeout';
  message: string;
}
| {
  __typename: 'HometaxSimpleAuthNoConfirm';
  message: string;
}
| {
  __typename: 'HometaxExpiredSession';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `HometaxSimpleLoginConfirmSucceed`

**프론트**
- 연산: `hometaxSimpleLoginConfirmMutation` (`graphql/hometaxSimpleLoginConfirm.ts`)
- 쓰는 파일 (1): `hooks/useHometaxSimpleAuth.ts`

---

<a id="02-03"></a>

### 02-03 `hometaxIdConnect` — 홈택스 아이디 연동

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
| `careType` | `CareType` | ✅ | 보냄 |  |
| `id` | `string` | ✅ | 보냄 |  |
| `pwd` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxIdConnectOutput` · union 4종)

```ts
{
  __typename: 'HometaxIdConnectSucceed';
  message: string;
}
| {
  __typename: 'HometaxBlockId';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'HometaxPasswordError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `HometaxBlockId` `HometaxIdConnectSucceed` `HometaxPasswordError`

**프론트**
- 연산: `hometaxIdConnectMutation` (`app/(auth)/(homeTax)/linkhometax/(stage)/graphql/hometaxIdConnect.ts`)
- 쓰는 파일 (2): `app/(auth)/(homeTax)/linkhometax/hooks/useHometaxIdConnect.ts`, `hooks/useGetMktIdRpntin.ts`

---

<a id="02-04"></a>

### 02-04 `hometaxChangePassword` — 홈택스 비밀번호 변경

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
| `hometaxToken` | `string` | ✅ | 보냄 |  |
| `regNo` | `string` | ✅ | 보냄 |  |
| `newPwd` | `string` | ✅ | 보냄 |  |
| `hometaxId` | `string` | ✅ | 보냄 |  |
| `name` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxChangePasswordOutput` · union 2종)

```ts
{
  __typename: 'HometaxChangePasswordSucceed';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `HometaxChangePasswordSucceed`

**프론트**
- 연산: `hometaxChangePasswordMutation` (`app/(auth)/(homeTax)/linkhometax/(nonStage)/graphql/hometaxChangePassword.ts`)
- 쓰는 파일 (1): `app/(auth)/(homeTax)/linkhometax/(nonStage)/passwordchange/hooks/useChangeHometaxPassword.ts`

---

<a id="02-05"></a>

### 02-05 `issueTmpCrdtlsCer` — 파일 외부 다운로드용 임시 인증 발급 (스키마 설명 없음 — 추측)

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IssueTmpCrdtlsCerOutput` · union 3종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IssueTmpCrdtlsCerSucceedOutput';
  message: string;
  tmpCrdtlsCerCd: string;
}
| { __typename: 'TmpCrdtlsCerUnauthorizedOutput' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IssueTmpCrdtlsCerSucceedOutput`

**프론트**
- 연산: `issueTmpCrdtlsCerMutation` (`graphql/issueTmpCrdtlsCer.ts`)
- 쓰는 파일 (3): `app/vat/hooks/useBaseFileDownload.ts`, `app/vat/hooks/useBookBillDownload.ts`, `app/vat/hooks/useIssueTmpCrdtlsCer.ts`

---

<a id="02-06"></a>

### 02-06 `redeemTmpCrdtlsCer` — 임시 인증으로 외부 파일 다운로드 권한 교환 (스키마 설명 없음 — 추측)

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
| `tmpCrdtlsCerCd` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RedeemTmpCrdtlsCerOutput` · union 6종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TmpCrdtlsCerAlreadyRedeemedOutput';
  message: string;
}
| {
  __typename: 'TmpCrdtlsCerExpirationNotValidOutput';
  message: string;
}
| {
  __typename: 'TmpCrdtlsCerExpiredOutput';
  message: string;
}
| {
  __typename: 'TmpCrdtlsCerNotFoundOutput';
  message: string;
}
| {
  __typename: 'RedeemTmpCrdtlsCerSucceedOutput';
  message: string;
  crdtlsCerInfr: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `TemporaryError` `TmpCrdtlsCerAlreadyRedeemedOutput` `TmpCrdtlsCerExpirationNotValidOutput` `TmpCrdtlsCerExpiredOutput` `TmpCrdtlsCerNotFoundOutput`

**프론트**
- 연산: `redeemTmpCrdtlsCerMutation` (`graphql/redeemTmpCrdtlsCer.ts`)
- 쓰는 파일 (3): `app/(external-file-download)/file-download/vat/book-bill/page.tsx`, `app/(external-file-download)/hooks/useFileDownloadExternalBase.ts`, `app/(external-file-download)/hooks/useRedeemTmpCrdtlsCer.ts`

---

<a id="02-07"></a>

### 02-07 `hometaxOrgs` — 홈택스 사업체 조회 (수임동의요청)

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
| `simpleAuthUser` | `SimpleAuthUserType` | ✅ | 보냄 |  |
| `simpleAuthUser.name` | `string` | ✅ | 보냄 |  |
| `simpleAuthUser.phone` | `string` | ✅ | 보냄 |  |
| `simpleAuthUser.birthday` | `string` | ✅ | 보냄 |  |
| `hometaxToken` | `string` | ✅ | 보냄 |  |
| `cookie` | `string \| null` |  | 보냄 |  |
| `exceptionClosedOrg` | `boolean` | ✅ | 보냄 |  |
| `allowAnyIndustries` | `boolean` | ✅ | 보냄 | 사용자의 사업장들이 수임 불가한 사업장이어도 허용할지 여부 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxOrgsOutput` · union 11종)

```ts
{
  __typename: 'HometaxOrgs';
  hometaxOrgs: { // HometaxOrgType
    bizName: string;
    closedBizAt: string | null;
    openingBizAt: string | null;
    bizNo: string;
    bmanTin: string;
    status: string;
    bizTypeCode: string | null;
    bizAddress: string | null;
  }[] | null;
  hometaxUser: { // HometaxUserType
    tin: string;
    hometaxId: string;
    regNo: string | null;
  };
  isSincereUser: boolean;
  cookie: string | null;
}
| {
  __typename: 'JoinedOtherEmail';
  email: string;
  message: string;
}
| {
  __typename: 'NoCareTarget';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'NotEqualRpnTin';
  message: string;
  userName: string;
}
| {
  __typename: 'HometaxExpiredSession';
  message: string;
}
| {
  __typename: 'HometaxOrgAlreadyCare';
  message: string;
}
| {
  __typename: 'HometaxOrgNotFound';
  message: string;
}
| {
  __typename: 'HometaxTimeout';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'HometaxOrgOnlyPermanentlyClosed';
  message: string;
}
| { __typename: 'TaxFreeBmanError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `HometaxExpiredSession` `HometaxOrgAlreadyCare` `HometaxOrgNotFound` `HometaxOrgOnlyPermanentlyClosed` `HometaxOrgs` `HometaxTimeout` `JoinedOtherEmail` `NoCareTarget` `NotEqualRpnTin` `TaxFreeBmanError` `TemporaryError`

**프론트**
- 연산: `hometaxOrgsQuery` (`app/(auth)/(homeTax)/delegation/(stage)/graphql/hometaxOrgs.ts`)
- 쓰는 파일 (4): `app/(auth)/(homeTax)/delegation/(stage)/corporations/components/DelegationOrgList.tsx`, `app/(auth)/(homeTax)/delegation/(stage)/corporations/hooks/useTaxAgencyAgree.ts`, `app/(auth)/(homeTax)/delegation/(stage)/hooks/useHometaxOrgQuery.ts`, `app/pricing/(experiment)/verification/business-query/hooks/useGetHometaxOrg.ts`

---

<a id="02-08"></a>

### 02-08 `taxAgencyAgree` — 홈택스 수임동의

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
| `careType` | `CareType` | ✅ | 보냄 |  |
| `simpleAuthUser` | `SimpleAuthUserType` | ✅ | 보냄 |  |
| `simpleAuthUser.name` | `string` | ✅ | 보냄 |  |
| `simpleAuthUser.phone` | `string` | ✅ | 보냄 |  |
| `simpleAuthUser.birthday` | `string` | ✅ | 보냄 |  |
| `hometaxLoginToken` | `string` | ✅ | 보냄 |  |
| `hometaxUser` | `HometaxUserInput` | ✅ | 보냄 |  |
| `hometaxUser.regNo` | `string \| null` |  | 보냄 |  |
| `hometaxUser.hometaxId` | `string` | ✅ | 보냄 |  |
| `hometaxUser.tin` | `string` | ✅ | 보냄 |  |
| `hometaxOrgs` | `HometaxOrgInput[]` | ✅ | 보냄 |  |
| `hometaxOrgs.status` | `string` | ✅ | 보냄 |  |
| `hometaxOrgs.bizName` | `string` | ✅ | 보냄 |  |
| `hometaxOrgs.bmanTin` | `string` | ✅ | 보냄 |  |
| `hometaxOrgs.bizNo` | `string` | ✅ | 보냄 |  |
| `hometaxOrgs.closedBizAt` | `string \| null` |  | 보냄 |  |
| `hometaxOrgs.openingBizAt` | `string \| null` |  | 보냄 |  |
| `hometaxOrgs.bizTypeCode` | `string \| null` |  | 보냄 |  |
| `hometaxOrgs.bizAddress` | `string \| null` |  | 보냄 |  |
| `autoPricing` | `boolean \| null` |  | 보냄 |  |
| `isSincereUser` | `boolean \| null` |  | 보냄 |  |
| `cookie` | `string \| null` |  | 보냄 |  |
| `fbc` | `string \| null` |  | 보냄 |  |
| `fbp` | `string \| null` |  | 보냄 |  |
| `gaClientId` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `TaxAgencyAgreeOutput` · union 6종)

```ts
{
  __typename: 'TaxAgencyAgreeSucceed';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'ExsitOtherAgency';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'HometaxExpiredSession';
  message: string;
}
| {
  __typename: 'IncorrectRegno';
  message: string;
}
| {
  __typename: 'CarePlusHistoryNotAllowedForDelegation';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `CarePlusHistoryNotAllowedForDelegation` `ExsitOtherAgency` `HometaxExpiredSession` `IncorrectRegno` `TaxAgencyAgreeSucceed`

**프론트**
- 연산: `taxAgencyAgreeMutation` (`app/(auth)/(homeTax)/delegation/(stage)/graphql/taxAgencyAgree.ts`)
- 쓰는 파일 (1): `app/(auth)/(homeTax)/delegation/(stage)/corporations/hooks/useTaxAgencyAgree.ts`

---

<a id="02-09"></a>

### 02-09 `survey` — 설문지 작성

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
| `etcSurveyType` | `EtcSurveyType` | ✅ | 보냄 |  |
| `survey` | `unknown /* JSON */` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyOutput` · union 2종)

```ts
{
  __typename: 'SurveySucceed';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `SurveySucceed`

**프론트**
- 연산: `surveyMutation` (`app/(auth)/taxagentinput/(stage)/graphql/survey.ts`)
- 쓰는 파일 (28): `app/(auth)/taxagentinput/(stage)/page.tsx`, `app/global-income/(auth)/(submit-material)/card-expense/detail/components/CardDetailView.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/components/MilitarySurveyList.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/components/OrgSurveyList.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/components/ReductionsSmeBottomButton.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/components/SurveyContinueDialog.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/usePrevMilitaryPeriodPrompt.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useSurvey.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/OrgSurveyComponents.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/OrgSurveyFunnel.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/business-address/BusinessAddress.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/co-founder/CoFounder.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/same-business/SameBusiness.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/small-business/SmallBusiness.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/components/startup-method/StartupMethod.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/constants/initialSurveyData.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useGetSmeInfo.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSessionSurveyData.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSubmitSurvey.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSurveyModalState.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/page.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/page.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/survey-complete/page.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/survey-summary/components/RestartSurveyDialog.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/survey-summary/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/components/CardDetailView.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/utils/formattingRealEstateValue.ts`, `constants/paths.ts`

---

<a id="02-10"></a>

### 02-10 `fourInsureDelegationOrgs` — 4대보험 위임 대상 사업장 조회 (스키마 설명 없음)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `FourInsureDelegationOrgsOutput` · union 4종)

```ts
{
  __typename: 'AlreadyFourInsureDelegation';
  message: string;
}
| {
  __typename: 'NoFourInsureDelegation';
  message: string;
}
| {
  __typename: 'FourInsureDelegationRequiringOrgs';
  orgs: { // FourInsureDelegationRequiringOrg
    bizAddress: string;
    bizName: string;
    bizNo: string;
    industry: string;
    phone: string;
    regNo: string;
    userName: string;
    bmanTin: string;
  }[];
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `AlreadyFourInsureDelegation` `NoFourInsureDelegation`

**프론트**
- 연산: `fourInsureDelegationOrgsQuery` (`app/(auth)/four-insurance/graphql/fourInsureDelegationOrgs.ts`)
- 쓰는 파일 (5): `app/(auth)/four-insurance/(orgList)/agreements/hooks/useGetFilteredOrgList.ts`, `app/(auth)/four-insurance/components/FourInsuranceOrg.tsx`, `app/(auth)/four-insurance/components/FourInsuranceOrgList.tsx`, `app/(auth)/four-insurance/hooks/useCheckFourInsuranceStatus.ts`, `app/(auth)/provider/FourInsureDelegationOrgsProvider.tsx`

---

<a id="02-11"></a>

### 02-11 `fourInsureDelegationAgreement` — 4대보험 위임 동의 (스키마 설명 없음)

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
| `bmanTin` | `string[]` | ✅ | 보냄 |  |
| `signature` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `FourInsureDelegationAgreementOutput` · union 2종)

```ts
{
  __typename: 'FourInsureDelegationAgreementSucceed';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `FourInsureDelegationAgreementSucceed`

**프론트**
- 연산: `fourInsureDelegationAgreementMutation` (`app/(auth)/four-insurance/(orgList)/agreements/graphql/fourInsureDelegationAgreement.ts`)
- 쓰는 파일 (2): `app/(auth)/four-insurance/(orgList)/agreements/hooks/useFourInsuranceSignature.ts`, `app/(auth)/four-insurance/(orgList)/agreements/hooks/useFourInsureDelegationAgreement.ts`
