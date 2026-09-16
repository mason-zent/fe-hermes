# client-brics-refund 대표 패턴 파일

코드에서 실제 반복되는 것만. 경로는 레포 루트 기준(`repos/client-brics-refund`), `origin/prd` `1eb6e63`. **hub 패턴을 가져오지 말 것** — 이 레포엔 nuqs·zustand·jotai가 없고(미설치), 병렬 라우트도 없다.

## P1. 라우트 골격 — 새 화면은 이 세트를 복사
- **복사 원본**: `app/refund-service/partner/discount/*` (가장 표준), 읽기 전용이면 `pipe-drive/failure-record/*`
```
<도메인>/layout.tsx           서버: auth() + functions.includes(AuthFunction.X) → redirect('/unauthorized')
<도메인>/page.tsx             서버 async: props.searchParams(Promise!) → pageNo → <Heading size="4xl">제목</Heading> + <ListContainers pageNo={pageNo}/>
<도메인>/create/page.tsx, edit/page.tsx
<도메인>/_components/Containers.tsx   'use client': ListContainers / CreateContainer / EditContainer 를 한 파일에 export
<도메인>/_components/ListTable.tsx, EditForm.tsx
```
- 근거: `Containers.tsx` 23개, `ListTable.tsx` 12개, `EditForm.tsx` 11개, `searchParams: Promise` 21파일
- ⚠️ Next 15라 `params`/`searchParams`는 **Promise** → `await props.searchParams`

## P2. 목록 / 테이블 / 페이지네이션
- `partner/discount/_components/{Containers,ListTable}.tsx`
- `const { data } = useXControllerGetList({ page: pageNo, pageSize: LIST_PAGE_PER_COUNT })` → `Table*` + 빈 상태 `<TableCell colSpan={N}>데이터가 존재하지 않습니다.</TableCell>` 또는 `<SkeletonTableBody rows cols/>` → `<Pagination className="mt-8" current totalItemsCount pagePerItemsCount onPageChange={p => router.push(`${pathname}?page=${p}`)}/>`
- `LIST_PAGE_PER_COUNT`(=20, `lib/constants/common.ts`) 29파일. 응답은 `{ result, data, totalCount }` 래퍼가 흔함(`data?.data`, `data?.totalCount`)
- 행 클릭 이동 시 `?id=…&page=${searchParams.get('page') || 1}`로 페이지 보존

## P3. 필터·URL 상태 = URLSearchParams + router.push (URL이 단일 소스)
- `user/all/_components/SearchBar.tsx`, `refund-overview/[refundType]/_components/{SearchBar,Containers}.tsx`
- 쓰기 `const params = new URLSearchParams(); params.set(k, v); router.push(`${pathname}?${params}`)` / 읽기 `Number(searchParams.get('page')) || 1`, `searchParams.get('x') ?? undefined` → 그대로 훅 params에
- 근거: `useSearchParams` 30파일, `useRouter` 45파일. 전역 스토어 0건
- ⚠️ prd에서는 검색 조건 없으면 목록 호출을 막는 화면 2곳(`user/all`, `refund-overview`): `isProd ? !hasSearchParams : false`

## P4. 모달 — `useDialog().showDialog`가 1순위
- `app/_components/DialogProvider.tsx` · 사용 예 `partner/discount/_components/EditForm.tsx`
```ts
const { showDialog } = useDialog()
const res = await showDialog({ id: 'xxx_confirm', title: '수정하시겠습니까?', buttons: { primary: { text: '확인' }, secondary: { text: '취소' } } })
if (res?.selected === 'secondary') return   // 'primary' | 'secondary' | 'none'. Promise 기반, id 중복 시 reject, prompt 옵션
```
- 근거: `useDialog` 34파일. 2순위 shadcn `Dialog` 직접(15파일), 3순위 `@ebay/nice-modal-react`(7파일 — LoadingSpinner·UserSearchModal만)
- ⚠️ 세 방식이 혼재 → **같은 도메인 안에서는 기존 방식을 따른다**

## P5. 폼·검증 — RHF + Zod, 스키마는 `lib/types/<도메인>.ts`
- `partner/discount/_components/EditForm.tsx` + `lib/types/partner.ts`
- `useForm<XSchema>({ resolver: zodResolver(xSchema), defaultValues: originFormData || {…} })` → `<Form {...form}><form onSubmit={form.handleSubmit(handleSave, () => showDialog({ id: 'validation_error', title: '입력값을 확인해주세요.' }))}>`
- **EditForm 계약**: props `{ submitData: (dto) => Promise<void>; originData?: Dto }`. `originData` 유무로 `'수정' | '추가'` 분기. 커스텀 검증은 `form.setError(…, { type: 'manual' })`
- 근거: `zodResolver` 24파일, `z.object` 24곳. 서버 폼은 `FormProvider`+`useFormContext`(refund-overview, simple-apply)

## P6. 데이터 조회 — Orval 훅, 별칭 `@/generated/*` (hub의 `@/swr` 아님)
- `import { usePartnerControllerGetPartners } from '@/generated/endpoints/제휴처/제휴처'` · `import { Partner } from '@/generated/models'`
- 조회 `useX(params, { swr: { enabled } })` · mutation `const h = useXAdd(); await h.trigger(dto)` · 명령형은 훅 없는 함수 직접 import
- ⚠️ 엔드포인트 경로에 **한글 디렉터리**(`제휴처`, `광고구좌`, `파이프-드라이브`, `콘텐츠-페이지-어드민`)

## P7. mutation → revalidate → 토스트
- `await handler.trigger(data); await mutate()` (조회 훅의 mutate, 27파일). 전역 `mutate(getXKey(...))`는 ad-slots 1곳
- `toast({ title, description, variant: 'destructive', duration: 2500 })` — `toast` 직접 import(`@ui/components/ui`)와 `useToast()` 둘 다 쓰임
- 에러 문구는 `apiErrorMessage(error, fallback)`(`lib/utils/api-error.ts`)로 서버 메시지 우선

## P8. 권한 가드 — layout.tsx 25개가 동일 블록
```tsx
export default async function layout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user?.functions.includes(AuthFunction.PAGE_REFUND_XXX)) redirect('/unauthorized')
  return <>{children}</>
}
```
- 클라이언트 권한 확인은 `useSession()` + `functions?.includes(AuthFunction.PERMISSION_PRIVATE_ACCESS)`(UnmaskToggle). `AuthFunction`은 `@zent-auth` enum → **이 레포에서 추가 불가**(packages-fe)

## P9. 개인정보 unmask 토글 (이 레포 고유, 6화면)
- `app/_components/UnmaskToggle.tsx` · `app/_lib/hooks/useUnmaskedEndpoints.ts` · `app/_lib/privateAccess.ts` · `PrivateAccessDialog.tsx` · `usePrivateAccessState.ts`(60초 polling)
- `isUnmasked` state → 마스킹 훅 `enabled: !isUnmasked`, `/unmasked` 훅 `enabled: isUnmasked` → 403이면 `clearPrivateAccessExpiry(); setIsUnmasked(false)`
- ⚠️ `PERMISSION_PRIVATE_ACCESS` 권한 + 서버 쿠키(30분) + sessionStorage(`brics.privateAccess.expiresAt`) 3중 상태. **403 폴백 필수**

## P10. 업로드
- xlsx: `app/_components/BaseFileUploader.tsx`(유일한 xlsx 사용처, `config.requiredColumns/transformData`, `onFileProcessed`)
- CSV 대량: `business-message/crm/_components/FileUploader.tsx`(검증만, 첫 8KB 헤더) + `lib/crmListUploadHelper.ts`(presign → XHR PUT(`text/csv`, 403=만료) → complete. axios 미의존 목적으로 XHR)
- ZIP: `advertisement/landing-seo/_lib/landing-seo-zip.ts`(fflate + htmlparser2). 이미지 presigned POST. ad-slots는 `@resource-manager` `uploadResource`

## P11. 다운로드 — 공용 유틸 없음(3곳 각자 구현)
- 엑셀 `advertisement/promotion/_components/InvitorList.tsx`(Buffer JSON → Uint8Array → Blob → `<a download>`), CSV `app/_lib/hooks/useCsvDownload.ts`(`AXIOS_INSTANCE.get(url, { responseType: 'blob' })`, 마스킹/평문 2엔드포인트)

## P12. 상태 관리 — 전역 스토어 없음
- `useState`(58파일) + URL 쿼리 + SWR 캐시. 화면 단위 공유는 `_components` 안 React Context(`user/all/_components/UserHandlerContext.tsx`)

## P13. 스타일 — Tailwind 기본, SCSS 모듈은 2도메인 3파일뿐(ad-slots, sso-terms). 신규는 Tailwind만. 클래스 병합은 `clsx`(22파일), `tailwind-merge`는 1파일

## P14. 공통 UI import — **배럴 import가 관례**(hub와 반대)
- `import { Button, Input, Table, … } from '@ui/components/ui'` 106회. 빈도: Button 74 · Input 35 · Table 계열 28~31 · Form 계열 17~22 · Card 21 · Select 계열 17 · Badge 17 · Dialog 계열 13~15 · toast/useToast 12
- 비배럴: `@ui/components/Heading`(46), `Pagination`(19), `SkeletonTableBody`(10), `Datepicker`(4), `Spinner`

## P15. 도메인 특이 구조 (해당 도메인 작업 시)
- **ad-slots**: `dynamic(…, { ssr: false })` 클라 전용, 세분화된 파일(ListHeader/FilterItems/FormItems/DetailForm/LottiePlayer), URL 전체 spread 필터, SCSS 모듈, `@resource-manager`
- **landing-seo**: 유일한 `_lib/` + `*.test.ts`(node:test). Claude 프롬프트 생성·ZIP 임포트·PreviewDialog. 가드 TODO
- **hometax-block**: Orval 대신 `_hooks/`에서 `AXIOS_INSTANCE` + `useSWR(url, fetcher)`. `m/page.tsx` 모바일 fixed 오버레이(z-40, body 스크롤 잠금)
- **auto-crm-control**: 카드형 + 수동 SWR(`AUTO_CRM_CONTROLS_KEY`) + `useSWRMutation`
- **cpa-benefit / simple-apply**: 목록형 아님, "폼 → 결과영역"(`BulkPhoneSearchForm` + `SearchResultArea`)

## 설치만 됨 / 도메인 전용 (관례로 적지 말 것)
| 패키지 | 사용 파일 | 판정 |
|---|---|---|
| `xlsx` | 1 | BaseFileUploader 래퍼로만 |
| `react-dropzone` | 2 | 래퍼로만 |
| `tailwind-merge` | 1 | 관례 아님(clsx 22) |
| `@lottiefiles/react-lottie-player`, `uuid` | 1~2 | 관례 아님 |
| `htmlparser2`, `fflate` | 2 | landing-seo 전용 |
| `date-fns-tz` | 5 | hometax-block·refund-overview만 |
| `@zenterprise-inc/brics-fe-resource-manager` | 1 | ad-slots만 |
| `nuqs` / `zustand` / `jotai` | **미설치** | hub 패턴 금지 |
