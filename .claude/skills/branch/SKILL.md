---
name: branch
description: 작업을 시작하기 전에 대상 레포에 작업 브랜치와 워크트리를 만듭니다. 레포마다 다른 PR base(콘솔 dev · bznav 앱별 dev 또는 dev-ecs · zent-packages main)를 hermes.config.json 에서 골라 origin 최신에서 분기하고, 메인 체크아웃을 건드리지 않으므로 레포가 지저분해도 여러 작업을 동시에 진행할 수 있습니다. 디스패치 전에 씁니다.
argument-hint: "<티켓번호 또는 브랜치명> <대상...> — 예: REF-3820 refund hub · REF-3820 bznav:care-web"
---

# 작업 브랜치 · 워크트리 생성

대상: $ARGUMENTS

## 왜 먼저 하는가

로컬 작업 트리는 **브랜치가 제각각이다.** 확인 없이 FE 에이전트를 디스패치하면 남의 작업 브랜치 위에 얹히거나 미커밋 변경과 섞인다. 되돌리기 어렵고 누구 변경인지 구분도 안 된다.

**디스패치 전에 브랜치부터 만든다.** 계획서 승인 직후, 디스패치 바로 앞이 제자리다.

## 기본은 워크트리다

메인 체크아웃(`repos/<레포>`)을 건드리지 않고 `~/orca/workspaces/<레포>/<브랜치 슬러그>` 에 별도 작업 공간을 만든다.

- **레포가 지저분해도 시작할 수 있다.** 미커밋 변경이 있거나 남이 다른 브랜치를 물고 있어도 무관하다
- **한 레포에서 여러 작업을 동시에** 돌릴 수 있다 (bznav-web 은 이미 이 방식으로 워크트리 여러 개가 돌고 있다)
- 메인 체크아웃은 사용자가 소스트리·IDE 로 보는 그대로 남는다

메인 체크아웃에서 바로 분기하고 싶으면 `--in-place`. 이때는 미커밋 변경이 있으면 건너뛴다.

## 절차

### 1. 대상과 이름을 정한다

대상은 승인된 계획서의 **작업 배분표**에서 가져온다. 계획서 없는 긴급 작업이면 사용자에게 확인한다.

이름은 전 레포 공통으로 `feature/REF-####` 가 관례다(실제 remote 브랜치로 확인). 슬래시가 없으면 스크립트가 `feature/` 를 붙인다.

- 티켓이 있으면 `REF-3820` 만 넘긴다 → `feature/REF-3820`
- 버그 수정은 `fix/설명` 처럼 직접 적는다 (care 는 `fix/*`·`chore/*`·`hotfix/*` 도 관례)
- **여러 레포에 걸친 작업은 같은 이름을 쓴다.** zent-packages 와 소비 레포는 이름 끝 토막이 같아야 PR 프리뷰가 스냅샷을 자동 매칭한다 (`feature/REF-3820` ↔ `@ref-3820`)

### 2. 만든다

```bash
scripts/new-branch.sh REF-3820 refund hub          # 콘솔 두 곳
scripts/new-branch.sh REF-3820 bznav:care-web      # bznav 는 앱을 지정
scripts/new-branch.sh REF-3820 bznav:packages@care-web   # packages/* — 앱 계열 지정 필수
scripts/new-branch.sh fix/qa-로그인-오류 care        # 이름 직접 지정
scripts/new-branch.sh REF-3820 refund --in-place   # 워크트리 없이
scripts/new-branch.sh REF-3820 refund --dry-run    # 먼저 확인
```

대상은 레포 이름 일부로 매칭한다 — `refund` `hub` `care` `op` `packages`(=zent-packages) `bznav:<앱>` `bznav:packages@<앱>`.

⚠️ **`bznav:packages` 는 앱 계열을 반드시 지정한다.** `packages/*` 는 5개 앱이 공유하지만 PR base 가 계열마다 다르다 — `dev`(care·plus, EKS) / `dev-ecs`(brand·refund·sena, ECS). 그리고 **`dev-ecs` 가 `dev` 보다 뒤처져 있다**(확인 시점 254커밋). 계열을 잘못 고르면 소비 앱 PR 에 다른 계열 커밋이 대량으로 딸려간다. 지정하지 않으면 스크립트가 계열 목록을 보여주고 멈춘다.

**base 는 `hermes.config.json` 의 `prBase`** 에서 온다. 문서·지식의 기준(`branch`, 운영 반영분)과 **다르다** — 작업은 개발 브랜치에서 딴다.

| 레포 | 문서 기준 | 작업 base |
|---|---|---|
| client-brics-{refund,hub,care} · web-op | `prd` | **`dev`** |
| bznav `care-web`·`plus-web` | `prd-care`/`prd-plus` | **`dev`** |
| bznav `refund-web`·`brand-web`·`sena-web` | `prd-<앱>` | **`dev-ecs`** |
| bznav `packages/*` | `dev` | **소비 앱 계열을 지정한다** — `bznav:packages@<앱>` |
| zent-packages | `main` | **`main`** |

### 3. 건너뛴 레포를 처리한다

| 사유 | 헤르메스가 할 일 |
|---|---|
| 같은 이름 브랜치가 이미 있다 | 어디에 체크아웃돼 있는지 함께 나온다. 이어서 쓸지 새 이름을 쓸지 확인 |
| 워크트리 경로가 이미 있다 | 남은 작업인지 확인. 필요하면 `git worktree remove` |
| `origin/<base>` 를 못 읽었다 | 로컬 ref 가 있으면 경고와 함께 진행한다(⚠️ 표시). 아예 없으면 건너뛴다 |
| `repos/<레포>` 링크 없음 | `scripts/setup.sh` 안내 |
| 미커밋 변경 (`--in-place` 일 때만) | **stash 하지 않는다.** 워크트리로 하면 무관하다고 알린다 |

**건너뛴 레포에는 디스패치하지 않는다.** 나머지만 먼저 보낼지는 계획서의 의존성을 보고 판단한다(공유 패키지가 선행이면 멈춘다).

### 4. 계획서에 기록한다

브랜치·base SHA·워크트리 경로를 Checkpoint 의 `Work ref` 에 적는다. `/new` 이후 재개할 때 이게 없으면 어디서 하던 일인지 알 수 없다.

```markdown
- Work ref: refund `feature/REF-3820` (origin/dev 1eb6e63)
            ~/orca/workspaces/client-brics-refund/feature-REF-3820
```

### 5. 그 경로에서 에이전트를 띄운다

```bash
scripts/delegate.sh refund-fe --cwd ~/orca/workspaces/client-brics-refund/feature-REF-3820
```

pane 하단 상태바에 `📁 client-brics-refund  🌿 feature/REF-3820  ⧉worktree` 로 뜬다. `⧉` 가 워크트리 표시다.

## 끝난 뒤

1. 결과를 확인하고 사용자가 커밋 여부를 정한다 (**에이전트는 커밋하지 않는다**)
2. 메인 체크아웃·소스트리에서 보려면 `wt-sync` 로 반영한다. 같은 `.git` 이라 push/fetch 는 필요 없다
3. 작업이 끝나면 워크트리를 지운다

```bash
git -C repos/<레포> worktree remove ~/orca/workspaces/<레포>/<슬러그>
```

## 주의

- 이 스킬은 **브랜치와 작업 공간만** 만든다. 커밋·push·PR 은 사용자가 정한다 (`AGENTS.md` 5절)
- bznav-web 은 앱이 여러 개여도 **레포가 하나**다. 두 앱을 같이 작업해도 워크트리는 하나만 만든다
- 워크트리와 메인이 **같은 브랜치를 동시에** 물 수 없다. 이미 쓰는 브랜치면 건너뛴다
- 워크트리 위치는 `HERMES_WORKTREE_ROOT` 로 바꿀 수 있다 (기본 `~/orca/workspaces`)
