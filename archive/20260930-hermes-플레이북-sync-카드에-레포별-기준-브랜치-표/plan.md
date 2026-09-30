# 플레이북 sync 카드에 레포별 기준 브랜치 표

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 11:13 / 헤르메스 → hermes
- Status: done
- Agent: (헤르메스 직접 — 워크스페이스 문서)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (헤르메스 자체 문서)

### Progress
- [x] 상태 확인 — main, 미커밋 없음
- [x] playbook `/sync` 카드: 레포별 sync 기준(branch) · 작업 기준(prBase) 표 추가, dev 미배포분은 반영 안 된다는 설명, flow 를 스킬 절차(정본 갱신 → 파생 생성)에 맞춤, "언제"를 운영 배포 기준으로 → 확인: hermes.config.json 과 대조
- [x] FAQ `/sync` 답변에 packages dev · 모바일 앱 prd 추가 + 카드 링크

### Next
1. 없음

### Blocked
- 없음

### Validation
- 레포 검증 스크립트 대상 아님. `node scripts/build-derived.mjs --check` 통과(파생 문서 지문과 일치)

## 지시
> 플레이북에서 슬래시 커맨드에 /sync 에서 어떤 브랜치 기준으로 상태에 맞게 고치는지 적어두는게 좋을것같아

## 결과
- docs/playbook.html — /sync 카드 기준 브랜치 표·설명, FAQ 한 줄
- 남은 위험: 표는 hermes.config.json 을 손으로 옮긴 것(생성 마커 아님). config 가 바뀌면 같이 고쳐야 한다

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
