# zent-packages 함정·이력

- **2026-09-16 미발행 changeset 5개 대기** (`b22d000`, REF-3584 세션 타임아웃): `brics-fe-zent-auth` **minor(breaking)** — `AuthOption` `maxAge` 5시간→2시간, `updateAge` 5분 신설, `useSessionTimeout` 반환 시그니처 `{ session, status }`로 변경. `brics-fe-ui` **minor** — `RootWrapper`가 새 시그니처에 의존(신버전 zent-auth 필요). 다음 "Version Packages" PR 머지 시 두 패키지 버전이 오르고, 소비 레포(refund·hub·care·works)는 **두 패키지를 함께** `pnpm up` 해야 한다
- **brics 라인 eslint 설정은 빈 파일**: `brics-fe-project-config`의 eslint/typescript 프리셋이 0바이트라 CI lint에서 ui·zent-auth·datadog-trace가 제외된다. prettier만 맞춘다
- **스냅샷 정리 matrix 누락**: `release-dev.yml` cleanup에 bznav-fe platform·tracking-service·user-session·user-sign·channel-talk·ui-deprecated가 없어 이 6개는 프리릴리스 자동 정리가 안 된다
- **루트 README의 devkit 버전 표(0.2.0)는 실제(0.4.0)와 다름** — `sync-readme-versions.mjs`가 devkit 행을 못 잡는 것으로 추측
- **`workflow_dispatch` 버튼은 워크플로 파일이 main에 있을 때만 보인다** (GitHub 제약)
