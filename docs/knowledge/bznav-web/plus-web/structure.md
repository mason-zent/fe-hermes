# bznav-web apps/plus-web 구조 맵
기준 `origin/prd-plus` `edc6fe300`, 파일 234개, 최근 180일 커밋 112건. 경로 `apps/plus-web/` 기준. 레포 공통 `../common.md`.

## app/
| 경로 | 역할 |
|---|---|
| `layout.tsx` | `metadataBase`, `robots`(prd만 index), `JsonLd data={SITE_LD}`, **`export const dynamic = 'force-dynamic'`** |
| `calc/(home)/` | 계산기 허브(`CALC_HOME_SECTIONS`) · `calc/layout.tsx`(`_styles/calc.scss`) |
| `calc/{sales,bep,holidaypay}/`, `calc/salary/{(contract),actual}/`, `calc/tax/{vat,simplevat,penalty}/` | 계산기 8종. 각 `page.tsx`(client) + `layout.tsx`(metadata/JsonLd/TopNav) + `_components/{입력 Section, ResultSection, InfoModal}` |
| `calc/menu/` · `calc/_components/`(`CalcSummary`, `CalcTableRow`, `CalcPriceUnit`, `SlotMachineNumber`) | |
| `tax-check/` | 세무진단: `page`(랜딩) → `simple-auth/`(+`confirm`) → `collection/`(+`error`) → `result/`. `_components/ui/{button,chart,layout}` |
| `tax-content/[slug]/` | 노션 콘텐츠 상세(`Renderer`, `ContentDetailHeader`, `AppInstallBanner`) + `styles/renderer.style.css` |
| `fortune/` | 사주·운세. `_components/`(7), `_canvas/sparkle.ts`, `_store/`, `_styles/fortune.scss`, `share/` |
| `_components/` | `RootLayoutContent`, `CommonTopNavigation`, `JsonLd`, `AccordionMorphButton` — 4개뿐 |

## 디렉터리
`lib/api/`(12: notion 3, 세무진단 5, `dp-logs`, `fortune`, `terms`) · `lib/hooks/calc/`(계산기별 `use-<name>.ts` + `use-<name>-form.ts` ×7 + 공통 3) · `lib/hooks/{common,simple-auth,fortune}/` · `lib/utils/calc/`(순수 계산 8) · `lib/utils/{seo,dp-logs,common,form}/` · `lib/constants/calc/`(12: 요율표·`FIELD_LIMITS`·`meta`·`home-menus`) · `lib/types/calc/`(10) · **`lib/regex/schema/`**(yup) · **`store/auth-store.ts`**(루트, `lib/` 밖) + `app/fortune/_store/` · SCSS는 라우트 스코프(`calc/_styles`, `fortune/_styles`), 모듈 0

## 스크립트·설정
- `dev`: `next dev -p 3400 --turbo` — **`gen:env` 미포함**(3앱 중 유일). `gen:env`: `--env=dev --app=plus-web`, `SM_APPS`에 걸려 **Secrets Manager**. `postbuild`: next-sitemap(**`exclude: ['/*']` + `INDEXABLE_PATHS` 11개 화이트리스트 수동**, `DISALLOW_PATHS`)
- `next.config.mjs`(가장 짧음): assetPrefix `${CDN}/bznav-plus-web`, **redirect `/` → `/calc`** 하나. `proxy.ts`: `matcher` 명시, 플랫폼 쿠키만
