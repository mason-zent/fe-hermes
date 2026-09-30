---
title: /branch 스킬의 "계획서 없는 긴급 작업" 문구가 "계획서 없는 예외는 없다" 규칙과 어긋남
status: open
repo: hermes
agent:
kind: knowledge
severity: low
source: /feature·/bugfix 삭제 리뷰 2026-09-30 (reviewer 참고 사항)
plan:
pr:
fix:
reason:
---

`/branch` 스킬은 "계획서 없는 긴급 작업이면 사용자에게 확인한다"고 해 계획서 없는 작업이 있는 것처럼 읽힌다. `AGENTS.md` 5절은 "계획서 없이 작업하는 예외는 없다"(긴급 수정도 경량 계획서)라고 한다.

## 근거
- `.claude/skills/branch/SKILL.md:31`
- `AGENTS.md` 5절 첫 항목

## 할 일
- "긴급 작업이면 경량 계획서(`node scripts/new-plan.mjs`)를 먼저 만들고 대상은 사용자에게 확인한다" 식으로 맞춘다
