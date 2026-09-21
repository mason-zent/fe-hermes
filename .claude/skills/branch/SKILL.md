---
name: branch
description: 작업을 시작하기 전에 대상 레포에 작업 브랜치를 새로 만듭니다. 레포마다 다른 PR base(콘솔 dev · bznav 앱별 dev 또는 dev-ecs · zent-packages main)를 hermes.config.json 에서 골라 origin 최신에서 분기하고, 미커밋 변경이 있으면 건너뛰고 보고합니다. 디스패치 전에 씁니다.
argument-hint: "<티켓번호 또는 브랜치명> <대상...> — 예: REF-3820 refund hub · REF-3820 bznav:care-web"
---

# 작업 브랜치 생성

대상: $ARGUMENTS

## 왜 먼저 하는가

로컬 작업 트리는 **브랜치가 제각각이다.** 확인 없이 FE 에이전트를 디스패치하면 남의 작업 브랜치 위에 얹히거나 미커밋 변경과 섞인다. 되돌리기 어렵고, 누구 변경인지 구분도 안 된다.

그래서 **디스패치 전에 브랜치부터 만든다.** 계획서 승인 직후, 3단계(병렬 디스패치) 바로 앞이 제자리다.

## 절차

### 1. 대상과 브랜치 이름을 정한다

대상은 승인된 계획서의 **작업 배분표**에서 가져온다. 계획서가 없는 긴급 작업이면 사용자에게 확인한다.

이름 규칙 — 전 레포 공통으로 `feature/REF-####` 가 관례다(실제 remote 브랜치로 확인). 슬래시가 없으면 스크립트가 `feature/` 를 붙인다.
- 티켓이 있으면 `REF-3820` 만 넘긴다 → `feature/REF-3820`
- 버그 수정은 `fix/설명` 처럼 직접 적는다 (care 는 `fix/*`·`chore/*`·`hotfix/*` 도 관례)
- **여러 레포에 걸친 작업은 같은 이름을 쓴다.** zent-packages 와 소비 레포는 이름 끝 토막이 같아야 PR 프리뷰가 스냅샷을 자동 매칭한다 (`feature/REF-3820` ↔ `@ref-3820`)

### 2. 만든다

```bash
scripts/new-branch.sh REF-3820 refund hub              # 콘솔 두 곳
scripts/new-branch.sh REF-3820 bznav:care-web          # bznav 는 앱을 지정한다
scripts/new-branch.sh REF-3820 bznav:packages          # packages/* 작업
scripts/new-branch.sh fix/qa-로그인-오류 care            # 이름을 직접 지정
scripts/new-branch.sh REF-3820 refund --dry-run        # 먼저 확인
```

대상 이름은 레포 이름 일부로 매칭한다 — `refund` `hub` `care` `op` `packages`(=zent-packages) `bznav:<앱>`.

**base 는 `hermes.config.json` 의 `prBase` 에서 온다.** 문서·지식의 기준(`branch`, 운영 반영분)과 **다르다** — 작업은 개발 브랜치에서 딴다.

| 레포 | 문서 기준 | 작업 base |
|---|---|---|
| client-brics-{refund,hub,care} · web-op | `prd` | **`dev`** |
| bznav `care-web`·`plus-web` | `prd-care`/`prd-plus` | **`dev`** |
| bznav `refund-web`·`brand-web`·`sena-web` | `prd-<앱>` | **`dev-ecs`** |
| bznav `packages/*` | `dev` | **`dev`** |
| zent-packages | `main` | **`main`** |

### 3. 건너뛴 레포를 처리한다

스크립트는 아래 경우 **그 레포를 건너뛰고 보고**한다. 절대 알아서 처리하지 않는다.

| 사유 | 헤르메스가 할 일 |
|---|---|
| 미커밋 변경이 있다 | **stash 하지 않는다.** 누구 변경인지 사용자에게 확인한다. 생성물(`__generated__`)만 바뀐 것인지, 진행 중 작업인지 구분해 보고 |
| 같은 이름 브랜치가 이미 있다 | 이어서 쓸지 새 이름을 쓸지 확인 |
| `origin/<base>` fetch 실패 | 네트워크·권한 문제. 그대로 보고 |
| `repos/<레포>` 링크 없음 | `scripts/setup.sh` 안내 |

**한 레포라도 건너뛰었으면 그 레포에는 디스패치하지 않는다.** 나머지만 먼저 보내도 되는지는 계획서의 의존성을 보고 판단한다(공유 패키지가 선행이면 멈춘다).

### 4. 계획서에 기록한다

성공한 레포의 **브랜치 이름과 base SHA** 를 계획서 Checkpoint 의 `Work ref` 에 적는다. `/new` 이후 재개할 때 어느 브랜치에서 하던 일인지 이게 없으면 알 수 없다.

```markdown
- Work ref: refund `feature/REF-3820` (origin/dev 1eb6e63 에서 분기, 미커밋 없음)
            hub    `feature/REF-3820` (origin/dev fb5c7e3 에서 분기)
```

### 5. 디스패치 프롬프트에 브랜치를 명시한다

FE 에이전트에게 넘길 때 **어느 브랜치에서 작업하는지** 적는다. 에이전트는 커밋하지 않지만, 잘못된 브랜치에서 작업하면 결과를 옮기기 어렵다.

## 주의

- **에이전트는 여전히 커밋하지 않는다.** 이 스킬은 브랜치만 만든다. 커밋·push·PR 은 사용자가 정한다 (`AGENTS.md` 5절)
- bznav-web 은 앱이 여러 개여도 **레포가 하나**다. 두 앱을 같이 작업해도 브랜치는 하나만 만든다
- 이미 작업 중인 브랜치가 있는데 새로 파야 하는 상황이면, 기존 브랜치를 어떻게 할지 **먼저 사용자에게 묻는다**
