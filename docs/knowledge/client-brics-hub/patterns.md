# client-brics-hub 대표 패턴 파일

"이런 걸 만들 땐 이 파일을 보고 따라라." 경로는 레포 루트(`repos/client-brics-hub`) 기준, `origin/prd` `fb5c7e3`. 새 화면은 **`app/messages/**` 계열(신형)**을 따르고, `app/admin/**`은 works 이관 구형이라 참고만 한다.

## 0. 전제
- `@/swr` = `__generated__/index.ts`(Orval 배럴). `swr/` 디렉터리는 없다. 그 외 별칭: `@/generated/*`, `@/components/*`(=`app/_components`), `@ui/*`(brics-fe-ui src), `@zent-auth/*`
- 공용 UI는 패키지명이 아니라 **`@ui/components/ui/button`처럼 개별 경로 별칭**으로 import (배럴 import는 지양, `scripts/debarrel-ui-imports.py` 존재)
- 클라이언트 API의 Authorization 헤더는 `app/_components/sidebar/HubRootWrapper.tsx`가 axios 기본 헤더에 심는다. 이 셸 밖에서 훅을 부르면 401
- 생성물은 손대지 않는다. 재생성 `pnpm genapi:local`

## 1. 목록 페이지 (테이블 + 페이지네이션 + 필터)
- **보고 따라라**: `app/messages/templates/page.tsx` (정석·짧음) · 복잡판 `app/messages/queue/page.tsx`
- `'use client'` 페이지가 `searchValues`·`page`를 `useState`로 소유 → 순수 함수 `buildParams(values, page)`로 쿼리 변환 → Orval 훅 1회: `const { data, isLoading, error, mutate } = useTemplatesControllerList(buildParams(searchValues, page))`
- 에러는 페이지 레벨 분기, 로딩은 테이블에 `isLoading` 내려 `<SkeletonTableBody rows={8} cols={N}/>`, 빈 상태는 `<TableCell colSpan>조회된 …이 없습니다.</TableCell>`
- 페이지네이션 `<Pagination current totalItemsCount pagePerItemsCount onPageChange/>`(`@ui/components/Pagination`), `total > 0`일 때만
- 검색폼 계약 `<XSearchForm defaultValues onSearch onReset/>`, `onSearch`는 반드시 `setPage(1)` 동반
- ⚠️ `buildParams`는 빈 값 키를 넣지 않는다(SWR 키 흔들림 방지). 종료일은 `toEndOfDayParam()`(`app/messages/_helpers/dateRangeParam.ts`)

## 2. URL 상태 — nuqs는 쓰지 않는다 (사용처 0건)
- `nuqs`는 `app/layout.tsx`의 `NuqsAdapter`만 마운트돼 있다. `useQueryState` 사용 파일 없음. **"레포 관례"라고 쓰지 말 것**
- 실제 URL 동기화(구형 admin): `app/admin/@tabs/users/_components/{UserListTable,UserSearchForm,UserPagination}.tsx` — `useSearchParams()`로 읽고 `router.push('?' + params)`로 쓴다. 표·페이지네이션이 같은 `buildListParams`(예: `access-requests/_components/AccessRequestListTable.tsx`의 export)를 써서 SWR 키를 공유
- 신형 `/messages/**`는 URL 동기화 없이 `useState`만(새로고침 시 조건 소실). nuqs 도입은 레포 첫 사례가 되므로 **팀 합의 후**

## 3. 모달 — nice-modal-react는 쓰지 않는다 (사용처 0건)
- `app/provider/NiceModalProvider.tsx`만 존재, `NiceModal.show` 0건
- **제어형 Dialog(권장)**: `app/messages/templates/_components/TemplateCreateModal.tsx` — props `{ isOpen, onClose(values?), defaultValues?, isSubmitting? }`, `useId()`로 `formId` 만들어 푸터 `<Button form={formId} type="submit">`, `key={defaultValues?.key ?? 'new'}`로 폼 재마운트
- 트리거 내장형(구형): `app/admin/@tabs/users/_components/UserCreateModalWithTrigger.tsx`
- 확인 모달: `@ui/components/ConfirmModal` (`open/title/confirmLabel/cancelLabel/confirmButtonVariant/onClose/onClickConfirm`)
- 제출 중 `onOpenChange`에서 닫기 차단. 열 때 초기화는 `{isOpen && <Form/>}` 또는 `useEffect(…, [target?.id])`

## 4. 폼 (RHF + Zod)
- **보고 따라라**: `app/messages/templates/_components/templateFormSchema.ts` + `TemplateCreateForm.tsx`
- 스키마는 폼과 같은 `_components/`에 `xxxFormSchema.ts`: `export default schema`, `export type XFormSchema = z.infer<…>`, 폼값→DTO 변환 `toCreateXBody`
- `useForm({ resolver: zodResolver(schema), defaultValues })` → `<Form {...form}><form id={formId}>` → `<FormField render={…<FormItem><FormLabel/><FormControl/><FormMessage/>}/>`
- enum은 손으로 적지 않고 `import { CreateTemplateDtoChannel } from '@/generated/models'` + `z.nativeEnum(...)`
- 폼 컴포넌트는 API를 모른다. `formId` + `onSubmit(values)`만 받고 mutation은 모달/페이지가 한다
- ⚠️ 스키마·헬퍼에서 **값**을 가져올 땐 `@/swr` 배럴 말고 `@/generated/models`(배럴은 런타임 의존을 끌어와 jest가 깨진다). 타입만이면 `import type … from '@/swr'` OK

## 5. mutation + revalidate + 토스트
- **보고 따라라**: `app/messages/templates/page.tsx`(기본) · `app/messages/queue/page.tsx`(광역 무효화)
- 지배적 패턴은 **직접 호출 함수 + `await mutate()`**: `await templatesControllerCreate(toCreateTemplateBody(values)); await mutate(); toast({ title: '등록했습니다.' })`. `catch`에서 `variant: 'destructive'`, `finally`에서 `setIsSubmitting(false)`
- 훅형도 있음: `const { trigger } = useConsoleUsersControllerAddConsoleUser()` (구형)
- 여러 표가 함께 낡으면 키 접두사 광역 무효화 `mutateAdminQueueAll()`(`lib/adminQueueSwr.ts`), `mutateAccessRequests()`(`lib/accessRequestSwr.ts`). 특정 키는 `globalMutate(getXKey())`
- 토스트 `useToast()`(`@ui/components/ui/use-toast`), `<Toaster/>`는 layout에 있음. HTTP 상태 분기: `(caught as { response?: { status?: number } })?.response?.status`
- 부분 성공 API는 건수를 문구에 넣는다(`queue/_components/queueGroupSummary.ts`)

## 6. 권한 가드
- 탭 page 가드: `app/admin/@tabs/users/page.tsx` — `const session = await auth(); if (!session?.user?.functions.includes('PAGE_ADMIN_USER')) redirect('/unauthorized')`
- layout 가드(도메인 전체): `app/activity-log/layout.tsx` — `AuthFunction.PAGE_ACCESS_LOGS`
- 로그인만: `app/messages/layout.tsx`, `app/access-requests/layout.tsx` — 사유 주석 필수
- `app/admin/layout.tsx`의 탭 필터는 **노출만** 거른다. 차단은 각 `page.tsx`. 둘 다 필요
- enum에 코드가 있으면 `AuthFunction.XXX`, 없으면 문자열 리터럴. **없는 코드를 지어내 걸지 않는다**(아무도 못 들어감)

## 7. 병렬 라우트 탭 (`/admin`, 구형 — 신규 도메인에는 쓰지 않음)
- `app/admin/layout.tsx`(`{ tabs }` 슬롯 prop) + `app/admin/_tabs.ts`(`ADMIN_TABS: {href,label,requiredFunction}[]`) + `_components/TabButton.tsx` + `_tabs.spec.ts`
- 화면은 `app/admin/@tabs/<slug>/page.tsx`, 상세는 `@tabs/roles/[roleId]/page.tsx`처럼 슬롯 안 중첩
- ⚠️ `TabButton` 활성 판정이 `includes`라 접두사 겹침에 취약. 신형 `MessagesTabButton`은 `=== || startsWith(href + '/')`

## 8. 일반 중첩 라우트 도메인 골격 (신규는 이걸 복사)
- `app/messages/layout.tsx` · `_tabs.ts` · `page.tsx`(redirect만) · `_components/MessagesTabButton.tsx`
```
app/<domain>/
  layout.tsx        서버 컴포넌트: auth() 가드 + <Heading size="4xl"> + 탭바(inline-flex … bg-muted p-1) + {children}
  _tabs.ts          TITLE / DEFAULT_TAB / TABS[] / REQUIRED_FUNCTION(null 가능)  + _tabs.spec.ts
  page.tsx          redirect(DEFAULT_TAB)
  _components/      도메인 공용 (TabButton, Badge, ExportButton …)
  _helpers/         순수 함수 + 짝 .spec.ts
  <tab>/page.tsx    'use client' 목록
  <tab>/_components/  표·검색폼·모달·xxxSearchValues.ts(+spec)
```
- `_components`/`_helpers`의 밑줄은 Next private folder(라우트 아님). 지켜라

## 9. 순수 함수 + 테스트
- 짝 예: `app/messages/_helpers/dateRangeParam.ts` ↔ `.spec.ts`, `queue/_components/queueSearchValues.ts` ↔ `.spec.ts`, `lib/sidebarMenu.ts` ↔ `.spec.ts`
- `.spec.ts`만 수집, 대상과 같은 디렉터리, 별칭 import. `it('한국어 설명')` + "왜 계약인지" 주석
- 가능: 순수 함수, `.tsx`에서 export된 순수 함수. 불가: 렌더링·훅(node 환경, Testing Library 없음). `@ui/*`·`@zent-auth/*`는 `test/*Stub.ts`로 스텁

## 10. 수동 SWR 훅 (Orval에 없는 API 임시 구현)
- **보고 따라라**: `lib/accessRequestSwr.ts`(전체 틀) · `lib/adminQueueSwr.ts`(무효화 헬퍼)
- 생성물과 **모양을 똑같이**: `getXs(params)` / `getXsKey(params) = [URL, params]` / `useXs(params, options)`가 `{ swrKey, ...query }` 반환 / `mutateXs = () => globalMutate(isKeyOf(URL))`
- 반드시 `@/lib/orval-fetcher`의 `fetcher`·`ErrorType`. 경로에 `/v1` 포함. 날짜는 `string`. 파일 머리에 교체 절차 주석(genapi → import 교체 → 파일 삭제)

## 11. Orval fetcher / formdata / 업로드
- `lib/orval-fetcher.ts`(`fetcher`, `ErrorType`, `BodyType` 3심볼 필수, re-export 금지) · `lib/formdata.ts`
- 업로드 예: `app/messages/queue/_components/BulkImportDialog.tsx` — `adminMessageControllerImport({ file, ...(scheduledAt ? { scheduledAt } : {}) })`, 드롭존 `FileDropzone.tsx`
- ⚠️ `formdataFn`은 `undefined`도 append해 `"undefined"` 문자열이 실린다 → 옵셔널 필드는 키 자체를 뺀다
- 리소스 센터 업로드는 별도 `@resource-manager`의 `uploadResource`(`app/resource-center/_components/ResourceAddModalAndTrigger.tsx`)

## 12. 사이드바 / 메뉴
- `lib/sidebarMenu.ts` + `app/_components/sidebar/*`. `app/layout.tsx`가 서버사이드 `fetchMyMenuTree(id_token)`(`GET /v1/menu/my`) → `HubRootWrapper → HubRootSidebar → SidebarMenuTree`. 하드코딩 폴백 없음
- **새 화면 노출 = `/brics-menus` 화면에서 DB 행 추가**(`svcCl=HUB`, `pth`, `icon`=lucide 이름, `roleIds`). 코드에서 만질 곳은 로그인 직후 진입 `app/page.tsx`의 `HUB_ROUTES`만
- README의 "공유 RootSidebar 하드코딩" 서술은 낡음

## 13. 공통 UI (사용 빈도순)
`@ui/components/ui/button`(63) · `ui/table`(21) · `ui/use-toast`(19) · `ui/input`(18) · `ui/badge`(17) · `ui/dialog`(16) · `Buttons`(14) · `ui/select`(11) · `Heading`(10) · `ui/skeleton`·`ui/card`(8) · `ConfirmModal`(7) · `Pagination`(6) · `ui/textarea`·`ui/form`(5) · `SkeletonTableBody`·`HighlitedText`·`Datepicker`(5). 아이콘 `lucide-react`. 앱 전역 공통은 `app/_components/*`

## 14. 날짜 / 포맷
- **신규 화면은 `app/messages/_helpers/formatKst.ts`**: `formatKstDateTime`(KST 고정), `formatKstDate`, `formatRate`, `formatCount`
- `lib/DateTimeFormatter.ts`는 **로컬 시간대**(works 잔재) → 서버 KST와 어긋난다. `lib/utils.ts`: `cn`, `isNotEmptyString`
