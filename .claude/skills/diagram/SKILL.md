---
name: diagram
description: 담당 서비스의 다이어그램(구조 · 화면 맵 · 요청 흐름, 비즈넵 웹 5개와 모바일 앱은 심층 번들까지)을 운영 기준 브랜치 코드로 다시 그리고 검증한 뒤 목록을 갱신합니다. 그리다 찾은 문제는 issues/ 에 등록합니다. 서비스를 안 주면 전체 서비스를 돌립니다.
argument-hint: "(선택) 서비스 이름 일부 — 예: brand, rn-app, hub. 비우면 전체. '점검' 을 붙이면 다시 그리지 않고 근거만 점검"
---

# 다이어그램 다시 그리기

대상: $ARGUMENTS (비어 있으면 **전체 서비스**)

다이어그램 원칙·표준·검증은 **`docs/diagrams/AUTHORING.md`** 가 정본이고, 서비스마다 **`docs/diagrams/guides/<서비스>.md`** 가 있다. 이 스킬은 그 절차를 한 번에 돌리는 순서표다. 헤르메스는 **직접 그리지 않고** 서비스마다 작업자 하나에 맡긴 뒤 결과를 검증한다(문서 작업이라 FE 에이전트가 아니라 일반 작업자).

## 서비스 표

| 서비스 | 레포 (`repos/…`) | 기준 ref | 가이드 | 심층 폴더 |
|---|---|---|---|---|
| client-brics-refund | client-brics-refund | `origin/prd` | `guides/client-brics-refund.md` | — |
| client-brics-hub | client-brics-hub | `origin/prd` | `guides/client-brics-hub.md` | — |
| client-brics-care | client-brics-care | `origin/prd` | `guides/client-brics-care.md` | — |
| web-op | web-op | `origin/prd` | `guides/web-op.md` | — |
| bznav-refund-web | bznav-web | `origin/prd-refund` | `guides/bznav-refund-web.md` | `refund-web/` |
| bznav-care-web | bznav-web | `origin/prd-care` | `guides/bznav-care-web.md` | `care-web/` |
| bznav-brand-web | bznav-web | `origin/prd-brand` | `guides/bznav-brand-web.md` | `brand-web/` |
| bznav-sena-web | bznav-web | `origin/prd-sena` | `guides/bznav-sena-web.md` | `sena-web/` |
| bznav-plus-web | bznav-web | `origin/prd-plus` | `guides/bznav-plus-web.md` | `plus-web/` |
| bznav-rn-app | bznav-rn-app | `origin/prd` | `guides/bznav-rn-app.md` | `rn-app/` |

기준 ref 의 정본은 `hermes.config.json`(`branch`, bznav 는 앱별). 표와 다르면 config 를 따르고 이 표를 고친다.

## 0. 대상 고르기 · 계획서
- 인자가 있으면 표에서 이름 일부로 찾는다(여러 개 가능). 없으면 10개 전부. 못 찾으면 표를 보여 주고 묻는다
- 인자에 `점검` 이 있으면 **1·6단계만**(다시 그리지 않음)
- 경량 계획서를 만든다: `node scripts/new-plan.mjs --agent hermes --summary "다이어그램 다시 그리기 — <대상>"`
- 대상·예상 작업자 수를 사용자에게 한 줄로 알린다. 전체면 작업자 10개(5개씩 두 번)라 오래 걸린다는 것도 알린다

## 1. 지금 상태 점검
```bash
node scripts/check-diagrams.mjs
```
- 대상 서비스 장의 결과(✅ 최신 / 🟡 커밋만 뒤처짐 / ❌ 어긋남)를 표로 남긴다
- `점검` 모드면: 🟡 은 `node scripts/check-diagrams.mjs --repin` → HTML·번들 재생성(아래 5단계 명령), ❌ 은 보고만 하고 끝낸다

## 2. 준비 (헤르메스)
- archify 가 스크래치패드에 없으면 `AUTHORING.md` 3절대로 clone 한다(레포에 넣지 않는다)
- 대상마다 기준 ref 를 **스크래치패드 아래** detached 체크아웃한다. fetch 는 비대화식으로(`GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -o BatchMode=yes"`, 실패하면 `-c url.https://github.com/.insteadOf=git@github.com:`)
  ```bash
  git -C repos/<레포> fetch origin <ref>
  git -C repos/<레포> worktree add --detach <스크래치>/co/<서비스> origin/<ref>
  git -C <스크래치>/co/<서비스> rev-parse HEAD     # 고정할 40자 SHA
  ```
- `repos/*` 메인 체크아웃과 `hermes/.worktrees/` 는 쓰지 않는다

## 3. 작업자 디스패치
- **한 서비스 = 작업자 하나**(Agent 도구, `general-purpose`, 백그라운드). 서로 다른 파일만 쓰므로 병렬. **한 번에 최대 5개**, 전체면 콘솔 4 + rn-app 한 묶음 → 비즈넵 웹 5 한 묶음
- 띄우기 전에 `scripts/monitor-pane.sh` 로 모니터를 메인 탭에 띄운다(이미 있으면 재사용). 따로 탭을 만들지 않는다
- 지시에 넣을 것(`AUTHORING.md` 9절):
  - `docs/diagrams/AUTHORING.md` → `docs/diagrams/guides/<서비스>.md` → `docs/knowledge/<레포>/gotchas.md` 순서로 읽는다
  - 코드는 체크아웃 경로에서만, `meta.repository.revision` 은 위 SHA
  - 그릴 것: 기본 3장(`<서비스>.architecture.json` · `.domains.architecture.json` · `.sequence.json` → 각 html). 심층 폴더가 있으면 그 번들 전체(탭 JSON · `build-bundle.py` · 화면 전수 대조). 기존 장이 있으면 **새로 만들지 말고 현재 코드에 맞게 고친다**
  - 쓰는 곳: `docs/diagrams/<서비스>.*`, 심층 폴더, `docs/diagrams/guides/<서비스>.md`("지금 있는 장"·"탭 구성" 갱신) **만**. index·build-diagram-index·knowledge·issues 는 헤르메스가 한다
  - deliver 의 html 경로는 **반드시 `docs/diagrams/...` 전체 경로**로 준다(파일명만 주면 hermes 루트에 생긴다)
  - 긴 JSON 은 탭별로 나눠 쓰고, 한 장이 끝날 때마다 파일로 저장한다(스트림이 끊겨도 남게)
  - 레포 코드 수정·커밋 금지, `.env*`·키·토큰 값 출력 금지
  - 보고 형식: `AUTHORING.md` 9절 1~6 + **7. 그리다 찾은 코드 문제**(버그·보안·죽은 코드 — 파일:줄, 심각도 추정)
- 작업자가 10분 넘게 멈추면(watchdog) 같은 작업자에게 SendMessage 로 "이미 만든 장은 두고 남은 것만" 이어서 시킨다

## 4. 검증 (헤르메스 — 작업자 보고를 그대로 믿지 않는다)
서비스마다:
```bash
node $A/bin/archify.mjs validate architecture <json> --quality showcase --repo-root <체크아웃> --json   # ok:true · 9/9
node $A/bin/archify.mjs validate sequence <json> --quality showcase --json                           # sequence 는 --repo-root 없이
node scripts/diagram-coverage.mjs docs/diagrams/<심층 폴더>     # App/Pages Router 앱만. rn-app 은 작업자의 대조 출력 확인
node scripts/check-diagrams.mjs                                 # 대상 장이 ✅ 최신
ls *.architecture.html 2>/dev/null                              # hermes 루트에 잘못 생긴 html 이 없어야 한다
```
- 하나라도 실패면 해당 작업자에게 다시 시킨다. 통과하지 못한 장은 커밋하지 않는다
- 줄 번호가 달린 근거 몇 개를 `sed -n '<줄>p'` 로 찍어 문장과 대조한다(표본)

## 5. 목록 · 문서 반영 (헤르메스)
- 심층 번들 라벨(화면 수 등)이 바뀌었으면 `scripts/build-diagram-index.mjs` 의 카드 `extra` 를 고친다 → `node scripts/build-diagram-index.mjs`
- 🟡 repin 만 한 장: 해당 JSON 들을 deliver 로 다시 만들고(html 경로 전체로) 번들이면 `python3 docs/diagrams/<폴더>/build-bundle.py`
- 작업자가 보고한 **지식 문서와 코드의 차이**: 코드로 다시 확인한 것만 `docs/knowledge/**` 에 반영한다
- **그리다 찾은 코드 문제**: 코드로 확인한 뒤 `issues/<YYYYMMDD>-<레포>-<제목>.md` 로 등록한다(`issues/README.md` 형식, `source: diagram <날짜>`, `kind: code`). 이미 같은 이슈가 있으면(`issues/`·`issues/archive/`·`.board-trash/`) 새로 만들지 않고 알린다. 값(키·토큰)은 옮기지 않는다

## 6. 정리 · 보고
- 임시 체크아웃을 전부 지운다: `git -C repos/<레포> worktree remove --force <스크래치>/co/<서비스>`
- 계획서 Checkpoint 를 채운다(Status `ready_for_review`, Progress, Validation 에 서비스별 validate·coverage 결과)
- 보고: 서비스별 표(장 · 고정 커밋 · validate · 화면 전수 · 바뀐 점), 반영한 지식 문서, **등록한 이슈**, 확인 필요. 커밋·push 는 사용자에게 묻는다

## 주의
- 요청 흐름(sequence)은 대표 화면 하나만 — 가이드에 적힌 대표 화면을 바꾸지 않는다(바꿔야 하면 보고)
- 전체 실행은 토큰을 많이 쓴다. 대부분 ✅ 이고 변경만 따라가려면 `/diagram 점검` 이나 `/sync`(3.5단계) 로 충분하다
