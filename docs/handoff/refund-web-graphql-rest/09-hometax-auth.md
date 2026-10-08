# 09. 홈택스 인증

> [README](./README.md) · API 7개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [09-01](#09-01) | `hometaxSimpleAuth` | 변경 | 간편인증 요청(사용자가 [확인]을 누르는 방식) | | ☐ | ☐ |
| [09-02](#09-02) | `hometaxSimpleAuthPolling` | 변경 | 간편인증 요청(자동 전환 방식) | | ☐ | ☐ |
| [09-03](#09-03) | `hometaxSimpleAuthStatus` | 조회 | 간편인증 진행 상태 확인(폴링) | | ☐ | ☐ |
| [09-04](#09-04) | `hometaxSimpleAuthConfirm` | 변경 | 간편인증 승인 확인 → 간편인증 토큰 | | ☐ | ☐ |
| [09-05](#09-05) | `hometaxLogin` | 변경 | 홈택스 로그인 → 조회 토큰(refundToken) | | ☐ | ☐ |
| [09-06](#09-06) | `checkHometaxAccount` | 변경 | 홈택스 계정 확인 → 조회 토큰(refundToken) · 조회 화면용 | | ☐ | ☐ |
| [09-07](#09-07) | `sendCommonCertPcLink` | 변경 | 공동인증서 PC 링크 발송 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `CertType`: `Kakao` · `Naver`
- `CorpTypeEnum`: `INDIS` · `CORPS`
- `HometaxSimpleAuthStatus`: `PENDING` · `COMPLETED` · `FAILED` · `EXPIRED`
- `LoginType`: `HometaxId` · `Kakao` · `Naver` · `CommonCert` · `PartnerCert`
- `ErrorType`(에러 코드) 은 [README 5-3](./README.md#5-3-에러-코드)

## 프론트 작업 파일 (20) — `apps/refund-web/` 기준

- `components/hometax-auth/id-auth/HometaxIdAuthContent.tsx`
- `components/hometax-auth/joint-certificate/JointCertificateSelectContent.tsx`
- `components/hometax-auth/simple-auth/confirm/SimpleAuthAutoConfirmContainer.tsx`
- `components/hometax-auth/simple-auth/confirm/SimpleAuthConfirmContainer.tsx`
- `components/hometax-auth/simple-auth/input/SimpleAuthInputContainer.tsx`
- `graphql/mutation/simple-auth/request-simple-auth-token.ts`
- `graphql/mutation/simple-auth/simple-auth.ts`
- `graphql/mutation/tax-refund/check-hometax-account.ts`
- `graphql/mutation/tax-refund/hometax-login.ts`
- `graphql/mutation/tax-refund/hometax-simple-auth-confirm.ts`
- `graphql/mutation/tax-refund/hometax-simple-auth.ts`
- `graphql/mutation/tax-refund/send-common-cert-pc-link.ts`
- `graphql/query/simple-auth/simple-auth-status.ts`
- `lib/constants/hometax-auth.tsx`
- `lib/hooks/hometax-auth/api/use-check-hometax-account.ts`
- `lib/hooks/hometax-auth/api/use-hometax-auth.ts`
- `lib/hooks/hometax-auth/api/use-send-common-cert-pc-link.ts`
- `lib/hooks/hometax-auth/use-joint-certificate-handoff-dialog.ts`
- `lib/hooks/hometax-auth/use-simple-auth-status-polling.ts`
- `lib/types/auth.ts`

## API 상세

---

<a id="09-01"></a>

### 09-01 `hometaxSimpleAuth` — 간편인증 요청(사용자가 [확인]을 누르는 방식)

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
| `name` | `string` | ✅ | 보냄 |  |
| `phone` | `string` | ✅ | 보냄 |  |
| `birthday` | `string` | ✅ | 보냄 |  |
| `certType` | `CertType` | ✅ | 보냄 |  |
| `errorCode` | `ErrorType | null` |  | 안 보냄 |  |
| `errorMessage` | `string | null` |  | 안 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxSimpleAuthOutput`)

```ts
{
  result: boolean;
  reqTxId: string | null;
  token: string | null;
  cxId: string | null;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_EXIST_FINISH_REFUND` `ERR_HOMETAX_NO_USER` `ERR_HOMETAX_SESSION` `ERR_HOMETAX_SIMPLE_AUTH` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `requestSimpleAuthTokenMutation` (`graphql/mutation/simple-auth/request-simple-auth-token.ts`), `simpleAuthRequestTokenMutation` (`graphql/mutation/simple-auth/simple-auth.ts`), `hometaxSimpleAuthMutation` (`graphql/mutation/tax-refund/hometax-simple-auth.ts`)
- 쓰는 파일 (4): `components/hometax-auth/simple-auth/confirm/SimpleAuthAutoConfirmContainer.tsx`, `components/hometax-auth/simple-auth/confirm/SimpleAuthConfirmContainer.tsx`, `components/hometax-auth/simple-auth/input/SimpleAuthInputContainer.tsx`, `lib/hooks/hometax-auth/api/use-hometax-auth.ts`

---

<a id="09-02"></a>

### 09-02 `hometaxSimpleAuthPolling` — 간편인증 요청(자동 전환 방식)

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
| `name` | `string` | ✅ | 보냄 |  |
| `phone` | `string` | ✅ | 보냄 |  |
| `birthday` | `string` | ✅ | 보냄 |  |
| `certType` | `CertType` | ✅ | 보냄 |  |
| `errorCode` | `ErrorType | null` |  | 안 보냄 |  |
| `errorMessage` | `string | null` |  | 안 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxSimpleAuthOutput`)

```ts
{
  result: boolean;
  reqTxId: string | null;
  requestedAt: string | null;
  token: string | null;
  cxId: string | null;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_EXIST_FINISH_REFUND` `ERR_HOMETAX_NO_USER` `ERR_HOMETAX_SESSION` `ERR_HOMETAX_SIMPLE_AUTH` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `simpleAuthPollingRequestTokenMutation` (`graphql/mutation/simple-auth/simple-auth.ts`)
- 쓰는 파일 (3): `components/hometax-auth/simple-auth/confirm/SimpleAuthAutoConfirmContainer.tsx`, `components/hometax-auth/simple-auth/input/SimpleAuthInputContainer.tsx`, `lib/hooks/hometax-auth/api/use-hometax-auth.ts`

---

<a id="09-03"></a>

### 09-03 `hometaxSimpleAuthStatus` — 간편인증 진행 상태 확인(폴링)

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 폴링 — 3초마다(브라우저로 돌아오면 즉시 한 번), PENDING 이 아닐 때까지. 네트워크 실패 5회 연속이면 중단 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `reqTxId` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxSimpleAuthStatusOutput`)

```ts
{
  result: boolean;
  status: HometaxSimpleAuthStatus;
  token: string | null;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_EXIST_FINISH_REFUND` `ERR_HOMETAX_NO_USER` `ERR_HOMETAX_SESSION` `ERR_HOMETAX_SIMPLE_AUTH` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `simpleAuthStatusQuery` (`graphql/query/simple-auth/simple-auth-status.ts`)
- 쓰는 파일 (2): `components/hometax-auth/simple-auth/confirm/SimpleAuthAutoConfirmContainer.tsx`, `lib/hooks/hometax-auth/use-simple-auth-status-polling.ts`

---

<a id="09-04"></a>

### 09-04 `hometaxSimpleAuthConfirm` — 간편인증 승인 확인 → 간편인증 토큰

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
| `name` | `string` | ✅ | 보냄 |  |
| `phone` | `string` | ✅ | 보냄 |  |
| `birthday` | `string` | ✅ | 보냄 |  |
| `certType` | `CertType` | ✅ | 보냄 |  |
| `reqTxId` | `string` | ✅ | 보냄 |  |
| `token` | `string` | ✅ | 보냄 |  |
| `cxId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxSimpleAuthConfirmOutput`)

```ts
{
  result: boolean;
  token: string | null;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_EXIST_FINISH_REFUND` `ERR_HOMETAX_NO_USER` `ERR_HOMETAX_SESSION` `ERR_HOMETAX_SIMPLE_AUTH` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `simpleAuthConfirmRequestTokenMutation` (`graphql/mutation/simple-auth/simple-auth.ts`), `hometaxSimpleAuthConfirmMutation` (`graphql/mutation/tax-refund/hometax-simple-auth-confirm.ts`)
- 쓰는 파일 (2): `components/hometax-auth/simple-auth/confirm/SimpleAuthConfirmContainer.tsx`, `lib/hooks/hometax-auth/api/use-hometax-auth.ts`

---

<a id="09-05"></a>

### 09-05 `hometaxLogin` — 홈택스 로그인 → 조회 토큰(refundToken)

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
| `corpType` | `CorpTypeEnum` | ✅ | 보냄 |  |
| `loginType` | `LoginType` | ✅ | 보냄 |  |
| `certificate` | `Certificate | null` |  | 보냄 |  |
| `certificate.signCert` | `string` | ✅ | 보냄 |  |
| `certificate.signPri` | `string` | ✅ | 보냄 |  |
| `certificate.signPw` | `string` | ✅ | 보냄 |  |
| `hometaxAccount` | `HometaxAccount | null` |  | 보냄 |  |
| `hometaxAccount.id` | `string` | ✅ | 보냄 |  |
| `hometaxAccount.password` | `string` | ✅ | 보냄 |  |
| `hometaxAccount.resno` | `string | null` |  | 보냄 |  |
| `simpleAuth` | `SimpleAuth | null` |  | 보냄 |  |
| `simpleAuth.token` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxLoginOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  refundToken: string | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_EXIST_FINISH_REFUND` `ERR_HOMETAX_NO_USER` `ERR_HOMETAX_SESSION` `ERR_HOMETAX_SIMPLE_AUTH` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `simpleAuthRequestRefundTokenMutation` (`graphql/mutation/simple-auth/simple-auth.ts`), `hometaxLoginMutation` (`graphql/mutation/tax-refund/hometax-login.ts`)
- 쓰는 파일 (4): `components/hometax-auth/joint-certificate/JointCertificateSelectContent.tsx`, `components/hometax-auth/simple-auth/confirm/SimpleAuthAutoConfirmContainer.tsx`, `components/hometax-auth/simple-auth/confirm/SimpleAuthConfirmContainer.tsx`, `lib/hooks/hometax-auth/api/use-hometax-auth.ts`

---

<a id="09-06"></a>

### 09-06 `checkHometaxAccount` — 홈택스 계정 확인 → 조회 토큰(refundToken) · 조회 화면용

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
| `corpType` | `CorpTypeEnum` | ✅ | 보냄 |  |
| `loginType` | `LoginType` | ✅ | 보냄 |  |
| `certificate` | `Certificate | null` |  | 보냄 |  |
| `certificate.signCert` | `string` | ✅ | 보냄 |  |
| `certificate.signPri` | `string` | ✅ | 보냄 |  |
| `certificate.signPw` | `string` | ✅ | 보냄 |  |
| `hometaxAccount` | `HometaxAccount | null` |  | 보냄 |  |
| `hometaxAccount.id` | `string` | ✅ | 보냄 |  |
| `hometaxAccount.password` | `string` | ✅ | 보냄 |  |
| `hometaxAccount.resno` | `string | null` |  | 보냄 |  |
| `simpleAuth` | `SimpleAuth | null` |  | 보냄 |  |
| `simpleAuth.token` | `string` | ✅ | 보냄 |  |
| `tin` | `string | null` |  | 보냄 |  |
| `hometaxCookies` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckHometaxAccountOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  refundToken: string | null;
  email: string | null;
  lastLoginType: string | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_EXIST_FINISH_REFUND` `ERR_EXIST_SEARCH_HISTORY` `ERR_HOMETAX_EXPIRE_CERT` `ERR_HOMETAX_NO_CORPS_ID` `ERR_HOMETAX_NO_JUMIN_ID` `ERR_HOMETAX_NO_REGIST_CERT` `ERR_HOMETAX_NO_USER` `ERR_HOMETAX_SESSION` `ERR_NO_EQUAL_TIN`

**프론트**
- 연산: `simpleAuthRequestRefundTokenForLookupMutation` (`graphql/mutation/simple-auth/simple-auth.ts`), `checkHometaxAccountMutation` (`graphql/mutation/tax-refund/check-hometax-account.ts`)
- 쓰는 파일 (6): `components/hometax-auth/id-auth/HometaxIdAuthContent.tsx`, `components/hometax-auth/joint-certificate/JointCertificateSelectContent.tsx`, `lib/constants/hometax-auth.tsx`, `lib/hooks/hometax-auth/api/use-check-hometax-account.ts`, `lib/hooks/hometax-auth/api/use-hometax-auth.ts`, `lib/types/auth.ts`

---

<a id="09-07"></a>

### 09-07 `sendCommonCertPcLink` — 공동인증서 PC 링크 발송

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
| `handoffId` | `string` | ✅ | 보냄 | 인계 건 식별자. FE 가 [카카오톡으로 링크받기] 클릭마다 발급 — 딥링크 hid 로 실린다 |

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
- 연산: `sendCommonCertPcLinkMutation` (`graphql/mutation/tax-refund/send-common-cert-pc-link.ts`)
- 쓰는 파일 (2): `lib/hooks/hometax-auth/api/use-send-common-cert-pc-link.ts`, `lib/hooks/hometax-auth/use-joint-certificate-handoff-dialog.ts`
