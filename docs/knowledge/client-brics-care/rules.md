# client-brics-care 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점과 고유 규칙. **원문: 레포 `CLAUDE.md`** (단, "Next 14" 표기·`infrastructure/care/`·`pkg-link.mjs`·Jira `BZC2-` 예시는 낡음). `README.md`는 모노레포 시절 잔재라 따르지 않는다.

## 포맷·검증
- Prettier `semi: false`, `singleQuote: true`, `trailingComma: none`, `printWidth: 120`, 2 spaces (hub와 동일)
- 검증: `pnpm lint:check`. 타입은 `pnpm exec tsc --noEmit` (**typecheck·test 스크립트 없음**, jest 미도입)

## 코드 컨벤션 (레포 CLAUDE.md)
- **항상 arrow function** (`function` 선언 금지)
- 파일명: 컴포넌트 PascalCase, 유틸 camelCase, 훅 `use`+camelCase, 라우트 kebab-case
- 컴포넌트 내부 순서: hooks → effects → handlers → return
- import 순서: React/Next → 서드파티 → 내부 절대(`@/...`, `@ui/...`) → 상대
- **직접 `fetch` 금지** → `@/generated`의 Orval SWR 훅 (별칭은 `@/generated/*`, hub의 `@/swr`는 없다)
- 권한 체크는 layout·page **서버 컴포넌트**에서 `auth()` → `session.user.functions.includes(AuthFunction.X)` 아니면 `redirect('/unauthorized')`
- 상태: 서버 데이터 SWR, 필터·페이지 등은 **zustand 스토어**(`stores/`). nuqs·nice-modal 없음(직접 구현 모달)

## API·env
- `__generated__/`는 git에 커밋. 스펙 변경 시 `pnpm genapi:local` 후 생성물도 변경 목록에 포함
- env는 `pnpm gen:env`(AWS SSM, 자격 필요). `.env.example` 없음. 설치에 `GITHUB_TOKEN` 필요

## Git
- 브랜치 `dev`(통합) / `prd`(운영) / `frz`(선택). 작업 브랜치 `feat/*`·`fix/*`·`chore/*`·`hotfix/*`. dev·prd·frz 직접 push 금지
- 커밋 한국어, 스코프 생략(`feat:`/`fix:`/`chore:`). 브랜치에 `REF-####`·`INPT-####`가 있으면 본문 둘째 줄 `Jira: REF-####`
- 커밋·PR은 사용자가 명시적으로 요청할 때만. base 불분명하면 확인
