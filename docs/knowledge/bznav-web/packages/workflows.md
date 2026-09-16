# bznav-web packages/* 반복 작업 절차
## A. `@repo/ui`에 컴포넌트 추가
1. 배치: 원자 `src/components/<camel>/<Pascal>.tsx`, 조합형 `organisms/`, 페이지 단위 `pages/`(`.github/skills/react-component/SKILL.md`)
2. `cva` + `cn` + `forwardRef` + `displayName`. 색·간격은 `src/theme/*` 토큰
3. **export 2곳**: `src/components/index.ts`에 `export *`(중복 확인) + `packages/ui/index.ts` named 목록(값·타입). ②를 빠뜨리면 앱에서 import 불가(최빈 실수)
4. 스토리 `<Name>.stories.tsx`(`Bznav-UI/<그룹>/<이름>`, autodocs, 한국어)
5. `pnpm --filter @repo/ui lint` → `build-storybook` → 사용 앱에서 import 확인. purge 확인(앱 content에 `packages/ui/src/**` 포함)
## B. 기존 컴포넌트 API 변경 — 영향 확인
```bash
R=repos/bznav-web
git -C $R grep -n "\bBoxButton\b" origin/dev -- apps packages | sed 's|origin/dev:||' | awk -F/ '{print $1"/"$2}' | sort | uniq -c
git -C $R grep -n "<BoxButton[^>]*variant=" origin/dev -- apps
git -C $R grep -c "from '@repo/ui'" origin/dev -- apps packages
```
- breaking이면 `user-sign`(16)·`user-session`(1)도 소비자. 보고에 §구조의 매트릭스 근거로 "영향 앱 + 후속 앱 에이전트" 명시
## C. 유틸 추가 — 앱 무관 순수 → `common-utils/utils/<kebab>.ts` + `index.ts` export(**내부 패키지 의존 금지**). 플랫폼·라우팅·웹뷰 → `platform/src/{utils,hooks}` + `client.ts`(브라우저)/`server.ts`(Node) 맞는 엔트리. UI 순수 함수 → `ui/src/components/util/` 또는 `src/libs/`
## D. 트래킹 이벤트 — 단순 이벤트는 앱에서 `useUserEventLogger` (패키지 수정 불필요). 타깃 변경은 `options.sendTargets`/`SEND_TARGETS`. 새 채널: `src/services/<X>Service.ts`(`BaseService` 상속) → `EventTrackingController` 등록 → `src/types.ts` → 필요 시 `EventTrackingScripts.tsx` → `index.ts` 타입. `IS_IFRAME` 무시를 테스트에 포함
## E. catalog 버전 변경 (루트 파일 — 보고 대상)
- `pnpm-workspace.yaml` `catalog:`(react 19.2.6, next 16.2.5, tailwind 3.4.19, jotai 2.17, nice-modal 1.2.13). 신규 의존은 catalog에 있는지 먼저 → `"catalog:"` 선언 → **버전 변경은 헤르메스에 보고 후** `pnpm install` → 영향 앱 전체 lint/build. 내부 링크는 `workspace:*`
## F. 검증 — `scripts/verify/bznav-web.sh packages/<pkg>`(`pnpm --filter @repo/<pkg> lint`, ui는 `build-storybook`) + export 변경 시 영향 앱 `exec tsc --noEmit`(읽기·검증만). `type-check`/`test`는 turbo task 아님
