# 03. 이용료 조회·가입

> [README](./README.md) · API 5개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [03-01](#03-01) | `hometaxOrgsV2` | 조회 | 홈택스 사업체 조회 (이용료조회) | | ☐ | ☐ |
| [03-02](#03-02) | `leadCalcResultV2` | 조회 | 리드 견적 결과 호출 | | ☐ | ☐ |
| [03-03](#03-03) | `sendHookForPricingStart` | 조회 | 자동 견적 기장 시작 훅 | | ☐ | ☐ |
| [03-04](#03-04) | `saveLeadEmployeeInfo` | 변경 | 리드 근로자 정보 저장 | | ☐ | ☐ |
| [03-05](#03-05) | `promotionNotice` | 조회 | 프로모션 안내사항 | | ☐ | ☐ |

## 프론트 작업 파일 (12) — `apps/care-web/` 기준

- `app/(auth)/billing/components/promotion/PromotionNoticeDrawer.tsx`
- `app/(auth)/billing/graphql/promotionNotice.ts`
- `app/pricing/(experiment)/verification/business-query/graphql/hometaxOrgsV2.ts`
- `app/pricing/(experiment)/verification/business-query/hooks/useGetHometaxOrg.ts`
- `app/pricing/(experiment)/verification/employee/hooks/useSaveLeadEmployeeInfo.ts`
- `app/pricing/(experiment)/verification/graphql/saveLeadEmployeeInfo.ts`
- `app/pricing/(form)/graphql/leadCalcResultV2.ts`
- `app/pricing/(form)/graphql/sendHookForPricingStart.ts`
- `app/pricing/(form)/hooks/useLeadCalcResult.tsx`
- `app/pricing/(form)/hooks/useSendHookPricingStart.tsx`
- `app/pricing/(form)/result/components/Applied241007Contact.tsx`
- `app/pricing/(form)/result/components/experiement/ResultDetailDrawer.tsx`

## API 상세

---

<a id="03-01"></a>

### 03-01 `hometaxOrgsV2` — 홈택스 사업체 조회 (이용료조회)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 폴링 — 1.5초마다 같은 조회를 반복, 결과 타입이 진행 중이 아닐 때까지 (README 3-3 ②) |
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
| `exceptionClosedOrg` | `boolean` | ✅ | 안 보냄 |  |
| `allowAnyIndustries` | `boolean` | ✅ | 안 보냄 | 사용자의 사업장들이 수임 불가한 사업장이어도 허용할지 여부 |
| `experiment` | `string \| null` |  | 보냄 |  |
| `utmCampaign` | `string \| null` |  | 보냄 |  |
| `utmMedium` | `string \| null` |  | 보냄 |  |
| `utmTerm` | `string \| null` |  | 보냄 |  |
| `utmContent` | `string \| null` |  | 보냄 |  |
| `utmSource` | `string \| null` |  | 보냄 |  |
| `appkey` | `string \| null` |  | 보냄 |  |
| `pinkey` | `string \| null` |  | 보냄 |  |
| `fbc` | `string \| null` |  | 보냄 |  |
| `fbp` | `string \| null` |  | 보냄 |  |
| `gaClientId` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxOrgsV2Output` · union 14종)

```ts
{
  __typename: 'HometaxOrgs';
  hometaxUser: { // HometaxUserType
    regNo: string | null;
    hometaxId: string;
    tin: string;
  };
  cookie: string | null;
}
| {
  __typename: 'CalcFeeAndHometaxOrgs';
  marketingId: string;
  isSincereUser: boolean;
  hometaxOrgs: { // HometaxOrgType
    status: string;
    bizName: string;
    bmanTin: string;
    bizNo: string;
    closedBizAt: string | null;
    openingBizAt: string | null;
    bizTypeCode: string | null;
    bizAddress: string | null;
  }[];
  hometaxUser: { // HometaxUserType
    regNo: string | null;
    hometaxId: string;
    tin: string;
  };
  cookie: string | null;
}
| {
  __typename: 'TaxFreeBmanError';
  message: string;
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
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'HometaxTimeout';
  message: string;
}
| {
  __typename: 'HometaxOrgOnlyPermanentlyClosed';
  message: string;
}
| {
  __typename: 'NotEqualRpnTin';
  message: string;
}
| {
  __typename: 'JoinedOtherEmail';
  message: string;
  email: string;
}
| {
  __typename: 'CarePlusNotAllowedForPricing';
  message: string;
}
| {
  __typename: 'CarePlusHistoryNotAllowedForPricing';
  message: string;
}
| {
  __typename: 'NoCareTarget';
  message: string;
  hometaxOrgs: { // HometaxOrgType
    status: string;
    bizName: string;
    bmanTin: string;
    bizNo: string;
    closedBizAt: string | null;
    openingBizAt: string | null;
    bizTypeCode: string | null;
    bizAddress: string | null;
  }[];
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `CalcFeeAndHometaxOrgs` `CarePlusHistoryNotAllowedForPricing` `CarePlusNotAllowedForPricing` `HometaxExpiredSession` `HometaxOrgAlreadyCare` `HometaxOrgNotFound` `HometaxOrgOnlyPermanentlyClosed` `HometaxOrgs` `HometaxTimeout` `JoinedOtherEmail` `NoCareTarget` `NotEqualRpnTin` `TaxFreeBmanError`

**프론트**
- 연산: `hometaxOrgsV2Query` (`app/pricing/(experiment)/verification/business-query/graphql/hometaxOrgsV2.ts`)
- 쓰는 파일 (1): `app/pricing/(experiment)/verification/business-query/hooks/useGetHometaxOrg.ts`

---

<a id="03-02"></a>

### 03-02 `leadCalcResultV2` — 리드 견적 결과 호출

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
| `marketingId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CalcResultOutPut` · union 3종)

```ts
{
  __typename: 'LeadCalcResult';
  name: string;
  siteCount: number;
  adjustmentFee: number;
  bookFee: number;
  competitorAdjustmentFee: number;
  competitorBookFee: number;
  savingAmount: number;
}
| {
  __typename: 'NoSupportIndustry';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `LeadCalcResult` `TemporaryError`

**프론트**
- 연산: `leadCalcResultV2Query` (`app/pricing/(form)/graphql/leadCalcResultV2.ts`)
- 쓰는 파일 (1): `app/pricing/(form)/hooks/useLeadCalcResult.tsx`

---

<a id="03-03"></a>

### 03-03 `sendHookForPricingStart` — 자동 견적 기장 시작 훅

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
| `marketingId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SendHookForPricingStartOutput` · union 2종)

```ts
{
  __typename: 'SendHookForPricingStartSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `sendHookForPricingStartQuery` (`app/pricing/(form)/graphql/sendHookForPricingStart.ts`)
- 쓰는 파일 (1): `app/pricing/(form)/hooks/useSendHookPricingStart.tsx`

---

<a id="03-04"></a>

### 03-04 `saveLeadEmployeeInfo` — 리드 근로자 정보 저장

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
| `marketingId` | `string` | ✅ | 보냄 |  |
| `fourInsure` | `boolean` | ✅ | 보냄 | 사대보험 직원 여부 |
| `partTime` | `boolean` | ✅ | 보냄 | 알바, 프리랜서 직원 여부 |
| `isSincereUser` | `boolean \| null` |  | 안 보냄 | 성실신고 납세자 여부 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SaveLeadEmployeeInfoOutput` · union 2종)

```ts
{
  __typename: 'SaveLeadEmployeeInfoSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `SaveLeadEmployeeInfoSucceed`

**프론트**
- 연산: `saveLeadEmployeeInfoMutation` (`app/pricing/(experiment)/verification/graphql/saveLeadEmployeeInfo.ts`)
- 쓰는 파일 (1): `app/pricing/(experiment)/verification/employee/hooks/useSaveLeadEmployeeInfo.ts`

---

<a id="03-05"></a>

### 03-05 `promotionNotice` — 프로모션 안내사항

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PromotionNoticeOutput` · union 2종)

```ts
{
  __typename: 'PromotionNotice';
  promotionDisplayName: string | null;
  message: string;
  notice: unknown /* JSON */ | null;
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
- 연산: `promotionNoticeQuery` (`app/(auth)/billing/graphql/promotionNotice.ts`)
- 쓰는 파일 (3): `app/(auth)/billing/components/promotion/PromotionNoticeDrawer.tsx`, `app/pricing/(form)/result/components/Applied241007Contact.tsx`, `app/pricing/(form)/result/components/experiement/ResultDetailDrawer.tsx`
