---
title: 광고 구좌 수정 시 소재 id 를 보내지 않아 저장할 때마다 소재가 전부 삭제·재생성됨
status: open
repo: client-brics-refund
agent: refund-fe
kind: check
severity: medium
source: plans/task/20261001-refund-fe-refund-fe-작업-pane-에서-지시.md (REF-3884 작업 중 서버 코드 대조)
plan:
pr:
fix:
reason:
---

광고 구좌 수정 API 의 소재 DTO 에는 `id`(기존 소재 수정 시 필수)가 있는데, 콘솔은 상세를 불러올 때도 저장할 때도 소재 `id` 를 다루지 않는다. 서버는 `id` 가 없는 소재를 신규로 보고 기존 소재를 전부 삭제하므로, 저장할 때마다 소재가 지워졌다가 새로 만들어지는 것으로 보인다(추측 — 실제 DB 동작 미확인). 소재 id(`rfndBnerId`)에 통계·트래킹이 걸려 있다면 영향이 있다.

## 근거
- FE `app/refund-service/advertisement/ad-slots/_components/Containers.tsx` — 저장 매핑(180~199행)·상세 불러오기(265~274행)에 `id` 없음 (feature/REF-3884 = origin/dev b9732e3)
- 생성물 `__generated__/models/updateAdSlotItemDto.ts` — `id?: number` "기존 아이템 수정 시 필수, 신규 생성 시 생략"
- 서버 `server-zent-ip/apis/refund/src/ad-slot/services/ad-slot.service.ts` `analyzeItemChanges`(349~392행) — id 없는 소재는 생성, 들어오지 않은 기존 id 는 삭제 (로컬 체크아웃 release/wrks/v.26.06.200 · f38a9b8a8 기준, 운영·dev 와 다를 수 있음)

## 할 일
- 서버 담당자와 의도 확인(전체 재생성이 의도인지)
- 의도가 아니면 FE 에서 소재 id 를 폼에 보존해 수정 요청에 실어 보낸다

## 후속
- (확인 후 채움)
