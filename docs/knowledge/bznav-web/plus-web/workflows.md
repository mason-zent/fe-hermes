# bznav-web apps/plus-web 반복 작업 절차
## 새 계산기 (가장 흔한 작업)
1. `lib/types/calc/<name>.ts`(Form/Input/Result/Step) → 2. `lib/constants/calc/<name>.ts`(`FIELD_LIMITS`, 요율표) → 3. `lib/utils/calc/<name>.ts`(순수 함수 + JSDoc 근거) → 4. `lib/hooks/calc/<name>/use-<name>-form.ts` → `use-<name>.ts`(반환 shape 통일)
5. `app/calc/<path>/page.tsx`(`'use client'`) + `_components/{InfoSection,ResultSection,InfoModal}` → 6. `app/calc/<path>/layout.tsx`(`lib/constants/calc/meta.ts`에 `<NAME>_META` 추가 → `buildServiceMetadata` + `buildWebApplicationLd` + `CommonTopNavigation`)
7. `lib/constants/calc/home-menus.ts` `CALC_HOME_SECTIONS` 등록 → 8. **`next-sitemap.config.mjs` `INDEXABLE_PATHS`에 수동 추가**(안 하면 sitemap에 절대 안 들어감) → 9. `useCalculatorDpLog` 추가 시 `lib/types/dp-logs.ts` `DpToolType` 확장
## 새 일반 페이지 — 위 5~8. 색인 제외면 `DISALLOW_PATHS`
## 스토어 — 전역·영속 `store/*.ts` `atomWithStorage`(세션은 `createJSONStorage(() => sessionStorage)`), 라우트 전용 `app/<route>/_store/`(fortune 선례). 하이드레이트 중요하면 `{ getOnInit: true }`
## 노션 콘텐츠 페이지 — 코드 변경 불필요 원칙(Notion DB 행 추가 → `generateStaticParams`). 확인: env `NOTION_TOKEN/NOTION_PAGE_ID/NOTION_DATABASE_NAME`, DB 컬럼명(`name/title/icon/color/step/creationDate`), `revalidate = 1800` 지연, 새 블록 타입은 `Renderer.tsx`, `/tax-content/*`는 sitemap 미포함
## 검증 — `scripts/verify/bznav-web.sh plus-web`
