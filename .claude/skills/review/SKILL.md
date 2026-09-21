---
name: review
description: 지정 서비스의 현재 변경사항(uncommitted diff)에 대한 코드 리뷰를 수행합니다.
argument-hint: "리뷰 대상 (예: hub-fe 메시지 템플릿 변경, 또는 client-brics-hub)"
---

# 코드 리뷰

리뷰 대상: $ARGUMENTS

## 절차
1. 대상 레포를 확정한다. 에이전트 이름이든 레포 이름이든 **매핑의 정본은 `hermes.config.json`** 이다. 경로는 `repos/<레포>`
2. 관련 계획서가 있으면 찾는다 (`plans/`). 있으면 Checkpoint 의 `Work ref` 로 어느 브랜치 작업인지 확인한다
3. `scripts/delegate.sh reviewer` 로 pane 을 열고, 그 안에서 계획서 경로(있으면)와 대상 레포를 알려준다
4. reviewer 는 표준 검증 스크립트(`scripts/verify/<레포>.sh`)를 **직접 다시 돌린다.** 에이전트가 보고한 결과와 다르면 그 차이가 핵심이다
5. 리뷰 결과 보고 (승인 가능 / 수정 필요 + 항목)
6. 수정 필요 시 사용자 확인 후 해당 FE 에이전트 pane 에서 이어서 지시한다
