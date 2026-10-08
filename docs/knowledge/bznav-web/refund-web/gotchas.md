# bznav-web apps/refund-web 함정·이력

- **`lib/utils/feature-rollout.ts`(djb2 버킷 롤아웃) 삭제**(REF-3643 `8027105`, 결정확인 폴링 100% 도입). 점진 롤아웃이 필요하면 새로 설계해야 한다. 조회결과 A/B는 `use-lookup-result-lab.ts`의 `FIXED_LAB_ID`(현재 `'EXPERIMENT_A'`, REF-3843 3차 실험 종료로 고정)
- **Relay 아티팩트 미커밋** — `graphql/__generated__/`에 md만. clone/스키마 변경 후 `pnpm --filter refund-web gen:relay` 안 하면 import 전부 깨짐. `build`·`dev`엔 포함, `lint`/`tsc` 단독엔 없음(표준 검증 스크립트는 아티팩트가 없으면 타입 검증을 건너뛴다)
- **`next.config.mjs`의 relay 블록은 실물과 어긋남**: `schemaExtensions: ['schema/schemaExtensions/']` 디렉터리 없음, `src: '.'`/`schema: 'schema/schema.graphql'`도 실제 위치(`graphql/schema/`)와 다름. **동작하는 것은 `relay.config.json`** — next.config를 근거로 경로를 바꾸지 말 것
- **Pages Router 전용**(`rules.md` 필수) — `next/navigation`·Route Handler 도 쓰지 않는다
- **xstate·jspdf·html2canvas는 설치만**(사용 0). "xstate 상태 머신"이라고 적힌 기존 문서는 오류
- **SVGR 설정이 두 벌**: `next.config.mjs` 에 `turbopack.rules['*.svg']` 와 `webpack()` 이 모두 있고, `dev` 는 `--webpack` 이다(`build` 는 플래그 없음). 한쪽만 고치면 번들러에 따라 SVG 동작이 달라진다 — 둘 다 맞추고 `build` 로 확인. `declaration.d.ts`의 `*.svg → any`는 `any` 금지 규칙과 충돌하지만 기존 파일이라 건드리지 말 것
- **`gen:env`는 AWS 의존**(SSM). 자격증명 없으면 `dev` 첫 단계 실패
- **CSP**: `NEXT_PUBLIC_FRAME_ANCESTORS` 비면 `X-Frame-Options: SAMEORIGIN`. 새 외부 스크립트는 `script-src` 화이트리스트 추가 필요
- **CDN assetPrefix** — `NEXT_PUBLIC_ZENV` 가 `loc` 가 아니면 `${NEXT_PUBLIC_CDN_BASE_URL}/bznav-refund-web/${NEXT_PUBLIC_BUILD_ID}`(5앱 중 빌드 ID 가 붙는 건 refund-web 뿐). 두 env 비면 `undefined`가 경로에 박혀 정적 자산 전부 404. `output: 'standalone'`
- `package.json` `exports: { ".": "./index.ts" }`는 존재하지 않는 파일 — 앱을 패키지로 import 시도 금지
- **루트 `pnpm gen:relay` 금지** — refund-web `gen:schema` 가 돌아 `graphql/schema/schema.graphql` 을 dev 게이트웨이 스키마로 덮어쓰고 Relay 컴파일은 안 된다. 반드시 `--filter refund-web gen:relay`
- **`.mjs` 확장자 import**(`@/lib/seo-policy.mjs`, `sitemap.mjs`) — 타입 없음, TS 쪽에서 손으로 타입 맞춤
- **cookies-next 6.x는 gSSP에서 Promise + JSON 미파싱** — `lib/content-page/server.ts`, `use-partner-main-image.ts`에 함정 주석. 새 gSSP 쿠키 읽기 주의
- `_app.tsx` `seoHead` 우선 — 콘텐츠 페이지 외에서 `<Head><title>` 또 넣으면 메타 중복(`home/event/share` 주석)
- **Relay는 SSR 되지 않는다** — SEO 데이터는 `lib/graphql/server-fetch.ts`로 gSSP에서. 로그인 의존 Relay는 `<Suspense>`로 격리
- **템플릿 버전 폴더(`lookup/result/apply-possible/template/v-*`) 삭제 금지** — 과거 신청 스냅샷 재현용
- `reactStrictMode: false`
- **토스 계열(`toss`·`tossincome`) 분기는 `isTossPlatform`/`TOSS_APP_LIST`**(REF-3652, prd-refund `06c3fbf` 이후) — `'toss'` 문자열 비교로 새로 분기하면 토스인컴이 빠진다. 헤더·뒤로가기·CI 인증은 레이아웃이 처리한다(`patterns.md` P11-1). `pages/auth/sign-out` 은 서버 쿠키로 플랫폼을 props 로 내려 만료 안내 문구 깜빡임을 막는다 — CSR 판정으로 바꾸지 말 것
- 한국어 설명 주석이 촘촘하다(`lib/content-page/*`, `use-partner-main-image.ts`, `use-lookup-result-lab.ts`, `seo-policy.mjs`) — 수정 전 필독
- **agent.md 낡음**: "SCSS·Tailwind 혼용 유지"라지만 실제 SCSS 19 vs Tailwind 218. 어드민 콘텐츠 페이지·SEO 정책·파트너 UTM·`proxy.ts` 미들웨어가 문서에 없음. `.ai/basic-rule.md` 위반 기존 코드(any, 한글 키)는 정리하지 말 것

## 학습

학습 루프로 들어온 줄 — 현황판 [학습] 탭에서 수정·삭제한다. 쉬운 설명은 `docs/knowledge/learned/`
- BZNAVSans의 font-display는 fallback으로 유지하고 optional로 바꾸지 않는다 — 이 글꼴에는 아이콘 글리프도 들어 있어서, 첫 방문 때 글꼴이 늦게 오면 아이콘이 □로 보이고 폰트가 나오지 않는다. 선언은 packages/ui/src/styles/globals.css에 있어 5개 앱이 같이 쓰고, refund-web에서는 _document.tsx의 preload로만 조정한다. <!-- learn:20261008-bznav-web-refund-web-learn-gotchas-de8f32 -->
