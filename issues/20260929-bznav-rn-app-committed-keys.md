---
title: rn-app 에 서비스 키가 하드코딩돼 커밋됨 (MCE·Sentry DSN)
status: open
repo: bznav-rn-app
agent:
kind: check
severity: medium
source: bznav-rn-app 온보딩 2026-09-29 (지식 문서 작성 중 관찰)
plan:
pr:
fix:
reason:
---

`app.config.js` 에 Salesforce MCE `appId`·`accessToken`, `App.tsx` 에 Sentry DSN 이 값으로 커밋돼 있다. 반면 `env.example` 의 `MCE_*`·`EXPO_PUBLIC_API_URL_*` 는 코드에서 읽지 않는다. 값은 어디에도 옮기지 않았다.

## 근거
- origin/prd `a161710` — `app.config.js`, `App.tsx`, `env.example`

## 할 일
- env 로 뺄지, 공개돼도 되는 값인지(Sentry DSN 은 보통 공개 전제) 사용자가 판단
- MCE accessToken 이 앱 번들에 들어가야 하는 값인지 확인
