# 첫 실행 시 setup 자동 점검 (SessionStart 훅)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 09:55 / reviewer
- Status: done
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes 메인 체크아웃 · main (헤르메스 자체 설정·스크립트)
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p36 (reviewer)

### Progress
- [x] 상태 확인 — main, 미커밋 없음
- [x] SessionStart 훅 추가(scripts/hooks/setup-check.py + .claude/settings.json) → 확인: 가짜 hermes 폴더로 입력 JSON 5종 → 성공 조건: 다 연결=무출력 · 첫 실행=systemMessage+additionalContext · agent_type/다른 cwd=무출력 · 깨진 입력=exit 0 — 모두 통과
- [x] README·playbook 시작하기 안내 추가
- [x] reviewer 검토(w2:p36) → 승인, 경미 제안 반영: CLAUDE_AGENT 조건 제거 · "환경 설정이라 계획서 없이" 명시 · 문서에 "기본 위치는 레포를 찾았을 때만"

- [x] 사용자 피드백 "묻지 말고 자동화" → 기본 위치에서 찾은 레포는 훅이 setup.sh 로 바로 연결, 못 찾은 레포만 위치 질문. 확인: 가짜 hermes 3종(전부 찾음=자동 연결 7개 · 재실행=무출력 · 일부 없음=찾은 것 연결+없는 것만 질문) 통과. 문서에서 수동 setup 단계·"잊어도 괜찮습니다" 제거

### Next
1. 없음

### Blocked
- 없음

### Validation
- 레포 검증 스크립트 대상 아님. 훅 단위 확인 5종 통과. 실제 claude 새 세션에서의 동작은 실행 못 함(첫 실행 상태를 재현하려면 repos 링크를 지워야 함)
- agent_type 필드는 reviewer 가 실측 확인(2026-09-30, claude -p --agent). reviewer 가 비정상 입력·config 없음·resume/compact 까지 재확인, 전부 exit 0
- 64abf8f(자동 연결로 변경)는 reviewer 리뷰를 거치지 않았다 — 승인은 e1d3dbc 까지. 검증 근거는 헤르메스의 가짜 hermes 3종 확인뿐

## 지시
> setup.sh 를 처음 실행 안 했으면 claude 켰을 때 알아서 점검하고 물어보게 해 달라

## 결과
- 변경 파일: `scripts/hooks/setup-check.py`(신규) · `.claude/settings.json`(SessionStart 훅) · `README.md` · `docs/playbook.html`
- 요약: 헤르메스 세션(cwd = hermes 루트, `agent_type` 없음, source startup/clear)에서만 `repos/` 링크를 점검한다. 기본 레포 루트에서 찾은 레포는 setup.sh 로 바로 연결하고, 못 찾은 레포만 위치를 묻는다(64abf8f). FE·reviewer 세션과 워크트리 cwd 에서는 동작하지 않고, 어떤 오류에도 exit 0
- 남은 위험: 링크가 빠진 상태의 실제 새 세션 동작은 실행 못 함(재현하려면 메인 체크아웃 repos 링크를 지워야 함). 64abf8f 는 reviewer 리뷰를 거치지 않음

## Commits
- 2026-09-30 · hermes · main · e1d3dbc · 첫 실행 점검 SessionStart 훅 · 훅 단위 확인·reviewer 승인 · push 됨
- 2026-09-30 · hermes · main · 64abf8f · 자동 연결로 변경(묻지 않음) · 가짜 hermes 3종 통과 · push 됨
