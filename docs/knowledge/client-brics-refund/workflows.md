# client-brics-refund 반복 작업 절차

## A. 새 도메인 화면 추가 (목록 + 생성 + 수정) — 복사 원본 `app/refund-service/partner/discount/`
1. API: `__generated__/endpoints/<한글태그>/`에 훅이 있는지 grep. 없으면 C(생성물 갱신) 또는 D(임시 훅)
2. 생성: `<도메인>/<화면>/layout.tsx`(P8 가드, `AuthFunction.PAGE_REFUND_XXX`) · `page.tsx`(`await props.searchParams` → `pageNo` → Heading + `<ListContainers/>`) · `create/page.tsx` · `edit/page.tsx` · `_components/Containers.tsx`(List/Create/Edit) · `_components/ListTable.tsx` · `_components/EditForm.tsx`(`{ submitData, originData? }`)
3. 수정: `lib/types/<도메인>.ts`에 zod 스키마(+파생 타입), 필요 시 `lib/constants/<도메인>.ts`
4. 권한 코드가 `AuthFunction` enum에 없으면 **이 레포에서 만들 수 없다** → 멈추고 헤르메스에 보고(packages-fe 선행). landing-seo의 "로그인만 + TODO"는 기존 예외이지 새 화면의 선례가 아니다
5. 검증: `scripts/verify/client-brics-refund.sh`(lint:check + tsc). 타입 오류는 `pnpm build`에서도 드러난다
6. 사이드바 메뉴는 이 레포 코드가 아니다 — `app/layout.tsx`의 `@ui` `RootWrapper` → zent-packages `brics/ui/src/components/RootSidebar`에 콘솔 URL로 **하드코딩**. 메뉴 추가는 packages-fe 선행 + 이 레포의 `brics-fe-ui` 버전 올림 → 보고에 "메뉴 추가 필요(packages-fe)"

## B. 기존 목록에 컬럼·필터 추가
1. 컬럼: `ListTable.tsx`에 `TableHead`/`TableCell` 추가 → **빈 상태 행 `colSpan`과 `SkeletonTableBody cols` 값 함께 수정**(둘 다 하드코딩)
2. 필터: SearchBar/FilterItems의 `URLSearchParams.set` 항목 추가 → Containers에서 `searchParams.get('x') ?? undefined`를 훅 params에 추가(params가 SWR 키라 자동 재조회)
3. `user/all`·`refund-overview`처럼 "prd 검색 필수" 화면이면 `hasSearchParams` 조건에도 새 키 추가
4. 모델에 필드가 없으면 C 먼저

## C. Orval 생성물 갱신
```bash
pnpm gen:env          # SSM → 루트 .env 생성 (AWS SSM 자격 필요). gen:api:local 은 .env.local 을 읽으므로 따로 준비돼 있어야 한다
pnpm gen:api:local    # rm -rf __generated__ → orval(NEXT_PUBLIC_API_URL/api-yaml) → mv
git status            # __generated__ 는 커밋 대상. diff 확인 후 함께 변경 목록에
```
- 실행 전 `git status -- __generated__`로 기존 미커밋 변경이 없는지 확인한다(있으면 보존 방법부터 정한다)
- 실패하면 `__generated__`가 이미 지워진 상태 → 사전 변경이 없었을 때만 `git checkout -- __generated__`로 복구
- BE `/api-yaml`이 떠 있어야 한다. 코드 주석의 `pnpm genapi`는 hub 이름이 옮겨온 오타 — 이 레포는 `gen:api:local`

## D. Orval에 없는 API 임시 훅
- 틀 `lib/swr/crmListUpload.ts` + `.types.ts`(DTO를 BE 클래스명과 같게 수동 정의). 화면 전용이면 `<화면>/_hooks/useXxx.ts`
- Orval 산출물 모양 그대로: `fetcher<T>({ url, method, params|data })` + `getXxxKey()` + `useXxx(params, options?: { swr })` → `{ swrKey, ...query }`
- 간단하면 `AXIOS_INSTANCE.get(url).then(r => r.data)` + `useSWR(url, fetcher)`(hometax-block 방식)도 허용
- 파일 상단 "OpenAPI 스펙 확정 후 생성 훅으로 교체" 주석. 보고에 임시 훅 목록 명시

## E. 권한 가드 추가
- 해당 라우트 디렉터리에 `layout.tsx` 생성 → P8 블록. 서브트리 전체면 상위(`business-message/layout.tsx`), 더 좁은 권한은 하위에 추가(`auto-crm-control/layout.tsx`)

## F. 자주 있는 기타
- **unmask 지원**: `useUnmaskedEndpoints.ts`에 `/unmasked` 훅 추가 → 화면에 `isUnmasked` state + 두 훅 `enabled` 분기 + 403 폴백 + `<UnmaskToggle/>`
- **다운로드**: `useCsvDownload.ts`에 blob 함수 추가 → objectURL 다운로드(공용 유틸 없음)
- **CSV 대량 업로드**: `FileUploader`(검증) + `uploadCrmListCsv`(3단계)
- 커밋 메시지 규칙은 `rules.md` Git 절
