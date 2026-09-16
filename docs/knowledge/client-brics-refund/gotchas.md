# client-brics-refund 함정·이력

- **README는 create-next-app 기본 템플릿 그대로**(포트 3000 안내). 실제 dev 포트 **13002**. 로그인·권한·Orval 설명 전무 → 신뢰하지 말 것
- **코드 주석의 `pnpm genapi`는 존재하지 않는 스크립트**(hub 이름). 이 레포는 `gen:api:local` 하나뿐(dev용 없음)
- **`__generated__`는 git 추적 대상**인데 `pnpm clean`·`gen:api:local`이 `rm -rf __generated__`로 시작 → 실패 시 대량 삭제 상태. `git checkout -- __generated__`
- **`typecheck`·`test` 스크립트 없음.** 타입 오류는 `pnpm build`에서만 드러나 "fix: 빌드에러 수정" 커밋이 반복됨. 표준 검증 스크립트가 `tsc --noEmit`을 대신 돌린다
- `landing-seo/_lib/landing-seo-zip.test.ts`(node:test)는 실행 경로가 없어 방치 상태
- **`axios`가 직접 의존성에 없음**(hoisted) → `import axios from 'axios'` 추가 금지. `crmListUploadHelper`가 XHR을 쓰고 `api-error.ts`가 `isAxiosError` 플래그를 검사하는 이유
- **`AuthFunction` 값 추가는 이 레포에서 불가**(`@zent-auth` enum). landing-seo가 그래서 로그인만 검사 + TODO 상태. `advertisement/promotion/layout.tsx`는 landing-modals 권한을 그대로 검사(복붙 추정)
- **모달 3방식 혼재**(`useDialog` 34 / shadcn Dialog 15 / nice-modal 7). 같은 도메인의 기존 방식을 따른다. `@ebay/nice-modal-react`를 관례로 적었던 기존 문서는 오류
- **별칭은 `@/generated/*`**. hub의 `@/swr`는 없다. 엔드포인트 디렉터리명이 **한글**이라 경로 자동완성·grep 시 주의
- **시간대 함정**: `lib/utils/datetime.ts`의 `convertTimezoneISOString`은 종료일을 `hour-1:59:59`로 세팅, `convertToKSTISOString`은 입력에 `'Z'`를 붙여 UTC 가정(오프셋 있는 값에 쓰면 깨짐). `partner/discount` 목록은 `toISOString().substring(0,10)`(UTC)이라 KST 자정 근처 날짜가 하루 밀릴 수 있음. hometax-block·refund-overview는 `date-fns-tz`. 도메인마다 다르니 그 화면 관례를 따른다
- **prd에서 `user/all`·`refund-overview`는 검색 조건 없으면 목록을 조회하지 않음**. 로컬/dev에서만 전체 목록이 보여 버그 재현 시 혼동
- `lib/orval-fetcher.ts`: orval은 re-export를 인식 못 함 → `fetcher`/`ErrorType`/`BodyType` 직접 선언 유지
- `emergency/maintenance/_components/EditForm.tsx`의 `config[env]?.maintenanceSetting`은 임시 마이그레이션 코드(v.25.09.200 이후 제거 예정, 아직 남음)
- `landing-seo-api.ts`: 버킷 CORS 미설정으로 업로드 `response.ok` 검사 생략 중(실패가 미리보기 깨짐으로만 드러남)
- `app/_components/PaginationLimitSelector.tsx`: `setLimit: SetStateAction<any>` 타입 오류 + `useEffect`·`onValueChange` 중복 호출
- `hometax-block/m/page.tsx`는 `fixed inset-0 z-40` + body 스크롤 잠금 → Dialog(z-50) 외 전역 UI와 z-index 충돌 주의
- `business-message/crm/_components/FileUploader.tsx` 주석은 필수 컬럼 4개라 하지만 코드는 3개(`name, phoneNumber, userErn`). 코드 우선
- 공유 패키지 버전이 hub와 엇갈림: refund `brics-fe-ui ^0.3.3`/`zent-auth ^0.3.0`, hub `ui 0.2.4`/`zent-auth 0.4.0` → 한쪽 화면 코드를 그대로 옮기면 prop이 안 맞을 수 있음(추측)
