# 06. 부가세 판매처(배달앱·온라인몰) 연동

> [README](./README.md) · API 6개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [06-01](#06-01) | `deliveryAccountStatus` | 조회 | 배달앱 계정 연동 현황 | | ☐ | ☐ |
| [06-02](#06-02) | `onlineMallAccountStatus` | 조회 | 온라인몰 계정 연동 현황 | | ☐ | ☐ |
| [06-03](#06-03) | `linkDeliveryAccount` | 변경 | 온라인 배달앱 계정연동 | | ☐ | ☐ |
| [06-04](#06-04) | `linkOnlineMallAccount` | 변경 | 온라인몰 계정연동 | | ☐ | ☐ |
| [06-05](#06-05) | `inputAuthNumber` | 변경 | 온라인몰 스크래핑 유저 입력 처리 | | ☐ | ☐ |
| [06-06](#06-06) | `deleteLinkStatus` | 변경 | 온라인몰 계정연동 전 연동 상태 정보 삭제 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `DeliveryAppCode`: `Baemin` · `CoupangEats` · `Yogiyo` · `Ddangyo` · `SmartStore` · `Coupang`
- `OnlineAccountStatusEnum`: `None` · `Complete` · `Fail` · `Pending` · `Checking`
- `OperationType`: `SMS` · `EMAIL` · `INVALID_SMS` · `INVALID_EMAIL` · `APP_CONFIRM` · `CAPTCHA` · `RESEND_SMS` · `RESEND_EMAIL` · `TERMINATE`

## 프론트 작업 파일 (22) — `apps/care-web/` 기준

- `app/vat/components/ConnectDeliveryListItem.tsx`
- `app/vat/components/connect-account/ConnectionAccountBottomButton.tsx`
- `app/vat/components/connect-complete/ConnectCompleteView.tsx`
- `app/vat/graphql/deleteLinkStatus.ts`
- `app/vat/graphql/deliveryAccountStatus.ts`
- `app/vat/graphql/inputAuthNumber.ts`
- `app/vat/graphql/linkDeliveryAccount.ts`
- `app/vat/graphql/linkOnlineMallAccount.ts`
- `app/vat/graphql/onlineMallAccountStatus.ts`
- `app/vat/hooks/useGetPreDeliveryPlatformInfo.ts`
- `app/vat/hooks/useLinkDeliveryAccount.ts`
- `app/vat/hooks/useLinkOnlineMallAccount.ts`
- `app/vat/service-connect/(connect)/connect-account/hooks/useSendSocketMessage.ts`
- `app/vat/service-connect/(connect)/hooks/useConnectAccount.ts`
- `app/vat/service-connect/(main)/components/ConnectionOrgCard.tsx`
- `app/vat/service-connect/(main)/hooks/useDeliveryAccountStatusQuery.ts`
- `app/vat/service-connect/(main)/hooks/useOnlineMallAccountStatus.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/delivery/components/DeliveryMallConnectList.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/delivery/hooks/useGetCurrentDeliveryMallList.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/online/components/OnlineMallConnectList.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/online/hooks/useGetCurrentOnlineMallList.ts`
- `app/vat/submit-material/(submitMaterial)/(connection)/constants/platformDisconnectGuide.ts`

## API 상세

---

<a id="06-01"></a>

### 06-01 `deliveryAccountStatus` — 배달앱 계정 연동 현황

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
| `bmanTin` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeliveryAccountStatusOutput` · union 2종)

```ts
{
  __typename: 'DeliveryAccountStatus';
  deliveryAccountInfo: { // DeliveryAccountInfo
    bizNo: string;
    bmanTin: string;
    bizName: string;
    deliveryAppCode: DeliveryAppCode;
    accountStatus: OnlineAccountStatusEnum;
    mallId: string | null;
  }[];
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
- 연산: `deliveryAccountStatusQuery` (`app/vat/graphql/deliveryAccountStatus.ts`)
- 쓰는 파일 (8): `app/vat/components/connect-complete/ConnectCompleteView.tsx`, `app/vat/hooks/useGetPreDeliveryPlatformInfo.ts`, `app/vat/service-connect/(connect)/hooks/useConnectAccount.ts`, `app/vat/service-connect/(main)/components/ConnectionOrgCard.tsx`, `app/vat/service-connect/(main)/hooks/useDeliveryAccountStatusQuery.ts`, `app/vat/submit-material/(submitMaterial)/(category)/delivery/components/DeliveryMallConnectList.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/delivery/hooks/useGetCurrentDeliveryMallList.ts`, `app/vat/submit-material/(submitMaterial)/(connection)/constants/platformDisconnectGuide.ts`

---

<a id="06-02"></a>

### 06-02 `onlineMallAccountStatus` — 온라인몰 계정 연동 현황

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
| `bmanTin` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeliveryAccountStatusOutput` · union 2종)

```ts
{
  __typename: 'DeliveryAccountStatus';
  deliveryAccountInfo: { // DeliveryAccountInfo
    bizNo: string;
    bmanTin: string;
    bizName: string;
    deliveryAppCode: DeliveryAppCode;
    accountStatus: OnlineAccountStatusEnum;
    mallId: string | null;
  }[];
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
- 연산: `onlineMallAccountStatusQuery` (`app/vat/graphql/onlineMallAccountStatus.ts`)
- 쓰는 파일 (6): `app/vat/components/ConnectDeliveryListItem.tsx`, `app/vat/hooks/useGetPreDeliveryPlatformInfo.ts`, `app/vat/service-connect/(connect)/hooks/useConnectAccount.ts`, `app/vat/service-connect/(main)/hooks/useOnlineMallAccountStatus.ts`, `app/vat/submit-material/(submitMaterial)/(category)/online/components/OnlineMallConnectList.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/online/hooks/useGetCurrentOnlineMallList.ts`

---

<a id="06-03"></a>

### 06-03 `linkDeliveryAccount` — 온라인 배달앱 계정연동

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
| `deliveryAppCode` | `DeliveryAppCode` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `id` | `string` | ✅ | 보냄 |  |
| `password` | `string` | ✅ | 보냄 |  |
| `vatScraping` | `boolean` | ✅ | 보냄 | 선오픈-false, 신고기간-true |
| `isNaverAccount` | `boolean \| null` |  | 안 보냄 | 스마트스토어 로그인시 네이버 계정 여부 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `LinkDeliveryAccountOutput` · union 5종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'LinkDeliveryAccountSucceed';
  message: string;
}
| {
  __typename: 'DeliveryAccountError';
  message: string;
}
| {
  __typename: 'DeliveryBizNoError';
  message: string;
}
| { __typename: 'NeedAgreementError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeliveryAccountError` `DeliveryBizNoError` `LinkDeliveryAccountSucceed` `NeedAgreementError`

**프론트**
- 연산: `linkDeliveryAccountMutation` (`app/vat/graphql/linkDeliveryAccount.ts`)
- 쓰는 파일 (3): `app/vat/components/connect-account/ConnectionAccountBottomButton.tsx`, `app/vat/hooks/useLinkDeliveryAccount.ts`, `app/vat/service-connect/(connect)/hooks/useConnectAccount.ts`

---

<a id="06-04"></a>

### 06-04 `linkOnlineMallAccount` — 온라인몰 계정연동

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
| `deliveryAppCode` | `DeliveryAppCode` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `id` | `string` | ✅ | 보냄 |  |
| `password` | `string` | ✅ | 보냄 |  |
| `vatScraping` | `boolean` | ✅ | 보냄 | 선오픈-false, 신고기간-true |
| `isNaverAccount` | `boolean \| null` |  | 보냄 | 스마트스토어 로그인시 네이버 계정 여부 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `LinkDeliveryAccountOutput` · union 5종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'LinkDeliveryAccountSucceed';
  message: string;
}
| {
  __typename: 'DeliveryAccountError';
  message: string;
}
| {
  __typename: 'DeliveryBizNoError';
  message: string;
}
| { __typename: 'NeedAgreementError' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `linkOnlineMallAccountMutation` (`app/vat/graphql/linkOnlineMallAccount.ts`)
- 쓰는 파일 (1): `app/vat/hooks/useLinkOnlineMallAccount.ts`

---

<a id="06-05"></a>

### 06-05 `inputAuthNumber` — 온라인몰 스크래핑 유저 입력 처리

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
| `deliveryAppCode` | `DeliveryAppCode` | ✅ | 보냄 |  |
| `id` | `string` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `operationType` | `OperationType` | ✅ | 보냄 |  |
| `authNumber` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `OnlineScrapingReceiverOutput` · union 2종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| { __typename: 'OnlineScrapingReceiverSucceed' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `inputAuthNumberMutation` (`app/vat/graphql/inputAuthNumber.ts`)
- 쓰는 파일 (1): `app/vat/service-connect/(connect)/connect-account/hooks/useSendSocketMessage.ts`

---

<a id="06-06"></a>

### 06-06 `deleteLinkStatus` — 온라인몰 계정연동 전 연동 상태 정보 삭제

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
| `deliveryAppCode` | `DeliveryAppCode` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `id` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteLinkStatusOutput` · union 3종)

```ts
{
  __typename: 'DeleteLinkStatusSucceed';
  message: string;
}
| {
  __typename: 'OnlineMallPendingError';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeleteLinkStatusSucceed` `OnlineMallPendingError`

**프론트**
- 연산: `deleteLinkStatusMutation` (`app/vat/graphql/deleteLinkStatus.ts`)
- 쓰는 파일 (2): `app/vat/hooks/useLinkOnlineMallAccount.ts`, `app/vat/service-connect/(connect)/hooks/useConnectAccount.ts`
