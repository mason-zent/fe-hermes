---
id: 20261008-zent-packages-learn-gotchas-07eec6
title: bznav 패키지에 새 공개 경로를 열면 lint 허용 목록도 같이 고쳐야 한다
target: docs/knowledge/zent-packages/gotchas.md#학습
source: plans/task/20261001-packages-fe-bznav-fe-project-config-eslint-no-intern.md (배우기 검토자 · done)
signal: review
basis: code
applied: 2026-10-09
approved_by: Mason
---

## 무엇을 배웠나
bznav-fe 패키지들은 package.json의 exports에 공식으로 연 경로로만 가져다 쓰게 되어 있다. 이 규칙은 패키지 자신이 아니라 공용 lint 설정(bznav-fe-project-config)에 정규식으로 따로 적혀 있고, 허용하는 경로(server·globals.css·postcss.config·tailwind.config·lint/*)를 이름으로 하나하나 나열한다. 그래서 어떤 패키지의 exports에 새 경로를 추가해도 lint 설정은 저절로 따라 바뀌지 않는다.

## 왜 중요한가
새 공식 경로를 열고 lint 목록을 안 고치면, 그 경로를 쓰는 소비 앱 lint가 에러로 깨진다.

## 공책에 넣을 문장
bznav-fe 패키지 package.json exports 에 새 서브패스를 열면 `frontend/bznav/project-config/lint/eslint.config.js` 의 no-restricted-imports regex 허용 목록에도 추가한다 — 허용 경로를 이름으로 나열해서, 빠뜨리면 그 정식 경로 import 가 소비 앱(web-op 등) lint 에러가 된다.

## 어디서 배웠나
- plans/task/20261001-packages-fe-bznav-fe-project-config-eslint-no-intern.md — frontend/bznav/project-config/lint/eslint.config.js no-restricted-imports regex `^@zenterprise-inc/bznav-fe-[^/]+/(?!(?:server|globals\.css|postcss\.config|tailwind\.config|lint/.+)$)`
