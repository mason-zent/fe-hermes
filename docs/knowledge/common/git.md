# 팀 공통 Git 규칙

- **모든 작업은 계획서 하나에 묶인다**(정식 `plans/<유형>/…` 또는 경량 `plans/task/…`). 계획서 없이 시작하지 않는다
- **작업은 `hermes.config.json` 의 `prBase` 에서 딴 새 작업 브랜치·워크트리에서 한다**(`/branch`·`scripts/new-branch.sh` → `.worktrees/<레포>/<슬러그>`). 지금 체크아웃된 브랜치에 얹지 않고, 메인 체크아웃을 건드리지 않으며, 남의 미커밋 변경을 stash 하지 않는다. `prBase`(작업 base)와 `branch`(문서 기준, 운영 반영분)는 다를 수 있다
- 작업 시작 전 `git status --short --branch`로 대상 레포의 기존 변경을 확인하고, 사용자가 만든 변경과 무관한 파일은 건드리지 않는다
- **FE 에이전트의 커밋은 사용자가 pane 에서 "커밋해줘" 라고 할 때만, `scripts/commit.sh` 로만 한다.** 스크립트가 워크트리·보호 브랜치·기존 스테이징·지정 파일을 확인하고, 그 상태로 엄격 검증한 뒤 커밋해 계획서 `## Commits` 에 적는다. `git commit` 직접·`git add -A`·`git push`·`gh pr`, commit.sh 를 거치지 않고 커밋을 만드는 `revert`·`merge`·`cherry-pick`·`am`, 미커밋 변경을 치우는 `stash`(list·show 제외)·`reset --hard` 는 FE 세션의 보호 훅(`scripts/hooks/commit-guard.py`)이 막는다(실수 방지용 — 보안 경계는 아니다). 꼭 필요하면 에이전트가 이유를 말하고 사용자가 직접 실행한다
  - commit.sh 가 거부하는 경우: 메인 체크아웃, detached HEAD, 보호 브랜치(`dev`·`main`·`master`·`stg`·`prd`·`prd-*`·`release/*`·`dev-*`), 남이 해 둔 스테이징, 검증 실패
  - bznav-web 은 바뀐 파일에서 앱(`apps/<앱>/`·`packages/<pkg>/`)을 찾아 검증한다. 루트 파일만 커밋하면 대상을 못 찾아 멈추니 `--verify "<앱|packages/<pkg>>"` 를 준다
  - **한계**: 검증은 작업 트리 **전체**에서 돈다. 지정하지 않은 미커밋 변경이 있으면 그 변경이 검증 결과에 섞일 수 있다(커밋에는 안 들어간다) — 스크립트가 경고하고 계획서 기록에 "지정 밖 미커밋 변경 N개" 를 남긴다. 검증 중 작업 트리 어디든 바뀌면 커밋하지 않는다
  - 검증은 **엄격 모드**다 — 건너뜀(⏭)도 실패로 친다. 레포가 원래 건너뛰는 단계(예 zent-packages brics 3종 lint, bznav-rn-app lint)는 **사용자 확인 후** `--allow-skip "<단계 이름>"` 으로 허용한다(`verify.md`)
- **push·PR 은 FE 에이전트가 하지 않는다 — 헤르메스가 맡는다.** 헤르메스는 여러 레포 순서·공개 범위를 확인한 뒤 사용자에게 묻고 한다. 보호 브랜치 직접 push·force-push 금지
- 커밋 메시지는 한국어. 티켓이 있으면 `feat: REF-1234 설명` (레포별 세부 관례는 `<레포>/rules.md`)
- 브랜치 이름·PR 대상 등 레포별 전략은 `<레포>/rules.md`. base 는 `prBase` 로 정해지고, 설정으로 정할 수 없는 것만 사용자에게 묻는다
- (zent-packages 소비 레포 — 콘솔 3종·web-op) 로컬 링크(`pnpm pkg:link`) 상태의 `package.json`·lockfile을 커밋하지 않는다
