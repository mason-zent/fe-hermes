# client-brics-hub 함정·이력

작업 중 알게 된 것을 날짜와 함께 쌓는다. `/sync`가 자동으로 채우지 않는다.

- **`__generated__/`가 없으면 `pnpm typecheck`·`build`가 `Cannot find module '@/swr'`로 실패한다.** 새로 clone했거나 `pnpm clean` 후라면 `pnpm genapi:local`(hub 서버 기동 + `.env.local`) 먼저. 생성 불가 환경이면 lint + test만 돌리고 사실대로 보고 — 단 생성 enum을 값으로 import하는 스키마의 spec(`templateFormSchema.spec.ts` 등)도 모듈 로딩에 실패할 수 있다
- **dev 포트는 13003** (2026-09-01 변경). 13000은 works 콘솔. Cognito 콜백 URL도 13003으로 등록돼 있어야 로그인이 된다 (`.env.example` 참고)
- **사이드바는 하드코딩이 아니다** (2026-09-01 내재화). 새 화면을 메뉴에 노출하려면 코드가 아니라 `/brics-menus` 화면에서 DB 행을 추가한다. 공유 패키지의 `RootWrapper`/`RootSidebar`는 쓰지 않는다
- **hub API는 전면 `/v1` 버저닝.** 무버전만 있는 것은 `/health`. 생성물의 `unversioned-*` 디렉터리(`@deprecated`, `…Plain` 훅, 서버 version-fallback 호환용)는 쓰지 않는다. 수동 훅을 만들 때 경로에 `/v1`을 빼먹기 쉽다
- **Turbopack에서 `process` 정적 치환 문제**: 공유 패키지 fetcher가 `import * as process from 'process'`를 해서 `next.config.js`의 `turbopack.resolveAlias.process → lib/process-shim.ts`가 없으면 API baseURL이 빈 문자열이 되어 전부 404. 이 설정을 지우지 말 것
- **works 생성물을 복사해 오지 않는다.** hub 서버 스펙으로 다시 생성한다 (태그·경로가 다르다)
- **`/messages/**` 권한 코드 미정**: 로그인만 확인 중. `MESSAGES_REQUIRED_FUNCTION`(`_tabs.ts`, 지금 `null`)은 layout에 연결돼 있지 않다 → 코드가 정해지면 상수와 `messages/layout.tsx`의 `functions.includes(...)` 검사를 **함께** 바꾼다
- **admin의 메뉴 탭(`@tabs/menus`)은 제거됨**(2026-09). 메뉴 관리는 `/brics-menus`
- **Jest는 node 환경 + ts-jest**: 컴포넌트 렌더링 테스트 불가. 공유 패키지는 `test/*Stub.ts`로 스텁된다. 테스트 가능한 건 `_helpers/`·`lib/`의 순수 함수
- **nuqs·nice-modal-react는 "설치만"** (2026-09-16 확인): `NuqsAdapter`·`NiceModal.Provider`가 layout에 있지만 `useQueryState`·`NiceModal.show` 사용처가 0건. 문서에 "관례"로 적혀 있던 것은 오류였다. 실제 관례는 `useSearchParams`+`router.push` / `@ui` Dialog
- **`@/swr` 배럴 값 import는 endpoints→fetcher→`@zent-auth/*` 런타임 의존을 끌어온다.** 지금은 `jest.config.ts`의 `@zent-auth` 스텁 매핑으로 로드된다(`_helpers/messageStatus.ts` 선례). 새 스키마·헬퍼는 여전히 `@/generated/models` 또는 `import type` 권장. `templateFormSchema.ts` 주석의 "모듈 매핑 없음"은 낡음
- **레포 `README.md`는 낡았다** — 포트 13000, "`__generated__` 없어 build/typecheck 실패", 공유 `RootSidebar` 하드코딩 서술은 현재 코드와 다르다. 코드 우선
- **eslint가 `any`를 허용한다**(`.eslintrc.js` `no-explicit-any: off`) → 검증 통과가 `any` 없음을 뜻하지 않는다. 새 코드는 `unknown` + narrowing
- **`formdataFn`은 `undefined`를 `"undefined"` 문자열로 보낸다**: 옵셔널 필드는 키를 빼고 넘긴다 (`{ file, ...(x ? { x } : {}) }`)
- **날짜 유틸 두 종**: `formatKst.ts`(KST 고정, 신규용) vs `lib/DateTimeFormatter.ts`(로컬 시간대, works 잔재). 섞으면 서버값과 어긋난다
- **`TabButton`(admin) 활성 판정은 `includes`**: 경로 접두사가 겹치면 두 탭이 동시에 활성. 신형은 `MessagesTabButton` 방식
