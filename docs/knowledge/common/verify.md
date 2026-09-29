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

## 알려진 환경 이슈 (코드 문제가 아님)
- **canvas 네이티브 바이너리 없음** → bznav care-web `test:unit`이 전부 실패한다(jsdom이 canvas를 로드하다 죽는다). 스크립트가 감지해 건너뛴다. 고치는 법:
  ```bash
  cd <검증 대상 트리>/node_modules/.pnpm/canvas@2.11.2/node_modules/canvas   # 메인이면 repos/bznav-web, 워크트리면 그 경로
  npx node-gyp rebuild        # cairo·pango·librsvg 등은 brew 로 이미 설치돼 있어야 한다
  ```
  `pnpm rebuild canvas`는 전이 의존성이라 아무 일도 하지 않으니 위 경로에서 직접 빌드한다. 빌드 후 `build/Release/canvas.node`가 생기면 성공이다 (2026-09-16 확인, 테스트 78개 통과)
- **zent-packages의 brics FE 3종**(`brics-fe-ui`, `zent-auth`, `datadog-trace`)은 eslint 프리셋이 빈 파일이라 CI도 lint를 제외한다. 스크립트도 건너뛰고 prettier만 맞춘다. 엄격 모드(커밋)에선 사용자 확인 후 `--allow-skip "pnpm lint --filter=<패키지>"`
- **zent-packages `changeset 존재` 단계는 작업 트리의 미커밋 `.changeset/*.md` 만 본다.** changeset 을 앞 커밋에 넣었으면 다음 검증부터 ⏭(엄격 모드 ❌)가 된다. CI(`changeset-check`)는 브랜치 diff 로 보므로 실제 머지에는 문제가 없다 — 그 사실을 확인하고 사용자 확인 후 `--allow-skip "changeset 존재"`
- **bznav-rn-app `yarn expo lint`** 는 레포 `eslint.config.js` 설정 오류(`@typescript-eslint` 플러그인 미등록)로 실행되지 않아 스크립트가 ⏭ 로 바꾼다. 엄격 모드(커밋)에선 사용자 확인 후 `--allow-skip "yarn expo lint"`
- **web-op은 `pnpm build`가 타입 에러를 무시**한다(`ignoreBuildErrors: true`). 반드시 `typecheck`를 따로 본다
