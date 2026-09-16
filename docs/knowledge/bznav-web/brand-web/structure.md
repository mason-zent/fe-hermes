# bznav-web apps/brand-web 구조 맵
기준 `origin/prd-brand` `7f052c0c3`, 파일 93개, 최근 180일 커밋 24건(유지보수 단계). 경로 `apps/brand-web/` 기준. 레포 공통 `../common.md`.

## app/
| 경로 | 역할 |
|---|---|
| `layout.tsx` | RootLayout. 대량 `metadata`(icons·verification·canonical), Organization JSON-LD 인라인, `getServerWorkingPlatform()` → `BrandAppContents` |
| `home/` | 실질 메인(`/`의 rewrite 목적지). `MainSection` + `IMCBanner` + `ContentSection` 조립. `_components/CareInductionModal` |
| `brand-resource/` | 브랜드 리소스(로고·컬러). 페이지에 `metadata` export |
| `terms/[...terms]/` · `popup/terms/[...terms]/` | 약관 catch-all(팝업은 헤더/푸터 없음). `generateStaticParams` + `revalidate = 3600` |
| `not-found.tsx` | `LogoLayout` + `InfoView` + `PageViewEventLogger` |
| `_components/` | `GlobalErrorBoundary`, `SidebarSection`, `layout-content/{Layouts,LayoutItems,HeaderItems,FooterItems,BrandAppContents}`, `terms/{ArticleView,TermContentSection}` |

## 디렉터리
`lib/constants/`(`common.ts` SERVICE_LINKS+UTM, `platform.ts`, `graph-ql-query.ts` DatoCMS 쿼리, `landing-sections.tsx`) · `lib/types/` · `lib/utils/dato-cms.ts`(**유일한 데이터 소스**) · `hooks/useIsDeeplinkFallback.ts` · `styles/default.scss`(전역 1개, `.prose`) · **`store/` 없음**

## 스크립트·설정
- `dev`: `pnpm gen:env && next dev -p 3000 --turbo`(**gen:env 자동**, SSM `--env=loc`) · `postbuild`: next-sitemap(manifest에서 정적 라우트 자동 수집, `EXCLUDE_ROUTES=['/home']`)
- `next.config.mjs`(3앱 중 유일하게 webpack 커스텀): assetPrefix `${CDN}/bznav-brand-web`(빌드 ID 없음), `productionBrowserSourceMaps: true`, **rewrite `/` → `/home`**, redirect `/storybook/*` → chromatic, `/tax/refund/*` → `NEXT_PUBLIC_REFUND_DOMAIN`(308), SVGR
- `proxy.ts`: `/ping` 응답만
