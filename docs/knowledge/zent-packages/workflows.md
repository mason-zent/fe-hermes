# zent-packages frontend/ 반복 작업 절차

## A. brics-fe-ui에 컴포넌트/props 추가
1. 위치: shadcn 프리미티브면 `src/components/ui/<name>.tsx` + `ui/index.ts`에 `export *`. 콘솔 래퍼면 `src/components/<Name>.tsx`(`export default`, 배럴 없음)
2. export: `exports` 와일드카드라 package.json 수정 불필요. 소비 측 경로 `@zenterprise-inc/brics-fe-ui/components/<Name>`. props 타입을 소비 측이 쓰면 `export interface XProps` **named export** 동반(Pagination 선례)
3. 기존 prop 추가는 optional+기본값이면 patch, 필수 prop·의미 변경은 minor(breaking)
4. 타입체크 `pnpm build --filter @zenterprise-inc/brics-fe-ui`. **brics 3종은 CI lint 제외** → lint 결과에 의존하지 말 것
5. `pnpm changeset` → 패키지 선택 → bump. main PR에 changeset 없으면 `changeset-check` 실패(문서만이면 `--empty`)
6. 소비 레포 확인: `pnpm pkg:link` → `pnpm dev` → `pnpm pkg:unlink`. 소비 `tailwind.config`의 `content`에 `node_modules/@zenterprise-inc/brics-fe-ui/src/components/**` 필요
7. PR → CI → main 머지 → "Version Packages" PR 머지 → `@latest` → 소비 레포 `pnpm install` lockfile 커밋

## B. `AuthFunction` 권한 코드 추가
1. BE `/users/zent/me`의 `functions` 문자열 값 확정. **enum 값은 BE 문자열과 정확히 일치**(키는 자유)
2. `frontend/brics/zent-auth/src/types/enums/AuthFunction.ts`에 멤버 추가(접두사 관례, 파일 하단)
3. works 계열 메뉴 노출이 필요하면 같은 PR에서 `frontend/brics/ui/src/components/RootSidebar/index.tsx`에 `isShow` 항목(ui도 changeset). hub는 DB 메뉴라 불필요
4. 소비 사용: 서버 `auth()` + `functions.includes(AuthFunction.X)` → `redirect('/unauthorized')`, 클라 `useSession()`. import `@zenterprise-inc/brics-fe-zent-auth/types/enums/AuthFunction`
5. 하위호환이므로 **patch**. `brics-fe-ui`는 workspace 의존이라 자동 patch bump

## C. bznav-fe-ui 컴포넌트 추가(스토리 포함)
1. `src/components/<group>/<Name>.tsx` — `cva` + `forwardRef` + `cn` + `displayName`, named export, props 인터페이스 export. 색·간격은 `src/theme/*` 토큰
2. `src/components/index.ts`에 `export *`(중복 확인) → 루트 `index.ts` named 목록에 추가. **둘 다 안 하면 외부에 안 나간다**
3. `<Name>.stories.tsx` 같은 폴더(`Bznav-UI/<그룹>/<이름>`, autodocs, 한국어)
4. `pnpm --filter @zenterprise-inc/bznav-fe-ui storybook`(6006). **스토리 타입 오류는 build로 안 잡힌다**(exclude) → Storybook 기동으로 확인
5. Chromatic은 dev push 자동(`frontend/bznav/ui/**`) 또는 수동. 변경 있으면 실패 → 리뷰
6. changeset → PR

## D. breaking 변경
1. changeset **minor**(0.x라 major 미사용, 선례 전부 minor). `**breaking**` 항목 + 마이그레이션
2. 연쇄 패키지를 같은 PR에서 함께 고치고 **각각** changeset(선례: zent-auth `useSessionTimeout` ↔ ui `RootWrapper`)
3. 소비 레포는 **두 패키지 동시 업그레이드** 명시
4. 브랜치 스냅샷으로 소비 PR 프리뷰까지 검증(E)

## E. 브랜치 스냅샷 → 소비 레포 PR 프리뷰
1. 브랜치 끝 토막을 양쪽 동일하게(`feat/login-fix` ↔ `care/login-fix`)
2. zent-packages: changeset 커밋 → Actions **Release (snapshot)** → 브랜치 선택, tag 비움 → `0.0.0-login-fix-<ts>` `@login-fix`
3. 소비 PR에 `works-preview`/`care-preview`/`refund-preview` 라벨 → `BRICS_DEV_TAG=login-fix`로 `use:dev-pkgs`
4. 확인: 소비 Actions "🧪 PR Preview Build" → `Resolve brics snapshot tag`. 폴백 체인 `@<tag>` → `@dev` → lockfile
5. 브랜치명 못 맞추면 소비 PR 라벨 `brics-tag:<tag>`

## F. 검증
```bash
pnpm install
pnpm build --filter @zenterprise-inc/<pkg>...     # tsc 타입체크
pnpm build --filter '...[origin/main]'            # CI 동일
pnpm lint                                         # ⚠️ --fix/--write 라 파일을 고친다
pnpm --filter @zenterprise-inc/bznav-fe-ui storybook | build-storybook
pnpm changeset
```
표준 스크립트 `scripts/verify/zent-packages.sh <패키지명...>`(build + lint + changeset 존재 확인)
