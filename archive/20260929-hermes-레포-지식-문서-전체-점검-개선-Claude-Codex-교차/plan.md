# 레포 지식 문서 전체 점검·개선 (Claude+Codex 교차)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 17:22 / 헤르메스
- Status: done
- Agent: hermes
- Issue: 없음
- Work ref: hermes `main` (미커밋, 앞선 rn-app 추가분과 함께) · 코드는 scratchpad/co/* 운영 기준 detached 체크아웃 12개(읽기만)

### Progress
- [x] 범위 — 헤르메스 쪽 레포 문서(docs/knowledge/** · 에이전트 프로필). 레포 안 문서는 제외(이슈 후보로)
- [x] 운영 기준 체크아웃 12개 → 점검 후 제거
- [x] 교차 점검 — 지적 Claude 211(G1 44·G2 87·G3 80) / Codex 3그룹 독립
- [x] 합쳐 수정 — 반영 G1 72 · G2 78 · G3 86, 보류 0·4·5 (기록 scratchpad/review/changes-G*.md)
- [x] Codex 수정 diff 재검토 — G1 2 · G2 5 · G3 4건 → 헤르메스가 모두 반영
- [x] bznav-web 지문 확정(refund-web 06c3fbf→cf69fdb, dev 1c4e7eb) · refund-web 다이어그램 7장 repin·재생성
- [x] 보고 · 커밋 a94a6c4 push (sync 지문에 앱 라이브러리 추적 추가 포함)
- [x] 이슈 후보 — 사용자 결정: 레포 5건 이슈 등록(b54a970), 스크립트 6건 바로 수정(6e55397) — plans/task/20260929-hermes-점검-남은-항목-…md

### Next
1. 없음

### Blocked
- 없음

### Validation
- 문서 작업이라 검증 스크립트 대상 아님. build-derived --check 일치 · check-diagrams 전부 ✅ · refund-web 다이어그램 deliver exit 0

## 지시
> 지금 모든 레포들 문서 확인해보고 개선해야한다거나 추가해야한다거나 불필요한부분 있는지 체크해서 수정하자 codex랑 같이 체크해서 수정해

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-09-29 · hermes · main · a94a6c4 · 문서 점검·지문 추적 추가 · pushed
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
