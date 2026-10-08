# 04. 콘텐츠 페이지 (서버 렌더링)

> [README](./README.md) · API 2개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [04-01](#04-01) | `getRefundContentPage` | 조회 | 콘텐츠(랜딩) 페이지 조회 — 서버에서 로그인 없이 | | ☐ | ☐ |
| [04-02](#04-02) | `getRefundContentPageSitemap` | 조회 | 사이트맵용 콘텐츠 페이지 목록 — 서버에서 로그인 없이 | | ☐ | ☐ |

## 프론트 작업 파일 (1) — `apps/refund-web/` 기준

- `lib/content-page/api.ts`

## API 상세

---

<a id="04-01"></a>

### 04-01 `getRefundContentPage` — 콘텐츠(랜딩) 페이지 조회 — 서버에서 로그인 없이

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 서버(getServerSideProps)에서 — 로그인 헤더 없이 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `path` | `string | null` |  | 보냄 | 유저 접근 URL 경로. `/event/{slug}`, `/landing/{slug}`, `/home/{slug}`. 메인은 안 보내거나 `""`, `"/"` 모두 허용. slug 는 `a/b/c` 형태 다중 세그먼트 허용. |
| `labId` | `string | null` |  | 보냄 | 기존에 배정된 variant, 없으면 서버 신규 배정. |
| `isPreview` | `boolean | null` |  | 보냄 | true 면 scheduled 상태도 응답 (어드민 미리보기용). default false. |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundContentPageOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  base: { // RefundContentPageBase
    name: string;
    path: string;
    landingType: string;
    meta: { // RefundContentPageMeta
      title: string;
      description: string;
      ogTitle: string;
      ogDescription: string;
      ogImage: string;
    };
    showHelpCenter: boolean;
    showFaq: boolean;
  } | null;
  variant: { // RefundContentPageVariant
    labId: string;
    labType: string | null;
    assigned: boolean;
    cta: { // RefundContentPageVariantCta
      text: string;
      buttonColor: string;
      textColor: string;
      link: string;
    };
    images: { // RefundContentPageVariantImage
      url: string;
      backgroundColor: string;
      seoText: string;
      altText: string;
      width: number | null;
      height: number | null;
    }[];
  } | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `GetRefundContentPage` (`lib/content-page/api.ts`)
- 쓰는 파일 (1): `lib/content-page/api.ts`

---

<a id="04-02"></a>

### 04-02 `getRefundContentPageSitemap` — 사이트맵용 콘텐츠 페이지 목록 — 서버에서 로그인 없이

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 서버(getServerSideProps)에서 — 로그인 헤더 없이 |
| 다른 API 와 한 요청으로 묶임 | 없음 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RefundContentPageSitemapOutput`)

```ts
{
  result: boolean;
  errors: { // Errors
    code: ErrorType;
    message: string | null;
  } | null;
  contentPages: { // RefundContentPageSitemapItem
    path: string;
    updatedAt: string;
  }[] | null;
}
```

**프론트가 분기하는 에러 코드** : 따로 분기 없음 (`result`·메시지로만 처리)

**프론트**
- 연산: `GetRefundContentPageSitemap` (`lib/content-page/api.ts`)
- 쓰는 파일 (1): `lib/content-page/api.ts`
