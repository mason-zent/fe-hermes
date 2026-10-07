---
title: 리소스센터 수정 후 옛 이미지 노출 — S3 Cache-Control 없음 · 이름 변경 시 옛 경로 무효화 누락
status: open
repo: server-brics-hub
agent:
kind: check
severity: medium
source: hub-fe 조사 2026-10-06 (plans/task/20261006-hub-fe-hub-fe-작업-refund-fe-에서-이관-리소스센터-REF-3810.md)
plan:
pr:
fix:
reason:
---

리소스센터에서 이미지를 수정해도 옛 이미지가 계속 보인다는 제보가 있었다. 서버는 수정할 때 CloudFront 무효화를 이미 하지만, S3 객체에 `Cache-Control`이 없어 브라우저가 휴리스틱 캐시를 쓴다. 또 파일 이름을 바꿔 수정하면 새 경로만 무효화되고 옛 경로 캐시는 남는다. 범위 밖(백엔드)이라 백엔드 담당자 확인이 필요하다.

## 근거 (server-brics-hub 로컬 main 2318090 — 원격 최신과 다를 수 있음)
- `src/resource-center/resource-center.service.ts` `updateResource`: 옛 `s3Path` 삭제 → 새 `path` 업로드 → `createInvalidation({ path: '/' + path })` — 옛 `s3Path`는 무효화하지 않음
- `zent-packages/backend/zent-infrastructure/src/aws/AbstractAwsS3Client.ts` `uploadFile`: `PutObjectCommand`에 `CacheControl` 없음
- `curl -sI https://prd.cdn.bznav.com/care/svg/logo_bznav-care.svg` → `cache-control` 없음, `last-modified`·`etag`만 (리소스센터 배포와 같은 배포인지는 확인 못 함)

## 할 일
- 실제로 옛 이미지가 보인 화면·URL 확인 (hub 미리보기 / 서비스 웹 / next/image 경유 여부)
- 백엔드: 업로드에 `CacheControl`(예: `no-cache` 또는 짧은 max-age) 지정 검토, 이름 변경 수정 시 옛 `s3Path`도 무효화
- 프론트(hub, 선택): 미리보기 URL에 `?v=<updatedDt>`를 붙여 콘솔의 브라우저 캐시를 피하는 방안 검토

## 확인 결과
- 2026-10-07 사용자 확인: 같은 파일명으로 수정, 원인은 캐시로 결론 — 이슈 해결로 처리하기로 함 (CDN 응답 헤더 직접 확인은 하지 않음)
- 코드 변경 없음 (hub·서버 모두). 이름 변경 수정 시 옛 경로 무효화 누락은 이번 제보와 무관해 후속으로 잡지 않음

## 후속
- [x] 없음 — 사용자 결정으로 종료
