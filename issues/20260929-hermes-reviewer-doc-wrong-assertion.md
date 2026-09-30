---
title: reviewer 가 "문서가 코드와 다르면 문서가 틀린 것"이라고 단정 — 기준 브랜치 차이를 무시
status: done
repo: hermes
agent:
kind: knowledge
severity: low
source: Karpathy 지침 검토 2026-09-29 (Codex 교차)
plan:
pr:
fix: ec2212a
reason:
---

`reviewer.md` 는 문서와 코드가 다르면 "코드가 맞고 문서가 틀린 것"이라고 한다. 그런데 `AGENTS.md` 1절은 문서가 운영 기준 브랜치로 만들어져 작업 트리와 다를 수 있고 그건 문서 오류가 아니라고 한다. 리뷰어가 작업 브랜치의 임시 구현을 근거로 knowledge 를 틀렸다고 보고할 수 있다(2.4 "작업 브랜치 임시 구현을 운영 knowledge 에 덮어쓰지 않는다"와도 어긋남).

## 근거
- `.claude/agents/reviewer.md:15`
- `AGENTS.md:30` (기준 브랜치 = 운영 반영분, 차이는 문서 오류 아님), `AGENTS.md` 2.4 마지막 문단

## 할 일
- Codex 제안 문안으로 교체: "현재 구현 사실은 대상 트리의 코드·설정과 검증 결과로 판단한다. 문서와 다르면 먼저 양쪽의 대상 경로·기준 ref 를 확인하고, 구현 차이와 문서 오류를 구분해 보고한다. 요구사항·권한·보안 규칙은 코드와 다르다는 이유로 무효화하지 않는다"
