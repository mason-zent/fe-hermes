---
name: review
description: 지정 서비스의 현재 변경사항(uncommitted diff)에 대한 코드 리뷰를 수행합니다.
argument-hint: "리뷰 대상 (예: hub-fe 메시지 템플릿 변경, 또는 client-brics-hub)"
---

# 코드 리뷰

리뷰 대상: $ARGUMENTS

## 절차
1. 대상 레포를 확정한다 (에이전트 이름 또는 레포 이름 → 경로는 docs/services.md)
2. 관련 계획서가 있으면 경로를 찾는다 (`plans/`)
3. `reviewer` 디스패치: 계획서 경로(있으면) + 대상 레포 경로 전달
4. 리뷰 결과 보고 (승인 가능 / 수정 필요 + 항목)
5. 수정 필요 시 사용자 확인 후 해당 FE 에이전트에 배분
