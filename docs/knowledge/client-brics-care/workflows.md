# client-brics-care 반복 작업 절차

## A. 새 도메인 화면 (목록 + 생성 + 수정) — 복사 원본 `app/promotion-page/`
1. API: 스펙이 올라온 뒤 `pnpm genapi:local` → `__generated__/endpoints/<tag>/<tag>.ts`에 `useFindXxx`/`useAddXxx` 확인
2. `app/<domain>/layout.tsx`에 **`auth()` + `AuthFunction.PAGE_CARE_*` 가드**(하위 create/edit까지 덮기 위해 page가 아니라 layout. 선례 `qa/layout.tsx`). enum에 코드가 없으면 zent-auth(packages-fe) 선행 → 보고
3. `page.tsx`(서버) → `_components/XxxList.tsx`(`'use client'`, Heading + 필터 + Table + Pagination + PaginationLimitSelector, `useFindXxx({ page: page - 1, take: limit, …filters })`)
4. 필터가 많으면 `stores/use<Domain>Filters.ts`(zustand, setter에 `page: 1` 리셋. 유지 필요 시 `persist` + sessionStorage)
5. `schemas/schemas.ts`(zod) → `_components/XxxForm.tsx`(`mode` 판별 유니온, zodResolver, 저장 확인 다이얼로그, `trigger()` → toast → `router.push`)
6. `create/page.tsx`, `edit/[id]/page.tsx` — `'use client'` 얇은 래퍼
7. 사이드바 메뉴는 이 레포에 없다(`@ui` RootWrapper/hub DB) → 보고에 "메뉴 등록 필요"
8. 검증 `scripts/verify/client-brics-care.sh`

## B. 컬럼·필터 추가
- 컬럼: 컨테이너 `<TableHeader>`(bmans는 `TableCell`, subscription/marketing은 `TableHead`) + `<TableBody>` map에 같은 순서로. marketing은 `constants.ts`의 `TABLE_COLUMNS`만. promotion은 `PromotionRow` 타입 + `useMemo` 매핑 + JSX 3곳
- 필터: 스토어 필드+setter(값 같으면 no-op, `page: 1`) → `reset` 기본값 → UI(Select/Input/MultiSelector) → `useFindXxx` 파라미터. 텍스트는 `useDebounce`. URL 반영은 하지 않는다(새 패턴 도입이 됨)

## C. Orval 생성물 갱신
```bash
pnpm genapi:local    # .env.local 의 NEXT_PUBLIC_API_URL 필요. rm -rf __generated__ → orval → mv
```
- 생성물은 커밋한다. mutator는 `lib/orval-fetcher.ts` 직접 선언 유지. 갱신 후 `pnpm lint`

## D. env 생성 (`gen:env`, SSM)
```bash
pnpm gen:env                                            # --env=dev --app=care → 루트 .env
node generate-env.mjs --env=prd --app=care              # 다른 환경
```
- 자격증명 `DEV_SSM_ACCESS_KEY_ID`/`..._SECRET_KEY_ID`(prd는 `PRD_*`). **자격증명이 없어도 빈 `.env`를 만들고 exit 0** → 변수 개수 로그 확인
- `genapi:local`은 `.env.local`을 본다. 두 파일이 다르니 최초 세팅 시 주의

## E. 권한 가드 추가
1. `AuthFunction.PAGE_CARE_*` 존재 확인(현재 SUBSCRIPTION, PAYMENT, MARKETING_PAGE, QA, PRO)
2. layout(하위 포함) 또는 page 서버 컴포넌트 최상단에 P1 블록
3. 권한 없는 계정으로 `/unauthorized` 확인

## F. 공유 패키지 로컬 링크
```bash
pnpm pkg:link      # 옆 디렉토리 zent-packages 자동 탐지
pnpm dev
pnpm pkg:unlink    # 끝나면 원복. 링크 상태로 package.json 커밋 금지
```
- `withZentDevkit`이 링크 중에만 경로 보정. `@ui/*`·`@zent-auth/*`는 패키지 `src`를 직접 가리켜 수정이 즉시 반영
