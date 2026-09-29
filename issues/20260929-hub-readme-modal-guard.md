---
title: hub README 가 낡음 · 템플릿 모달에 제출 중 닫기 가드 없음
status: open
repo: client-brics-hub
agent: hub-fe
kind: code
severity: low
source: 지식 문서 점검 2026-09-29 (Claude·Codex 교차)
plan:
pr:
fix:
reason:
---

hub `README.md` 가 포트(13000, 실제 13003)·"`__generated__` 없어 build/typecheck 실패"(실제 259파일 추적)·공유 RootSidebar 서술에서 낡았다. 또 메시지 템플릿 생성 모달은 제출 버튼만 막고 `onOpenChange` 는 제출 중에도 닫는다 — 복사 원본으로 쓰이는 파일이라 같은 구멍이 퍼질 수 있다.

## 근거 (origin/prd fb5c7e3 점검)
- `README.md:10,70,83`(13000), `:53,91`(빌드 차단), `:49`(RootSidebar)
- `app/messages/templates/_components/TemplateCreateModal.tsx:33` — `isSubmitting` 검사 없이 `onClose()`, `:53` 버튼 비활성화만
- 곁들여: `templateFormSchema.ts` 주석 "모듈 매핑 없음" 은 `jest.config.ts:41` 스텁 매핑으로 낡음 · `lib/accessRequestSwr.ts` 는 생성물 `access-request` 와 공존 — 교체 가능 여부 확인 필요

## 할 일
- README 의 포트·빌드·사이드바 서술을 코드에 맞춘다
- `TemplateCreateModal` 의 `onOpenChange` 에 제출 중 가드
