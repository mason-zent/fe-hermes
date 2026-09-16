# bznav-web apps/brand-web 대표 패턴
- **페이지 골격**: `layout.tsx`(서버) → `LogoLayout`(Suspense) → 섹션 컴포넌트. 페이지는 조립만. 섹션이 `'use client'`(13파일)
- **클라이언트 셸** `app/_components/layout-content/BrandAppContents.tsx`: `RouterProvider(useAppRouterAdapter)` → `EventTrackingProvider(appId 'bznav-brand', isUseAuthPackages: false, mixpanel만)` → `DialogProvider` → `GlobalErrorBoundary` → `NiceModal.Provider`. `useUTM()`, `useBznavAppVersion()`. SSR 시 `if (!IS_CLIENT) updateWorkingPlatform(server)`(3앱 공통 관용구)
- **데이터**: fetch/axios 없음. **DatoCMS GraphQL 단일 경로** `lib/utils/dato-cms.ts`의 `requestDatoCms({query, variables})`(`requestPostFetch`, `DATO_ACCESS_TOKEN`). 쿼리 `lib/constants/graph-ql-query.ts`. 실패 시 `{term:null, versions:[]}` → `notFound()`
- **Jotai 사용 0** — `app/layout.tsx`의 `JotaiProvider` 1건뿐. 스토어 선례 없음
- **폼 없음**(RHF/yup 미설치). **스타일** Tailwind(`@repo/ui` 토큰 `container-xlarge`, `compact:`) + 전역 SCSS(`.prose`). SCSS 모듈 0
- **트래킹** 4파일만(`BrandAppContents`, `HeaderItems`, `not-found`). 일반 페이지에 `PageViewEventLogger` 안 붙이는 게 현 관행
- **`@repo/platform`** 7파일 — 대부분 `useWindowOpen()`(외부 서비스 링크, 웹/앱 분기 흡수)
- **메타데이터**: 루트 layout 대형 `metadata` + Organization JSON-LD. 페이지 메타는 `page.tsx`에 `export const metadata`(빌더 유틸 없음)
- **에러**: `GlobalErrorBoundary`가 `usePathname()`을 `key`로 → 라우트 이동 시 리셋
