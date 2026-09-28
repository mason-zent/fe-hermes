# bznav care-web — 다이어그램 서비스 가이드

공통 원칙·archify 제약·검증 명령은 [`../AUTHORING.md`](../AUTHORING.md)에 있다. 이 문서는 care-web 에만 해당하는 것만 적는다. 경로는 따로 적지 않으면 `apps/care-web/` 기준이다.

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/bznav-web` (모노레포) |
| 앱 루트 | `apps/care-web/` (`src/` 없음 — `app/`·`components/`·`libs/` 가 앱 루트 바로 아래) |
| 기준 ref | `origin/prd-care` (`hermes.config.json` `apps.care-web.branch`) — 이 가이드를 쓸 때 `bdc96ff` (2026-09-21 커밋) |
| 라우터 | App Router. `pages/` 없음. route group(괄호 폴더)이 많고 **겹쳐 있다**(5절) |
| 화면 수 | **266** — `app/**/page.tsx`. 담당 서비스 중 가장 크다. `layout.tsx` 59 · Route Handler `app/api/**/route.*` 7 · `error.tsx`·`not-found.tsx` 는 세지 않는다 |

화면 수 세는 명령:

```bash
git -C repos/bznav-web ls-tree -r --name-only origin/prd-care apps/care-web/app \
  | grep -E '/page\.(tsx|ts|jsx|js)$' | wc -l      # → 266
node scripts/diagram-coverage.mjs docs/diagrams/care-web
# → 화면 파일 266 (App Router 266 · Pages Router 0) · 다이어그램에 담긴 화면 266 · 탭 10 / 누락 0 · 중복 0 · 없는 경로 0
```

`diagram-coverage.mjs` 는 `vat-rest` 를 "화면 16" 으로 찍는다. 드릴다운 노드 `submitMat` 이 자료제출 page 하나를 근거로 달고 있어서다. 그 탭이 직접 담은 화면은 15다.

## 2. 지금 있는 장

고정 커밋은 JSON `meta.repository.revision` 앞 7자다. "없음" 인 장은 `repository`·`sources` 가 없어 `check-diagrams.mjs` 가 근거를 점검하지 못한다.

| 종류 | 원본 → 결과 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|---|
| 구조 | `bznav-care-web.architecture.json` → `bznav-care-web.html` | `bdc96ff` | 노드 14 · 연결 11. route group·Provider·CareAuthGuard·Relay·CARE_PATHS·공유 패키지 |
| 화면 맵 | `bznav-care-web.domains.architecture.json` → `bznav-care-web.domains.html` | 없음 | `app/` 최상위 도메인 15노드와 도메인별 page 수. 부제는 "264개"라서 지금 수(266)와 다르다(보고 참조) |
| 요청 흐름 | `bznav-care-web.sequence.json` → `bznav-care-web.sequence.html` | 없음 | 대표 화면 `app/(my-info)/my-book` — CareAuthGuard → 렌더 뒤 구독 상태 이동 → Relay 장부 조회 · 필터 변경 (참여자 9 · 메시지 14) |
| 화면 상태 | `bznav-care-web.lifecycle.json` → `bznav-care-web.lifecycle.html` | 없음 | 같은 `my-book` 의 상태 8. **2026-09-28 목록에서 뺐다** — 새로 만들지 않는다 |
| 심층 번들 | `care-web/build-bundle.py` → `care-web/care-web-architecture.html` | `bdc96ff` (첫 탭에서 읽음) | 탭 10장. 목록 카드 링크 "심층 · 266화면" (`scripts/build-diagram-index.mjs`) |

## 3. 심층 탭 구성

Provider 가 14겹이라 셸을 탭 1 로 따로 뺐다(`AUTHORING.md` 4절).

| 탭 | 파일 | 도메인 경계 (경로 접두사, `app/` 기준) | 화면 | 노드 · 연결 |
|---|---|---|---|---|
| 0 상세 | `care-web-detail.architecture.json` | 앱 전체. 진입 → 셸 → 가드 → 화면군 → 훅·스토어 → 관문 4 → 외부 | 0 (대표 인용) | 26 · 23 |
| 1 루트 셸 Provider | `provider-chain.architecture.json` | `app/layout.tsx` · `app/GlobalProvider.tsx` · `libs/provider/**` | 0 | 12 · 11 |
| 2 부가세 · 전체 | `vat-rest.architecture.json` | `vat/**` 에서 `vat/submit-material/**` 를 뺀 것 — `(status)` · `estimated-tax` · `history` · `refund-account` · `service-connect` · `tax-result` | 15 | 8 · 7 |
| 3 부가세 · 자료제출 | `vat-submit-material.architecture.json` | `vat/submit-material/**` | 35 | 15 · 12 |
| 4 종소세 · 자료제출 | `global-income-submit-material.architecture.json` | `global-income/(auth)/(submit-material)/**` | 43 | 16 · 14 |
| 5 급여 | `payroll.architecture.json` | `payroll/**` (`(part-time)` 10 포함) | 28 | 11 · 9 |
| 6 온보딩 (auth) | `auth-onboarding.architecture.json` | **최상위** `(auth)/**` — `(homeTax)` · `billing` · `complete` · `four-insurance` · `taxagentinput` | 30 | 12 · 11 |
| 7 게이트웨이 · 파일 | `gateway-file.architecture.json` | `(gateway)/**` 16 · `(external-file-download)/**` 11 | 27 | 10 · 9 |
| 8 마이 · 랜딩 · 요금제 | `my-landing.architecture.json` | `(my-info)/**` 10 · `(landing)/**` 8 · `pricing/**` 7 · `user-status/**` 9 | 34 | 13 · 12 |
| 9 그 외 54화면 | `care-rest.architecture.json` | `global-income/**` 에서 `(submit-material)` 을 뺀 13 · `(login)` 4 · `(payment)` 3 · `(kakaoTalk-notification)` 2 · `additional-expense` 8 · `business-card` 4 · `card-expense` 1 · `certificate` 3 · `cs-center` 2 · `service-maintenance` 1 · `startup-check` 3 · `test` 2 · `year-end-tax` 8 | 54 | 20 · 19 |

`build-bundle.py` 의 `DRILL`: 탭 0 `shell`→1 · `vat`→2 · `gincome`→4 · `payroll`→5 · `onboard`→6 · `etcscreen`→8 / 탭 2 `submitMat`→3. 탭 7·9 로 들어가는 드릴다운은 없다(탭 버튼으로만 간다).

경계가 헷갈리는 곳:

- **`(auth)` 가 두 군데 있다.** 최상위 `app/(auth)/**` 는 탭 6(온보딩), `app/global-income/(auth)/**` 는 종소세(탭 4 또는 9)다. 괄호 이름만 보고 탭 6 에 넣지 않는다
- **종소세 56화면은 두 탭으로 갈린다.** `(submit-material)` 43 은 탭 4, 나머지 13(`flowstatus`·`estimated-tax`·`history`·`payment-agree`·`refund-account`·`tax-result`·`(auth)/page.tsx`·`global-income/billing`)은 탭 9. 탭 0 `gincome` 드릴다운은 탭 4 로만 간다
- 부가세도 `submit-material/**` 만 탭 3, 나머지는 탭 2

## 4. 탭 0 에 들어갈 실제 파일

| 층 | 파일 | 무엇 |
|---|---|---|
| 진입 | `proxy.ts` | Next 16 미들웨어 파일명. `matcher` 가 `api`·`_next/static`·`_next/images`·`favicon`·`images`·`lotties`·`logo`·`care-resource`·`pdf`·`vatpdf` 를 뺀다(12–14) — **Route Handler 는 proxy 를 지나지 않는다**. `composeMiddleware(...)`(20–28) 7종 |
| 진입 | `libs/hoc/composeMiddleware.ts` · `libs/hoc/with*.ts` 7개 | `reduceRight` 라 **인자 앞쪽이 먼저** 돈다: 점검 → 랜딩 차단 → 플랫폼 → returnUrl → A/B → vat 기간 → pricing |
| 진입 | `next.config.mjs` | noindex 헤더(`/`·`cs-center`·크롤러 자원 외 전부, 58–63) · 보안 헤더 · rewrite `/pdf/*`→GCS · `/vatpdf/*`→CloudFront(80–91) · `compiler.relay`(19–27) |
| 셸 | `app/layout.tsx` | 서버 루트. `await getServerWorkingPlatform()`(59)로 **전 라우트 동적 렌더**. `GlobalProviders` → `Toaster` → Registry 4(카카오픽셀·틱톡·GA·헥토, 64–69) |
| 셸 | `app/GlobalProvider.tsx` | `'use client'`. 바깥 `GlobalErrorBoundary` + 형제 `InitUtm`, `SSR_PATHS`(29) 밖이면 deprecated `ToastProvider` 한 겹 더(77). 그 안 **Provider 14겹**(39–71): PageNavigationEvent → CareAuth → CareEventTracking → Relay → CareAuthSign → EventLogger → Sidebar → GlobalAtom → Dialog → Tooltip → NiceModal → CareUserInfo → Cache → Splash. `AppSidebar`·`InitChannelTalk` 은 형제 |
| 셸 | `libs/provider/*.tsx` 7개 · `components/common/app-side-bar/sidebar.tsx` · `components/common/splash/SplashWrapper.tsx` | 각 Provider 구현 (탭 1 에서 펼친다) |
| 가드 | `components/common/auth/CareAuthGuard.tsx` | `@repo/user-session` `AuthGuard` 래핑 + 마운트 시 `saveReturnUrl`(14–24) + `logoutPagePath = CARE_PATHS.로그인 + '?' + query`(26) |
| 가드 | `CareAuthGuard` 를 쓰는 layout 14개 | `(auth)` · `(gateway)/landing-gateway` · `(kakaoTalk-notification)/add-manager` · `(my-info)` · `additional-expense` · `business-card` · `certificate` · `global-income` · `global-income/(auth)` · `payroll` · `pricing` · `startup-check/input` · `vat` · `year-end-tax/[year]` (각 `layout.tsx`) |
| 관문 | `libs/provider/relayProvider.tsx` · `libs/relay/relayEnvironment.ts` · `libs/relay/fetchRelayFactory.ts` · `libs/relay/fetchGraphQLFactory.ts` | Relay. `useAuthContext()` 토큰·세션 id → `useEnvironment` → `fetchRelayFactory` 가 `fetchGraphQLFactory` 로 전송(`NEXT_PUBLIC_GQL_API_CARE_SERVER`, `X-Zent-Session-Id`·`X-Zent-Client-Session-Id`) |
| 관문 | `app/certificate/utils/requestCertificates.ts` · `app/(external-file-download)/hooks/useFileDownloadExternalBase.ts` · `app/payroll/hooks/useDownloadPayroll.ts` | REST · 파일 |
| 관문 | `app/vat/service-connect/(connect)/connect-account/hooks/useGetSocketStatus.ts` | socket.io — 부가세 계정연결 전용 |
| 관문 | `app/api/**/route.*` 7개 | Route Handler — `delivery-mall-maintenance` · `hometax-disability` · `my-account-result/{success,cancel}`(PG 콜백) · `online-mall-maintenance` · `partner-list` · `service-maintenance-banner`. 화면으로 세지 않는다 |
| 외부 | Care GraphQL API · SSO·CI(`@repo/user-session`·`user-sign`) · Firebase 운영 설정(점검·허용 경로·A/B) · Notion(`cs-center`) · 분석 도구 | 박스 밖 |

Relay 설정 정본은 `relay.config.json`(스키마 `schema/schema-care.graphql`, 아티팩트 `__generated__/` — 앱 루트, 미커밋)이다. 생성 명령은 `relay`(refund 는 `gen:relay`).

## 5. 이 서비스만의 주의

- **route group 괄호는 URL 에 없다.** 노드 라벨·source label 은 URL(`/delegation`, `/my-book`)로, `sources.path` 는 괄호가 든 실제 경로로 쓴다. 괄호가 겹친 곳이 많다 — `(auth)/(homeTax)/delegation`, `global-income/(auth)/(submit-material)`, `vat/submit-material/(submitMaterial)/(category|connection|main)`, `(landing)/(performance-landing)`, `payroll/(part-time)`, `pricing/(experiment|form)`, `vat/(status)`, `four-insurance/(orgList)`
- **폴더명 kebab-case(NEWCARE-649)는 URL 세그먼트까지 바꾸지 않았다.** ref 의 NEWCARE-649 커밋에서 폴더 개명은 `libs/eventLogger`→`libs/event-logger`, `components/common/eventLogger`→`components/common/event-logger` 둘이고 나머지는 import 경로 정리다. 라우트 폴더에는 camelCase 가 그대로 있다 — `alreadyFinish` 3 · `alreadyComplete` 2 · `bankMaintenance` · `(homeTax)` · `(submitMaterial)` · `(orgList)` · `(simpleAuth)` · `(nonStage)` · `(kakaoTalk-notification)`. 같은 뜻의 폴더도 `alreadyFinish` 와 `four-insurance/already-finish` 가 섞여 있다. **그림에 경로를 옮겨 적을 때 kebab-case 로 "고쳐" 쓰지 않는다** — 경로가 없어져 근거 검사가 깨진다
- **`CARE_PATHS` 는 한글 키다**(`constants/paths.ts`). 숫자로 시작하는 키는 `CARE_PATHS['4대보험위임동의_사업장선택']`. 도메인별 `*_PATHS` 객체(`PRICING_PATHS` 등)가 같은 파일에 따로 있다. **경로 상수 = 화면이 아니다** — `CARE_PATHS.프로모션_첫달_무료 = '/promotion/first-month-free'`(47)는 page 가 없고 미들웨어가 `/` 로 보낸다
- **파일이 있어도 열리지 않는 화면이 있다.** `withLandingRedirectMiddleware` 의 `BLOCKED_LANDING_PATHS` 가 `(performance-landing)` 의 `single-person-business` · `beauty-industry` · `food-industry` · `mail-order-industry` · `income-tax` 를 `/` 로 redirect 한다. 열리는 퍼포먼스 랜딩은 `/premium` 과 `/events`(mktEvent 빌더 랜딩) 둘이다. 화면 노드에 "차단" 을 표시한다
- **가드는 layout 14개뿐이다.** 전역 Provider 가 보호하지 않는다. `(landing)` · `(login)` · `(payment)` · `(external-file-download)` · `cs-center` · `user-status` · `service-maintenance` · `test` 와 `(gateway)` 중 `landing-gateway` 밖은 가드가 없다. `global-income` 은 `layout.tsx` 와 `(auth)/layout.tsx` 에 **두 번** 걸린다. `(auth)/layout.tsx` 는 신고기간 수임 차단 분기(25–26)를 가드보다 먼저 탄다
- **Provider 14겹의 순서가 의미를 갖는다.** CareAuth → Relay(토큰을 꺼내 환경에 싣는다) → … → CareUserInfo(`fetchQuery(meQuery)` 라 Relay 안쪽). `GlobalErrorBoundary`·`InitUtm`·조건부 `ToastProvider`·`AppSidebar`·`InitChannelTalk` 은 14겹에 넣지 않는다
- **`SSR_PATHS = ['/', '/cs-center']`**(`app/GlobalProvider.tsx` 29)만 deprecated `ToastProvider` 를 벗는다. 셸 그림에서 이 분기를 빼면 "모든 화면이 같은 셸" 로 잘못 읽힌다
- **도메인 전용 파일은 라우트 옆에 있다.** `app/<도메인>/{components,hooks,graphql,store,constants,utils,types,provider}`. 훅·스토어 노드의 근거는 루트 `hooks/`·`store/` 보다 라우트 폴더에서 먼저 찾는다. `/graphql/` 경로 파일은 236개 흩어져 있다
- **이름이 같은 화면 세트가 도메인마다 복제돼 있다.** card-expense 세트가 종소세 자료제출(`global-income/(auth)/(submit-material)/card-expense/**` 8)과 부가세 자료제출(`vat/submit-material/(submitMaterial)/(category)/card-expense/**` 7)에 각각 있고, 최상위 `app/card-expense/download-guide`(탭 9)는 또 다른 화면이다. 한쪽 노드 문장을 다른 탭에 복사하지 않고 그 도메인 파일로 다시 확인한다
- **`billing/refactor/`(17 파일)는 page 가 없다.** `(auth)/billing/refactor/**` 는 컴포넌트만 있어 화면으로 세지 않는다. 신구 UI 중 어느 쪽이 그려지는지는 `billing/**/page.tsx` 의 import 로 확인한다

## 6. 바뀌면 손볼 곳

| 변화 | 손볼 곳 |
|---|---|
| `vat/submit-material/**` 에 새 화면 | 탭 3. 탭 0 `vat` 화면 수 · 탭 2 `submitMat` 라벨 |
| `vat/**`(자료제출 밖) 에 새 화면 | 탭 2 |
| `global-income/(auth)/(submit-material)/**` 에 새 화면 | 탭 4. 탭 0 `gincome` 화면 수 |
| `global-income/**`(자료제출 밖) 에 새 화면 | 탭 9. 탭 0 `gincome` 화면 수 |
| `payroll/**` | 탭 5 |
| 최상위 `(auth)/**` | 탭 6 |
| `(gateway)/**` · `(external-file-download)/**` | 탭 7 |
| `(my-info)/**` · `(landing)/**` · `pricing/**` · `user-status/**` | 탭 8 |
| 그 밖의 기존 최상위 폴더 · 루트 단일 폴더 | 탭 9. 54 화면이 60 을 넘으면 도메인 경계(예: `year-end-tax`·`additional-expense`)로 한 장을 떼어낸다 |
| **새 최상위 폴더·route group** | 성격이 맞는 탭이 있으면 그 탭, 없으면 탭 9. 20화면을 넘으면 새 탭 + 탭 0 화면군 노드 + `DRILL`. 화면 맵(`domains`)에도 노드를 더한다 |
| 새 `layout.tsx` 에 `CareAuthGuard` | 탭 0 `guard` 문장("layout 14개") · 카드 "경계가 두 겹" · 요청 흐름 인증 경계 |
| `proxy.ts` 미들웨어 추가·재배치 · `BLOCKED_LANDING_PATHS` 변경 | 탭 0 `proxy` sources·카드 · 탭 8 랜딩 노드의 "차단" 표시 |
| `GlobalProvider.tsx` Provider 추가·순서 변경 · `SSR_PATHS` 변경 | 탭 1 전부(번호 매긴 라벨 포함) · 탭 0 `shell` · `DRILL` 라벨 "Provider 14겹" |
| 새 Route Handler · 새 데이터 관문 | 탭 0 `nextapi`("7개") 또는 관문 박스 · 카드 "데이터 관문이 넷이다" |
| 폴더 개명(kebab-case 추가 개명 등) | `check-diagrams.mjs` 가 이름 변경을 잡는다 → sources 와 문구의 옛 경로를 같이 바꾼다(`AUTHORING.md` 8절) |

## 7. 읽을 지식 문서

- `docs/knowledge/bznav-web/care-web/structure.md` · `patterns.md` · `workflows.md` · `gotchas.md`
- `docs/knowledge/bznav-web/rules.md` (care-web: 순수 로직·atom 변경 시 테스트, 유일한 `type-check`·`test:unit`) · `common.md` · `gotchas.md` (NEWCARE-633·649 이력)
- `docs/diagrams/README.md` 대표 화면 표 (`app/(my-info)/my-book`)
