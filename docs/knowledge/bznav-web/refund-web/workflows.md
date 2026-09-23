# bznav-web apps/refund-web 반복 작업 절차

## A. 새 랜딩/이벤트 페이지 — 먼저 어느 갈래인지 확인
**(A) 어드민(BE) 콘텐츠 — 기본. 대부분 코드 변경 없음**
1. 어드민에서 `path`(예 `/event/foo`)·이미지·CTA·meta 등록 → `pages/event/[...slug].tsx`가 서빙(depth≤3)
2. 새 **prefix**가 필요할 때만 `pages/<prefix>/[...slug].tsx`를 15줄 골격 복제, `resolveContentPath('<prefix>', params?.slug)`만 교체. 정적 라우트 충돌 확인
3. sitemap은 BE `getRefundContentPageSitemap`으로 자동. OG/canonical도 `seoHead`로 자동

**(B) FE 하드코딩 랜딩**
1. `components/landing/`에 컴포넌트(`LandingLayout` + `ImagesReadyGate` + `SectionScrollModelProvider`)
2. SEO 텍스트는 `lib/constants/*-seo.ts` 상수 + sr-only 렌더
3. `pages/...` + `Page.getLayout`, `lib/constants/paths.ts` 경로 상수
4. 색인 대상이면 `lib/seo-policy.mjs` `SITEMAP_PUBLIC_ENTRIES`. `lastmod` 는 날짜(`YYYY-MM-DD`)와 **시간대 포함 datetime 을 모두 받고**, 형식이 맞지 않으면 URL 은 남고 **`lastmod` 만 빠진다**(URL 이 통째로 드롭되는 것이 아니다 — `lib/sitemap.mjs`). sitemap XML 자체는 BE 콘텐츠 목록과 정적 목록을 **FE(`pages/api/sitemap.ts`)가 병합·중복 제거해** 만든다. BE 조회가 실패하면 정적 목록만 쓴다
5. OG가 다르면 `components/layout/OgMetaHead.tsx` `ogContent` + `getOgMetaData` 분기

## B. 새 Relay 쿼리
1. 스키마 변경 시 `pnpm --filter refund-web gen:schema` → `graphql/schema/schema.graphql`(**커밋**)
2. `graphql/query/<도메인>/<name>.ts`에 `export const xxxQuery = graphql\`query <uniqueName>Query(...) {...}\`` — **operation 이름 전역 유일**(haste). 파일 kebab, export camel
3. `pnpm --filter refund-web gen:relay` → `graphql/__generated__/*.graphql.ts`(커밋 안 함)
4. 소비: 리스트/설문형 `useQueryLoader`+`usePreloadedQuery`, 단순 `useLazyLoadQuery`, 명령형 `fetchQuery`. 뮤테이션은 `lib/hooks/<도메인>/api/use-*.ts` 래퍼
5. 타입 `@/graphql/__generated__/<opName>.graphql`

## C. 스토어 추가
- `lib/stores/<name>.ts` 또는 `<domain>/<name>.ts`. 휘발 `atom`, 파생 `atom(get => …)`, 복구 필요 시 `atomWithStorage(key, init, createJSONStorage(() => sessionStorage))`(localStorage 선례 없음). 키는 최근 관례 `refund_<도메인>_<항목>`. 스코프 필요 시 Provider 안 `JotaiProvider` 중첩

## D. 파트너 UTM 케이스
1. `lib/hooks/marketing/use-partner-main-image.ts` `PARTNER_UTM_SOURCES`에 소문자 소스
2. CDN에 `main-introduce-<source>.png` 업로드(파일명 규칙 고정). alt는 `ROOT_LANDING_IMAGE_ALT['main-introduce']` 공용
3. 광고 플랫폼 클릭키면 `use-affiliate.ts` 분기

## E. SEO 메타
- 어드민 페이지: 어드민 입력만 · 정적 라우트: `OgMetaHead.tsx` · 색인 제외: `seo-policy.mjs` `NOINDEX_PATH_PREFIXES/EXACT_PATHS`(헤더·canonical 동시 반영) · sitemap: `SITEMAP_PUBLIC_ENTRIES` · JSON-LD: `pages/help/*` 복제(`\\u003c` 이스케이프 유지)

## F. 검증
```bash
pnpm --filter refund-web gen:relay          # 아티팩트 없으면 타입 에러 폭발
scripts/verify/bznav-web.sh refund-web      # lint + tsc --noEmit (아티팩트 유무 확인 포함)
pnpm exec prettier --check <변경파일>
```
- 루트 `pnpm gen:relay`는 refund-web에 `compile:relay`가 없어 no-op → 반드시 `--filter refund-web gen:relay`
