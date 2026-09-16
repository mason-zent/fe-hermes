# zent-packages 레포 규칙 (frontend/ 만)

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점. **원문: `frontend/README.md`, `frontend/bznav/README.md`, `frontend/devkit/README.md`.** `backend/`는 범위 밖.

## 공통과 다른 점
- **기준 브랜치 `main`** (다른 레포는 dev). 작업 브랜치 `feature/REF-####`
- pnpm **11.8.0**, Node 24.14.1. 루트에서 `pnpm install` 한 번. GitHub Packages 토큰은 `~/.npmrc`
- Prettier `semi: false`, `singleQuote: true`, `trailingComma: none`, `printWidth: 120` (루트). bznav 라인은 자체 eslint 9 flat config(`bznav-fe-project-config`) 우선

## 패키지 원칙
- **소스 배포**: `exports`가 `src/*.ts`. `build`=tsc는 타입체크만. dist 없음. bznav는 `declaration: false`
- brics(React 18, tsconfig paths 별칭)와 bznav(React 19, catalog, exports) **두 라인을 한 작업에서 섞지 않는다**
- bznav 의존 방향 역행 금지: common-utils ← platform ← tracking-service ← user-session ← user-sign. ui는 common-utils만
- 버전은 사람이 올리지 않는다. **변경마다 `pnpm changeset`** (없으면 PR 머지 차단). 릴리스 불필요면 `--empty`. bump 수준은 계획서대로(기본 patch, public API 변경 minor)
- public export 변경 시 소비 레포 영향(`pnpm deps` 참고)을 보고. 운영 반영은 소비 레포의 `pnpm up` 수동
- Storybook/Chromatic은 `bznav-fe-ui`만. 컴포넌트 변경 시 `*.stories.tsx` 갱신. Chromatic 토큰은 환경변수

## 검증
- `pnpm build --filter=<pkg>...`(타입체크), `pnpm lint --filter=<pkg>`, bznav-fe-ui는 `build-storybook`

## 범위
- 수정 허용: `frontend/**`, `.changeset/*.md`. 루트 `package.json`·`pnpm-workspace.yaml`(catalog)·`.github/`는 헤르메스에 보고
