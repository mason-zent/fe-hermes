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

## 실행 전 확인
- **워크트리 대상**: 스크립트는 기본으로 메인 체크아웃(`repos/<레포>`)을 검증한다. 워크트리를 검증하려면 `HERMES_VERIFY_DIR=<워크트리> scripts/verify/<레포>.sh`. `delegate.sh <에이전트> --cwd <워크트리>`로 띄운 pane(reviewer 포함)은 이 값이 이미 들어 있다. 다른 레포의 워크트리를 가리키면 경고를 내고 메인 체크아웃을 검증하므로, 여러 레포를 리뷰할 때는 호출마다 붙인다. 결과 표 제목의 브랜치로 어느 트리를 검증했는지 확인한다
- **Node 버전**: 레포 `.nvmrc`와 현재 `node -v`가 같아야 한다. 스크립트가 다르면 경고 단계로 표시한다. 맞추는 법은 `nvm use <버전>`
  - BRICS 콘솔(refund·hub·care)·zent-packages는 `v24.14.1`, bznav-web은 `v24.15.0`
- **로컬 트리 최신 여부**: `git status --short --branch`에 `behind`가 보이면 검증 실패가 내 변경 때문이 아닐 수 있다. 먼저 pull
- **생성물**: Orval(`__generated__/`)·Relay 아티팩트가 없으면 타입 검사가 실패하거나 건너뛴다. 스크립트가 유무를 확인해 이유를 표시한다

## 결과 해석
| 표시 | 뜻 |
|---|---|
| ✅ 통과 | 그대로 보고 |
| ❌ 실패 | 마지막 40줄 로그가 함께 출력된다. **내 변경 때문인지 환경 때문인지 구분해서** 보고 |
| ⏭ 건너뜀 | 이유가 함께 표시된다. "통과"라고 쓰지 말고 건너뛴 사실과 이유를 그대로 보고 |

## 알려진 환경 이슈 (코드 문제가 아님)
- **canvas 네이티브 바이너리 없음** → bznav care-web `test:unit`이 전부 실패한다(jsdom이 canvas를 로드하다 죽는다). 스크립트가 감지해 건너뛴다. 고치는 법:
  ```bash
  cd repos/bznav-web/node_modules/.pnpm/canvas@2.11.2/node_modules/canvas
  npx node-gyp rebuild        # cairo·pango·librsvg 등은 brew 로 이미 설치돼 있어야 한다
  ```
  `pnpm rebuild canvas`는 전이 의존성이라 아무 일도 하지 않으니 위 경로에서 직접 빌드한다. 빌드 후 `build/Release/canvas.node`가 생기면 성공이다 (2026-09-16 확인, 테스트 78개 통과)
- **zent-packages의 brics FE 3종**(`brics-fe-ui`, `zent-auth`, `datadog-trace`)은 eslint 프리셋이 빈 파일이라 CI도 lint를 제외한다. 스크립트도 건너뛰고 prettier만 맞춘다
- **web-op은 `pnpm build`가 타입 에러를 무시**한다(`ignoreBuildErrors: true`). 반드시 `typecheck`를 따로 본다
