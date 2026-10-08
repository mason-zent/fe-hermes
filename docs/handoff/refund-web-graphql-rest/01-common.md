# 01. 공통·화면 설정

> [README](./README.md) · API 11개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [01-01](#01-01) | `getAdSlots` | 조회 | 광고 구좌(배너) 조회 | | ☐ | ☐ |
| [01-02](#01-02) | `landingModal` | 조회 | 랜딩 모달 조회 | | ☐ | ☐ |
| [01-03](#01-03) | `notice` | 조회 | 긴급 공지 조회 | | ☐ | ☐ |
| [01-04](#01-04) | `refundPartner` | 조회 | 제휴처(파트너) 정보 조회 | | ☐ | ☐ |
| [01-05](#01-05) | `hometaxBlockSettings` | 조회 | 홈택스 차단(대기열) 설정 조회 | | ☐ | ☐ |
| [01-06](#01-06) | `hometaxBlockNotificationStatus` | 조회 | 홈택스 차단 해제 알림 신청 여부 조회 | | ☐ | ☐ |
| [01-07](#01-07) | `requestHometaxBlockNotification` | 변경 | 홈택스 차단 해제 알림 신청 | | ☐ | ☐ |
| [01-08](#01-08) | `reserveHometaxMaintenanceExitAlimtalk` | 변경 | 홈택스 점검 종료 알림톡 예약 | | ☐ | ☐ |
| [01-09](#01-09) | `saveRefundActionLog` | 변경 | 사용자 행동 로그 저장 | | ☐ | ☐ |
| [01-10](#01-10) | `molocoConversionStatus` | 조회 | 몰로코 전환 이벤트 전송 여부 조회 | | ☐ | ☐ |
| [01-11](#01-11) | `markMolocoConversionSent` | 변경 | 몰로코 전환 이벤트 전송 기록 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `CreativeType`: `TEXT_IMAGE_BUTTON` · `TEXT_IMAGE` · `TEXT_BUTTON`
- `MolocoEventNameEnum`: `InquiryDone` · `RequestDone`
- `PlacementType`: `LOOKUP_RESULT` · `MY_PAGE_BOTTOM` · `HOME_BOTTOM_BENEFIT_1` · `HOME_BOTTOM_BENEFIT_2` · `HOME_BOTTOM_BENEFIT_3` · `HOME_BOTTOM_HELP` · `LOOKUP_RESULT_NO_BMAN_TRITX` · `APPLY_COMPLETE_TRITX_ONLY` · `SURVEY_COMPLETE` · `PERSONAL_DEDUCTION_AUTH_COMPLETE` · `PAYMENT_COMPLETE`
- `TaxCode`: `Refund` · `TritxRefund`
- `ErrorType`(에러 코드) 은 [README 5-3](./README.md#5-3-에러-코드)

## 프론트 작업 파일 (41) — `apps/refund-web/` 기준

- `components/event/share/InviteEventBenefit.tsx`
- `components/follow-up/personal-deduction/PersonalDeductionIntroContent.tsx`
- `components/hometax-auth/simple-auth/confirm/SimpleAuthConfirmContainer.tsx`
- `components/hometax-auth/simple-auth/input/SimpleAuthInputContainer.tsx`
- `components/landing/EventModal.tsx`
- `components/landing/LandingCtaButton.tsx`
- `components/layout/Notice.tsx`
- `components/tax-refund/apply/reenactment/ApplyResultReenactmentContent.tsx`
- `components/tax-refund/apply/result/ApplyResultContent.tsx`
- `components/tax-refund/common/drawers/AdSlotDrawer.tsx`
- `components/tax-refund/common/error/ErrorHometaxNotificationGuideContent.tsx`
- `components/tax-refund/home/HomeBottomBanners.tsx`
- `components/tax-refund/home/RefundHomeContent.tsx`
- `components/tax-refund/home/StatusManualSection.tsx`
- `components/tax-refund/lookup/queue/QueueContent.tsx`
- `components/tax-refund/lookup/request/LookupRefundRequestContent.tsx`
- `components/tax-refund/lookup/result/apply-possible/ApplyPossibleContent.tsx`
- `components/tax-refund/lookup/result/apply-possible/use-apply-possible-refund-data.ts`
- `components/tax-refund/trr/TrrEntryGuard.tsx`
- `graphql/mutation/tax-refund/mark-moloco-conversion-sent.ts`
- `graphql/mutation/tax-refund/request-hometax-block-notification.ts`
- `graphql/mutation/tax-refund/reserve-hometax-maintenance-exit-alimtalk.ts`
- `graphql/mutation/tax-refund/save-refund-action-log.ts`
- `graphql/query/common/ad-slot.ts`
- `graphql/query/common/hometax-block.ts`
- `graphql/query/lookup/result/apply-possible.ts`
- `graphql/query/partner/benefit.ts`
- `graphql/query/tax-refund/moloco-conversion-status.ts`
- `graphql/query/tax-refund/notice.ts`
- `lib/constants/ad-slots.ts`
- `lib/content-page/help-notices.ts`
- `lib/hooks/marketing/use-ad-slots.ts`
- `lib/hooks/marketing/use-event.ts`
- `lib/hooks/refund/api/use-reserve-hometax-maintenance-exit-alimtalk.ts`
- `lib/hooks/refund/api/use-save-refund-action-log.ts`
- `lib/hooks/refund/control/api/use-hometax-block.ts`
- `lib/hooks/refund/moloco/use-moloco-conversion.ts`
- `lib/stores/ads.ts`
- `lib/stores/hometax-block.ts`
- `pages/help/index.tsx`
- `pages/hometax-auth/simple-auth/input/index.tsx`

## API 상세

---

<a id="01-01"></a>

### 01-01 `getAdSlots` — 광고 구좌(배너) 조회

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
| `placementTypes` | `PlacementType[]` | ✅ | 보냄 | 배너 노출 위치 목록 |
| `platform` | `string | null` |  | 보냄 | 노출 제외 워킹플랫폼 |
| `target` | `string` | ✅ | 보냄 | 노출 대상 |
| `utm` | `UtmInput | null` |  | 보냄 | 노출 제외 utm |
| `utm.source` | `string | null` |  | 보냄 | 노출 제외 utm source |
| `utm.medium` | `string | null` |  | 보냄 | 노출 제외 utm medium |
| `utm.campaign` | `string | null` |  | 보냄 | 노출 제외 utm campaign |
| `utm.term` | `string | null` |  | 보냄 | 노출 제외 utm term |
| `utm.content` | `string | null` |  | 보냄 | 노출 제외 utm content |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `GetAdSlotsOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  adSlots: { // AdSlotGroup
    title: string | null;
    placementType: PlacementType | null;
    items: { // BaseAdSlotItem
      id: number;
      creativeType: CreativeType;
      displayCode: string;
      displayRatio: number;
      userEvent: string | null;
      displayTitle: string | null;
      description: string | null;
      imagePath: string;
      buttonText: string;
      linkUrl: string;
    }[] | null;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `adSlotGetAdSlotsQuery` (`graphql/query/common/ad-slot.ts`)
- 쓰는 파일 (5): `components/tax-refund/common/drawers/AdSlotDrawer.tsx`, `components/tax-refund/home/HomeBottomBanners.tsx`, `lib/constants/ad-slots.ts`, `lib/hooks/marketing/use-ad-slots.ts`, `lib/stores/ads.ts`

---

<a id="01-02"></a>

### 01-02 `landingModal` — 랜딩 모달 조회

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
| `utmSource` | `string` | ✅ | 보냄 |  |
| `utmCampaign` | `string | null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `LandingModalOutput`)

```ts
{
  id: string;
  name: string;
  manager: string | null;
  active: boolean;
  utmCampaign: string | null;
  utmSource: string | null;
  imagePath: string;
  backgroundColor: string;
  userEvent: unknown /* JSON */ | null;
  buttons: unknown /* JSON */ | null;
  startAt: string /* DateTime */;
  endAt: string /* DateTime */;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `benefitLandingModalQuery` (`graphql/query/partner/benefit.ts`)
- 쓰는 파일 (2): `components/landing/EventModal.tsx`, `lib/hooks/marketing/use-event.ts`

---

<a id="01-03"></a>

### 01-03 `notice` — 긴급 공지 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `NoticeOutput`)

```ts
{
  result: boolean;
  contents: string | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `noticeQuery` (`graphql/query/tax-refund/notice.ts`)
- 쓰는 파일 (8): `components/event/share/InviteEventBenefit.tsx`, `components/layout/Notice.tsx`, `components/tax-refund/apply/reenactment/ApplyResultReenactmentContent.tsx`, `components/tax-refund/apply/result/ApplyResultContent.tsx`, `components/tax-refund/common/error/ErrorHometaxNotificationGuideContent.tsx`, `components/tax-refund/lookup/queue/QueueContent.tsx`, `lib/content-page/help-notices.ts`, `pages/help/index.tsx`

---

<a id="01-04"></a>

### 01-04 `refundPartner` — 제휴처(파트너) 정보 조회

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
| `partnerId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundPartnerOutput`)

```ts
{
  partnerName: string;
  defaultFeeRate: string;
  feeRate: string;
  startAt: string /* DateTime */ | null;
  endAt: string /* DateTime */ | null;
  partnerId: string;
  discountRate: string;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_DUPLICATE_APPLY`

**프론트**
- 연산: `applyPossibleQuery` (`graphql/query/lookup/result/apply-possible.ts`), `benefitRefundPartnerQuery` (`graphql/query/partner/benefit.ts`)
- 쓰는 파일 (3): `components/landing/LandingCtaButton.tsx`, `components/tax-refund/lookup/result/apply-possible/ApplyPossibleContent.tsx`, `components/tax-refund/lookup/result/apply-possible/use-apply-possible-refund-data.ts`

---

<a id="01-05"></a>

### 01-05 `hometaxBlockSettings` — 홈택스 차단(대기열) 설정 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxBlockSettingsOutput`)

```ts
{
  bypassAuthEnabled: boolean;
  queueScreenEnabled: boolean;
  queueScreenStage: string;
  waitingCount: number | null;
  corpQueueScreenEnabled: boolean;
  corpWaitingCount: number | null;
}
```

**프론트가 분기하는 에러 코드** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ERR_ETC` `ERR_EXIST_FINISH_REFUND` `ERR_HOMETAX_ETC` `ERR_HOMETAX_IMPOSSIBLE` `ERR_HOMETAX_NO_BMAN` `ERR_HOMETAX_NO_USER` `ERR_HOMETAX_SESSION` `ERR_HOMETAX_SIMPLE_AUTH` `ERR_NO_EQUAL_TIN` `ERR_SURVEY_COMPLETED`

**프론트**
- 연산: `hometaxBlockSettingsQuery` (`graphql/query/common/hometax-block.ts`)
- 쓰는 파일 (10): `components/follow-up/personal-deduction/PersonalDeductionIntroContent.tsx`, `components/hometax-auth/simple-auth/confirm/SimpleAuthConfirmContainer.tsx`, `components/hometax-auth/simple-auth/input/SimpleAuthInputContainer.tsx`, `components/tax-refund/home/RefundHomeContent.tsx`, `components/tax-refund/home/StatusManualSection.tsx`, `components/tax-refund/lookup/request/LookupRefundRequestContent.tsx`, `components/tax-refund/trr/TrrEntryGuard.tsx`, `lib/hooks/refund/control/api/use-hometax-block.ts`, `lib/stores/hometax-block.ts`, `pages/hometax-auth/simple-auth/input/index.tsx`

---

<a id="01-06"></a>

### 01-06 `hometaxBlockNotificationStatus` — 홈택스 차단 해제 알림 신청 여부 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `businessType` | `string | null` |  | 보냄 | 사업자유형 (indis | corps) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `HometaxBlockNotificationStatusOutput`)

```ts
{
  requested: boolean;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `hometaxBlockNotificationStatusQuery` (`graphql/query/common/hometax-block.ts`)
- 쓰는 파일 (2): `components/tax-refund/lookup/queue/QueueContent.tsx`, `lib/hooks/refund/control/api/use-hometax-block.ts`

---

<a id="01-07"></a>

### 01-07 `requestHometaxBlockNotification` — 홈택스 차단 해제 알림 신청

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
| `refundId` | `string | null` |  | 보냄 | 환급 ID (미조회 고객은 null) |
| `businessType` | `string | null` |  | 보냄 | 사업자유형 (indis | corps) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RequestHometaxBlockNotificationOutput`)

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
- 연산: `requestHometaxBlockNotificationMutation` (`graphql/mutation/tax-refund/request-hometax-block-notification.ts`)
- 쓰는 파일 (2): `components/tax-refund/lookup/queue/QueueContent.tsx`, `lib/hooks/refund/control/api/use-hometax-block.ts`

---

<a id="01-08"></a>

### 01-08 `reserveHometaxMaintenanceExitAlimtalk` — 홈택스 점검 종료 알림톡 예약

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
| `refundId` | `string | null` |  | 보냄 | 환급 ID (조회 시작 전이면 null) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ReserveMaintenanceExitAlimtalkOutput`)

```ts
{
  result: boolean;
  reserved: boolean;
  errors: { // Errors
    code: ErrorType;
  } | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `reserveHometaxMaintenanceExitAlimtalkMutation` (`graphql/mutation/tax-refund/reserve-hometax-maintenance-exit-alimtalk.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/api/use-reserve-hometax-maintenance-exit-alimtalk.ts`

---

<a id="01-09"></a>

### 01-09 `saveRefundActionLog` — 사용자 행동 로그 저장

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
| `refundId` | `string | null` |  | 보냄 |  |
| `actionCode` | `string | null` |  | 보냄 |  |
| `actionStatus` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundUserActionLogOutput`)

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
- 연산: `saveRefundActionLogMutation` (`graphql/mutation/tax-refund/save-refund-action-log.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/api/use-save-refund-action-log.ts`

---

<a id="01-10"></a>

### 01-10 `molocoConversionStatus` — 몰로코 전환 이벤트 전송 여부 조회

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
| `refundId` | `string` | ✅ | 보냄 | 환급 ID |
| `taxCode` | `TaxCode | null` |  | 안 보냄 | 세목(Refund:종소세, TritxRefund:양도세). 미지정 시 전체 |
| `eventName` | `MolocoEventNameEnum | null` |  | 안 보냄 | 이벤트명. 미지정 시 전체 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `MolocoConversionStatusOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  statuses: { // MolocoConversionStatus
    taxCode: TaxCode;
    eventName: MolocoEventNameEnum;
    sent: boolean;
    transactionId: string;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `molocoConversionStatusQuery` (`graphql/query/tax-refund/moloco-conversion-status.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/moloco/use-moloco-conversion.ts`

---

<a id="01-11"></a>

### 01-11 `markMolocoConversionSent` — 몰로코 전환 이벤트 전송 기록

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
| `refundId` | `string` | ✅ | 보냄 | 환급 ID |
| `taxCode` | `TaxCode` | ✅ | 보냄 | 세목(Refund:종소세, TritxRefund:양도세) |
| `eventName` | `MolocoEventNameEnum` | ✅ | 보냄 | 발송한 이벤트명 |
| `transactionId` | `string | null` |  | 보냄 | FE가 실제 전송한 거래 ID (검증용) |
| `value` | `number | null` |  | 보냄 | FE가 실제 전송한 금액 (기록·정합성 확인용) |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CoreOutput`)

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
- 연산: `markMolocoConversionSentMutation` (`graphql/mutation/tax-refund/mark-moloco-conversion-sent.ts`)
- 쓰는 파일 (1): `lib/hooks/refund/moloco/use-moloco-conversion.ts`
