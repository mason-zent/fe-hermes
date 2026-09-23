# client-brics-hub 반복 작업 절차

체크리스트대로 진행하고, 보고서에 각 항목의 완료 여부를 적는다. 파일 패턴은 `patterns.md` 번호를 참고.

## A. 새 도메인 화면 추가 (`/foo`) — 선례 `app/messages/**`
1. API 확인. 서버에 올라와 있으면 `pnpm genapi:local`(hub 서버 + `.env.local`)로 생성물 갱신. 없으면 `lib/fooSwr.ts`를 §10 틀로 임시 작성 + 교체 절차 주석 + **보고에 명시**
2. 생성
   - `app/foo/_tabs.ts` (`FOO_TITLE`, `FOO_DEFAULT_TAB`, `FOO_TABS`, `FOO_REQUIRED_FUNCTION`) + `_tabs.spec.ts`
   - `app/foo/layout.tsx` (async, `auth()` 가드, `<Heading size="4xl">`, 탭바) · `app/foo/page.tsx` (`redirect(FOO_DEFAULT_TAB)`)
   - `app/foo/_components/FooTabButton.tsx` (`MessagesTabButton` 복사)
   - `app/foo/<tab>/page.tsx` (§1 목록) · `<tab>/_components/{FooSearchForm,FooTable,FooCreateModal,FooCreateForm}.tsx`, `fooFormSchema.ts`(§4), `fooSearchValues.ts`(+spec)
   - `app/foo/_helpers/*.ts` + `*.spec.ts`
3. 수정
   - 로그인 직후 진입 후보면 `app/page.tsx`의 `HUB_ROUTES`에 `{ href, requiredFunction }`
   - `README.md` "담당 화면" 표에 한 줄
4. 사이드바 노출은 코드가 아니다 → `/brics-menus`에서 메뉴 행 추가(`svcCl=HUB`, `pth=/foo/<tab>`, `roleIds`, `icon`). 보고에 "메뉴 등록 필요"로 적는다
5. 검증: `scripts/verify/client-brics-hub.sh` (**lint:check → typecheck → test** 순. `__generated__`가 없으면 typecheck는 건너뛴다). 필요 시 `pnpm dev`(13003)로 확인

## B. admin 탭 추가 (`/admin/bar`) — 선례 `app/admin/@tabs/access-requests/**`
1. `app/admin/_tabs.ts`의 `ADMIN_TABS`에 `{ href: '/admin/bar', label, requiredFunction: 'PAGE_ADMIN_XXX' }` 추가(기존 순서 유지). **새 권한 코드를 만들지 말고 기존 코드 재사용**이 레포 결정
2. `app/admin/_tabs.spec.ts`에 존재·권한코드·경로 중복·순서 케이스 추가
3. `app/admin/@tabs/bar/page.tsx` — async, `auth()` + `functions.includes(...)` 아니면 `redirect('/unauthorized')`, 본문은 `<BarSearchForm/><BarListTable/><BarPagination/>` 조립만
4. `app/admin/@tabs/bar/_components/` — `BarSearchForm`(URL push), `BarListTable`(`useSearchParams` → `buildListParams` → Orval 훅), `BarPagination`(**같은 `buildListParams`로 같은 SWR 키**). `buildListParams`는 export + `barListParams.spec.ts`
5. 상세가 필요하면 `@tabs/bar/[barId]/page.tsx`. `app/admin/layout.tsx`는 고치지 않는다
6. 검증: `scripts/verify/client-brics-hub.sh`

## C. 기존 목록에 컬럼·필터 추가
1. 필터: `<tab>/_components/xxxSearchValues.ts`에 필드 추가 → `buildParams`에 조건부 키 추가(빈 값이면 키 생략) → spec 갱신 → `XSearchForm`에 입력 추가
2. 컬럼: `XTable.tsx`에 `<TableHead>`/`<TableCell>` 추가, `COLUMN_COUNT` 상수 갱신(스켈레톤·빈 상태 colSpan이 이 값을 쓴다). 날짜는 `formatKstDateTime`
3. 응답 DTO에 필드가 없으면 서버 변경 → 생성물 갱신이 먼저. 임의 필드 추측 금지
4. 검증: `scripts/verify/client-brics-hub.sh`

## D. Orval에 없는 API를 임시로 쓰기
1. `lib/<domain>Swr.ts`를 `lib/accessRequestSwr.ts` 틀로 작성(`getX`/`getXKey`/`useX`/`mutateX`), `/v1` 경로, `@/lib/orval-fetcher`
2. 파일 머리에 교체 절차 주석. 가능하면 `*.spec.ts`(키 빌더·파라미터 변환)
3. 보고서 "남은 위험"에 임시 훅 목록과 교체 시점(서버 스펙 반영 후 `pnpm genapi:local`) 명시

## E. 생성물(Orval) 갱신
1. hub 서버 기동, `.env.local`의 `NEXT_PUBLIC_API_URL` 확인 → `pnpm genapi:local`
2. `git diff --stat __generated__/`로 변경 범위 확인. 기존 훅 시그니처가 바뀌었으면 사용처 `pnpm typecheck`로 잡는다
3. 생성물 변경은 커밋 대상이다(레포 정책). 변경 목록에 포함해 보고

## F. 권한 가드가 있는 화면 추가
1. 권한 코드가 `AuthFunction` enum에 있는지 확인(`@zent-auth/types/enums/AuthFunction`). 있으면 enum, 없으면 문자열 리터럴 + 주석. **없는 코드를 새로 짓지 않는다**
2. 도메인 전체 → `layout.tsx` 가드(§6), 탭 단위 → `page.tsx` 가드. admin 탭이면 `_tabs.ts`의 `requiredFunction`도(노출 필터)
3. 권한 없는 계정으로 `/unauthorized` 리다이렉트 확인
