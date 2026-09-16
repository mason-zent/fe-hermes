# client-brics-hub 구조 맵

기준 `origin/prd` `99f4f60` (2026-09-02). `/sync`가 디렉토리·스크립트 사실을 갱신한다. 규칙은 `rules.md`, 예시 파일은 `patterns.md`, 절차는 `workflows.md`.

## 루트
```
app/  lib/  __generated__/  test/  public/  scripts/
orval.config.ts  jest.config.ts  next.config.js  tailwind.config.js  components.json  .env.example
```

## app/ (App Router)
| 경로 | 역할 | 라우트 형태 | 권한 |
|---|---|---|---|
| `admin/` | 권한 관리 (users · roles · functions · access-requests) | **병렬 라우트** `layout.tsx` + `@tabs/<탭>/page.tsx`, 탭 정의 `_tabs.ts`(+spec), `_components/` | 탭별 `AuthFunction` (`PAGE_ADMIN_*`) |
| `brics-menus/` | 메뉴(사이드바) 관리 — 트리·편집 패널·아이콘 피커·역할 멀티셀렉트 | 일반 라우트, `_components/`(MenuTree, MenuEditPanel, MenuEditForm, IconPicker, RoleMultiSelect, buildMenuTree, menuFormSchema) | (확인 필요) |
| `messages/` | 메시지 플랫폼 — `queue/` `history/` `templates/` `throttle/` | 일반 중첩 라우트, `layout.tsx` + `_tabs.ts`(+spec) + `_components/` + `_helpers/` | 로그인만 (`MESSAGES_REQUIRED_FUNCTION` 미정) |
| `alimtalk-control/` | 알림톡 제어 | 일반 라우트, `_components/` | (확인 필요) |
| `resource-center/` | 리소스 센터 (S3 업로드) | 일반 라우트, `_components/` | (확인 필요) |
| `access-requests/` | 접근 요청 | `layout.tsx` + `page.tsx` + `_components/` | layout 가드 |
| `activity-log/` | 활동 로그 | `layout.tsx` + `page.tsx` + `_components/` + `_helpers/` | `PAGE_ACCESS_LOGS` |
| `audit/permission-changes/` | 권한 변경 감사 | 중첩 라우트 | `PAGE_ACCESS_LOGS` |
| `_components/` | 공통: `sidebar/`(HubRootWrapper·HubRootSidebar·SidebarMenuTree·MenuIcon·BasicMenuTrigger), AuthForm, SigninCard, AccessRequestStatusBadge(+spec) | — | — |
| `provider/` | `NiceModalProvider.tsx` | — | — |
| `api/` | `auth/[...nextauth]`, `logout`, `ping` | Route Handler | — |
| `error/` `logout/` `unauthorized/` | 시스템 페이지 | — | — |

## lib/
| 파일 | 역할 |
|---|---|
| `orval-fetcher.ts` | Orval 생성 훅이 쓰는 fetcher (`@zent-auth` fetcher 재선언) |
| `formdata.ts` | Orval formData 변환 (파일 업로드) |
| `sidebarMenu.ts` (+spec) | `GET /v1/menu/my` fetcher, 사이드바 메뉴 타입 |
| `accessRequestSwr.ts` (+spec), `adminQueueSwr.ts` | **Orval에 없는 API의 수동 SWR 훅** — 임시 훅을 만들 때의 틀 |
| `DateTimeFormatter.ts`, `utils.ts` | 날짜·공통 유틸 |
| `process-shim.ts` | Turbopack용 `process` 폴리필 (next.config `turbopack.resolveAlias`) |

## __generated__/ (Orval, git 커밋됨, 직접 수정 금지)
`index.ts`(= `@/swr` 별칭) · `models/` · `endpoints/<태그>/`. 태그: access-request, console-users, health, internal-user-action-history, menu, message-platform-admin-{messages,monitoring,queue,vendor-accounts}, message-platform-{auth,messages,templates}, message-templates, permission-change-history, resources, user-action-history, users (+ 각 `unversioned-*` 쌍). 재생성 `pnpm genapi:local`.

## test/
`jest.config.ts`(ts-jest, node 환경) + `test/uiPackageStub.ts`·`zentAuthPackageStub.ts`(공유 패키지 스텁). spec 파일 28개, 모두 순수 함수 대상. 렌더링 테스트 불가.

## 스크립트
| 명령 | 용도 |
|---|---|
| `pnpm dev` / `dev:webpack` | 13003, Turbopack / webpack |
| `pnpm lint:check` · `pnpm typecheck` · `pnpm test` | 검증 3종 (`scripts/verify/client-brics-hub.sh`가 한 번에) |
| `pnpm genapi:local` / `genapi:dev` | `.env.local` / `.env.dev`의 `NEXT_PUBLIC_API_URL`로 Orval 재생성 |
| `pnpm pkg:link` / `pkg:unlink` / `use:dev-pkgs` | zent-packages 로컬 링크 / 해제 / dev 스냅샷 |
