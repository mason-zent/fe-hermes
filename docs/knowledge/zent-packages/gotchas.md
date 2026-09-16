# zent-packages 함정·이력

- **brics project-config의 eslint/typescript 프리셋 4파일이 0바이트** (`eslint/eslint.config.js`, `typescript/{base,library,nextjs}.json`). README는 정상 프리셋처럼 문서화 → 예시대로 import하면 빈 모듈. 실사용은 루트 `base.json`/`react-library.json`/`nextjs.json`
- **CI lint가 brics-fe-ui·zent-auth·datadog-trace를 제외** → brics FE에 린트 게이트 없음. 각 `lint`가 `--fix && prettier --write`라 CI가 파일을 고쳐 드리프트를 못 잡는다
- **React 18 vs 19**: brics peer `react ^18||^19`인데 devDeps/@types는 19 고정. 소스 배포라 소비 앱 `@types/react`로 검사 → React 18 앱에서만 깨질 수 있음. bznav는 catalog 19.2.6 고정, brics는 catalog 미참조. **한 앱에 두 라인 혼합 금지**(devkit `detectLine`도 에러)
- **`import * as process from 'process'`** 4곳(zent-auth `ZENT_ENV.ts`·`fetcher.ts`, resource-manager `fetcher.ts`·`orval.config.ts`) → 소비 앱 Turbopack에서 `process.env` 정적 치환 실패 → hub는 `lib/process-shim.ts` + `turbopack.resolveAlias`로 대응
- **`declaration: false` + noEmit**: `.d.ts` 없음, build는 타입체크만. ⚠️ `frontend/bznav/platform/tsconfig.json`에 `outDir: dist` 잔존(스크립트가 `--noEmit`이라 무해하나 `tsc` 단독 실행 시 dist 생성)
- **exports가 src를 가리켜 소비 측 `transpilePackages` 필수**. `allowImportingTsExtensions`로 `.ts` 확장자 import가 있음(`platform/server.ts`) → 확장자 리졸브 미지원 설정에서 깨짐
- **brics-fe-ui의 `cn`·`lib/*`·`hooks/*`는 public export 아님** → 소비 앱이 `cn`을 복제. bznav-fe-ui는 `cn` 정식 export(라인 차이)
- **brics-fe-ui·zent-auth는 루트 `.` 엔트리 없음** → `import { X } from '@zenterprise-inc/brics-fe-ui'` 실패. 항상 서브패스. bznav는 반대로 루트 배럴만
- **2026-09-16 대기 changeset 5건**: `session-sliding-fe-zent-auth.md`(**zent-auth minor breaking**: maxAge 5h→2h, updateAge 5m, `useSessionTimeout` 반환 `{session,status}`, 옵션 `sessionExtensionMs`→`extendThrottleMs`), `session-sliding-fe-ui.md`(**ui minor**, 위에 의존), `session-timeout-drop-visibilitychange.md`(patch), `cozy-parents-chew.md`(REF-3584 patch ×3), `console-auth-guard-jwks-cache.md`(be). 2026-09-04 커밋인데 09-15 Version Packages는 1개만 소비 → **다음 릴리스에 minor 2건 동시 발생, 소비 레포(refund·hub·care·works) 두 패키지 동시 업 필요**
- **README 버전 표**: devkit `0.2.0` 표기 vs 실제 `0.4.0`. `sync-readme-versions.mjs`가 devkit 행을 못 잡는 듯(추측). datadog-trace 설명 "RUM 초기화"도 오류(헤더 생성만)
- **스냅샷 정리 matrix 누락 6개**(`release-dev.yml` cleanup): bznav-fe channel-talk·platform·tracking-service·ui-deprecated·user-session·user-sign → 프리릴리스 영구 누적. 보존 10개가 태그 무관 통합 카운트라 살아있는 브랜치 스냅샷이 밀릴 수 있음(`@dev` 폴백)
- **resource-manager `fetcher.ts` 인터셉터 누적**: 호출마다 `interceptors.request.use` 등록(zent-auth는 1회 등록으로 고쳐졌으나 복제본은 방치)
- **brics ↔ bznav 코드 스타일 상이**: 루트 `.prettierrc`는 semi false/120인데 bznav 소스는 세미콜론+긴 줄. bznav 전용 prettier 설정 없음 → 루트 prettier로 bznav를 포맷하면 대량 diff. **포맷터를 무심코 돌리지 말 것**
- **bznav-fe-ui `src/components/index.ts` 중복 `export *` 7군데** — 추가 전 존재 확인
- **`.npmrc`에 토큰 금지**(pnpm 11+가 `${GITHUB_TOKEN}` 확장 거부) → `~/.npmrc`에 `//npm.pkg.github.com/:_authToken=<PAT>`
- **orval mutator는 소비 앱 로컬 re-export 경유**(`lib/orval-fetcher.ts`) — 생성코드에 node_modules 경로가 박히는 것 방지
- **`datadog-trace`는 zent-auth의 dependency이기도 함** → 앱이 다른 버전을 선언하면 중첩 사본 + `transpilePackages` 미커버로 빌드 깨짐. 버전 일치 유지
- ⚠️ 주석: `useSessionTimeout.ts`(visibilitychange 금지), `devkit/src/link.mjs`(checkout 안 하는 이유, 상대경로), `devkit/src/next.mjs`(공통 상위 얕으면 스킵, Turbopack alias 상대경로), `bznav/ui/LottiePlayer.tsx`(두 방식 동시 사용 불가). TODO: `EditableTable/TypeRenderTableCell.tsx:108`, `frontend/README.md:134`(일반 배포 태그 격리 미적용)
