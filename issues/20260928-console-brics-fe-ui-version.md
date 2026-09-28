---
title: 콘솔에 설치된 brics-fe-ui 0.3.x 의 사이드바·인증 헤더 동작 확인
status: open
repo: client-brics-refund
agent: packages-fe     # 확인 대상이 zent-packages 의 brics-fe-ui 과거 버전 소스라서
kind: check
severity: low
source: 다이어그램 가이드 작성 2026-09-28
plan:
---

refund·care 콘솔이 쓰는 `@zenterprise-inc/brics-fe-ui` 는 0.3.x 인데, 가이드·다이어그램 설명은 zent-packages main(0.4.1) 코드를 보고 썼다. 사이드바가 하드코딩인지 hub DB 인지, `RootWrapper` 가 Authorization 헤더를 심는지 설치 버전에서 확인해야 한다.

## 근거
- zent-packages origin/main `frontend/brics/ui/src/components/RootWrapper.tsx:48`, `RootSidebar`
- client-brics-refund `package.json` `^0.3.3`, `client-brics-refund.architecture.json:406` 카드 "사이드바 = hub /brics-menus DB"

## 할 일
- 설치 버전 소스(node_modules 또는 해당 태그)와 대조 → 지식 문서·구조도 카드 정정

## 확인 결과 (2026-09-28 · packages-fe)

### 0. 작업 트리 상태 (체크아웃·stash 안 함)
- `repos/zent-packages`: `## feature/REF-3481...origin/feature/REF-3481`, 미추적 `.preview-branch-strategy.html`, `PROMPT-bznav-fe-decoupling.md`, `PROMPT-selective-release.md`, `docs/`. 확인은 전부 태그·`origin/main`을 `git show`로 읽어서 했다 (로컬 브랜치 영향 없음)
- 기준 ref: zent-packages `origin/main` = `bfa6be4` (2026-09-16), brics-fe-ui 0.4.1

### 1. 콘솔별 설치 버전 (각 레포 `origin/prd`) — 이슈 본문 "0.3.x"는 레포마다 다르다
| 콘솔 | `package.json` | `pnpm-lock.yaml` 해석 버전 |
|---|---|---|
| client-brics-refund | `package.json:32` `^0.3.3` | `pnpm-lock.yaml:25` **0.3.3** |
| client-brics-care | `package.json:31` `0.3.1` (고정) | `pnpm-lock.yaml:13` **0.3.1** |
| client-brics-hub | `package.json:38` `0.2.4` | `pnpm-lock.yaml:25` 0.2.4 (단, hub는 자체 `HubRootWrapper`를 써서 공유 RootWrapper 영향 없음) |

- refund·care 모두 `origin/prd:app/layout.tsx:4` 에서 `@ui/components/RootWrapper` 를 import 해 감싼다
- **0.3.1 은 git 태그가 없다** (`@zenterprise-inc/brics-fe-ui@0.3.0` 다음이 `@0.3.2`). 그래서 care 로컬 `node_modules/@zenterprise-inc/brics-fe-ui`(version 0.3.1, prd lock과 같은 버전)의 소스를 태그와 비교했다: `RootWrapper.tsx` 는 0.3.0·0.3.2·0.3.3 과 **동일**, `RootSidebar/index.tsx` 는 0.3.0·0.3.2 와 동일, 0.3.3 과는 **메뉴 라벨·순서만** 다름(제휴/프로모션→마케팅/제휴 관리, 랜딩 SEO 관리 추가 등)

### 2. 사이드바 = 하드코딩 (hub DB 아님) — 0.3.x·main 모두
- `@0.3.3:frontend/brics/ui/src/components/RootSidebar/index.tsx` (791줄) — 메뉴가 JSX 안 `subMenus={[...]}` 리터럴로 박혀 있다 (`:235`, `:261`, `:288` …). 노출 여부는 `:114` `useSession()` 의 `session.user.functions.includes(AuthFunction.XXX)` 로 `isShow` 판정 (`:225` 등)
- 데이터 조회 코드 없음: 같은 파일 import(`:2`~`:43`)에 fetch/axios/useQuery 없음. `git grep "brics-menus"` 결과 **0.3.3 태그·origin/main 의 `frontend/` 전체에 0건**
- 0.3.3 → main 차이도 하드코딩 항목 1줄 추가뿐 (`index.tsx` +`{ href: .../electronic-queue, label: '전자신고 큐' }`)
- `/brics-menus` DB 메뉴는 **hub 전용**: hub `origin/prd:app/_components/sidebar/HubRootWrapper.tsx:20` "`GET /v1/menu/my`가 준 메뉴 트리", `HubRootSidebar.tsx:37` "공유 패키지 `RootSidebar`의 크롬을 … 내재화"

→ **refund·care 콘솔에 메뉴를 추가하려면 hub DB 등록이 아니라 zent-packages `RootSidebar/index.tsx` 수정 + 발행 + 콘솔 버전 올림이 필요하다** (care는 0.3.1 고정이라 `package.json` 수정까지)

### 3. RootWrapper Authorization 헤더 — 심는다. 다만 방식이 main과 다르다
`@0.3.3:frontend/brics/ui/src/components/RootWrapper.tsx` (0.3.1 동일):
- `:19` `useSessionTimeout({ activityDebounceMs: 1000, sessionExtensionMs: 3600000, checkIntervalMs: 30000 })` — 반환값을 `session` 하나로 받음 (`{session, status}` 아님)
- `:60`~`:62` 렌더 본문에서 `if (session) { if (!AXIOS_INSTANCE.defaults.headers.common.Authorization) { ... = \`Bearer ${session.id_token}\` } }` — **헤더가 비었을 때 1회만** 세팅. id_token 이 refresh 돼도 갱신 안 됨
- `:48` `if (!session)` 이면 `ZENT_COOKIE_REDIRECT_URL` 저장 후 `router.push('/')` — loading 과 unauthenticated 를 구분하지 않음
- 메뉴바 쿠키 effect 에 `isMenuOpen === undefined` 가드 없음

origin/main(0.4.1) `RootWrapper.tsx`:
- `:19` `const { session, status } = useSessionTimeout()`
- `:46`~`:50` `useEffect([session?.id_token])` 로 **토큰 바뀔 때마다** 헤더 재세팅
- `:54` `status !== 'unauthenticated'` 면 리다이렉트 판단 안 함
- `:36` 첫 렌더 쿠키 덮어쓰기 가드

### 4. 정정이 필요한 문서 (이번에 수정 안 함 — 담당 범위 밖)
- `docs/diagrams/client-brics-refund.architecture.json:406` "사이드바 메뉴 — hub 의 /brics-menus (DB 행)" → 틀림. brics-fe-ui `RootSidebar` 하드코딩, packages-fe 선행
- `docs/knowledge/client-brics-refund/workflows.md:9` 같은 내용 → 같은 정정
- `docs/knowledge/client-brics-care/workflows.md:10` "`@ui` RootWrapper/hub DB" → "hub DB" 제거
- `docs/knowledge/zent-packages/patterns.md:12` RootWrapper 설명은 **main(0.4.x) 기준**. "refund 0.3.3·care 0.3.1 설치본은 헤더 1회 세팅·status 미구분(구 동작)" 을 덧붙이는 게 맞다 (추측 아님, 위 3절 근거)
- (참고) hub 다이어그램(`client-brics-hub.*.json`)의 `/brics-menus`·"헤더 비었을 때 1회" 는 hub 자체 코드 얘기라 이번 확인 범위 밖 — 정확성은 hub 코드로 따로 확인 필요

### 5. 소비 레포 영향 메모
- refund·care 는 main 의 id_token 갱신 수정(401 방지)·loading 리다이렉트 수정을 **아직 못 받고 있다**. 받으려면 0.4.1 로 `pnpm up` 필요 (0.3→0.4 는 0.x 마이너라 `^0.3.3` 범위 밖). 올릴지는 별도 판단

## 후속
- [ ] 문서 4곳 정정 — refund 구조도 카드(:406)·refund workflows:9·care workflows:10 의 "hub DB" 제거, zent-packages patterns:12 에 0.3.x 구 동작 덧붙임 (헤르메스가 근거 재확인 후)
- [ ] refund·care 콘솔 brics-fe-ui 0.4.1 올리기(401 방지 수정 반영) 여부 → 새 이슈로 등록

## 확인 결과 (2026-09-28 · packages-fe, 워크트리 재확인)

앞 절(같은 날짜 packages-fe)을 이슈 전용 워크트리 `.worktrees/zent-packages/issue-20260928-console-brics-fe-ui-version` 에서 `git show`·`git ls-tree`·`git rev-parse` 로 다시 확인했다. 메인 체크아웃(`repos/zent-packages`)과 콘솔 레포는 이번에 읽지 않았다. 그래서 앞 절 0·1절(메인 체크아웃 상태, 콘솔별 lock 버전, care `node_modules` 0.3.1 대조)은 **재확인하지 않았다(앞 절 기록 그대로)**.

### 0. 작업 트리 상태
- 워크트리: `## HEAD (no branch)`, 미커밋 변경 없음. `HEAD` = `origin/main` = `bfa6be4c` — `frontend/brics/ui/package.json:3` `"version": "0.4.1"`

### 1. 앞 절 2·3절 근거 — 일치
- `@0.3.3:frontend/brics/ui/src/components/RootWrapper.tsx:19`~`:23` `const session = useSessionTimeout({...})`, `:48` `if (!session)` 리다이렉트, `:60`~`:62` 렌더 중에 `Authorization` 헤더가 비었을 때만 세팅 — 앞 절과 줄 번호까지 같다
- `origin/main:…/RootWrapper.tsx:19` `{ session, status }`, `:36` 쿠키 가드, `:46`~`:50` `useEffect([session?.id_token])`, `:54` `status !== 'unauthenticated'` 가드 — 일치. 이슈 본문의 근거 `RootWrapper.tsx:48` 는 main 의 헤더 세팅 줄이다
- `@0.3.3:…/RootSidebar/index.tsx` 791줄, `:114` `useSession()`, `:226`~`:227` `session?.user?.functions?.includes(AuthFunction.…)` 로 `isShow`, `subMenus={[` 리터럴 `:235`·`:261`·`:288`·`:312`·`:326`·`:498`·`:556` … — **하드코딩**. import(`:2`~`:43`)에 fetch/axios/useQuery 없음
- `git grep -E 'brics-menus|/v1/menu'` 에서 `frontend/` 기준 **0.3.3·0.3.4·origin/main 모두 0건**

### 2. 앞 절에 없던 사실 — `0.3.4` 태그가 있다
태그 목록: `0.2.1~0.2.4`, `0.3.0`, `0.3.2`, `0.3.3`, **`0.3.4`(2026-09-15)**, `0.4.1`(2026-09-16). `0.3.1`·`0.4.0` 태그는 없다.

| 태그 | RootWrapper blob | RootSidebar/index.tsx blob (줄 수) |
|---|---|---|
| 0.3.0 / 0.3.2 | `94534760` | `d69cc61e` (787) |
| 0.3.3 | `94534760` | `853f22fa` (791) |
| 0.3.4 | `94534760` | `6c25b4de` (792) |
| 0.4.1 = origin/main | **`f032dc7e`** | `6c25b4de` (792) |

- **RootWrapper 는 0.3.0~0.3.4 가 모두 같은 파일(구 동작)이다.** 새 동작은 `0.4.x` 에서만 들어 있다. 바뀐 커밋은 `92c707a feat(pkgs) REF-3584 : 세션 타임 관련 수정`(2026-09-04) 하나 (`git log 0.3.4..0.4.1 -- RootWrapper.tsx`)
- 앞 절의 "0.3.3 → main 사이드바 차이 = 전자신고 큐 1줄" 은 정확히는 **0.3.3 → 0.3.4 차이**다 (`git diff 0.3.3 0.3.4` 에서 `+ { href: \`${NEXT_PUBLIC_CONSOLE_OP_URL}/electronic-queue\`, label: '전자신고 큐' }` 한 줄). 0.3.4 와 0.4.1 의 사이드바는 같은 파일이다
- 그래서 refund `^0.3.3` 이 lock 갱신으로 0.3.4 가 되면 사이드바에 '전자신고 큐'가 추가될 뿐이고, **헤더·리다이렉트 수정은 받지 못한다**

### 3. 0.4 로 올릴 때 조건 (앞 절 5절 보강)
- `origin/main:frontend/brics/ui/CHANGELOG.md` `## 0.4.0` Minor `92c707a`: "`useSessionTimeout`의 새 반환 시그니처 `{ session, status }`에 맞춰 수정. `brics-fe-zent-auth` 신버전이 필요하다." 0.4.0 은 zent-auth `0.5.0`, 0.4.1 은 `0.5.1` 에 의존한다
- `origin/main:frontend/brics/ui/package.json:72` `"@zenterprise-inc/brics-fe-zent-auth": "workspace:*"` 가 `dependencies` 에 있다 → 발행본은 zent-auth 0.5.x 를 함께 끌어온다
- **확인 필요(추측입니다)**: 콘솔이 `brics-fe-zent-auth` 를 따로 직접 의존하고 그 버전이 0.5 미만이면, 설치본이 두 개가 되어 `AXIOS_INSTANCE`(`@zenterprise-inc/brics-fe-zent-auth/lib/fetcher`)가 서로 다른 인스턴스가 될 수 있다. 그러면 RootWrapper 가 심은 헤더가 콘솔 API 호출에 안 붙는다. 콘솔을 올리는 이슈에서 **brics-fe-ui 0.4.1 과 zent-auth 0.5.1 을 같이 올려야 한다**. 콘솔 쪽 zent-auth 버전은 이번에 확인하지 않았다

### 4. 결론
- 이슈 질문 두 가지 결과: ① refund·care 설치본(0.3.x)의 사이드바는 **brics-fe-ui 하드코딩**이고 hub `/brics-menus` DB 가 아니다 ② `RootWrapper` 는 Authorization 헤더를 **심는다**. 다만 0.3.x 는 "비었을 때 1회, 렌더 중 세팅" 이라 토큰이 refresh 돼도 헤더가 갱신되지 않는다
- 앞 절 4절 문서 정정 목록은 그대로 유효하다. `zent-packages/patterns.md:12` 에 덧붙일 문구는 "0.3.x(~0.3.4 전부)는 구 동작, 0.4.0부터 새 동작" 으로 경계를 정확히 적는 게 맞다
- 수정한 파일은 이 이슈 파일 하나다. 코드·changeset·커밋은 없다
