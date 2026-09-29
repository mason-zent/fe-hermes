# bznav-web packages/* 반복 작업 절차
## A. `@repo/ui`에 컴포넌트 추가
1. 배치: `src/components/<kebab-case>/<Pascal>.tsx`(원문 [필수] 디렉터리 kebab-case. 기존 camelCase 폴더 `appSideBar`·`fieldSet` 등은 개명하지 않는다), 조합형은 기존 `organisms/`, 페이지 단위는 `pages/`. 위치는 주변 폴더 관례를 따른다(`.github/skills/react-component/SKILL.md`)
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
- 워크트리에서 작업 중이면 `R=<워크트리>` 에서 ref 없이 `rg` 로 찾는다(미커밋·미추적 파일 포함). `git grep … HEAD` 는 커밋된 것만 본다. `origin/dev` 는 통합 브랜치 기준
- breaking이면 `user-sign`(16)·`user-session`(1)도 소비자. 보고에 §구조의 매트릭스 근거로 "영향 앱 + 후속 앱 에이전트" 명시
## C. 유틸 추가 — 앱 무관 순수 → `common-utils/utils/<kebab>.ts` + `index.ts` export(**내부 패키지 의존 금지**). 플랫폼·라우팅·웹뷰 → `platform/src/{utils,hooks}` + `client.ts`(브라우저)/`server.ts`(Node) 맞는 엔트리. UI 순수 함수 → `ui/src/components/util/` 또는 `src/libs/`
## C-1. WorkingPlatform 추가 — `src/types.ts` `WorkingPlatform` 유니온 + `src/constants.ts` 의 `WORKING_PLATFORM_TYPE`·`BROWSER_TYPE`(Record 라 빠지면 타입 에러) + 해당하면 `PARTNER_APP_LIST`·`TOSS_APP_LIST` → 새 상수는 `client.ts` export. 앱의 문자열 비교 분기(`grep -rn "workingPlatform ===" apps`)를 영향 앱으로 보고
## D. 트래킹 이벤트 — 단순 이벤트는 앱에서 `useUserEventLogger` (패키지 수정 불필요). 타깃 변경은 `options.sendTargets`/`SEND_TARGETS`. 새 채널: `src/services/<X>Service.ts`(`BaseService` 상속) → `EventTrackingController` 등록 → `src/types.ts` → 필요 시 `EventTrackingScripts.tsx` → `index.ts` 타입. `IS_IFRAME` 무시를 테스트에 포함
## E. catalog 버전 변경 (루트 파일 — 보고 대상)
- `pnpm-workspace.yaml` `catalog:`(버전은 그 파일·지문이 정본). 신규 의존은 catalog에 있는지 먼저 → `"catalog:"` 선언 → **버전 변경은 헤르메스에 보고 후** `pnpm install` → 영향 앱 전체 lint/build. 내부 링크는 `workspace:*`
## F. 검증 — `scripts/verify/bznav-web.sh packages/<pkg>`(`pnpm --filter @repo/<pkg> lint`, ui는 `build-storybook` 까지. 워크트리면 `HERMES_VERIFY_DIR=<워크트리>`) + export 변경 시 영향 앱 `exec tsc --noEmit`(읽기·검증만). `type-check`/`test`는 turbo task 아님
- ⚠️ 스크립트는 `@repo/<디렉터리명>` 으로 필터한다 — **`ui-deprecated` 는 패키지명이 `@zenterprise-inc/ui`** 라 `pnpm --filter @zenterprise-inc/ui lint` 를 직접 돌리고, **`project-config` 는 scripts 가 없어** 소비 앱·패키지 lint 로 확인한다. 표준 스크립트가 이 둘을 지원하지 않는다는 것을 보고에 적는다
