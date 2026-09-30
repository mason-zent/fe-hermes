# 작업 흐름 다이어그램 archify showcase 검증 통과

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 11:04 / 헤르메스
- Status: done
- Agent: (정해지지 않음)
- Issue: archive/20260930-hermes-flow-diagram-archify-validate/issue.md
- Work ref: hermes 메인 체크아웃 · main (docs/diagrams/hermes-flow.workflow.json — 아직 수정 안 함, 실험은 스크래치패드)

### Progress
- [x] 원인 조사 — archify 버전 문제 아님: 2.17.0-dev.1(기존 HTML 생성 버전)에서도 같은 8건 실패. 이력상 b4a8137(9/29 작업 흐름 다시 그림)부터 8건, 그 전(707cca2)에도 1건(rules·know 선 통로 공유)
- [x] 구조 원인 — agent 노드(fe col5)에 선 6개(pane·rules·know 들어옴, review·commitstop·board 나감)가 몰리고 pane↔agent 간격 38px 에 e6 라벨이 안 들어가 e6 가 agent 오른쪽으로 돌아 들어감
- [x] 시도(검증 자동 반복, 약 1,000 조합): 선 방향·경로 프리셋·라벨 제거·노드 폭·rules/board/know 자리 순열·s4 대상·그룹 범위·s1 대상 변경 → s1 을 top→bottom 으로 고정하면 agent 주변 겹침은 전부 사라지지만 s1(issues→req)×x1(route→outofscope) 교차 1건이 끝까지 남음. x1 은 곧은 선·위→아래 고정이 모두 "readable route feasibility" 위반
- [x] 방향 결정(사용자) → **D안**: 지금 json 은 standard 품질에서 검증 0건 통과(showcase 만 8건 — 선 간격 등 모양새 기준). 작업 흐름 다이어그램만 --quality standard 로 deliver, README 명령 변경, 이슈 닫기. 서비스 다이어그램은 showcase 유지
- [x] 다른 세션 커밋(f5e16a7) 확인 → README 명령 standard 로 → deliver standard(검증 0건, 최신 카드 문구 반영) → 이슈 done

### Next
1. 없음

### Blocked
- 없음

### Validation
- archify 3.0.1 · 2.17.0-dev.1 validate showcase — 현재 json 둘 다 8건 실패. 최선 조합 1건(s1×x1 교차)

## 지시
> 열린 이슈 중 헤르메스 이슈만 진행

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-09-30 · hermes · main · b2e7aea · 흐름 다이어그램 standard 재생성 · validate standard 0건 · push 됨
