# bznav-web apps/brand-web 함정
- **`gen:env` 자동 실행** — AWS 자격증명(SSM, loc) 없으면 `dev` 실패. agent.md는 이걸 언급 안 함(sena만) → 코드 우선
- **`/` → `/home`은 rewrite**(URL은 `/`). sitemap이 `/home` 제외·`/` 추가. `/home`을 링크에 직접 쓰면 중복 색인
- `/tax/refund/*` redirect는 **308 permanent** — 캐시 오래 남음
- assetPrefix에 **빌드 ID 없음**(sena는 있음) → CDN 무효화 방식이 다름. 최근 유일한 변경(2026-09-15 EKS CDN 경로)
- `productionBrowserSourceMaps: true` — 3앱 중 brand만 프로덕션 소스맵 노출
- **Jotai Provider만, 사용 0**. `date-fns` 사용 0 — 둘 다 설치만
- devDependencies인 `@repo/ui`(15)·`@repo/common-utils`(5)를 런타임 사용(3앱 공통). 임의로 옮기지 말 것
- TODO/⚠️ 0건
