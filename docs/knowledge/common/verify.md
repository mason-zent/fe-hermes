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
검증 스크립트(lint·타입·테스트)와 별개다. **화면을 URL 로 바로 여는 스모크**라 흐름(본인인증 끝까지 등)은 보지 않는다(2차 — 계획서 D10). 바꾼 파일에서 import 를 거꾸로 따라가 **영향받는 화면을 전부** 찾고, 작업 워크트리와 기준(`origin/<prBase>` merge-base) dev 서버를 함께 띄워 Playwright 로 화면마다 연다(데스크톱·모바일). 계획서 `plans/feature/20261002-QA-시뮬레이션-영향-화면.md`.

```bash
node scripts/qa/impact.mjs --cwd <워크트리> --app refund-web          # 영향 화면만 본다 (빠름, 서버 안 띄움)
node scripts/qa/run.mjs --cwd <워크트리> --app refund-web --plan <계획서> # 실제 실행 → 계획서 Checkpoint 에 "- QA result:" 한 줄
node scripts/qa/login.mjs --url http://localhost:3291                  # 로그인 세션 저장 (한 번, 사용자가 직접 **이메일** 로그인)
node scripts/qa/run.mjs … --headed [--slow 1200]                         # 보이는 창으로 — 창 하나에서 화면 이동 · 진행 띠 · 천천히 스크롤
node scripts/qa/history.mjs [--open [런 id]] [--plan <계획서>]          # QA 이력 (.qa-runs/index.html · 런마다 report.html)
```

**세션 프로필**(`routes/<앱>.json` `profiles`, `run.mjs --profile`): `logout`(로그인 화면은 로그인으로 가야 정상) · `login`(이메일 로그인·본인인증 전 — 본인인증 화면으로 가야 정상) · `verified`(본인인증까지 — 머물러야 정상). 기대와 다르게 가면 ❌. 기본은 세션이 저장된 첫 프로필. 세션 파일 `.qa-auth/<앱>.<프로필>.json`
- ⚠️ **간편로그인(네이버·카카오)으로는 세션이 안 생긴다** — SSO 가 localhost 로 돌려보내지 않고 운영 도메인(refund.bznav.com)으로 보낸다(2026-10-02 확인). 이메일 로그인을 쓴다
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
