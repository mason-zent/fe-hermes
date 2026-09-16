# bznav-web 함정·이력

작업 중 알게 된 것을 날짜와 함께 쌓는다. `/sync`가 자동으로 채우지 않는다.

- **2026-09-16 care-web 대규모 리팩터링(NEWCARE-633)**: `constant/` → `constants/`, 도메인 전용 파일을 `app/<라우트>/` 안으로 이동, `libs/hooks`·`libs/store` → 루트 `hooks/`·`store/`, 카카오·채널톡·로깅을 `libs/{kakao,channelTalk,eventLogger}`로 집결. 레포의 `.github/agents/care-web.agent.md`와 `.ai/basic-rule.md`는 아직 `constant/paths.ts`라고 적혀 있다 → **실물 우선**, 원문 갱신은 확인 필요
- **2026-09-16 `@repo/ui` public export 축소**: `TopNavigationInquiryButton`, `openChannelTalk`이 제거되고 care-web `libs/channelTalk`로 이관(NEWCARE-629). 다른 앱에서 이 export를 쓰고 있었다면 빌드가 깨진다
- **Relay 아티팩트 미커밋**: care-web·refund-web은 체크아웃 직후 `relay`/`gen:relay`를 먼저 돌려야 타입이 맞는다
- **`.npmrc` 평문 토큰, `apps/sena-web/firebase-key.json` 커밋 상태**(2026-09-15 확인): 건드리지 말고 보안 확인 요청 중
- **루트 `pnpm gen:relay`는 no-op**: `gen:schema`/`compile:relay` 태스크를 가진 앱이 없다. 앱별 스크립트 사용
