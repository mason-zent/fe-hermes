# client-brics-refund 다이어그램 가이드

공통 원칙·심층 표준·검증은 [`../AUTHORING.md`](../AUTHORING.md). 이 문서는 이 레포에만 해당하는 것만 적는다. 작성 기준 `origin/prd` `1eb6e63` (2026-09-14).

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/client-brics-refund` (BRICS 환급 운영 콘솔) |
| 앱 루트 | 레포 루트. 라우트는 `app/` (`hermes.config.json` `appDir: app`) |
| 기준 ref | `origin/prd` |
| 라우터 | Next 15.5 App Router. `middleware.ts` 없음. 라우트 그룹·병렬 라우트 없음 |
| 화면 수 | **52** — `app/refund-service/**` 49 + 시스템 3(`app/page.tsx`, `app/logout/page.tsx`, `app/unauthorized/page.tsx`) |
| 포트 | 13002 (`package.json` `dev: next dev -p 13002`) |

```bash
git -C repos/client-brics-refund ls-tree -r --name-only origin/prd app | grep -E '/page\.(tsx|ts|jsx|js)$' | wc -l        # 52
git -C repos/client-brics-refund ls-tree -r --name-only origin/prd app/refund-service | grep -E '/page\.(tsx|ts|jsx|js)$' | wc -l   # 49
```

## 2. 지금 있는 장

| 파일 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|
| `client-brics-refund.architecture.json` | `1eb6e63` | 구조 — layout 가드 → page → Containers → Orval 생성물 → orval-fetcher → 환급 API, 옆에 useDialog·lib/swr·brics-fe-ui |
| `client-brics-refund.domains.architecture.json` | 없음(`meta.repository` 없음) | 화면 맵 — `app/refund-service` 도메인 14개 · 49화면 · layout 가드 25개 |
| `client-brics-refund.sequence.json` | 없음 | 요청 흐름 — 목록 화면 한 번(가드 · 검색 필수 안내 · unmask 분기) |
| `client-brics-refund.lifecycle.json` | 없음 | 화면 상태. 2026-09-28 목록에서 뺐다 |
| 심층 | **없음** | — |

## 3. 심층 탭 구성 (제안)

49화면이 `app/refund-service/<도메인>/` 14개에 나뉘어 있다. 도메인 크기가 고르지 않아(광고 13 · 비즈메시지 10 · 나머지는 1~4) 도메인마다 탭을 만들면 장이 너무 작다. 아래처럼 **경로 접두사 단위로 묶는다**.

| 탭 | 파일(제안) | 도메인 경계 | 화면 |
|---|---|---|---|
| 0 | `refund-detail.architecture.json` | 상세 — 4절 뼈대. 전수 대조 제외 | — |
| 1 | `ad-message.architecture.json` | `app/refund-service/advertisement/**` 13 + `app/refund-service/business-message/**` 10 | 23 |
| 2 | `refund-user.architecture.json` | `refund-overview/**` 2 · `user/**` 1 · `simple-apply/**` 1 · `hometax-block/**` 3 (모두 `app/refund-service/` 아래) | 7 |
| 3 | `ops-content.architecture.json` | `partner/**` 3 · `card-register/**` 2 · `content/**` 4 · `research/**` 2 · `emergency/**` 2 · `bznav-app/**` 1 · `pipe-drive/**` 1 · `qa/**` 4 (모두 `app/refund-service/` 아래) + 시스템 3 | 22 |

합계 23 + 7 + 22 = 52.

- **탭 1** 은 마케팅 노출(광고 구좌·랜딩 모달·프로모션·랜딩 SEO·CPA)과 발송(CRM·이력·템플릿·자동 CRM)을 한 장에 둔다. 깊게 그릴 곳은 둘이다
  - 랜딩 SEO ZIP 임포트: `advertisement/landing-seo/_lib/landing-seo-zip.ts` → `_lib/landing-seo-api.ts` → `_components/ClaudeSeoZipImportButton.tsx`·`ClaudeSeoGenerateButton.tsx`·`PreviewDialog.tsx`
  - CRM CSV 대량 업로드: `business-message/crm/_components/FileUploader.tsx`(검증) → `lib/crmListUploadHelper.ts`(presign → XHR PUT → complete)
- **탭 2** 는 화면이 7개뿐이지만 **개인정보 unmask 흐름**을 여기서 깊게 그린다. `UnmaskToggle` 을 쓰는 화면 5곳 중 4곳(`refund-overview/[refundType]`, `user/all`, `simple-apply/create-link`, `hometax-block/wait-screen-log/[logId]`)이 이 탭에 있다(나머지 1곳은 탭 1 의 `advertisement/promotion`). 근거 파일: `app/_components/UnmaskToggle.tsx`, `app/_components/PrivateAccessDialog.tsx`, `app/_lib/hooks/useUnmaskedEndpoints.ts`, `app/_lib/privateAccess.ts`, `app/_lib/usePrivateAccessState.ts`. `hometax-block` 은 Orval 대신 `hometax-block/_hooks/*.ts` 수동 훅 6개(`useSWR` + `AXIOS_INSTANCE`)라 관문이 다르다
- **탭 3** 은 대부분 `partner/discount` 골격(layout · page · create · edit · Containers · ListTable · EditForm)의 복제다. 골격은 한 번만 크게 그리고 나머지는 화면 노드로 나열한다

대안: 탭 2 가 작다고 느껴지면 탭 2·3 을 합친 29화면 한 장도 경계상 문제없다. 그 경우 unmask 는 탭 0 에서 별도 노드로 뺀다.

## 4. 탭 0 에 들어갈 실제 파일

| 칸 | 경로 (origin/prd) | 확인한 것 |
|---|---|---|
| 진입 | `next.config.mjs` | `basePath`·`distDir: './dist'`·SVGR·`withZentDevkit`. rewrite·redirect 없음. **middleware 없음** |
| 진입 | `app/page.tsx` | 세션 있으면 `/refund-service/refund-overview/indis` 로 redirect, 없으면 `SigninCard` |
| 인증 | `app/api/auth/[...nextauth]/route.ts` | `@zent-auth/lib/auth` 의 GET·POST 재수출 한 줄. 그 밖 Route Handler 는 `app/api/logout/route.ts`, `app/api/ping/route.ts` 뿐 |
| 셸 | `app/layout.tsx` | `auth()` → ThemesProvider > SessionProvider > NiceModalProvider > DialogProvider > `@ui/components/RootWrapper` + Toaster (4겹 + RootWrapper — 탭 1 로 뺄 필요 없다) |
| 가드 | `app/refund-service/**/layout.tsx` 25개 | **layout 가드만 있다. page 가드는 0.** 24개가 `functions.includes(AuthFunction.X)`, `advertisement/landing-seo/layout.tsx` 1개는 로그인만(TODO 주석). 대표는 `app/refund-service/partner/discount/layout.tsx` |
| 가드(중첩) | `app/refund-service/business-message/layout.tsx` + `business-message/auto-crm-control/layout.tsx` | 두 겹 가드가 걸리는 유일한 곳 |
| 화면 셸 | `app/refund-service/partner/discount/_components/Containers.tsx` | List·Create·Edit 컨테이너 한 파일 |
| 모달 | `app/_components/DialogProvider.tsx` | `useDialog().showDialog` Promise 모달 |
| 관문 | `__generated__/endpoints/<태그>/` (26개) · `__generated__/models/` · `orval.config.ts` | Orval `client: 'swr'`, `tags-split`. 별칭 `@/generated/*` |
| 관문 | `lib/orval-fetcher.ts` | `@zent-auth/lib/fetcher` 를 **재선언**(re-export 아님) |
| 관문(임시) | `lib/swr/crmListUpload.ts` · `app/refund-service/hometax-block/_hooks/*.ts` | Orval 밖 수동 SWR |
| 외부 | 환급 API(`NEXT_PUBLIC_API_URL`) · Cognito(`@zent-auth`) · S3(presign) | API 서버 이름은 설정에 없다(`zent-ip` 문자열은 `hometax-block/wait-screen-log/[logId]/page.tsx` 한 곳뿐). 구조도의 `server-zent-ip` 표기 근거는 확인 필요 |

Authorization 헤더는 이 레포가 아니라 공유 `RootWrapper`(brics-fe-ui)가 `AXIOS_INSTANCE.defaults` 에 심는다 — `zent-packages` `origin/main` `frontend/brics/ui/src/components/RootWrapper.tsx:48` 에서 확인. 이 레포에 설치된 `^0.3.3` 에서도 같은지는 확인 필요.

## 5. 이 서비스만의 주의

- **`__generated__/` 는 git 에 커밋돼 있다**(origin/prd 에 368파일). 그림에서 "미커밋 생성물"로 쓰지 않는다
- **태그 디렉터리명이 한글**이다 — `제휴처`, `광고구좌`, `알림톡`, `알림톡-발송-이력`, `파이프-드라이브`, `콘텐츠-페이지-어드민`, `sso-약관`, `cpa-베네핏` 등. `sources.path` 에 그대로 쓴다. `git ls-tree` 는 기본으로 8진수 이스케이프를 찍으니 `-c core.quotepath=false` 를 붙인다
- **가드 25개가 전부 권한 검사는 아니다.** landing-seo 는 로그인만, `advertisement/promotion/layout.tsx` 는 `PAGE_REFUND_LANDING_MODAL`(landing-modals 와 같은 코드)을 검사한다. 화면 노드 `tag` 에 권한 코드를 적을 때 도메인 이름에서 추측하지 않는다
- `app/refund-service/layout.tsx` 는 **없다**. 공통 가드가 도메인마다 따로 있다는 점이 그림의 핵심이다
- `refund-overview/[refundType]` 은 동적 세그먼트 하나가 indis / indis-tritx / corps 세 종류를 받는다. 화면 파일은 목록 1 + 상세(`[id]`) 1 = 2개로 센다
- prd 에서 `user/all`·`refund-overview` 는 검색 조건이 없으면 **안내 문구를 그리지만 목록 훅은 돈다**. `user/all/_components/Containers.tsx:16-19` 의 `shouldShowSearchNotice` 는 렌더만 가르고, 목록 훅 `useUsersControllerGetUsers` 는 `UserHandlerContext.tsx:70-71` 에서 `enabled: !isUnmasked` 로만 제어된다. 요청 흐름을 그릴 때 "호출 안 함"으로 쓰지 않는다
- 사이드바는 이 레포 코드가 아니다. 공유 `RootSidebar` 가 메뉴를 그리는데, `zent-packages` `origin/main` 에서는 하드코딩 `subMenus` 다(`frontend/brics/ui/src/components/RootSidebar/index.tsx`). 지식 문서·구조도의 "hub `/brics-menus` DB 행" 표기와 다르다 — 설치 버전 기준 확인 필요
- `axios` 는 직접 의존성이 아니다. 관문 노드에 "axios" 를 레포 의존성처럼 그리지 않는다(구조도는 "axios hoisted" 로 표기)

## 6. 바뀌면 손볼 곳

- `app/refund-service/advertisement/**`·`business-message/**` 아래 새 화면 → 탭 1
- `refund-overview`·`user`·`simple-apply`·`hometax-block` 아래 새 화면, 또는 `UnmaskToggle` 을 새로 쓰는 화면 → 탭 2 (unmask 노드 연결도 추가)
- 그 밖 `app/refund-service/<새 도메인>/` → 탭 3. 새 도메인이 10화면을 넘으면 탭을 새로 만드는 것을 검토한다
- `app/` 바로 아래 시스템 화면 → 탭 3
- `layout.tsx` 가드가 늘거나 바뀌면 탭 0 의 가드 노드 숫자(25)와 도메인 맵 `client-brics-refund.domains.architecture.json` 부제를 같이 고친다
- `__generated__/endpoints/` 태그가 늘면 탭 0 관문 노드의 태그 수(26)

## 7. 읽을 지식 문서

- `docs/knowledge/client-brics-refund/structure.md` — 라우트·가드 표(도메인 경계 잡을 때)
- `docs/knowledge/client-brics-refund/patterns.md` — P1 골격 · P8 가드 · P9 unmask · P10 업로드 · P15 도메인 특이 구조
- `docs/knowledge/client-brics-refund/gotchas.md` — 한글 태그 · `__generated__` 삭제 함정 · 시간대
- `docs/knowledge/client-brics-refund/rules.md` — "deal = 환급" 용어 규칙(노드 문구에도 적용)

지식 문서와 코드가 다른 곳(그릴 때 코드를 따른다):
- `structure.md:12` — 태그 23개 → origin/prd 는 `__generated__/endpoints/` 26개
- `rules.md:20`, `patterns.md:55` — "layout 25개가 `functions.includes` 패턴" → 24개 + 로그인만 1개(landing-seo)
- `gotchas.md:13` — "prd 에서 … 목록을 조회하지 않음" → 조회는 한다(렌더만 안내 문구). `patterns.md` P3 쪽이 코드와 맞다(`user/all` 로 확인, `refund-overview` 는 P3 기술만 근거)
- `workflows.md:9` — 사이드바 = hub `/brics-menus` DB → 공유 `RootSidebar` 하드코딩(zent-packages main 기준, 설치 버전 확인 필요)
