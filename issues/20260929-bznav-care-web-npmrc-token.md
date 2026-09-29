---
title: care-web .npmrc 에 인증 토큰이 평문으로 커밋됨
status: open
repo: bznav-web/care-web
agent: bznav-care-fe
kind: check
severity: high
source: 지식 문서 점검 2026-09-29 (Claude·Codex 교차)
plan:
pr:
fix:
reason:
---

bznav-web 레포에 루트 `.npmrc` 와 `apps/care-web/.npmrc` 가 커밋돼 있고, 둘 다 `_authToken=` 항목이 평문이다(값은 확인·출력하지 않았다). 레포를 읽을 수 있는 사람은 패키지 레지스트리 토큰을 얻을 수 있다.

## 근거 (origin/dev 7b0f1bc 점검)
- `git ls-files | grep npmrc` → `.npmrc`, `apps/care-web/.npmrc`
- 헤르메스 문서의 출력·커밋 금지 목록에는 경로만 넣었다(`docs/knowledge/bznav-web/rules.md`)

## 할 일
- 토큰이 실제 유효한 값인지, 어느 레지스트리 권한인지 사용자·담당자가 확인(값은 채팅·문서에 옮기지 않는다)
- 유효하면 폐기·재발급, 파일은 `${NPM_TOKEN}` 같은 환경 변수 참조로 바꾸는 방안을 정한다 — 코드 변경은 bznav-care-fe(루트 .npmrc 는 bznav-packages-fe)
