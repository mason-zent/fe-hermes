# 12. 연말정산

> [README](./README.md) · API 7개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [12-01](#12-01) | `getYearEndTaxOrgs` | 조회 | 연말정산 대상 사업장 조회(사업자번호·연도) | | ☐ | ☐ |
| [12-02](#12-02) | `getYearEndTaxEmployees` | 조회 | 연말정산 대상 근로자 조회(사업자번호·연도) | | ☐ | ☐ |
| [12-03](#12-03) | `getYearEndTaxFiles` | 조회 | 연말정산 대상 근로자의 업로드된 파일 목록을 조회합니다. | | ☐ | ☐ |
| [12-04](#12-04) | `uploadYearEndTaxFile` | 변경 | 연말정산에 필요한 서류 파일을 업로드합니다. | | ☐ | ☐ |
| [12-05](#12-05) | `deleteYearEndTaxFile` | 변경 | 업로드된 연말정산 서류 파일을 삭제합니다. | | ☐ | ☐ |
| [12-06](#12-06) | `updateYearEndTaxEmployeePrgrStat` | 변경 | 연말정산 대상 근로자의 진행상태를 변경합니다. | | ☐ | ☐ |
| [12-07](#12-07) | `getYearEndTaxCalcSummary` | 조회 | 연말정산 대상 근로자의 계산 결과 요약을 조회합니다. | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `StatusTypeEnum`: `Success` · `FailureOfRepVerification` · `NoBizno` · `NoPayroll` · `InvalidBizno` · `InvalidRegno` · `HomeTaxNotConnected` · `AlreadyRegisteredCard` · `Unknown`
- `YearEndTaxPrgrStat`: `READY` · `REQUESTED` · `SUBMITTED` · `CALCULATED` · `REPORTED` · `NOT_APPLICABLE`

## 프론트 작업 파일 (22) — `apps/care-web/` 기준

- `app/year-end-tax/[year]/[employeeId]/components/UploadContents.tsx`
- `app/year-end-tax/[year]/[employeeId]/hooks/useDeleteYearEndTaxFile.ts`
- `app/year-end-tax/[year]/[employeeId]/hooks/useUploadYearEndTaxFileMutation.ts`
- `app/year-end-tax/[year]/[employeeId]/hooks/useYearEndTaxFileUpload.ts`
- `app/year-end-tax/[year]/[employeeId]/result/hooks/useGetYearEndTaxCalcSummaryQuery.ts`
- `app/year-end-tax/[year]/[employeeId]/result/hooks/useYearEndTaxCalcSummary.ts`
- `app/year-end-tax/[year]/hooks/useGetYearEndTaxEmployeeQuery.ts`
- `app/year-end-tax/[year]/hooks/useGetYearEndTaxOrgs.ts`
- `app/year-end-tax/[year]/hooks/useYearEndTaxEmployee.ts`
- `app/year-end-tax/components/YearEndTaxFileUploadContents.tsx`
- `app/year-end-tax/graphql/deleteYearEndTaxFile.ts`
- `app/year-end-tax/graphql/getYearEndTaxCalcSummary.ts`
- `app/year-end-tax/graphql/getYearEndTaxEmployees.ts`
- `app/year-end-tax/graphql/getYearEndTaxFiles.ts`
- `app/year-end-tax/graphql/getYearEndTaxOrgs.ts`
- `app/year-end-tax/graphql/updateYearEndTaxEmployeePrgrStat.ts`
- `app/year-end-tax/graphql/uploadYearEndTaxFile.ts`
- `app/year-end-tax/hooks/useGetYearEndTaxEmployeesQuery.ts`
- `app/year-end-tax/hooks/useGetYearEndTaxFilesQuery.ts`
- `app/year-end-tax/hooks/useUpdateEmployeeStatus.ts`
- `app/year-end-tax/hooks/useYearEndTaxEmployees.ts`
- `app/year-end-tax/utils/getBadgeProps.ts`

## API 상세

---

<a id="12-01"></a>

### 12-01 `getYearEndTaxOrgs` — 연말정산 대상 사업장 조회(사업자번호·연도)

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
| `input` | `GetYearEndTaxOrgsInput` | ✅ | 보냄 |  |
| `input.year` | `string` | ✅ | 보냄 | 연도 (YYYY) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetYearEndTaxOrgsOutput` · union 2종)

```ts
{
  __typename: 'GetYearEndTaxOrgsResult';
  orgs: { // YearEndTaxSimpleOrgInfo
    bizNo: string;
    bizName: string;
  }[];
  targetOrgs: { // YearEndTaxOrgInfo
    bizNo: string;
    bizName: string;
    prgrStat: string | null;
    yrsInfrId: number;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetYearEndTaxOrgsResult`

**프론트**
- 연산: `getYearEndTaxOrgsQuery` (`app/year-end-tax/graphql/getYearEndTaxOrgs.ts`)
- 쓰는 파일 (1): `app/year-end-tax/[year]/hooks/useGetYearEndTaxOrgs.ts`

---

<a id="12-02"></a>

### 12-02 `getYearEndTaxEmployees` — 연말정산 대상 근로자 조회(사업자번호·연도)

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
| `input` | `GetYearEndTaxEmployeesInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 | 사업자등록번호 |
| `input.year` | `string` | ✅ | 보냄 | 연도 (YYYY) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetYearEndTaxEmployeesOutput` · union 2종)

```ts
{
  __typename: 'GetYearEndTaxEmployeesResult';
  employees: { // YearEndTaxEmployeeInfo
    yrsTrgtLbrrId: number;
    lbrrInfrId: number;
    name: string | null;
    prgrStat: YearEndTaxPrgrStat | null;
    resno: string | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetYearEndTaxEmployeesResult`

**프론트**
- 연산: `getYearEndTaxEmployeesQuery` (`app/year-end-tax/graphql/getYearEndTaxEmployees.ts`)
- 쓰는 파일 (7): `app/year-end-tax/[year]/[employeeId]/components/UploadContents.tsx`, `app/year-end-tax/[year]/hooks/useGetYearEndTaxEmployeeQuery.ts`, `app/year-end-tax/[year]/hooks/useYearEndTaxEmployee.ts`, `app/year-end-tax/components/YearEndTaxFileUploadContents.tsx`, `app/year-end-tax/hooks/useGetYearEndTaxEmployeesQuery.ts`, `app/year-end-tax/hooks/useYearEndTaxEmployees.ts`, `app/year-end-tax/utils/getBadgeProps.ts`

---

<a id="12-03"></a>

### 12-03 `getYearEndTaxFiles` — 연말정산 대상 근로자의 업로드된 파일 목록을 조회합니다.

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
| `input` | `GetYearEndTaxFilesInput` | ✅ | 보냄 |  |
| `input.yrsTrgtLbrrId` | `number` | ✅ | 보냄 | 연말정산대상근로자ID |
| `input.fileClCd` | `string \| null` |  | 보냄 | 파일 종류 코드 필터 |
| `input.fileSbmtCd` | `string \| null` |  | 보냄 | 파일 제출자 코드 필터 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetYearEndTaxFilesOutput` · union 2종)

```ts
{
  __typename: 'GetYearEndTaxFilesResult';
  files: { // YearEndTaxFileInfo
    yrsPrfFileId: number;
    fileClCd: number;
    fileSbmtCd: number | null;
    filename: string;
    extension: string;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetYearEndTaxFilesResult`

**프론트**
- 연산: `getYearEndTaxFilesQuery` (`app/year-end-tax/graphql/getYearEndTaxFiles.ts`)
- 쓰는 파일 (2): `app/year-end-tax/components/YearEndTaxFileUploadContents.tsx`, `app/year-end-tax/hooks/useGetYearEndTaxFilesQuery.ts`

---

<a id="12-04"></a>

### 12-04 `uploadYearEndTaxFile` — 연말정산에 필요한 서류 파일을 업로드합니다.

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
| `input` | `YearEndTaxFileUploadInput` | ✅ | 보냄 |  |
| `input.yrsTrgtLbrrId` | `number` | ✅ | 보냄 | 연말정산대상근로자ID |
| `input.fileClCd` | `string` | ✅ | 보냄 | 파일 종류 코드 |
| `input.fileSbmtCd` | `string` | ✅ | 보냄 | 제출자 코드 |
| `input.file` | `File /* Upload — multipart */` | ✅ | 보냄 | 업로드할 파일 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `YearEndTaxFileUploadResult`)

```ts
{ // YearEndTaxFileUploadResult
  status: StatusTypeEnum;
  files: { // YearEndTaxFileInfo
    yrsPrfFileId: number;
    fileClCd: number;
    fileSbmtCd: number | null;
    filename: string;
    extension: string;
  }[] | null;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `uploadYearEndTaxFileMutation` (`app/year-end-tax/graphql/uploadYearEndTaxFile.ts`)
- 쓰는 파일 (3): `app/year-end-tax/[year]/[employeeId]/components/UploadContents.tsx`, `app/year-end-tax/[year]/[employeeId]/hooks/useUploadYearEndTaxFileMutation.ts`, `app/year-end-tax/[year]/[employeeId]/hooks/useYearEndTaxFileUpload.ts`

---

<a id="12-05"></a>

### 12-05 `deleteYearEndTaxFile` — 업로드된 연말정산 서류 파일을 삭제합니다.

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
| `input` | `DeleteYearEndTaxFileInput` | ✅ | 보냄 |  |
| `input.yrsTrgtLbrrId` | `number` | ✅ | 보냄 | 연말정산대상근로자ID |
| `input.fileId` | `number` | ✅ | 보냄 | 파일ID |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteYearEndTaxFileResult`)

```ts
{ // DeleteYearEndTaxFileResult
  status: StatusTypeEnum;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `deleteYearEndTaxFileMutation` (`app/year-end-tax/graphql/deleteYearEndTaxFile.ts`)
- 쓰는 파일 (1): `app/year-end-tax/[year]/[employeeId]/hooks/useDeleteYearEndTaxFile.ts`

---

<a id="12-06"></a>

### 12-06 `updateYearEndTaxEmployeePrgrStat` — 연말정산 대상 근로자의 진행상태를 변경합니다.

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
| `input` | `UpdateYearEndTaxEmployeePrgrStatInput` | ✅ | 보냄 |  |
| `input.yrsTrgtLbrrId` | `number` | ✅ | 보냄 | 연말정산대상근로자ID |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateYearEndTaxEmployeePrgrStatOutput` · union 2종)

```ts
{
  __typename: 'UpdateYearEndTaxEmployeePrgrStatResult';
  message: string;
}
| { __typename: 'TemporaryError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdateYearEndTaxEmployeePrgrStatResult`

**프론트**
- 연산: `updateYearEndTaxEmployeePrgrStatMutation` (`app/year-end-tax/graphql/updateYearEndTaxEmployeePrgrStat.ts`)
- 쓰는 파일 (1): `app/year-end-tax/hooks/useUpdateEmployeeStatus.ts`

---

<a id="12-07"></a>

### 12-07 `getYearEndTaxCalcSummary` — 연말정산 대상 근로자의 계산 결과 요약을 조회합니다.

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
| `input` | `GetYearEndTaxCalcSummaryInput` | ✅ | 보냄 |  |
| `input.yrsTrgtLbrrId` | `number` | ✅ | 보냄 | 연말정산 대상 근로자ID |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetYearEndTaxCalcSummaryOutput` · union 3종)

```ts
{
  __typename: 'YearEndTaxCalcSummaryResult';
  yrsTrgtLbrrId: number;
  attrYr: number;
  salaryIncome: { // SalaryIncomeSection
    earnedIncomeAmount: number | null;
    earnedIncomeDeduction: number | null;
    totalSalary: number | null;
  } | null;
  incomeDeduction: { // IncomeDeductionSection
    personalDeduction: number | null;
    nationalPension: number | null;
    healthInsurance: number | null;
    creditCard: number | null;
    totalDeduction: number | null;
  } | null;
  taxCalculation: { // TaxCalculationSection
    taxBase: number | null;
    calculatedTax: number | null;
    taxDeductionTotal: number | null;
    determinedTax: number | null;
  } | null;
  settlementResult: { // SettlementResultSection
    prepaidTax: number | null;
    additionalTax: number | null;
    localIncomeTax: number | null;
    estimatedRefund: number | null;
  } | null;
}
| {
  __typename: 'YearEndTaxCalcSummaryNotFoundError';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `YearEndTaxCalcSummaryNotFoundError` `YearEndTaxCalcSummaryResult`

**프론트**
- 연산: `getYearEndTaxCalcSummaryQuery` (`app/year-end-tax/graphql/getYearEndTaxCalcSummary.ts`)
- 쓰는 파일 (2): `app/year-end-tax/[year]/[employeeId]/result/hooks/useGetYearEndTaxCalcSummaryQuery.ts`, `app/year-end-tax/[year]/[employeeId]/result/hooks/useYearEndTaxCalcSummary.ts`
