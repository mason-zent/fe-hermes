# 팀 공통 Git 규칙

- **모든 작업은 계획서 하나에 묶인다**(정식 `plans/<유형>/…` 또는 경량 `plans/task/…`). 계획서 없이 시작하지 않는다
- **작업은 `hermes.config.json` 의 `prBase` 에서 딴 새 작업 브랜치·워크트리에서 한다**(`scripts/new-branch.sh` → `.worktrees/<레포>/<슬러그>`, 절차는 아래 "작업 브랜치 만들기"). 지금 체크아웃된 브랜치에 얹지 않고, 메인 체크아웃을 건드리지 않으며, 남의 미커밋 변경을 stash 하지 않는다. `prBase`(작업 base)와 `branch`(문서 기준, 운영 반영분)는 다를 수 있다
- 작업 시작 전 `git status --short --branch`로 대상 레포의 기존 변경을 확인하고, 사용자가 만든 변경과 무관한 파일은 건드리지 않는다
- **FE 에이전트의 커밋은 사용자가 pane 에서 "커밋해줘" 라고 할 때만, `scripts/commit.sh` 로만 한다.** 스크립트가 워크트리·보호 브랜치·기존 스테이징·지정 파일을 확인하고, 그 상태로 엄격 검증한 뒤 커밋해 계획서 `## Commits` 에 적는다. `git commit` 직접·`git add -A`·`git push`·`gh pr create` 등 쓰기(ship.sh 로), commit.sh 를 거치지 않고 커밋을 만드는 `revert`·`merge`·`cherry-pick`·`am`, 미커밋 변경을 치우는 `stash`(list·show 제외)·`reset --hard` 는 FE 세션의 보호 훅(`scripts/hooks/commit-guard.py`)이 막는다(실수 방지용 — 보안 경계는 아니다). 꼭 필요하면 에이전트가 이유를 말하고 사용자가 직접 실행한다
  - commit.sh 가 거부하는 경우: 메인 체크아웃, detached HEAD, 보호 브랜치(`dev`·`main`·`master`·`stg`·`frz`·`prd`·`prd-*`·`release/*`·`dev-*`), 남이 해 둔 스테이징, 검증 실패
  - bznav-web 은 바뀐 파일에서 앱(`apps/<앱>/`·`packages/<pkg>/`)을 찾아 검증한다. 루트 파일만 커밋하면 대상을 못 찾아 멈추니 `--verify "<앱|packages/<pkg>>"` 를 준다
  - **한계**: 검증은 작업 트리 **전체**에서 돈다. 지정하지 않은 미커밋 변경이 있으면 그 변경이 검증 결과에 섞일 수 있다(커밋에는 안 들어간다) — 스크립트가 경고하고 계획서 기록에 "지정 밖 미커밋 변경 N개" 를 남긴다. 검증 중 작업 트리 어디든 바뀌면 커밋하지 않는다
  - 검증은 **엄격 모드**다 — 건너뜀(⏭)도 실패로 친다. 레포가 원래 건너뛰는 단계(예 zent-packages brics 3종 lint, bznav-rn-app lint)는 **사용자 확인 후** `--allow-skip "<단계 이름>"` 으로 허용한다(`verify.md`)
- **push·PR 은 사용자가 "PR 올려줘" 라고 할 때만, `scripts/ship.sh` 로만 한다**(아래 "PR 올리기"). 레포 하나짜리 작업은 FE 에이전트가 자기 pane 에서, **여러 레포에 걸친 작업은 헤르메스가** 순서(공유 패키지 먼저)·공개 범위를 확인하고 올린다. 보호 브랜치 직접 push·force-push 금지
- 커밋 메시지는 한국어. 티켓이 있으면 `feat: REF-1234 설명` (레포별 세부 관례는 `<레포>/rules.md`)
- 브랜치 이름·PR 대상 등 레포별 전략은 `<레포>/rules.md`. base 는 `prBase` 로 정해지고, 설정으로 정할 수 없는 것만 사용자에게 묻는다
- (zent-packages 소비 레포 — 콘솔 3종·web-op) 로컬 링크(`pnpm pkg:link`) 상태의 `package.json`·lockfile을 커밋하지 않는다

## PR 올리기 (`scripts/ship.sh`)

사용자가 pane 에서 **"PR 올려줘"** 라고 하면 한다. 두 번 부른다 — 미리보기 → 사용자 확인 → 보내기.

```bash
scripts/ship.sh --plan <계획서> --dir <워크트리>                       # 1) 미리보기 — 아무것도 보내지 않는다
scripts/ship.sh --plan <계획서> --dir <워크트리> --base dev \
  --title "feat(refund): REF-3671 랜딩 SEO 기본 정보에 랜딩타입 입력 추가" --yes   # 2) 확인받은 뒤
```

- **미리보기에 나오는 것**: 브랜치 · base 후보(`prBase` + 최근 30일 안에 움직인 원격 `release/*`, rn-app 은 `dev` 도) · 올라갈 커밋 · 검증 기록 · reviewer 기록 · 제목 제안 · 본문 초안 파일
- 에이전트는 미리보기를 그대로 보여 주고 AskUserQuestion 으로 **base(여러 개 가능 — rn-app prd·dev 양쪽은 `--base prd --base dev`)·제목(제안 그대로/수정)** 을 받는다. **리뷰는 선택이다.** reviewer 결론(`- Review result: 승인 @<SHA> · tree <내용>`)은 **리뷰한 파일 내용**에 묶인다 — 리뷰 → 커밋 순서든 커밋 → 리뷰 순서든 커밋된 내용(`HEAD^{tree}`)이 리뷰한 내용과 같으면 승인이다. 승인이 아니면(reviewer 기록 없음 · 띄웠지만 결론 미기록 · 수정 필요 · 승인 뒤 내용이 바뀜 — 리뷰 뒤 수정이나 리뷰 때 워크트리에만 있던 파일 포함) 미리보기에 ⚠️ 가 뜬다 — **이대로 올릴지 한 번 더 묻고**, 올리라면 `--no-review-ok`
- **거부하는 경우**(아무것도 보내지 않는다): 메인 체크아웃 · detached · 보호 브랜치(`frz` 포함) · 추적 파일 미커밋 · 여러 에이전트가 붙은 계획서(헤르메스로) · HEAD 가 계획서 Commits 에 없음(= `commit.sh` 를 안 거친 커밋) · base 가 원격에 없음 · 올릴 커밋 없음 · 제목 형식·범위·티켓 불일치 · 본문 필수 절 누락 · 본문에 로컬 경로(`plans/`·`/Users/`·`.worktrees/`)·내부 주소·비밀값 흔적
- 보내면: `git push -u origin <브랜치>` → base 마다 **draft PR**(이미 열린 PR 이 있으면 push 만) → 계획서 Commits 의 "push 안 함" 을 PR 링크로 바꾸고 Checkpoint 에 `- PR:` 줄. 리뷰어 지정·Ready 전환은 사용자가 GitHub 에서
- 에이전트는 코드를 바꾼 요청을 보고하면 **묻지 않고 바로 리뷰를 띄운다**(자동 리뷰 — 조사만 했거나 승인 뒤 바뀐 게 없으면 생략). 자동 리뷰나 pane 에서 **"리뷰해줘"** → 에이전트가 `scripts/delegate.sh reviewer --cwd <워크트리> --here --plan <계획서>` 로 같은 탭 옆에 reviewer 를 띄운다. reviewer 는 끝에 `scripts/review-result.sh` 로 결론(승인/수정 필요 @HEAD)을 계획서에 남긴다. 수정할 게 나오면 원래 에이전트 pane 에 말한다
- 본문 초안은 **미리보기 때만** 만든다. 미리보기 뒤 초안 파일을 고쳤으면 `--yes` 때 그대로 나간다(다시 만들지 않는다). 미리보기 뒤에 새 커밋이 생겼으면 초안이 낡았으므로 거부한다 — 미리보기부터 다시
- 스크립트는 **절대 경로로** 부른다(`<hermes>/scripts/ship.sh`). 보호 훅이 hermes 의 그 파일인지 경로로 확인해서, 워크트리에서 `scripts/ship.sh` 로 치면 막힌다
- **헤르메스(여러 레포 작업)**: 순서대로 레포마다 `scripts/ship.sh … --repo-agent <그 레포 에이전트>` 로 올린다. 이 옵션은 FE 세션에서 보호 훅이 막는다

## PR 제목·본문 (모든 레포 공통)

레포 쪽에는 PR 템플릿이 없다(2026-09-30 확인). 이 절이 정본이고 `ship.sh` 가 검사한다.

**제목** — `type(범위): 티켓 요약`
- `type`: feat · fix · refactor · chore · docs · style · test
- `범위`: client-brics-refund `refund` · hub `hub` · care `care` · web-op `op` · bznav 앱 `refund-web`·`care-web`·`brand-web`·`sena-web`·`plus-web`, `packages/*` 는 `packages`(여럿이면 쉼표 `sena-web,packages`) · zent-packages 는 패키지 `brics-fe-ui`·`bznav-fe-user-session`·`zent-fe-devkit` 등 · bznav-rn-app `app`. **바뀐 파일에서 나온 범위만** 받는다
- `티켓`: 브랜치 이름에 티켓(`REF-1234` 꼴)이 있으면 필수, 없으면 생략
- 요약: 한국어 한 줄, 마침표 없음. 예 `fix(care-web): NEWCARE-651 프리미엄 랜딩 OG 값 적용`
- 커밋 메시지 형식은 레포 관례 그대로 둔다(콘솔 `feat: REF-1234 설명`). 이 규칙은 **PR 제목에만** 적용한다

**본문** — 이 순서로 (ship.sh 가 계획서 `## 지시`·`## 결과`·`Validation` 과 변경 파일로 초안을 만든다)
```markdown
## 작업 내용
- 왜·무엇을 (2~4줄)

## 변경 사항
- 추가·수정·삭제 `경로` — 주요 변경

## 검증
(scripts/verify 출력 표 그대로 · 실행 못 한 것은 "실행 못 함")

## 확인 필요
- 남은 위험 · 다른 서비스 영향 · 리뷰어가 볼 곳 (없으면 "없음")

## 스크린샷
(화면 변경이 있을 때만 — 없으면 절을 뺀다)

---
티켓: REF-1234
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
- hermes 로컬 경로(`plans/…`)·`.env`·토큰·내부 URL 은 넣지 않는다

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
