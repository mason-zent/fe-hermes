# client-brics-hub 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점과 고유 규칙. 원문: 레포 `README.md`.

## 필수 — 작업 크기와 무관하게 항상 적용

- 이 레포 밖은 수정하지 않는다. 공유 패키지(`brics-fe-ui`, `zent-auth`, `datadog-trace`, `resource-manager`) 변경이 필요하면 직접 고치지 말고 **헤르메스에 보고**한다 (`packages-fe` 담당)
- `__generated__/`는 직접 편집하지 않는다. **`client-brics-works`의 생성물을 복사해 오지 않는다** — 이 레포는 works에서 분화됐지만 스펙이 갈라졌다
- 공유 패키지는 works 기준 **정확 버전 고정**(`^` 없음). 버전을 바꿔야 하면 멈추고 보고한다
- 사이드바 **메뉴 항목 추가는 코드가 아니라 `/brics-menus` 화면(DB 행)**이다. 사이드바는 hub에 내재화되어 있어 공유 패키지의 `RootWrapper`/`RootSidebar`를 쓰지 않는다
- **커밋하지 않는다.** `.env*`·토큰 내용은 출력하지 않는다

## 포맷·검증
- Prettier `semi: false`, `singleQuote: true`, `trailingComma: none`, `printWidth: 120`, 2 spaces
- 검증: `pnpm lint:check`, `pnpm typecheck`, `pnpm test` (Jest, ts-jest, node 환경 — 렌더링 테스트 불가, **순수 함수 단위 테스트만**)
- 순수 로직은 `_helpers/`로 분리하고 가능하면 `*.spec.ts` 추가

## 구조·패턴
- `app/admin/**`만 works 이관 병렬 라우트(`@tabs`, `_tabs.ts` 단일 출처). **새 도메인 화면은 `/messages/**`처럼 일반 중첩 라우트로**
- 권한 가드: `/admin/**`는 각 탭 `page.tsx`의 `AuthFunction` 검사, `/activity-log`·`/audit/**`는 `layout.tsx`에서 `PAGE_ACCESS_LOGS`, `/messages/**`는 로그인만(권한 코드 미정). 없으면 `/unauthorized`
- 사이드바는 hub에 **내재화**(`app/_components/sidebar/`, `lib/sidebarMenu.ts`, `GET /v1/menu/my`). 메뉴 추가는 코드가 아니라 `/brics-menus` 화면(DB). hub API는 `/v1` 접두사
- URL 상태: admin 계열은 `useSearchParams` + `router.push`, 신형 `/messages`는 `useState`. `nuqs`는 설치만 되어 있고 사용처 0건(도입은 팀 합의 후). 모달은 `@ui` Dialog 제어형 + `ConfirmModal`. `@ebay/nice-modal-react`도 사용처 0건
- 공용 UI는 `@ui/components/ui/<name>` 개별 경로로 import. 스키마·헬퍼에서 enum 값은 `@/generated/models`(배럴 `@/swr`는 타입만)
- 신규 화면 날짜는 `app/messages/_helpers/formatKst.ts`(KST 고정). `lib/DateTimeFormatter.ts`는 로컬 시간대

## API
- 전부 `@/swr` Orval 생성물. 없으면 `pnpm genapi:local`. 생성 불가 시 `lib/*Swr.ts` 패턴 임시 훅 + 보고
- `__generated__/`가 없으면 typecheck/build가 `Cannot find module '@/swr'`로 실패한다. 이 경우 lint + test로 검증하고 사실대로 보고

## 공유 패키지
- 공유 패키지는 works 기준 **정확 버전 고정**(`^` 없음). 버전 변경은 헤르메스에 보고
- `brics-fe-ui`·`zent-auth`·`datadog-trace`·`resource-manager` 수정은 `packages-fe`

## Git
- **문서·지식의 기준 브랜치는 `origin/prd`**(운영 반영분, 정본은 `hermes.config.json`). 이 폴더의 사실은 거기서 읽은 것이다
- **개발 브랜치는 별개다** — PR base `dev`. 두 개를 같은 것으로 취급하지 않는다
- 커밋 한국어, 티켓 있으면 `feat: REF-#### 설명`
