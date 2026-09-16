# 지식 베이스 (docs/knowledge)

에이전트가 작업 전에 읽는 규칙과 레포 지식. **세 층**으로 나뉘고, 충돌하면 **아래 층이 우선**한다.

| 층 | 위치 | 내용 | 누가 갱신 |
|---|---|---|---|
| 1. 팀 공통 | `common/` | 모든 레포에 적용되는 코드·Git·보고 규칙 | 사람 (팀 합의) |
| 2. 레포 규칙 | `<레포>/rules.md` | 그 레포에서 공통과 **다른 점**과 레포 고유 규칙. 원문 문서가 있으면 링크 | 사람 + `/sync`(사실 부분) |
| 3. 레포 원문 | 각 레포 안 (`.ai/basic-rule.md`, `CLAUDE.md`, `frontend/README.md` 등) | 레포 개발자 전체를 위한 문서. hermes는 복제하지 않고 가리킨다 | 레포 소유자 |

레포 폴더에는 규칙 외에 지식 파일이 들어간다 (레포마다 순차 확장 중):

| 파일 | 내용 |
|---|---|
| `rules.md` | 레포 규칙 (2층) |
| `structure.md` | 디렉토리·라우트·주요 파일 맵 (`/sync`가 사실 부분 갱신) |
| `patterns.md` | "이런 건 이 파일을 보고 따라라" 대표 예시 경로 모음 |
| `gotchas.md` | 알려진 함정·이력. 작업 후 발견한 것을 사람과 헤르메스가 추가 |
| `workflows.md` | 반복 작업 절차 체크리스트 (새 화면 추가, 훅 추가 등) |

검증은 `scripts/verify/<레포>.sh`가 표준이다. 에이전트와 reviewer가 같은 스크립트를 돌려 같은 표 형식으로 보고한다.

폴더 배치:
```
docs/knowledge/
  common/                       팀 공통 규칙 (coding · git · reporting)
  client-brics-{refund,hub,care}/  rules · structure · patterns · workflows · gotchas
  web-op/                       같은 5종
  zent-packages/                같은 5종 (frontend/ 만)
  bznav-web/
    rules.md · common.md · gotchas.md   레포 공통 (환경·앱 표·Relay·검증표)
    <앱>/                        refund-web · care-web · brand-web · sena-web · plus-web — structure · patterns · workflows · gotchas
    packages/                    @repo/* 공유 패키지 — 같은 4종
```
레포마다 패턴은 다르다. hub의 항목을 복제하지 않고 **각 레포 코드에서 반복되는 것**만 patterns.md 에 적는다. "설치만 되어 있고 사용처가 없는" 라이브러리는 관례로 적지 않고 gotchas 에 기록한다.

에이전트 md(`.claude/agents/*.md`)는 요약과 진입점이고, 상세는 여기다. 에이전트는 `common/*` → `<레포>/rules.md` → 레포 원문 순으로 읽는다.

## 검증 기록

2026-09-16 지식 확장 인계 검증의 기준 커밋·확인 범위·제한은 [verification-20260916.md](verification-20260916.md)에 기록한다. 패턴의 사용 횟수는 조사 시점의 스냅샷이며, 사용 빈도만으로 팀 규칙을 새로 만들지 않는다.
