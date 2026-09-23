# bznav-web apps/plus-web 대표 패턴
## 페이지 골격 — "layout = SEO, page = UI" 분리
- `layout.tsx`(서버): `export const metadata = buildServiceMetadata(<PAGE>_META)` + `<JsonLd data={buildWebApplicationLd({name, description, path})}/>` + `<CommonTopNavigation/>` (대표 `app/calc/tax/vat/layout.tsx`)
- `page.tsx`: 계산기는 전부 `'use client'`, `tax-check` 랜딩·`tax-content`는 서버. 말미 `<PageViewEventLogger pageName="plus_calc_vat"/>`(규칙 `plus_<도메인>_<화면>`)

## 계산기 3계층 (가장 반복, **8세트**: breakeven · holiday-pay · salary-actual · salary-contract · simple-vat · store-sales · tax-penalty · vat)
⚠️ 반환 shape 이 **완전히 같지는 않다** — `salary-actual` 은 `sections` 대신 `salarySection`, `parsedInput` 대신 `monthlyGrossSalary` 를 내보낸다. `Step` 도 계산기마다 다르다(`holiday-pay` 2단계, `store-sales` 3단계, `simple-vat` 4단계). 새로 만들 때는 가장 가까운 기존 세트를 보고 맞춘다.
1. `lib/hooks/calc/<name>/use-<name>-form.ts` — `useForm<Form>({defaultValues})`의 `watch/setValue/reset`만(**`handleSubmit`·resolver 미사용**). `const form = watch()`, `parsedInput`(`parseInteger`) `useMemo`, `setters = createFormSetter(setValue, FIELD_LIMITS.x, {format:true})`, `validation: { isInputValid }`
2. `lib/hooks/calc/<name>/use-<name>.ts` — `useWindowSize().isOverTablet`, `step: 'input-step'|'result-step'`, `openSections`, `result = useMemo(() => step==='result-step' ? calcX(parsedInput) : null)`, `useCalculatorDpLog('calc_vat', …)`, `actions: { calculate, reset }`. **반환 `{form, setters, parsedInput, validation, result, sections, actions}` 통일**
3. `lib/utils/calc/<name>.ts` — React 무관 순수 함수 + JSDoc 세법 규칙(`Math.floor` 등). 요율·한계는 `lib/constants/calc/<name>.ts`
- 페이지: 구조분해 → `<Accordion value={openSections}>` + 입력 Section + `step==='result-step' && <XResultSection ref/>` + `useScrollToResult`

## 폼 두 갈래(섞지 말 것) — 계산기 RHF **without resolver** / 간편인증 `yup`(`lib/regex/schema/simple-auth.ts`) + `@hookform/resolvers`(6파일)

## Jotai — sena와 다름
- `store/auth-store.ts`: **`atomWithStorage` 중심**(기본 localStorage, 세션은 `createJSONStorage(() => sessionStorage)`). `simpleAuthTokenAtom`, `tinAtom`, `analysisResultAtom`(`any`), `collectionErrorAtom`(session)
- `app/fortune/_store/fortune-store.ts`: `atomWithStorage(KEY, null, undefined, { getOnInit: true })`(하이드레이트 경합 방지 주석)
- 순수 UI 플래그 `atom<boolean>`(이유 주석). **`JotaiProvider` 루트에 없음**(기본 store)

## 데이터 — axios 없음. 직접 `fetch`는 `lib/api/notion-client.ts` 1곳. 엔드포인트 `lib/constants/paths.ts` `API_PATHS`(`NEXT_PUBLIC_PLUS_API_SERVER`), `FORTUNE_API_URL`만 sena 서버. `PAGE_PATHS` 키 **한글**

## 노션 (`tax-content`) — 서버 `page.tsx`: `generateStaticParams` + `generateMetadata` + `revalidate = 1800`, `findRowBySlug`는 React `cache()`. `lib/api/get-notion-database-rows.ts`(공식 API, `child_database` 블록에서 DB id 해석, 모듈 캐시). 클라 `Renderer.tsx`(`useMounted` 전 null, `NotionRenderer` + `PageLink → DisabledPageLink`, recordMap 평탄화 sanitize, `any`)

## 차트 (recharts 3파일) — `tax-check/_components/ui/chart/index.tsx` 로컬 래퍼(shadcn 스타일) 위에 `ProfitMarginChart`, `SalesCompareChart`. `ResponsiveContainer` + 명시 높이. **색 hex 하드코딩**(토큰 미사용)

## 트래킹 2종 — `@repo/tracking-service`(36) + **자체 DP 로그** `lib/utils/dp-logs/send-dp-log.ts`(`API_PATHS.DP_LOGS`, 실패 조용히 무시), 계산기는 `useCalculatorDpLog(toolType, …)`로만. `EventTrackingProvider`는 mixpanel만
## `@repo/platform` 14 — `initializeReactNativeBridge('bznav-plus')`, `useWindowOpen`, dp-log의 `getClientWorkingPlatform`. **`@repo/user-session`/`user-sign` 사용처 0 — 공통 로그인 패키지 미사용**
## 공통 컴포넌트 — `CommonTopNavigation`(공유/뒤로/로고 정책, `sharePage`), `JsonLd`, `RootLayoutContent`, `AccordionMorphButton`. `@ebay/nice-modal-react` 23파일 활발
