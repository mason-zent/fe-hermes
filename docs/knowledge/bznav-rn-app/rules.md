# bznav-rn-app 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점과 고유 규칙. **웹 FE 가 아니라 Expo · React Native 앱**이다. 원문: 레포 `CLAUDE.md`, `.claude/rules/*.md`, `prompt_rules.md`(→ `ai_prompt/*.md`), `README.md`(낡음 — `gotchas.md` 참고).

## 필수 — 작업 크기와 무관하게 항상 적용

- **운영 기준은 `prd` 다.** 로컬 메인 체크아웃의 `main`(2025-12)·`develop` 은 expo-router `app/` 구조의 옛 코드다. 그것을 보고 구조·패턴을 판단하지 않는다
- **배포 명령은 실행하지 않는다** — `eas update`(코드 푸시)·`eas build`·`yarn update:*`·`yarn *:local`(EAS 로컬 빌드)·`yarn firebase:distribute:*`·`yarn sentry:upload:dsym`. 운영 앱·테스터에게 바로 나간다. 필요하면 헤르메스에 보고
- `yarn env:*`(`eas env:pull`)도 실행하지 않는다 — EAS 의 시크릿을 로컬 `.env` 로 끌어온다
- 패키지 매니저는 **yarn 1**(`yarn.lock`, 버전은 `package.json` `packageManager`). pnpm·npm 으로 설치하지 않고 lockfile 을 새로 만들지 않는다. 설치는 `yarn install --frozen-lockfile`, Node 는 `.nvmrc`(Node 20 계열 — `gotchas.md`)
- **expo CLI 명령은 `APP_VARIANT` 가 들어간 package 스크립트로만 돌린다**(`start:dev:lan`·`prebuild:clean:dev`·`ios-device:dev` …). `app.config.js` 가 `APP_VARIANT` 없이 throw 하므로 `yarn start`·`yarn ios`·`yarn android` 는 실패한다
- 작업 브랜치는 **`prd` 에서** 딴다. 이름 `feature/v<앱버전>/<티켓>`(예 `feature/v5.1.2/SENA-269`). 헤르메스 `scripts/new-branch.sh` 는 티켓만 주면 `feature/<티켓>` 을 만드므로 **브랜치 이름을 `feature/v<앱버전>/<티켓>` 전체로 준다**(슬래시가 있으면 그대로 쓴다). PR 은 `scripts/ship.sh`(`## Git`)
- **피그마·UI 작업에서 디자인 시스템에 없는 컴포넌트·옵션은 만들지 않고 먼저 묻는다**(레포 `CLAUDE.md`). 무엇이 없는지, DS 에 추가할지를 함께 전달
- UI 는 `AppText`(RN `Text` 직접 사용 금지) + NativeWind 토큰 클래스. 임의 hex·토큰 외 픽셀값·`cn()` 없는 조건부 클래스 금지(`.claude/rules/design-system-core.md`)
- Mixpanel 이벤트는 **`TrackingService` 로만**. `mixpanel-react-native` 직접 import·`track()`·`identify()` 금지(`.claude/rules/tracking.md`)
- 네이티브 설정(`app.config.js`·`plugins/**`·`patches/**`·네이티브 SDK 버전·권한)을 바꾸면 **코드 푸시로 못 나간다** — 보고에 "스토어 빌드 필요"를 적는다
- 시크릿: `.env*`, `assets/firebase/{google-services.json,GoogleService-Info.plist}`, 키스토어(`*.jks`)·`*.p8`·`*.p12`, Firebase·Sentry·Airbridge·Mixpanel·MCE·카카오·네이버·채널톡 키 값은 **출력·복사·이동하지 않는다**. `app.config.js`·`App.tsx` 안에 하드코딩된 값도 마찬가지(`gotchas.md`)
- 브릿지 메시지(`actionName`·payload)는 **웹과 짝**이다. 웹 쪽(bznav-web refund/sena/care)을 고쳐야 하면 직접 고치지 말고 헤르메스에 보고
- **커밋은 사용자가 요청할 때만 `scripts/commit.sh` 로, push·PR 은 사용자가 "PR 올려줘" 라고 할 때 `scripts/ship.sh` 로만 한다(레포 하나짜리 작업 · 미리보기 확인 후 draft PR — 여러 레포 작업은 헤르메스).**

## 코드 규칙
- `eslint.config.js` 규칙: **arrow function 만**(`func-style: expression` — `function` 선언 금지, 컴포넌트도 `const Foo = () => {}`), `no-use-before-define`(컴포넌트 안 핸들러 뒤쪽 정의는 허용), `no-var`·`prefer-const`. 옵션 상세는 `patterns.md` "lint 규칙". ⚠️ prd 에서 이 설정은 로드 실패로 적용된 적이 없을 수 있다(`gotchas.md`) — 그래도 지켜 쓴다
- TypeScript `strict`, 별칭 `@/*` = `src/*`, `@assets/*` = `assets/*`. 새 코드에서 `any` 금지(기존 코드엔 많다 — 따라 하지 않는다)
- 컴포넌트 본문 순서(`ai_prompt/component-development-rules.md`, `App.tsx` 주석): 1 변수·상태 → 2 라이프사이클 → 3 함수 → 4 기타 훅 → 5 UI
- 스크린은 `useScreenLifecycle({ firstFocus, focus, blur, unmount })`(`src/hooks/useScreenLifecycle.ts`), 일반 컴포넌트는 `useEffect`. 가이드 문서의 `(status) => switch` 시그니처는 낡았다
- zustand: `create<XState>()`, 스토어명 `use{기능}Store`, 셀렉터로 구독(`ai_prompt/zustand-development-guidelines.md`). **파일명은 가이드의 kebab-case 가 아니라 실제 관례 `camelCase` (`tabBadgeStore.ts`)**
- 포맷: 레포에 Prettier 설정 파일·Prettier 본체가 없다(`prettier-plugin-tailwindcss` 만 devDeps). 작업한 파일만, 주변 코드 스타일(큰따옴표·세미콜론·2칸·trailing comma)에 맞춘다. 전역 포맷 금지
- `console.log` 는 non-development 빌드에서 babel(`transform-remove-console`, error·warn 유지)과 metro(`drop_console`, production)가 제거한다. 그래도 토큰·쿠키 값은 로그에 찍지 않는다

## 검증
- 표준: hermes 루트에서 `scripts/verify/bznav-rn-app.sh` = **`yarn eslint src` → `yarn tsc --noEmit`**. 테스트는 없다. lint 는 현재 설정 오류로 ⏭ 이고 커밋 시 `--allow-skip` 이 필요하다, Node·설치 조건도 `gotchas.md` "설치·검증"
- 기기·시뮬레이터 실행(`expo run:*`)은 스크립트가 대신하지 않는다. 했으면 무엇을 봤는지, 안 했으면 "실행 못 함"

## 보고에 추가로 적을 것
배포 경로(코드 푸시 가능 / 스토어 빌드 필요) · 웹뷰로 연결된 웹 쪽 영향(브릿지·쿠키·URL) · 네이티브 설정 변경 여부 · 디자인 시스템에 없던 컴포넌트를 쓰려 했다면 그 내용

## Git
- **문서·지식의 기준 브랜치는 `origin/prd`**(정본 `hermes.config.json`, 이 레포는 `prBase` 도 `prd`). 이 폴더의 사실은 거기서 읽은 것이다
- PR 은 보통 같은 브랜치로 prd·dev 양쪽이지만, 진행 중인 `release/*` 로 모아 prd 에 넣는 경로도 있다(예 SENA-477 → `release/v.2026.09.310_app_v5.1.2_codepush` → PR #88). PR 대상은 `scripts/ship.sh` 미리보기의 후보(prd · dev · 최근 `release/*`)에서 사용자가 고른다 — 양쪽이면 `--base prd --base dev`. `main`·`develop` 은 기준으로 쓰지 않는다
- 릴리스 브랜치 `release/v.YYYY.MM.NNN_app_v<앱버전>_codepush|store`(표기 흔들림 있음 — `release/v26.09.200_…`), 핫픽스 `hotfix/v<앱버전>_codepush_<YYYYMMDD>[_n]`, 스테이징 `stg/v<앱버전>_store` — 사람이 만든다. 에이전트는 만들지 않는다
- 커밋 메시지 한국어. README 기여 가이드는 `feat:`/`fix:` 접두사를 말하지만 prd 의 실제 커밋은 접두사 없는 짧은 한국어("세나 탭 뱃지 추가")다. 이 레포 최근 관례를 따르고, 메시지는 `scripts/commit.sh -m` 으로 넘긴다(스크립트에 메시지 관례는 없다)

## 레포 원문
`CLAUDE.md`(피그마 규칙) · `.claude/rules/{design-system-core,tracking}.md` · `.claude/skills/design-system-*` 가 유효하다. 전체 목록과 낡은 문서 표시는 `structure.md` "레포 원문 목록".
