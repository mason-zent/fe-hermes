# 다이어그램

작업 흐름과 담당 레포 구조를 인터랙티브 HTML 로 본다. 보는 방법은 셋이다.

```
/guide 그림                  ← 목록을 브라우저로 연다
/guide pane                  ← 메뉴에서 "다이어그램" 선택
open docs/diagrams/index.html
```

`index.html` 이 목록이고 거기서 골라 들어간다. 각 다이어그램은 **독립 실행 HTML** 이라 의존성 없이 열린다(장당 약 800KB).

서비스마다 **보는 각도를 셋으로 나누고**, 그 위에 **레포를 가로지르는 구조** 세 장을 뒀다.

| 타입 | 무엇을 보나 | 파일 |
|---|---|---|
| architecture | 무엇으로 이루어져 있는가 (파일 근거 포함) | `<서비스>.architecture.json` → `<서비스>.html` |
| sequence | 한 화면이 뜰 때 무엇이 오가는가 | `<서비스>.sequence.json` |
| lifecycle | 상태가 어디서 갈라지고 멈추는가 | `<서비스>.lifecycle.json` |

| 서비스 | architecture | sequence | lifecycle | 대표 화면 |
|---|:--:|:--:|:--:|---|
| client-brics-refund | ✅ | ✅ | ✅ | `app/refund-service/user/all` |
| client-brics-hub | ✅ | ✅ | ✅ | `app/messages/templates` |
| client-brics-care | ✅ | ✅ | ✅ | `app/promotion-page` (시퀀스는 `app/bmans`) |
| web-op | ✅ | ✅ | ✅ | `app/documents/[key]` |
| bznav refund-web | ✅ | ✅ | ✅ | `pages/event/[...slug]` · 개인 간편인증 |
| bznav care-web | ✅ | ✅ | ✅ | `app/(my-info)/my-book` |
| bznav brand-web | ✅ | ✅ | ✅ | `app/terms/[...terms]` |
| bznav sena-web | ✅ | ✅ | ✅ | 챗 스트림 |
| bznav plus-web | ✅ | ✅ | ✅ | `app/calc/holiday-pay` (계산기마다 단계가 다르다) |

⚠️ **sequence·lifecycle 은 대표 화면 하나를 정해 그 코드만 그린 것이다.** 같은 앱의 다른 화면은
다르게 동작한다(care 콘솔의 promotion 과 bmans, hub 의 messages 와 admin 이 그렇다). 일반화해서 옮기지 않는다.
이 원칙은 교차 검증에서 오류가 무더기로 나온 뒤에 세운 것이다 — 처음에는 지식 문서 요약으로 일반화해 그렸다가
20건 넘게 틀렸다.

### 레포를 가로지르는 구조

한 레포 안에서는 보이지 않는 것들이다. 영향 범위와 디스패치 순서가 여기서 나온다.

| 다이어그램 | 무엇을 보나 | 원본 |
|---|---|---|
| bznav packages 의존 층 | `@repo/*` 8개가 쌓인 순서. `project-config` 가 바닥, `user-sign` 이 꼭대기 | `bznav-packages.architecture.json` |
| zent-packages 발행처 | 무엇을 발행하고 누가 실제로 쓰는가. bznav 계열은 `web-op` 하나만 쓴다 | `zent-packages.architecture.json` |
| 데이터 출처 지도 | 출처 → 관문 → 서비스. 계열마다 관문이 완전히 다르다 | `data-sources.dataflow.json` |

**`workflow`(작업 절차)는 걷어냈다.** `workflows.md` 텍스트가 더 정확하고 정보량도 많았다.
그림으로 옮기면서 절차 문장이 단정으로 바뀌어 오류가 생기기도 했다. `hermes-flow.workflow.json`
(헤르메스 자신의 Plan-First 흐름)만 남겼다.

아직 없는 것: bznav `packages/*`, `zent-packages`. 화면이 없는 패키지 레포라 성격이 달라 뒤로 미뤘다.

**원본(JSON)을 고치고 HTML 을 다시 만든다.** HTML 을 직접 고치지 않는다.

## 무엇을 그렸나

요청 → 라우팅 → 작업 카드 → 승인 → `/branch` → 에이전트 pane → 구현·검증 → reviewer → 보고.

레인 5개로 **누가 무엇을 하는지**를 나눴다 — 사용자 / 헤르메스 / 멈춤·확인 필요 / FE 에이전트 / 정본·기록. 가이드 뷰 3개로 나눠 볼 수 있다.

**그림 아래 카드 7장에 `CLAUDE.md` 의 "작업 흐름 (Plan-First)" 내용이 그대로 들어 있다** — 6단계 각각의 규칙과 "어디서 멈추고 묻는가". 그래서 가이드 메뉴에는 작업 흐름 항목이 **하나뿐**이고, 그림과 규칙을 한 화면에서 본다.

⚠️ `CLAUDE.md` 의 작업 흐름 절을 고치면 **이 카드도 같이 고쳐야 한다.** 지금은 손으로 옮긴 것이라 자동 동기화되지 않는다.

| 뷰 | 보여주는 것 |
|---|---|
| 요청에서 보고까지 | 승인된 계획대로 흘러가는 기본 경로 |
| 멈추는 지점 | 레포가 모호하거나 브랜치를 못 만들었을 때 |
| 무엇을 읽는가 | 필수 규칙은 항상, knowledge 는 작업 유형별 |

## 노드를 클릭하면 뜨는 것 (Semantic Passport)

워크플로 다이어그램의 팝업에 들어가는 값은 **네 가지뿐**이다. 자유 텍스트 필드는 없다.

```js
passport = { kind: node.type, sublabel: node.sublabel, tag: node.tag, context: "레인 › 그룹 › 페이즈" }
```

| 팝업 항목 | 어디서 오나 |
|---|---|
| 종류 | `node.type` |
| 부제 | `node.sublabel` — 노드 면에도 보인다 |
| **배지** | `node.tag` — **팝업에만 나온다.** 그 노드에서 가장 중요한 규칙 한 줄을 여기 넣는다 |
| 맥락 | 레인 · 그룹 · 페이즈 이름을 이어 붙인 것. **그룹을 촘촘히 나누면 맥락이 좋아진다** |

`sources`(파일 경로 + 줄번호)는 `architecture` 타입 전용이라 워크플로에서는 쓸 수 없다. 노드에 파일 근거를 달고 싶으면 `architecture` 다이어그램을 따로 만들어야 한다.

## 다시 만들기

[Archify](https://github.com/tt-a1i/archify) 스킬로 만들었다. 레포에 포함하지 않았으므로 필요할 때 받아서 쓴다.

```bash
# 전역 설치 (에이전트가 직접 다이어그램을 만들게 하려면)
npx skills add tt-a1i/archify -g

# 또는 한 번만 쓰고 말 때
git clone --depth 1 https://github.com/tt-a1i/archify.git /tmp/archify
A=/tmp/archify/archify

# 작업 흐름 (workflow)
node $A/bin/archify.mjs validate workflow docs/diagrams/hermes-flow.workflow.json --quality showcase --json
node $A/bin/archify.mjs deliver  workflow docs/diagrams/hermes-flow.workflow.json docs/diagrams/hermes-flow.html --quality showcase --json

# 레포 구조 (architecture) — sources 를 쓰므로 --repo-root 가 필요하다
node $A/bin/archify.mjs validate architecture docs/diagrams/client-brics-refund.architecture.json \
  --quality showcase --repo-root repos/client-brics-refund --json
node $A/bin/archify.mjs deliver  architecture docs/diagrams/client-brics-refund.architecture.json \
  docs/diagrams/client-brics-refund.html --quality showcase --repo-root repos/client-brics-refund --json
```

다이어그램을 추가하면 **`node scripts/build-diagram-index.mjs`** 를 돌린다. `index.html` 은 실제 파일 목록에서 생성되므로 손으로 카드를 늘리지 않는다.

**`validate` 가 9개 검사를 모두 통과해야 showcase 합격이다.** 4개만 나오면 기본 검증이지 합격이 아니다. `deliver` 가 0 이 아닌 종료 코드를 내면 실패이며, 이전 HTML 이 그대로 남는다.

### workflow 에서 걸렸던 것

- **`col` 은 0–5 다.** 7단계를 그리려면 열을 합치거나 레인을 나눠야 한다
- `mainPath` 의 이웃 쌍은 **실제 엣지가 있어야 한다**. 중간 노드를 빼먹으면 `layout/constraint` 로 걸린다
- 서로 무관한 엣지가 같은 세로 통로를 지나면 `composition/ambiguous-corridor` 가 난다. 좌표를 손대기 전에 **노드를 다른 열로 옮기는 쪽이 낫다**
- 팝업(Semantic Passport)이 받는 값은 `kind`·`sublabel`·`tag`·`레인 › 그룹 › 페이즈` 넷뿐이다. 자유 텍스트 필드가 없다

### architecture 에서 걸렸던 것

workflow 보다 검사가 빡빡하다. 아래를 지키면 대부분 한 번에 통과한다.

- `layout: {mode:"grid", cols, cellW, cellH, gapX, gapY}` 를 쓰고 component 에 `row`/`col`. **픽셀 `pos` 를 직접 잡지 않는다**
- 시작값 `cellW 128 · cellH 70 · gapX 44 · gapY 52`, component `size [128,62]`. 더 크면 `composition/desktop-readability` 로 떨어진다(1440px 기준)
- **같은 열의 수직 연결에는 `fromSide`/`toSide` 를 명시**한다. 위로면 `top`/`bottom`, 아래로면 `bottom`/`top`. 안 하면 `endpoint-side-direction` 으로 떨어진다
- **가로 연결의 라벨은 4자 이하**로 쓰거나 생략한다. 열 간격(44px)보다 넓으면 양쪽 노드와 겹친다
- 라벨이 노드와 겹치면 진단이 `labelDy +24` 처럼 **구체값을 알려준다.** 그대로 적용한다
- 연결이 무관한 노드를 관통하면(`clean-flow/edge-through-node`) 좌표를 손대기 전에 **노드를 다른 행·열로 옮긴다.** 주 경로가 지나는 행은 비워 둔다
- **boundary 는 하나만** 둔다. 두 개가 겹치면 어느 쪽이 무슨 뜻인지 흐려진다. "레포명 — 박스 밖은 이 레포에서 바꿀 수 없다" 식이면 저절로 읽힌다
- `sources` 를 쓰려면 `meta.repository`(url·provider·link_mode·**40자 전체 SHA**)가 필요하고, `validate`·`deliver` 에 `--repo-root <레포>` 를 넘겨야 한다. 비공개 레포라 `link_mode: "local-only"` 를 쓴다
- **`sources` 의 `path` 는 실제 파일이어야 한다.** 디렉터리(`app/foo/`)는 거부된다. `git -C <레포> cat-file -e <SHA>:<경로>` 로 미리 확인한다
- `meta.views[].focus` 에 없는 id 를 쓰면 `unknown semantic id` 로 떨어진다

### sequence 에서 걸렸던 것

가로축이 참여자, 세로축이 시간이다. 좌표를 직접 잡는 타입이라 아래 두 가지만 지키면 된다.

- **`meta.viewBox[0]` 이 참여자 수를 감당해야 한다.** 참여자 9명이면 1040 은 되어야 한다. 좁으면 오른쪽 참여자가 잘린다
- **참여자 `label` 은 박스(86px)를 넘지 않게 짧게** 쓴다. `server-zent-ip` 같은 건 `zent-ip` 로 줄인다. 넘치면 `composition/label-route-clearance` 로 떨어진다
- 메시지 `y` 는 읽히는 띠 안에 있어야 한다. `viewBox[1]` 이 900 이면 **180 ~ 810** 사이에 둔다. 마지막 메시지를 바닥까지 내리면 걸린다
- 참여자는 **호출 순서대로 왼쪽에서 오른쪽**으로 놓는다. 되돌아가는 화살표가 많아지면 읽기 어려워진다

### lifecycle 에서 걸렸던 것

가장 까다롭다. **레인 이름과 열 좌표가 렌더러에 박혀 있어서**, 그걸 모르면 진단이 수백 개 나온다.

- **레인 id `main` 과 `terminal` 은 예약어다.** `main` = 위쪽 단계 밴드, `terminal` = 아래쪽 종료 밴드, **그 외 레인은 전부 가운데 밴드 하나를 나눠 쓴다**(`yOffset` 으로만 분리). `main` 레인이 없으면 레이아웃이 통째로 깨진다
- **x 좌표는 밴드마다 고정이다.** 단계 밴드는 5열 `94 · 248 · 402 · 556 · 710`, 가운데·종료 밴드는 3열 `402 · 556 · 710`. 즉 **단계 col 2·3·4 만 아래 밴드와 x 가 맞는다.** 수직 전이는 x 가 맞는 열끼리만 깨끗하게 떨어진다
- y 는 단계 126, 가운데 278, 종료 450 (높이 58~62). 그릴 수 있는 바닥은 `viewBox[1] - 122`
- **노드 사이 네 간격(153~189 · 307~343 · 461~497 · 615~651)은 단계 전이가 전부 점유한다.** 밴드를 가로지르는 우회로를 이 사이로 내리면 반드시 `composition/proper-crossing` 이 난다. 우회는 **노드 바깥(x > 769)** 으로 돌린다
- **`via` 의 첫 점은 출발 노드 중심의 x 와 같아야 한다.** 앵커가 중심에 고정이라 x 를 달리 주면 대각선이 생겨 `artifact/orthogonal-arrows` 로 떨어진다
- `states[].step` 은 **문자열**(`"01"`), `type` 에 `terminal` 은 없다(`success`/`failure` 를 쓴다), `lanes` 는 `id`·`label` 만 받는다
- `meta` 에 `repository` 나 `locale: "ko"` 를 넣으면 스키마에서 거부된다 (architecture 와 다르다)
- `route` 는 `auto · straight · drop · bottom-channel · top-channel · right-channel · left-channel`
