---
title: 이메일 로그인·가입 폼 문구 두 가지 — "이메일로 회원가입$>;" 글자 · 비밀번호 안내(8자·조합)와 실제 검사(6자) 불일치
status: open
repo: bznav-web/packages
agent: bznav-packages-fe
kind: code
severity: low
source: plans/task/20261007-bznav-sena-fe-QA-TC-전체-sena-web.md — sena-web QA TC 전체 갱신(2026-10-07, bznav-sena-fe, 코드 읽기만 · 화면으로 확인 안 함)
plan:
pr:
fix:
reason:
---

sena-web QA TC(`docs/qa/tc/sena-web.md` SN-051·SN-058)를 쓰다가 `@repo/user-sign` 에서 찾았다. 이메일 로그인은 dev/loc 에서만 보여 운영 영향은 적지만, 같은 컴포넌트를 쓰는 다른 앱(refund 등)도 같을 수 있다(추측 — 다른 앱은 확인 안 함).

## 1. "이메일로 회원가입$>;"
- `/signin` → "이메일로 로그인" 으로 폼을 펼치면 아래 링크가 `이메일로 회원가입$>;` 로 렌더된다(코드상)
- `packages/user-sign/src/components/SignItems.tsx:157` — `이메일로 회원가입{!isShowLoginButton ? '$>;' : ''}` · `SignInContent.tsx:173` 에서 `isShowLoginButton={mainItem !== 'email'}`
- 2025-10-16 `771a35550` "ci 인증 모듈 재반영" 부터. 의도한 기호(›·> 등) 대신 남은 글자로 보인다(추측)

## 2. 비밀번호 안내와 검사가 다르다
- `SignUpInput.tsx:34` 안내 "영문, 숫자, 특수문자 포함 8자 이상"
- `utils.ts:32-46` `checkPasswordValidation` 은 빈 값·공백·6자 미만·250자 초과만 본다 — "123456" 이 통과한다

## 근거 기준
- `origin/prd-sena` `92d7b483a`(2026-10-06)

## 할 일
- 실제 화면에서 두 가지를 확인 → 기호·안내 문구 또는 검사 규칙 중 무엇이 맞는지 정해 고친다(공통 패키지 → bznav-packages-fe, zent 전환 뒤면 zent-packages)
