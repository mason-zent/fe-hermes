---
title: 작업 흐름 다이어그램이 최신 archify showcase 검증을 통과하지 못함 — HTML 재생성 불가
status: open
repo: hermes
agent:
kind: diagram
severity: low
source: /feature·/bugfix 삭제 작업 2026-09-30
plan:
pr:
fix:
reason:
---

`docs/diagrams/hermes-flow.workflow.json` 을 archify(5ca9c12, 2026-09-30 clone)로 `validate --quality showcase` 하면 실패한다. 이번 변경 전 HEAD 버전도 똑같이 실패하므로 archify 쪽 검사가 새로 엄격해진 것으로 보인다(추측입니다). 그래서 `deliver` 가 HTML 을 다시 만들지 않아, 이번에는 카드 문구 한 줄만 json 과 같게 HTML 에 직접 맞췄다.

## 근거
- composition/proper-crossing: s1 issues→req 가 x1 route→… 와 교차
- composition/ambiguous-corridor: e6 pane→agent, s4 rules→agent, s5 agent→board 가 다른 선과 통로 공유
- composition/arrowhead-collision: e6 과 s6 화살촉이 도착점에서 겹침(간격 0px, 최소 11.2px)

## 할 일
- 화살표 포트·배치를 고쳐 showcase 검증을 통과시키고 `deliver` 로 HTML 재생성 (`docs/diagrams/README.md` 절차)
- 또는 docs/diagrams/README.md 에 사용할 archify 버전을 고정
