# 현황판 제목 '현황판' 으로 + 헤더에 AI 사용량 게이지(5시간·주간)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 14:16 / 헤르메스 → hermes
- Status: done
- Agent: hermes
- Issue: 없음
- Work ref: hermes 메인 체크아웃 (main) — 헤르메스 워크스페이스 자체 작업, 디스패치 없음

### Progress
- [x] 제목 '헤르메스 현황판' → '현황판' (index.html `<title>`·`<h1>`)
- [x] statusline 래퍼 `scripts/board/statusline.sh` — rate_limits 를 `.board-usage.json` 으로, 입력은 Orca 훅에 그대로 넘김
- [x] `~/.claude/settings.json` statusLine → 래퍼 (백업 `settings.json.bak-hermes-usage-20260929`)
- [x] server.mjs `readUsage()` → `header.usage`, index.html 헤더 게이지(로고·게이지·%·초기화까지 남은 시간, 10분 넘으면 흐리게)
- [x] 설치된 AI CLI 자동 감지(PATH) — Claude(statusline 파일)·Codex(~/.codex/sessions 최신 rollout 의 rate_limits) 게이지 (사용량을 못 읽는 CLI 는 표시하지 않음)
- [x] 게이지 다듬기 — AI 이름·창 이름(5시간/주간) 빼고 로고(simple-icons SVG 인라인)만, 한 줄, 초기화 시간 `↻ 3h 46m` 형식
- [x] 마지막 변화·마지막 sync → '실시간' 호버 말풍선
- [x] '지금 동작 중' 카드 한 줄 + 가로 스크롤(다시 그려도 스크롤 위치 유지)
- [x] 테스트 서버(4799)로 API 응답·화면 캡처 확인, 실제 statusline 이 파일 쓰는 것 확인

### Next
1. 떠 있는 현황판(4700) 재시작 후 화면 확인 (`/board stop` → `/board`)

### Blocked
- 없음

### Validation
- `node --check scripts/board/server.mjs` 통과
- 래퍼: 가짜 입력(ISO·epoch 초 혼합)·rate_limits 없는 입력 모두 rc=0, 파일 정상
- 실제 세션: `{"seven_day":{"used_percentage":18,"resets_at":1790838000}}` 기록 확인 (이 시점엔 five_hour 없음)
- 화면 캡처(headless Chrome, 4799): Claude 주간 18% · Codex 주간 18%(흐림, 13:47 기준)

## 지시
> (지시문 없음 — pane 에서 대화로 지시)

## 결과
- 변경: `scripts/board/index.html`, `scripts/board/server.mjs`, `scripts/board/statusline.sh`(신규), `.gitignore`, `~/.claude/settings.json`(레포 밖)
- 위험: Claude 값은 statusline 입력에 rate_limits 가 올 때만 갱신 — 실측상 자주 오지 않음(14:20 이후 미갱신). 전역 statusLine 을 바꿨음 — 모든 Claude 세션이 래퍼를 거친다. jq 없으면 기록만 건너뜀

## Commits
- 2026-09-29 · hermes · main · e88ae7f · feat: 현황판 헤더에 AI 사용량 게이지 — 설치된 CLI 감지, 로고·게이지·%·초기화까지 남은 시간 · node --check·캡처 확인 · push 완료(origin/main)
