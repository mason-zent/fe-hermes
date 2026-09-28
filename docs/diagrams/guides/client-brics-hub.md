# client-brics-hub 다이어그램 가이드

공통 원칙·심층 표준·검증은 [`../AUTHORING.md`](../AUTHORING.md). 이 문서는 이 레포에만 해당하는 것만 적는다. 작성 기준 `origin/prd` `fb5c7e3` (2026-09-03).

## 1. 기준

| 항목 | 값 |
|---|---|
| 레포 | `repos/client-brics-hub` (BRICS Hub 콘솔 — 권한·메뉴·메시지 플랫폼) |
| 앱 루트 | 레포 루트. 라우트는 `app/` (`hermes.config.json` `appDir: app`) |
| 기준 ref | `origin/prd` |
| 라우터 | Next 15.5 App Router, dev 는 Turbopack. `middleware.ts` 없음. **`app/admin/` 만 병렬 라우트(`@tabs`)**, 나머지는 일반 중첩 라우트 |
| 화면 수 | **21** |
| 포트 | 13003 (`package.json` `dev: next dev -p 13003 --turbopack`) |

```bash
git -C repos/client-brics-hub ls-tree -r --name-only origin/prd app | grep -E '/page\.(tsx|ts|jsx|js)$' | wc -l   # 21
```

21화면 내역: `admin/@tabs/**` 6 · `messages/**` 5(`messages/page.tsx` 는 redirect 전용) · `access-requests` · `activity-log` · `audit/permission-changes` · `alimtalk-control` · `brics-menus` · `resource-center` 각 1 · 시스템 4(`app/page.tsx`, `error`, `logout`, `unauthorized`).

## 2. 지금 있는 장

| 파일 | 고정 커밋 | 무엇을 그렸나 |
|---|---|---|
| `client-brics-hub.architecture.json` | `fb5c7e3` | 구조 — admin 병렬 라우트 vs messages 중첩 라우트, 내재화 사이드바 + `GET /v1/menu/my`, Orval `@/swr` · 수동 훅 · fetcher → server-brics-hub |
| `client-brics-hub.sequence.json` | 없음(`meta.repository` 없음) | 요청 흐름 — 대표 화면 `app/messages/templates` (가드 · 헤더 주입 · 검색 재조회) |
| `client-brics-hub.lifecycle.json` | 없음 | 화면 상태. 2026-09-28 목록에서 뺐다 |
| 화면 맵(domains) | **없음** | — |
| 심층 | **없음** | — |

## 3. 심층 탭 구성 (제안)

21화면이라 도메인 탭으로 쪼개면 장마다 5화면 안팎이 된다. **화면 전수 1장 + 깊게 그릴 흐름 2장**으로 간다(AUTHORING 4절 "20개 안팎인 앱").

| 탭 | 파일(제안) | 범위 | 화면 |
|---|---|---|---|
| 0 | `hub-detail.architecture.json` | 상세 — 4절 뼈대. 전수 대조 제외 | — |
| 1 | `screens.architecture.json` | `app/**/page.tsx` 전부. 화면마다 가드 종류(page · layout · 로그인만 · 없음)를 `tag` 로 | **21** |
| 2 | `message-platform.architecture.json` | 메시지 플랫폼 흐름. 화면 파일이 아니라 `app/messages/**/_components`·`_helpers`·`lib/adminQueueSwr.ts` 를 근거로 | 0 (탭 1 에서 셈) |
| 3 | `permission-menu.architecture.json` | 권한 관리 + 메뉴·사이드바 흐름. `app/admin/**`·`app/access-requests/**`·`app/brics-menus/**`·`lib/sidebarMenu.ts`·`app/_components/sidebar/**` | 0 (탭 1 에서 셈) |

탭 2·3 은 page 파일을 `sources` 로 달면 `diagram-coverage.mjs` 가 탭 1 과 **중복**으로 센다. page 를 달아야 하면 그 노드를 `DRILL` 출발 노드로 만든다.

**탭 2 메시지 플랫폼 — 근거 파일**
- 탭 정의 `app/messages/_tabs.ts` (queue · history · templates · throttle 4탭, `MESSAGES_REQUIRED_FUNCTION = null`)
- 대기열(가장 복잡): `app/messages/queue/page.tsx` 가 `useAdminQueueControllerListCollapsed` + 취소·그룹취소·재큐 직접 호출 → `mutateAdminQueueAll()`(`lib/adminQueueSwr.ts`) 광역 무효화
- 단건 발송 `queue/_components/SendMessageDialog.tsx`·`SendMessageForm.tsx`·`sendFormValues.ts`, 대량 `BulkImportDialog.tsx`·`FileDropzone.tsx`·`importColumns.ts`·`importErrors.ts`, 모니터 `QueueMonitorPanel.tsx`·`DependencyHealthCard.tsx`·`RecentFailureTable.tsx`
- 이력 `history/_components/*`, 템플릿 `templates/_components/TemplateCreateModal.tsx`·`templateFormSchema.ts`, 유량 `throttle/_components/VendorAccountRow.tsx`·`vendorAccountDiff.ts`
- 순수 함수 `app/messages/_helpers/*.ts`(formatKst · dateRangeParam · exportFile · maskRecipient 등 9개) — 그중 8개에 짝 `.spec.ts` 가 있다
- 생성물 태그 `__generated__/endpoints/message-platform-*`(admin-messages · admin-monitoring · admin-queue · admin-vendor-accounts · auth · messages · templates) + `message-templates`

**탭 3 권한 · 메뉴 — 근거 파일**
- 병렬 라우트 `app/admin/layout.tsx`(`tabs` 슬롯, 탭 **노출만** 필터) + `app/admin/_tabs.ts`(`ADMIN_TABS` 4개) + `app/admin/_components/TabButton.tsx`
- 탭 page 6개가 각자 `auth()` 가드: users·users/[userId]·access-requests 는 `'PAGE_ADMIN_USER'`, roles·roles/[roleId] 는 `'PAGE_ADMIN_ROLE'`, functions 는 `'PAGE_ADMIN_FUNCTION'` — **문자열 리터럴**
- 권한 요청 두 갈래: 요청자 `app/access-requests/page.tsx`(로그인만) → 처리자 `app/admin/@tabs/access-requests/page.tsx`. 수동 훅 `lib/accessRequestSwr.ts`
- 메뉴: `app/brics-menus/_components/MenuAdminContainer.tsx`·`MenuTree.tsx`·`MenuEditPanel.tsx`·`buildMenuTree.ts` → DB 행 → `app/layout.tsx` 가 서버에서 `fetchMyMenuTree(id_token)`(`lib/sidebarMenu.ts:50`) → `HubRootWrapper` → `HubRootSidebar` → `SidebarMenuTree`

## 4. 탭 0 에 들어갈 실제 파일

| 칸 | 경로 (origin/prd) | 확인한 것 |
|---|---|---|
| 진입 | `next.config.js` | `turbopack.resolveAlias.process → ./lib/process-shim.ts`, `distDir` dev/prod 분리, `optimizePackageImports`(`@/swr` 포함). rewrite 없음. **middleware 없음** |
| 진입 | `app/page.tsx` | 비로그인 `SigninCard`, 로그인 시 `HUB_ROUTES` 5개 중 첫 접근 가능 경로로 redirect, 없으면 `/unauthorized` |
| 인증 | `app/api/auth/[...nextauth]/route.ts` (+ `api/logout`, `api/ping`) | `@zent-auth` NextAuth |
| 셸 | `app/layout.tsx` | `auth()` → `fetchMyMenuTree` → ThemesProvider > SessionProvider > SWRConfig(`revalidateOnFocus: false`) > NiceModalProvider > NuqsAdapter > `HubRootWrapper` + Toaster |
| 셸 | `app/_components/sidebar/HubRootWrapper.tsx` | 공유 RootWrapper 사본. 세션 있으면 `AXIOS_INSTANCE.defaults.headers.common.Authorization` 를 심는다(75-76행), 비로그인이면 redirect 쿠키 후 `/` |
| 가드(page) | `app/admin/@tabs/*/page.tsx` 6 · `app/alimtalk-control/page.tsx` · `app/brics-menus/page.tsx` · `app/resource-center/page.tsx` | 9화면이 page 가드 |
| 가드(layout) | `app/activity-log/layout.tsx` · `app/audit/permission-changes/layout.tsx` (`PAGE_ACCESS_LOGS`) · `app/messages/layout.tsx` · `app/access-requests/layout.tsx` (둘 다 로그인만, 사유 주석) | 8화면이 layout 가드 |
| 가드 없음 | `app/page.tsx`(진입) · `error` · `logout` · `unauthorized` | 4화면 |
| 관문 | `__generated__/index.ts`(= `@/swr`) · `__generated__/endpoints/` 33개 · `orval.config.ts` | 태그마다 `unversioned-*` 짝이 있다(`health` 만 짝 없음) |
| 관문 | `lib/orval-fetcher.ts` · `lib/formdata.ts` | `@zent-auth` fetcher 재선언 |
| 관문(임시) | `lib/accessRequestSwr.ts` · `lib/adminQueueSwr.ts` | Orval 모양을 흉내 낸 수동 훅 · 광역 무효화 |
| 관문(서버) | `lib/sidebarMenu.ts` | `fetch` 직접 + `cache: 'no-store'`. 클라이언트 훅으로 부르지 않는 이유가 파일 주석에 있다 |
| 외부 | hub API(`NEXT_PUBLIC_API_URL`, 전면 `/v1`) · Cognito · S3(`@resource-manager`, resource-center) | — |

## 5. 이 서비스만의 주의

- **가드 위치가 도메인마다 다르다** — admin·alimtalk·brics-menus·resource-center 는 page, activity-log·audit 는 layout(권한), messages·access-requests 는 layout(로그인만). 한 문장으로 일반화하지 않는다
- `app/admin/layout.tsx` 는 가드가 아니다. `functions` 를 읽어 **탭 버튼만** 숨긴다. 차단은 각 탭 page
- `app/admin/` 에는 `page.tsx`·`default.tsx` 가 없다. `/admin` 자체는 화면이 아니다. 화면은 `@tabs/<탭>/page.tsx` 6개
- `messages/page.tsx` 는 `redirect(MESSAGES_DEFAULT_TAB)` 만 한다. 화면 수에는 들어가지만 그림에서는 "redirect" 로 표시한다. 발송(단건·대량)은 페이지가 아니라 **대기열 화면의 모달**이다(`_tabs.ts` 주석)
- 권한 코드가 enum(`AuthFunction.PAGE_ALIMTALK` 등)과 문자열 리터럴(`'PAGE_ADMIN_USER'`, `'PAGE_ADMIN_MENU'`)로 섞여 있다. 노드 문구에 옮길 때 파일 그대로 적는다
- Authorization 헤더가 **셸이 렌더될 때** 공유 인스턴스에 심긴다. 서버 컴포넌트의 메뉴 조회만 `id_token` 을 직접 헤더에 싣는다 — 요청 흐름에서 두 경로를 구분한다
- **코드 주석이 낡은 곳 두 군데**: `app/page.tsx:9` 와 `app/messages/_tabs.ts:7-8` 은 "사이드바는 공유 `RootSidebar`(하드코딩)" 라고 적혀 있지만 실제는 `HubRootWrapper`/`HubRootSidebar` + `GET /v1/menu/my` 다. 주석을 근거로 그리지 않는다
- `__generated__/` 는 git 에 커밋돼 있다(origin/prd 259파일). 로컬에 없으면 typecheck 가 깨지지만 그림 근거로는 origin/prd 의 파일을 쓴다
- `nuqs`(`NuqsAdapter`)·`@ebay/nice-modal-react`(`NiceModalProvider`)는 **셸에 마운트만** 돼 있고 사용처 0이다. 셸 노드에는 그리되 "사용 0" 을 붙인다

## 6. 바뀌면 손볼 곳

- 새 화면(어느 경로든) → 탭 1 에 노드 추가, 가드 종류 `tag`
- `app/messages/<새 탭>/` → 탭 1 + 탭 2(`_tabs.ts` 노드와 흐름)
- `app/admin/@tabs/<새 탭>/` 또는 `_tabs.ts` 변경 → 탭 1 + 탭 3
- 새 일반 도메인 `app/<domain>/`(messages 골격 복사) → 탭 1. 흐름이 크면 탭을 새로 만든다
- `MESSAGES_REQUIRED_FUNCTION` 이 채워지면 탭 0·1 의 messages 가드 표시를 "로그인만" 에서 권한 코드로
- `lib/*Swr.ts` 수동 훅이 생성물로 교체되면 탭 0 관문(임시) 노드와 탭 2·3 연결

## 7. 읽을 지식 문서

- `docs/knowledge/client-brics-hub/structure.md` — 라우트·권한 표, `__generated__` 태그
- `docs/knowledge/client-brics-hub/patterns.md` — 0 전제(헤더 주입) · 6 가드 · 7 병렬 라우트 · 8 중첩 라우트 골격 · 10 수동 SWR · 12 사이드바
- `docs/knowledge/client-brics-hub/gotchas.md` — Turbopack `process` 치환 · `/v1` · works 생성물 복사 금지 · nuqs/nice-modal 설치만
- `docs/knowledge/client-brics-hub/workflows.md` — A(새 도메인) · B(admin 탭)

지식 문서와 코드가 다른 곳(그릴 때 코드를 따른다):
- `structure.md:15` `brics-menus/` 권한 "(확인 필요)" → `app/brics-menus/page.tsx:9` page 가드 `'PAGE_ADMIN_MENU'`
- `structure.md:17` `alimtalk-control/` "(확인 필요)" → `app/alimtalk-control/page.tsx:9` `AuthFunction.PAGE_ALIMTALK`
- `structure.md:18` `resource-center/` "(확인 필요)" → `app/resource-center/page.tsx:9` `AuthFunction.PAGE_RESOURCE_CENTER`
- `structure.md:19` `access-requests/` "layout 가드" → 로그인만 검사하는 layout(`app/access-requests/layout.tsx:18-21`). 틀린 말은 아니지만 권한 가드로 읽히기 쉽다
