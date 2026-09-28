# bznav refund-web — 다이어그램 서비스 가이드

공통 원칙·archify 제약·검증 명령은 [`../AUTHORING.md`](../AUTHORING.md)에 있다. 이 문서는 refund-web 에만 해당하는 것만 적는다. 경로는 따로 적지 않으면 `apps/refund-web/` 기준이다.

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/bznav-web` (모노레포) |
| 앱 루트 | `apps/refund-web/` |
| 기준 ref | `origin/prd-refund` (`hermes.config.json` `apps.refund-web.branch`) — 이 가이드를 쓸 때 `5bcf139` (2026-09-28 커밋) |
| 라우터 | **Pages Router — 5개 앱 중 유일하다.** `app/` 디렉터리가 없다(ref 에서 0 파일). 화면은 `pages/**` |
| 화면 수 | **106** — `pages/**` 111 파일에서 `_app`·`_document`·`_error`·`api/`(sitemap·robots) 5개를 뺀 수. `pages/404.tsx` 는 화면으로 센다 |

화면 수 세는 명령:

```bash
git -C repos/bznav-web ls-tree -r --name-only origin/prd-refund apps/refund-web/pages \
  | grep -vE 'pages/(_app|_document|_error)\.tsx$|pages/api/' | wc -l      # → 106
node scripts/diagram-coverage.mjs docs/diagrams/refund-web
# → 화면 파일 106 (App Router 0 · Pages Router 106) · 다이어그램에 담긴 화면 106 · 탭 6 / 누락 0 · 중복 0 · 없는 경로 0
```

## 2. 지금 있는 장

고정 커밋은 JSON `meta.repository.revision` 앞 7자다. "없음" 인 장은 `repository`·`sources` 가 없어 `check-diagrams.mjs` 가 근거를 점검하지 못한다.

| 종류 | 원본 → 결과 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|---|
| 구조 | `bznav-refund-web.architecture.json` → `bznav-refund-web.html` | `5bcf139` | 노드 14 · 연결 11. `_app`·pages·Relay 환경·콘텐츠 SSR·Jotai·자체 sitemap·결과 템플릿·공유 패키지 |
| 화면 맵 | `bznav-refund-web.domains.architecture.json` → `bznav-refund-web.domains.html` | 없음 | `pages/` 최상위 도메인 15노드와 도메인별 파일 수. 부제는 "104개"라서 지금 수(106)와 다르다(보고 참조) |
| 요청 흐름 | `bznav-refund-web.sequence.json` → `bznav-refund-web.sequence.html` | 없음 | 대표 화면 `pages/event/[...slug]` — 경로 확정 → BE 에서 base·variant → 서버 조립 · A/B variant 쿠키 · 실패 시 메인 fallback (참여자 9 · 메시지 15) |
| 화면 상태 | `bznav-refund-web.lifecycle.json` → `bznav-refund-web.lifecycle.html` | 없음 | 개인(indis) 홈택스 간편인증 라이프사이클(상태 10). **2026-09-28 목록에서 뺐다** — 새로 만들지 않는다 |
| 심층 번들 | `refund-web/build-bundle.py` → `refund-web/refund-web-architecture.html` | `5bcf139` (첫 탭에서 읽음) | 탭 6장. 목록 카드 링크 "심층 · 106화면" (`scripts/build-diagram-index.mjs`) |

## 3. 심층 탭 구성

| 탭 | 파일 | 도메인 경계 (경로 접두사, `pages/` 기준) | 화면 | 노드 · 연결 |
|---|---|---|---|---|
| 0 상세 | `refund-web-detail.architecture.json` | 앱 전체. 진입 → 셸 → 가드 → 화면군 5 → 훅·스토어 → 관문 4 → 외부 | 0 (대표 인용) | 25 · 23 |
| 1 환급 조회 · 신청 | `refund-flow.architecture.json` | `tax/**` 14 · `follow-up/**` 6 · **`home/index.tsx` 1** (환급 홈) | 21 | 11 · 7 |
| 2 홈택스 인증 · 오류 | `hometax-auth.architecture.json` | `hometax-auth/**` 7 · `error/**` 15 · `404.tsx` 1 | 23 | 11 · 4 |
| 3 설문 | `survey.architecture.json` | `survey/**` | 25 | 11 · 8 |
| 4 랜딩 · 외부 진입 | `landing-entry.architecture.json` | `home/**`(`home/index.tsx` 제외) 6 · `event/**` 1 · `landing/**` 1 · `help/**` 4 · `simple/**` 3 · `trp/**` 3 · `trr/**` 1 · `redirect.tsx` · `service-down/**` | 21 | 10 · 2 |
| 5 계정 · 메뉴 | `account-menu.architecture.json` | `auth/**` 10 · `menu/**` 6 | 16 | 8 · 4 |

`build-bundle.py` 의 `DRILL`: 탭 0 `refund`→1 · `hometax`→2 · `survey`→3 · `landing`→4 · `account`→5. 다른 탭에서 나가는 드릴다운은 없다.

경계가 헷갈리는 곳:

- **`pages/home/` 은 두 탭으로 갈린다.** `home/index.tsx`(`/home`, 환급 홈 — AuthGuard)만 탭 1, 나머지(`home/landing` · `home/[...content]` · `home/reviews` · `home/event/share/**`)는 탭 4
- **`pages/error/**` 는 결제 오류(`error/payment/*` 3)까지 전부 탭 2** 다. 결제 흐름(`trp`)은 탭 4 에 있지만 오류 화면은 옮기지 않는다
- `404.tsx` 는 오류 화면이라 탭 2. `_error.tsx` 는 화면으로 세지 않는다

## 4. 탭 0 에 들어갈 실제 파일

| 층 | 파일 | 무엇 |
|---|---|---|
| 진입 | `proxy.ts` | Next 16 미들웨어 파일명(`middleware.ts` 아님). `matcher` 는 `_next/static`·`_next/image`·`favicon.ico`·확장자 있는 경로를 뺀다(23–25). edge-config CDN `refund/management.json` 으로 점검 판정(21, prd·dev URL 분리) → `/service-down` redirect. 점검 중에도 열리는 경로 `/` · `/service-down` · `/redirect`(20), level `hometax` 면 `/trr` 만 막는다(45). working-platform·UTM·maintenance 쿠키(57–59) |
| 진입 | `next.config.mjs` | rewrite `/`→`/home/landing` · `/trp/tax-refund/success`→`/trp/success` · `/sitemap.xml`·`/robots.txt`→API Route(53–60). redirect `/signin/*`·`/income-tax-refund/*`→`/auth/sign-in/*`, `/capital-gain/*`→`/home/capital-gain/*`, `/tax/refund/summary`→`/home`(61–68). 보안·CSP·noindex 헤더(69–123). `assetPrefix` CDN(11) |
| 셸 | `pages/_app.tsx` | `seoHead`(콘텐츠 페이지 gSSP) 우선, 없으면 경로별 OG 맵(19–21). `JotaiProvider` → `RouterProvider` → `PageNavigationEventProvider` → `RefundAppContents`(32–41) |
| 셸 | `components/layout/RefundAppContents.tsx` | `ErrorBoundary` → `AuthProvider`(`signPaths`, 토스 계열이면 CI 미사용, 29–44) → `EventTrackingProvider`(Mixpanel·Airbridge·픽셀·GA·Datadog, 45–84) → `RelayEdkForAccessTokenProvider`(85) → `PageContents`(94–108: `DialogProvider`·`TooltipProvider`·`NiceModal.Provider`·`Suspense`, `getLayout` 호출 95·103, 홈택스 차단 설정 폴링 97) |
| 셸 | `lib/types/layout.ts` | `AppPropsWithLayout` — `Component.getLayout` 타입 |
| 가드 | `packages/user-session/src/components/AuthGuard.tsx` (공유 패키지, 레포 루트 기준) | `AuthGuard`·`CiGuard`. **앱 전역에 걸리지 않고 화면마다** `getLayout` 또는 페이지 본문에서 건다 |
| 가드 | `components/survey/common/SurveyProvider.tsx` | 설문 화면용. AuthGuard → 스코프 `JotaiProvider` → `SurveyInitProvider` |
| 관문 | `lib/relay/relay-environment.ts` · `lib/relay/use-fetch-relay-factory.ts` · `components/common/RelayEdkForAccessTokenProvider.tsx` | Relay(클라이언트 전용). 싱글턴·토큰 바뀌면 재생성, Bearer·`X-Zent-Session-Id`, `FORBIDDEN` 이면 로그아웃 |
| 관문 | `lib/graphql/server-fetch.ts` · `lib/content-page/server.ts` · `lib/content-page/api.ts` · `lib/content-page/path.ts` | gSSP·gSP 전용 raw POST(토큰 없음). 콘텐츠 페이지 팩토리 `createContentPageServerSideProps`(server.ts 34) |
| 관문 | `pages/api/sitemap.ts` · `pages/api/robots.ts` · `lib/seo-policy.mjs` | API Route 2개. 화면으로 세지 않는다 |
| 관문 | `lib/utils/joint-certificate.ts` | axios — 공동인증서 로컬 프로그램(`127.0.0.1:16566`) 전용 |
| 외부 | GraphQL API(`NEXT_PUBLIC_GQL_API_SERVER`) · edge-config CDN · 공동인증서 프로그램(사용자 PC) · 분석 도구 | 박스 밖 |

Relay 설정 정본은 `relay.config.json`(스키마 `graphql/schema/schema.graphql`, 아티팩트 `graphql/__generated__`)이다.

## 5. 이 서비스만의 주의

- **App Router 용어로 그리지 않는다.** `layout.tsx`·`page.tsx`·route group·`'use client'` 경계가 없다. "레이아웃" 은 `Page.getLayout`, 데이터는 gSSP/gSP 또는 클라이언트 Relay 다
- **가드는 `getLayout` 으로 화면마다 붙는다.** "셸이 모든 화면을 보호한다" 고 그리면 틀린다. ref 에서 `<AuthGuard` 를 직접 쓰는 page 39 · `SurveyProvider` 를 쓰는 page 20 이고, 나머지(랜딩·도움말·오류 대부분·`auth/*` 대부분·`trp`·`payment-card`·`reenactment` 등)는 가드가 없다. 조건부로 건너뛰는 화면도 있다(공동인증서 `type=result`, `error/hometax/etc` 의 `source=message`) — 새 화면은 page 파일에서 가드 유무를 직접 확인해 `tag` 에 적는다
- **catch-all 콘텐츠 라우트 3개가 팩토리 하나다.** `event/[...slug]` · `landing/[...slug]` · `home/[...content]` 가 `createContentPageServerSideProps` 를 쓴다. URL 은 어드민(BE) 데이터로 늘어나고, 깊이는 `CONTENT_PATH_MAX_DEPTH = 3`(`lib/content-page/path.ts` 11)이 넘으면 404. **파일 1개 = 화면 1개로 세지만 URL 수와는 다르다**
- **파일이 없는 `/home/*` URL 은 `home/[...content]` 가 받는다.** 예: `COMMON_PATHS.양도세환급랜딩 = '/home/capital-gain'`(`lib/constants/paths.ts` 3)과 `next.config.mjs` redirect `/capital-gain/*` 의 목적지는 page 파일이 없고 콘텐츠 catch-all 로 간다. 경로 상수를 화면 목록으로 쓰지 않는다 — `COMMON_PATHS.개인법인선택 = '/tax/refund/select-service'`(paths.ts 4)는 page 가 없다
- **조회 결과 A/B 템플릿 폴더는 화면이 아니다.** `components/tax-refund/lookup/result/apply-possible/template/v-20260211`·`v-20260527`·`v-20260820`·`v-20260909`·`v-20260915` 와 `components/tax-refund/apply/result/template/v-20260211` 은 과거 스냅샷 재현용 컴포넌트다. 화면 노드로 세지 말고, 고정 실험값은 `lib/hooks/refund/use-lookup-result-lab.ts` 19 `FIXED_LAB_ID = 'EXPERIMENT_A'` 에서 읽는다
- **설문 다음 화면은 page 가 아니라 Container 가 정한다.** `components/survey/**/*Container` 의 `router.push(SURVEY_PAGES.…)`(`lib/constants/paths.ts` 98, 한글 키). 흐름 연결선의 근거는 page 가 아니라 Container 파일이다
- **`next.config.mjs` 의 `compiler.relay` 블록은 실물과 다르다.** 스키마 `schema/schema.graphql`(26)·`schemaExtensions`(27)는 실제 위치(`graphql/schema/`)와 맞지 않는다. 그림의 Relay 설정 근거는 `relay.config.json` 으로 단다
- **Relay 는 SSR 되지 않는다.** gSSP 에서 Relay 로 가는 화살표를 그리지 않는다. 서버 쪽 데이터는 `serverGraphQLFetch` 뿐이다
- **`trp` 는 결제 링크(`?token=`), `trr` 는 알림톡 코드 진입이다.** `pages/trp/index.tsx` 는 `token` 이 없으면 `/404` 로 replace 한다. 둘 다 "알림톡 진입" 으로 묶지 않는다

## 6. 바뀌면 손볼 곳

| 변화 | 손볼 곳 |
|---|---|
| `pages/tax/**` · `pages/follow-up/**` 에 새 화면 | 탭 1 노드(3화면까지 한 노드) · 탭 0 `refund` 화면 수와 `DRILL` 라벨 · `build-bundle.py` `TABS` 설명 |
| `pages/hometax-auth/**` · `pages/error/**` 에 새 화면 | 탭 2. 오류 화면은 `createErrorPageLayout` 공통 골격 카드 확인 |
| `pages/survey/**` 에 새 화면 | 탭 3. `SurveyProvider`·`BusinessProvider`·`LocationProvider` 중 몇 겹인지, 다음 화면을 정하는 Container 를 같이 본다 |
| `pages/home/**`(index 제외) · `event` · `landing` · `help` · `simple` · `trp` · `trr` · 루트 단일 파일 | 탭 4 |
| `pages/auth/**` · `pages/menu/**` 에 새 화면 | 탭 5. `@repo/user-sign` 위임인지 앱 로컬인지 구분 |
| **새 최상위 폴더 `pages/<새 도메인>/`** | 성격이 위 다섯 중 하나면 그 탭, 아니면 탭을 새로 만들고 탭 0 화면군 노드 + `DRILL` 추가. 화면 맵(`domains`)에도 노드를 더한다 |
| 새 콘텐츠 prefix (`pages/<prefix>/[...slug].tsx`) | 탭 4 `content` 노드 · 요청 흐름(대표 화면 `event/[...slug]`)은 그대로 |
| `proxy.ts`·`next.config.mjs` 경로 규칙 변경 | 탭 0 `proxy`·`edgecfg` sources 와 카드 "진입과 셸" |
| `RefundAppContents.tsx` Provider 순서 변경 | 탭 0 `shell`·`authp`·`trackp`·`relayp`·`pagec` 와 구조도 `shell` |
| 새 데이터 관문 | 탭 0 관문 박스와 카드 "데이터 관문이 넷이다" |
| 조회 결과 템플릿 새 버전 폴더 | 탭 1 카드 "조회 결과 템플릿" 의 버전 목록 |

## 7. 읽을 지식 문서

- `docs/knowledge/bznav-web/refund-web/structure.md` · `patterns.md` · `workflows.md` · `gotchas.md`
- `docs/knowledge/bznav-web/rules.md` (refund-web: Pages Router · webpack · `gen:relay`) · `common.md` · `gotchas.md`
- `docs/diagrams/README.md` 대표 화면 표 (`pages/event/[...slug]` · 개인 간편인증)
