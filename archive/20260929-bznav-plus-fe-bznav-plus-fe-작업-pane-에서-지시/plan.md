# plus-web 운세·세무 진단 헤더 로고 · 운세 compact 패딩·문구 색상

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 12:03 / bznav-plus-fe
- Status: done
- Agent: bznav-plus-fe
- Issue: 없음
- Work ref: /Users/mason/mason-zent/hermes/repos/bznav-web · 🌿 feature/SENA-747 @ 216d9fd0d (origin/dev a701bfa69 + cherry-pick 1개, **force push 대기**) · 백업 backup/SENA-747 @ 430b927d2 · PR #1965

### Progress
- [x] 담당 레포 브랜치·미커밋 상태 확인 (feature/SENA-747, untracked `.claude/`·`docs/` — 무관, 미수정)
- [x] 작업 — dev 서버 기동 (http://localhost:3400, `/calc` 200)
- [x] 작업 — 운세 직접 진입 시 로고 노출 (`SEO_ENTRY_PATHS` 에 `/fortune` 추가)
- [x] 작업 — 운세는 전용 로고 `logo_bznav-fortune.svg` 사용 (`CommonTopNavigation` 에 `logo` prop)
- [x] 작업 — 운세 compact(<744px) 패딩: 세로 normal-xlarge(32px) · 가로 container-padding-medium(20px) 로 입력/결과 통일 (`FortunePage.tsx`)
- [x] 작업 — 운세 결과 날짜·회사명 문구 색상 `text-primary-foreground-main` → `text-neutral-foreground-lowest` (Figma neutral/foreground/lowest)
- [x] 작업 — 세무 진단 인트로(`/tax-check`) 로고 `logo_bznav-tax-check.svg` (`TaxCheckPageHeader` showBrandNavigation + TAX_CHECK_LOGO, 뒤로가기 exitToApp 은 앱에서만)
- [x] 검증 (lint·tsc 통과, 09:05 — 1차 import/order 오류 수정 후) — 브라우저 육안 확인은 사용자
- [x] 리뷰 (reviewer, 09:15) — **승인 가능**, 필수 수정 없음. 검증 스크립트 재실행 동일 통과. 확인 필요 사항은 Next 2~3 에 반영

### Next
1. 사용자가 브라우저에서 /fortune 직접 진입(새 탭·sessionStorage 비움) → 운세 로고, 계산기 거쳐 진입 → `<` 확인
2. 운세·세무 진단 로고 클릭 이동 경로(각 자기 페이지, 추측으로 정함) 확인
2-1. 세무 진단 인트로에 메뉴 버튼(`/calc/menu`)이 새로 노출되는 것이 디자인과 맞는지 확인
2-2. (리뷰 지적) `/fortune/share` 직접 진입 시 헤더 왼쪽이 비어 있음 — `SEO_ENTRY_PATHS` 에 `/fortune` 만 있음. 기존과 같은 동작이며 공유 페이지에도 로고가 필요한지 확인
3. (확인됨: 제목 폰트 크기 변화는 기존 공통 동작) compact 패딩 해석(세로 32px·가로 20px, 입력 화면 16→32px) 을 디자이너 요청과 대조 확인
4. PR #1965 정리: prd-plus 에서 딴 브랜치라 운영 전용 커밋 23개가 섞여 있었다 → origin/dev 에서 브랜치 재생성 + `66c1b8151` cherry-pick → `216d9fd0d` (FortunePage import 충돌 해결: dev 의 useUserEventLogger 제거 + 우리 cn 제거). **사용자/헤르메스가 `git push --force-with-lease origin feature/SENA-747`** 하면 PR 이 커밋 1개·파일 6개가 된다
5. push 후 `backup/SENA-747` 로컬 브랜치 삭제 여부 결정

### Blocked
- 없음

### Review
- 결론: **승인 가능** (reviewer, 2026-09-29 09:15) — 필수 수정 없음
- 계획서 대비: 지시 6건 모두 구현, 누락·범위 초과 없음. `apps/plus-web/**` 만 변경, `packages/**` 미변경
- 규칙: `any`·미사용 import·console 없음, named export, Prettier `--check` 통과, `git diff --check` 통과
- 동작: `logo` 기본값 `CALC_LOGO` 라 계산기 레이아웃 9곳은 동작 그대로. tax-check 뒤로가기는 앱은 기존대로 웹뷰 닫기, 웹은 버튼이 히스토리 있을 때만 보이므로 `history.back` 이 맞음. `tax-check/result` 는 영향 없음
- 에셋: 리소스센터 `logo_bznav-fortune.svg`·`logo_bznav-tax-check.svg` 둘 다 200, 128×24 로 코드 값과 같음 (세무 진단 로고는 리뷰에서 추가 확인)
- 확인 필요(수정 필수 아님): 메뉴 버튼 노출(Next 2-1), 로고 클릭 경로(Next 2), `/fortune/share` 로고(Next 2-2), compact 패딩 해석(Next 3)
- 문서: `docs/knowledge/bznav-web/plus-web/gotchas.md` 의 `CommonTopNavigation.tsx:56` TODO 줄 번호가 밀림 — 다음 `/sync` 때 갱신

### Validation
## 검증 결과 — bznav-web apps/plus-web (feature/SENA-747 @ 216d9fd0d, 2026-09-29 12:02)

| 단계 | 결과 | 소요 |
|---|---|---|
| `pnpm --filter plus-web lint` | ✅ 통과 | 4s |
| `pnpm --filter plus-web exec tsc --noEmit` | ✅ 통과 | 2s |

- build: 실행 안 함 (상수·prop 추가 — 라우팅·빌드 설정·의존성 변경 없음)
- dev `/fortune` HTTP 200, SSR HTML 에 `logo_bznav-fortune.svg` 포함 확인. 리소스센터 `plus/logos/logo_bznav-fortune.svg` 200 (128×24)
- 실제 헤더 로고 노출은 클라이언트 판정이라 브라우저 확인 필요 (실행 못 함)

#### 리뷰어 재실행 — bznav-web apps/plus-web (feature/SENA-747 @ edc6fe300, 2026-09-29 09:09)

| 단계 | 결과 | 소요 |
|---|---|---|
| `pnpm --filter plus-web lint` | ✅ 통과 | 2s |
| `pnpm --filter plus-web exec tsc --noEmit` | ✅ 통과 | 2s |

- 에이전트 보고(09:05)와 같음. 추가: 변경 6개 파일 `prettier --check` 통과, `git diff --check` 통과

## 지시
> 우선 로컬 서버 띄워줘 (plus-web dev, 포트 3400)
>
> 운세 페이지 헤더 왼쪽 — 히스토리상 뒤로 갈 수 있으면 `<`, 다이렉트 접근이면 로고가 나와야 하는데 로고가 안 나온다. 다른 페이지 보고 로고 이미지 추가
>
> 이미지가 다른 게 들어갔다 — `logo_bznav-fortune.svg` 로 바꿀 수 있나? 지금 다 공통으로 쓰는 건가?
>
> 디자이너 요청: Compact 레이아웃(743px 이하) 패딩 수정 — normal/xl, container-padding/md (대상: `FortunePage.tsx` 운세 컨테이너)
>
> 운세 결과 요약의 날짜·회사명 문구(`body-small-bold text-primary-foreground-main`) 폰트 컬러를 Figma 기준 neutral/foreground/lowest 로
>
> 세무 진단 페이지에도 로고 추가 — 이미지 `logo_bznav-tax-check.svg` (CDN)

## 결과
- 변경 파일
  - `apps/plus-web/lib/constants/top-navigation.ts` — `SEO_ENTRY_PATHS` 에 `/fortune`, `TopNavigationLogo` 타입, `CALC_LOGO` 에 href·ariaLabel, `FORTUNE_LOGO`·`TAX_CHECK_LOGO` 추가, `SEO_ENTRY_PATHS` 에 `/tax-check`
  - `apps/plus-web/app/_components/CommonTopNavigation.tsx` — `logo?: TopNavigationLogo` prop (기본 `CALC_LOGO`), `LogoButton` 이 prop 사용
  - `apps/plus-web/app/fortune/layout.tsx` — `logo={FORTUNE_LOGO}` 전달
  - `apps/plus-web/app/tax-check/_components/TaxCheckPageHeader.tsx` — `showBrandNavigation`·`logo={TAX_CHECK_LOGO}`, 뒤로가기 `exitToApp` 을 앱일 때만(웹은 history back — 웹에서 closeWebView 는 무동작)
  - `apps/plus-web/app/fortune/_components/FortuneResultSummary.tsx` — 날짜·회사명 문구 색상 primary(violet-600) → neutral/foreground/lowest(gray-500)
  - `apps/plus-web/app/fortune/_components/FortunePage.tsx` — `compact:py-normal-medium` 와 결과 화면 조건부 `compact:py-normal-xlarge` 제거 → 전 구간 `py-normal-xlarge` + `container-padding-medium`. 미사용 `cn` import 제거
- compact 패딩 해석(추측): normal/xl = 세로 32px, container-padding/md = 가로 20px. 가로·결과 화면은 이미 그 값이었고 실제 변화는 **compact 입력 화면 세로 16→32px**
- 원인: 헤더 왼쪽 판정(`use-top-navigation-policy.ts`)은 `SEO_ENTRY_PATHS` 로 세션 최초 진입한 경우만 로고. `/fortune` 누락 → 직접 진입 시 `'none'`. 또 로고가 `CALC_LOGO` 로 하드코딩돼 모든 페이지 공통이었다
- 운세 로고: 리소스센터 `${NEXT_PUBLIC_RESOURCE_CENTER_URL}/plus/logos/logo_bznav-fortune.svg` (레포 public 에는 없음, 운세 다른 이미지와 같은 방식)
- 남은 위험
  - 운세 로고 클릭 시 `/fortune` 으로 이동하게 함 — 추측으로 정함. `/calc` 가 맞으면 한 줄 수정
  - 세션 최초 진입 경로 기준이라 계산기를 먼저 거친 세션에서 운세로 오면 `<` (기존 정책)
- 세무 진단: showBrandNavigation 을 켜서 웹에서 메뉴 버튼(`/calc/menu`)이 새로 노출된다. 세무 진단 진입은 plus-web 내부 링크 없이 care-web 사이드바·sena-web 메뉴·공유·검색 유입뿐이라 웹에선 대부분 로고
- 공통 패키지 영향·다른 앱 후속 작업: 없음
