# bznav-web apps/care-web 반복 작업 절차

## A. 새 화면 (route group 안)
1. 소속 결정: 로그인 온보딩 `app/(auth)/`, 마이페이지 `app/(my-info)/`, 랜딩 `app/(landing)/`(퍼포먼스는 `(performance-landing)/`), 도메인 서비스 `app/{vat,global-income,payroll,…}/`
2. `page.tsx`(`'use client'`, 내부 컴포넌트를 `<Suspense>`로, Relay 훅은 안쪽) + `CareLayout` + `@repo/ui` `BaseTopNavigation`/`BackButtonTopNavigation`
3. 인증: 상위 layout이 `CareAuthGuard`로 감싸는지 확인. 새 최상위 도메인이면 `layout.tsx`에 추가
4. 메타데이터: 같은 폴더 `metadata.ts` + 서버 `layout.tsx` `export const metadata`
5. 뷰 이벤트 `<ViewEventLogger careEvent={{category, object}}>`, 카테고리는 `constants/careEvent.ts`
6. **전용 파일은 라우트 폴더 옆 `components/`, `hooks/`, `graphql/`, `store/`, `constants/`, `utils/`, `types/`**(NEWCARE-633 규칙). 루트 공용 폴더에 두지 말 것
7. 검증: **Relay 아티팩트를 먼저 만든다** (`pnpm --filter care-web relay`) → `scripts/verify/bznav-web.sh care-web`. 스크립트는 **lint → (아티팩트 있으면) type-check → (canvas 빌드돼 있으면) test:unit** 순으로 돌고, **Relay 를 생성해 주지 않는다.** 아티팩트가 없으면 타입 검증을 건너뛰고 그 사실을 표에 남긴다

## B. 새 경로 상수
1. `constants/paths.ts`에서 소속 객체 선택(`CARE_PATHS` / 도메인별 `*_PATHS`)
2. 한글 키 + URL. 숫자 시작은 따옴표. 동적은 함수형(`YEAR_END_TAX_PATHS`) 또는 base + 템플릿
3. 퍼포먼스 랜딩이면 `PERFORMANCE_LANDING_PATHS`에도. 미들웨어(`withLandingRedirectMiddleware`)도 `CARE_PATHS` 참조

## C. Relay 쿼리
1. `pnpm --filter care-web gen:schema:dev`(dev2/prd) → `schema/schema-care.graphql`(**커밋**)
2. 라우트 옆 `graphql/<name>.ts`에 `graphql\`query <name>Query…\`` — union 응답은 `__typename` + `... on BaseError/TemporaryError`
3. `pnpm --filter care-web relay` → `__generated__/`(커밋 안 함)
4. 같은 도메인 `hooks/use<Name>.ts`(`'use client'`) 래퍼. 타입 `@/__generated__/<name>Query.graphql`
5. 호출 컴포넌트는 `Suspense` 안

## D. atom 추가
- 라우트 `store/<name>Atom.ts`(전역은 루트 `store/`). 휘발 `atom<T>`, 영속은 P6의 3종 세트 + **`STORAGE_KEYS`에 키 추가**. 도메인 훅(`hooks/use<X>`)으로 감싸는 사례 많음

## E. 테스트 — `__test__/unit/<domain>/<name>.test.ts`, `@jest/globals`, `@/` alias, 순수 함수만. `pnpm --filter care-web test:unit`. 컴포넌트 테스트는 선례 없음(도입 시 합의)

## F. SEO — 메타는 layout+`metadata.ts`, JSON-LD는 `<JsonLd data/>` 재사용(URL은 `new URL(path, SERVICE_ORIGIN)`), 색인 허용은 `next.config.mjs` `INDEXABLE_PATHS`, sitemap은 `next-sitemap.config.mjs` `additionalPaths`, 통이미지 랜딩은 `landingSeo.ts` + sr-only

## G. 미들웨어 추가·재배치
- `proxy.ts`의 `composeMiddleware` 인자 **앞쪽이 먼저**. 리다이렉트 시 `url.search = ''`로 쿼리를 비워 뒤쪽 미들웨어의 중복 리다이렉트를 막는다(NEWCARE-550). UTM은 점검 미들웨어가 쿠키로 저장해 유실 없음. **루프·쿼리 유실 반드시 확인**

## H. 검증
```bash
pnpm --filter care-web relay        # 먼저
pnpm --filter care-web type-check
pnpm --filter care-web lint
pnpm --filter care-web test:unit
```
