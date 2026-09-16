# client-brics-care 대표 패턴 파일

코드에서 실제 반복되는 것만. 경로는 레포 루트 기준, `origin/prd` `8ed10df`. hub·refund 패턴을 가져오지 말 것(`@/swr` 없음, nuqs 없음, 모달 매니저 없음).

## P1. 권한 가드 — 6곳 동일 형태, 단 **하위 create/edit에는 같은 페이지 가드가 없음**
- `app/subscription/page.tsx`, `app/bmans/page.tsx`, `app/qa/layout.tsx`(유일한 layout 가드)
- `const session = await auth(); if (!session?.user?.functions.includes(AuthFunction.PAGE_CARE_XXX)) redirect('/unauthorized')`
- ⚠️ `create/`, `edit/[id]`, `/txprs/.../payments`에는 가드가 없다. 새 화면은 `app/<domain>/layout.tsx`에 두어 하위까지 덮는 것이 맞다(선례 `qa/layout.tsx`)

## P2. 라우트 골격 (create/edit/[id]) — **`promotion-page`가 복사 원본**
```
app/<domain>/page.tsx                 서버, 가드 → <XxxList/>
app/<domain>/create/page.tsx          'use client', <XxxForm mode="create"/>
app/<domain>/edit/[id]/page.tsx       'use client', useParams → <XxxForm mode="edit" id/>
app/<domain>/_components/             List/Table/Form/formSections/modals
app/<domain>/stores/use<Domain>Filters.ts   zustand (필터 많을 때만)
app/<domain>/schemas/schemas.ts       zod formSchema + FormValues
app/<domain>/hooks/useInit<Domain>Form.ts   API → RHF defaultValues 매핑
app/<domain>/utils/util.ts, constants/constant.ts
```
- Form props는 **판별 유니온** `{ mode: 'create' } | { mode: 'edit'; promotionId }`. marketing-page는 파일명이 조금 다름(`constants.ts`, `_components/schemas.ts`, `_utils/`)

## P3. 목록 / 테이블 / 페이지네이션
- 컨테이너 1개가 필터 UI + `<Table>` + `<Pagination>`을 전부 가짐(`PaymentsContainer.tsx`, `CareSubscriptionContainer.tsx`). 컬럼은 JSX에 `<TableCell>` 직접 나열(`MarketingPageContainer`만 `TABLE_COLUMNS` 배열)
- `<Pagination current={page} totalItemsCount={data?.count ?? 0} pagePerItemsCount={limit} onPageChange={setPage}/>` + `PaginationLimitSelector`. **API는 0-based → `page: page - 1, take: limit`**
- "조회시간 + RotateCcw 새로고침" 관용구(`useState<Date>` + `mutate()`)
- ⚠️ `PromotionTable`은 전체 목록을 받아 클라이언트에서 검색·정렬·slice(서버 페이징 아님). bmans/subscription/qa는 서버 파라미터. 도메인마다 다르다

## P4. 필터 상태 — zustand 2개 + 나머지는 useState. **URL 반영 0건**
- `app/promotion-page/stores/usePromotionFilters.ts`: `persist` + `createJSONStorage(() => sessionStorage)`, `reset()`
- `app/bmans/stores/usePaymentFilters.ts`: persist 없음. **값 같으면 상태 객체 그대로 반환**(리렌더 방지) + **필터 변경 시 `page: 1` 리셋**, `resetFilters()`
- subscription·qa는 컨테이너 `useState` 다발. 텍스트 검색은 `useDebounce`(`app/_hooks/useDebounce.ts`, 300ms)로 SWR key에 반영. qa는 Enter/버튼 명시 검색
- `useSearchParams`·nuqs 사용처 0 → 새로고침·딥링크로 필터 공유 불가(현 관례)

## P5. 데이터 조회 — Orval 훅 (`@/generated/endpoints/<tag>/<tag>`) + plain 함수 직접 호출
- `const { data, error, isLoading, mutate } = useFindBmans(params, { swr: { revalidateOnFocus: false } })`
- mutation 훅 `const { trigger, isMutating } = useCreateMktEvent({ swr: { onSuccess, onError } })` → `await trigger(payload)`
- **plain 함수 직접 호출도 흔하다**: `findBmans`, `releaseTxprAdmin`, `deleteBmanPaymentMethods`, `copyMktEvent`(모달·엑셀·순차 호출). "훅만 쓴다"가 아니라 "생성물만 쓴다"가 정확
- 커스텀 mutation 1건: `app/marketing-page/hooks/useMktEventCopy.ts`(`useSWRMutation`, `swr/mutation` 직접 import 유일)

## P6. mutation → revalidate → 알림
- `toast({ title: '성공', description })` / `toast({ title: '실패', description: ERROR_MESSAGES[e.error] ?? '…', variant: 'destructive' })` (`@ui/components/ui`, 18파일)
- revalidate 3방식 공존: ① `onSuccess`에서 목록 `mutate()`(marketing) ② **모달 open을 의존성으로 하는 `useEffect` + `hasMountedRef` 가드** 강제 refetch(bmans·subscription, 주석에 이유) ③ 저장 후 `router.push`로 목록 복귀
- 에러 분기 `axios.isAxiosError(err) && err.response?.data.statusCode === 400` → 전용 차단 다이얼로그(`PromotionForm`의 `SaveBlockedDialog`). axios 직접 사용 5파일
- 위험 액션에 브라우저 `confirm()` 사용처 있음(`CareSubscriptionContainer.releaseAdmin`)

## P7. 모달 — 라이브러리 없음, `@ui` Dialog 직접 조립. prop 네이밍 두 갈래
- `{ isOpen, setOpen }`(`setOpen: SetStateAction<any>`) — `app/bmans/_components/*Modal.tsx` 8개(구형)
- `{ open, onOpenChange, onConfirm }` — `promotion-page/_components/modals/*`, `marketing-page/DeleteDialog`, `subscription/*Modal` 10개 → **새 모달은 이쪽**
- 파일명: bmans·subscription `*Modal.tsx`, promotion·marketing `*Dialog.tsx`

## P8. 폼 — RHF + Zod (큰 폼만 resolver)
- `useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues, mode: 'onChange' })` + `<Form {...form}>` + `FormField/FormItem/FormLabel/FormControl/FormMessage`
- 스키마 `app/promotion-page/schemas/schemas.ts`(`export const formSchema`, `export type FormValues`). 관용구: `z.preprocess(v => v === '' || v === null ? undefined : v, z.coerce.number())`, 한국어 메시지 상수, `z.discriminatedUnion('type', …)`. **zod v3**(`z.coerce`, `invalid_type_error`) — v4 문법 금지
- 대형 폼은 `formSections/` + `useFormContext`. 저장 전 `form.trigger()` → 확인 다이얼로그 → `handleSubmit(onSubmit)()`
- 페이로드 매핑은 `onSubmit` 안에서 손수(`'2025.01.01'` → `'20250101'`), 역방향은 `useInitPromotionForm`

## P9. 스타일 — Tailwind 기본. **styled-components는 1파일**(`app/pro/_components/ConsoleIframeStyle.ts`) → 신규는 Tailwind. `clsx`/`tailwind-merge` 미설치

## P10. 엑셀 — 1건 `PaymentsContainer.handleOverdueExcelDownload`: `findBmans`를 50건씩 `Promise.all` 병렬 수집 → `XLSX.utils.aoa_to_sheet` → `XLSX.write` → `Blob` → `downloadFile()`(`lib/file.ts`). 실패 시 `console.error`만(사용자 알림 없음)

## P11. 날짜 — `@ui/lib/DateTimeFormatter`의 `formatDate`/`formatDateToKorean`(5파일) 우선. 도메인 포맷은 `utils/util.ts`(`formatYMD`, `toDate`). `date-fns`는 promotion 2파일만

## P12. 공통 UI import — **배럴 `import { A, B } from '@ui/components/ui'`**(53건). 빈도: Button 37 · Dialog/DialogContent 19 · toast 18 · DialogTitle/Header 17 · Input 16 · Form 계열 11~12 · Table 계열 8~9 · Select 계열 8. default import: `Heading`(9), `Pagination`(6). 아이콘 `lucide-react`(15파일: RotateCcw, Download, Ellipsis, Loader2)

## 설치만 됨 / 관례 아님
| 라이브러리 | 사용 파일 | 판정 |
|---|---|---|
| `styled-components` | 1 | 단일 사례; 신규 기본 관례로 간주하지 않음 |
| `xlsx` | 1 | 단일 사례 |
| `lodash.join` | 1 | 단일 사례 |
| `date-fns` | 2 | 약한 관례 |
| `swr` 직접 | 1 | 나머지는 Orval 경유 |
| `zustand` | 2 | 필터 많은 화면에만 |
| `lib/auth.ts` | 앱 참조 0 | 데드 코드에 가까움 |
| `__generated__/endpoints/vat`, `admin` | 0~1 | 생성만 됨 |
| nuqs, nice-modal, jest | **미설치** | hub 문서 잔재. 쓰지 말 것 |
