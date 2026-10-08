---
title: 개인 간편인증 — 이미 조회 이력이 있는 계정이 홈에서 조회하면 "일시적인 오류" → 다시 누르면 "간편인증시스템 장애" 로 보인다
status: open
repo: bznav-web/refund-web
agent: bznav-refund-fe
kind: code
severity: medium
source: QA 실제 간편인증(씬 17) 2026-10-08 09:34 — 런 20261008-093238-refund-web
plan:
pr:
fix:
reason:
---

## 재현(dev, 로컬 3291)
1. 이미 환급 조회(수집)를 한 번 한 개인 계정으로 로그인(본인인증 완료)
2. `/hometax-auth/simple-auth/input?from=home` → 간편인증 요청 → 앱 승인 → [인증 완료]
3. 인증 확인(`simpleAuthConfirmRequestTokenMutation`)은 **성공**, 이어진 환급 토큰(`simpleAuthRequestRefundTokenForLookupMutation` = checkHometaxAccount)이 `ERR_EXIST_SEARCH_HISTORY`
4. 화면은 "인증을 다시 진행해주세요 / 일시적인 오류가 발생했어요"
5. 사용자가 [인증 완료] 를 다시 누르면 이미 쓴 토큰으로 확인을 다시 보내 `hometaxSimpleAuthConfirm: ERR_HOMETAX_SIMPLE_AUTH — 홈택스의 간편인증시스템 장애로 인증이 어려워요` — 실제 원인(이미 조회 이력)과 다른 안내

## 근거
- 요청 기록(QA 라이브 호출 목록, 오류 코드만): 09:34:19 confirm 성공 → ForLookup `ERR_EXIST_SEARCH_HISTORY` → 09:34:26·09:34:47 confirm `ERR_HOMETAX_SIMPLE_AUTH`
- `ERR_EXIST_SEARCH_HISTORY`(error.ts `중복조회`) 전용 안내는 `lib/constants/hometax-auth.tsx:253`(법인 인증서 "다른 법인사업자 인증서를 선택해주세요")와 `HometaxIdAuthContent.tsx:92` 에만 있다. 개인 간편인증 확인(`SimpleAuthConfirmContainer.tsx` handleSimpleAuthError)은 default → 공통 토스트

## 할 일(제안 — 결정 필요)
- 개인 간편인증에서 `ERR_EXIST_SEARCH_HISTORY` 면: 조회 이력 화면(결과)으로 보내거나 "이미 조회하셨어요" 안내 — 어느 쪽이 맞는지 기획 확인
- 재확인(이미 쓴 토큰) 대신 입력 화면으로 되돌려 새 인증을 받게
- 홈에서 조회 이력이 있는 계정이 `from=home` 첫 조회 경로로 들어갈 수 있는 진입점이 있는지 확인(QA 는 주소로 직접 들어갔다 — 실제 사용자 경로에서도 가능한지)

## 후속
- QA: 실제 간편인증 씬(17)·여정 1 실제 모드는 조회 이력이 없는 계정이 필요하거나, 이력이 있으면 다시 조회 경로를 타야 한다
