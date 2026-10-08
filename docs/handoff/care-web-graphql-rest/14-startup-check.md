# 14. 창업 점검(세액공제·감면 진단)

> [README](./README.md) · API 5개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [14-01](#14-01) | `startupConversation` | 변경 | 사업자 등록 체크 대화형 분석 | | ☐ | ☐ |
| [14-02](#14-02) | `startupConversationResult` | 변경 | 자연어 기반 세액공제감면 대화 결과 | | ☐ | ☐ |
| [14-03](#14-03) | `saveStartupCheck` | 변경 | 자연어 기반 세액공제감면 분석 저장 | | ☐ | ☐ |
| [14-04](#14-04) | `startupCheck` | 조회 | 자연어 기반 세액공제감면 분석결과 조회 | | ☐ | ☐ |
| [14-05](#14-05) | `sendHookForStartupCheck` | 변경 | 창업전 세무진단 상담 훅 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `Completeness`: `COMPLETE` · `PARTIAL` · `MISSING`
- `ConversationMode`: `CONTINUE` · `START`
- `ConversationRole`: `USER` · `ASSISTANT`
- `FieldType`: `INDUSTRY` · `LOCATION` · `EMPLOYEES` · `REVENUE` · `FOUNDERAGE`
- `Status`: `IN_PROGRESS` · `READY_FOR_ANALYSIS` · `ANALYZING`

## 프론트 작업 파일 (16) — `apps/care-web/` 기준

- `app/startup-check/graphql/saveStartupCheck.ts`
- `app/startup-check/graphql/sendHookForStartupCheck.ts`
- `app/startup-check/graphql/startupCheck.ts`
- `app/startup-check/graphql/startupConversation.ts`
- `app/startup-check/graphql/startupConversationResult.ts`
- `app/startup-check/input/components/StartupCheckCTA.tsx`
- `app/startup-check/input/constants/chatList.tsx`
- `app/startup-check/input/hooks/useChatList.tsx`
- `app/startup-check/input/hooks/useSaveStartupCheck.ts`
- `app/startup-check/input/hooks/useStartUpConversation.ts`
- `app/startup-check/input/hooks/useStartupConversationResult.ts`
- `app/startup-check/input/page.tsx`
- `app/startup-check/result/components/ConsultCompleteDrawer.tsx`
- `app/startup-check/result/components/StartupCheckResultMain.tsx`
- `app/startup-check/result/hooks/useGetStartupCheck.ts`
- `app/startup-check/result/hooks/useSendStartupCheckWebHook.ts`

## API 상세

---

<a id="14-01"></a>

### 14-01 `startupConversation` — 사업자 등록 체크 대화형 분석

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
| `input` | `StartupConversationInput` | ✅ | 보냄 |  |
| `input.conversationHistory` | `ConversationHistoryItem[]` | ✅ | 보냄 |  |
| `input.conversationHistory.content` | `string` | ✅ | 보냄 |  |
| `input.conversationHistory.role` | `ConversationRole` | ✅ | 보냄 |  |
| `input.mode` | `ConversationMode` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `StartupConversationOutput` · union 3종)

```ts
{
  __typename: 'StartupConversationResult';
  status: Status;
  dataCompleteness: { // DataCompleteness
    fieldStatuses: { // FieldStatus
      completeness: Completeness;
      field: FieldType;
    }[];
  };
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { __typename: 'InvalidInput' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `StartupConversationResult`

**프론트**
- 연산: `startupConversationMutation` (`app/startup-check/graphql/startupConversation.ts`)
- 쓰는 파일 (3): `app/startup-check/input/constants/chatList.tsx`, `app/startup-check/input/hooks/useChatList.tsx`, `app/startup-check/input/hooks/useStartUpConversation.ts`

---

<a id="14-02"></a>

### 14-02 `startupConversationResult` — 자연어 기반 세액공제감면 대화 결과

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
| `input` | `DeductionInput` | ✅ | 보냄 |  |
| `input.businessDescription` | `string` | ✅ | 보냄 |  |
| `input.includeSimplifiedTax` | `boolean \| null` |  | 보냄 |  |
| `input.useWebSearch` | `boolean \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `StartupConversationResultOutPut` · union 3종)

```ts
{
  __typename: 'DeductionResult';
  businessDescription: string;
  industryInfo: { // IndustryInfo
    primary: { // IndustryPrimary
      code: string | null;
      name: string | null;
      category: string | null;
      majorCategory: string | null;
      mediumCategory: string | null;
      minorCategory: string | null;
      subCategory: string | null;
      detailCategory: string | null;
    } | null;
  } | null;
  extractedInfo: { // ExtractedInfo
    founderAge: number | null;
    founderAgeConfidence: string | null;
    locationSido: string | null;
    locationSigungu: string | null;
    isCapitalArea: boolean | null;
    expectedEmployees: number | null;
    youthEmployees: number | null;
    disabledEmployees: number | null;
    isStartup: boolean | null;
    isYouthFounder: boolean | null;
    isVentureCompany: boolean | null;
    isSocialEnterprise: boolean | null;
    expectedRevenue: number | null;
    extractedFields: string[];
    missingFields: string[];
    extractionConfidence: string;
  };
  taxAnalysis: { // TaxAnalysis
    companyName: string;
    analysisDate: string;
    deductions: { // Deduction
      deductionName: string;
      legalBasis: string;
      category: string;
      conditions: { // DeductionCondition
        conditionName: string;
        isMet: boolean;
        reason: string;
      }[] | null;
      isApplicable: boolean;
      deductionRate: string | null;
      deductionPeriod: string | null;
      estimatedAmount: number | null;
      description: string;
      applicationNotes: string | null;
      hasOverlapRestriction: boolean | null;
      conflictingDeductions: string[] | null;
    }[];
    summary: { // TaxAnalysisSummary
      totalApplicableItems: number | null;
      totalEstimatedSavings: number | null;
      top3Items: string[] | null;
    };
    guide: { // TaxAnalysisGuide
      priorityRecommendations: string[];
      applicationProcedure: string;
      requiredDocuments: string[];
      precautions: string[];
      additionalTips: string | null;
    };
    aiConfidence: string | null;
    analysisNotes: string | null;
    simplifiedTaxResult: unknown /* JSON */ | null;
    recommendations: { // TaxRecommendation
      recommendedTaxType: string;
      reasons: string[];
      estimatedTotalBenefit: string | null;
    } | null;
    industryRecommendationReason: string | null;
    industryCode: string | null;
  };
  locationInfo: unknown /* JSON */ | null;
  warnings: string[];
  suggestions: string[];
  simplifiedTaxResult: unknown /* JSON */ | null;
  bizRegistrationAdvice: { // BizRegistrationAdvice
    exciseTaxApplicable: boolean | null;
    exciseTaxReason: string | null;
    deemedLiquorLicenseNeeded: boolean | null;
    deemedLiquorLicenseReason: string | null;
    simplifiedTaxRecommendation: string | null;
    simplifiedTaxDetails: string | null;
    businessCardRecommendation: string | null;
    virtualOfficeAllowed: boolean | null;
    virtualOfficeReason: string | null;
    overallRecommendations: string[] | null;
  } | null;
  permits: { // Permits
    primary: { // PermitItem
      permitName: string | null;
      permitType: string | null;
      authority: string | null;
      isRequired: boolean | null;
      description: string | null;
      document: string | null;
      industryName: string | null;
      remarks: string | null;
    }[] | null;
    secondary: { // PermitItem
      permitName: string | null;
      permitType: string | null;
      authority: string | null;
      isRequired: boolean | null;
      description: string | null;
      document: string | null;
      industryName: string | null;
      remarks: string | null;
    }[] | null;
  } | null;
}
| {
  __typename: 'InvalidInput';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeductionResult` `InvalidInput` `TemporaryError`

**프론트**
- 연산: `startupConversationResultMutation` (`app/startup-check/graphql/startupConversationResult.ts`)
- 쓰는 파일 (1): `app/startup-check/input/hooks/useStartupConversationResult.ts`

---

<a id="14-03"></a>

### 14-03 `saveStartupCheck` — 자연어 기반 세액공제감면 분석 저장

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
| `input` | `DeductionResultInput` | ✅ | 보냄 |  |
| `input.deductionResult` | `unknown /* JSON */` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `StartupCheckIdOutput` · union 2종)

```ts
{
  __typename: 'StartupCheckIdResult';
  startupCheckId: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `StartupCheckIdResult`

**프론트**
- 연산: `saveStartupCheckMutation` (`app/startup-check/graphql/saveStartupCheck.ts`)
- 쓰는 파일 (1): `app/startup-check/input/hooks/useSaveStartupCheck.ts`

---

<a id="14-04"></a>

### 14-04 `startupCheck` — 자연어 기반 세액공제감면 분석결과 조회

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
| `input` | `StartupCheckIdInput` | ✅ | 보냄 |  |
| `input.startupCheckId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `StartupCheckOutput` · union 3종)

```ts
{
  __typename: 'StartupCheckResult';
  userName: string | null;
  isCounselRequested: boolean | null;
  businessDescription: string;
  industryInfo: { // IndustryInfo
    primary: { // IndustryPrimary
      detailCategory: string | null;
      majorCategory: string | null;
      subCategory: string | null;
      code: string | null;
    } | null;
  } | null;
  taxAnalysis: { // TaxAnalysis
    deductions: { // Deduction
      estimatedAmount: number | null;
      isApplicable: boolean;
      deductionName: string;
      deductionPeriod: string | null;
      deductionRate: string | null;
      conflictingDeductions: string[] | null;
    }[];
    industryCode: string | null;
    industryRecommendationReason: string | null;
    guide: { // TaxAnalysisGuide
      requiredDocuments: string[];
      additionalTips: string | null;
      precautions: string[];
      priorityRecommendations: string[];
    };
  };
  permits: { // Permits
    primary: { // PermitItem
      permitName: string | null;
      authority: string | null;
      document: string | null;
      isRequired: boolean | null;
      industryName: string | null;
      remarks: string | null;
    }[] | null;
    secondary: { // PermitItem
      permitName: string | null;
      authority: string | null;
      document: string | null;
      isRequired: boolean | null;
      industryName: string | null;
      remarks: string | null;
    }[] | null;
  } | null;
  bizRegistrationAdvice: { // BizRegistrationAdvice
    simplifiedTaxRecommendation: string | null;
    virtualOfficeAllowed: boolean | null;
    businessCardRecommendation: string | null;
    simplifiedTaxDetails: string | null;
  } | null;
}
| {
  __typename: 'InvalidInput';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `InvalidInput` `StartupCheckResult` `TemporaryError`

**프론트**
- 연산: `startupCheckQuery` (`app/startup-check/graphql/startupCheck.ts`)
- 쓰는 파일 (6): `app/startup-check/input/components/StartupCheckCTA.tsx`, `app/startup-check/input/hooks/useStartupConversationResult.ts`, `app/startup-check/input/page.tsx`, `app/startup-check/result/components/ConsultCompleteDrawer.tsx`, `app/startup-check/result/components/StartupCheckResultMain.tsx`, `app/startup-check/result/hooks/useGetStartupCheck.ts`

---

<a id="14-05"></a>

### 14-05 `sendHookForStartupCheck` — 창업전 세무진단 상담 훅

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
| `input` | `StartupCheckWebHookInput` | ✅ | 보냄 |  |
| `input.uuid` | `string` | ✅ | 보냄 |  |
| `input.name` | `string` | ✅ | 보냄 |  |
| `input.phone` | `string` | ✅ | 보냄 |  |
| `input.link` | `string` | ✅ | 보냄 |  |
| `input.description` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SendHookForStartupCheckOutput` · union 2종)

```ts
{
  __typename: 'SendHookForStartupCheckSucceed';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `SendHookForStartupCheckSucceed`

**프론트**
- 연산: `sendHookForStartupCheckMutation` (`app/startup-check/graphql/sendHookForStartupCheck.ts`)
- 쓰는 파일 (1): `app/startup-check/result/hooks/useSendStartupCheckWebHook.ts`
