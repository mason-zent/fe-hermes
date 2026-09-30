---
title: 작업 흐름 다이어그램이 최신 archify showcase 검증을 통과하지 못함 — HTML 재생성 불가
status: in_progress
repo: hermes
agent:
kind: diagram
severity: low
source: /feature·/bugfix 삭제 작업 2026-09-30
plan: plans/task/20260930-hermes-작업-흐름-다이어그램-archify-showcase-검증-통과.md
pr:
fix:
reason:
---

`docs/diagrams/hermes-flow.workflow.json` 을 archify(5ca9c12, 2026-09-30 clone)로 `validate --quality showcase` 하면 실패한다. **archify 버전 문제가 아니다**(2026-09-30 확인) — 기존 HTML 을 만든 2.17.0-dev.1 에서도 같은 8건이 난다. `b4a8137`(9/29 작업 흐름 다시 그림)부터 8건이고, 그 전에도 1건이 있었다. 그래서 `deliver` 가 HTML 을 다시 만들지 않아, 이번에는 카드 문구 한 줄만 json 과 같게 HTML 에 직접 맞췄다.

## 근거
- composition/proper-crossing: s1 issues→req 가 x1 route→… 와 교차
- composition/ambiguous-corridor: e6 pane→agent, s4 rules→agent, s5 agent→board 가 다른 선과 통로 공유
- composition/arrowhead-collision: e6 과 s6 화살촉이 도착점에서 겹침(간격 0px, 최소 11.2px)

## 할 일
- (2026-09-30 추가) 에이전트 pane 리뷰·push·PR 작업에서도 같은 8건으로 deliver 실패 — json 을 고친 노드 3개(review 태그·agent 이름·보조 문구)와 카드 3·4·5단계 문구를 HTML 에 글자만 직접 맞췄다. 재생성할 때 json 기준으로 덮어써지므로 따로 옮길 것은 없다
- 화살표 포트·배치를 고쳐 showcase 검증을 통과시키고 `deliver` 로 HTML 재생성 (`docs/diagrams/README.md` 절차)
- 또는 docs/diagrams/README.md 에 사용할 archify 버전을 고정
