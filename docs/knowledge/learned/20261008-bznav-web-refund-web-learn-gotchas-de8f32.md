---
id: 20261008-bznav-web-refund-web-learn-gotchas-de8f32
title: BZNAVSans 폰트를 optional로 바꾸면 첫 방문 때 글자·아이콘이 깨질 수 있다
target: docs/knowledge/bznav-web/refund-web/gotchas.md#학습
source: plans/task/20261006-bznav-refund-fe-bznav-refund-fe-작업-pane-에서-지시.md (배우기 검토자 · done)
signal: review
basis: run
applied: 2026-10-09
approved_by: Mason
---

## 무엇을 배웠나
화면 글꼴인 BZNAVSans는 앱이 아니라 공용 패키지(packages/ui)의 CSS에 선언되어 있고, 5개 앱이 함께 씁니다. 이 글꼴에는 글자뿐 아니라 아이콘 모양도 들어 있습니다. 로딩 속도를 올리려고 글꼴 표시 옵션(font-display)을 optional로 바꾸면, 글꼴이 늦게 도착할 때 그 페이지에서는 대체 글꼴로 고정됩니다. 그러면 첫 방문 때 아이콘이 빈 네모(□)로 보이거나 원래 글꼴이 나오지 않습니다.

## 왜 중요한가
LCP를 줄이려고 optional로 다시 바꾸면, 캐시가 없는 첫 방문자에게 폰트와 아이콘이 깨진 채로 운영에 나갑니다. 이 수정은 5개 앱에 모두 적용됩니다.

## 공책에 넣을 문장
BZNAVSans의 font-display는 fallback으로 유지하고 optional로 바꾸지 않는다 — 이 글꼴에는 아이콘 글리프도 들어 있어서, 첫 방문 때 글꼴이 늦게 오면 아이콘이 □로 보이고 폰트가 나오지 않는다. 선언은 packages/ui/src/styles/globals.css에 있어 5개 앱이 같이 쓰고, refund-web에서는 _document.tsx의 preload로만 조정한다.

## 어디서 배웠나
- plans/task/20261006-bznav-refund-fe-bznav-refund-fe-작업-pane-에서-지시.md — REF-3742 eb65e78b2에서 optional로 바꾼 뒤 brand-web 첫 방문에서 아이콘 글리프(U+E92C)가 □로 재현됨(issues/20261001-bznav-web-font-display-optional-icon-glyph.md). packages/ui/src/styles/globals.css:197-275의 @font-face 8개
