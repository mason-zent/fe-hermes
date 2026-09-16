# web-op 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점과 고유 규칙. 원문: 레포 `README.md`.

## 포맷·검증
- Prettier **`semi: true`, `trailingComma: all`, `printWidth: 80`**, 2 spaces — 다른 BRICS 레포와 다르다
- ESLint flat config(`eslint.config.mjs`, `bznav-fe-project-config` 상속), `unused-imports` 플러그인
- 검증: `pnpm lint`, `pnpm typecheck` (`pnpm lint:fix`는 자동 수정)

## 구조·패턴 (레이어드)
- 화면: `containers/`(조립·상태 연결) → `components/`(프레젠테이션). 데이터: `gateway/`(axios) → `useCases/`·`hooks/`
- 서버: `app/api/**` Route Handler는 반드시 `src/backend/controller → service → repository`를 거친다. 시크릿은 서버 전용 환경변수로만
- 상태 Zustand(`src/store/`), 분석 mixpanel(`src/analytics/`), 토스트 `react-hot-toast`
- 스타일 styled-components 6 + Tailwind(`bznav-fe-ui` 프리셋)

## 공유 패키지
- `@zenterprise-inc/bznav-fe-ui`, `bznav-fe-common-utils`, `bznav-fe-project-config` 수정은 `packages-fe`. 로컬 링크(`pnpm pkg:link`) 상태로 커밋 금지

## 보안
- `NEXT_PUBLIC_SALES_*_KEY` 등 키 값 출력·커밋 금지

## Git
- 기준 브랜치 `dev`. 커밋 한국어, 티켓 있으면 `feat: REF-#### 설명`
