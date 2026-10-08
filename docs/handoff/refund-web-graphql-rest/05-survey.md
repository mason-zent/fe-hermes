# 05. 설문

> [README](./README.md) · API 14개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [05-01](#05-01) | `getSurvey` | 조회 | 설문 조회 | | ☐ | ☐ |
| [05-02](#05-02) | `getSurveyTarget` | 조회 | 설문 대상 조회 | | ☐ | ☐ |
| [05-03](#05-03) | `getSurveyStatus` | 조회 | 설문 진행 상태 조회 | | ☐ | ☐ |
| [05-04](#05-04) | `getSurveyAddress` | 조회 | 주소(법정동) 조회 | | ☐ | ☐ |
| [05-05](#05-05) | `getSurveyBusinessInfo` | 조회 | 사업장 정보 조회 | | ☐ | ☐ |
| [05-06](#05-06) | `getSurveyBusinessAnswer` | 조회 | 사업 문항 답변 조회 | | ☐ | ☐ |
| [05-07](#05-07) | `getSurveyEmployees` | 조회 | 직원 목록 조회 | | ☐ | ☐ |
| [05-08](#05-08) | `getSurveyEmploymentAnswer` | 조회 | 고용 문항 답변 조회 | | ☐ | ☐ |
| [05-09](#05-09) | `isCertNeed` | 조회 | 추가 인증 필요 여부 조회 | | ☐ | ☐ |
| [05-10](#05-10) | `putSurveyAnswer` | 변경 | 설문 답변 저장(put) | | ☐ | ☐ |
| [05-11](#05-11) | `saveSurveyAnswer` | 변경 | 설문 답변 저장(save) | | ☐ | ☐ |
| [05-12](#05-12) | `submitSurvey` | 변경 | 설문 제출 | | ☐ | ☐ |
| [05-13](#05-13) | `upsertBusinessAnswer` | 변경 | 사업 문항 답변 부분 저장 | | ☐ | ☐ |
| [05-14](#05-14) | `upsertEmploymentAnswer` | 변경 | 고용 문항 답변 부분 저장 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `BusinessPlaceType`: `own` · `lease` · `noHave` · `etc`
- `DeductionType`: `startup` · `sme` · `employmentIncrease` · `socialInsurancePremium` · `employmentIntegration`
- `EmploymentContractsType`: `all` · `some` · `none` · `blank`
- `NewSignboardType`: `newSignboard` · `takingOver` · `noHave`
- `PartnerAtEstablishmentType`: `yes` · `joinMidway` · `no` · `blank`
- `PersonalDeductionStatus`: `Searching` · `BeforeSearch` · `SearchCompleted`
- `SurveyCode`: `REOPEN`
- `SurveyQuestionType`: `YES_NO` · `SINGLE` · `MULTI`
- `TakingOverEmployeesType`: `yes` · `no` · `unknown`
- `YesNoBlank`: `yes` · `no` · `blank`
- `YesNoBlankAddressUnknown`: `yes` · `no` · `blank` · `addressUnknown`
- `YesNoEtc`: `yes` · `no` · `etc`
- `ErrorType`(에러 코드) 은 [README 5-3](./README.md#5-3-에러-코드)

## 프론트 작업 파일 (56) — `apps/refund-web/` 기준

- `components/survey/business/first-location/AllLocationsContainer.tsx`
- `components/survey/business/first-location/IsFirstLocationContainer.tsx`
- `components/survey/business/first-location/LocationMoveYearContainer.tsx`
- `components/survey/business/partner/PartnerContainer.tsx`
- `components/survey/business/place-type/BusinessPlaceTypeContainer.tsx`
- `components/survey/business/same-industry-before/SameIndustryBeforeContainer.tsx`
- `components/survey/business/signboard/SignboardContainer.tsx`
- `components/survey/business/small-boss-machine-owner/SmallBossMachineOwnerContainer.tsx`
- `components/survey/business/start-business/StartBusinessContainer.tsx`
- `components/survey/business/takeover-employee/TakeoverEmployeeContainer.tsx`
- `components/survey/business/work-location-check/WorkLocationCheckContainer.tsx`
- `components/survey/common/BusinessProvider.tsx`
- `components/survey/common/LocationProvider.tsx`
- `components/survey/common/SurveyProvider.tsx`
- `components/survey/common/ui/AnswerList.tsx`
- `components/survey/employment/contracts/ContractsContainer.tsx`
- `components/survey/employment/special-relationships/CurrentlySpecialRelationshipsContainer.tsx`
- `components/survey/employment/special-relationships/PastToCurrentlySpecialRelationshipsContainer.tsx`
- `components/survey/employment/special-relationships/SpecialRelationshipsContainer.tsx`
- `components/survey/employment/special-relationships/SpecialRelationshipsSearchEmployee.tsx`
- `components/survey/home/SurveyHomeContainer.tsx`
- `components/survey/intro/SurveyIntroContainer.tsx`
- `components/tax-refund/apply/complete/CompleteCta.tsx`
- `components/tax-refund/home/StatusManualSection.tsx`
- `graphql/mutation/survey/business.ts`
- `graphql/mutation/survey/employment.ts`
- `graphql/mutation/survey/reopen.ts`
- `graphql/mutation/survey/submit.ts`
- `graphql/mutation/survey/update.ts`
- `graphql/query/survey/address.ts`
- `graphql/query/survey/business.ts`
- `graphql/query/survey/employment.ts`
- `graphql/query/survey/init.ts`
- `graphql/query/survey/reopen.ts`
- `graphql/query/tax-refund/personal-deduction.ts`
- `lib/hooks/survey/api/use-legal-address.ts`
- `lib/hooks/survey/api/use-upsert-business-answer.ts`
- `lib/hooks/survey/api/use-upsert-employment.ts`
- `lib/hooks/survey/use-reopen-survey.ts`
- `lib/stores/survey/business.ts`
- `lib/stores/survey/common.ts`
- `lib/types/survey.ts`
- `pages/survey/business/office-type.tsx`
- `pages/survey/business/partner.tsx`
- `pages/survey/business/same-industry-before.tsx`
- `pages/survey/business/signboard.tsx`
- `pages/survey/business/small-boss-machine-owner.tsx`
- `pages/survey/business/start-business.tsx`
- `pages/survey/business/takeover-employee.tsx`
- `pages/survey/business/work-location-check.tsx`
- `pages/survey/employment/contracts/index.tsx`
- `pages/survey/employment/special-relationships/currently/index.tsx`
- `pages/survey/employment/special-relationships/index.tsx`
- `pages/survey/employment/special-relationships/past-to-currently/index.tsx`
- `pages/survey/home/index.tsx`
- `pages/survey/intro/index.tsx`

## API 상세

---

<a id="05-01"></a>

### 05-01 `getSurvey` — 설문 조회

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
| `surveyCode` | `SurveyCode` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  surveyCode: SurveyCode | null;
  version: string | null;
  questions: { // SurveyQuestion
    code: string;
    step: number | null;
    type: SurveyQuestionType;
    icon: string | null;
    title: string;
    description: string | null;
    maxSelect: number;
    options: { // SurveyOption
      value: string;
      label: string;
      next: string | null;
      text: boolean | null;
    }[] | null;
    next: string | null;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `reopenSurveyQuery` (`graphql/query/survey/reopen.ts`)
- 쓰는 파일 (2): `lib/hooks/survey/use-reopen-survey.ts`, `lib/stores/survey/common.ts`

---

<a id="05-02"></a>

### 05-02 `getSurveyTarget` — 설문 대상 조회

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
| `surveyCode` | `SurveyCode` | ✅ | 보냄 |  |
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyTargetOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  isTarget: boolean | null;
  isCompleted: boolean | null;
  answers: { // SurveyProgressAnswer
    questionCode: string;
    values: string[];
    etcText: string | null;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `reopenSurveyTargetQuery` (`graphql/query/survey/reopen.ts`)
- 쓰는 파일 (2): `lib/hooks/survey/use-reopen-survey.ts`, `lib/types/survey.ts`

---

<a id="05-03"></a>

### 05-03 `getSurveyStatus` — 설문 진행 상태 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | `initSurveyQuery`(5개), `initialSurveyHomeQuery`(3개), `initialSurveyHomeStatusManualSectionQuery`(3개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundHistoryId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyStatusOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  surveyStatus: { // SurveyStatus
    surveyAnswerId: string | null;
    totalAmount: number | null;
    txprNm: string | null;
    isCompleted: boolean;
    deductionTypes: DeductionType[];
    expiredAt: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_ETC` `ERR_SURVEY_COMPLETED` `ERR_SURVEY_EXPIRED`

**프론트**
- 연산: `initCheckedCanSurveyQuery` (`graphql/query/survey/init.ts`), `initSurveyQuery` (`graphql/query/survey/init.ts`), `initialSurveyHomeQuery` (`graphql/query/survey/init.ts`), `initialSurveyHomeStatusManualSectionQuery` (`graphql/query/survey/init.ts`)
- 쓰는 파일 (5): `components/survey/common/SurveyProvider.tsx`, `components/survey/home/SurveyHomeContainer.tsx`, `components/tax-refund/apply/complete/CompleteCta.tsx`, `components/tax-refund/home/StatusManualSection.tsx`, `pages/survey/home/index.tsx`

---

<a id="05-04"></a>

### 05-04 `getSurveyAddress` — 주소(법정동) 조회

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
| `sidoNm` | `string | null` |  | 보냄 | 시도 명 |
| `sggNm` | `string | null` |  | 보냄 | 시군구 명 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundUserGetSurveyAddressOutput`)

```ts
{
  sidoNm: string | null;
  sggNm: string | null;
  ymdgNm: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `addressQuery` (`graphql/query/survey/address.ts`), `addressSggQuery` (`graphql/query/survey/address.ts`), `addressYmdgQuery` (`graphql/query/survey/address.ts`)
- 쓰는 파일 (1): `lib/hooks/survey/api/use-legal-address.ts`

---

<a id="05-05"></a>

### 05-05 `getSurveyBusinessInfo` — 사업장 정보 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | `businessSignboardQuery`(2개), `businessPartnerQuery`(2개), `businessLocationQuery`(2개), `initSurveyQuery`(5개), `initialSurveyHomeQuery`(3개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundHistoryId` | `string` | ✅ | 보냄 |  |
| `bmanTin` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyBusinessInfoOutput`)

```ts
{
  result: boolean;
  business: { // SurveyBusinessInfo
    ofbDt: string | null;
    bsno: string | null;
    tnm: string | null;
    adr: string | null;
    bmanTin: string | null;
    totalAmount: number | null;
    tfbDtcsNm: string | null;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_SURVEY_COMPLETED` `ERR_SURVEY_EXPIRED`

**프론트**
- 연산: `businessIntroQuery` (`graphql/query/survey/business.ts`), `businessSignboardQuery` (`graphql/query/survey/business.ts`), `businessPartnerQuery` (`graphql/query/survey/business.ts`), `businessLocationQuery` (`graphql/query/survey/business.ts`), `initSurveyQuery` (`graphql/query/survey/init.ts`), `initialSurveyHomeQuery` (`graphql/query/survey/init.ts`)
- 쓰는 파일 (11): `components/survey/business/partner/PartnerContainer.tsx`, `components/survey/business/signboard/SignboardContainer.tsx`, `components/survey/common/LocationProvider.tsx`, `components/survey/common/SurveyProvider.tsx`, `components/survey/home/SurveyHomeContainer.tsx`, `components/survey/intro/SurveyIntroContainer.tsx`, `lib/types/survey.ts`, `pages/survey/business/partner.tsx`, `pages/survey/business/signboard.tsx`, `pages/survey/home/index.tsx`, `pages/survey/intro/index.tsx`

---

<a id="05-06"></a>

### 05-06 `getSurveyBusinessAnswer` — 사업 문항 답변 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | `businessSignboardQuery`(2개), `businessPartnerQuery`(2개), `businessLocationQuery`(2개), `initSurveyQuery`(5개), `initialSurveyHomeQuery`(3개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundHistoryId` | `string` | ✅ | 보냄 |  |
| `bmanTin` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyBusinessAnswerOutput`)

```ts
{
  result: boolean;
  businessAnswer: { // SurveyBusinessAnswer
    tnm: string | null;
    bsno: string | null;
    bmanTin: string | null;
    isCompleted: boolean | null;
    isStartBusinessDirectly: YesNoEtc | null;
    hasPreviousBusinessInSameIndustry: YesNoBlank | null;
    isSmallBossOrMachineOwner: YesNoBlank | null;
    isNewSignboard: NewSignboardType | null;
    hasPartnerAtTheTimeOfEstablishment: PartnerAtEstablishmentType | null;
    hasTakingOverEmployees: TakingOverEmployeesType | null;
    takingOverEmployees: { // SurveyEmployee
      indvTin: string;
      ieNm: string;
      birthday: string | null;
      attrYears: string[];
    }[] | null;
    isWorkingAtRegisteredAddress: YesNoBlank | null;
    businessPlaceType: BusinessPlaceType | null;
    businessPlaceTypeComment: string | null;
    isFirstLocation: YesNoBlankAddressUnknown | null;
    locations: { // Location
      year: number | null;
      address: string;
      isFirstLocation: YesNoBlank;
      isUnknownRelocationYear: boolean;
    }[] | null;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_SURVEY_COMPLETED` `ERR_SURVEY_EXPIRED`

**프론트**
- 연산: `businessInitQuery` (`graphql/query/survey/business.ts`), `businessStartQuestionQuery` (`graphql/query/survey/business.ts`), `businessSameIndustryQuery` (`graphql/query/survey/business.ts`), `businessSmallBossMachineOwnerQuery` (`graphql/query/survey/business.ts`), `businessSignboardQuery` (`graphql/query/survey/business.ts`), `businessPartnerQuery` (`graphql/query/survey/business.ts`), `businessTakeoverEmployeeQuery` (`graphql/query/survey/business.ts`), `businessWorkLocationCheckQuery` (`graphql/query/survey/business.ts`), `businessPlaceTypeQuery` (`graphql/query/survey/business.ts`), `businessLocationQuery` (`graphql/query/survey/business.ts`), `initSurveyQuery` (`graphql/query/survey/init.ts`), `initialSurveyHomeQuery` (`graphql/query/survey/init.ts`)
- 쓰는 파일 (22): `components/survey/business/partner/PartnerContainer.tsx`, `components/survey/business/place-type/BusinessPlaceTypeContainer.tsx`, `components/survey/business/same-industry-before/SameIndustryBeforeContainer.tsx`, `components/survey/business/signboard/SignboardContainer.tsx`, `components/survey/business/small-boss-machine-owner/SmallBossMachineOwnerContainer.tsx`, `components/survey/business/start-business/StartBusinessContainer.tsx`, `components/survey/business/takeover-employee/TakeoverEmployeeContainer.tsx`, `components/survey/business/work-location-check/WorkLocationCheckContainer.tsx`, `components/survey/common/BusinessProvider.tsx`, `components/survey/common/LocationProvider.tsx`, `components/survey/common/SurveyProvider.tsx`, `components/survey/home/SurveyHomeContainer.tsx`, `lib/types/survey.ts`, `pages/survey/business/office-type.tsx`, `pages/survey/business/partner.tsx`, `pages/survey/business/same-industry-before.tsx`, `pages/survey/business/signboard.tsx`, `pages/survey/business/small-boss-machine-owner.tsx`, `pages/survey/business/start-business.tsx`, `pages/survey/business/takeover-employee.tsx`, `pages/survey/business/work-location-check.tsx`, `pages/survey/home/index.tsx`

---

<a id="05-07"></a>

### 05-07 `getSurveyEmployees` — 직원 목록 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | `initSurveyQuery`(5개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundHistoryId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyEmployeesOutput`)

```ts
{
  result: boolean;
  employees: { // SurveyEmployee
    indvTin: string;
    ieNm: string;
    birthday: string | null;
    attrYears: string[];
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_SURVEY_COMPLETED` `ERR_SURVEY_EXPIRED`

**프론트**
- 연산: `initSurveyQuery` (`graphql/query/survey/init.ts`)
- 쓰는 파일 (1): `components/survey/common/SurveyProvider.tsx`

---

<a id="05-08"></a>

### 05-08 `getSurveyEmploymentAnswer` — 고용 문항 답변 조회

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
| `refundHistoryId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyEmploymentAnswerOutput`)

```ts
{
  result: boolean;
  employmentAnswer: { // SurveyEmploymentAnswer
    hasSpecialRelationshipsInThePast: YesNoBlank;
    specialRelationshipsInThePast: { // SurveyEmployee
      indvTin: string;
      ieNm: string;
      birthday: string | null;
      attrYears: string[];
    }[] | null;
    specialRelationshipsCurrently: { // EmployeeWithoutTin
      birthday: string | null;
      ieNm: string;
    }[];
    hasEmploymentContracts: EmploymentContractsType | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `employmentSpecialRelationshipsPastQuery` (`graphql/query/survey/employment.ts`), `employmentSpecialRelationshipsPastToCurrentlyQuery` (`graphql/query/survey/employment.ts`), `employmentSpecialRelationshipsCurrentQuery` (`graphql/query/survey/employment.ts`), `employmentContractsQuery` (`graphql/query/survey/employment.ts`)
- 쓰는 파일 (9): `components/survey/employment/contracts/ContractsContainer.tsx`, `components/survey/employment/special-relationships/CurrentlySpecialRelationshipsContainer.tsx`, `components/survey/employment/special-relationships/PastToCurrentlySpecialRelationshipsContainer.tsx`, `components/survey/employment/special-relationships/SpecialRelationshipsContainer.tsx`, `components/survey/employment/special-relationships/SpecialRelationshipsSearchEmployee.tsx`, `pages/survey/employment/contracts/index.tsx`, `pages/survey/employment/special-relationships/currently/index.tsx`, `pages/survey/employment/special-relationships/index.tsx`, `pages/survey/employment/special-relationships/past-to-currently/index.tsx`

---

<a id="05-09"></a>

### 05-09 `isCertNeed` — 추가 인증 필요 여부 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | `initialSurveyHomeStatusManualSectionQuery`(3개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CertNeedOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  status: PersonalDeductionStatus | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_ETC` `ERR_SURVEY_COMPLETED`

**프론트**
- 연산: `initialSurveyHomeStatusManualSectionQuery` (`graphql/query/survey/init.ts`), `personalDeductionNeedsAuthenticationQuery` (`graphql/query/tax-refund/personal-deduction.ts`)
- 쓰는 파일 (2): `components/survey/home/SurveyHomeContainer.tsx`, `components/tax-refund/home/StatusManualSection.tsx`

---

<a id="05-10"></a>

### 05-10 `putSurveyAnswer` — 설문 답변 저장(put)

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
| `surveyAnswerData` | `unknown /* JSON */` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundUserPutSurveyAnswerOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    message: string | null;
  } | null;
  surveyAnswerId: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `updateSurveyMutation` (`graphql/mutation/survey/update.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)

---

<a id="05-11"></a>

### 05-11 `saveSurveyAnswer` — 설문 답변 저장(save)

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
| `surveyCode` | `SurveyCode` | ✅ | 보냄 | 설문 식별 코드 |
| `refundId` | `string` | ✅ | 보냄 | 환급 ID (refundId) |
| `version` | `string` | ✅ | 보냄 | 설문 버전 |
| `questionCode` | `string` | ✅ | 보냄 | 문항 코드 (INDUSTRY/SCHEDULE/INTEREST) |
| `values` | `string[]` | ✅ | 보냄 | 선택한 값 목록 |
| `etcText` | `string | null` |  | 보냄 | 자유 텍스트(기타 등 text 옵션 선택 시, 최대 500자) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SurveyAnswerOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  surveyAnswerId: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `reopenSaveSurveyAnswerMutation` (`graphql/mutation/survey/reopen.ts`)
- 쓰는 파일 (1): `lib/hooks/survey/use-reopen-survey.ts`

---

<a id="05-12"></a>

### 05-12 `submitSurvey` — 설문 제출

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
| `surveyAnswerId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundUserPutSurveyAnswerOutput`)

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
- 연산: `submitSurveyMutation` (`graphql/mutation/survey/submit.ts`)
- 쓰는 파일 (1): `components/survey/home/SurveyHomeContainer.tsx`

---

<a id="05-13"></a>

### 05-13 `upsertBusinessAnswer` — 사업 문항 답변 부분 저장

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
| `bmanTin` | `string` | ✅ | 보냄 | 사업장 TIN(과세번호) |
| `isStartBusinessDirectly` | `YesNoEtc | null` |  | 보냄 | 직접 창업 질문 |
| `isSmallBossOrMachineOwner` | `YesNoBlank | null` |  | 보냄 | 소사장제/지입사 질문 |
| `isNewSignboard` | `NewSignboardType | null` |  | 보냄 | 새 간판 질문 |
| `hasTakingOverEmployees` | `TakingOverEmployeesType | null` |  | 보냄 | 승계직원 여부 |
| `takingOverEmployees` | `SurveyEmployeeInput[] | null` |  | 보냄 | 승계직원 리스트 |
| `takingOverEmployees.ieNm` | `string` | ✅ | 보냄 | 이름 |
| `takingOverEmployees.birthday` | `string | null` |  | 보냄 | 생년월일 yyyymmdd |
| `takingOverEmployees.indvTin` | `string` | ✅ | 보냄 | 개인식별번호 |
| `takingOverEmployees.attrYears` | `string[]` | ✅ | 보냄 | 근속연도 목록 |
| `businessPlaceType` | `BusinessPlaceType | null` |  | 보냄 | 사업장 임대 형태 |
| `businessPlaceTypeComment` | `string | null` |  | 보냄 | 사업장 임대 형태 기타(코멘트) |
| `isWorkingAtRegisteredAddress` | `YesNoBlank | null` |  | 보냄 | 사업장 실제 근무 여부 |
| `hasPreviousBusinessInSameIndustry` | `YesNoBlank | null` |  | 보냄 | 동종업종 창업 경험 여부 |
| `isFirstLocation` | `YesNoBlankAddressUnknown | null` |  | 보냄 | 창업 당시 등록된 주소 여부 |
| `locations` | `LocationInput[] | null` |  | 보냄 | 사업장 이전 이력 |
| `locations.isUnknownRelocationYear` | `boolean` | ✅ | 보냄 | 이전 사업장 이전 연도 모름 여부 |
| `locations.year` | `number | null` |  | 보냄 | 사업장 이전 연도 |
| `locations.address` | `string` | ✅ | 보냄 | 사업장 주소 |
| `locations.isFirstLocation` | `YesNoBlank` | ✅ | 보냄 | 최초 사업장 여부 |
| `hasPartnerAtTheTimeOfEstablishment` | `PartnerAtEstablishmentType | null` |  | 보냄 | 창업당시 공동사업자 여부 |
| `isCompleted` | `boolean` | ✅ | 보냄 | 사업장 설문 답변 완료 여부 |
| `surveyAnswerId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundUserPutSurveyAnswerOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_SURVEY_COMPLETED` `ERR_SURVEY_EXPIRED` `ERR_UPDATE_SURVEY_ANSWER`

**프론트**
- 연산: `businessAnswerUpsertMutation` (`graphql/mutation/survey/business.ts`), `businessIsStartBusinessDirectlyMutation` (`graphql/mutation/survey/business.ts`), `businessSameIndustryMutation` (`graphql/mutation/survey/business.ts`), `businessSmallBossOrMachineOwnerMutation` (`graphql/mutation/survey/business.ts`), `businessNewSignboardMutation` (`graphql/mutation/survey/business.ts`), `businessPartnerMutation` (`graphql/mutation/survey/business.ts`), `businessTakingOverEmployeesMutation` (`graphql/mutation/survey/business.ts`), `businessWorkingAtRegisteredAddressMutation` (`graphql/mutation/survey/business.ts`), `businessPlaceTypeMutation` (`graphql/mutation/survey/business.ts`), `businessIsFirstLocationMutation` (`graphql/mutation/survey/business.ts`), `businessLocationsMutation` (`graphql/mutation/survey/business.ts`)
- 쓰는 파일 (14): `components/survey/business/first-location/AllLocationsContainer.tsx`, `components/survey/business/first-location/IsFirstLocationContainer.tsx`, `components/survey/business/first-location/LocationMoveYearContainer.tsx`, `components/survey/business/partner/PartnerContainer.tsx`, `components/survey/business/place-type/BusinessPlaceTypeContainer.tsx`, `components/survey/business/same-industry-before/SameIndustryBeforeContainer.tsx`, `components/survey/business/signboard/SignboardContainer.tsx`, `components/survey/business/small-boss-machine-owner/SmallBossMachineOwnerContainer.tsx`, `components/survey/business/start-business/StartBusinessContainer.tsx`, `components/survey/business/takeover-employee/TakeoverEmployeeContainer.tsx`, `components/survey/business/work-location-check/WorkLocationCheckContainer.tsx`, `components/survey/common/ui/AnswerList.tsx`, `lib/hooks/survey/api/use-upsert-business-answer.ts`, `lib/stores/survey/business.ts`

---

<a id="05-14"></a>

### 05-14 `upsertEmploymentAnswer` — 고용 문항 답변 부분 저장

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
| `hasSpecialRelationshipsInThePast` | `YesNoBlank | null` |  | 보냄 | 과거시점 대표특관자 질문 |
| `specialRelationshipsInThePast` | `SurveyEmployeeInput[] | null` |  | 보냄 | 과거 대표특관자 직원 리스트 |
| `specialRelationshipsInThePast.ieNm` | `string` | ✅ | 보냄 | 이름 |
| `specialRelationshipsInThePast.birthday` | `string | null` |  | 보냄 | 생년월일 yyyymmdd |
| `specialRelationshipsInThePast.indvTin` | `string` | ✅ | 보냄 | 개인식별번호 |
| `specialRelationshipsInThePast.attrYears` | `string[]` | ✅ | 보냄 | 근속연도 목록 |
| `specialRelationshipsCurrently` | `EmployeeWithoutTinInput[] | null` |  | 보냄 | 현재시점 대표특관자 리스트 |
| `specialRelationshipsCurrently.ieNm` | `string` | ✅ | 보냄 | 이름 |
| `specialRelationshipsCurrently.birthday` | `string | null` |  | 보냄 | 생년월일 yyyymmdd |
| `hasEmploymentContracts` | `EmploymentContractsType | null` |  | 보냄 | 근로계약서 질문 |
| `isCompleted` | `boolean` | ✅ | 보냄 | 고용 설문 답변 완료 여부 |
| `surveyAnswerId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundUserPutSurveyAnswerOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_SURVEY_COMPLETED` `ERR_SURVEY_EXPIRED` `ERR_UPDATE_SURVEY_ANSWER`

**프론트**
- 연산: `employmentUpdateMutation` (`graphql/mutation/survey/employment.ts`), `employmentSpecialRelationshipsPastMutation` (`graphql/mutation/survey/employment.ts`), `employmentSpecialRelationshipsPastToCurrentlyMutation` (`graphql/mutation/survey/employment.ts`), `employmentSpecialRelationshipsCurrentMutation` (`graphql/mutation/survey/employment.ts`), `employmentContractsMutation` (`graphql/mutation/survey/employment.ts`)
- 쓰는 파일 (5): `components/survey/employment/contracts/ContractsContainer.tsx`, `components/survey/employment/special-relationships/CurrentlySpecialRelationshipsContainer.tsx`, `components/survey/employment/special-relationships/PastToCurrentlySpecialRelationshipsContainer.tsx`, `components/survey/employment/special-relationships/SpecialRelationshipsContainer.tsx`, `lib/hooks/survey/api/use-upsert-employment.ts`
