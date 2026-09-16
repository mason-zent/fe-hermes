# web-op 구조 맵

기준 `origin/dev` `756d471` (2026-09-11), 파일 285개. 규칙 `rules.md`, 예시 `patterns.md`, 절차 `workflows.md`, 함정 `gotchas.md`.

## app/ 라우트
| 경로 | 역할 | 인증 |
|---|---|---|
| `app/sales/**` (14) | 판매자센터·제휴마케팅 포털: `login`, `signup`(+`done`), `mfa-setup`, `password-reset`, `auth/[key]`(SSO 딥링크), 홈, `customers`(+`[id]`), `salesmans/[id]/customers`, `child`, `upload`, `url` | **자체 JWT(ES512)** `SalesJwtGenerator`, 토큰은 `localStorage["salesUser"]`, 상태 `useSalesAuthStore`, 가드는 `src/containers/sales/index.tsx`의 store subscribe → `/sales/login` |
| `app/documents/**` (5) | 대고객 서류 제출: `[key]`(알림톡 링크 키), `status/{complete,expired}`, `layout.tsx`(DialogProvider+Toaster) | 링크 키(Redis 8자)가 접근권. 파일 API는 `POST {ZENT_API}/documents/auth` 임시 토큰 |
| `app/employee/**` (4) | 고용보험 직원 인증서 발급: `[key]/page.tsx`(`force-dynamic`) → `EmployeeKeyClient.tsx` 분기 허브 | 링크 키 + 서버 전용 `EMP_INS_NOTI_API_KEY`(`_proxy.ts`) |
| `app/api/**` (route 30 + `_proxy.ts`) | BFF. 25개가 `src/backend/service` 호출, 2개만 `ApiResponse`(controller) 경유, employee 3개는 `_proxy` 직행, `notion-guide`·`ping` 독립 | 라우트마다 상이 |
| `app/layout.tsx` | `@zenterprise-inc/bznav-fe-ui/globals.css` + `MixpanelProvider` | — |

## src/ 레이어 (파일 수)
| 디렉토리 | 수 | 비고 |
|---|---|---|
| `components/` | 75 | common 15 / documents 27 / sales 32 / employee 1 |
| `containers/` | 31 | sales 17 / employee 8 / documents 6 |
| `hooks/` | 13 | documents 3 / employee 6 / 루트 3(`useEventLogger`) |
| `gateway/` | 10 | `BaseApiGateway` + 도메인 9 (클라이언트 axios) |
| `backend/` | 9 | controller 1(`ApiResponse`) / service 5 / repository 3(`RedisRepository`, `external/{Pipedrive,SalesExternal}ApiGateway`) |
| `utils/` | 8 | `SalesJwtGenerator(.test)`, `QrUtil`, `FileType`, `DateTimePrettier`, `RandomStringUtils`, `SafeErrorLog`, `PipedriveCustomField` |
| `store/` | 3 | `useSalesAuthStore`, `useToastStore`, `useLoaderStore` (zustand 4, 미들웨어 없음) |
| `analytics/` | 3 | `MixpanelProvider`, `MixpanelService`, types |
| `useCases/` | **1** | `SalesAuthUseCase.ts` — sales 인증 전용 예외 패턴 |
| `config/` | 1 | `Environment.ts` |
| 루트 `types/` | 13 | 도메인 타입 + `exceptions/{ZentException,CommonException}` |

## 외부 시스템 (`src/backend`)
- **Redis** `@vercel/kv` — `RedisRepository`(JWT 화이트리스트, 링크 키 TTL) · **Blob** `@vercel/blob` — `DocumentsService`(레거시 업로드, `app/api/upload` edge) · **Pipedrive** `PipedriveApiGateway`(v2, `x-api-token`) · **zent 백엔드** `SalesExternalApiGateway`(`NEXT_PUBLIC_SERVER_ZENT_API_URL`) · **고용보험 V2** `app/api/employee/_proxy.ts` · **Notion** `notion-client`(`notion-guide` route) · `@aws-sdk/client-s3`는 **사용 0(설치만)**

## env 키 (값 제외)
`.env.example`: `CONSOLE_API_URL`(미사용) `JWT_SECRET_KEY` `NEXT_PUBLIC_SALES_PRIVATE_KEY` `NEXT_PUBLIC_SALES_PUBLIC_KEY` `NEXT_PUBLIC_SERVER_ZENT_API_URL` `NEXT_PUBLIC_RESOURCE_CENTER_URL` `PIPEDRIVE_API_TOKEN` `PIPEDRIVE_REFERER`(미사용) `ZENT_ENV` `ENV_PROFILE` `NEXT_PUBLIC_MIXPANEL_KEY` `EMP_INS_NOTI_API_KEY`. 코드가 쓰는데 예시에 없는 것: `NEXT_PUBLIC_ZENV`, `BASE_PATH`/`NEXT_PUBLIC_BASE_PATH`

## 스크립트
`dev` · `build`(**타입 에러 무시** `ignoreBuildErrors: true`) · `typecheck`(`node typecheck.mjs` = tsc + node_modules 진단 필터) · `lint`(eslint + prettier --check) · `lint:fix` · `pkg:link`/`pkg:unlink`. 테스트 러너 없음(`scripts/run-salesjwt-test.cjs` 자작 1개). 표준 검증 `scripts/verify/web-op.sh`
