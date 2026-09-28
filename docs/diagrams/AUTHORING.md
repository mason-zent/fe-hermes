# 다이어그램 작성 가이드 (공통)

다이어그램을 **새로 그리거나 다시 그릴 때** 읽는 문서다. 사람이든 에이전트든 이 문서 → 서비스 가이드 순서로 읽고 시작한다.

| 순서 | 문서 | 무엇이 있나 |
|---|---|---|
| 1 | **이 문서** | 모든 서비스에 공통인 원칙 · 심층 번들 표준 · archify 제약 · 검증 절차 |
| 2 | `guides/<서비스>.md` | 그 서비스의 기준 ref · 화면 수 · 탭 구성 · 탭 0 에 들어갈 실제 파일 · 서비스만의 함정 |
| 3 | `docs/knowledge/<레포>/gotchas.md` | 코드 함정. 그림 문장이 여기와 부딪히면 코드를 다시 본다 |
| 참고 | `README.md` (이 폴더) | 목록·타입 설명, archify 설치·명령, 타입별 "걸렸던 것" |

서비스 가이드가 이 문서와 다르면 **서비스 가이드가 우선**이다(그 서비스에서 실제로 겪은 예외라서).

---

## 1. 원칙 — 어기면 다시 그린다

1. **코드는 운영 기준 ref 에서만 읽는다.** `hermes.config.json` 의 `branch`(bznav 는 앱별 `prd-<앱>`)를 임시 체크아웃해 읽는다. `repos/<레포>` 메인 체크아웃은 브랜치가 제각각이라 읽지 않는다
2. **그 커밋에 고정한다.** `meta.repository.revision` = 체크아웃한 커밋의 40자 SHA. 탭 번들이면 모든 탭이 같은 커밋이어야 한다
3. **지식 문서 요약으로 그리지 않는다.** 지식 문서는 어디를 볼지 찾는 단서다. 노드 문장은 코드에서 확인한 것만 쓴다. 처음 9장을 요약으로 그렸다가 교차 검증에서 20건 넘게 틀렸다
4. **추측으로 줄 번호를 쓰지 않는다.** `sources` 의 줄은 그 줄에 실제로 그 코드가 있어야 한다. 불확실한 문장은 그림에 넣지 말고 보고에 "확인 필요"로 남긴다
5. **요청 흐름·화면 상태는 대표 화면 하나만 그린다.** 같은 앱의 다른 화면은 다르게 동작한다. 일반화하지 않는다
6. **원본은 JSON 이다.** HTML 을 직접 고치지 않는다. JSON 을 고치고 다시 만든다
7. **코드와 지식 문서가 다르면 코드가 맞다.** 그리다가 찾은 차이는 보고에 파일:줄로 적는다. 지식 문서 수정은 헤르메스가 확인한 뒤 한다

## 2. 무엇을 그릴지 고르기

| 종류 | 무엇을 답하나 | 파일 | 목록 |
|---|---|---|---|
| 구조 (architecture) | 이 레포는 무엇으로 이루어져 있나 | `<서비스>.architecture.json` → `<서비스>.html` | ✅ |
| 화면 맵 (domains) | 어떤 화면이 몇 개씩 있나 | `<서비스>.domains.architecture.json` | ✅ |
| 요청 흐름 (sequence) | 대표 화면 하나가 뜰 때 무엇이 오가나 | `<서비스>.sequence.json` | ✅ |
| **심층 (탭 번들)** | 화면 **전부**가 어디서 어떻게 이어지나 | `<앱>/*.architecture.json` + `build-bundle.py` → `<앱>/<앱>-architecture.html` | ✅ 앱 카드 링크 |
| 화면 상태 (lifecycle) | 상태가 어디서 갈라지나 | `<서비스>.lifecycle.json` | ❌ 2026-09-28 목록에서 뺐다. 새로 만들지 않는다 |

새 서비스를 그린다면 **구조 → 화면 맵 → 심층** 순서다. 구조로 용어를 정하고, 화면 맵으로 도메인 경계를 잡고, 심층에서 전수로 채운다.

## 3. 준비

```bash
# archify (레포에 넣지 않는다)
git clone --depth 1 https://github.com/tt-a1i/archify.git <스크래치>/archify
A=<스크래치>/archify/archify

# 운영 기준 ref 임시 체크아웃 — 끝나면 반드시 지운다
git -C repos/<레포> fetch origin <branch>
git -C repos/<레포> worktree add --detach <스크래치>/co/<이름> origin/<branch>
R=<스크래치>/co/<이름>
git -C $R rev-parse HEAD          # ← revision 에 넣을 40자 SHA
# ...작업...
git -C repos/<레포> worktree remove <스크래치>/co/<이름>
```

- 스크래치는 세션 스크래치패드나 `/tmp` 아래. `hermes/.worktrees/` 는 작업 브랜치용이라 쓰지 않는다
- 화면 수를 먼저 센다: `git -C $R ls-tree -r --name-only HEAD <앱 루트>` 에서 App Router 는 `app/**/page.*`, Pages Router 는 `pages/**` 에서 `_app`·`_document`·`_error`·`api/` 제외

## 4. 심층 번들 표준

### 폴더와 파일

```
docs/diagrams/<앱>/
  <앱>-detail.architecture.json   탭 0 — 상세
  <도메인>.architecture.json       탭 1~N
  *.architecture.html              deliver 결과 (탭마다)
  build-bundle.py                  탭 번들 생성기 (다른 앱 것을 복사)
  <앱>-architecture.html           번들 — 목록에서 링크하는 것
```

### 탭 0 (상세) 뼈대

왼쪽에서 오른쪽(또는 위에서 아래)으로 **요청이 지나가는 순서**대로 놓는다.

```
진입(미들웨어·proxy·next.config 경로 규칙) → 셸(루트 layout·_app·Provider 순서) → 가드
  → 화면군(도메인 탭으로 드릴다운) → 훅·스토어 → 관문(fetch 래퍼·Relay·Orval·CMS 클라이언트) → 외부(API 서버·SSO·CMS)
```

- 화면군 노드는 **점선 드릴다운**으로 도메인 탭에 이어 준다(`build-bundle.py` 의 `DRILL`)
- 탭 0 은 대표 화면을 인용해도 된다. 전수 대조에서 세지 않는다
- Provider 가 10겹을 넘거나 가드가 여럿이면 "셸 · 가드" 를 탭 1 로 따로 뺀다(care-web·sena-web 이 그렇다)

### 도메인 탭

- **모든 화면은 정확히 한 도메인 탭에 들어간다.** 누락 0 · 중복 0 을 스크립트로 증명한다(6절)
- 한 장에 **20~40화면**. 도메인 경계(라우트 그룹·기능 흐름)를 코드에서 확인해 나눈다. 숫자를 맞추려고 도메인을 쪼개거나 합치지 않는다 — 경계가 우선이다
- 화면이 20개 안팎인 앱은 "화면 전수" 1장 + **핵심 흐름을 파일·함수 단위로 깊게** 그린 장들로 채운다(sena 채팅 스트림·웹 푸시, plus 계산기 3계층)
- 화면이 한 자릿수고 URL 이 CMS 데이터로 만들어지면 **실제로 생기는 URL** 을 따로 그린다(brand-web)
- 화면 노드: `sources` 에 그 화면의 page 파일, `tag` 에 `"N 화면"`. 노드당 sources 는 3개가 최대라 **노드 하나에 화면 3개까지**
- 드릴다운 노드가 다른 탭의 화면을 가리킬 때는 그 page 를 근거로 달아도 된다(중복으로 세지 않는다)
- `cards` 에는 그 탭에서 "모르면 틀리는 것" 2~4개. 일반론은 쓰지 않는다

### build-bundle.py

다른 앱 것을 복사해 **바꾸는 것만** 바꾼다.

| 바꾼다 | 그대로 둔다 |
|---|---|
| `TABS`(탭 이름·파일·한 줄 설명), `DRILL`(출발 탭 번호 → 노드 id → 도착 탭), 제목·h1, 화면 수 문구, localStorage 키(`<앱>-diagram-tab`), 출력 파일명 | 드릴다운 스크립트, 스타일. **기준 커밋은 첫 탭 JSON 에서 자동으로 읽는다** — 문구로 박지 않는다 |

## 5. archify 제약 — 심층에서 실제로 걸린 것

타입별 기본 제약은 `README.md` "걸렸던 것". 아래는 심층 24장을 그리며 추가로 걸린 것이다.

| 제약 | 증상 | 대응 |
|---|---|---|
| 노드당 `sources` **최대 3개** | 스키마 거부 | 화면을 노드 3개 단위로 나눈다. 8세트를 한 노드에 몰지 말고 행렬로 |
| source `label` **48자 이하** | 스키마 거부 | `"/경로 — 한 마디"` 형식으로 줄인다 |
| 가로 연결 최소 **24px** | `layout/constraint` | 5열(폭 236)이면 간격이 20px 라 걸린다. 노드 간격을 벌리거나 그 연결을 뺀다 |
| `viewBox` 높이 **240 이상** | `schema/minimum` | 2행짜리 장도 240 을 준다 |
| 긴 `sublabel` | `composition/desktop-readability` | 부제는 짧게. 설명은 `cards` 로 |
| 레이아웃 | — | **심층은 `pos` + `meta.viewBox`**(care-web 이후 24장 전부). README 의 "grid 를 쓰고 pos 를 잡지 않는다" 는 구조도(작은 장) 기준이다 |
| `meta.repository` | 근거 검사 실패 | `url`·`provider: github`·`link_mode: local-only`·**40자 SHA**. `--repo-root` 에 체크아웃 경로 |

진단이 구체값(`labelDy +24` 등)을 주면 그대로 적용한다. 좌표를 만지기 전에 **노드를 다른 행·열로 옮기는 쪽**이 대개 빠르다.

## 6. 검증 — 전부 통과해야 끝난다

```bash
node $A/bin/archify.mjs validate architecture <json> --quality showcase --repo-root $R --json   # ok:true, 검사 9개
node $A/bin/archify.mjs deliver  architecture <json> <html> --quality showcase --repo-root $R --json  # exit 0
python3 docs/diagrams/<앱>/build-bundle.py
node scripts/diagram-coverage.mjs docs/diagrams/<앱>     # 누락 0 · 중복 0 · 없는 경로 0
node scripts/check-diagrams.mjs                          # 새 장이 ✅ 최신
```

- `validate` 가 9개 중 일부만 나오면 기본 검증이지 합격이 아니다
- `DRILL` 에 쓴 노드 id 가 JSON 에 실제로 있는지 확인한다(없으면 버튼이 안 뜰 뿐 오류는 안 난다)
- 줄 번호를 단 source 는 `sed -n '<줄>p'` 로 그 줄을 찍어 문장과 맞춰 본다

## 7. 목록 · 문서 반영 (헤르메스)

- 새 번들: `scripts/build-diagram-index.mjs` 의 해당 서비스 카드에 `extra: [{ file, label }]` → `node scripts/build-diagram-index.mjs`
- 새 서비스·타입: 같은 파일의 `GROUPS`/`TYPES`, 그리고 `README.md` 표
- 그리다 찾은 지식 문서 차이: 코드로 다시 확인한 것만 `docs/knowledge/**` 에 반영
- 서비스 가이드(`guides/<서비스>.md`)의 "지금 있는 장"·"탭 구성" 을 갱신

## 8. 유지 — 운영 코드가 바뀌면

`/sync` 3.5단계가 `check-diagrams.mjs` 로 잡는다.

- 🟡 커밋만 뒤처짐 → `node scripts/check-diagrams.mjs --repin` 후 validate·deliver·번들 재생성
- ❌ 어긋남 → 코드를 읽고 JSON 을 고친다. 경로 개명이면 sources 와 문구의 옛 경로를 같이 바꾼다
- 화면이 늘거나 줄었으면 `diagram-coverage.mjs` 가 누락·없는 경로로 알려준다 → 해당 도메인 탭에 노드를 더하거나 뺀다

## 9. 에이전트에게 맡길 때 · 보고 형식

한 앱 = 에이전트 하나. 서로 다른 `docs/diagrams/<앱>/` 에만 쓰므로 병렬로 돌려도 된다. 지시에는 이 문서와 서비스 가이드 경로, 체크아웃 경로·SHA, "폴더 밖 수정 금지·커밋 금지" 를 넣는다.

보고는 이 순서로 받는다.

1. 만든 파일
2. 탭 구성 (탭 · 화면 수 · 노드/연결 수)
3. `diagram-coverage.mjs` 출력 그대로
4. 장별 validate 결과
5. 지식 문서와 코드가 다른 점 (파일:줄)
6. 확인 필요

## 10. 서비스 가이드 쓰는 법

`guides/<서비스>.md` 는 아래 절을 이 순서로 둔다. 모르는 칸은 비우지 말고 "확인 필요" 로 쓴다.

1. **기준** — 레포 · 앱 루트 · 기준 ref · 라우터 · 화면 수(세는 명령과 함께)
2. **지금 있는 장** — 파일 · 고정 커밋 · 무엇을 그렸나
3. **심층 탭 구성** — 탭 · 도메인 경계(경로 접두사) · 화면 수. 아직 없으면 "제안" 으로
4. **탭 0 에 들어갈 실제 파일** — 진입 · 셸/Provider · 가드 · 관문 · 외부의 경로
5. **이 서비스만의 주의** — 라우터·그룹·동적 URL·생성물·이름 규칙 등 그릴 때 틀리기 쉬운 것
6. **바뀌면 손볼 곳** — 새 라우트 그룹·도메인이 생기면 어느 탭에 넣나
7. **읽을 지식 문서** — `docs/knowledge/<레포>/…` 경로
