# web-op 대표 패턴 파일

코드에서 실제 반복되는 것만. 경로는 레포 루트 기준, `origin/prd` `4ac5be7`. **레이어 규칙은 도메인마다 다르게 지켜진다** — 하나로 일반화하면 틀린다.

## P1. 컨테이너/컴포넌트 분리 — 도메인별로 규칙이 다르다
- **documents(정석, 신규 기준)**: `app/documents/[key]/page.tsx` → `src/containers/documents/DocumentSubmissionContainer.tsx`(418줄, 상태·오케스트레이션) → `src/components/documents/submission/*`(15개 순수 프레젠테이션) + 같은 폴더 `copy.ts`/`documentConfig.ts`/`documentMeta.ts`/`notionGuide.ts`(순수 매핑 모듈)
- **sales(구형)**: `app/sales/**/page.tsx`는 `"use client"` + `<SalesContainer headerType={…}><SalesXxx/></SalesContainer>` 껍데기. 화면 로직·페칭은 **`src/components/sales/*`**(`home/index.tsx` 237줄이 gateway 직접 호출). 즉 sales에서 container는 레이아웃·가드, component가 화면
- **employee**: 컨테이너가 곧 화면(`src/containers/employee/*` 8개), `components/employee`는 1개. 분기 허브 `app/employee/[key]/EmployeeKeyClient.tsx`
- `"use client"` 38파일

## P2. Zustand (`src/store/*`, 3개, 미들웨어 없음)
- `create<State>((setState, getState) => ({…}))`. 세션 스토리지는 인자로 주입(`initUserInfo(storage)`, `setLoginUser(token, storage)`)
- `useSalesAuthStore`(named) — 훅 구독보다 **`useSalesAuthStore.getState()` 직접 호출 + `.subscribe()`**가 주 사용법 · `useToastStore`(**default export**, `showToast({message,status,showingTime})`) · `useLoaderStore` — `{ isLoading }`만 있고 setter 없음(사실상 죽은 스토어)

## P3. gateway(axios) — 세 계통 공존. **신규는 B**
- **A `BaseApiGateway` 상속**(`src/gateway/BaseApiGateway.ts`, 5개 상속): `get/post/put/delete({url, pathParams, params, authToken})`. ⚠️ **catch에서 `alert(…)` 후 `undefined` 반환 — 에러를 삼킨다**. 호출부가 실패를 성공으로 오인. 신규 코드에서 상속 금지
- **B axios 직접**(documents 신규): `DocumentUploadGateway`, `DocumentFileGateway`, `DocumentPipedriveGateway` — 파일 상단 주석에 A를 쓰지 않는 이유 명시. 에러는 throw 또는 `null`/`false` 반환 → 훅이 분류
- **C 타입만**: `src/gateway/EmployeeGateway.ts`는 DTO 타입만, employee는 `fetch()` 직접
- 에러 분류 모범: `src/hooks/documents/useSubmitDocuments.ts` — `SubmitResult = {ok:true} | {ok:false, reason:'FILE', failedFiles} | {ok:false, reason:'TRANSIENT'}` 판별 유니온, `isAxiosError`로 4xx=파일 거절 / 그 외=일시 오류

## P4. useCase — sales 인증에만 1개
- `src/useCases/SalesAuthUseCase.ts`: `SalesAuthUseCase(router)` 팩토리 → `{signin, signup, signout, isValidChannelId, setupMfa, verifyMfaSetup, verifyMfa, disableMfa}`. store 갱신 + `router.push` + `alert` 검증 + JWT 암호화를 모두 수행. **AGENTS.md도 "영업 인증 도메인 예외 패턴"이라 명시** → 일반 규칙으로 쓰지 말 것

## P5. 커스텀 훅(13) — documents/employee의 "컴포넌트 → 훅 → gateway"
- `useDocumentFiles`(파일 상태 머신), `useSubmitDocuments`(업로드 오케스트레이션), `useResolvedFileUrl`, `useCertFlowByKey`(long-poll, `useDialog`), `useCertPolling`, `useCountdown`, `useRetryCooldown`, `useInFlowBackGuard`, `useDevOverride`, `useEventLogger`(Mixpanel)

## P6. Route Handler 골격 — controller는 거의 없다 (30개 중 2개)
```ts
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params            // Next 16: params 는 Promise
  try {
    const token = request.headers.get('Authorization'); if (token === null) throw FORBIDDEN()
    const result = await new SalesDataService().getXxx(params, token)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? error.data.message ?? '오류가 발생하였습니다.' }, { status: error.httpStatus ?? error.status })
  }
}
```
- `ApiResponse(request, async () => {…})`(controller)는 콘솔이 부르는 내부 API 2개만 — Bearer를 `AuthService.verifyAuth`(JWT+Redis)로 검증
- **route → repository 직접 호출 0건**(service→repository 규칙은 잘 지켜짐). 세그먼트 설정: `dynamic = "force-dynamic"`(ping, notion-guide, sales/auth, employee), `runtime = "edge"`(upload), `"nodejs"`(notion-guide)
- 예외 팩토리 `types/exceptions/CommonException`: `BAD_REQUEST()/NOT_FOUND()/UNAUTHORIZED()/FORBIDDEN()/INTERNAL_SERVER_ERROR()`

## P7. 서버 전용 시크릿
- `EMP_INS_NOTI_API_KEY`: `app/api/employee/_proxy.ts`의 `getApiKey(): {key} | {error: NextResponse}` — 미설정 시 500 **반환**(throw 아님), route가 `if ('error' in r) return r.error`. **모범 패턴**
- `PIPEDRIVE_API_TOKEN`: `PipedriveApiGateway` 생성자만 · `JWT_SECRET_KEY`: `Environment.ts` → `AuthService`
- ⚠️ `NEXT_PUBLIC_SALES_PRIVATE_KEY`(ES512 **개인키**)가 `Environment.ts` → `SalesJwtGenerator` → **클라이언트 번들**에서 사용됨(`useSalesAuthStore`, `components/sales/home`). 새 서명/검증 로직은 서버로

## P8. 인증·MFA·비밀번호 재설정
- 콘솔 인증: `POST /api/authorize` → `AuthService.generateAuthKey`(도메인 화이트리스트) → HS256 JWT + Redis 24h → `ApiResponse`가 검증
- sales 로그인: `containers/sales/login` → `SalesAuthUseCase.signin`(id/pw를 ES512 `encryptString`) → `SalesAuthApiClient` → `/api/sales/auth/signin` → `SalesAuthService` → zent API. 응답 3분기: JWT / `{mfaRequired, mfaToken}` / `{mfaSetupRequired, token}`
- MFA: Google Authenticator, `setupMfa`(QR `qrcode.react`, `containers/sales/mfaSetup`) / `verifyMfaSetup` / `verifyMfa` / `disableMfa`
- 비밀번호 재설정: `password-reset` → 본인인증 `/api/sales/auth/self-cert/request` → `/self-cert` → `/[salesUserId]/reset-password`
- SSO 딥링크: `POST /api/sales/auth/sso` → key → `/sales/auth/[key]` → `GET …/sso?key=` → store+localStorage → `/sales`

## P9. 스타일 — 도메인으로 갈린다
- **구 sales**: `index.tsx` + 같은 폴더 `style.ts`(`styled` + `css`, `RuleSet` switch, 예 `src/components/common/Button/style.ts`). styled-components 36파일(sales 24, common 7, documents 5)
- **신 documents/employee**: **Tailwind + `bznav-fe-ui` 컴포넌트만**(`containers/documents` 0, employee 0). `className=` 58파일
- ThemeProvider/createGlobalStyle **0건**. 색은 `bznav-fe-ui`의 `semanticColor`/`primitiveColor` 또는 하드코딩. `tailwind.config.ts`는 `@zenterprise-inc/bznav-fe-ui/tailwind.config` 스프레드

## P10. 토스트 — `react-hot-toast`는 **사용 0(설치만)**
- documents/employee: `bznav-fe-ui`의 `<Toaster/>`(layout) + `useToast()` · sales: 자체 `useToastStore` + `components/common/Toast`

## P11. Mixpanel (`src/analytics`)
- `MixpanelService` 싱글톤, `init()`은 `window` + `MIXPANEL_KEY` 있을 때 1회. super property `{app_id:'bznav-refund', client_id:'bznav-refund-web', zenv}`. 이벤트명 `${eventName}_${action}`
- 호출은 **반드시 `useEventLogger()`**: `sendViewEvent/sendClickEvent/sendCustomActionEvent`. view는 `useRef` 가드로 1회(`DocumentSubmissionContainer.hasSentViewEvent`)

## P12. PDF·QR·notion·업로드
- PDF `react-pdf`: `components/documents/submission/{FilePreviewModal,PdfPreviewContent}.tsx`, 데이터는 `DocumentFileGateway.fetchFileDataUri`(base64)
- QR: `qrcode.react`(MFA), `qrcode`+`canvas`(`utils/QrUtil.ts`, `components/sales/url/Qr` — Dockerfile의 cairo 의존 이유)
- notion: `notion-client`(서버 route) + `react-notion-x`(`DocumentGuideModal`, `NotionGuideRenderer`). 공개 페이지만
- 업로드 2계통: documents `useSubmitDocuments → DocumentUploadGateway → POST {ZENT_API}/documents/upload`(multipart, 키 `(type, tryIndex, order)` 결정적 → 재시도 덮어쓰기) · sales `containers/sales/upload → useSalesDocumentFileUpload → SalesDocumentFileUploadGateway(A계통)`. 레거시 `app/api/upload`(edge → Vercel Blob)
- `react-datepicker` **사용 0**(자체 `monthlySelector`). `@aws-sdk/client-s3`, `date-fns`, `lodash`, `nanoid`, `query-string`, `@emotion/is-prop-valid` **전부 사용 0**

## P13. 공통 컴포넌트 (`src/components/common`, 참조 파일 수)
`Button`(8, `ButtonStyle/ButtonSize` enum) · `ContainerLayout`(6, Tailwind, named export — 신형) · `TextHeader`(6) · `Toast`(6) · `Badge`(5) · `Input`(3) · `Loader`(3) · `Modal`(2). 패턴 `index.tsx` + `style.ts`(styled `Wrapper` default export)
- AGENTS.md: **새 UI는 `@zenterprise-inc/bznav-fe-ui`에 있는지 먼저 확인 → 사용자에게 물은 뒤** 진행. bznav-fe-ui import 28파일(BoxButton 8, BaseTopNavigation 7, Description 6, LottiePlayer 4, cn 3)
