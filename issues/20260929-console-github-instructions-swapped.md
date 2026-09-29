---
title: refund·care 콘솔의 .github 지침 파일 두 개가 이름과 내용이 뒤바뀜
status: open
repo: client-brics-refund
agent: refund-fe
kind: code
severity: low
source: 지식 문서 점검 2026-09-29 (Claude·Codex 교차)
plan:
pr:
fix:
reason:
---

`client-brics-refund` 와 `client-brics-care` 의 `.github/git-commit-instructions.md` 에는 **Copilot 코드 규칙**이, `.github/copilot-instructions.md` 에는 **커밋 규칙**이 들어 있다. Copilot·사람 모두 엉뚱한 파일을 읽는다. Copilot 쪽 내용도 hub 에서 옮겨 온 잔재(Next 14·React 18·`@/swr`·nuqs·루트 `CLAUDE.md` 참조)라 낡았다.

## 근거
- refund origin/prd `1eb6e63` — `.github/git-commit-instructions.md:1` "# GitHub Copilot Instructions for brics-refund-web", `.github/copilot-instructions.md:1` "## 메시지 내용"(커밋 규칙 `:9-13`)
- care origin/prd `8ed10df` — `.github/git-commit-instructions.md:1` "# GitHub Copilot Instructions for brics-care-web", `.github/copilot-instructions.md:1` "## 메시지 내용"(`:12-13`)
- 헤르메스 문서는 이미 뒤바뀐 사실을 적어 두었다(`docs/knowledge/client-brics-{refund,care}/gotchas.md`)

## 할 일
- 두 레포 모두 파일 이름을 서로 바꾸고(내용 그대로), Copilot 규칙의 낡은 스택·`@/swr`·nuqs 서술을 현재 코드에 맞춘다 — refund 는 refund-fe, care 는 care-fe (레포마다 따로 PR)
- 고친 뒤 헤르메스 knowledge 의 "뒤바뀜" 서술을 걷어 낸다
