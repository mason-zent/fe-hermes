# 검증 표준

에이전트와 reviewer는 **같은 스크립트**를 돌리고 그 출력 표를 보고서의 "검증 결과"에 그대로 붙인다.

| 레포 | 명령 |
|---|---|
| client-brics-refund | `scripts/verify/client-brics-refund.sh` |
| client-brics-hub | `scripts/verify/client-brics-hub.sh` |
| client-brics-care | `scripts/verify/client-brics-care.sh` |
| web-op | `scripts/verify/web-op.sh` |
| bznav-web | `scripts/verify/bznav-web.sh <앱|packages/<pkg>>` |
| zent-packages | `scripts/verify/zent-packages.sh <패키지명...>` |
| bznav-rn-app | `scripts/verify/bznav-rn-app.sh` |

## 실행 전 확인
- **워크트리 대상**: 스크립트는 기본으로 메인 체크아웃(`repos/<레포>`)을 검증한다. 워크트리를 검증하려면 `HERMES_VERIFY_DIR=<워크트리> scripts/verify/<레포>.sh`. `delegate.sh <에이전트> --cwd <워크트리>`로 띄운 pane(reviewer 포함)은 이 값이 이미 들어 있다. 다른 레포의 워크트리를 가리키면 (일반 모드) 경고를 내고 메인 체크아웃을 검증하므로, 여러 레포를 리뷰할 때는 호출마다 붙인다. 결과 표 제목의 브랜치로 어느 트리를 검증했는지 확인한다
- **Node 버전**: 레포 `.nvmrc`와 현재 `node -v`가 같아야 한다. 스크립트가 다르면 경고 단계로 표시한다. 맞추는 법은 `nvm use <버전>`. 값은 각 레포 `.nvmrc`(지문 `.sync/snapshots/<레포>.json` 의 `nvmrc`). `.nvmrc` 가 없으면(web-op) 검사가 조용히 생략된다
- **작업 base 최신 여부**: 작업 브랜치가 `origin/<prBase>` 보다 뒤처졌으면(`git log --oneline HEAD..origin/<prBase>`) 검증 실패가 내 변경 때문이 아닐 수 있다. 반영이 필요하면 사용자에게 묻는다. 메인 체크아웃을 pull 하지 않는다
- **생성물**: Orval(`__generated__/`)·Relay 아티팩트가 없으면 타입 검사가 실패하거나 건너뛴다. 스크립트가 유무를 확인해 이유를 표시한다

## 결과 해석
| 표시 | 뜻 |
|---|---|
| ✅ 통과 | 그대로 보고 |
| ❌ 실패 | 마지막 40줄 로그가 함께 출력된다. **내 변경 때문인지 환경 때문인지 구분해서** 보고 |
| ⏭ 건너뜀 | 이유가 함께 표시된다. "통과"라고 쓰지 말고 건너뛴 사실과 이유를 그대로 보고 |

**엄격 모드**(`HERMES_VERIFY_STRICT=1`, `scripts/commit.sh` 가 켠다 — 커밋 전 검증): 건너뜀(⏭)도 ❌ 실패로 친다. 허용은 사용자 확인 후 `commit.sh --allow-skip "<단계 이름>"`(= `HERMES_VERIFY_ALLOW_SKIP`)으로만. `HERMES_VERIFY_DIR` 가 그 레포의 워크트리가 아니면 메인 체크아웃으로 돌지 않고 exit 2 로 멈춘다.

## QA 시뮬레이션 (영향 화면 실제 브라우저 검사 — 파일럿: bznav refund-web)

화면 목록(`impact.mjs`)은 Pages Router(`pages/**`)와 App Router(`app/**/page.tsx` — 라우트 그룹 `(x)` 는 주소에서 빼고, `layout`·`loading`·`error` 등이 바뀌면 그 폴더 아래 화면 전부, 로그인 표시는 화면과 감싸는 layout 의 `…AuthGuard`)를 둘 다 읽는다. 실제로 돌리려면 앱마다 `scripts/qa/routes/<앱>.json` 이 있어야 한다(현황판 [전체 검수] 앱 목록도 이 파일 기준).
검증 스크립트(lint·타입·테스트)와 별개다. **화면을 URL 로 바로 여는 스모크**라 흐름(본인인증 끝까지 등)은 보지 않는다(2차 — 계획서 D10). 바꾼 파일에서 import 를 거꾸로 따라가 **영향받는 화면을 전부** 찾고, 작업 워크트리와 기준(`origin/<prBase>` merge-base) dev 서버를 함께 띄워 Playwright 로 화면마다 연다(데스크톱·모바일). 계획서 `plans/feature/20261002-QA-시뮬레이션-영향-화면.md`.

```bash
node scripts/qa/impact.mjs --cwd <워크트리> --app refund-web          # 영향 화면만 본다 (빠름, 서버 안 띄움)
node scripts/qa/run.mjs --cwd <워크트리> --app refund-web --plan <계획서> # 실제 실행 → 계획서 Checkpoint 에 "- QA result:" 한 줄
node scripts/qa/login.mjs --url http://localhost:3291                  # 로그인 세션 저장 (한 번, 사용자가 직접 **이메일** 로그인)
node scripts/qa/run.mjs … --headed [--slow 1200]                         # 보이는 창으로 — 창 하나에서 화면 이동 · 진행 띠 · 천천히 스크롤
node scripts/qa/history.mjs [--open [런 id]] [--plan <계획서>]          # QA 이력 (.qa-runs/index.html · 런마다 report.html)
# 현황판(/board) [QA] 탭 — 같은 이력을 실시간으로. 계획서 카드 [QA 실행] 으로도 돌린다(한 번에 하나)
```

TC 목록은 `docs/qa/tc/<앱>.md`(현황판 QA 탭 [TC 목록]이 읽는다). 쓰거나 다시 맞추는 것은 `/qa-tc <앱> [#<PR>]` — 그 앱 담당 에이전트가 코드를 읽어 갱신하고, 씬으로 옮길 TC 는 `scripts/qa/scenarios/<앱>/_draft/` 에 초안(검수 런은 읽지 않는다). 변경분 모드(`/qa-tc <앱> <브랜치>`)는 `.qa-runs/tc-picks/<앱>@<브랜치>.json` 을 남기고, 그 브랜치의 영향 QA 가 이를 읽어 TC 에 걸린 씬을 돌리고 나머지를 "사람이 확인" 으로 보여 준다(`--tc-picks <파일>` 로 직접 줄 수도 있다). 말로는 "이 브랜치 QA 돌려줘" — 헤르메스가 둘을 차례로 돌린다.

**전체 검수**(요청할 때만 — 정기 자동 실행 없음): 코드 diff 에 안 보이는 깨짐(API 응답·CMS·공통 패키지·환경)을 서비스 전체로 본다. 영향 QA 와 달리 기준 서버 대신 **승인한 기준 사진**(`.qa-baselines/<앱>/<프로필>/`, git 무시)과 비교한다.
```bash
node scripts/qa/run.mjs --suite --app refund-web [--profile login] [--headed]   # 최신 origin/<prBase>(qa-base) · 화면 전부 + 흐름 씬
node scripts/qa/approve.mjs <런 id> [--key <화면>]                              # 결과를 기준 사진으로 승인 (현황판 QA 탭 [기준으로 승인])
```
- 판정 추가: 🆕 기준 없음(처음 검수 — 승인하면 다음부터 기준) · 🙋 사람 필요(흐름 씬의 사람 단계 — `--headed` 로 돌리면 창에서 진행). 실패·이동 화면은 전체 승인에 올리지 않는다(콕 집으면 올림). 승인할 때 그 화면의 문제 목록도 함께 저장해 다음 검수에서 "알려진 문제"로 뺀다
- **흐름 씬** `scripts/qa/scenarios/<앱>/*.json` — 단계(`goto`·`expectUrl`·`expectText`·`click`·`fill`·`mock`(응답 흉내)·`human`(사람 단계)·`wait`·`screenshot`), 형식은 `scripts/qa/scenario.mjs` 머리말. 비밀 값(비밀번호 등)은 씬에 적지 않는다. refund-web 은 로그인 가드 · 본인인증 가드 · 본인인증 성공/실패(응답 흉내) · 실제 본인인증(사람) 5개
- 요청: 대화("환급 웹 전체 검수 돌려줘") 또는 현황판 QA 탭 [전체 검수 시작]. 화면 전부라 수십 분 걸릴 수 있고(추측) `heavy.sh` 차례를 기다린다
- **실행 전에 고른다(D21)** — 대화로 요청받으면 대상·진행 방식을 먼저 묻는다
  - 대상: 🖥 로컬 서버(내 브랜치·qa-base 코드, 이메일 로그인) · ☁️ 서버 `--server <주소>`(dev·stg·dev-1~3·PR 미리보기 — 배포본, 간편인증 가능. **운영 주소는 거부**). 세션은 `.qa-auth/<앱>@<호스트>.<프로필>.json`, 기준 사진은 `.qa-baselines/<앱>@server/`
  - 진행 방식: `--flow` 🧭 비로그인 → (세션이 없거나 만료면 라이브 화면이 로그인 요청 + 로그인 창) → 로그인 상태 전부 차례로(routes profiles 순서 — 예: login → verified, `flowTargets` 로 고를 수 있다. 단계마다 세션이 없거나 만료면 로그인 창, 안 하면 그 단계만 건너뜀) → 끝나면 실패 리포트 모달(D18~D20). 단계마다 그 세션의 씬만 돈다 · `--profiles a,b` 동시 · 한 세션만 `--profile`
- **라이브 화면** `--live` → 현황판 `/qa-live?id=<런>` (흐름·동시는 `?group=<묶음>`): 체크리스트(화면·씬, 누르면 검사 단계·스크린샷·호출 팝업) · 화면 영상(데스크톱·모바일) · 실시간 호출(GraphQL 보낸 값·errors·REST·Mixpanel, 태그로 거르기) · 제목 옆 완료 여부 · 실패 리포트(원인별 묶음, [자세히] 펼침, [담당 에이전트에게 조사 맡기기])
- **검사 단계**(화면마다): 열기 · 도착 경로 · 콘솔·페이지 에러(📍 앱 소스 위치) · API 응답 · 이미지(img·CSS 배경·CDN·지연 로딩) · 눈으로 보이는 깨짐(CSS 미적용·아이콘 □·가로 넘침·깨진 글자·값) · 스크린샷 비교 · 트래킹(필수 화면 보기 이벤트 `<PageViewEventLogger pageName>` 누락은 ❌). 잘린 글자·가려진·화면 밖·이름 없는 버튼·찌그러진·흐린 이미지·alt 는 ⚠ 확인 필요(실패 아님)
- **안전장치**: 흉내로 지정하지 않은 GraphQL mutation 은 보내지 않는다(막음) · Mixpanel 은 가로채 기록만(전송 안 함) · 외부 수집기(GA·광고·Clarity·Datadog RUM·픽셀)는 막는다 · 검사 중 로그인 토큰이 사라지면 멈추고 로그인을 요청한 뒤 그 화면부터 다시
- 씬 단계 추가: `mock` 의 `operation`(GraphQL 연산 이름) · `expectEvent`(Mixpanel 이벤트·props) · 씬 `viewports`(없으면 데스크톱·모바일 둘 다 동시에)
- routes 설정 추가: `devUrl` · `samplesFrom: "sitemap"`(CMS 동적 화면 주소를 그 서버 `/sitemap.xml` 에서) · `expect`(프로필별 정상 이동) · `allowStatus` · `networkIdle: false` · 화면별 `ignoreConsole`

**세션 프로필**(`routes/<앱>.json` `profiles`, `run.mjs --profile`): `logout`(로그인 화면은 로그인으로 가야 정상) · `login`(이메일 로그인·본인인증 전 — 본인인증 화면으로 가야 정상) · `verified`(본인인증까지 — 머물러야 정상). 기대와 다르게 가면 ❌. 기본은 세션이 저장된 첫 프로필. 세션 파일 `.qa-auth/<앱>.<프로필>.json`
- ⚠️ **로컬 서버에서는 간편로그인(네이버·카카오)으로 세션이 안 생긴다** — SSO 가 localhost 로 돌려보내지 않고 운영 도메인(refund.bznav.com)으로 보낸다(2026-10-02 확인). 이메일 로그인을 쓴다. 서버 대상(`--server`)에서는 간편로그인도 된다(2026-10-06 dev 카카오 확인 — 토큰 쿠키가 생긴 뒤에만 저장)
- 본인인증까지 마친 세션: `login.mjs --profile verified --from login --path /auth/ci-request`

| 판정 | 뜻 |
|---|---|
| ✅ 통과 | 열림 · 새 에러 없음 · 기준 화면과 같음 |
| ☑️ 기대대로 이동 | 세션 프로필의 기대대로 가드가 보냈다(예: 본인인증 전 → `/auth/ci-request`) |
| 🟡 변화 | 기준 화면과 픽셀이 다르다 — 의도한 변경인지 **사람이 본다**(실패 아님) |
| ❌ 실패 | 기준 화면에 없던 콘솔 에러·페이지 에러·우리 요청 4xx/5xx·깨진 이미지·시간 초과 |
| ↪️ 이동됨 | 바로 열면 다른 화면으로 넘어가는 단계형 화면 — 단독 진입 불가(실패로 세지 않음). 진입 경로는 `scripts/qa/routes/<앱>.json` 의 `entry` |
| 🔒 로그인 필요 | 로그인 화면으로 넘어갔다 — 세션이 없거나 만료. `login.mjs` 를 다시 |
| 🪪 본인인증 필요 | 본인인증 화면으로 넘어갔다(기대가 없는 화면) — 본인인증 전 계정 |
| 📝 샘플 필요 | 동적 라우트인데 열 URL 이 없다 — `routes/<앱>.json` 의 `samples` 에 적는다 |

- 영향 분석은 **넓게 잡는다**: 패키지 진입점(`index.ts` barrel)을 거치면 그 패키지를 쓰는 화면이 모두 잡힌다(예: `@repo/user-session` 의 `AuthGuard` 하나 → 102개). `_app`·`next.config`·`proxy.ts`·루트 `package.json`·lock 은 화면 전부
- 산출물은 `.qa-runs/<런 id>/`(git 무시 · 지우지 않고 쌓인다), 세션은 `.qa-auth/`(git 무시·권한 600 — 쿠키 값을 출력하지 않는다). 기준 서버용 워크트리 `.worktrees/bznav-web/qa-base` 는 재사용한다
- 포트: 작업 3291 · 기준 3292. 첫 실행은 `pnpm install`·webpack 첫 컴파일로 느리다
- 기준 화면에도 있던 에러는 이번 변경 탓이 아니라 실패로 세지 않는다(`baseProblems` 로 개수만 남긴다)

## 알려진 환경 이슈 (코드 문제가 아님)
- **canvas 네이티브 바이너리 없음** → bznav care-web `test:unit`이 전부 실패한다(jsdom이 canvas를 로드하다 죽는다). 스크립트가 감지해 건너뛴다. 고치는 법:
  ```bash
  cd <검증 대상 트리>/node_modules/.pnpm/canvas@2.11.2/node_modules/canvas   # 메인이면 repos/bznav-web, 워크트리면 그 경로
  npx node-gyp rebuild        # cairo·pango·librsvg 등은 brew 로 이미 설치돼 있어야 한다
  ```
  `pnpm rebuild canvas`는 전이 의존성이라 아무 일도 하지 않으니 위 경로에서 직접 빌드한다. 빌드 후 `build/Release/canvas.node`가 생기면 성공이다 (2026-09-16 확인, 테스트 78개 통과)
- **zent-packages의 brics FE 3종**(`brics-fe-ui`, `zent-auth`, `datadog-trace`)은 eslint 프리셋이 빈 파일이라 CI도 lint를 제외한다. 스크립트도 건너뛰고 prettier만 맞춘다. 엄격 모드(커밋)에선 사용자 확인 후 `--allow-skip "pnpm lint --filter=<패키지>"`
- **zent-packages `changeset 존재` 단계는 작업 트리의 미커밋 `.changeset/*.md` 만 본다.** changeset 을 앞 커밋에 넣었으면 다음 검증부터 ⏭(엄격 모드 ❌)가 된다. CI(`changeset-check`)는 브랜치 diff 로 보므로 실제 머지에는 문제가 없다 — 그 사실을 확인하고 사용자 확인 후 `--allow-skip "changeset 존재"`
- **bznav-rn-app `yarn eslint src`** 는 레포 `eslint.config.js` 설정 오류(`@typescript-eslint` 플러그인 미등록)로 실행되지 않아 스크립트가 ⏭ 로 바꾼다. 엄격 모드(커밋)에선 사용자 확인 후 `--allow-skip "yarn eslint src"`
- **web-op은 `pnpm build`가 타입 에러를 무시**한다(`ignoreBuildErrors: true`). 반드시 `typecheck`를 따로 본다
