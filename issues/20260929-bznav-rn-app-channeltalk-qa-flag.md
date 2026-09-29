---
title: rn-app 케어 탭 채널톡 버튼이 QA 용 상시 노출 플래그로 운영에 나가 있음
status: open
repo: bznav-rn-app
agent:
kind: check
severity: low
source: bznav-rn-app 다이어그램 작성 2026-09-29
plan:
pr:
fix:
reason:
---

`CareContainerScreen.tsx:30` 의 `FORCE_SHOW_CHANNEL_TALK_BUTTON = true` 가 prd 에 들어가 있다. 주석은 "QA용 상시 노출. 배포 전 false 로 되돌린다". 의도된 운영 상태인지 확인이 필요하다.

## 근거
- origin/prd `a161710` — `src/screens/tabs/CareContainerScreen.tsx:30`

## 할 일
- 케어 담당에게 운영에서도 상시 노출이 맞는지 확인. 아니면 false 로 되돌리는 작업(코드 푸시로 가능할 것 — 추측입니다)
