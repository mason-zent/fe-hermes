# web-op 다이어그램 가이드

공통 원칙·심층 표준·검증은 [`../AUTHORING.md`](../AUTHORING.md). 이 문서는 이 레포에만 해당하는 것만 적는다. 작성 기준 `origin/prd` `4ac5be7` (2026-09-16).

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/web-op` (Z-Enterprise 운영 웹 — 판매자센터·서류 제출·직원 인증서) |
| 앱 루트 | 레포 루트. **라우트는 루트의 `app/`**, 레이어 코드는 `src/`(`hermes.config.json` `appDir: app`, `srcDir: src` — `src/app` 이 아니다) |
| 기준 ref | `origin/prd` |
| 라우터 | Next 16.2 App Router(Turbopack). `middleware.ts`·`proxy.ts` 없음. **`app/page.tsx` 없음**(루트 URL 은 화면이 아니다) |
| 화면 수 | **17** — `app/sales/**` 13 · `app/documents/**` 3 · `app/employee/**` 1 |
| Route Handler | **30** — `app/api/**/route.ts` (+ `app/api/employee/_proxy.ts`) |
| 포트 | 3000 (`package.json` `dev: next dev`, 포트 지정 없음 = Next 기본값) |

```bash
git -C repos/web-op ls-tree -r --name-only origin/prd app | grep -E '/page\.(tsx|ts|jsx|js)$' | wc -l      # 17
git -C repos/web-op ls-tree -r --name-only origin/prd app/api | grep -E '/route\.ts$' | wc -l            # 30
```

## 2. 지금 있는 장

| 파일 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|
| `web-op.architecture.json` | `4ac5be7` | 구조 — sales·documents·employee → containers → components / gateway → app/api → backend service → repository → 외부, 옆에 useSalesAuthStore·SalesJwtGenerator·Prettier |
| `web-op.sequence.json` | 없음(`meta.repository` 없음) | 요청 흐름 — 대표 화면 `app/documents/[key]` (gateway 가 외부를 직접 부르는 길과 `/api` 를 거치는 길) |
| `web-op.lifecycle.json` | 없음 | 화면 상태. 2026-09-28 목록에서 뺐다 |
| 화면 맵(domains) | **없음** | — |
| 심층 | **없음** | — |

## 3. 심층 탭 구성 (제안)

화면은 17개지만 이 레포의 무게는 **화면 뒤**(BFF 30개 · 인증 세 갈래 · employee 한 화면 안의 상태 분기)에 있다. 화면 전수 1장 + 흐름 4장으로 간다.

| 탭 | 파일(제안) | 범위 | 화면 |
|---|---|---|---|
| 0 | `web-op-detail.architecture.json` | 상세 — 4절 뼈대. 전수 대조 제외 | — |
| 1 | `screens.architecture.json` | `app/**/page.tsx` 전부. 화면마다 인증 방식(`SalesContainer` 가드 · 링크 키 · 없음)을 `tag` 로 | **17** |
| 2 | `bff-routes.architecture.json` | `app/api/**/route.ts` 30 → `src/backend/service/**` 5 → `src/backend/repository/**` 3 / `_proxy.ts` | 0 |
| 3 | `sales-auth.architecture.json` | 판매자 인증: `src/useCases/SalesAuthUseCase.ts` · `src/gateway/sales/**` · `src/store/useSalesAuthStore.ts` · `src/utils/SalesJwtGenerator.ts` · `src/containers/sales/{login,signup,mfaSetup,passwordReset}` | 0 |
| 4 | `documents.architecture.json` | 서류 제출: `src/containers/documents/**` · `src/components/documents/**` · `src/hooks/documents/**` · `src/gateway/documents/**` | 0 |
| 5 | `employee.architecture.json` | 직원 인증서: `app/employee/[key]/EmployeeKeyClient.tsx` · `src/containers/employee/**` · `src/hooks/employee/**` · `app/api/employee/**` | 0 |

탭 2~5 에 page 파일을 `sources` 로 달면 탭 1 과 중복으로 센다. page 는 탭 1 에만 두고, 흐름 탭은 container·hook·gateway·route 를 근거로 한다. 탭 수를 줄이려면 4·5(둘 다 링크 키로 들어오는 대고객 화면)를 한 장으로 합쳐도 된다.

**탭 1 화면 17 — 인증 방식**
- `SalesContainer`(`src/containers/sales/index.tsx`, store subscribe → `/sales/login`)로 감싼 7: `sales/page.tsx`, `child`, `customers`, `customers/[id]`, `salesmans/[salesUserId]/customers`, `upload`, `url`
- 가드 없이 열리는 sales 6: `login`(localStorage 에 `salesUser` 있으면 `/sales`), `signup`, `signup/done`, `mfa-setup`, `password-reset`, `auth/[key]`(SSO 딥링크)
- 링크 키 4: `documents/[key]`, `documents/status/complete`, `documents/status/expired`, `employee/[key]`

**탭 2 BFF 30 — 분류 (route 파일을 읽어 센 값)**
- service 경유 25: `AuthService`(authorize 1) · `DocumentRequestLinkService`(documents 2) · `DocumentsService`(taxpayers 2 · upload 1 · pipedrive 1 — pipedrive 는 `SalesDataService` 도) · `SalesAuthService`(sales/auth 8 + channels/[channelId] 1) · `SalesDataService`(sales 데이터 9)
- 그중 `ApiResponse`(controller) 로 감싼 2: `app/api/documents/link/route.ts`, `app/api/taxpayers/[refundId]/documents/route.ts`
- `_proxy` 직행 3: `app/api/employee/[key]/route.ts`, `…/attempt/route.ts`(`proxyFetchStream`), `…/reissue/route.ts`
- 독립 2: `app/api/notion-guide/route.ts`(`runtime = "nodejs"`), `app/api/ping/route.ts`
- 세그먼트 설정: `runtime = "edge"` 는 `app/api/upload/route.ts` 하나

**탭 3 판매자 인증 — 확인한 연결**
- 클라이언트 `SalesAuthApiClient`·`SalesDataApiClient`(둘 다 `BaseApiGateway` 상속)는 **`NEXT_PUBLIC_SERVER_ZENT_API_URL` 을 앞에 붙여 zent API 를 직접** 부른다(`SalesAuthApiClient.ts:9` `${apiUrl}/sales/auth`, `SalesDataApiClient.ts:12` `${apiUrl}/sales/partners/summary`). 이 레포의 `/api/sales/**` 를 부르는 클라이언트 코드는 `SalesAuthApiClient.ts:111` 의 `/api/sales/auth/sso` 하나뿐이다
- 서버 쪽 `SalesExternalApiGateway` 도 같은 env 로 zent API 를 부른다(`src/backend/repository/external/SalesExternalApiGateway.ts:12`). 즉 `/api/sales/**` 18개 중 sso 를 뺀 17개는 **레포 안 호출자가 없다** — 외부(콘솔 등)에서 부르는지, 죽은 경로인지는 확인 필요. 탭 2·3 에서 "클라이언트 → BFF → zent" 로 일반화해 그리지 않는다
- JWT: `src/utils/SalesJwtGenerator.ts`(ES512, `NEXT_PUBLIC_SALES_PRIVATE_KEY` 가 클라이언트 번들에 실린다), 토큰은 `localStorage["salesUser"]`

**탭 4 서류 제출 — 근거 파일**
- `src/containers/documents/DocumentSubmissionContainer.tsx` → `useDocumentFiles` · `useSubmitDocuments`(`src/hooks/documents/`) · `useDocumentRequirementHook`(`src/hooks/`) → `DocumentsRequirementGateway`(A 계통, zent `/documents/{key}`)
- 업로드 `src/gateway/documents/DocumentUploadGateway.ts`(B 계통 axios, zent `/documents/auth` → `/documents/upload`), 미리보기 `DocumentFileGateway.ts`, 상태 반영 `DocumentPipedriveGateway.ts` → `/api/pipedrive/deal/[dealId]` → `DocumentsService` → Pipedrive
- 안내 `src/components/documents/submission/DocumentGuideModal.tsx` → `/api/notion-guide` → notion-client

**탭 5 직원 인증서 — 근거 파일**
- 분기 허브 `app/employee/[key]/EmployeeKeyClient.tsx`: 카카오 인앱이면 `KakaoFallbackGuide`, 아니면 `fetch('/api/employee/<key>')` 결과 상태(`COLLECT_COMPLETED`·`AUTH_COMPLETED` / `*_FAILED` / `AUTH_ATTEMPTED`)로 `EmployeeCertComplete`·`EmployeeCertFailed`·`EmployeeContainerByKey`(`indexByKey.tsx`) 등으로 갈린다
- long-poll: `src/hooks/employee/useCertFlowByKey.ts:134-137` → `/api/employee/<key>/attempt` → `_proxy.ts` `proxyFetchStream`(본문을 파싱하지 않고 스트림 그대로 — `_proxy.ts:65` 주석)
- 서버 전용 키 `EMP_INS_NOTI_API_KEY` 는 `_proxy.ts` `getApiKey()` 에서만

## 4. 탭 0 에 들어갈 실제 파일

| 칸 | 경로 (origin/prd) | 확인한 것 |
|---|---|---|
| 진입 | `next.config.js` | `basePath`(+`NEXT_PUBLIC_BASE_PATH` 주입), `typescript.ignoreBuildErrors: true`, `transpilePackages`(bznav-fe-ui·common-utils), Turbopack SVGR, 로컬 링크 시 `turbopack.root` 상향. rewrite 없음. **middleware 없음** |
| 셸 | `app/layout.tsx` | `bznav-fe-ui/globals.css` + `MixpanelProvider` 한 겹. 세션 Provider 없음 |
| 셸(구역) | `app/documents/layout.tsx`(`"use client"`) · `app/employee/layout.tsx` | 둘 다 `DialogProvider` + `Toaster`(bznav-fe-ui). sales 에는 layout 이 없다 |
| 가드 | `src/containers/sales/index.tsx` | **layout·page 가드가 아니라 클라이언트 컨테이너 가드**. `useSalesAuthStore.subscribe` 로 `userInfo` 가 비면 `/sales/login` |
| 가드(없음) | documents·employee | 링크 키가 접근권. 서버 검증은 `DocumentRequestLinkService`·`_proxy.ts` 뒤에서 |
| 화면 셸 | `src/containers/**` | sales 는 레이아웃·가드, documents·employee 는 화면 본체(도메인마다 역할이 다르다) |
| 관문(클라이언트) | `src/gateway/**` 10 | A `BaseApiGateway` 상속 · B axios 직접(documents) · C 타입만(`EmployeeGateway.ts`) + employee 는 `fetch` 직접 |
| 관문(BFF) | `app/api/**/route.ts` 30 · `app/api/employee/_proxy.ts` | 3절 탭 2 분류 |
| 관문(서버) | `src/backend/controller/ApiResponse.ts` · `src/backend/service/**` · `src/backend/repository/**` | 서비스 5 · repository 3(`RedisRepository`, `external/PipedriveApiGateway`, `external/SalesExternalApiGateway`) |
| 외부 | zent API(`NEXT_PUBLIC_SERVER_ZENT_API_URL`) · Pipedrive · Redis(`@vercel/kv`) · Vercel Blob · 고용보험 V2 · Notion · Mixpanel | — |

## 5. 이 서비스만의 주의

- **BRICS 콘솔 3개와 스택이 다르다** — NextAuth·Orval·`__generated__` 가 없다. `@zent-auth` 도 없다. 콘솔 가이드의 관문(Orval → orval-fetcher) 뼈대를 가져오지 않는다
- **인증이 세 갈래다**: 판매자 자체 JWT(클라이언트 컨테이너 가드) · 링크 키(documents·employee) · 서버 키(employee `_proxy`, 콘솔용 `ApiResponse` Bearer). 가드 노드를 하나로 그리지 않는다
- **클라이언트 gateway 의 대부분은 BFF 를 거치지 않는다**(3절 탭 3). 레포 안에서 실제로 불리는 BFF 는 employee 3 · `pipedrive/deal` · `notion-guide` · `sales/auth/sso` 정도다. 나머지 route 의 호출자는 확인 필요
- `BaseApiGateway` 는 catch 에서 `alert` 후 `undefined` 를 돌려준다. 이 계통 연결에 "에러 전파" 를 그리지 않는다
- **employee 는 화면 1개지만 상태 화면이 여러 개**다. 화면 수(1)와 컨테이너 수(`src/containers/employee/` 8파일)를 섞지 않는다
- 경로 오타가 코드에 그대로 있다: `statstics`(`app/api/sales/statstics/**`, `salesmans/[salesUserId]/statstics`). 고치지 말고 그대로 적는다
- Next 16 이라 route 의 `params` 가 Promise 다(`await context.params`). 시퀀스 라벨에 반영한다
- 포맷이 다른 레포와 반대(세미콜론·큰따옴표·80칸)라 코드 인용을 옮길 때 원문 그대로 둔다

## 6. 바뀌면 손볼 곳

- 새 화면 → 탭 1 + 인증 방식 `tag`. sales 화면이면 `SalesContainer` 로 감쌌는지 확인
- 새 `app/api/**/route.ts` → 탭 2 분류(service · controller · proxy · 독립)에 넣고 탭 0 숫자(30) 갱신. 클라이언트 호출자가 생기면 해당 흐름 탭에 연결
- `src/backend/service/` 새 서비스 → 탭 2 + 탭 0 서버 관문
- `src/gateway/` 새 gateway → 계통(A·B·C) 판정 후 탭 0 + 해당 흐름 탭
- `src/useCases/`·`src/store/useSalesAuthStore.ts`·`SalesJwtGenerator` 변경 → 탭 3
- `src/containers/documents/**`·`src/hooks/documents/**` → 탭 4, `src/containers/employee/**`·`src/hooks/employee/**`·`app/api/employee/**` → 탭 5
- 새 도메인(`app/<domain>/`)이 생기면 탭 1 + 흐름 탭 하나를 새로

## 7. 읽을 지식 문서

- `docs/knowledge/web-op/structure.md` — 레이어별 파일 수 · 외부 시스템 · env 키 이름
- `docs/knowledge/web-op/patterns.md` — P1 도메인별 컨테이너 역할 · P3 gateway 세 계통 · P6 Route Handler · P7 서버 시크릿 · P8 인증
- `docs/knowledge/web-op/gotchas.md` — 개인키 번들 · alert-and-swallow · 레이어 위반 실측 · `_proxy.ts:65`
- 레포 원문 `app/documents/README.md` · `app/employee/README.md` · `app/sales/README.md`(origin/prd 에 있다)

지식 문서·다이어그램과 코드가 다른 곳(그릴 때 코드를 따른다):
- `patterns.md:51` — "`SalesAuthApiClient` → `/api/sales/auth/signin` → `SalesAuthService`" → 클라이언트는 `${NEXT_PUBLIC_SERVER_ZENT_API_URL}/sales/auth` 를 직접 부른다(`src/gateway/sales/SalesAuthApiClient.ts:9`)
- `workflows.md:31` — "`SalesDataApiClient → /api/sales/statstics|summary|settlement → SalesDataService`" → 클라이언트는 zent `/sales/partners/*` 를 직접 부른다(`SalesDataApiClient.ts:12` 외)
- `structure.md:8-10` — `app/sales/** (14)` · `documents (5)` · `employee (4)` 는 **파일 수**다(README·layout·EmployeeKeyClient 포함). 화면(page.tsx)은 13 · 3 · 1. 구조도 `web-op.architecture.json:79,92,105` 의 부제 "판매자센터 14 · 서류 제출 5 · 인증서 4" 도 화면 수로 읽힌다
- `structure.md:19` — hooks "documents 3 / employee 6 / 루트 3" → employee 7(`useCertFlow` 포함), 합계 13
- 구조도 `web-op.architecture.json` 연결 `gateway → route (BFF)` 는 대부분의 sales·documents 호출과 맞지 않는다(위 두 줄)
