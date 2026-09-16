# bznav-web 레포 규칙

공통 규칙(`docs/knowledge/common/`)에 더해, 이 레포에서 다른 점. **원문은 레포의 `.ai/basic-rule.md`**이고 우선순위는 `.github/skills/*/SKILL.md` → `.github/agents/<앱>.agent.md` → `.ai/basic-rule.md`. 환경·앱 표·Relay·검증표 등 상세는 같은 폴더의 `common.md`.

## 공통과 다른 점
- Prettier **`semi: true`**, `singleQuote: true`, `trailingComma: none`, **`printWidth: 160`**
- 파일명: 컴포넌트·클래스 `PascalCase`, **훅·유틸·일반 모듈 `kebab-case`**, 디렉터리 `kebab-case`
- 타입 선언은 `type` 기본(`interface`는 declaration merging 등 필요할 때만). named export 기본, `export default`는 Next 진입점만
- **컴포넌트 내부 순서**: ① 변수·상수·state ② 커스텀 훅·`useMemo` ③ `useCallback`·핸들러 ④ `useEffect`
- CSS 속성 알파벳순, Stylelint 통과 필수. SCSS/Tailwind 혼용 파일은 기존 방식 유지
- 신규 UI는 `@repo/ui`. `@zenterprise-inc/ui`(ui-deprecated) 신규 사용 금지

## 범위
- 앱 에이전트는 자기 `apps/<앱>/**`만. `packages/**`는 `bznav-packages-fe`가 **먼저**. 앱에서 다른 앱 import 금지, 패키지 내부 파일 직접 import 금지(public export만)
- 새 의존성은 `pnpm-workspace.yaml` catalog 확인 먼저. 내부 패키지는 `workspace:*`

## Relay
- 아티팩트 미커밋 → `relay`/`gen:relay` 선행. 생성물 직접 편집 금지. 스키마 갱신은 네트워크·인증 필요

## 검증
- 기본 `pnpm --filter <앱> lint`. 타입은 care-web만 `type-check`, 나머지는 `exec tsc --noEmit`. care-web은 `test:unit`도

## Git
- 기준 브랜치 `dev`. PR base는 앱 계열별: `dev`(care·plus, EKS) / `dev-ecs`(brand·refund·sena, ECS) / 릴리즈 `prd-<앱>`. PR은 `.github/skills/create-pr` 절차
- 커밋 `type(scope): 설명` (예 `fix(refund): REF-3728 ...`). 응답·PR·리뷰는 한글 존댓말
- 비커밋: `.env*`, `.aws/access-key.js`, `firebase-key.json`
