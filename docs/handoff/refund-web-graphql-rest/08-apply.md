# 08. 신청·취소

> [README](./README.md) · API 15개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [08-01](#08-01) | `canApplyRefund` | 조회 | 신청 가능 여부 확인 | | ☐ | ☐ |
| [08-02](#08-02) | `checkApplyRefund` | 조회 | 종합소득세(·법인) 신청 정보 확인 | | ☐ | ☐ |
| [08-03](#08-03) | `checkApplyTritxRefund` | 조회 | 양도세 신청 정보 확인 | | ☐ | ☐ |
| [08-04](#08-04) | `applyRefund` | 변경 | 종합소득세(·법인) 환급 신청 | | ☐ | ☐ |
| [08-05](#08-05) | `tritxApplyRefund` | 변경 | 양도세 환급 신청 | | ☐ | ☐ |
| [08-06](#08-06) | `simpleApply` | 변경 | 간편 신청(링크) | | ☐ | ☐ |
| [08-07](#08-07) | `cancelReasonsV2` | 조회 | 취소 사유 목록 | | ☐ | ☐ |
| [08-08](#08-08) | `applyCancel` | 변경 | 신청 취소 | | ☐ | ☐ |
| [08-09](#08-09) | `tritxApplyCancel` | 변경 | 양도세 신청 취소 | | ☐ | ☐ |
| [08-10](#08-10) | `revokeCancel` | 변경 | 취소 철회 | | ☐ | ☐ |
| [08-11](#08-11) | `tritxRevokeCancel` | 변경 | 양도세 취소 철회 | | ☐ | ☐ |
| [08-12](#08-12) | `getApplyRefundCertificate` | 조회 | 신청 확인서 조회 | | ☐ | ☐ |
| [08-13](#08-13) | `createApplyRefundCertificate` | 변경 | 신청 확인서 생성 | | ☐ | ☐ |
| [08-14](#08-14) | `getDeligationInfoOfUser` | 조회 | 위임 정보 조회 | | ☐ | ☐ |
| [08-15](#08-15) | `saveApplyRefundDelegationFiles` | 변경 | 위임장·서명 저장 | | ☐ | ☐ |

## 프론트 작업 파일 (24) — `apps/refund-web/` 기준

- `components/simple-terms/SimpleTermsContent.tsx`
- `components/tax-refund/apply/result/ApplyResultReceiveCancelContent.tsx`
- `components/tax-refund/apply/result/TritxApplyRefundResultContent.tsx`
- `components/tax-refund/cancel/CancelReasonContent.tsx`
- `components/tax-refund/common/drawers/CheckAccountNameDrawer.tsx`
- `components/tax-refund/home/StatusManualSection.tsx`
- `components/tax-refund/lookup/result/apply-possible/ApplyPossibleContent.tsx`
- `components/tax-refund/lookup/result/apply-possible/use-apply-possible-refund-data.ts`
- `graphql/mutation/tax-refund/apply-refund.ts`
- `graphql/mutation/tax-refund/cancel.ts`
- `graphql/mutation/tax-refund/revoke-cancel.ts`
- `graphql/mutation/tax-refund/save-apply-refund-delegation-files.ts`
- `graphql/mutation/tax-refund/simple-apply.ts`
- `graphql/mutation/tax-refund/tritx-apply-refund.ts`
- `graphql/mutation/tax-refund/tritx-revoke-cancel.ts`
- `graphql/query/lookup/result/apply-possible.ts`
- `graphql/query/tax-refund/bznav-refund.ts`
- `graphql/query/tax-refund/snapshot.ts`
- `lib/hooks/refund/api/use-apply-refund.ts`
- `lib/hooks/refund/api/use-simple-apply.ts`
- `lib/hooks/refund/api/use-tritx-apply-refund.ts`
- `lib/hooks/refund/use-both-apply-refund.ts`
- `lib/hooks/refund/use-snapshot-data.ts`
- `lib/utils/url.ts`

## API 상세

---

<a id="08-01"></a>

### 08-01 `canApplyRefund` — 신청 가능 여부 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 다른 API 와 한 요청으로 묶임 | `applyPossibleQuery`(5개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CanApplyRefundOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_DUPLICATE_APPLY`

**프론트**
- 연산: `applyPossibleQuery` (`graphql/query/lookup/result/apply-possible.ts`)
- 쓰는 파일 (2): `components/tax-refund/lookup/result/apply-possible/ApplyPossibleContent.tsx`, `components/tax-refund/lookup/result/apply-possible/use-apply-possible-refund-data.ts`

---

<a id="08-02"></a>

### 08-02 `checkApplyRefund` — 종합소득세(·법인) 신청 정보 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 다른 API 와 한 요청으로 묶임 | `applyPossibleQuery`(5개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckApplyRefundOutput`)

```ts
{
  result: boolean;
  email: string | null;
  lastLoginType: string | null;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_DUPLICATE_APPLY`

**프론트**
- 연산: `applyPossibleQuery` (`graphql/query/lookup/result/apply-possible.ts`)
- 쓰는 파일 (2): `components/tax-refund/lookup/result/apply-possible/ApplyPossibleContent.tsx`, `components/tax-refund/lookup/result/apply-possible/use-apply-possible-refund-data.ts`

---

<a id="08-03"></a>

### 08-03 `checkApplyTritxRefund` — 양도세 신청 정보 확인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 다른 API 와 한 요청으로 묶임 | `applyPossibleQuery`(5개) — README 3-1 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckApplyRefundOutput`)

```ts
{
  result: boolean;
  email: string | null;
  lastLoginType: string | null;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_DUPLICATE_APPLY`

**프론트**
- 연산: `applyPossibleQuery` (`graphql/query/lookup/result/apply-possible.ts`)
- 쓰는 파일 (2): `components/tax-refund/lookup/result/apply-possible/ApplyPossibleContent.tsx`, `components/tax-refund/lookup/result/apply-possible/use-apply-possible-refund-data.ts`

---

<a id="08-04"></a>

### 08-04 `applyRefund` — 종합소득세(·법인) 환급 신청

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
| `refundId` | `string` | ✅ | 보냄 |  |
| `phoneNumber` | `string` | ✅ | 보냄 |  |
| `bank` | `string` | ✅ | 보냄 |  |
| `accountOwner` | `string` | ✅ | 보냄 |  |
| `accountNo` | `string` | ✅ | 보냄 |  |
| `autographImageKey` | `string | null` |  | 보냄 | 자필 서명 이미지 S3 Object Key (위임장 업로드 API 응답값) |
| `delegationFileKey` | `string | null` |  | 보냄 | 위임장 PDF 파일 S3 Object Key (위임장 업로드 API 응답값) |
| `applyUtm` | `RefundUtm | null` |  | 보냄 |  |
| `applyUtm.source` | `string | null` |  | 보냄 |  |
| `applyUtm.medium` | `string | null` |  | 보냄 |  |
| `applyUtm.campaign` | `string | null` |  | 보냄 |  |
| `applyUtm.term` | `string | null` |  | 보냄 |  |
| `applyUtm.content` | `string | null` |  | 보냄 |  |
| `metaProperties` | `string | null` |  | 보냄 | 메타 픽셀 전환 API 데이터 (JSON String) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ApplyRefundOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_BANK_CHANGE_NOT_ALLOWED` `ERR_HOMETAX_CALCULATE` `ERR_HOMETAX_COLLECT` `ERR_HOMETAX_ETC` `ERR_HOMETAX_IMPOSSIBLE` `ERR_HOMETAX_NO_BMAN` `ERR_HOMETAX_SERVER_FIX` `ERR_HOMETAX_SESSION` `ERR_HOMETAX_TIMEOUT`

**프론트**
- 연산: `applyRefundMutation` (`graphql/mutation/tax-refund/apply-refund.ts`)
- 쓰는 파일 (4): `components/tax-refund/common/drawers/CheckAccountNameDrawer.tsx`, `lib/hooks/refund/api/use-apply-refund.ts`, `lib/hooks/refund/use-both-apply-refund.ts`, `lib/utils/url.ts`

---

<a id="08-05"></a>

### 08-05 `tritxApplyRefund` — 양도세 환급 신청

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
| `refundId` | `string` | ✅ | 보냄 |  |
| `phoneNumber` | `string` | ✅ | 보냄 |  |
| `bank` | `string` | ✅ | 보냄 |  |
| `accountOwner` | `string` | ✅ | 보냄 |  |
| `accountNo` | `string` | ✅ | 보냄 |  |
| `autographImageKey` | `string | null` |  | 안 보냄 | 자필 서명 이미지 S3 Object Key (위임장 업로드 API 응답값) |
| `delegationFileKey` | `string | null` |  | 안 보냄 | 위임장 PDF 파일 S3 Object Key (위임장 업로드 API 응답값) |
| `applyUtm` | `RefundUtm | null` |  | 보냄 |  |
| `applyUtm.source` | `string | null` |  | 보냄 |  |
| `applyUtm.medium` | `string | null` |  | 보냄 |  |
| `applyUtm.campaign` | `string | null` |  | 보냄 |  |
| `applyUtm.term` | `string | null` |  | 보냄 |  |
| `applyUtm.content` | `string | null` |  | 보냄 |  |
| `metaProperties` | `string | null` |  | 보냄 | 메타 픽셀 전환 API 데이터 (JSON String) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ApplyRefundOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `tritxApplyRefundMutation` (`graphql/mutation/tax-refund/tritx-apply-refund.ts`)
- 쓰는 파일 (2): `lib/hooks/refund/api/use-tritx-apply-refund.ts`, `lib/hooks/refund/use-both-apply-refund.ts`

---

<a id="08-06"></a>

### 08-06 `simpleApply` — 간편 신청(링크)

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
| `input` | `SimpleApplyInput` | ✅ | 보냄 |  |
| `input.code` | `string` | ✅ | 보냄 |  |
| `input.phoneNumber` | `string | null` |  | 보냄 |  |
| `input.bank` | `string | null` |  | 보냄 |  |
| `input.accountOwner` | `string | null` |  | 보냄 |  |
| `input.accountNo` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_DUPLICATE_APPLY` `ERR_EXPIRE_URL`

**프론트**
- 연산: `simpleApplyMutation` (`graphql/mutation/tax-refund/simple-apply.ts`)
- 쓰는 파일 (2): `components/simple-terms/SimpleTermsContent.tsx`, `lib/hooks/refund/api/use-simple-apply.ts`

---

<a id="08-07"></a>

### 08-07 `cancelReasonsV2` — 취소 사유 목록

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
| `corpType` | `string` | ✅ | 보냄 |  |
| `itrfCd` | `string` | ✅ | 보냄 | 종합소득세(10), 양도소득세(22), 법인세(31) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CancelReasonsOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  reasons: { // CancelReasons
    id: string;
    sequence: number;
    title: string;
    content: string;
    reason: string;
    label: string;
    active: boolean;
  }[];
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `cancelReasonsV2Query` (`graphql/mutation/tax-refund/cancel.ts`)
- 쓰는 파일 (1): `components/tax-refund/cancel/CancelReasonContent.tsx`

---

<a id="08-08"></a>

### 08-08 `applyCancel` — 신청 취소

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
| `applyInput` | `ApplyCancelInput` | ✅ | 보냄 |  |
| `applyInput.refundId` | `string` | ✅ | 보냄 |  |
| `applyInput.reasonId` | `string` | ✅ | 보냄 |  |
| `applyInput.content` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

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
- 연산: `cancelApplyMutation` (`graphql/mutation/tax-refund/cancel.ts`)
- 쓰는 파일 (1): `components/tax-refund/cancel/CancelReasonContent.tsx`

---

<a id="08-09"></a>

### 08-09 `tritxApplyCancel` — 양도세 신청 취소

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
| `applyInput` | `ApplyCancelInput` | ✅ | 보냄 |  |
| `applyInput.refundId` | `string` | ✅ | 보냄 |  |
| `applyInput.reasonId` | `string` | ✅ | 보냄 |  |
| `applyInput.content` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

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
- 연산: `cancelTritxApplyCancelMutation` (`graphql/mutation/tax-refund/cancel.ts`)
- 쓰는 파일 (1): `components/tax-refund/cancel/CancelReasonContent.tsx`

---

<a id="08-10"></a>

### 08-10 `revokeCancel` — 취소 철회

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
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_ETC` `ERR_SURVEY_COMPLETED`

**프론트**
- 연산: `revokeCancelMutation` (`graphql/mutation/tax-refund/revoke-cancel.ts`)
- 쓰는 파일 (2): `components/tax-refund/apply/result/ApplyResultReceiveCancelContent.tsx`, `components/tax-refund/home/StatusManualSection.tsx`

---

<a id="08-11"></a>

### 08-11 `tritxRevokeCancel` — 양도세 취소 철회

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
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_ETC` `ERR_SURVEY_COMPLETED`

**프론트**
- 연산: `tritxRevokeCancelMutation` (`graphql/mutation/tax-refund/tritx-revoke-cancel.ts`)
- 쓰는 파일 (2): `components/tax-refund/apply/result/TritxApplyRefundResultContent.tsx`, `components/tax-refund/home/StatusManualSection.tsx`

---

<a id="08-12"></a>

### 08-12 `getApplyRefundCertificate` — 신청 확인서 조회

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
| `snapshotCode` | `string` | ✅ | 보냄 | snapshotCode |
| `type` | `string` | ✅ | 보냄 | lookup: 조회 ,apply: 신청) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetApplyCertificationOutput`)

```ts
{
  result: boolean;
  snapshotData: string | null;
  message: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `snapshotGetQuery` (`graphql/query/tax-refund/snapshot.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/use-snapshot-data.ts`

---

<a id="08-13"></a>

### 08-13 `createApplyRefundCertificate` — 신청 확인서 생성

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
| `snapshotData` | `string` | ✅ | 보냄 | snapshotData (json string) |
| `type` | `string` | ✅ | 보냄 | lookup: 조회 ,apply: 신청) |
| `refundId` | `string` | ✅ | 보냄 | 환급ID |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CreateApplyCertificationOutput`)

```ts
{
  result: boolean;
  message: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `snapshotSaveMutation` (`graphql/query/tax-refund/snapshot.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/use-snapshot-data.ts`

---

<a id="08-14"></a>

### 08-14 `getDeligationInfoOfUser` — 위임 정보 조회

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
| `refundId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeligationUserOutput`)

```ts
{
  result: boolean;
  name: string | null;
  address: string | null;
  birthDate: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `bznavRefundGetDeligationInfoOfUserQuery` (`graphql/query/tax-refund/bznav-refund.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)

---

<a id="08-15"></a>

### 08-15 `saveApplyRefundDelegationFiles` — 위임장·서명 저장

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
| `signedAt` | `string` | ✅ | 보냄 | 서명 일시 (ISO 8601 포맷으로 입력, 예: 2026-03-27T14:00:33.123Z) |
| `autographImage` | `string` | ✅ | 보냄 | 자필 서명 이미지 base64 인코딩 |
| `delegationDocumentFile` | `string` | ✅ | 보냄 | 위임장 PDF base64 인코딩 |
| `refundId` | `string` | ✅ | 보냄 | 환급ID |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SaveApplyDelegationOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
  autographImageKey: string | null;
  delegationFileKey: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `saveApplyRefundDelegationFilesMutation` (`graphql/mutation/tax-refund/save-apply-refund-delegation-files.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)
