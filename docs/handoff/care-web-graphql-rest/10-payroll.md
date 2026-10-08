# 10. 급여

> [README](./README.md) · API 11개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [10-01](#10-01) | `listWorker` | 조회 | 직원목록 조회 | | ☐ | ☐ |
| [10-02](#10-02) | `listPayroll` | 조회 | 급여 제출 내역 조회 | | ☐ | ☐ |
| [10-03](#10-03) | `listPayrollMonthly` | 조회 | 월별 급역 내역 상태 | | ☐ | ☐ |
| [10-04](#10-04) | `getSalaryDay` | 조회 | 월급날 조회 | | ☐ | ☐ |
| [10-05](#10-05) | `updateSalaryDay` | 변경 | 급여일 설정 | | ☐ | ☐ |
| [10-06](#10-06) | `getOrgsWithoutSubmission` | 조회 | 급여 미제출 사업장 조회(급여 없음 신고 화면) (스키마 설명 없음) | | ☐ | ☐ |
| [10-07](#10-07) | `updatePayroll` | 변경 | 급여 내역 수정 | | ☐ | ☐ |
| [10-08](#10-08) | `updateNoPayroll` | 변경 | 이번 달 급여 없음 처리 (스키마 설명 없음) | | ☐ | ☐ |
| [10-09](#10-09) | `uploadPayrollFile` | 변경 | 급여파일 업로드 | | ☐ | ☐ |
| [10-10](#10-10) | `getWithholdingOrgs` | 조회 | 원천세 신고 결과 사업장 목록 (스키마 설명 없음) | | ☐ | ☐ |
| [10-11](#10-11) | `getWithholdingResultDetail` | 조회 | 원천세 신고 결과 상세 (스키마 설명 없음) | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `PayrollType`: `Work` · `Biz` · `Etc`
- `StatusTypeEnum`: `Success` · `FailureOfRepVerification` · `NoBizno` · `NoPayroll` · `InvalidBizno` · `InvalidRegno` · `HomeTaxNotConnected` · `AlreadyRegisteredCard` · `Unknown`
- `WhtxStatus`: `NotStarted` · `DataSubmitted` · `PayrollCompleted` · `ReportCompleted` · `None` · `NotExist`
- `WithholdingResult`: `NoPayroll` · `PreparingPayroll` · `CompletedPayroll` · `CompletedWithholdingRegistration`

## 프론트 작업 파일 (39) — `apps/care-web/` 기준

- `app/payroll/components/MonthSelectDrawer.tsx`
- `app/payroll/graphql/getOrgsWithoutSubmission.ts`
- `app/payroll/graphql/getSalaryDay.ts`
- `app/payroll/graphql/listPayrollMonthly.ts`
- `app/payroll/graphql/listWorker.ts`
- `app/payroll/graphql/payrollList.ts`
- `app/payroll/graphql/updateNoPayroll.ts`
- `app/payroll/graphql/updatePayroll.ts`
- `app/payroll/graphql/updateSalaryDay.ts`
- `app/payroll/hooks/useGetPayrollStatusByMonth.ts`
- `app/payroll/hooks/useGetPreviousPayroll.ts`
- `app/payroll/hooks/useGetWorker.ts`
- `app/payroll/hooks/usePreviousPayrollIConfirmation.ts`
- `app/payroll/hooks/useSavedEmployeeInfo.ts`
- `app/payroll/hooks/useUpdatePayroll.ts`
- `app/payroll/input/components/ConfirmDialog.tsx`
- `app/payroll/input/components/MonthSelector.tsx`
- `app/payroll/input/hooks/useGetSalaryDay.ts`
- `app/payroll/input/hooks/useUpdateSalaryDay.ts`
- `app/payroll/result/detail/components/NetSalaryDetail.tsx`
- `app/payroll/result/detail/components/PayrollResultDetail.tsx`
- `app/payroll/result/detail/components/detail/WithholdingResultCompletedPayroll.tsx`
- `app/payroll/result/detail/components/detail/WithholdingResultCompletedRegistration.tsx`
- `app/payroll/result/graphql/getWithholdingOrgs.ts`
- `app/payroll/result/graphql/getWithholdingResultDetail.ts`
- `app/payroll/result/hooks/useGetWithholdingOrgsQuery.ts`
- `app/payroll/result/hooks/useGetWithholdingResultDetailQuery.ts`
- `app/payroll/result/overview/components/PayrollOverviewList.tsx`
- `app/payroll/result/overview/components/PayrollOverviewOrgCard.tsx`
- `app/payroll/status/components/PayrollStatusItem.tsx`
- `app/payroll/status/components/status/BeforeSubmit.tsx`
- `app/payroll/status/components/status/PayrollLoadFailed.tsx`
- `app/payroll/store/newEmployeeAtom.ts`
- `app/payroll/submit/manual/confirmation/detail/components/status/PayrollStatuts.tsx`
- `app/payroll/submit/material/components/AttachFile.tsx`
- `app/payroll/submit/material/graphql/uploadPayrollFile.ts`
- `app/payroll/submit/material/hooks/useUploadPayrollFile.ts`
- `app/payroll/submit/no-salary/components/ConfirmDialog.tsx`
- `app/payroll/submit/no-salary/page.tsx`

## API 상세

---

<a id="10-01"></a>

### 10-01 `listWorker` — 직원목록 조회

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
| `bizno` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PayrollWorkerResult`)

```ts
{ // PayrollWorkerResult
  data: { // PayrollWorkerType
    name: string;
    juminId: string | null;
    phone: string | null;
  }[] | null;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `listWorkerQuery` (`app/payroll/graphql/listWorker.ts`)
- 쓰는 파일 (1): `app/payroll/hooks/useGetWorker.ts`

---

<a id="10-02"></a>

### 10-02 `listPayroll` — 급여 제출 내역 조회

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
| `bizno` | `string` | ✅ | 보냄 |  |
| `year` | `number` | ✅ | 보냄 |  |
| `month` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PayrollResult`)

```ts
{ // PayrollResult
  status: string;
  result: { // PayrollResultType
    bizno: string;
    orgName: string | null;
    year: number;
    month: number;
    complete: string;
    status: string;
    whtxStatus: WhtxStatus | null;
    fileName: string | null;
    fileSize: number | null;
    daysUntilDeadline: number;
    data: { // PayrollDataType
      index: number | null;
      incomeType: string | null;
      incomePurpose: string | null;
      amountSum: number | null;
      regno: string | null;
      name: string | null;
      type: string | null;
      phone: string | null;
      startDate: string | null;
      endDate: string | null;
      amountTaxBasic: number | null;
      amountTaxIncentive: number | null;
      amountNontaxFood: number | null;
      amountNontaxCar: number | null;
      amountNontaxEdu: number | null;
      amountTaxAddition: { // PayrollAdditionType
        amount: number;
        name: string;
      }[] | null;
      amountNontaxAddition: { // PayrollAdditionType
        amount: number;
        name: string;
      }[] | null;
    }[];
  } | null;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `payrollListQuery` (`app/payroll/graphql/payrollList.ts`)
- 쓰는 파일 (9): `app/payroll/hooks/useGetPayrollStatusByMonth.ts`, `app/payroll/hooks/useGetPreviousPayroll.ts`, `app/payroll/hooks/usePreviousPayrollIConfirmation.ts`, `app/payroll/hooks/useSavedEmployeeInfo.ts`, `app/payroll/result/detail/components/NetSalaryDetail.tsx`, `app/payroll/result/detail/components/detail/WithholdingResultCompletedPayroll.tsx`, `app/payroll/result/detail/components/detail/WithholdingResultCompletedRegistration.tsx`, `app/payroll/status/components/PayrollStatusItem.tsx`, `app/payroll/status/components/status/PayrollLoadFailed.tsx`

---

<a id="10-03"></a>

### 10-03 `listPayrollMonthly` — 월별 급역 내역 상태

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
| `bizno` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PayrollMonthlyResult`)

```ts
{ // PayrollMonthlyResult
  status: string;
  data: { // PayrollMonthlyType
    year: number;
    month: number;
    status: string;
    daysUntilDeadline: number;
  }[] | null;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `listPayrollMonthlyQuery` (`app/payroll/graphql/listPayrollMonthly.ts`)
- 쓰는 파일 (4): `app/payroll/components/MonthSelectDrawer.tsx`, `app/payroll/hooks/useGetPayrollStatusByMonth.ts`, `app/payroll/input/components/MonthSelector.tsx`, `app/payroll/status/components/status/BeforeSubmit.tsx`

---

<a id="10-04"></a>

### 10-04 `getSalaryDay` — 월급날 조회

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
| `input` | `GetSalaryDayInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 | 사업자등록번호 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetSalaryDayOutput` · union 2종)

```ts
{
  __typename: 'GetSalaryDayResult';
  slryDd: number | null;
  isSlryMmTmon: boolean | null;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetSalaryDayResult`

**프론트**
- 연산: `getSalaryDayQuery` (`app/payroll/graphql/getSalaryDay.ts`)
- 쓰는 파일 (1): `app/payroll/input/hooks/useGetSalaryDay.ts`

---

<a id="10-05"></a>

### 10-05 `updateSalaryDay` — 급여일 설정

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
| `input` | `UpdateSalaryDayInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 |  |
| `input.slryDd` | `number` | ✅ | 보냄 | 월급날, 말일은 0 |
| `input.isSlryMmTmon` | `boolean` | ✅ | 보냄 | 월급날 익월여부, false: 당월, true: 익월 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateSalaryDayResult`)

```ts
{ // UpdateSalaryDayResult
  status: StatusTypeEnum;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `updateSalaryDayMutation` (`app/payroll/graphql/updateSalaryDay.ts`)
- 쓰는 파일 (1): `app/payroll/input/hooks/useUpdateSalaryDay.ts`

---

<a id="10-06"></a>

### 10-06 `getOrgsWithoutSubmission` — 급여 미제출 사업장 조회(급여 없음 신고 화면) (스키마 설명 없음)

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
| `input` | `PayrollOrgsWithoutSubmissionInput` | ✅ | 보냄 |  |
| `input.year` | `number` | ✅ | 보냄 |  |
| `input.month` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PayrollOrgsWithoutSubmissionResult`)

```ts
{ // PayrollOrgsWithoutSubmissionResult
  status: string;
  orgs: { // PayrollOrgsWithoutSubmissionType
    bizno: string;
    bizName: string;
  }[];
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `getOrgsWithoutSubmissionQuery` (`app/payroll/graphql/getOrgsWithoutSubmission.ts`)
- 쓰는 파일 (1): `app/payroll/submit/no-salary/page.tsx`

---

<a id="10-07"></a>

### 10-07 `updatePayroll` — 급여 내역 수정

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
| `input` | `PayrollUpdateInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 |  |
| `input.year` | `number` | ✅ | 보냄 |  |
| `input.month` | `number` | ✅ | 보냄 |  |
| `input.complete` | `string` | ✅ | 보냄 |  |
| `input.data` | `PayrollUpdateIncomeType[]` | ✅ | 보냄 |  |
| `input.data.type` | `string` | ✅ | 보냄 |  |
| `input.data.incomeType` | `string \| null` |  | 보냄 |  |
| `input.data.incomePurpose` | `string \| null` |  | 보냄 |  |
| `input.data.name` | `string` | ✅ | 보냄 |  |
| `input.data.regno` | `string` | ✅ | 보냄 |  |
| `input.data.phone` | `string \| null` |  | 보냄 |  |
| `input.data.startDate` | `string \| null` |  | 보냄 |  |
| `input.data.endDate` | `string \| null` |  | 보냄 |  |
| `input.data.endReason` | `string \| null` |  | 보냄 |  |
| `input.data.amountTaxBasic` | `number` | ✅ | 보냄 |  |
| `input.data.amountTaxIncentive` | `number \| null` |  | 보냄 |  |
| `input.data.amountNontaxFood` | `number \| null` |  | 보냄 |  |
| `input.data.amountNontaxCar` | `number \| null` |  | 보냄 |  |
| `input.data.amountNontaxEdu` | `number \| null` |  | 보냄 |  |
| `input.data.amountSum` | `number` | ✅ | 보냄 |  |
| `input.data.amountTaxAddition` | `PayrollUpdateAdditionType[] \| null` |  | 보냄 |  |
| `input.data.amountTaxAddition.amount` | `number` | ✅ | 보냄 |  |
| `input.data.amountTaxAddition.name` | `string` | ✅ | 보냄 |  |
| `input.data.amountNontaxAddition` | `PayrollUpdateAdditionType[] \| null` |  | 보냄 |  |
| `input.data.amountNontaxAddition.amount` | `number` | ✅ | 보냄 |  |
| `input.data.amountNontaxAddition.name` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PayrollUpdateResult`)

```ts
{ // PayrollUpdateResult
  status: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `updatePayrollMutation` (`app/payroll/graphql/updatePayroll.ts`)
- 쓰는 파일 (4): `app/payroll/hooks/useUpdatePayroll.ts`, `app/payroll/input/components/ConfirmDialog.tsx`, `app/payroll/store/newEmployeeAtom.ts`, `app/payroll/submit/manual/confirmation/detail/components/status/PayrollStatuts.tsx`

---

<a id="10-08"></a>

### 10-08 `updateNoPayroll` — 이번 달 급여 없음 처리 (스키마 설명 없음)

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
| `input` | `PayrollNoPayrollInput` | ✅ | 보냄 |  |
| `input.year` | `number` | ✅ | 보냄 |  |
| `input.month` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PayrollUpdateNoPayrollResult`)

```ts
{ // PayrollUpdateNoPayrollResult
  status: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `updateNoPayrollMutation` (`app/payroll/graphql/updateNoPayroll.ts`)
- 쓰는 파일 (1): `app/payroll/submit/no-salary/components/ConfirmDialog.tsx`

---

<a id="10-09"></a>

### 10-09 `uploadPayrollFile` — 급여파일 업로드

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
| `input` | `PayrollFileUploadInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 |  |
| `input.year` | `number` | ✅ | 보냄 |  |
| `input.month` | `number` | ✅ | 보냄 |  |
| `input.file` | `File /* Upload — multipart */` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PayrollFileUploadResult`)

```ts
{ // PayrollFileUploadResult
  status: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `uploadPayrollFileMutation` (`app/payroll/submit/material/graphql/uploadPayrollFile.ts`)
- 쓰는 파일 (2): `app/payroll/submit/material/components/AttachFile.tsx`, `app/payroll/submit/material/hooks/useUploadPayrollFile.ts`

---

<a id="10-10"></a>

### 10-10 `getWithholdingOrgs` — 원천세 신고 결과 사업장 목록 (스키마 설명 없음)

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
| `input` | `WithholdingOrgsInput` | ✅ | 보냄 |  |
| `input.year` | `number` | ✅ | 보냄 | 년도 |
| `input.month` | `number` | ✅ | 보냄 | 월 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `WithholdingOrgsOutput` · union 2종)

```ts
{
  __typename: 'WithholdingOrgsResult';
  status: StatusTypeEnum;
  items: { // WithholdingOrgsItem
    bizno: string;
    tnmNm: string;
    status: WithholdingResult;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `getWithholdingOrgsQuery` (`app/payroll/result/graphql/getWithholdingOrgs.ts`)
- 쓰는 파일 (3): `app/payroll/result/hooks/useGetWithholdingOrgsQuery.ts`, `app/payroll/result/overview/components/PayrollOverviewList.tsx`, `app/payroll/result/overview/components/PayrollOverviewOrgCard.tsx`

---

<a id="10-11"></a>

### 10-11 `getWithholdingResultDetail` — 원천세 신고 결과 상세 (스키마 설명 없음)

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
| `input` | `WithholdingResultDetailInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 | 사업자등록번호 |
| `input.year` | `number` | ✅ | 보냄 | 년도 |
| `input.month` | `number` | ✅ | 보냄 | 월 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `WithholdingResultDetailOutput` · union 5종)

```ts
{
  __typename: 'WithholdingResultNoPayroll';
  status: StatusTypeEnum;
}
| {
  __typename: 'WithholdingResultPreparingPayroll';
  status: StatusTypeEnum;
}
| {
  __typename: 'WithholdingResultCompletedPayroll';
  sum: number;
  count: number;
  existBizPayroll: boolean;
  existsEtcPayroll: boolean;
  existsWorkPayroll: boolean;
  payrolls: { // WithholdingPayroll
    type: PayrollType;
    name: string;
    resno: string;
    netAmount: number;
  }[];
}
| {
  __typename: 'WithholdingResultCompletedWithholdingRegistration';
  sum: number;
  count: number;
  existBizPayroll: boolean;
  existsEtcPayroll: boolean;
  existsWorkPayroll: boolean;
  payrolls: { // WithholdingPayroll
    type: PayrollType;
    name: string;
    resno: string;
    netAmount: number;
  }[];
  etcMateFiles: { // WithholdingEtcMateFile
    rid: number;
    type: string;
    fileName: string;
    extension: string;
  }[] | null;
  taxSum: number | null;
  paymentDueDate: string;
  lcltxRsltFile: { // WithholdingRsltFile
    rid: number;
    ogntxSbtrPmtTxamt: number;
    existsFile: boolean;
    itrfNm: string;
  } | null;
  rsltFiles: { // WithholdingRsltFile
    rid: number;
    ogntxSbtrPmtTxamt: number;
    existsFile: boolean;
    itrfNm: string;
  }[] | null;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `WithholdingResultCompletedPayroll` `WithholdingResultCompletedWithholdingRegistration`

**프론트**
- 연산: `getWithholdingResultDetailQuery` (`app/payroll/result/graphql/getWithholdingResultDetail.ts`)
- 쓰는 파일 (3): `app/payroll/result/detail/components/NetSalaryDetail.tsx`, `app/payroll/result/detail/components/PayrollResultDetail.tsx`, `app/payroll/result/hooks/useGetWithholdingResultDetailQuery.ts`
