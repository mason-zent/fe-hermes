# brand-web QA TC — 비즈넵 브랜드 사이트

> 2026-10-02 · 조사 기준 `dev` 체크아웃 `4b382c733` (`origin/prd-brand` 와 `apps/brand-web` diff 없음) · 경로는 `repos/bznav-web/apps/brand-web/` 기준
> 묶음 안내·자동화 방식 뜻: [README.md](README.md)

## 먼저 알아둘 것
1. **DatoCMS 는 서버에서만 부른다** (`lib/utils/dato-cms.ts` `requestDatoCms` → `graphql.datocms.com`). 브라우저 `page.route` 로는 응답 흉내가 안 된다 — 약관 장애 흉내는 서버 쪽 장치가 필요
2. **약관을 못 불러오면 에러 화면이 아니라 404** — `getTermsDetail` 이 오류를 삼키고 `{term:null}` → `notFound()` (`dato-cms.ts:48-67`, `terms/[...terms]/page.tsx:14-16`). `GlobalErrorBoundary` 는 브라우저 렌더 오류만, `error.tsx`·`global-error.tsx` 없음
3. **앱 다운로드 버튼은 폭이 아니라 UA 로 갈린다** — `IS_MOBILE` 은 UA(mobile·tablet) 기준(`packages/common-utils/constants/session.ts:8`). 모바일 TC 는 **모바일 UA 를 줘야** "앱 다운로드" 가 나온다(`MainSection.tsx:24,86`)
4. **문제 후보 3개** (TC 로 확인)
   - 루트 `alternates.canonical` 이 `https://bznav.com/` 고정(`app/layout.tsx:117-119`) — 모든 페이지 canonical 이 홈일 것(추측)
   - 아이콘 `/apple-touch-icon.png`·`/apple-touch-icon-precomposed.png`·`/mstile-150x150.png`(`layout.tsx:33,39,93`) 가 `public/` 에 없음(있는 건 `apple-icon.png`·`ms-icon-150x150.png`) — 404 가능
   - IMC 배너 hover 버튼 문구 `bzr; 바로가기`(`IMCBanner.tsx:33`) — 오타로 보임

## A) 화면

| 라우트 | 그룹 | 로그인 | 동적 샘플 | 근거 |
|---|---|---|---|---|
| `/` (rewrite → `/home`, URL 은 `/`) | 홈 (LogoLayout) | 불필요 | - | `next.config.mjs:38-45`, `app/home/page.tsx` |
| `/home` (직접 접근 가능, sitemap 에서만 빠짐) | 홈 | 불필요 | - | `next-sitemap.config.mjs:4,29` |
| `/brand-resource` | 브랜드 리소스 (로고만 헤더) | 불필요 | 앵커 `#brand-logo` `#service-logo` `#brand-color` `#brand-logo-usage` | `app/brand-resource/page.tsx:9-16` |
| `/terms/[...terms]` | 약관 (+ 좌측 사이드바) | 불필요 | `/terms/service`, `/terms/privacy` · 버전 `/terms/{key}/{version}` 은 DatoCMS | `app/terms/[...terms]/page.tsx`, `dato-cms.ts:27-39` |
| `/popup/terms/[...terms]` | 앱 웹뷰용 약관 (헤더·푸터·사이드바 없음) | 불필요 | `/popup/terms/service`, `/popup/terms/privacy` | `app/popup/terms/[...terms]/` |
| 없는 경로·약관 키 | 404 ("페이지를 찾을 수 없어요") | 불필요 | `/qa-404`, `/terms/qa-unknown` | `app/not-found.tsx` |
| `/tax/refund/reviews/:slug*` → `${REFUND}/home/reviews/:slug*` (308) | 리다이렉트 | - | `/tax/refund/reviews/x` | `next.config.mjs:53-57` |
| `/tax/refund/:slug*` → `${REFUND}/home/landing/:slug*` (308) | 리다이렉트 | - | `/tax/refund/abc` | `next.config.mjs:58-62` |
| `/storybook/:path*` → chromatic (307) | 리다이렉트 | - | `/storybook` | `next.config.mjs:48-52` |
| `/ping*`, `/.well-known/appspecific/com.chrome.devtools.json` | 헬스체크 `{"message":"success"}` | - | - | `proxy.ts:6-8` |
| `/sitemap.xml`, `/robots.txt` | SEO (postbuild 산출물 — 로컬 dev 에는 없음) | - | - | `next-sitemap.config.mjs` |

약관 slug: 빌드 때 `generateStaticParams` 가 `TERMS_PATH_QUERY`(`allBznavTermTypes.key` → `/terms/{key}`, `allBznavTerms` → `/terms/{type.key}/{version}`)로 만든다. 버전 없이 오면 `enforceTerm.version`. 코드에 박힌 링크는 사이드바·푸터의 `/terms/service`·`/terms/privacy`.

## B) TC

| ID | 분류 | 제목 | 뷰포트 | 사전 조건 | 단계 | 기대 결과 | 자동화 | 우선 | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| BR-001 | 스모크 | 홈 렌더 (`/` 가 `/home` 내용) | 둘다 | - | `/` 접속 | 200 · URL `/` 그대로 · h2 "모든 세무 고민, 비즈넵이 해결해드릴게요" · 서비스 섹션 3개(환급·세나·케어) · 푸터 "지엔터프라이즈(주)" | 스모크 | P0 | next.config.mjs:38-45, MainSection.tsx:79-80 |
| BR-002 | 흐름 | 히어로 배경 3초마다 교체 | 둘다 | - | `/` 3초 이상 대기 | 활성 이미지(opacity-100)가 차례로 바뀜, 세로/가로·폭(496·744px)별 이미지 | 씬 | P2 | MainSection.tsx:16-21,47-56 |
| BR-003 | 흐름 | PC 스토어 버튼 | desktop | 데스크톱 UA | "Google Play", "App Store" 클릭 | 새 탭 `play.google.com/...id=com.emmental.bznav.mobile`, `apps.apple.com/kr/app/.../id1186216942` | 씬 (새 탭 URL) | P1 | MainSection.tsx:121-155 |
| BR-004 | 흐름 | 모바일 UA "앱 다운로드" | mobile | **모바일 UA** | "앱 다운로드" 클릭 | `http://ab.bznav.com/jrja6o` · 스토어 버튼 2개 숨김 | 씬 | P1 | MainSection.tsx:23-25,86,104-118 |
| BR-005 | 흐름 | 서비스 섹션 "자세히 보기" 3개 | 둘다 | - | 각 "자세히 보기" | 새 탭 `ab.bznav.com/teslan`(환급) · `ai.bznav.com/?utm_source=bznav.homepage…`(세나) · `ac.bznav.com/ebzpik`(케어) · Lottie 목업 렌더 | 씬 | P1 | ContentSection.tsx:47-58, landing-sections.tsx:73-104 |
| BR-006 | 흐름 | IMC 배너 | 둘다 | - | 배너 클릭 · desktop hover 버튼 | 배너 `ab.bznav.com/zczou49`(_blank) · hover 버튼은 환급 링크 · 480px 기준 PC/MO 이미지 · 문구 `bzr; 바로가기` 확인 | 씬 | P2 | IMCBanner.tsx:19-33 |
| BR-007 | 흐름 | 헤더 우측 버튼 (PC) | desktop | - | "비즈넵 케어"·"비즈넵 환급"·"비즈넵 세나" · "도움말 센터" hover → 3개 | 각 서비스 도메인 새 탭(env `NEXT_PUBLIC_*_DOMAIN` 우선) · 드롭다운 `help.bznav.com/hc/ko` · `care.bznav.com/cs-center` · `help.bznav.com/hc/ko/categories/900000383946` | 씬 | P1 | HeaderItems.tsx:82-190 |
| BR-008 | 반응형 | 모바일 햄버거 메뉴 | mobile | - | 메뉴 → 항목 → 닫기 | menu↔close 아이콘 · "바로가기" 3개 · 열린 동안 `html.no-scroll` · 태블릿 폭 이상이면 자동 닫힘 · PC 버튼 숨김 | 씬 | P1 | HeaderItems.tsx:63-78,192-265 |
| BR-009 | 흐름 | 헤더 로고·푸터 링크 | 둘다 | 홈이 아닌 화면 | 로고 · 푸터 "브랜드 리소스"·"서비스 이용약관"·"개인정보 처리방침"·회사·채용·SNS | 로고 → `/` · 내부는 같은 탭 · 외부는 `_blank` + `noopener` | 씬 | P1 | HeaderItems.tsx:24-52, FooterItems.tsx:36-77 |
| BR-010 | 흐름 | 딥링크 폴백 모드 | 둘다 | - | `/?referrer=deeplink_fallback` | 헤더·IMC 배너·"자세히 보기"·푸터 링크 숨김, 회사 정보만 | 스모크 (쿼리) | P1 | useIsDeeplinkFallback.ts:4-7 |
| BR-011 | 스모크 | 브랜드 리소스 · 사이드바 앵커 | desktop | - | 사이드바 "브랜드 로고"·"서비스 로고"·"브랜드 컬러"·"로고 사용 유의사항" | 각 `#id` 로 스크롤 · 해시 변경 · 우측 버튼 없음 · `#5A2EEA` 카드 | 스모크+씬 | P0 | brand-resource/page.tsx:9-16 |
| BR-012 | 흐름 | 로고 다운로드 4개 | 둘다 | - | 각 "다운로드" | `${RESOURCE_CENTER_URL}/brand/resource/{BZNAV_logo.zip, BZNAV-Refund_logo.zip, BZNAV-Care_logo.zip, BZNAV-Sena_logo.zip}` 200 | 응답 확인 (href → HEAD) | P1 | brand-resource/_components/ContentSection.tsx:41,57-59,174-180 |
| BR-013 | 반응형 | 모바일 사이드바 숨김 | mobile | - | `/brand-resource`, `/terms/service` | `.sidebar`·구분선 `compact:hidden`, 본문 전체 폭 | 스모크 (스크린샷) | P2 | SidebarSection.tsx:5 |
| BR-014 | 스모크 | 서비스 이용약관 (시행 버전) | 둘다 | DatoCMS service 데이터 | `/terms/service` | 200 · h1 약관 이름 · "시행일자 :" + enforceTerm 버전 · `.prose` 본문 · 사이드바 2개 | 스모크 | P0 | dato-cms.ts:49-52, TermContentSection.tsx:17-24 |
| BR-015 | 스모크 | 개인정보처리방침 | 둘다 | 위와 같음 | `/terms/privacy` → 사이드바 "서비스 이용 약관" | 본문 · `/terms/service` 이동 | 스모크+씬 | P0 | terms/page.tsx:20-25 |
| BR-016 | 흐름 | 약관 버전 바꾸기 | desktop | 버전 2개 이상 | 시행일자 드롭다운 → 이전 버전 | `/terms/{key}/{version}` push · 본문·시행일 변경 · 뒤로가기 복귀 · 같은 key 버전만 | 씬 | P1 | TermContentSection.tsx:21-51 |
| BR-017 | 흐름 | 팝업 약관 (앱 웹뷰) | mobile | - | `/popup/terms/service` → 버전 바꾸기 | 헤더·푸터·사이드바 없음 · `/popup/terms/service/{v}` 로 **replace**(history 길이 그대로) | 스모크+씬 | P0 | popup/terms/[...terms]/page.tsx:17-21 |
| BR-018 | 흐름 | 약관 표 가로 스크롤 그림자 | mobile | 표가 있는 약관(privacy 추측) | 표 가로 스크롤 | `.table-container > .table-wrap` · `left-shadow`/`right-shadow` 토글 | 씬 | P2 | ArticleView.tsx:19-65 |
| BR-019 | 에러 | 없는 경로 404 | 둘다 | - | `/qa-404` → "홈으로 돌아가기" | 404 · "페이지를 찾을 수 없어요" · `/` 이동 · 이벤트 `go-to-home` · pageview `page-not-found` | 스모크 | P1 | not-found.tsx:8-29 |
| BR-020 | 에러 | 없는 약관 키·버전 | 둘다 | - | `/terms/qa-unknown`, `/terms/service/1900-01-01`, `/popup/terms/qa-unknown` | 모두 404 (팝업도 헤더 있는 404, 추측) | 스모크 | P1 | dato-cms.ts:56-58 |
| BR-021 | 에러 | DatoCMS 장애 | 둘다 | 토큰 무효·서버 흉내(브라우저 route 불가) | 캐시 안 된 `/terms/qa-new-key` | 에러 화면이 아니라 404 · 미리 만든 페이지는 revalidate 3600 동안 유지(추측) · `generateStaticParams` 실패 시 빌드 실패(추측) | 수동 | P1 | dato-cms.ts:17-20,30-38,64-67 |
| BR-022 | 에러 | 브라우저 렌더 오류 ErrorBoundary | 둘다 | 일부러 throw 하는 개발 빌드 | 오류 유발 | "에러가 발생했어요" + message · "홈으로 돌아가기" → `/` replace · 경로 바뀌면 초기화 | 수동 | P2 | GlobalErrorBoundary.tsx:11-53 |
| BR-023 | SEO | 메타데이터·JSON-LD | desktop | - | `/`, `/brand-resource`, `/terms/service` head | `/` title "비즈넵 - 쉬운 세무의 시작" · `/brand-resource` title "비즈넵 브랜드 리소스", og:image · google·naver 인증 meta · Organization JSON-LD 1개 · **canonical 이 모두 `https://bznav.com/` 인지**(문제 후보) | 스모크 (DOM) | P1 | layout.tsx:14-120,136-156 |
| BR-024 | SEO | sitemap.xml · robots.txt | - | 운영 또는 빌드 산출물 | `GET /sitemap.xml`, `/robots.txt` | `/`·`/brand-resource` 있음 · `/home` 없음 · `/terms/*` 포함 여부 기록 · robots 에 Sitemap 줄 | 응답 확인 (request) | P1 | next-sitemap.config.mjs:4-45 |
| BR-025 | SEO | 리다이렉트·헬스체크·아이콘 | - | - | `/tax/refund/abc`, `/tax/refund/reviews/x`, `/storybook`, `/ping`, `/manifest.json`, `/apple-touch-icon.png`, `/mstile-150x150.png` (따라가지 않음) | 308 → `${REFUND}/home/landing/abc`·`/home/reviews/x` · 307 chromatic · ping JSON · manifest 200 · 아이콘 2개 404 가능(문제 후보) | 응답 확인 (request) | P2 | next.config.mjs:46-64, proxy.ts:6-8 |

## 확인 방식 메모
- 같은 탭 링크(next/link): href 읽고 클릭 → 이동 확인. 새 탭(`openWindow`·`_blank`): `context.waitForEvent('page')` 로 URL 만 — 외부 페이지 내용은 보지 않는다(필요하면 `page.route('**/ab.bznav.com/**')` 로 막고 요청 URL 만)
- 앱 웹뷰에서는 `openWindow` 가 kbank·cashnote 브리지만 처리하고 나머지는 **무반응**(`packages/platform/src/hooks/use-window-open.ts:14-30`) — 비즈넵 앱 웹뷰 동작은 수동 확인(추측: `browserType=webview` 면 무반응)
- 헤더 우측 버튼은 env 도메인 우선 → dev/stg 에서 운영 단축 링크와 다른 URL 이 정상일 수 있다(`HeaderItems.tsx:91,100,109`)

## 확인 못 한 것·추측
- DatoCMS 실제 약관 key 목록(service·privacy 외)·버전 문자열 형식(`{type}-{YYYY-MM-DD}` 로 보이지만 추측) — 버전 샘플 URL 은 DatoCMS·운영에서 확인
- 빌드 산출 `sitemap.xml` 에 `/terms/*`·`/popup/terms/*` 포함 여부(popup 이 색인되면 중복 콘텐츠)
- terms 페이지 title·canonical 실제 값(메타데이터 export 없음 → 기본값·홈 canonical, 추측)
- `ArticleView` 정규식 `/(\\s?)\w+/g`(`ArticleView.tsx:23`)가 본문에서 무엇을 지우는지 — 육안 확인 권장
- `/apple-touch-icon.png` 등을 CDN·다른 경로가 주는지
- 로컬 dev 는 `pnpm gen:env`(SSM) 필요, DatoCMS 토큰이 없으면 약관 TC 전부 404(추측)

## scripts/qa 로 옮길 때
- `routes/brand-web.json`: devPort 3000 · 로그인 없음(profiles 는 logout 하나) · samples `"/terms/[...terms]": ["/terms/service","/terms/privacy"]`, `"/popup/terms/[...terms]": ["/popup/terms/service","/popup/terms/privacy"]`
- 러너에 필요한 것: App Router 화면 목록(impact.mjs 는 Pages Router 만) · 뷰포트별 UA 지정(BR-004) · 새 탭 URL 확인 단계 · `request` 로 상태 코드·리다이렉트 확인 단계(BR-024·025)
