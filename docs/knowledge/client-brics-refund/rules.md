# client-brics-refund 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점과 고유 규칙. 레포 자체 규칙 문서는 없다(README만 — `gotchas.md` 참고: 기본 템플릿이라 신뢰하지 말 것).

## 필수 — 작업 크기와 무관하게 항상 적용

- **`deal`은 "환급"을 뜻한다.** 코드·주석·UI 문구 어디서도 "딜"·"거래"로 옮기지 않는다. 문구 한 줄만 고치는 작업에도 적용된다
- 이 레포 밖은 수정하지 않는다. 공유 패키지(`@zenterprise-inc/brics-fe-ui`, `brics-fe-zent-auth`)가 바뀌어야 하면 직접 고치지 말고 **헤르메스에 보고**한다 (`packages-fe` 담당)
- `__generated__/`(Orval 생성물)는 **직접 편집하지 않는다.** 생성 명령으로만 만든다. git 추적 대상이라 diff에 함께 올라간다
- **커밋하지 않는다.** `.env*`·토큰·키 파일 내용은 출력하지 않는다
- `AuthFunction` 값 추가는 **이 레포에서 불가능하다**(`@zent-auth` enum). 새 권한 코드가 필요하면 멈추고 보고한다

## 포맷·검증
- Prettier `semi: false`, `singleQuote: true`, `trailingComma: none`, `printWidth: 120`, 2 spaces
- 검증: `pnpm lint:check` (ESLint + Prettier). 타입은 `pnpm exec tsc --noEmit` (typecheck 스크립트 없음)

## 구조·패턴
- App Router. 도메인 화면은 `app/refund-service/<도메인>/`, 화면 전용 컴포넌트는 그 라우트의 `_components/`, 공통은 `app/_components/`, 공통 훅 `app/_lib/hooks/`
- 클라이언트 컴포넌트는 `'use client'` 명시. `page.tsx`/`layout.tsx` 분리
- **권한 가드는 `layout.tsx`에 둔다** (`middleware.ts`가 없다). `origin/prd` 확인 결과 `refund-service/**/layout.tsx` 25개가 `auth()` → `session.user.functions.includes(AuthFunction.X)` → `redirect('/unauthorized')` 패턴이고 `page.tsx`에 가드를 둔 화면은 **0개**다. 복사 원본은 `partner/discount/layout.tsx`

## API
- 손으로 API 클라이언트를 쓰지 않는다. `__generated__/`(Orval, 별칭 `@/generated/*`)에 있으면 그것을 쓰고, 없으면 `pnpm gen:api:local`(서버 기동 + `.env.local`)로 재생성
- 생성 불가 시 `lib/swr/` 패턴으로 임시 훅 + 보고에 명시

## 상태·모달·UI import
- 전역 스토어 없음. URL 쿼리가 단일 소스(`useSearchParams` + `router.push`), 화면 공유는 `_components` 안 Context. nuqs·zustand·jotai 미설치
- 모달은 도메인의 기존 방식을 따른다: `useDialog().showDialog` > shadcn Dialog > nice-modal(레거시 2곳)
- 공용 UI는 `@ui/components/ui` **배럴 import**가 관례(hub와 반대). 신규 스타일은 Tailwind만, 병합은 `clsx`

## 공유 패키지
- `@zenterprise-inc/brics-fe-ui`, `brics-fe-zent-auth` 수정은 `packages-fe`. 직접 고치지 않는다
- 로컬 링크 실험은 `pnpm pkg:link` / `pkg:unlink`

## Git
- **문서·지식의 기준 브랜치는 `origin/prd`**(운영 반영분, 정본은 `hermes.config.json`). 이 폴더의 사실은 거기서 읽은 것이다
- **개발 브랜치는 별개다** — PR base `dev`, 릴리즈 `release/v.YY.MM.NNN`. 두 개를 같은 것으로 취급하지 않는다
- 커밋 `feat: REF-#### 설명` (레포 `.github/git-commit-instructions.md`: 한글, type만, 브랜치에 지라 번호가 있으면 2행 `Jira: REF-123`)
