# web-op 반복 작업 절차

## A. 새 화면 — documents/employee 계열(권장)
1. `app/<domain>/<route>/page.tsx` 서버 껍데기(필요 시 `dynamic = "force-dynamic"`)
2. `src/containers/<domain>/XxxContainer.tsx`(`"use client"`, 상태·오케스트레이션). 문구는 같은 폴더 `copy.ts`, 매핑은 `documentConfig.ts`식 순수 모듈
3. `src/components/<domain>/<feature>/*.tsx` 프레젠테이션만. UI는 **먼저 `@zenterprise-inc/bznav-fe-ui`에서 찾고**, 없을 때만 `src/components/common`(AGENTS.md상 사용자 확인 필요 → 헤르메스에 보고)
4. 데이터는 `src/hooks/<domain>/useXxx.ts` → gateway(**B계통 axios 직접**, `BaseApiGateway` 상속 금지)
5. 레이아웃 `ContainerLayout`, 토스트/다이얼로그는 `bznav-fe-ui`의 `useToast`/`useDialog`(라우트 `layout.tsx`에 `DialogProvider`+`Toaster` 필요)
6. 이벤트는 `useEventLogger()`(`useRef` 1회 가드)
7. 검증 `scripts/verify/web-op.sh` (**`pnpm build`는 타입 에러를 무시하므로 typecheck 필수**)

## A'. sales 계열(기존 수정 시)
- `app/sales/<route>/page.tsx` = `"use client"` + `<SalesContainer headerType={SalesHeaderType.X}><SalesXxx/></SalesContainer>`. 본체는 `src/components/sales/<feature>/index.tsx` + `style.ts`
- 인증 필요 화면은 `useSalesAuthStore.getState().userInfo?.authorizationToken`을 gateway `token`으로. 인증 관련이면 `SalesAuthUseCase`에 메서드 추가, 그 외 조회는 gateway 직접

## B. 새 Route Handler
1. `app/api/<path>/route.ts`. 동적 세그먼트는 `context: { params: Promise<…> }` + `await context.params`(Next 16)
2. 로직은 `src/backend/service/XxxService.ts` 클래스(생성자에서 repository 인스턴스화, `public async`)
3. 외부 호출은 `src/backend/repository/external/XxxApiGateway.ts`(axios + `throw error.response`), 저장소는 `RedisRepository`. **route에서 repository 직접 호출 금지**(현행 위반 0)
4. 에러는 `CommonException` 팩토리 throw → route catch에서 `{message}` + `status: error.httpStatus ?? error.status`
5. 시크릿: `.env.example`에 이름만 추가, `NEXT_PUBLIC_` 금지, `_proxy.ts`의 `getApiKey()`처럼 미설정 시 500 반환 가드. 배포는 Secrets Manager → Dockerfile builder에서 `.env`
6. 콘솔이 호출하는 내부 API면 `ApiResponse(request, async () => …)`로 JWT 검증

## C. 외부 API 연동
- 서버 경유(시크릿/CORS): `backend/repository/external/` gateway → service → route → 클라 gateway가 `/api/...` 호출(예 Pipedrive)
- 단순 프록시: `app/api/<domain>/_proxy.ts`에 `getApiKey/buildHeaders/proxyFetch` 모으고 route는 3~10줄(employee 방식). long-poll이면 `proxyFetchStream`처럼 **본문을 파싱하지 말고 스트림 그대로**(ELB 504 회피)
- 새 외부 이미지 도메인은 `next.config.js` `images.remotePatterns`

## D. 컬럼·필터 추가
- documents 서류 종류: `types/DocumentType.ts`의 `RequireDocumentType` enum — ⚠️ **숫자 값은 zent API·브릭스 어드민과 공유 계약, 변경·재배열 금지**. 표시는 `containers/documents/documentConfig.ts`(`CATEGORY_UX`)·`documentMeta.ts`, 값은 서버 `documentInfo` 우선·로컬은 폴백
- sales 실적: `components/sales/detailList/index.tsx`(`getStatus()`), `components/sales/filterSelector`, `monthlySelector`. 파라미터는 `SalesDataApiClient → /api/sales/statstics|summary|settlement → SalesDataService(마스킹) → SalesExternalApiGateway` **전 구간** 추가

## E. 검증
```bash
pnpm lint        # eslint + prettier --check
pnpm typecheck   # 필수 — build 는 ignoreBuildErrors: true
node scripts/run-salesjwt-test.cjs   # 유일한 테스트
```
- 포맷 위반 파일 4개가 이미 있어 `prettier --check`가 실패할 수 있다(gotchas). 그 파일들을 건드리면 diff가 튄다 — 포맷과 기능 변경을 섞지 말 것
