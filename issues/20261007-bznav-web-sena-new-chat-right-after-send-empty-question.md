---
title: sena 회원이 질문을 보내자마자 "새 채팅"을 누르면 질문 없이(messages:[]) 전송돼 질문·답변이 방에 남지 않는다
status: open
repo: bznav-web/sena-web
agent: bznav-sena-fe
kind: code
severity: medium
source: plans/task/20261007-bznav-sena-fe-QA-흐름-씬-채우기-sena-web.md — QA 흐름 씬 20 실행(2026-10-07, dev 서버)
plan:
pr:
fix:
reason:
---

방에서 질문을 보낸 직후(점검 확인 `/api/maintenance` 응답 전) 헤더 "새 채팅"으로 옮기면, completions 요청이 `{"messages":[],"roomUuid":"<그 방>"}` 로 나간다. 질문이 빠진 요청이라 그 질문·답변이 방 기록에 남지 않는데, 완료 배너("답변이 완료됐어요")는 뜨고 배너를 누르면 그 질문이 없는 방이 열린다.

## 근거 (origin/dev `178ecb251`)
- `apps/sena-web/lib/hooks/use-chat-message.ts:570-580` — `sendMessage` 가 `await checkMaintenance()` 를 기다린 뒤 `runChatRequest` 를 부른다
- `apps/sena-web/lib/hooks/use-chat-message.ts:457` — `runChatRequest` 는 그때의 `store.get(loadedChatContentAtom)` 으로 본문을 만든다. 그 사이 새 채팅으로 옮기면 비어 있다
- 재현 기록: `.qa-runs/20261007-135926-sena-web/live.jsonl` — 순서대로 completions(첫 질문, roomUuid null) → 이벤트 `topnav_new-chat_clicked` → completions `{"messages":[],"roomUuid":"d26ac81f-…"}`
- 같은 날 씬 20 이 이 단계까지 간 6회 중 3회 배너로 들어간 방에 두 번째 질문이 없었다. 남은 방을 2분 뒤 다시 열어도 첫 질문만 있었다(b4eb8e3c, 스크린샷 `.qa-runs/20261007-133810-sena-web/shots/`)

## 할 일
- 질문을 보낸 순간의 대화 내용(`newContent` 포함)으로 요청 본문을 만들어 두고, 점검 확인 뒤에는 그 값을 쓴다 — 방식은 추측, 확인 필요
- 사용자가 실제로 이렇게 누를 수 있는 간격(점검 확인 왕복 시간)인지 운영에서 확인
- 고치면 QA 씬 20 의 "질문 요청이 나가길 기다림(2초)" 단계를 빼고 바로 새 채팅으로 옮겨 회귀 확인

## 후속
- 없음
