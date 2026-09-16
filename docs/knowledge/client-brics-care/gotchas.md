# client-brics-care 함정·이력

## 문서 ↔ 코드 불일치 (코드가 정답)
- 레포 `CLAUDE.md`: "Next 14" → **15.5.22 / React 19**. `infrastructure/care/` → 루트 `Dockerfile`. `pkg-link.mjs` → 없음(devkit). 프리뷰 라벨 `care-preview` → **`preview`**. 배포 "수동 디스패치" → `push dev/stg/prd` 자동도 됨(name "API Deploy"). `frz`·`branch-auto-merge-down.yml` → 워크플로 없음. "항상 arrow function" → `export default function` 12파일. "SWR 훅 사용" → plain 함수 직접 호출이 광범위
- `.github/copilot-instructions.md`의 `@/swr`·nuqs 언급은 hub 지침 이식 — care에 둘 다 없음. Jira는 `REF-`/`INPT-` 외 `CARE-####`도 실제 사용
- `README.md`는 모노레포 시절(`apps/care`, Node 20+) — 따르지 말 것
- `components.json`의 `tailwind.css: ../../packages/ui/global.css` 잔재. 실제 CSS는 `@ui/global.css`

## 생성물·명령
- `__generated__/`가 없으면 **build·dev·lint 전부 실패**(40여 곳 import). `pnpm clean` 후 반드시 `genapi:local`
- `genapi:local`은 `.env.local`의 `NEXT_PUBLIC_API_URL` 없이는 `undefined/api-yaml` fetch로 실패
- `gen:env`는 자격증명 없으면 **빈 `.env`를 만들고 성공한 척**(exit 0)
- `pnpm install`은 `GITHUB_TOKEN`(read:packages) 필수
- **`tailwind.config.js`가 `./app/marketing-page/constants`의 `LOGO_COLORS`를 require** → 이 파일을 옮기거나 export명을 바꾸면 Tailwind 빌드가 깨진다
- `typecheck` 스크립트 없음 → 타입 오류는 `next build`에서만. 표준 검증 스크립트가 `tsc --noEmit` 대행

## 설정 특이점
- `strict: true`인데 **`noImplicitAny: false`**, eslint `no-explicit-any: off` → 타입 생략·`SetStateAction<any>`가 조용히 통과. 새 코드에서 흉내 내지 말 것
- `reactStrictMode: false` — 이펙트 2회 실행이 없어 StrictMode 전제 버그가 숨는다
- 별칭은 `@/generated/*`(별표 필수). 배럴은 `@/generated/index`로 명시
- `outDir: dist` + `distDir: ./dist` 겹침, `include`에 `./dist/types/**`
- `basePath`/`assetPrefix`가 `BASE_PATH` env 의존

## 런타임·도메인
- **페이지 파라미터 0-based**(`page: page - 1`). 실수하면 조용히 한 페이지 밀린다
- `bmans` 목록은 카운트용으로 **같은 엔드포인트 3번 호출**(`useFindBmans` × 3). 필터 하나 바꾸면 3요청
- `PaymentsContainer` 검색은 `searchType/searchValue`가 deprecated, 개별 필드(`contactPhone/name/bizName/bizNo`)로 매핑
- `PaymentsDetailContainer`는 `app/bmans/_components/`에 있지만 `/txprs/[id]/payments`에서 쓰인다(폴더≠라우트)
- `PromotionTable`은 클라이언트 필터/정렬/슬라이스 — 데이터 커지면 성능·정합성 문제
- `usePromotionFilters`는 sessionStorage persist → 필드 추가·개명 시 stale 상태 복원(마이그레이션 없음)
- **create/edit/[id]·`/txprs`에 권한 가드 없음** — 목록만 막고 상세·생성은 무방비. 새 화면에서 답습 금지
- `/pro/:slug*` rewrite + `ConsoleIframe`(`usePathname().split('/pro/')[1]`) — rewrite를 건드리면 딥링크가 깨진다
- QA 화면은 `NEXT_PUBLIC_ZENV === 'prd'`면 권한 있어도 사용 불가
- `motion`… 아님(care-web). **의존성 위치**: `orval`이 dependencies(hub는 dev)
- `lib/orval-fetcher.ts` ⚠️: re-export 금지, `fetcher`·`ErrorType`·`BodyType` 직접 선언
- TODO: `app/marketing-page/_components/ImageSectionForm.tsx:58` 커스텀 섹션 임시 비활성화(스키마엔 있음)
- 공유 패키지 버전 엇갈림: care `ui 0.3.1`/`zent-auth ^0.3.0` vs hub `ui 0.2.4`/`zent-auth 0.4.0`
