# 서비스 맵

헤르메스 팀이 담당하는 프론트엔드 레포 비교표. 상세 규칙은 각 `.claude/agents/*.md`. 레포 목록 정본은 `hermes.config.json`.
기준: 각 레포 `origin/dev` (zent-packages는 `origin/main`). 마지막 sync 2026-09-16, `/sync`로 갱신.

| 항목 | client-brics-refund | client-brics-hub | client-brics-care | bznav-web | web-op |
|---|---|---|---|---|---|
| 에이전트 | refund-fe | hub-fe | care-fe | bznav-{refund,care,brand,sena,plus}-fe + bznav-packages-fe | op-fe |
| 경로 | `repos/client-brics-refund` | `repos/client-brics-hub` | `repos/client-brics-care` | `repos/bznav-web` (앱: `apps/<앱>`) | `repos/web-op` |
| 사용자 | 내부 운영자 (환급) | 내부 운영자 (플랫폼 관리) | 내부 운영자 (케어) | 외부 고객 (비즈넵) | 내부 운영·영업 |
| 구조 | 단일 앱 | 단일 앱 | 단일 앱 | pnpm workspace + Turborepo (5 apps, 8 packages) | 단일 앱 + BFF |
| Next.js | 15.5 App Router | 15.5 App Router | 15.5 App Router | 16.2 (refund-web만 Pages Router) | 16.2 App Router |
| React | 19 | 19 | 19 | 19 | 19 |
| Node / pnpm | 24.14.1 / 8.15.6 | 24.14.1 / 8.15.6 | 24.14.1 / 8.15.6 | 24.15.0 / 10.33.0 | ≥24 / 10.20.0 |
| dev 포트 | 13002 | 13003 | 13001 | brand 3000 · care 3100 · refund 3200 · sena 3300 · plus 3400 | 3000 |
| 데이터 | SWR + Orval (`@/swr`) | SWR + Orval (`@/swr`) | SWR + Orval (`@/generated`) | Relay + GraphQL (care·refund) | axios (`src/gateway`) |
| 상태 | React state, Context | nuqs (URL) | Zustand | Jotai | Zustand |
| UI | brics-fe-ui + Tailwind | brics-fe-ui + Tailwind | brics-fe-ui + Tailwind + styled-components | `@repo/ui` + Tailwind + SCSS | styled-components + Tailwind (bznav-fe-ui 프리셋) |
| 폼 | RHF + Zod | RHF + Zod | RHF + Zod | RHF + Yup | – |
| 인증 | NextAuth v5 + Cognito | NextAuth v5 + Cognito | NextAuth v5 + Cognito | `@repo/user-session`, `user-sign` | 자체 JWT (`jsonwebtoken`) |
| 백엔드 | server-zent-ip (refund) | server-brics-hub | care 서버 (`NEXT_PUBLIC_API_URL`) | bznav GraphQL gateway | 자체 Route Handler + 외부 API |
| Prettier | semi false, single, 120 | semi false, single, 120 | semi false, single, 120 | semi true, single, 160 | **semi true, trailingComma all, 80** |
| 검증 명령 | `pnpm lint:check`, `tsc --noEmit` | `pnpm lint:check`, `pnpm typecheck`, `pnpm test` | `pnpm lint:check`, `tsc --noEmit` | `pnpm --filter <앱> lint`, care-web만 `type-check`·`test:unit`, 나머지 `exec tsc --noEmit` | `pnpm lint`, `pnpm typecheck` |
| 생성물 | `__generated__/` (Orval, 커밋) | `__generated__/` (Orval, 커밋) | `__generated__/` (Orval, 커밋) | Relay 아티팩트 (미커밋, 선행 생성 필요) | 없음 |
| 레포 자체 규칙 문서 | 없음 | README | `CLAUDE.md` (Next 14 표기는 낡음) | `.ai/basic-rule.md`, `.github/agents/*.agent.md` | README |

## 발행 공유 패키지 — zent-packages `frontend/` (`packages-fe`, 기준 브랜치 main)
| 항목 | 내용 |
|---|---|
| 경로 | `repos/zent-packages/frontend` (`backend/`는 범위 밖) |
| 라인 | `brics/*` = `@zenterprise-inc/brics-fe-*` (React 18 계열, 소비: refund·hub·care·works) · `bznav/*` = `@zenterprise-inc/bznav-fe-*` (React 19, catalog, 소비: bznav-web·web-op) · `devkit` = `zent-fe-devkit` (pkg:link CLI) |
| 배포 | **소스 배포**(`exports` → `src/*.ts`). `build`=tsc 타입체크만, dist 없음 |
| 버전 | Changesets. `.changeset/*.md` 없으면 PR 머지 차단. main 머지 → Version Packages PR → GitHub Packages `@latest`. 브랜치 스냅샷 `@<브랜치 끝 토막>` |
| 런타임 | Node 24.14.1 / **pnpm 11.8.0**. GitHub Packages 토큰 필요 |
| 검증 | `pnpm build --filter=<pkg>...`, `pnpm lint --filter=<pkg>`, bznav-fe-ui는 `build-storybook` |
| 규칙 문서 | `frontend/README.md`, `frontend/bznav/README.md`, `frontend/devkit/README.md` |

- bznav-web의 `@repo/*`는 모노레포 **내부** 패키지(bznav-packages-fe 담당). zent-packages의 `bznav-fe-*`는 **발행** 패키지(packages-fe 담당). 이름이 비슷하니 구분한다

## 관련 레포 (참고용, 담당 아님)
- `client-brics-works` — hub·care·refund 콘솔이 분화된 원본. 권한 가드·병렬 라우트 패턴의 출처
- `server-brics-hub`, `server-zent-ip`, `server-brics-works` — 백엔드
- `zent-packages/backend/*` — `@zenterprise-inc/brics-be-*`
