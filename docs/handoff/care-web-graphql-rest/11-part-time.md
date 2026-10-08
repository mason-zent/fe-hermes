# 11. 알바 급여 계산

> [README](./README.md) · API 10개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [11-01](#11-01) | `orgListByNormalUser` | 조회 | 알바 급여 계산용 내 사업장 목록 (스키마 설명 없음) | | ☐ | ☐ |
| [11-02](#11-02) | `getPartTimers` | 조회 | 사업장 근로자(알바) 목록 — bizno 가 빈 문자열이면 userId 기준 | | ☐ | ☐ |
| [11-03](#11-03) | `getWorkersWithPayResult` | 조회 | 해당 연월에 급여 계산 내역이 있는 근로자 목록 | | ☐ | ☐ |
| [11-04](#11-04) | `getPartTimeWorkerDetail` | 조회 | 근로자 상세(기본 정보·시급·수당·근무시간 설정) | | ☐ | ☐ |
| [11-05](#11-05) | `updatePartTimeWorkerBasicInfo` | 변경 | 알바 근로자 기본정보(이름·전화번호·주민번호) 저장 | | ☐ | ☐ |
| [11-06](#11-06) | `updatePartTimeAdditionalInfo` | 변경 | 알바 근로자 시급·수당·근무시간 설정 저장 | | ☐ | ☐ |
| [11-07](#11-07) | `getPartTimeDetail` | 조회 | 근로자 연월별 일별 근무·주별 수당·월 급여 정산 통합 조회 | | ☐ | ☐ |
| [11-08](#11-08) | `getDailyBreakdowns` | 조회 | 근무 기록 → 일별 상세(총·기본·연장·야간 시간) 계산 | | ☐ | ☐ |
| [11-09](#11-09) | `calculateWeeklyHoliday` | 조회 | 일별 근무 + 시급 → 주차별 주휴수당 계산 | | ☐ | ☐ |
| [11-10](#11-10) | `updatePayCalculate` | 변경 | 주휴·연장수당·일별 근무 저장 + 월 급여 정산 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `BookStatusEnum`: `WAIT` · `ONLY_DECLARE` · `BOOK_IN_PROGRESS` · `BOOK_STOP_CANCEL` · `BOOK_STOP_CLOSED`

## 프론트 작업 파일 (31) — `apps/care-web/` 기준

- `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useCheckSavedDailyBreakdowns.ts`
- `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useCheckWeeklyHoliday.ts`
- `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useDailyBreakDown.ts`
- `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useGetDailyBreakDownQuery.ts`
- `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useUpdateWeeklyHolidayInfo.ts`
- `app/payroll/(part-time)/part-timers/components/PartTimeEmployeeSelectDrawer.tsx`
- `app/payroll/(part-time)/part-timers/components/PartTimeMainContents.tsx`
- `app/payroll/(part-time)/part-timers/detail/hooks/useDeleteMonthlyWorkRecords.ts`
- `app/payroll/(part-time)/part-timers/detail/hooks/useGetPartTimeDetailQuery.ts`
- `app/payroll/(part-time)/part-timers/detail/page.tsx`
- `app/payroll/(part-time)/part-timers/graphql/calculateWeeklyHoliday.ts`
- `app/payroll/(part-time)/part-timers/graphql/getDailyBreakDowns.ts`
- `app/payroll/(part-time)/part-timers/graphql/getPartTimeDetail.ts`
- `app/payroll/(part-time)/part-timers/graphql/getPartTimeWorkerDetail.ts`
- `app/payroll/(part-time)/part-timers/graphql/getPartTimers.ts`
- `app/payroll/(part-time)/part-timers/graphql/getPaySlipResult.ts`
- `app/payroll/(part-time)/part-timers/graphql/getSavedDailyBreakdowns.ts`
- `app/payroll/(part-time)/part-timers/graphql/getWorkersWithPayResult.ts`
- `app/payroll/(part-time)/part-timers/graphql/orgListByNormalUser.ts`
- `app/payroll/(part-time)/part-timers/graphql/updatePartTimeWorkerAdditionalInfo.ts`
- `app/payroll/(part-time)/part-timers/graphql/updatePartTimeWorkerBasicInfo.ts`
- `app/payroll/(part-time)/part-timers/graphql/updatePayCalculate.ts`
- `app/payroll/(part-time)/part-timers/hooks/useGetOrgList.ts`
- `app/payroll/(part-time)/part-timers/hooks/useGetPartTimeWorkerDetail.ts`
- `app/payroll/(part-time)/part-timers/hooks/useGetPartTimers.ts`
- `app/payroll/(part-time)/part-timers/hooks/useGetWorkersWithPayResultQuery.ts`
- `app/payroll/(part-time)/part-timers/payslip/page.tsx`
- `app/payroll/(part-time)/part-timers/register/hooks/useUpdatePartTimeWorkerAdditionalInfo.ts`
- `app/payroll/(part-time)/part-timers/register/hooks/useUpdatePartTimeWorkerBasicInfo.ts`
- `app/payroll/(part-time)/part-timers/work/hooks/usePartTimerWorks.ts`
- `app/payroll/hooks/useGetPartTimeRegistered.ts`

## API 상세

---

<a id="11-01"></a>

### 11-01 `orgListByNormalUser` — 알바 급여 계산용 내 사업장 목록 (스키마 설명 없음)

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
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `orgListByNormalUserQuery` (`app/payroll/(part-time)/part-timers/graphql/orgListByNormalUser.ts`)
- 쓰는 파일 (1): `app/payroll/(part-time)/part-timers/hooks/useGetOrgList.ts`

---

<a id="11-02"></a>

### 11-02 `getPartTimers` — 사업장 근로자(알바) 목록 — bizno 가 빈 문자열이면 userId 기준

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
| `input` | `GetWorkersByBiznoInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 | 사업자등록번호 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetWorkersByBiznoOutput` · union 2종)

```ts
{
  __typename: 'GetWorkersByBiznoResult';
  workers: { // WorkerSimpleInfo
    workerId: number;
    name: string;
    rrnFront: string | null;
    rrnBack: string | null;
  }[];
}
| { __typename: 'TemporaryError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetWorkersByBiznoResult`

**프론트**
- 연산: `getPartTimersQuery` (`app/payroll/(part-time)/part-timers/graphql/getPartTimers.ts`)
- 쓰는 파일 (1): `app/payroll/(part-time)/part-timers/hooks/useGetPartTimers.ts`

---

<a id="11-03"></a>

### 11-03 `getWorkersWithPayResult` — 해당 연월에 급여 계산 내역이 있는 근로자 목록

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
| `input` | `GetWorkersWithPayResultInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 | 사업자등록번호 |
| `input.year` | `string` | ✅ | 보냄 | 연도 (YYYY) |
| `input.month` | `string` | ✅ | 보냄 | 월 (MM) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetWorkersWithPayResultOutput` · union 2종)

```ts
{
  __typename: 'GetWorkersWithPayResult';
  workers: { // WorkerPayResultInfo
    workerId: number;
    name: string;
    rrnBack: string | null;
    rrnFront: string | null;
    phone: string | null;
    netAmount: number | null;
    totalAmount: number | null;
    updatedAt: unknown /* DateTime */ | null;
  }[];
}
| { __typename: 'TemporaryError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetWorkersWithPayResult`

**프론트**
- 연산: `getWorkersWithPayResultQuery` (`app/payroll/(part-time)/part-timers/graphql/getWorkersWithPayResult.ts`)
- 쓰는 파일 (4): `app/payroll/(part-time)/part-timers/components/PartTimeEmployeeSelectDrawer.tsx`, `app/payroll/(part-time)/part-timers/components/PartTimeMainContents.tsx`, `app/payroll/(part-time)/part-timers/hooks/useGetWorkersWithPayResultQuery.ts`, `app/payroll/hooks/useGetPartTimeRegistered.ts`

---

<a id="11-04"></a>

### 11-04 `getPartTimeWorkerDetail` — 근로자 상세(기본 정보·시급·수당·근무시간 설정)

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
| `input` | `GetPartTimeWorkerDetailInput` | ✅ | 보냄 |  |
| `input.workerId` | `number` | ✅ | 보냄 | 근로자 ID (sprd_lbr_stff_infr_id) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetPartTimeWorkerDetailOutput` · union 2종)

```ts
{
  __typename: 'GetPartTimeWorkerDetailResult';
  basicInfo: { // PartTimeBasicInfoOutput
    name: string;
    rrnBack: string;
    rrnFront: string;
    phoneNumber: string;
  };
  wage: number | null;
  workerId: number;
  additionalInfo: { // PartTimeAdditionalInfoOutput
    overtimeAllowance: boolean;
    nightAllowance: boolean;
    holidayAllowance: boolean;
    holiday: number[];
  } | null;
  baseWorkTime: { // PartTimeBaseWorkTimeOutput
    workStart: { // TimeValueOutput
      hour: string;
      minute: string;
    };
    workEnd: { // TimeValueOutput
      hour: string;
      minute: string;
    };
    breakTime: { // TimeValueOutput
      hour: string;
      minute: string;
    };
    nightBreakTime: { // TimeValueOutput
      hour: string;
      minute: string;
    };
    isEndedNextDay: boolean;
    isNightBreakTime: boolean;
  } | null;
}
| { __typename: 'TemporaryError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetPartTimeWorkerDetailResult`

**프론트**
- 연산: `getPartTimeWorkerDetailQuery` (`app/payroll/(part-time)/part-timers/graphql/getPartTimeWorkerDetail.ts`)
- 쓰는 파일 (1): `app/payroll/(part-time)/part-timers/hooks/useGetPartTimeWorkerDetail.ts`

---

<a id="11-05"></a>

### 11-05 `updatePartTimeWorkerBasicInfo` — 알바 근로자 기본정보(이름·전화번호·주민번호) 저장

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
| `input` | `UpdatePartTimeWorkerBasicInfoInput` | ✅ | 보냄 |  |
| `input.bizno` | `string` | ✅ | 보냄 | 사업자등록번호 |
| `input.basicInfo` | `PartTimeWorkerBasicInfoInput` | ✅ | 보냄 | 근로자 기본 정보 |
| `input.basicInfo.name` | `string` | ✅ | 보냄 | 이름 |
| `input.basicInfo.phoneNumber` | `string \| null` |  | 보냄 | 전화번호 |
| `input.basicInfo.rrnFront` | `string \| null` |  | 보냄 | 주민등록번호 앞자리 |
| `input.basicInfo.rrnBack` | `string \| null` |  | 보냄 | 주민등록번호 뒷자리 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdatePartTimeWorkerBasicInfoOutput` · union 2종)

```ts
{
  __typename: 'UpdatePartTimeWorkerInfoResult';
  workerId: number;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdatePartTimeWorkerInfoResult`

**프론트**
- 연산: `updatePartTimeWorkerBasicInfoMutation` (`app/payroll/(part-time)/part-timers/graphql/updatePartTimeWorkerBasicInfo.ts`)
- 쓰는 파일 (1): `app/payroll/(part-time)/part-timers/register/hooks/useUpdatePartTimeWorkerBasicInfo.ts`

---

<a id="11-06"></a>

### 11-06 `updatePartTimeAdditionalInfo` — 알바 근로자 시급·수당·근무시간 설정 저장

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
| `input` | `UpdatePartTimeAdditionalInfoInput` | ✅ | 보냄 |  |
| `input.workerId` | `number` | ✅ | 보냄 | 근로자 ID (sprd_lbr_stff_infr_id) |
| `input.wage` | `string \| null` |  | 보냄 | 시급 (원) |
| `input.additionalInfo` | `PartTimeAdditionalInfoInput \| null` |  | 보냄 | 수당 지급 설정 |
| `input.additionalInfo.nightAllowance` | `boolean \| null` |  | 보냄 | 야간수당 지급 여부 |
| `input.additionalInfo.overtimeAllowance` | `boolean \| null` |  | 보냄 | 연장수당 지급 여부 |
| `input.additionalInfo.holidayAllowance` | `boolean \| null` |  | 보냄 | 휴일수당 지급 여부 |
| `input.additionalInfo.holiday` | `number[] \| null` |  | 보냄 | 휴무일 (0: 일요일 ~ 6: 토요일) |
| `input.baseWorkTime` | `PartTimeBaseWorkTimeInput \| null` |  | 보냄 | 기본 근무 시간 설정 |
| `input.baseWorkTime.workStart` | `TimeValueInput \| null` |  | 보냄 | 출근 시간 |
| `input.baseWorkTime.workStart.hour` | `string` | ✅ | 보냄 | 시 (00~23) |
| `input.baseWorkTime.workStart.minute` | `string` | ✅ | 보냄 | 분 (00~59) |
| `input.baseWorkTime.workEnd` | `TimeValueInput \| null` |  | 보냄 | 퇴근 시간 |
| `input.baseWorkTime.workEnd.hour` | `string` | ✅ | 보냄 | 시 (00~23) |
| `input.baseWorkTime.workEnd.minute` | `string` | ✅ | 보냄 | 분 (00~59) |
| `input.baseWorkTime.breakTime` | `TimeValueInput \| null` |  | 보냄 | 주간 휴게시간 |
| `input.baseWorkTime.breakTime.hour` | `string` | ✅ | 보냄 | 시 (00~23) |
| `input.baseWorkTime.breakTime.minute` | `string` | ✅ | 보냄 | 분 (00~59) |
| `input.baseWorkTime.nightBreakTime` | `TimeValueInput \| null` |  | 보냄 | 야간 휴게시간 |
| `input.baseWorkTime.nightBreakTime.hour` | `string` | ✅ | 보냄 | 시 (00~23) |
| `input.baseWorkTime.nightBreakTime.minute` | `string` | ✅ | 보냄 | 분 (00~59) |
| `input.baseWorkTime.isNightBreakTime` | `boolean \| null` |  | 보냄 | 야간 휴게시간 사용 여부 |
| `input.baseWorkTime.isEndedNextDay` | `boolean \| null` |  | 보냄 | 익일 퇴근 여부 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdatePartTimeAdditionalInfoOutput` · union 2종)

```ts
{
  __typename: 'UpdatePartTimeWorkerInfoResult';
  workerId: number;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdatePartTimeWorkerInfoResult`

**프론트**
- 연산: `updatePartTimeWorkerAdditionalInfoMutation` (`app/payroll/(part-time)/part-timers/graphql/updatePartTimeWorkerAdditionalInfo.ts`)
- 쓰는 파일 (1): `app/payroll/(part-time)/part-timers/register/hooks/useUpdatePartTimeWorkerAdditionalInfo.ts`

---

<a id="11-07"></a>

### 11-07 `getPartTimeDetail` — 근로자 연월별 일별 근무·주별 수당·월 급여 정산 통합 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 3개 — `getPartTimeDetailQuery`, `getPaySlipResultQuery`, `getSavedDailyBreakdownsQuery` (README 3-2) |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `input` | `GetPartTimeDetailInput` | ✅ | 보냄 |  |
| `input.workerId` | `number` | ✅ | 보냄 | 근로자 ID |
| `input.year` | `string` | ✅ | 보냄 | 연도 (YYYY) |
| `input.month` | `string` | ✅ | 보냄 | 월 (MM) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetPartTimeDetailOutput` · union 2종)

```ts
{
  __typename: 'GetPartTimeDetailResult';
  workerId: number;
  dailyBreakdowns: { // DailyBreakdownOutput
    date: string;
    startTime: string;
    endTime: string;
    hours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    regularHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    overtimeHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    nightHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    breakHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    nightBreakHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    isHoliday: boolean;
    isEndedNextDay: boolean;
  }[];
  weeklyData: { // WeeklyHolidayBreakdownOutput
    weekStart: string;
    weekEnd: string;
    sunday: string;
    overtimePay: number;
    enableWeeklyHoliday: boolean;
    weeklyHolidayPay: number;
    weeklyRegularHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
  }[];
  monthlyPay: { // MonthlyPayBreakdownOutput
    basePay: number;
    nightPay: number;
    netPay: number;
    totalAmt: number;
    totalTax: number;
    overtimePay: number;
    holidayPay: number;
    weeklyHolidayPay: number;
  } | null;
  wage: number | null;
  additionalInfo: { // PartTimeAdditionalInfoOutput
    overtimeAllowance: boolean;
    nightAllowance: boolean;
    holidayAllowance: boolean;
  } | null;
  basicInfo: { // PartTimeBasicInfoOutput
    name: string;
  };
}
| { __typename: 'TemporaryError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetPartTimeDetailResult`

**프론트**
- 연산: `getPartTimeDetailQuery` (`app/payroll/(part-time)/part-timers/graphql/getPartTimeDetail.ts`), `getPaySlipResultQuery` (`app/payroll/(part-time)/part-timers/graphql/getPaySlipResult.ts`), `getSavedDailyBreakdownsQuery` (`app/payroll/(part-time)/part-timers/graphql/getSavedDailyBreakdowns.ts`)
- 쓰는 파일 (5): `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useCheckSavedDailyBreakdowns.ts`, `app/payroll/(part-time)/part-timers/components/PartTimeEmployeeSelectDrawer.tsx`, `app/payroll/(part-time)/part-timers/detail/hooks/useGetPartTimeDetailQuery.ts`, `app/payroll/(part-time)/part-timers/detail/page.tsx`, `app/payroll/(part-time)/part-timers/payslip/page.tsx`

---

<a id="11-08"></a>

### 11-08 `getDailyBreakdowns` — 근무 기록 → 일별 상세(총·기본·연장·야간 시간) 계산

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
| `workRecords` | `WorkRecordInput[]` | ✅ | 보냄 |  |
| `workRecords.date` | `string` | ✅ | 보냄 | 날짜 (YYYY-MM-DD) |
| `workRecords.startTime` | `string` | ✅ | 보냄 | 출근 시간 (HH:mm) |
| `workRecords.endTime` | `string` | ✅ | 보냄 | 퇴근 시간 (HH:mm) |
| `workRecords.dayBreakMinutes` | `number` | ✅ | 보냄 | 주간 휴게 시간 (분) |
| `workRecords.nightBreakMinutes` | `number` | ✅ | 보냄 | 야간 휴게 시간 (분) |
| `workRecords.isHoliday` | `boolean` | ✅ | 보냄 | 휴일 여부 |
| `workRecords.isEndedNextDay` | `boolean` | ✅ | 보냄 | 익일 퇴근 여부 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetDailyBreakdownsOutput` · union 2종)

```ts
{
  __typename: 'GetDailyBreakdownsResult';
  breakdowns: { // DailyBreakdownOutput
    date: string;
    startTime: string;
    endTime: string;
    hours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    regularHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    overtimeHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    nightHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    breakHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    nightBreakHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    isHoliday: boolean;
    isEndedNextDay: boolean;
  }[];
}
| { __typename: 'TemporaryError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `GetDailyBreakdownsResult`

**프론트**
- 연산: `getDailyBreakDownsQuery` (`app/payroll/(part-time)/part-timers/graphql/getDailyBreakDowns.ts`)
- 쓰는 파일 (3): `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useDailyBreakDown.ts`, `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useGetDailyBreakDownQuery.ts`, `app/payroll/(part-time)/part-timers/work/hooks/usePartTimerWorks.ts`

---

<a id="11-09"></a>

### 11-09 `calculateWeeklyHoliday` — 일별 근무 + 시급 → 주차별 주휴수당 계산

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
| `input` | `CalculateWeeklyHolidayInput` | ✅ | 보냄 |  |
| `input.dailyBreakdowns` | `DailyBreakdownInput[]` | ✅ | 보냄 | 일별 근무 분석 목록 |
| `input.dailyBreakdowns.date` | `string` | ✅ | 보냄 | 날짜 (YYYY-MM-DD) |
| `input.dailyBreakdowns.startTime` | `string` | ✅ | 보냄 | 출근 시간 (HH:mm) |
| `input.dailyBreakdowns.endTime` | `string` | ✅ | 보냄 | 퇴근 시간 (HH:mm) |
| `input.dailyBreakdowns.hours` | `HoursMinutesInput` | ✅ | 보냄 | 총 근로 시간 |
| `input.dailyBreakdowns.hours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.hours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.regularHours` | `HoursMinutesInput` | ✅ | 보냄 | 기본 근로 시간 |
| `input.dailyBreakdowns.regularHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.regularHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.overtimeHours` | `HoursMinutesInput` | ✅ | 보냄 | 연장 근로 시간 |
| `input.dailyBreakdowns.overtimeHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.overtimeHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.nightHours` | `HoursMinutesInput` | ✅ | 보냄 | 야간 근로 시간 |
| `input.dailyBreakdowns.nightHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.nightHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.breakHours` | `HoursMinutesInput` | ✅ | 보냄 | 휴게 시간 |
| `input.dailyBreakdowns.breakHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.breakHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.nightBreakHours` | `HoursMinutesInput` | ✅ | 보냄 | 야간 휴게 시간 |
| `input.dailyBreakdowns.nightBreakHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.nightBreakHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.isHoliday` | `boolean` | ✅ | 보냄 | 휴일 여부 |
| `input.dailyBreakdowns.isEndedNextDay` | `boolean` | ✅ | 보냄 | 익일 퇴근 여부 |
| `input.hourlyWage` | `number` | ✅ | 보냄 | 시급 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CalculateWeeklyHolidayOutput` · union 2종)

```ts
{
  __typename: 'CalculateWeeklyHolidayResult';
  totalWeeklyHolidayPay: number;
  totalWeeklyOvertimePay: number;
  breakdown: { // WeeklyHolidayBreakdownOutput
    weekEnd: string;
    weekStart: string;
    sunday: string;
    weeklyHolidayPay: number;
    weeklyRegularHours: { // HoursMinutesOutput
      hours: number;
      minutes: number;
    };
    overtimePay: number;
  }[];
}
| { __typename: 'TemporaryError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `CalculateWeeklyHolidayResult`

**프론트**
- 연산: `calculateWeeklyHolidayQuery` (`app/payroll/(part-time)/part-timers/graphql/calculateWeeklyHoliday.ts`)
- 쓰는 파일 (2): `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useCheckWeeklyHoliday.ts`, `app/payroll/(part-time)/part-timers/detail/hooks/useDeleteMonthlyWorkRecords.ts`

---

<a id="11-10"></a>

### 11-10 `updatePayCalculate` — 주휴·연장수당·일별 근무 저장 + 월 급여 정산

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
| `input` | `UpdatePayCalculateInput` | ✅ | 보냄 |  |
| `input.workerId` | `number` | ✅ | 보냄 | 근로자 ID |
| `input.hourlyWage` | `number \| null` |  | 보냄 | 시급 |
| `input.weeklyData` | `WeeklyHolidayUpdateItemInput[]` | ✅ | 보냄 | 주별 업데이트 내역 |
| `input.weeklyData.sunday` | `string` | ✅ | 보냄 | 주의 기준일 (YYYY-MM-DD) |
| `input.weeklyData.weeklyHolidayPay` | `number` | ✅ | 보냄 | 주휴수당 금액 |
| `input.weeklyData.overtimePay` | `number` | ✅ | 보냄 | 주간 연장수당 금액 |
| `input.weeklyData.weeklyRegularMinutes` | `number` | ✅ | 보냄 | 주별 총 정규 근로시간 (분) |
| `input.weeklyData.enableWeeklyHoliday` | `boolean \| null` |  | 보냄 | 주휴수당 적용 여부 |
| `input.dailyBreakdowns` | `DailyBreakdownInput[] \| null` |  | 보냄 | 일별 근무 분석 내역 |
| `input.dailyBreakdowns.date` | `string` | ✅ | 보냄 | 날짜 (YYYY-MM-DD) |
| `input.dailyBreakdowns.startTime` | `string` | ✅ | 보냄 | 출근 시간 (HH:mm) |
| `input.dailyBreakdowns.endTime` | `string` | ✅ | 보냄 | 퇴근 시간 (HH:mm) |
| `input.dailyBreakdowns.hours` | `HoursMinutesInput` | ✅ | 보냄 | 총 근로 시간 |
| `input.dailyBreakdowns.hours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.hours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.regularHours` | `HoursMinutesInput` | ✅ | 보냄 | 기본 근로 시간 |
| `input.dailyBreakdowns.regularHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.regularHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.overtimeHours` | `HoursMinutesInput` | ✅ | 보냄 | 연장 근로 시간 |
| `input.dailyBreakdowns.overtimeHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.overtimeHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.nightHours` | `HoursMinutesInput` | ✅ | 보냄 | 야간 근로 시간 |
| `input.dailyBreakdowns.nightHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.nightHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.breakHours` | `HoursMinutesInput` | ✅ | 보냄 | 휴게 시간 |
| `input.dailyBreakdowns.breakHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.breakHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.nightBreakHours` | `HoursMinutesInput` | ✅ | 보냄 | 야간 휴게 시간 |
| `input.dailyBreakdowns.nightBreakHours.hours` | `number` | ✅ | 보냄 | 시간 |
| `input.dailyBreakdowns.nightBreakHours.minutes` | `number` | ✅ | 보냄 | 분 |
| `input.dailyBreakdowns.isHoliday` | `boolean` | ✅ | 보냄 | 휴일 여부 |
| `input.dailyBreakdowns.isEndedNextDay` | `boolean` | ✅ | 보냄 | 익일 퇴근 여부 |
| `year` | `string \| null` |  | 보냄 |  |
| `month` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdatePayCalculateOutput` · union 2종)

```ts
{
  __typename: 'UpdatePayCalculateResult';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdatePayCalculateResult`

**프론트**
- 연산: `updatePayCalculateMutation` (`app/payroll/(part-time)/part-timers/graphql/updatePayCalculate.ts`)
- 쓰는 파일 (2): `app/payroll/(part-time)/part-timers/calculate/work-summary/hooks/useUpdateWeeklyHolidayInfo.ts`, `app/payroll/(part-time)/part-timers/detail/hooks/useDeleteMonthlyWorkRecords.ts`
