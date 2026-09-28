# bznav plus-web — 다이어그램 서비스 가이드

공통 원칙·archify 제약·검증 명령은 [`../AUTHORING.md`](../AUTHORING.md)에 있다. 이 문서는 plus-web 에만 해당하는 것만 적는다. 경로는 따로 적지 않으면 `apps/plus-web/` 기준이다.

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/bznav-web` (모노레포) |
| 앱 루트 | `apps/plus-web/` |
| 기준 ref | `origin/prd-plus` (`hermes.config.json`) — 이 가이드를 쓸 때 `edc6fe3` (2026-09-11 커밋) |
| 라우터 | App Router. route group `calc/(home)` · `calc/salary/(contract)`. `pages/` 없음. 루트 `app/page.tsx` 없음(`/` 는 `/calc` 로 redirect) |
| 화면 수 | **page.tsx 19개** — 계산기 10(허브 · 메뉴 · 계산기 8) · 세금 진단 6 · 세금 콘텐츠 1 · 운세 2 |

화면 수 세는 명령:

```bash
git -C repos/bznav-web ls-tree -r --name-only origin/prd-plus apps/plus-web | grep -E '/page\.tsx$'
node scripts/diagram-coverage.mjs docs/diagrams/plus-web
# → 화면 파일 19 (App Router 19 · Pages Router 0) · 다이어그램에 담긴 화면 19 · 탭 5 / 누락 0 · 중복 0 · 없는 경로 0
```

## 2. 지금 있는 장

고정 커밋은 JSON `meta.repository.revision` 앞 7자다. "없음" 인 장은 `repository`·`sources` 가 없어 `check-diagrams.mjs` 가 근거를 점검하지 못한다.

| 종류 | 원본 → 결과 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|---|
| 구조 | `bznav-plus-web.architecture.json` → `bznav-plus-web.html` | `edc6fe3` | 노드 14 · 연결 7. 계산기 page·폼 훅·상태 훅·순수 계산·SEO layout·간편인증·recharts·노션 |
| 화면 맵 | `bznav-plus-web.domains.architecture.json` → `bznav-plus-web.domains.html` | 없음 | 계산기 8 = `lib/hooks/calc` 8세트 1:1, 허브·진단·콘텐츠·운세 (12노드) |
| 요청 흐름 | `bznav-plus-web.sequence.json` → `bznav-plus-web.sequence.html` | 없음 | 대표 화면 **주휴수당 계산기** — layout(SEO) → page → 폼 훅 → 상태 훅 → 순수 함수 → DP 로그 (참여자 8 · 메시지 14) |
| 화면 상태 | `bznav-plus-web.lifecycle.json` → `bznav-plus-web.lifecycle.html` | 없음 | 같은 계산기의 2단계 상태. **2026-09-28 목록에서 뺐다** — 새로 만들지 않는다 |
| 심층 번들 | `plus-web/build-bundle.py` → `plus-web/plus-web-architecture.html` | `edc6fe3` (첫 탭에서 읽음) | 탭 5장. 목록 카드 링크 "심층 · 19화면" (`scripts/build-diagram-index.mjs`) |

⚠️ 요청 흐름·화면 상태 JSON 문구는 대표 화면을 `app/calc/holiday-pay` 로 적는다. 실제 라우트는 **`app/calc/holidaypay`** 이고 `holiday-pay` 는 훅·유틸 폴더 이름이다(README 대표 화면 표도 그렇게 적는다).

## 3. 심층 탭 구성

화면이 19개라 "화면 전수" 1장 + 도메인마다 **파일·함수 단위로 깊게** 그린 장 3개로 짰다(`AUTHORING.md` 4절).

| 탭 | 파일 | 도메인 경계 (경로 접두사) | 화면 | 노드 · 연결 |
|---|---|---|---|---|
| 0 상세 | `plus-web-detail.architecture.json` | 앱 전체. 진입 → 셸 → 화면군 → 훅·스토어 → 서버 넷 | 0 (대표 인용) | 16 · 15 |
| 1 화면 19 전수 | `screens.architecture.json` | 아래 표 | **19** | 12 · 6 |
| 2 계산기 3계층 | `calc-layers.architecture.json` | `app/calc/*/_components` · `lib/hooks/calc/` · `lib/utils/calc/` · `lib/constants/calc/` | 0 | 24 · 20 |
| 3 세금 진단 | `tax-check.architecture.json` | `app/tax-check/` · `lib/hooks/simple-auth/` · `store/auth-store.ts` | 0 | 12 · 11 |
| 4 콘텐츠 · 운세 | `content-fortune.architecture.json` | `app/tax-content/` · `app/fortune/` · 노션·운세 `lib/api` | 0 | 15 · 11 |

`build-bundle.py` 의 `DRILL`: 탭 0 `shell` → 1, `calc` → 2, `taxcheck` → 3, `content`·`fortune` → 4 / 탭 1 `sales`·`labor`·`tax` → 2, `tcLanding`·`tcAuth`·`tcCollect`·`tcResult` → 3, `content`·`fortune` → 4.

### 탭 1 — 화면 19 의 도메인 경계

| 묶음 | 경로 접두사 | 화면 | 노드 |
|---|---|---|---|
| 계산기 허브 · 메뉴 | `app/calc/(home)/` · `app/calc/menu/` | 2 | `hub` · `menu` |
| 매출 계산 | `app/calc/sales/` · `app/calc/bep/` | 2 | `sales` |
| 인건비 계산 | `app/calc/salary/(contract)/` · `app/calc/salary/actual/` · `app/calc/holidaypay/` | 3 | `labor` |
| 세금 계산 | `app/calc/tax/vat/` · `app/calc/tax/simplevat/` · `app/calc/tax/penalty/` | 3 | `tax` |
| 세금 진단 | `app/tax-check/` | 6 | `tcLanding` · `tcAuth`(2) · `tcCollect`(2) · `tcResult` |
| 세금 콘텐츠 | `app/tax-content/[slug]/` | 1 | `content` |
| 운세 | `app/fortune/` | 2 | `fortune` |
| (화면 아님) | `next.config.mjs` redirect `/`→`/calc` | 0 | `root` |

### 탭 2 — 계산기 3계층이 근거로 삼는 파일

URL 과 코드 폴더 이름이 다르다. 새 계산기를 그릴 때 이 표로 세트를 찾는다.

| URL (`app/calc/…`) | 훅 세트 `lib/hooks/calc/<이름>/` | 순수 계산 `lib/utils/calc/<이름>.ts` | 탭 2 줄 |
|---|---|---|---|
| `sales` | `store-sales` | `store-sales.ts` | 매출 |
| `bep` | `breakeven` | `breakeven.ts` | 매출 |
| `salary/(contract)` | `salary-contract` | `salary-contract.ts` | 인건비 |
| `salary/actual` | `salary-actual` | `salary-actual.ts` | 인건비 |
| `holidaypay` | `holiday-pay` | `holiday-pay.ts` | 인건비 |
| `tax/vat` | `vat` | `vat.ts` | 세금 |
| `tax/simplevat` | `simple-vat` | `simple-vat.ts` | 세금 |
| `tax/penalty` | `tax-penalty` | `tax-penalty.ts` | 세금 |

- 줄마다 4칸: 입력 Section(`app/calc/<URL>/_components/`) → ① 폼 훅 `use-<이름>-form.ts` → ② 상태 훅 `use-<이름>.ts` → ③ 순수 계산
- 공통 노드: `lib/utils/form/create-form-setter.ts`(setter) · `lib/types/calc/`(Step) · `lib/constants/calc/`(요율·`FIELD_LIMITS`, `simplified-income-tax-table.ts`) · `app/calc/_components/`(CalcSummary · CalcPriceUnit · SlotMachineNumber) · `lib/hooks/calc/use-calculator-dp-log.ts` → `lib/utils/dp-logs/` → `lib/api/dp-logs.ts`
- **노드당 sources 3개가 이미 대부분 찼다.** 인건비·세금 줄은 네 칸 모두 3개, 매출 줄은 폼 훅만 2개다. 새 계산기는 기존 줄에 끼우지 말고 **줄(행)을 하나 더** 두는 쪽이 맞다

### 탭 3 · 4 가 근거로 삼는 파일

- **세금 진단**: `app/tax-check/_components/ui/button/CTAButton.tsx`(진입 5갈래) · `app/tax-check/simple-auth/` · `lib/hooks/simple-auth/use-simple-auth-request.ts` · `use-simple-auth-confirm.ts` · `lib/api/simple-auth-request.ts` · `simple-auth-confirm.ts` · `hometax-load.ts` · `integrated-analysis.ts` · `app/tax-check/collection/` · `app/tax-check/result/` · `app/tax-check/_components/ui/chart/`(recharts 는 여기뿐) · `store/auth-store.ts` · `lib/constants/tax-check/grade-variants.ts`
- **콘텐츠**: `app/tax-content/[slug]/page.tsx` · `lib/api/get-notion-database-rows.ts` · `lib/api/notion-client.ts`(자체 파일, DB 행) · `lib/api/get-notion-page-content.ts`(npm `notion-client`, 본문) · `lib/constants/notion.ts` · `lib/constants/tax-content/meta.ts` · `app/tax-content/_components/`
- **운세**: `app/fortune/_components/` · `lib/hooks/fortune/use-fortune.ts` · `use-fortune-query.ts` · `lib/api/fortune/fortune.ts` · `app/fortune/_store/fortune-store.ts` · `fortune-storage.ts` · `app/fortune/_canvas/sparkle.ts` · `lib/constants/fortune/`

## 4. 탭 0 에 들어갈 실제 파일

| 층 | 파일 | 무엇 |
|---|---|---|
| 진입 | `proxy.ts` | 플랫폼 쿠키만(`getMiddlewareWorkingPlatformCookie` → `setMiddlewareWorkingPlatformCookie`). `matcher` 명시(4–6). 로그인·점검 없음 |
| 진입 | `next.config.mjs` | assetPrefix `${CDN}/bznav-plus-web` · redirect `/` → `/calc` 하나(15–23) |
| 셸 | `app/layout.tsx` | 서버. `metadata`(prd 만 index) · `JsonLd data={SITE_LD}` · **`dynamic = 'force-dynamic'`**(33–36, 이유 주석) → `PageNavigationEventProvider` → `RootLayoutContent` |
| 셸 | `app/_components/RootLayoutContent.tsx` | client. `Toaster` · `RouterProvider` → `EventTrackingProvider`(appId `bznav-plus`, Mixpanel 만) → `DialogProvider` → `NiceModal.Provider` → `main`. `initializeReactNativeBridge('bznav-plus')` |
| 셸 | 화면별 `layout.tsx` (예 `app/calc/tax/vat/layout.tsx`) | SEO 전담 — `buildServiceMetadata(<META>)` · `buildWebApplicationLd` · `CommonTopNavigation`. `app/calc/layout.tsx` 는 `calc.scss` 와 뷰포트만 |
| 가드 | 없음 | `@repo/user-session`·`user-sign` 을 쓰지 않는다. 진단 흐름 안의 토큰·tin 확인은 탭 3 |
| 훅·스토어 | `lib/hooks/calc/` · `lib/hooks/simple-auth/` · `store/auth-store.ts` · `lib/hooks/fortune/` · `app/fortune/_store/` | 도메인마다 상태 보관이 다르다 |
| 관문 | `lib/constants/paths.ts` `API_PATHS`(15–21) · `FORTUNE_API_URL`(24) · `lib/api/*.ts` | fetch 래퍼가 하나로 모이지 않는다. 엔드포인트 상수가 기준 |
| 관문 | `lib/api/notion-client.ts` · `lib/api/get-notion-page-content.ts` | 노션 두 갈래 |
| 관문 | `lib/api/user-info.ts` · `terms.ts` · `upsert-app-user.ts` · `lib/utils/dp-logs/user-id.ts` | SSO 직접 호출 |
| 빌드 산출 | `package.json` `postbuild` · `next-sitemap.config.mjs` | `exclude: ['/*']` + `INDEXABLE_PATHS` 11개(9–21) · `DISALLOW_PATHS`(4) |
| 외부 | PLUS API(`NEXT_PUBLIC_PLUS_API_SERVER`) · SSO API(`NEXT_PUBLIC_SSO_API_SERVER`) · 세나 API(`/api/open/saju`) · Notion | 서버가 넷이다 |

## 5. 이 서비스만의 주의

- **URL 과 폴더 이름이 다르다.** route group `(home)`·`(contract)` 때문에 허브는 `/calc`, 계약 연봉은 `/calc/salary` 다. 계산기 URL(`holidaypay`·`bep`·`sales`·`simplevat`·`penalty`)과 훅·유틸 이름(`holiday-pay`·`breakeven`·`store-sales`·`simple-vat`·`tax-penalty`)이 다르다 — 3절 표로 맞춘다
- **`/` 에는 page 가 없다.** `next.config.mjs` 15–23 이 `/calc` 로 보낸다. 루트 화면 노드를 만들지 않는다(탭 1 `root` 는 "page 없음" 표시용)
- **계산기 8세트는 뼈대만 같다.** 반환 shape 이 `{parsedInput, sections}` 인 건 vat · holiday-pay · simple-vat · tax-penalty 뿐이고, Step 도 2·3·4단계로 다르다. 한 계산기 그림을 다른 계산기로 옮기지 않는다(요청 흐름이 대표 화면 하나인 이유)
- **계산기 page 는 전부 `'use client'`, SEO 는 옆 layout.tsx.** tax-check 는 result 를 뺀 page 가 서버 컴포넌트, tax-content page 는 async 서버 컴포넌트다
- **루트 layout 이 `force-dynamic`** 이다(`app/layout.tsx` 33–36). "정적 페이지" 로 그리지 않는다
- **`/tax-content/[slug]` 는 catch-all 이 아니라 단일 동적 세그먼트**다. 실제 URL 은 노션 DB 행 수만큼 생긴다 — `generateStaticParams`(page.tsx 20) · `revalidate = 1800`(18). sitemap `INDEXABLE_PATHS` 에 없다
- **`/fortune/share` 는 redirect 만 하지만 page 다.** `app/fortune/share/page.tsx` 가 UTM 을 붙여 `/fortune` 으로 보낸다. 화면 수에는 들어간다
- **허브 메뉴에는 계산기 8종과 `/fortune` 만 있다**(`lib/constants/calc/home-menus.ts`). `/tax-check` · `/tax-content` 로 가는 연결선을 허브에서 긋지 않는다
- **폼이 두 갈래.** 계산기는 RHF `watch`/`setValue`/`reset` 만(resolver 없음), yup resolver 는 간편인증(`lib/regex/schema/simple-auth.ts`)과 운세(`lib/regex/schema/bizno-schema.ts`)
- **`notion-client` 이름이 둘이다.** 자체 파일 `lib/api/notion-client.ts`(공식 API fetch, DB 행)와 npm 패키지 `notion-client`(`lib/api/get-notion-page-content.ts`, 본문)
- **DP 로그 `toolType` 은 계산기마다 따로다.** `calc_payroll` 은 타입(`lib/types/dp-logs.ts` 4)에만 있고 쓰는 곳이 없다
- **한글 키가 도메인 값이다.** `PAGE_PATHS`(`lib/constants/paths.ts` 2–9)와 진단 결과 키·등급(`양호`·`주의`·`위험`). 문구로 옮길 때 번역하지 않는다

## 6. 바뀌면 손볼 곳

| 변화 | 손볼 곳 |
|---|---|
| **새 계산기** | 탭 1 — 도메인 줄(매출·인건비·세금) 노드에 page 추가. `sales` 는 한 자리 남았고 `labor`·`tax` 는 찼으니 새 노드. boundary `wraps` · 탭 1 subtitle·카드 "계산기 10" · 탭 0 `calc` "10 화면" · `build-bundle.py` TABS 설명 · 새 노드면 `DRILL` 1 → 2 |
| 〃 | 탭 2 — 새 줄(입력 Section · 폼 훅 · 상태 훅 · 순수 계산)을 `lib/hooks/calc/<이름>/`·`lib/utils/calc/<이름>.ts`·`app/calc/<URL>/_components/` 로 그리고, Step 이 다르면 `stepM`, 새 toolType 이면 `dpHook` 카드. viewBox 높이를 늘린다 |
| 〃 | 화면 맵 — 계산기 boundary 에 노드. 카드 "8세트" 문구 |
| 새 진단 단계 (`app/tax-check/<경로>/`) | 탭 1 `tc*` 노드 · boundary "PAGE_PATHS 6" · 탭 3 흐름 노드 · 탭 0 `taxcheck` "6 화면" |
| 새 콘텐츠·운세 화면 | 탭 1 `content`·`fortune` · 탭 4 · 탭 0 해당 노드 |
| 새 도메인 (`app/<새 경로>/`) | 탭 1 에 묶음 노드 + 탭 0 화면군 노드 + `DRILL` 0 → 1. 흐름이 깊으면 탭을 새로 만든다 |
| 새 API 서버·엔드포인트 | 탭 0 외부 노드와 카드 "서버가 넷이다" · `lib/constants/paths.ts` 근거 줄 |
| sitemap·robots 변경 | 탭 1 카드 "색인 · 노출" · 탭 0 `seo` sources(`next-sitemap.config.mjs`) |
| Provider 추가·force-dynamic 제거 | 탭 0 `shell`·`seo` · 구조도 `seo` |

## 7. 읽을 지식 문서

- `docs/knowledge/bznav-web/plus-web/structure.md` · `patterns.md`(계산기 3계층 · 폼 두 갈래) · `workflows.md`(새 계산기 절차) · `gotchas.md`
- `docs/knowledge/bznav-web/rules.md` (plus-web: 차트 변경 시 데이터 shape · 폼 두 갈래) · `common.md` · `gotchas.md`
- `docs/diagrams/README.md` 대표 화면 표 (`app/calc/holidaypay`)
