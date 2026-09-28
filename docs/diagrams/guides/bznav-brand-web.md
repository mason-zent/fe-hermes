# bznav brand-web — 다이어그램 서비스 가이드

공통 원칙·archify 제약·검증 명령은 [`../AUTHORING.md`](../AUTHORING.md)에 있다. 이 문서는 brand-web 에만 해당하는 것만 적는다. 경로는 따로 적지 않으면 `apps/brand-web/` 기준이다.

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/bznav-web` (모노레포) |
| 앱 루트 | `apps/brand-web/` |
| 기준 ref | `origin/prd-brand` (`hermes.config.json`) — 이 가이드를 쓸 때 `7f052c0` (2026-09-15 커밋) |
| 라우터 | App Router. `pages/` 없음. 루트 `app/page.tsx` 도 없다 (`/` 는 rewrite 로 `/home` 을 그린다) |
| 화면 수 | **page.tsx 4개** — `app/home/page.tsx` · `app/brand-resource/page.tsx` · `app/terms/[...terms]/page.tsx` · `app/popup/terms/[...terms]/page.tsx` |
| 실제 URL 수 | 파일 수와 다르다. 약관 page 두 개가 DatoCMS 레코드마다 URL 을 만든다(3·5절) |

화면 수 세는 명령:

```bash
git -C repos/bznav-web ls-tree -r --name-only origin/prd-brand apps/brand-web | grep -E '/page\.tsx$'
node scripts/diagram-coverage.mjs docs/diagrams/brand-web
# → 화면 파일 4 (App Router 4 · Pages Router 0) · 다이어그램에 담긴 화면 4 · 탭 3 / 누락 0 · 중복 0 · 없는 경로 0
```

## 2. 지금 있는 장

고정 커밋은 JSON `meta.repository.revision` 앞 7자다. "없음" 인 장은 `repository`·`sources` 가 없어 `check-diagrams.mjs` 가 근거를 점검하지 못한다.

| 종류 | 원본 → 결과 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|---|
| 구조 | `bznav-brand-web.architecture.json` → `bznav-brand-web.html` | `7f052c0` | 노드 14 · 연결 11. layout·페이지 조립·약관·CMS 요청·rewrite·sitemap 과 공유 패키지 |
| 화면 맵 | `bznav-brand-web.domains.architecture.json` → `bznav-brand-web.domains.html` | 없음 | 라우트 4 + 셸·섹션·데이터 경로 10노드. "DatoCMS 로 채워진다" 경계 |
| 요청 흐름 | `bznav-brand-web.sequence.json` → `bznav-brand-web.sequence.html` | 없음 | 대표 화면 `app/terms/[...terms]` — 빌드 경로 생성 → getTermsDetail → requestDatoCms → notFound/본문 (참여자 8 · 메시지 14) |
| 화면 상태 | `bznav-brand-web.lifecycle.json` → `bznav-brand-web.lifecycle.html` | 없음 | 같은 약관 화면의 상태 8. **2026-09-28 목록에서 뺐다** — 새로 만들지 않는다 |
| 심층 번들 | `brand-web/build-bundle.py` → `brand-web/brand-web-architecture.html` | `7f052c0` (첫 탭에서 읽음) | 탭 3장. 목록 카드 링크 "심층 · 화면·URL" (`scripts/build-diagram-index.mjs`) |

## 3. 심층 탭 구성

화면이 한 자릿수고 URL 을 CMS 데이터가 만드는 앱이라 "화면 · **실제 URL** 전수" 1장 + "그 URL 을 만드는 CMS 흐름" 1장으로 짰다(`AUTHORING.md` 4절).

| 탭 | 파일 | 도메인 경계 (경로 접두사) | 화면 | 노드 · 연결 |
|---|---|---|---|---|
| 0 상세 | `brand-web-detail.architecture.json` | 앱 전체. 진입 → layout → 화면 4 → DatoCMS → 빌드 산출 | 0 (대표 인용) | 25 · 25 |
| 1 화면 · URL 전수 | `screens-urls.architecture.json` | `app/home/` · `app/brand-resource/` · `app/terms/[...terms]/` · `app/popup/terms/[...terms]/` + `next.config.mjs`·`proxy.ts` 경로 규칙 | **4** | 16 · 9 |
| 2 DatoCMS · 약관 | `cms-terms.architecture.json` | `lib/utils/dato-cms.ts` · `lib/constants/graph-ql-query.ts` · `app/_components/terms/` | 0 | 11 · 11 |

`build-bundle.py` 의 `DRILL`: 탭 0 `brand`·`home`·`terms`·`popup` → 탭 1, `termsfn`·`request` → 탭 2 / 탭 1 `termsP`·`popupP`·`termsU` → 탭 2.

### 탭 1 — URL 이 어디서 생기나

| 노드 | 근거 파일 | URL |
|---|---|---|
| `homeU` | `app/home/page.tsx` + `next.config.mjs` rewrite(38–45) + `next-sitemap.config.mjs` | `/` 와 `/home` (같은 화면. sitemap 은 `/` 만) |
| `brandU` | `app/brand-resource/page.tsx` 사이드바 앵커 | `/brand-resource` + `#brand-logo` 등 앵커 4 |
| `termsU` | `app/terms/[...terms]/page.tsx` `generateStaticParams` → `getTermsPaths` | `/terms/<종류 key>` (종류마다) + `/terms/<종류 key>/<version>` (레코드마다) |
| `popupU` | `app/popup/terms/[...terms]/page.tsx` — 같은 `getTermsPaths` 를 따로 부른다 | `/popup/terms/…` 같은 목록 |
| 경로 규칙 4 | `next.config.mjs` 38–64 · `proxy.ts` 6–8 | rewrite 1 · redirect 3 · proxy JSON 응답 2 |

### 탭 2 — DatoCMS 가 URL·본문을 정하는 파일

| 역할 | 파일 | 내용 |
|---|---|---|
| 모델 | DatoCMS (앱 밖) | `bznavTermType`(name · key · enforceTerm) · `bznavTerm`(termType · key · version · content · isrichcontent · richcontent) |
| 쿼리 3 | `lib/constants/graph-ql-query.ts` | `TERMS_PATH_QUERY`(1–22, 빌드용 경로) · `TERMS_LATEST_VERSION_QUERY`(24–36, 버전 없는 주소의 enforceTerm) · `TERMS_DETAIL_QUERY`(38–66, 본문 + versions) |
| 함수 3 | `lib/utils/dato-cms.ts` | `requestDatoCms`(5–25, 유일한 관문) · `getTermsPaths`(27–39, 빌드 시) · `getTermsDetail`(41–68, 요청 시) |
| generateStaticParams | `app/terms/[...terms]/page.tsx` 7–9 · `app/popup/terms/[...terms]/page.tsx` 6–8 | 둘 다 `getTermsPaths()` 를 반환 |
| 렌더 | `app/_components/terms/TermContentSection.tsx` · `app/_components/terms/ArticleView.tsx` | rich 여부로 본문 선택 · 버전 드롭다운 · 표 스크롤 래퍼 |

**새 약관 종류가 CMS 에 생기면** 코드·그림 모두 바꿀 게 없다(URL 이 늘 뿐). **새 쿼리·모델 필드가 생기면** 탭 2 의 `qPath`/`qLatest`/`qDetail` 과 `request` 노드 문장을 고친다.

## 4. 탭 0 에 들어갈 실제 파일

| 층 | 파일 | 무엇 |
|---|---|---|
| 진입 | `proxy.ts` | `/ping` · `/.well-known/appspecific/com.chrome.devtools.json` 에 JSON 만 돌려주고 나머지는 통과. `matcher` 없음 |
| 진입 | `next.config.mjs` | assetPrefix `${CDN}/bznav-brand-web`(빌드 ID 없음, 26) · rewrite `/`→`/home`(38–45) · redirect `/storybook/*`→chromatic 307, `/tax/refund/reviews/*`·`/tax/refund/*`→`NEXT_PUBLIC_REFUND_DOMAIN` 308(46–64) · `productionBrowserSourceMaps: true` |
| 셸 | `app/layout.tsx` | 서버. 대형 `metadata`(canonical `https://bznav.com/` 고정, 117–119) · Organization JSON-LD · `getServerWorkingPlatform()`(131) → `JotaiProvider` → `Toaster` → `PageNavigationEventProvider` → `BrandAppContents` |
| 셸 | `app/_components/layout-content/BrandAppContents.tsx` | client. `RouterProvider` → `EventTrackingProvider`(appId `bznav-brand`, Mixpanel 만) → `DialogProvider` → `GlobalErrorBoundary` → `NiceModal.Provider` |
| 셸 | `app/_components/layout-content/Layouts.tsx` · `LayoutItems.tsx` · `FooterItems.tsx` · `HeaderItems.tsx` | `LogoLayout`(Suspense · 헤더 · main · 푸터). `isBrandResource` 면 브랜드 리소스 헤더 |
| 셸 | `app/home/layout.tsx` · `app/brand-resource/layout.tsx` · `app/terms/[...terms]/layout.tsx` · `app/popup/terms/[...terms]/layout.tsx` | 앞 셋은 `LogoLayout`, 팝업은 헤더·푸터 없는 `div` 한 겹 |
| 가드 | 없음 | 로그인·권한 가드가 없다. 대신 `hooks/useIsDeeplinkFallback.ts`(`?referrer=deeplink_fallback`)가 헤더·배너·버튼을 숨긴다 |
| 폴백 | `app/not-found.tsx` · `app/_components/GlobalErrorBoundary.tsx` | 404 · 오류 경계 |
| 관문 | `lib/utils/dato-cms.ts` | `requestDatoCms` 하나(`@repo/common-utils` `requestPostFetch`, `Bearer DATO_ACCESS_TOKEN`). fetch·axios·Relay 없음 |
| 빌드 산출 | `package.json` `postbuild` · `next-sitemap.config.mjs` | sitemap.xml · robots.txt 재생성. 산출물은 `.gitignore` 43–44 로 미커밋 |
| 외부 | DatoCMS(`graphql.datocms.com`) · 리소스 센터 CDN(`NEXT_PUBLIC_RESOURCE_CENTER_URL`) · 다른 비즈넵 서비스(`lib/constants/common.ts` `SERVICE_LINKS`) · 검색엔진 | 박스 밖 |

## 5. 이 서비스만의 주의

- **파일 4 ≠ URL 4.** 화면 전수 대조(`diagram-coverage.mjs`)는 page 파일을 센다. URL 은 탭 1 에서 따로 그린다. 둘을 섞어 "화면 N개" 라고 쓰지 않는다
- **`/` 는 page 가 아니라 rewrite 다.** `app/page.tsx` 를 찾지 말 것. `/home` 도 직접 열리지만 sitemap 에서 빠진다(`next-sitemap.config.mjs` 4 `EXCLUDE_ROUTES`)
- **catch-all `[...terms]` 는 선택형이 아니다.** 세그먼트 0 인 `/terms` 는 page 가 없어 404. 세그먼트 3번째부터는 `getTermsDetail` 이 `terms[0]`·`terms[1]` 만 읽는다(`lib/utils/dato-cms.ts` 43–44) — 그 URL 이 실제로 200 인지는 확인 필요
- **같은 목록을 두 page 가 따로 만든다.** `terms`·`popup/terms` 의 `generateStaticParams` 가 각각 `getTermsPaths` 를 부른다. 한쪽만 고치면 두 URL 목록이 갈라진다
- **빌드 실패 지점.** `getTermsPaths` 에는 try 가 없고 `paths?.types.map(...)` 결과에 바로 `.concat` 한다(`lib/utils/dato-cms.ts` 30–38) — CMS 응답이 비면 빌드가 깨진다. 요청 시의 `getTermsDetail` 은 실패를 삼켜 `term: null` → `notFound()`
- **`first: "100"`** — 종류·레코드가 100개를 넘으면 미리 만들어지지 않는다(`graph-ql-query.ts` 4·11). 넘는 URL 이 요청 시 렌더되는지는 확인 필요
- **쿼리에 URL 값을 문자열로 끼운다.** `variables` 를 쓰지 않는다(`graph-ql-query.ts` 27·45·49). versions 는 `matches pattern` 부분 일치라 화면에서 다시 거른다(`TermContentSection.tsx` 29–35, 레코드 key 끝 3조각을 버리는 전제)
- **revalidate 3600 이 실제 반영 주기라고 단정하지 않는다.** 약관 page 에 `revalidate = 3600` 이 있지만 루트 layout 이 `getServerWorkingPlatform()`(쿠키·헤더를 읽는다)을 불러 동적 렌더된다 — plus-web `app/layout.tsx` 35 주석도 그렇게 적는다. 기존 장끼리 문장이 다르다(보고 참조)
- **사이드바 약관 링크는 고정이다.** `/terms/service` · `/terms/privacy` (`app/terms/[...terms]/page.tsx` 21–24). CMS 에 종류가 늘어도 사이드바는 그대로
- **렌더되지 않는 파일.** `app/home/_components/CareInductionModal.tsx` 는 어디서도 import 하지 않는다. 그림에 화면·섹션으로 넣지 않는다
- **Jotai 는 Provider 만 있다.** 스토어 노드를 만들지 않는다

## 6. 바뀌면 손볼 곳

| 변화 | 손볼 곳 |
|---|---|
| 새 `page.tsx` (고정 URL) | 탭 1 에 `…P`(page) · `…U`(URL) 노드 한 쌍 + boundary `wraps` · 탭 0 화면군에 노드 + `DRILL` 0 → 1. sitemap 은 `getStaticAppRoutes` 가 자동 수집하므로 `homeU` 카드 문장만 확인 |
| 새 동적 page (CMS·params) | 탭 1 노드 한 쌍 + 탭 2 에 쿼리·함수 노드. `generateStaticParams` 가 어디서 목록을 받는지 따라간다 |
| 루트 page 가 생기거나 rewrite 가 바뀜 | 탭 1 `rewrite`·`homeU`, 탭 0 `routing`, 구조도 `rewrite` 노드 |
| `next.config.mjs` redirect 추가 | 탭 1 경로 규칙 줄(4열이 차 있으니 행을 늘린다) · 탭 0 `routing` sources |
| DatoCMS 쿼리·모델 변경 | 탭 2 `qPath`/`qLatest`/`qDetail`·`datocms`, 요청 흐름 `cms`·`dato` |
| 새 데이터 관문(fetch·API) | 탭 0 에 관문 노드를 새로 두고 카드 "데이터 관문은 하나" 를 고친다 — 지금 그림 전체가 "관문 하나" 전제다 |
| 스토어 도입 | 선례가 없다. 탭 0 에 훅·스토어 층을 새로 만든다 |

## 7. 읽을 지식 문서

- `docs/knowledge/bznav-web/brand-web/structure.md` · `patterns.md` · `workflows.md` · `gotchas.md`
- `docs/knowledge/bznav-web/rules.md` (brand-web: 라우팅·메타 변경 시 build 후 sitemap 확인) · `common.md` · `gotchas.md`
- `docs/diagrams/README.md` 대표 화면 표 (`app/terms/[...terms]`)
