# web-op 함정·이력

- **prettier가 BRICS 콘솔과 정반대**: `semi: true`, `printWidth: 80`, `trailingComma: "all"`, `singleQuote` 미지정 = **double quote**. 다른 레포 습관으로 쓰면 전부 리포맷
- **포맷 위반 파일 4개 기존재**(`src/useCases/SalesAuthUseCase.ts`, `containers/sales/{login,mfaSetup}/index.tsx`, `app/sales/mfa-setup/page.tsx` — MFA 작업 산출물, 싱글쿼트·세미콜론 없음) + `hooks/useSalesDocumentFileUploadHook.ts` import 줄. `.prettierignore` 없음 → `pnpm lint`가 실패할 수 있다. 건드리면 diff 폭발
- **`pnpm build`는 타입 에러를 잡지 않는다**(`typescript.ignoreBuildErrors: true`, 소스 배포 패키지 때문). **`pnpm typecheck`(자작 `typecheck.mjs`) 필수**
- **ESLint flat config**(`eslint.config.mjs`, `bznav-fe-project-config` 스프레드). `.eslintignore`도 있지만 flat config에서는 무시될 가능성(추측) — `ignores`에는 `.next/**`, `node_modules/**`만
- **`NEXT_PUBLIC_SALES_PRIVATE_KEY` = ES512 개인키가 클라이언트 번들에 실린다**(가장 큰 리스크). `SalesJwtGenerator`를 `useSalesAuthStore`·`components/sales/home`이 사용. 서명 로직을 클라에 추가하지 말고 서버로
- **`BaseApiGateway`의 alert-and-swallow**: 실패 시 `alert` 후 `undefined`. documents 팀이 "0개 제출" 버그로 우회했다는 주석 3파일. 상속 5개 gateway 호출부는 `undefined`를 성공으로 오인할 수 있다
- **레이어 위반 실측**: `components/sales/*` 6파일이 gateway 직접 호출(sales 관례), `app/*` 2파일이 fetch/gateway 직접, controller(`ApiResponse`) 경유 2/30, useCase 1개. "container → useCase → gateway"를 일반 규칙으로 적용하면 코드베이스와 어긋난다. 반면 route→repository 직접 호출은 0
- **공유 패키지**: `bznav-fe-ui`(+`common-utils`), `project-config`는 GitHub Packages → `GITHUB_TOKEN` 없으면 `pnpm install` 실패. 소스 배포라 `transpilePackages`·`ignoreBuildErrors`·`typecheck.mjs`가 존재. `pkg:link`는 `package.json`/lockfile에 `skip-worktree` → **의존성 추가 전에 `pkg:unlink` 먼저**. 링크 시 Turbopack root가 `..`로 올라감
- **⚠️ 주석 1건**: `app/api/employee/_proxy.ts:65` "여기서 `await response.json()`을 쓰면 안 된다"(long-poll 하트비트 소비 → ELB 504). TODO/FIXME는 0건. 대신 파일 상단 긴 한국어 설명 주석이 설계 문서(`_proxy.ts`, `typecheck.mjs`, `next.config.js`, `PipedriveApiGateway`, `DocumentUploadGateway`, `types/DocumentType.ts`) — 수정 전 필독
- **README-코드 불일치**: README "Docker/EKS"지만 `.vercel/project.json` 잔존 + `@vercel/blob`/`kv` 런타임 사용. `app/api/upload`는 `runtime="edge"` — EKS/Node에서 동작 확인 필요(추측). README 스크립트 표에 `typecheck` 누락. `useCases/`는 1개. `.env.example`의 `CONSOLE_API_URL`·`PIPEDRIVE_REFERER` 미사용, 코드가 쓰는 `NEXT_PUBLIC_ZENV`는 예시에 없음. AGENTS.md 피그마 절에 **개인 절대경로**(`/Users/joen/...`) 하드코딩
- **AGENTS.md "문서 정합성 노티 원칙"**: 코드 변경으로 README/AGENTS.md가 틀려지면 임의 수정 금지, 먼저 노티 후 개발자 결정
- `app/sales/upload/page.tsx`의 `<UploadContainer />;` 스트레이 세미콜론이 텍스트로 렌더(사소 버그)
- 설치만 됨: `react-hot-toast`, `react-datepicker`, `@aws-sdk/client-s3`, `date-fns`, `lodash`, `nanoid`, `query-string`, `@emotion/is-prop-valid` — 전부 사용 0
- `useLoaderStore`는 setter 없는 죽은 스토어. `useToastStore`만 default export
- Next **16.2.9**(BRICS는 15.5) → `params`가 Promise, Turbopack 기본. TS 5.0.4(BRICS 5.6보다 낮음)
