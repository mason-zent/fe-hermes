# client-brics-refund 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점과 고유 규칙. 레포 자체 규칙 문서는 없다(README만).

## 포맷·검증
- Prettier `semi: false`, `singleQuote: true`, `trailingComma: none`, `printWidth: 120`, 2 spaces
- 검증: `pnpm lint:check` (ESLint + Prettier). 타입은 `pnpm exec tsc --noEmit` (typecheck 스크립트 없음)

## 구조·패턴
- App Router. 도메인 화면은 `app/refund-service/<도메인>/`, 화면 전용 컴포넌트는 그 라우트의 `_components/`, 공통은 `app/_components/`, 공통 훅 `app/_lib/hooks/`
- 클라이언트 컴포넌트는 `'use client'` 명시. `page.tsx`/`layout.tsx` 분리
- 페이지 권한 가드는 기존 `refund-service/*/page.tsx` 패턴을 그대로

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
- 기준 브랜치 `dev`, 릴리즈 `release/v.YY.MM.NNN`. 커밋 `feat: REF-#### 설명`
