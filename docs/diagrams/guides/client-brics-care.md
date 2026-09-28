# client-brics-care 다이어그램 가이드

공통 원칙·심층 표준·검증은 [`../AUTHORING.md`](../AUTHORING.md). 이 문서는 이 레포에만 해당하는 것만 적는다. 작성 기준 `origin/prd` `8ed10df` (2026-08-20).

⚠️ 비즈넵 **사용자향** 케어 웹(`bznav-web apps/care-web`)과 다른 레포다. 그쪽 번들(`docs/diagrams/care-web/`)의 탭·용어를 가져오지 않는다.

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/client-brics-care` (BRICS 케어 운영 콘솔) |
| 앱 루트 | 레포 루트. 라우트는 `app/` (`hermes.config.json` `appDir: app`) |
| 기준 ref | `origin/prd` |
| 라우터 | Next 15.5 App Router(webpack). `middleware.ts` 없음. 라우트 그룹·병렬 라우트 없음. `next.config.mjs` rewrite 1개(`/pro/:slug*` → `/pro`) |
| 화면 수 | **15** |
| 포트 | 13001 (`package.json` `dev: next dev -p 13001`) |

```bash
git -C repos/client-brics-care ls-tree -r --name-only origin/prd app | grep -E '/page\.(tsx|ts|jsx|js)$' | wc -l   # 15
```

15화면 내역: `subscription` 1 · `bmans` 1 · `txprs/[txprInfrId]/payments` 1 · `marketing-page` 3(목록·create·edit/[id]) · `promotion-page` 3(목록·create·edit/[promotionId]) · `qa` 2(목록·[userId]) · `pro` 1 · 시스템 3(`app/page.tsx`, `logout`, `unauthorized`).

## 2. 지금 있는 장

| 파일 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|
| `client-brics-care.architecture.json` | `8ed10df` | 구조 — subscription·bmans·promotion·qa·pro 화면 → schemas·hooks·zustand → Orval `@/generated` → fetcher → care 서버, gen:env |
| `client-brics-care.sequence.json` | 없음(`meta.repository` 없음) | 요청 흐름 — 대표 화면 `app/bmans`(서버 페이지네이션 · 필터 스토어 · 재조회) |
| `client-brics-care.lifecycle.json` | 없음 | 화면 상태(`app/promotion-page`). 2026-09-28 목록에서 뺐다 |
| 화면 맵(domains) | **없음** | — |
| 심층 | **없음** | — |

## 3. 심층 탭 구성 (제안)

15화면이라 **화면 전수 1장 + 깊게 그릴 흐름 3장**으로 간다. 이 콘솔에서 복잡한 것은 화면 수가 아니라 결제 상세의 모달 8개와 프로모션 폼 섹션이다.

| 탭 | 파일(제안) | 범위 | 화면 |
|---|---|---|---|
| 0 | `care-console-detail.architecture.json` | 상세 — 4절 뼈대. 전수 대조 제외 | — |
| 1 | `screens.architecture.json` | `app/**/page.tsx` 전부. **가드 유무를 화면마다 `tag` 로**(가드 7 · 없음 5 · 진입/시스템 3) | **15** |
| 2 | `payment.architecture.json` | 결제·비즈맨: `app/bmans/**` + `app/txprs/**` 의 컴포넌트·스토어 | 0 (탭 1 에서 셈) |
| 3 | `subscription.architecture.json` | 구독: `app/subscription/_components/**` | 0 |
| 4 | `promotion-marketing.architecture.json` | 폼 두 벌: `app/promotion-page/**` · `app/marketing-page/**` 의 컴포넌트·스키마·스토어 | 0 |

탭 2~4 에 page 파일을 `sources` 로 달면 탭 1 과 중복으로 센다. page 를 가리켜야 하면 `DRILL` 출발 노드로 만든다. qa(2화면)·pro(1화면)는 흐름이 짧아 탭 1 의 노드 + `cards` 로 충분하다.

**탭 2 결제 — 근거 파일**
- 목록 `app/bmans/_components/PaymentsContainer.tsx`: `useFindBmans` 를 **세 번** 부른다(74·86·96행 — 목록 · 요금 입력 필요 · 연체 카운트). 필터는 `app/bmans/stores/usePaymentFilters.ts`(zustand, persist 없음, 변경 시 `page: 1`)
- 연체 엑셀 `handleOverdueExcelDownload`(115행): plain 함수 `findBmans` 반복 수집 → `xlsx` → `lib/file.ts`
- 행 클릭 → `router.push('/txprs/<id>/payments')`(313행 외 9곳, 셀마다 반복)
- 상세 `app/bmans/_components/PaymentsDetailContainer.tsx`: `useFindTxpr` · `useFindTxprPaymentMethods` · `useFindTxprOverduePayments` · `useFindTxprPayments` 4개 + 모달 6개 import(InstansePayment · ManualPay · Memo · OverdueDelete · PaymentCancel · PaymentCancelReason). 목록 쪽 모달은 PaymentReset · PaymentStartDateChange — `bmans/_components/*Modal.tsx` 합계 8개
- 생성물 태그 `bman` · `txpr` · `payment` · `payment-method` · `overdue-payment`

**탭 3 구독 — 근거 파일**
- `app/subscription/_components/CareSubscriptionContainer.tsx`: `useFindUsers` 목록, `useDebounce` 검색, 관리자 해제는 `confirm()`(76행) → `findTxprs` → `releaseTxprAdmin`(85행) 순차 plain 호출
- 모달 4개 `AccountChangeModal` · `BlacklistAddModal` · `BlacklistReasonModal` · `BlacklistRemoveModal`
- 모달 닫힘을 의존성으로 한 강제 refetch(`hasMountedRef`, 115행~)

**탭 4 프로모션 · 마케팅 — 근거 파일**
- 프로모션(복사 원본 골격): `PromotionList.tsx`(`useGetAllPromotion`) → `PromotionTable.tsx`(클라이언트 필터·정렬·slice) / `PromotionForm.tsx` → `formSections/` 3 · `formSubSection/` 3 · `modals/` 5 · `schemas/schemas.ts` · `hooks/useInitPromotionForm.ts` · `stores/usePromotionFilters.ts`(persist `promotion-filters`, sessionStorage)
- 마케팅: `MarketingPageContainer.tsx`(`useListMktEvents`·`useDeleteMktEvent`) / `MarketingPageForm.tsx` + `HeaderForm`·`ImageSectionForm`·`CtaButtonForm`·`TooltipForm` · `_components/schemas.ts` · `hooks/useMktEventCopy.ts` · `constants.ts`
- 두 도메인 모두 목록 page 만 `PAGE_CARE_MARKETING_PAGE` 가드, create·edit 는 가드 없음

## 4. 탭 0 에 들어갈 실제 파일

| 칸 | 경로 (origin/prd) | 확인한 것 |
|---|---|---|
| 진입 | `next.config.mjs` | `rewrites()` `/pro/:slug*` → `/pro`, `distDir: './dist'`, SVGR, `withZentDevkit`. **middleware 없음** |
| 진입 | `app/page.tsx` | 세션 있으면 `/subscription` redirect, 없으면 `SigninCard` |
| 인증 | `app/api/auth/[...nextauth]/route.ts` (+ `api/logout`, `api/ping`) | `@zent-auth` NextAuth. `lib/auth.ts` 는 앱에서 import 0(데드 코드) |
| 셸 | `app/layout.tsx` | `auth()` → ThemesProvider > SessionProvider > `@ui/components/RootWrapper` + Toaster. **3겹뿐, 모달 Provider 없음** |
| 가드(page) | `app/subscription/page.tsx` · `app/bmans/page.tsx` · `app/marketing-page/page.tsx` · `app/promotion-page/page.tsx` · `app/pro/page.tsx` | 5화면. `PAGE_CARE_SUBSCRIPTION` · `PAYMENT` · `MARKETING_PAGE`(promotion 도 이것) · `PRO` |
| 가드(layout) | `app/qa/layout.tsx` | 유일한 layout 가드(`PAGE_CARE_QA`) + `NEXT_PUBLIC_ZENV === 'prd'` 면 안내 문구만 렌더 → 2화면 |
| 가드 없음 | `app/marketing-page/create/page.tsx` · `edit/[id]/page.tsx` · `app/promotion-page/create/page.tsx` · `edit/[promotionId]/page.tsx` · `app/txprs/[txprInfrId]/payments/page.tsx` | 5화면. 모두 `'use client'` 얇은 래퍼 |
| 화면 셸 | `app/pro/_components/ConsoleIframe.tsx` | `pathname.split('/pro/')` → `https://pro.care.bznav.com/#/<slug>` iframe |
| 관문 | `__generated__/index.ts` · `__generated__/endpoints/` 11개 · `orval.config.ts` | 별칭 `@/generated/*`. 훅과 plain 함수(`findBmans`, `releaseTxprAdmin` …)를 둘 다 쓴다 |
| 관문 | `lib/orval-fetcher.ts` · `lib/formdata.ts` | `@zent-auth` fetcher 재선언 |
| 외부 | care API(`NEXT_PUBLIC_API_URL`) · Cognito · `pro.care.bznav.com`(iframe) | — |

Authorization 헤더는 공유 `RootWrapper`(brics-fe-ui)가 심는다 — `zent-packages` `origin/main` `frontend/brics/ui/src/components/RootWrapper.tsx:48`. 이 레포 설치 버전 `0.3.1` 에서도 같은지는 확인 필요.

## 5. 이 서비스만의 주의

- **가드 없는 화면이 5개다**(create·edit 4 + txprs 1). 목록만 막고 상세·생성은 열려 있다. 화면 전수 탭에서 가드 없음을 눈에 띄게 표시하는 것이 이 콘솔 그림의 요점이다. "전 화면 가드" 로 일반화하지 않는다
- **폴더 ≠ 라우트**: `/txprs/[txprInfrId]/payments` 의 본체 `PaymentsDetailContainer` 는 `app/bmans/_components/` 에 있다. 탭 1 에서는 txprs 화면으로, 탭 2 에서는 bmans 컴포넌트로 그린다
- `/pro` 는 화면 1개지만 `/pro/<무엇이든>` URL 이 rewrite 로 같은 page 에 온다. 실제 화면은 외부 iframe 이다
- qa 는 권한이 있어도 prd 에서는 **안내 문구만** 나온다(`app/qa/layout.tsx:13-15`). 운영 기준 그림에서는 "prd 차단" 을 붙인다
- `__generated__/` 는 git 에 커밋돼 있다(origin/prd 133파일). `endpoints/vat`·`admin` 은 지식 문서상 사용 0~1 이다. 다만 7파일이 배럴 `@/generated/index` 로 import 해 경로 grep 만으로는 사용처를 셀 수 없다 — 태그별 사용처를 그림에 쓰려면 import 한 심볼 이름으로 다시 센다(확인 필요)
- `orval.config.ts` 의 설정 이름이 `zentServerOp` 다(다른 레포에서 복사된 이름). 대상 서버를 이 이름으로 추측하지 않는다
- 필터 상태는 URL 에 없다. bmans·promotion 은 zustand, subscription·qa 는 `useState`. 요청 흐름에 "쿼리스트링" 을 그리지 않는다
- API 페이지 파라미터는 0-based(`page: page - 1`) — 시퀀스 메시지 라벨에 그대로 적는다
- `tailwind.config.js:1` 이 `./app/marketing-page/constants` 를 require 한다. 빌드 설정이 화면 폴더에 의존하는 드문 연결이라 탭 0 또는 탭 4 에 선 하나로 남길 만하다

## 6. 바뀌면 손볼 곳

- 새 화면 → 탭 1 에 노드 + 가드 유무 `tag`
- `app/bmans/**`·`app/txprs/**` 변경, 결제 모달 추가 → 탭 2
- `app/subscription/**` → 탭 3
- `app/promotion-page/**`·`app/marketing-page/**`, 또는 같은 골격의 새 폼 도메인 → 탭 4. 새 도메인이 흐름을 따로 가질 만큼 크면 탭을 새로 만든다
- create·edit 에 가드가 생기거나 `app/<domain>/layout.tsx` 가드로 옮겨지면 탭 0 가드 칸의 숫자(page 5 · layout 1 · 없음 5)와 탭 1 `tag`
- 셸에 Provider 가 늘면 탭 0 셸 노드

## 7. 읽을 지식 문서

- `docs/knowledge/client-brics-care/structure.md` — 라우트·가드 표
- `docs/knowledge/client-brics-care/patterns.md` — P1 가드 · P2 골격(promotion-page) · P4 필터 스토어 · P5 plain 함수 호출 · P7 모달 두 갈래 · P10 엑셀
- `docs/knowledge/client-brics-care/gotchas.md` — 가드 없는 화면 · 폴더≠라우트 · 0-based · bmans 3회 호출 · tailwind require
- `docs/knowledge/client-brics-care/rules.md` — arrow function·직접 fetch 금지(노드 문구에 "fetch" 를 쓸 때 주의)

지식 문서와 코드가 다른 곳: 이번에 대조한 범위(라우트·가드·스토어·생성물 태그·결제/구독 컨테이너)에서는 찾지 못했다.
