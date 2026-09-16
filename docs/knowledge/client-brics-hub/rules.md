# client-brics-hub 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점과 고유 규칙. 원문: 레포 `README.md`.

## 포맷·검증
- Prettier `semi: false`, `singleQuote: true`, `trailingComma: none`, `printWidth: 120`, 2 spaces
- 검증: `pnpm lint:check`, `pnpm typecheck`, `pnpm test` (Jest, ts-jest, node 환경 — 렌더링 테스트 불가, **순수 함수 단위 테스트만**)
- 순수 로직은 `_helpers/`로 분리하고 가능하면 `*.spec.ts` 추가

## 구조·패턴
- `app/admin/**`만 works 이관 병렬 라우트(`@tabs`, `_tabs.ts` 단일 출처). **새 도메인 화면은 `/messages/**`처럼 일반 중첩 라우트로**
- 권한 가드: `/admin/**`는 각 탭 `page.tsx`의 `AuthFunction` 검사, `/activity-log`·`/audit/**`는 `layout.tsx`에서 `PAGE_ACCESS_LOGS`, `/messages/**`는 로그인만(권한 코드 미정). 없으면 `/unauthorized`
- 사이드바는 hub에 **내재화**(`app/_components/sidebar/`, `lib/sidebarMenu.ts`, `GET /v1/menu/my`). 메뉴 추가는 코드가 아니라 `/brics-menus` 화면(DB). hub API는 `/v1` 접두사
- URL 상태는 `nuqs`, 모달은 `@ebay/nice-modal-react`

## API
- 전부 `@/swr` Orval 생성물. 없으면 `pnpm genapi:local`. 생성 불가 시 `lib/*Swr.ts` 패턴 임시 훅 + 보고
- `__generated__/`가 없으면 typecheck/build가 `Cannot find module '@/swr'`로 실패한다. 이 경우 lint + test로 검증하고 사실대로 보고

## 공유 패키지
- 공유 패키지는 works 기준 **정확 버전 고정**(`^` 없음). 버전 변경은 헤르메스에 보고
- `brics-fe-ui`·`zent-auth`·`datadog-trace`·`resource-manager` 수정은 `packages-fe`

## Git
- 기준 브랜치 `dev`. 커밋 한국어, 티켓 있으면 `feat: REF-#### 설명`
