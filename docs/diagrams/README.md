# 다이어그램

작업 흐름을 인터랙티브 HTML 로 본다. 보는 방법은 셋이다.

```
/guide 그림                  ← 브라우저로 연다
/guide pane                  ← 메뉴에서 "작업 흐름 다이어그램" 선택
open docs/diagrams/hermes-flow.html
```

| 파일 | 내용 |
|---|---|
| `hermes-flow.workflow.json` | **원본.** 이걸 고치고 HTML 을 다시 만든다 |
| `hermes-flow.html` | 생성물. 독립 실행 HTML 이라 의존성 없이 열린다 (약 800KB) |

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

node $A/bin/archify.mjs validate workflow docs/diagrams/hermes-flow.workflow.json --quality showcase --json
node $A/bin/archify.mjs deliver  workflow docs/diagrams/hermes-flow.workflow.json docs/diagrams/hermes-flow.html --quality showcase --json
```

**`validate` 가 9개 검사를 모두 통과해야 showcase 합격이다.** 4개만 나오면 기본 검증이지 합격이 아니다. `deliver` 가 0 이 아닌 종료 코드를 내면 실패이며, 이전 HTML 이 그대로 남는다.

### 스키마에서 걸렸던 것

- **`col` 은 0–5 다.** 7단계를 그리려면 열을 합치거나 레인을 나눠야 한다
- `mainPath` 의 이웃 쌍은 **실제 엣지가 있어야 한다**. 중간 노드를 빼먹으면 `layout/constraint` 로 걸린다
- 서로 무관한 엣지가 같은 세로 통로를 지나면 `composition/ambiguous-corridor` 가 난다. 좌표를 손대기 전에 **노드를 다른 열로 옮기는 쪽이 낫다**
