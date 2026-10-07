---
title: sena 답변에서 따옴표로 끝나는 굵은 글씨 뒤에 한글이 붙으면 "**" 가 그대로 보인다
status: open
repo: bznav-web/sena-web
agent: bznav-sena-fe
kind: code
severity: low
source: plans/task/20261007-bznav-sena-fe-QA-흐름-씬-채우기-sena-web.md — QA 흐름 씬 20 실행(2026-10-07, dev 서버 실제 답변)
plan:
pr:
fix:
reason:
---

실제 답변 "기준은 **1억 400만 원 '이하'가 아니라 '미만'**입니다" 가 굵게 바뀌지 않고 `**` 기호가 그대로 화면에 보였다. 닫는 `**` 앞이 문장부호(`'`)이고 뒤가 한글 글자라 CommonMark 강조 규칙(right-flanking)상 닫는 표시로 인정되지 않는 것으로 보인다(추측). 한국어 답변에서 자주 생길 수 있는 모양이다.

## 근거
- 스크린샷 `.qa-runs/20261007-132810-sena-web/shots/scenario-20-회원-질문-방생성-관리-삭제.desktop.stopped.png` (두 번째 문단)
- `apps/sena-web/lib/utils/strings.ts:3-11` — `marked.parse`(breaks: true) 그대로 쓴다 (origin/dev `178ecb251`)

## 할 일
- `marked.parse("**1억 400만 원 '이하'가 아니라 '미만'**입니다")` 로 재현 확인
- 고칠지·어떻게(서버 답변 후처리 / marked 확장) 정하기 — 방식은 확인 필요

## 후속
- 없음
