# 디스패치 프로토콜

## 전제
**작업계획서(plans/*.md)가 사용자 승인을 받은 후에만 디스패치한다.** (사용자가 명시적으로 "계획서 없이 바로"라고 한 긴급 수정만 예외)

## 디스패치 전에 — 작업 브랜치부터

`/branch <티켓> <대상...>` 으로 작업 브랜치·워크트리를 만들고 시작한다. 로컬 트리는 브랜치가 제각각이라 확인 없이 보내면 남의 작업 브랜치나 미커밋 변경 위에 얹힌다. base 는 `hermes.config.json` 의 `prBase`(개발 브랜치)이고 문서 기준(`branch`, 운영 반영분)과 다르다.

기본이 **워크트리**(`~/orca/workspaces/<레포>/<슬러그>`)라 메인 체크아웃을 건드리지 않는다. 레포가 지저분해도 시작할 수 있고 여러 작업을 동시에 돌릴 수 있다. 만든 경로로 `scripts/delegate.sh <에이전트> --cwd <워크트리>` 한다. **건너뛴 레포에는 디스패치하지 않는다.**

## 방식
**배치**: workspace = 레포 / 그 안의 **한 탭에 pane 을 나란히**.

- 담당 레포의 workspace 를 `label` 로 찾아 없으면 만든다. 그 workspace 의 활성 탭에 pane 을 덧붙인다
- **워크트리마다 탭을 가르지 않는다.** 한 화면에서 동시 작업 상황이 다 보이는 쪽이 낫다
- 각 pane 은 `🤖 <에이전트> · <브랜치>` 로 이름이 붙는다. 브랜치는 **에이전트가 만질 레포**에서 읽으므로 나란히 놓여도 어느 작업인지 이름만 보고 안다
- 담당 레포가 없는 에이전트(`reviewer`)나 단발 조사는 `--here` 로 지금 탭에서 쪼갠다
- **레포를 넘는 작업은 순차로 보낸다.** 공유 패키지를 먼저 끝내고 그 결과를 소비 레포 에이전트에 넘긴다. 두 workspace 를 동시에 띄우지 않는다
- 어느 workspace·탭에 띄웠는지 사용자에게 한 줄 알린다

**기본은 보이는 pane**: `scripts/delegate.sh <에이전트명>` 으로 herdr pane 에 `claude --agent <이름>` 세션을 띄운다(사용자가 진행 과정을 볼 수 있다). **프롬프트 없이 열어 그 pane 안에서 작업을 지시하는 것이 기본**이다 — 대화를 이어가며 범위를 좁힐 수 있다. 한 번에 끝나는 조사라면 두 번째 인자로 프롬프트를 실어 보낸다. 워크트리에서 작업하면 `--cwd <경로>`. 여러 에이전트를 병렬로 보낼 때는 pane 을 여러 개 연다. 결과는 `herdr pane read <id>` 로 읽고, 완료 대기는 `herdr pane wait-output` 또는 사용자에게 알린다.

부득이 Agent 도구(백그라운드, `subagent_type`)를 쓸 때는 `scripts/monitor-pane.sh`(사용자는 `/monitor`) 로 실시간 로그 모니터를 pane 에 띄우고, 어느 pane 인지 사용자에게 한 줄 알린다. 이미 모니터 pane 이 있으면 새로 만들지 않고 그 pane 에서 다시 실행된다.

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
