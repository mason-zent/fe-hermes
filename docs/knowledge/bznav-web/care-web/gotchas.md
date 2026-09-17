# bznav-web apps/care-web 함정·이력

- **Relay 아티팩트 미커밋**(`.gitignore:51`) — pull 직후 `@/__generated__/*` 타입 에러는 정상. `pnpm --filter care-web relay`
- **문서가 코드보다 낡음** — `care-web.agent.md:27`·`.ai/basic-rule.md`는 `constant/paths.ts`(실제 `constants/`). NEWCARE-633으로 도메인 파일 이동·`libs/{kakao,channelTalk,eventLogger}` 신설·`hooks/`·`store/` 루트화. 옛 import 경로 기억 버릴 것
- **`gen:env` 스크립트 없음** — 5개 앱 중 **care-web 만** 없다(brand·sena 는 `dev` 에서 자동 실행, refund 도 `dev` 에 포함, plus 는 있지만 수동). env 는 수동(Secrets Manager): `node scripts/generate-env.mjs --app=care-web --env=<env> --source=sm`. 참조 `NEXT_PUBLIC_ZENV`, `NEXT_PUBLIC_RESOURCE_CENTER_URL`, `NEXT_PUBLIC_TRACKING_DEBUG_MODE`
- **미들웨어 순서 = `composeMiddleware` 인자 앞이 먼저**(`reduceRight`). NEWCARE-550 `f4e06be07`이 `withLandingRedirectMiddleware`를 앞으로 + 리다이렉트 시 `url.search=''`. 추가·재배치 시 루프·쿼리 유실 확인
- **차단된 랜딩** `BLOCKED_LANDING_PATHS`(1인사업자·미용·요식·통판·첫달무료·종소세) → `/`로 리다이렉트(NEWCARE-528). 파일이 있어도 동작 안 함. **`/premium`만 활성**
- **`@repo/ui`에서 문의 버튼 제거**(NEWCARE-629) → `app/pricing/components/TopNavigationInquiryButton.tsx`. `@repo/ui`에서 import하면 깨짐. 채널톡 열기는 `@/libs/channelTalk`
- **deprecated `ToastProvider` / SSR 상충** — `GlobalProvider.tsx`의 `SSR_PATHS`에 vat·billing·four-insurance 경로를 넣으면 `useCareToast`가 런타임 throw(주석 경고)
- **한글 식별자**: 경로 키, 폼 필드 키, 이벤트 카테고리. 숫자 시작 키는 `CARE_PATHS['4대보험…']`
- **동적 렌더 강제**(루트 layout의 `await getServerWorkingPlatform()`) — 정적 최적화 효과 없음
- **`proxy.ts`** = Next 16 미들웨어 파일명. `middleware.ts`를 찾지 말 것
- `components.json` `aliases.utils: "@/libs/utils"` 실재 없음(실제 `utils/`) → shadcn CLI 산출 경로 오류 가능
- `motion`(deps) 0 / `framer-motion`(devDeps) 3파일 사용 — 선언 불일치(추측: 마이그레이션 잔재)
- `public/sitemap.xml`·`robots.txt`가 커밋됐지만 `.gitignore`는 무시 규칙 → `postbuild`가 지우고 재생성해 로컬 빌드 후 diff
- **`billing/refactor/`** 신구 UI 공존 — 어느 쪽이 활성인지 라우팅 먼저 확인
- ⚠️ 1건 `libs/social/socialAuthorizeUrl.ts:49`(`auth_type=reauthenticate` 미실측). TODO 27파일(`useGetVatStatus.ts` CARE-5641, `BookPageLayout.tsx`, `userInfoAtom.ts`, `InternalLinkSection.tsx` BZC2-2528 …). `TODO-REFACT[이름]` 관례
- PDF 뷰어 14파일 중복(공통화 안 됨)
