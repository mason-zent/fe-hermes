# 서비스 맵

헤르메스 팀이 담당하는 4개 프론트엔드 레포 비교표. 상세 규칙은 각 `.claude/agents/*.md`.
기준: 각 레포 `origin/dev` (마지막 sync 2026-09-15, `/sync`로 갱신).

| 항목 | client-brics-refund | client-brics-hub | bznav-web | web-op |
|---|---|---|---|---|
| 에이전트 | refund-fe | hub-fe | bznav-fe | op-fe |
| 경로 | `/Users/mason/mason-zent/client-brics-refund` | `/Users/mason/mason-zent/client-brics-hub` | `/Users/mason/mason-zent/bznav-web` | `/Users/mason/mason-zent/web-op` |
| 사용자 | 내부 운영자 (환급) | 내부 운영자 (플랫폼 관리) | 외부 고객 (비즈넵) | 내부 운영·영업 |
| 구조 | 단일 앱 | 단일 앱 | pnpm workspace + Turborepo (5 apps, 9 packages) | 단일 앱 + BFF |
| Next.js | 15.5 App Router | 15.5 App Router | 16.2 (refund-web은 Pages Router) | 16.2 App Router |
| React | 19 | 19 | 19 | 19 |
| Node / pnpm | 24.14.1 / 8.15.6 | 24.14.1 / 8.15.6 | 24.15.0 / 10.33.0 | ≥24 / 10.20.0 |
| dev 포트 | 13002 | 13003 | brand 3000 · care 3100 · refund 3200 · sena 3300 · plus 3400 | 3000 |
| 데이터 | SWR + Orval (`@/swr`) | SWR + Orval (`@/swr`) | Relay + GraphQL | axios (`src/gateway`) |
| 상태 | React state, Context | nuqs (URL) | Jotai | Zustand |
| UI | brics-fe-ui + Tailwind | brics-fe-ui + Tailwind | `@repo/ui` + Tailwind + SCSS | styled-components + Tailwind (bznav-fe-ui 프리셋) |
| 폼 | RHF + Zod | RHF + Zod | RHF + Yup | – |
| 인증 | NextAuth v5 + Cognito | NextAuth v5 + Cognito | `@repo/user-session`, `user-sign` | 자체 JWT (`jsonwebtoken`) |
| 백엔드 | server-zent-ip (refund) | server-brics-hub | bznav GraphQL gateway | 자체 Route Handler + 외부 API |
| Prettier | semi false, single, 120 | semi false, single, 120 | semi true, single, 160 | **semi true, trailingComma all, 80** |
| 검증 명령 | `pnpm lint:check`, `tsc --noEmit` | `pnpm lint:check`, `pnpm typecheck`, `pnpm test` | `pnpm --filter <앱> lint`, `tsc -p apps/<앱>` | `pnpm lint`, `pnpm typecheck` |
| 생성물 | `__generated__/` (Orval) | `__generated__/` (Orval) | `__generated__/` (Relay) | 없음 |
| 레포 자체 규칙 문서 | 없음 | README | `.ai/basic-rule.md`, `.github/agents/*.agent.md` | README |

## 공유 패키지 (범위 밖, 변경 필요 시 사용자에게 알림)
- `@zenterprise-inc/brics-fe-*` (ui, zent-auth, resource-manager, project-config, datadog-trace) → refund, hub 사용. 소스: `/Users/mason/mason-zent/zent-packages/frontend`
- `@zenterprise-inc/bznav-fe-*` (ui, common-utils, project-config) → web-op 사용. 소스: 같은 레포 `frontend/bznav/`
- bznav-web의 `@repo/*`는 모노레포 내부 패키지라 bznav-fe 범위. 단 앱 작업 중 패키지 수정이 필요하면 헤르메스에 보고 후 진행

## 관련 레포 (참고용, 담당 아님)
- `client-brics-works` — hub가 분화된 원본. 권한 가드·병렬 라우트 패턴의 출처
- `client-brics-care` — care 운영 콘솔
- `server-brics-hub`, `server-zent-ip`, `server-brics-works` — 백엔드
