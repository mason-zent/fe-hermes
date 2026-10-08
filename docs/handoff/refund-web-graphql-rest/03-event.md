# 03. 이벤트·프로모션

> [README](./README.md) · API 3개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [03-01](#03-01) | `getRefundUserPromotion` | 조회 | 내 프로모션 조회 | | ☐ | ☐ |
| [03-02](#03-02) | `getRefundUserPromotionHistory` | 조회 | 프로모션(초대) 이력 조회 | | ☐ | ☐ |
| [03-03](#03-03) | `createRefundPromotionTermsLog` | 변경 | 프로모션 약관 동의 기록 | | ☐ | ☐ |

## 프론트 작업 파일 (4) — `apps/refund-web/` 기준

- `components/event/share/InviteEventActionButtons.tsx`
- `components/event/share/InviteOverview.tsx`
- `graphql/mutation/event/share.ts`
- `pages/home/event/share/index.tsx`

## API 상세

---

<a id="03-01"></a>

### 03-01 `getRefundUserPromotion` — 내 프로모션 조회

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
| `promotionCode` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundUserPromotionOutput`)

```ts
{
  code: string | null;
  isTerm: boolean | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `shareUserPromotionQuery` (`graphql/mutation/event/share.ts`)
- 쓰는 파일 (1): `pages/home/event/share/index.tsx`

---

<a id="03-02"></a>

### 03-02 `getRefundUserPromotionHistory` — 프로모션(초대) 이력 조회

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
| `promotionCode` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundUserPromotionHistoryOutput`)

```ts
{
  count: number | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `InviteOverviewUserPromotionHistoryQuery` (`components/event/share/InviteOverview.tsx`)
- 쓰는 파일 (1): `components/event/share/InviteOverview.tsx`

---

<a id="03-03"></a>

### 03-03 `createRefundPromotionTermsLog` — 프로모션 약관 동의 기록

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
| `termsKey` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundPromotionTermsLogOutput`)

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
- 연산: `shareEventActionButtonsPrivacyMutation` (`graphql/mutation/event/share.ts`)
- 쓰는 파일 (1): `components/event/share/InviteEventActionButtons.tsx`
