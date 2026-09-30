# zent-packages 레포 규칙 (frontend/ 만)

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점. **원문: `frontend/README.md`, `frontend/bznav/README.md`, `frontend/devkit/README.md`.** `backend/`는 범위 밖.

## 필수 — 작업 크기와 무관하게 항상 적용

- **수정 허용 범위는 `frontend/**` 와 `.changeset/*.md` 두 가지다.** `.changeset/`는 `frontend/` 밖이지만 반드시 쓸 수 있어야 한다 — "frontend만"으로 줄여 이해하지 않는다
- `backend/`, 루트 `package.json`·`pnpm-workspace.yaml`(catalog)·`.github/`는 수정하지 않는다. 필요하면 멈추고 **헤르메스에 보고**
- **변경마다 `pnpm changeset`으로 `.changeset/*.md`를 추가한다.** 없으면 PR 머지가 차단된다. 릴리스가 필요 없으면 `--empty`
- **brics(React 18) 라인과 bznav(React 19) 라인을 한 작업에서 섞어 수정하지 않는다.** 별칭 방식도 다르다(brics는 tsconfig paths, bznav는 exports)
- **public export를 바꾸면 소비 레포 영향을 반드시 보고한다.** 여기 변경은 brics 라인 → client-brics-{refund,hub,care}(+범위 밖 works), bznav 라인 → web-op(`bznav-fe-ui`·`bznav-fe-project-config`)로 퍼진다. bznav-web 은 현재 이 레포 패키지를 소비하지 않는다(자체 `@repo/*`). 운영 반영은 자동이 아니라 소비 레포의 `pnpm up`이 필요하다
- 문서 기준·작업 브랜치 base·PR 대상이 **모두 `main`** 이다(`hermes.config.json` `branch`·`prBase`). 콘솔·bznav 처럼 문서 기준 prd 계열·base dev 로 나뉘지 않는다
- **커밋은 사용자가 요청할 때만 `scripts/commit.sh` 로, push·PR 은 사용자가 "PR 올려줘" 라고 할 때 `scripts/ship.sh` 로만 한다(레포 하나짜리 작업 · 미리보기 확인 후 draft PR — 여러 레포 작업은 헤르메스).** `commit.sh` 에는 `--verify "<패키지명>"` 이 필수이고, brics 3종(ui·zent-auth·datadog-trace)은 lint 가 항상 ⏭ 라 사용자 확인 후 `--allow-skip "pnpm lint --filter=<패키지>"` 가 필요하다(`common/verify.md`). `~/.npmrc` 토큰·`.env*` 내용은 출력하지 않는다

## 공통과 다른 점
- 작업 브랜치 `feature/REF-####`
- Node·pnpm·Prettier 는 루트 `.nvmrc`·`packageManager`·`.prettierrc`(값은 지문 `.sync/snapshots/zent-packages.json`). 루트에서 `pnpm install` 한 번. GitHub Packages 토큰은 `~/.npmrc`
- 루트 Prettier 는 brics 스타일이라 bznav 라인에 맞지 않는다(`gotchas.md`). bznav 라인은 자체 eslint 9 flat config(`bznav-fe-project-config`) 우선

## 패키지 원칙
- **소스 배포**: `exports`가 `src/*.ts`. `build`=tsc는 타입체크만. dist 없음. bznav는 `declaration: false`
- bznav 의존 방향 역행 금지: common-utils ← platform ← tracking-service ← user-session ← user-sign. ui는 common-utils만
- 버전은 사람이 올리지 않는다(changeset). bump 수준은 계획서대로(기본 patch, public API 변경 minor)
- 소비 레포 영향은 `pnpm deps` 로 본다. 워크트리(`.worktrees/zent-packages/<슬러그>`)에서는 형제 폴더에 소비 레포가 없어 못 찾으니 `ZENT_CONSUMER_ROOT=<hermes>/repos pnpm deps` 또는 `ZENT_CONSUMERS=<경로,…>` 로 지정한다(심볼릭 링크 탐색 여부는 확인 필요)
- Storybook/Chromatic은 `bznav-fe-ui`만. 컴포넌트 변경 시 `*.stories.tsx` 갱신. Chromatic 토큰은 환경변수

## 검증
- `pnpm build --filter=<pkg>...`(타입체크), `pnpm lint --filter=<pkg>`, bznav-fe-ui는 `build-storybook`
- `bznav-fe-ui`·`bznav-fe-ui-deprecated` 에는 `build` 스크립트가 없다 — 표준 스크립트의 build 단계는 의존 패키지만 타입체크한다. ui 를 바꾸면 `pnpm --filter @zenterprise-inc/bznav-fe-ui exec tsc --noEmit` 을 따로 돌린다(스토리는 exclude 라 `build-storybook` 으로)
- `brics-fe-zent-auth` 를 바꾸면 `pnpm --filter @zenterprise-inc/brics-fe-zent-auth test`(vitest, `fetcher.invariant.spec.ts`)도 돌린다 — 표준 스크립트에 없다
