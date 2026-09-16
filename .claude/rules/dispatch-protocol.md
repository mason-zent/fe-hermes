# 디스패치 프로토콜

## 전제
**작업계획서(plans/*.md)가 사용자 승인을 받은 후에만 디스패치한다.** (사용자가 명시적으로 "계획서 없이 바로"라고 한 긴급 수정만 예외)

## 방식
Agent 도구에 `subagent_type`으로 에이전트 이름을 지정한다.

| 대상 레포 | subagent_type |
|-----------|---------------|
| client-brics-refund | `refund-fe` |
| client-brics-hub | `hub-fe` |
| client-brics-care | `care-fe` |
| web-op | `op-fe` |
| bznav-web `apps/refund-web` | `bznav-refund-fe` |
| bznav-web `apps/care-web` | `bznav-care-fe` |
| bznav-web `apps/brand-web` | `bznav-brand-fe` |
| bznav-web `apps/sena-web` | `bznav-sena-fe` |
| bznav-web `apps/plus-web` | `bznav-plus-fe` |
| bznav-web `packages/*` | `bznav-packages-fe` |
| zent-packages `frontend/` | `packages-fe` |
| 교차 리뷰 (읽기 전용) | `reviewer` |

bznav-web 은 한 레포지만 앱마다 에이전트가 다르다. 같은 레포의 두 앱을 동시에 디스패치할 때는 **서로 다른 파일만 만지는지**(공통 `packages/**` 는 bznav-packages-fe 단독) 계획서에서 확인한 뒤 병렬로 보낸다. 공유 패키지(zent-packages) 변경이 소비 레포 작업과 함께 필요하면 packages-fe 를 **먼저** 끝내고 changeset·스냅샷 태그를 소비 측 에이전트에 넘긴다.

서로 독립적인 서비스 작업은 **한 응답에서 동시에 호출**해 병렬로 돌린다.

## 프롬프트 필수 포함 사항
- 승인된 계획서 경로 (`plans/유형/YYYYMMDD-제목.md`)
- 해당 에이전트가 담당할 작업 범위 (계획서의 작업 배분표 중 자기 행)
- 관련 파일 경로 (파악된 경우)
- 사용하는 API 엔드포인트·응답 타입 (신규/변경이 있으면 spec 그대로)
- 다른 서비스 작업과의 연관성 (공통 UI 패턴 맞추기 등)
- "커밋하지 말 것", "담당 레포 밖 수정 금지" 리마인드

## 결과 수신 후
- 에이전트 보고에서 변경 파일 목록, 검증 명령 결과(lint/typecheck/test), 남은 위험을 확인
- 검증 실패나 범위 밖 수정 필요 사항은 사용자에게 그대로 전달 (숨기지 않음)
- 여러 서비스에 걸친 작업은 `reviewer`로 교차 정합성 확인
