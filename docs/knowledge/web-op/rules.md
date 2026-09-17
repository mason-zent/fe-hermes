# web-op 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점과 고유 규칙. 원문: 레포 `AGENTS.md`와 `README.md`.

## 필수 — 작업 크기와 무관하게 항상 적용

- ⚠️ **`BaseApiGateway`를 상속하지 않는다.** catch에서 `alert` 후 `undefined`를 반환해 에러를 삼킨다. 신규 gateway는 documents 방식(axios 직접)으로 만든다
- ⚠️ **`pnpm typecheck`를 반드시 따로 돌린다.** `pnpm build`는 `typescript.ignoreBuildErrors: true`라 타입 에러를 잡지 않는다. 빌드 통과를 타입 통과로 보고하지 않는다
- **포맷이 다른 BRICS 레포와 정반대다** — `semi: true`, `trailingComma: all`, `printWidth: 80`, double quote. 다른 레포 습관으로 포맷하면 diff가 크게 튄다. 포맷과 기능 변경을 섞지 않는다
- 이 레포 밖은 수정하지 않는다. 공유 패키지(`bznav-fe-ui`, `bznav-fe-common-utils`, `bznav-fe-project-config`) 변경은 **헤르메스에 보고** (`packages-fe` 담당). 로컬 링크(`pnpm pkg:link`) 상태로 커밋하지 않는다
- **커밋하지 않는다.** `NEXT_PUBLIC_SALES_*_KEY` 등 키 값은 출력하지 않는다. 시크릿은 서버 전용 환경변수로만

## 포맷·검증
- Prettier **`semi: true`, `trailingComma: all`, `printWidth: 80`**, 2 spaces — 다른 BRICS 레포와 다르다
- ESLint flat config(`eslint.config.mjs`, `bznav-fe-project-config` 상속), `unused-imports` 플러그인
- 검증: `pnpm lint`, `pnpm typecheck` (`pnpm lint:fix`는 자동 수정)

## 구조·패턴 (레이어드)
- 화면: documents는 container → component + hooks/gateway. sales는 component에 화면 로직이 있고 container는 레이아웃·가드. employee는 container 중심. `useCases/`는 sales 인증 전용 예외다.
- 서버: `app/api/**` Route Handler는 대체로 `src/backend/service → repository`를 거친다. controller는 내부 API 2곳의 인증 래퍼에만 사용한다. 같은 도메인의 패턴을 따른다. 시크릿은 서버 전용 환경변수로만
- 상태 Zustand(`src/store/`), 분석 mixpanel(`src/analytics/`), 토스트는 documents·employee의 `bznav-fe-ui` `useToast`와 sales의 자체 `useToastStore` (`react-hot-toast` 사용처 없음)
- 스타일 styled-components 6 + Tailwind(`bznav-fe-ui` 프리셋)

## 공유 패키지
- `@zenterprise-inc/bznav-fe-ui`, `bznav-fe-common-utils`, `bznav-fe-project-config` 수정은 `packages-fe`. 로컬 링크(`pnpm pkg:link`) 상태로 커밋 금지

## 보안
- `NEXT_PUBLIC_SALES_*_KEY` 등 키 값 출력·커밋 금지

## Git
- 기준 브랜치 `dev`. 커밋 한국어, 티켓 있으면 `feat: REF-#### 설명`
