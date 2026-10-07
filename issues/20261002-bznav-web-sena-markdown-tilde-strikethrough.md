---
title: sena 답변 마크다운에서 물결표(~) 범위가 취소선으로 바뀌어 "1월 1일~6월 30일" 이 "1월 1일6월 30일" 처럼 보인다
status: open
repo: bznav-web/sena-web
agent: bznav-sena-fe
kind: code
severity: medium
source: plans/feature/20261001-bznav-web-앱-repo-패키지-zent-전환.md — 전체 QA(2026-10-02, bznav-sena-fe)
plan:
pr:
fix:
reason:
---

AI 답변에 기간·범위를 나타내는 `~` 가 두 개 이상 들어가면 `marked` 가 그 사이를 GFM 취소선(`<del>`)으로 바꾼다. 화면에서 물결표가 사라지고 사이 문장에 취소선이 그어져 날짜가 틀려 보인다(예: `1~3월분` → `13월분`). 세무 기한 안내라 오해 소지가 크다. zent 패키지 전환과는 무관하며 전환 전부터 같다.

## 근거
- `apps/sena-web/lib/utils/strings.ts:1-8` — `marked.setOptions({ breaks: true })` 뒤 `marked.parse`. 이번 전환에서 바뀌지 않음(diff 0, lock 의 marked 변경 0)
- 재현: `marked.parse("1기(1월 1일~6월 30일)는 7월 25일까지, 2기(7월 1일~12월 31일)")` → `<p>1기(1월 1일<del>6월 30일)는 7월 25일까지, 2기(7월 1일</del>12월 31일)</p>`
- QA: `/chat` 질문 "부가세 신고 기간이 언제인가요?" 답변 화면에서 "1월 1일6월 30일", "13월분은 4월 25일까지, 46월분은 …" 으로 보임(feature/zent-pkg-sena 로컬 next start)

## 할 일
- 단일 `~` 를 취소선으로 처리하지 않게 한다(예: marked tokenizer 의 `del` 을 `~~` 두 개일 때만 받게 확장, 또는 파싱 전 단일 `~` 이스케이프) — 방식은 추측, 확인 필요
- 운영(origin/prd-sena)에서도 같은지 확인
