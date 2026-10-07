---
name: qa-tc
description: 비즈넵 웹 앱의 QA TC 목록(docs/qa/tc/<앱>.md)을 그 앱 담당 에이전트가 레포 코드를 읽어 새로 쓰거나 갱신합니다. 앱 전체를 다시 훑거나, 브랜치·PR 변경분 때문에 바뀌어야 할 TC 만 뽑습니다. 자동화할 수 있는 TC 는 흐름 씬 초안(_draft)도 같이 만듭니다.
argument-hint: "<앱> [전체 | <브랜치> | #<PR번호>] — 예: refund-web · sena-web #1234"
---

# QA TC 작성 · 갱신

인자: $ARGUMENTS

**헤르메스는 띄우기만 한다.** 코드를 읽고 TC 를 쓰는 것은 그 앱 담당 에이전트가 pane 에서 한다(그 레포 지식·gotchas 를 이미 아는 쪽이 쓴다).

## 대상

| 앱 | 에이전트 | TC 문서 | ID 접두 |
|---|---|---|---|
| refund-web | `bznav-refund-fe` | `docs/qa/tc/refund-web.md` | RF- |
| care-web | `bznav-care-fe` | `docs/qa/tc/care-web.md` | CR- |
| brand-web | `bznav-brand-fe` | `docs/qa/tc/brand-web.md` | BR- |
| sena-web | `bznav-sena-fe` | `docs/qa/tc/sena-web.md` | SN- |
| plus-web | `bznav-plus-fe` | `docs/qa/tc/plus-web.md` | PL- |

표에 없는 앱이면 띄우지 않고 위 목록을 보여 주며 묻는다. 앱이 빠졌으면 묻는다.

## 모드
- **전체**(기본) — 앱 전체를 다시 훑어 기존 TC 문서와 맞춘다. 빠진 화면·TC 추가, 코드와 달라진 TC 수정, 없어진 화면의 TC 는 지우지 않고 `폐기 후보` 로 표시
- **변경분**(`<브랜치>` 또는 `#<PR번호>`) — `git diff origin/<prBase>...<브랜치>`(PR 이면 `gh pr view <번호> --json headRefName` 으로 브랜치를 찾는다) 에서 그 앱 경로·영향 받는 `packages/**` 만 보고, **이 변경 때문에 새로 필요하거나 바뀌어야 할 TC** 만 다룬다. 결과 끝에 "이 PR 머지 전에 돌릴 TC" 목록(ID)을 붙이고, 같은 목록을 **`.qa-runs/tc-picks/<앱>@<브랜치>.json`**(브랜치의 `/` 등은 `-` 로)에도 쓴다 — 영향 QA(`run.mjs`)가 이 파일을 읽어 그 TC 의 씬을 돌리고 나머지는 "사람이 확인" 으로 보여 준다

## 동작 (헤르메스)
1. 인자를 앱·모드로 나눈다
2. 아래 지시를 실어 띄운다(한 번에 끝나는 조사라 프롬프트를 싣는다 · 레포는 읽기만 하므로 워크트리를 만들지 않는다):
   ```bash
   scripts/delegate.sh <에이전트> --plan new "QA TC <전체|변경분 브랜치> — <앱>" "<아래 '에이전트 지시' 를 앱·모드로 채운 것>"
   ```
3. pane id · 계획서 경로를 한 줄씩 알린다. 끝나면 pane 결과(바뀐 TC 요약)를 사용자에게 그대로 전한다. 현황판 QA 탭 [TC 목록] 은 새로고침하면 바로 반영된다

## 에이전트 지시 (프롬프트에 그대로 넣는다)

> 계획서: <경로> · 앱: <앱> · 모드: <전체 | 변경분 브랜치 X>
>
> **목표**: `docs/qa/tc/<앱>.md` 를 지금 코드에 맞게 쓰거나 갱신한다. 형식·용어는 `docs/qa/tc/README.md`("각 문서의 짜임"·"용어")와 기존 `<앱>.md` 를 그대로 따른다.
>
> **수정해도 되는 파일 (hermes 안 — 이 작업의 담당 범위 예외)**
> - `docs/qa/tc/<앱>.md`
> - `docs/qa/tc/README.md` 의 앱 요약 표 그 앱 행(화면·TC·P0 숫자)만
> - `scripts/qa/scenarios/<앱>/_draft/*.json` 새 파일 — 씬 초안. **`_draft/` 밖의 씬·`scripts/qa/routes/*.json` 은 고치지 않는다**(검수 런이 바로 읽는다). 고칠 게 보이면 보고에 적는다
> - (변경분 모드) `.qa-runs/tc-picks/<앱>@<브랜치>.json` — 형식 `{ "app", "branch", "head": "<짧은 sha>", "base": "origin/<prBase>", "createdAt", "tcs": [{ "id": "RF-012", "title": "…", "why": "<이 변경과의 관계 한 줄>", "session": "logout|login|verified" }] }`. 새로 만든 TC 도 넣는다
> - 레포(`repos/bznav-web`)는 **읽기만** 한다. 커밋·push 하지 않는다
>
> **절차**
> 1. `git -C repos/bznav-web status --short --branch` 와 `origin/<운영 브랜치>`(hermes.config.json `branch`) 대비 앞/뒤 커밋 수를 적는다. 전체 모드는 운영 브랜치 기준으로 읽는다(`git show origin/<branch>:<경로>` 또는 메인 체크아웃이 같으면 그대로). 문서 머리 `> 날짜 · 기준` 줄을 새 기준 커밋으로 고친다
> 2. 필수 지식: `docs/knowledge/bznav-web/rules.md` "필수" · `gotchas.md` · `<앱>/gotchas.md` · `<앱>/structure.md` 라우트 절
> 3. 화면 목록 — 라우트 파일(Pages `pages/**` · App `app/**/page.tsx`)을 전부 훑어 **A) 화면** 표를 맞춘다(로그인·본인인증 가드, 동적 샘플, 단계형, 근거 `파일:줄`). refund-web 은 `node scripts/qa/impact.mjs --app refund-web --events` 결과를 대조에 쓴다
> 4. **B) TC** — 기존 ID 는 유지하고 새 TC 는 마지막 번호 다음부터. 바뀐 TC 는 그 줄만 고친다. 근거는 코드 `파일:줄`. 버튼 문구는 코드 그대로. 확인 못 한 것은 `(추측)`
>    - 반드시 볼 것: 가드·리다이렉트 · 쿼리 검증(없거나 틀린 값) · 시간 분기 · 에러 화면 · 뷰포트 분기 · **필수 트래킹 이벤트**(`PageViewEventLogger`·`sendClickEvent` 등 — 이벤트 이름을 기대 결과에 적는다)
>    - **입력 경계값** — 입력이 있는 화면(폼·계산기·검색·인증 번호 등)은 코드의 검증 규칙(`maxLength`·zod/yup 스키마·정규식·`min`/`max`·자릿수 포맷)을 찾아 TC 를 만든다: 빈 값 · 공백만 · 최소/최대 길이 딱 그 값과 하나 넘김 · 허용 범위 끝값(0·음수·최대값) · 형식 틀림(문자 섞인 숫자·하이픈 유무·특수문자) · 붙여넣기. 기대 결과는 코드의 에러 문구·버튼 비활성 그대로. 검증 규칙이 코드에 없으면 TC 대신 "확인 못 한 것" 에 적는다
>    - **열기만 해도 부작용**(뮤테이션·알림 예약·실조회)이 있는 화면은 "누르면 안 되는 것" 절과 TC 사전 조건에 적는다
> 5. 자동화 칸 — `스모크 · 씬 · 응답 흉내 · 사람 단계 · 수동`. 씬으로 옮길 수 있는 P0·P1 은 `scripts/qa/scenarios/<앱>/_draft/NN-<제목>.json` 초안을 만든다. 형식은 `scripts/qa/scenario.mjs` 머리 주석과 기존 씬(`scenarios/refund-web/06-*.json` 등)을 따르고 `"tc": [...]` 로 연결, 되돌릴 수 없는 동작은 `mock` 없이 누르지 않는다
> 6. "확인 못 한 것·추측", "scripts/qa 반영 상태" 절도 맞춘다
>
> **보고** — ① 기준 ref ② 추가·수정·폐기 후보 TC ID 표(한 줄 이유) ③ 만든 씬 초안 ④ 러너·routes 에 고칠 것 ⑤ (변경분 모드) 머지 전에 돌릴 TC. 끝나면 계획서 Status `ready_for_review`.

## 브랜치 QA 와 함께 ("이 브랜치 QA 돌려줘")
헤르메스가 순서대로 한다.
1. `/qa-tc <앱> <브랜치>` 변경분 — pane 이 끝날 때까지 기다린다(tc-picks 파일이 생긴다)
2. `node scripts/qa/run.mjs --cwd <워크트리> --app <앱> [--plan <계획서>] --live` — 영향 화면 검사 뒤 그 TC 에 걸린 정식 씬을 돌린다. 라이브 화면 체크리스트·리포트 모달에 **"이 변경에서 확인할 TC"** 가 씬 결과 / 🙋 사람이 확인 으로 나온다
- tc-picks 를 만든 커밋과 지금 HEAD 가 다르면 런 로그에 ⚠️ 를 남긴다(그대로 진행). `_draft/` 씬은 돌지 않는다 — 그 TC 는 사람이 확인으로 남는다

## 씬 초안을 정식으로 올리기
- `_draft/` 는 검수 런이 읽지 않는다(`run.mjs` 는 `scenarios/<앱>/*.json` 만)
- 사용자가 원하면 헤르메스가 초안을 상위 폴더로 옮겨 `node scripts/qa/run.mjs --suite --app <앱> --scenarios <파일명 일부>` 로 그 씬만 돌린다. 실패하면 `_draft/` 로 되돌리고 실패 단계를 알린다
