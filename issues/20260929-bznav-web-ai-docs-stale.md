---
title: bznav-web 원문 문서가 낡음 — create-pr 스킬 dev-ecs base, basic-rule constant/ 경로
status: open
repo: bznav-web/packages
agent: bznav-packages-fe
kind: code
severity: medium
source: 지식 문서 점검 2026-09-29 (Claude·Codex 교차)
plan:
pr:
fix:
reason:
---

레포 원문 `.github/skills/create-pr/SKILL.md` 가 아직 폐기된 `dev-ecs` 계열로 PR base 를 추론한다. `.ai/basic-rule.md` 와 `.github/agents/care-web.agent.md` 는 care-web 경로를 옛 `constant/paths.ts` 로 적는다(실물 `constants/`). README 배포 절도 ECS 앱 목록이 현재와 다르다(brand 포함·sena 누락). 원문을 따르는 도구(Copilot·다른 에이전트)가 틀린 base·경로로 작업한다.

## 근거 (origin/dev 7b0f1bc 점검)
- `.github/skills/create-pr/SKILL.md:3,22,33-35,62,74` — `dev-ecs` base 추론
- `.ai/basic-rule.md:157`, `.github/agents/care-web.agent.md:27` — `constant/paths.ts`
- `.ai/basic-rule.md` 6.2 "care generated artifact 커밋 대상인지 확인" — `.gitignore` 로 이미 정해짐
- 헤르메스 문서는 "PR 은 헤르메스, base 는 prBase" 로 적어 두었다(`docs/knowledge/bznav-web/rules.md`·`gotchas.md`)

## 할 일
- create-pr 스킬의 base 규칙을 현재 브랜치 전략으로, basic-rule·care-web agent 의 경로를 `constants/` 로, README 배포 절을 현재 ECS 목록으로 — 레포 루트 문서라 bznav-packages-fe(루트 설정 허용 범위) 또는 사용자 확인
