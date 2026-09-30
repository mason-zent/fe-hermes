# bznav-web 함정·이력

작업 중 알게 된 것을 날짜와 함께 쌓는다. `/sync`가 자동으로 채우지 않는다.

- **2026-09-16 care-web 대규모 리팩터링(NEWCARE-633)**: `constant/` → `constants/`, 도메인 전용 파일을 `app/<라우트>/` 안으로 이동, `libs/hooks`·`libs/store` → 루트 `hooks/`·`store/`, 카카오·채널톡·로깅을 `libs/{kakao,channelTalk,eventLogger}`로 집결(이후 NEWCARE-638·649 에서 `libs/{kakao,channel-talk,event-logger}` 등 공통 폴더명을 kebab-case로 개명. 라우트 폴더는 그대로). 레포의 `.github/agents/care-web.agent.md`와 `.ai/basic-rule.md`는 아직 `constant/paths.ts`라고 적혀 있다 → **실물 우선**, 원문 갱신은 확인 필요
- **2026-09-16 `@repo/ui` public export 축소**: `TopNavigationInquiryButton`, `openChannelTalk`이 제거되고 care-web `libs/channelTalk`(현 `libs/channel-talk`)로 이관(NEWCARE-629). 다른 앱에서 이 export를 쓰고 있었다면 빌드가 깨진다
- **README의 ECS 대상 표기가 워크플로와 다르다**(2026-09 README 갱신): README "ECS 계열 배포 워크플로우"는 `brand-web`, `refund-web`이라 적지만 ECS 워크플로 3종(`auto-deployment.yml` `--apps=refund-web`, `aws-prd-deployment.yml`·`aws-dev-deployment.yml` 선택지 `refund-web` 하나)은 모두 refund-web만 배포한다. **README 오기** — 배포 대상은 워크플로가 정본. README 는 EKS 계열을 `care-web`·`plus-web` 로만 적어 sena-web 이 어느 쪽에도 없다
- **원문 `create-pr` 스킬이 `dev-ecs` 이전 상태**: `.github/skills/create-pr/SKILL.md` 는 아직 ECS 계열(brand·refund·sena)이면 base 를 `dev-ecs` 로 고르라고 적는다. `dev-ecs` 는 폐기됐다 — base 는 5개 앱 모두 `dev`, PR 은 `scripts/ship.sh` 로 만든다(`rules.md` Git 절). 원문 갱신은 확인 필요
- **커밋된 비밀 파일**(2026-09-15 확인, 2026-09-29 `apps/care-web/.npmrc` 추가 확인): 루트 `.npmrc`·`apps/care-web/.npmrc`(`_authToken` 평문, env 참조 아님), `apps/sena-web/firebase-key.json`. 내용 출력·수정 금지, 보안 확인 요청 중
- **루트 `pnpm gen:relay` 는 no-op 이 아니다**: `turbo gen:schema` 가 refund-web 의 `gen:schema` 를 돌려 `apps/refund-web/graphql/schema/schema.graphql` 을 dev 게이트웨이 스키마로 덮어쓰고(네트워크 필요), `compile:relay` 를 가진 앱은 없어 아티팩트는 안 만든다. Relay 아티팩트(미커밋)는 앱별 `pnpm --filter care-web relay`·`pnpm --filter refund-web gen:relay` 로
