---
title: QA 씬을 녹화로 만들기(Playwright codegen → 씬 JSON) · 깨진 클릭 단계에 지금 있는 버튼 목록 — Stagehand 대신(API 키 없이)
status: open
repo: hermes
agent:
kind: script
severity: medium
source: 사용자 요청 2026-10-07 (Stagehand 비교 뒤 — Anthropic API 키가 없어 LLM 없이 가는 쪽으로)
plan:
pr:
fix:
reason:
---

Stagehand(browserbase/stagehand)로 바꾸면 자연어 단계·셀프 힐링을 얻지만, 모델 API 키(별도 과금)가 필요하고 dev 화면 내용(테스트 계정 개인정보)이 LLM 으로 나가며, 우리 러너의 응답 흉내·mutation 차단·세션 파일·뷰포트 창·CDP 녹화·Mixpanel 수집·기준 사진 비교가 없어 전면 교체는 득이 적다(2026-10-07 비교). 키 없이 같은 효과를 내는 두 가지를 만든다.

## 할 일
- [ ] **녹화로 씬 만들기** — `node scripts/qa/record.mjs --app <앱> --profile <세션>` 이 저장된 세션으로 보이는 창 + Playwright codegen(녹화)을 띄우고, 사람이 눌러 간 동작(goto·click·fill)을 `scripts/qa/scenarios/<앱>/_draft/NN-<이름>.json` 씬 단계로 바꿔 저장. 버튼은 문구·역할(getByRole/getByText)로, 입력은 placeholder 로. 응답 흉내·expect 단계는 담당 에이전트가 덧붙인다
- [ ] **깨진 클릭 단계 안내** — 씬의 click·fill 이 대상을 못 찾으면 그 화면에 지금 있는 버튼·링크·입력 칸 문구 목록을 실패 원인에 붙인다(예: "'인증 완료' 없음 — 지금 있는 버튼: '완료', '다시 요청'")
- [ ] 현황판 QA 탭에서 [녹화로 씬 만들기] 시작(선택)
- [ ] **사람 단계 씬이 현황판 검수에서 바로 끝남** — 현황판·라이브로 시작한 검수는 창 없이(headless) 돌아 씬 05(실제 본인인증) 같은 `human` 단계가 기다리지 않고 '사람 필요' 로 끝난다(2026-10-07 17:22 확인). --live 면 human 단계가 있는 씬만 보이는 창으로 열어 기다리게. 같이: --headed 런에서 /home 이 /cert/main/menu 로 이동한 것 원인 확인
- [ ] 문서: docs/knowledge/common/verify.md "QA 시뮬레이션", docs/qa/tc/README.md "갱신하기"

## 참고
- Stagehand 는 API 키가 생기면 부분 도입(씬 초안 생성·깨진 단계 진단)만 시범 — 전면 교체 안 함

## 후속
- (없음)
