# 지식 베이스 확장 인계 검증 — 2026-09-16

Claude가 완료한 8개 조사 결과와 작성 중이던 문서를 인계받아, 기존 hub를 포함한 11개 담당 영역의 `structure.md`, `patterns.md`, `workflows.md`, `gotchas.md` 44개가 모두 존재하고 비어 있지 않음을 확인했다.

## 기준

네트워크 fetch 없이 로컬에 저장된 원격 추적 브랜치를 읽었다. 서비스 작업 트리의 미커밋 코드는 문서 근거에 섞지 않았다.

| 레포 | 확인한 ref | 커밋 |
|---|---|---|
| client-brics-refund | origin/dev | 34966dd |
| client-brics-hub | origin/dev | 99f4f60 |
| client-brics-care | origin/dev | 1457d83 |
| web-op | origin/dev | 756d471 |
| bznav-web | origin/dev | 182704c88 |
| zent-packages | origin/main | b22d000 |

bznav 문서의 최초 조사 기준은 `0b713b4`다. `git diff 0b713b4..182704c88`은 care-web의 package.json 버전 변경 1건뿐이므로 코드 구조·패턴 조사 결과는 그대로 유효하다. 이번 작업은 `/sync` 전체 실행이 아니므로 기존 baseline과 전체 문서의 sync 시각은 갱신하지 않았다.

## 확인 및 수정

- 11개 담당 에이전트가 가리키는 지식 폴더 존재 확인.
- 문서의 단순 파일 경로를 `git ls-tree -r` 목록과 비교. 짧은 경로는 파일 경로의 끝부분도 비교했다. 생성물·예시 경로·이전 경로·소비 레포 경로는 자동 실패로 취급하지 않았다. 중괄호·와일드카드·코드 블록 전체를 해석하는 완전한 링크 검사는 아니다.
- 환급 콘솔의 `tsconfig.json`에서 `@/generated/*` 확인. 기존 에이전트·서비스 표의 별칭 교정을 유지하고 표준 검증 스크립트의 오류 안내도 일치시켰다.
- refund-web의 TS/TSX 소스에서 xstate 사용처 없음 확인. 에이전트·팀 표·플레이북의 상태 머신 설명 수정.
- web-op의 src TS/TSX 소스에서 react-hot-toast 사용처 없음 확인. 에이전트·레포 규칙을 기존 지식 문서의 실제 토스트 구현과 일치시켰다.
- web-op의 Route Handler에서 backend/controller 참조는 documents/link와 taxpayers/[refundId]/documents 2곳임을 확인. 모든 Route Handler가 controller를 거친다는 기존 설명 수정.
- care 콘솔에서 styled-components는 ConsoleIframeStyle.ts 1파일, useSearchParams는 사용처 없음 확인. Tailwind 중심 스타일과 도메인별 Zustand/useState 설명을 에이전트·규칙·팀 표·서비스 표·플레이북에 반영.
- 사용 빈도가 낮다는 이유만으로 금지·불필요를 단정한 일부 표현을 관찰 사실로 수정.
- `bash -n scripts/verify/client-brics-refund.sh`, `git diff --check` 통과.

## 검증 범위와 남은 제한

이번 변경은 Hermes 문서와 검증 스크립트의 안내 문구다. 서비스 코드는 수정하지 않았으며 각 서비스의 lint·타입 검사·테스트는 실행하지 않았다. 표준 검증 스크립트 일부는 캐시·빌드 결과물을 쓰고 패키지 lint는 자동 수정하므로 문서 검증 용도로 일괄 실행하지 않았다.

기존 조사에 포함된 모든 사용처 수와 실행 동작을 재현한 것은 아니다. 사용처 수는 조사 시점의 정적 검색 결과이며, 관례의 근거와 런타임 정상 동작의 증명은 구분한다. 실제 구현 시 해당 문서가 가리키는 코드를 다시 읽고 대상 서비스의 표준 검증을 수행한다.
