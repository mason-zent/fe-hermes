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
- **canvas 네이티브 모듈 미빌드** → bznav care-web `test:unit`이 전부 실패한다. `pnpm rebuild canvas` 또는 cairo/pango 설치 필요. 스크립트가 감지해 건너뛴다
- **zent-packages의 brics FE 3종**(`brics-fe-ui`, `zent-auth`, `datadog-trace`)은 eslint 프리셋이 빈 파일이라 CI도 lint를 제외한다. 스크립트도 건너뛰고 prettier만 맞춘다
- **web-op은 `pnpm build`가 타입 에러를 무시**한다(`ignoreBuildErrors: true`). 반드시 `typecheck`를 따로 본다
