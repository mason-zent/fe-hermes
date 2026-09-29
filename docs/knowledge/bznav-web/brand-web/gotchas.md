# bznav-web apps/brand-web 함정
- **`gen:env` 자동 실행** — AWS 자격증명(SSM, loc) 없으면 `dev` 실패. agent.md는 이걸 언급 안 함(sena만) → 코드 우선
- **`/` → `/home`은 rewrite**(URL은 `/`). sitemap이 `/home` 제외·`/` 추가. `/home`을 링크에 직접 쓰면 중복 색인
- `/tax/refund/*` redirect는 **308 permanent** — 캐시 오래 남음
- assetPrefix에 **빌드 ID 없음**(sena·plus 도 없다. 빌드 ID 가 붙는 건 refund-web 뿐)
- `productionBrowserSourceMaps: true`(5앱 중 brand 만) + `webpack()` 의 `hidden-source-map`. 실제 노출 여부는 빌드 산출물로 확인 필요
- **`webpack()` 블록이 운영 빌드에 적용되는지 확인 필요** — `build` 는 번들러 플래그가 없고 `turbopack: {}` 는 비어 있다(Next 16 기본 Turbopack 이면 SVGR·소스맵 설정이 빠진다 — 추측입니다). refund·care 는 `turbopack.rules['*.svg']` 를 따로 둔다. 설정을 고치면 `pnpm --filter brand-web build` 로 확인
- **Jotai Provider만, 사용 0**. `date-fns` 사용 0 — 둘 다 설치만
- devDependencies인 `@repo/ui`·`@repo/common-utils`를 런타임 사용(brand·sena·plus 공통). 임의로 옮기지 말 것
