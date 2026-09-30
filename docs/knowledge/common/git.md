# 팀 공통 Git 규칙

- **모든 작업은 계획서 하나에 묶인다**(정식 `plans/<유형>/…` 또는 경량 `plans/task/…`). 계획서 없이 시작하지 않는다
- **작업은 `hermes.config.json` 의 `prBase` 에서 딴 새 작업 브랜치·워크트리에서 한다**(`scripts/new-branch.sh` → `.worktrees/<레포>/<슬러그>`, 절차는 아래 "작업 브랜치 만들기"). 지금 체크아웃된 브랜치에 얹지 않고, 메인 체크아웃을 건드리지 않으며, 남의 미커밋 변경을 stash 하지 않는다. `prBase`(작업 base)와 `branch`(문서 기준, 운영 반영분)는 다를 수 있다
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

## 작업 브랜치 만들기 (헤르메스 — `scripts/new-branch.sh`)

`/call` 로 띄운 에이전트는 브랜치를 스스로 묻고 만든다. 헤르메스가 계획서를 승인받고 디스패치할 때는 **디스패치 바로 앞에** 이 절대로 만든다.

```bash
scripts/new-branch.sh REF-3820 refund hub          # 콘솔 두 곳 (슬래시가 없으면 feature/ 를 붙인다)
scripts/new-branch.sh REF-3820 bznav:care-web      # bznav 는 앱을 지정
scripts/new-branch.sh fix/qa-로그인-오류 care        # 이름 직접
scripts/new-branch.sh REF-3820 refund --dry-run    # 먼저 확인 · --in-place 는 워크트리 없이(미커밋 있으면 건너뜀)
```
- 대상은 레포 이름 일부로 매칭한다 — `refund` `hub` `care` `op` `packages`(=zent-packages) `bznav:<앱>`
- **base 는 `hermes.config.json` 의 `prBase`** 다(문서 기준 `branch` 와 다르다). 표로 옮겨 적지 말고 config 를 본다
- **이름**: 관례는 `feature/REF-####`, 버그는 `fix/설명`(care 는 `chore/*`·`hotfix/*` 도). **bznav-rn-app 은 예외** — `prd` 에서 딴 `feature/v<앱버전>/<티켓>`(`bznav-rn-app/rules.md`)
- **여러 레포에 걸친 작업은 같은 이름을 쓴다.** zent-packages 와 소비 레포는 이름 끝 토막이 같아야 PR 프리뷰가 스냅샷을 자동 매칭한다(`feature/REF-3820` ↔ `@ref-3820`)
- **bznav `packages/*` 는 따로 따지 않는다.** 모노레포라 앱으로 딴 워크트리에 `packages/**` 가 같이 있고 5개 앱 모두 base 가 같다. 두 앱을 같이 작업해도 워크트리는 하나다(`bznav:packages` 를 주면 스크립트가 안내하고 멈춘다)

**건너뛴 레포 처리**

| 사유 | 할 일 |
|---|---|
| 같은 이름 브랜치가 이미 있다(로컬·원격) | 스크립트가 로컬·원격·마지막 커밋·체크아웃 위치를 보여 준다. **"그대로 이어 쓸까요?"** 를 묻고 예면 같은 명령에 `--reuse`. 메인 체크아웃에 올라가 있으면 워크트리로 못 이어 쓰니 다시 묻는다 |
| 워크트리 경로가 이미 있다 | 남은 작업인지 확인. 필요하면 `git worktree remove` |
| `origin/<base>` 를 못 읽었다 | 로컬 ref 가 있으면 ⚠️ 와 함께 진행, 없으면 건너뛴다 |
| `repos/<레포>` 링크 없음 | `scripts/setup.sh` (claude 를 켤 때 훅이 자동으로 돌린다) |

- **건너뛴 레포에는 디스패치하지 않는다.** 나머지를 먼저 보낼지는 계획서 의존성을 본다 — **선행(공유 패키지 등)이 실패하면 그에 기대는 작업은 멈춘다**
- 워크트리와 메인 체크아웃은 **같은 브랜치를 동시에** 물 수 없다. 워크트리 위치는 `HERMES_WORKTREE_ROOT`(기본 hermes `.worktrees/`, gitignore)

**기록** — `scripts/delegate.sh <에이전트> --cwd <워크트리> --plan <계획서>` 로 띄우면 delegate.sh 가 `Work ref` 줄을 `<워크트리> · 🌿 <브랜치> · pane <id> (<에이전트>)` 로 **통째로 다시 쓴다**. 그래서 **base SHA**(`new-branch.sh` 출력의 `origin/<base> <sha>`)는 Work ref 가 아니라 Checkpoint `Progress` 에 한 줄로 적는다(`/new` 이후 재개 근거)

**끝난 뒤** — 메인 체크아웃·소스트리에서 보려면 `wt-sync`(같은 `.git` 이라 fetch 불필요). 끝나면 `git -C repos/<레포> worktree remove .worktrees/<레포>/<슬러그>`(현황판 [아카이브]가 이슈 워크트리는 정리한다)

## 현황 점검 (헤르메스 — "현황 알려줘")

```bash
for repo in $(ls repos); do echo "== $repo"; git -C repos/$repo status --short --branch | head -20; git -C repos/$repo log --oneline -5; done
```
- 레포별 현재 브랜치·미커밋 파일 수·최근 커밋을 보고한다. `/guide` 메뉴의 git 현황도 같은 것을 보여 준다
- **보호 브랜치(`prd`·`main`·`dev`·`prd-*`·`release/*`)에 서 있는 메인 체크아웃은 따로 표시한다** — 거기서 작업하면 안 된다. `dev-ecs` 는 **폐기된 브랜치**다 — 서 있으면 알린다
- 계획서는 현황판(`/board`)에서 본다. 말로 보고할 때는 Checkpoint 의 `Status`·`Updated` 를, `blocked` 면 `Blocked` 절(무엇에 막혔는지)을 같이 적는다
