---
title: /bugfix 는 정식 계획서가 기본인데 CLAUDE.md·AGENTS.md 는 버그 하나를 경량으로 분류
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

`/bugfix` 스킬은 정식 계획서(`plans/bugfix/…md` + `.html`)를 기본으로 하고 사용자가 "바로 고쳐"라고 해야 경량으로 간다. 반면 `CLAUDE.md` 1단계와 `AGENTS.md` 5절은 "버그 하나"를 경량 계획서 대상으로 둔다. 같은 버그 요청이 진입 경로에 따라 다른 계획서로 간다.

## 근거
- `.claude/skills/bugfix/SKILL.md:17-21` (2단계: 계획서 작성)
- `CLAUDE.md` 1단계 "경량 — 문구·버그 하나·…"
- `AGENTS.md:166` "문구 수정·버그 하나·확인·조사·긴급 수정은 경량 계획서"
- `docs/plan-template-light.md:8`

## 할 일
- 한쪽으로 맞춘다. Codex 제안 문안: "계획서 종류는 `AGENTS.md` 5절과 `docs/plan-template-light.md` 분류를 따른다. 여러 레포·API·구조 변경이나 사용자 결정이 필요하면 정식, 그 밖의 단일 버그 수정은 경량. 경량은 사용자 지시가 곧 승인"
