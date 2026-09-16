# zent-packages `frontend/` 구조 맵

기준 `origin/main` `b22d000` (2026-09-16). `backend/`는 범위 밖. 규칙 `rules.md`, 예시 `patterns.md`, 절차 `workflows.md`, 함정 `gotchas.md`.

## 패키지 (15) 와 엔트리
| 경로 | 패키지 | ver | exports |
|---|---|---|---|
| `frontend/brics/ui` | `brics-fe-ui` | 0.4.1 | `./components/*`, `./components/ui/*`, `./global.css`, `./public/*`, `./fonts/*` — **루트 `.` 없음** |
| `frontend/brics/zent-auth` | `brics-fe-zent-auth` | 0.5.1 | `./configs/*`, `./lib/*`, `./hooks/*`, `./types/*`, `./types/enums/*` — **루트 없음** |
| `frontend/brics/resource-manager` | `brics-fe-resource-manager` | 0.2.1 | `.`, `./utils`, `./api` (+`__generated__` 발행) |
| `frontend/brics/datadog-trace` | `brics-fe-datadog-trace` | 0.3.0 | `.`, `./*` |
| `frontend/brics/project-config` | `brics-fe-project-config` | 0.2.1 | 없음. `base.json`·`nextjs.json`·`react-library.json`(실사용) + `eslint/`·`typescript/`(**0바이트 빈 파일**) |
| `frontend/bznav/ui` | `bznav-fe-ui` | 0.2.1 | `.`, `./globals.css`, `./postcss.config`, `./tailwind.config` |
| `frontend/bznav/common-utils` | `bznav-fe-common-utils` | 0.2.0 | `.` (src 없이 `constants/`·`utils/`·`types/` 평면) |
| `frontend/bznav/platform` | `bznav-fe-platform` | 0.1.0 | `.` → `client.ts`, `./server` → `server.ts` |
| `frontend/bznav/tracking-service` · `user-session` · `user-sign` · `channel-talk` | `bznav-fe-*` | 0.1.0~0.1.1 | `.` |
| `frontend/bznav/ui-deprecated` | `bznav-fe-ui-deprecated` | 0.1.1 | `.`, `./tailwind.config` (신규 사용 금지) |
| `frontend/bznav/project-config` | `bznav-fe-project-config` | 0.1.0 | 없음. `typescript/{base,library,nextjs}.json`, `lint/{eslint.config.js,.stylelintrc.mjs}` (실내용 있음) |
| `frontend/devkit` | `zent-fe-devkit` | 0.4.0 | bin `zent-fe-devkit`, `./next`, `./package.json` |

의존: brics `ui → zent-auth → datadog-trace`. bznav `platform·ui → common-utils`, `tracking-service → common-utils·platform`, `user-session → common-utils·platform·ui`, `channel-talk → +tracking-service·user-session`, `user-sign → 전부`. 순환 없음.

## brics-fe-ui `src/`
- `components/*.tsx` 콘솔 공용 래퍼 35개(`export default`): Buttons, Calendar*, CheckableBadge, CollapsibleText, Combobox(+FormField), **ConfirmModal**, ConsoleBreadcrumb, DataListPanel, **Datepicker**, ExtensionFileIcon, **Heading**, HighlitedText, ListPanel, ModeToggle, **Pagination**, RadioGroupControl, RefreshMyInfoButton, **RootWrapper**, ScrollableTable, Select*, SimpleInformation, Skeleton*, **SkeletonTableBody**, SortFilter, Spinner, SubmitButtonText, ThemesProvider, ZentBackground, ZentLogo + `EditableTable/`(6), `RootSidebar/`(5)
- `components/ui/*` shadcn 프리미티브 40여 개 + `index.ts` 배럴(`export * from './button'` 33줄)
- `global.css`, `utils.ts`(`cn`), `hooks/use-mobile.tsx`, `lib/{AuthOptions,DateTimeFormatter}.ts`, `fonts/`, `public/`, `tailwind.config.js`, `components.json`
- **파일 단위가 public API**: `exports` 와일드카드라 `components/<Name>` 파일 추가 = 자동 노출. 반대로 `utils.ts`·`lib/*`·`hooks/*`는 소비 측에서 **import 불가**

## brics-fe-zent-auth `src/`
`configs/ZENT_ENV.ts`(env 12종) · `configs/zent-cookie-keys.ts` · `hooks/useSessionTimeout.ts` · `lib/AuthOption.ts`(`serverAuthOptions`) · `lib/auth.ts`(`GET/POST/auth/signIn/signOut`) · `lib/fetcher.ts`(`AXIOS_INSTANCE`, `fetcher`, `ErrorType`, `BodyType`) · `lib/formdata.ts` · `types/ZentUser.ts` · `types/enums/AuthFunction.ts`(**74개**) · `types/enums/AuthRole.ts`(1개)

## tsconfig 상속
- brics: `frontend/brics/project-config/base.json`(noEmit, declaration false, moduleResolution Bundler, `allowImportingTsExtensions`) ← `react-library.json` ← ui·zent-auth·resource-manager. datadog-trace는 base 직접. `nextjs.json`은 소비 앱용
- bznav: `frontend/bznav/project-config/typescript/base.json`(declaration false, `noUncheckedIndexedAccess`) ← `library.json` ← platform·tracking·user-session·user-sign·channel-talk·common-utils / `nextjs.json` ← ui(스토리 exclude)

## devkit
`bin/zent-fe-devkit.mjs`(yargs: `link on|off`, `use-dev`) · `src/detect.mjs`(라인 자동 감지, 혼재 시 에러) · `src/link.mjs` · `src/use-dev.mjs` · `src/next.mjs`(`withZentDevkit`)
