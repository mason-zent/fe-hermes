# bznav-rn-app 에이전트 추가 — 레포 등록·지식 문서·다이어그램

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 17:13 / 헤르메스
- Status: done
- Agent: 헤르메스(문서) + 백그라운드 문서 작업자 2(지식 문서 · 다이어그램)
- Issue: 없음 (작업 중 찾은 것 → issues/20260929-bznav-rn-app-{eslint-config,webview-origin,committed-keys,channeltalk-qa-flag}.md)
- Work ref: hermes `main` · 커밋 e310a1c(+ a94a6c4 문서 점검) · 레포 코드는 읽기만 — origin/prd a161710
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p2Z (reviewer)

### Progress
- [x] 레포 확인 — 로컬 메인 체크아웃은 2025-12 에 멈춘 `main`(expo-router·Expo 53). 운영은 `prd`(Expo 55·RN 0.83·React Navigation·`src/`). 최근 feature·release 는 모두 prd 분기 → branch·prBase 둘 다 prd
- [x] 등록 — `hermes.config.json` 항목, `repos/bznav-rn-app` 링크, delegate.sh 별칭, `.claude/agents/bznav-rn-app.md`
- [x] 검증 스크립트 `scripts/verify/bznav-rn-app.sh` — prd 에서 실행(아래 Validation)
- [x] 지식 문서 5종 `docs/knowledge/bznav-rn-app/`
- [x] 문서 표 — AGENTS·CLAUDE·README·playbook·dispatch-protocol·services.md(모바일 앱 절), build-derived 기준 커밋 표
- [x] sync 지문 생성(pending `bznav-rn-app.json`) — accept 는 커밋 직전
- [x] 다이어그램 기본 3장(구조·화면 맵·요청 흐름) validate ok · index 카드
- [x] 다이어그램 심층 번들 `docs/diagrams/rn-app/`(탭 5장 9/9, 화면 37/37 누락·중복 0) · 서비스 가이드 `guides/bznav-rn-app.md`
- [x] 결과 확인 → sync accept(bznav-rn-app) → 임시 체크아웃 제거
- [x] 커밋·push (e310a1c · a94a6c4)
- [x] reviewer(w2:p2Z) 리뷰 — 심각 1: scripts/verify/bznav-rn-app.sh lint 분기가 배열을 unset·재구성해, lint 가 첫 단계면 bash 3.2 + set -u 에서 unbound variable 로 죽음
- [x] 사용자 요청 "심각 항목 고쳐줘 — codex랑 같이 체크" → _lib.sh 에 mark_skipped(그 자리에서 건너뜀으로, 엄격 판정은 skip_step 과 같게) 추가, rn-app 스크립트가 호출. 재현(bash 3.2): 옛 방식 unbound variable 로 죽음 / 새 방식 일반 ⏭·엄격 ❌·엄격+allow-skip ⏭ ✅
- [x] Codex 교차 확인 — 문제 없음(bash 3.2 원래 오류 재현, 수정본 60개 조합에서 엄격·허용·다른 단계 ❌ 보존·로그 유지 ✅)
- [x] reviewer(w2:p2Z) 재검증 — 심각 해결로 판단(추측: 결론부만 확인 — 화면 기록이 잘렸다), 중간 4건
- [x] 중간 반영: (a) 검증 스크립트에 origin/prd 포함 가드(옛 main 이면 ⏭/엄격 ❌) (b) Next·Commits 정리 (c) gotchas 딥링크 v1 설명을 includes 부분 문자열로 정정 (d) webview-origin 이슈 근거 파일:줄
- [x] reviewer 재검증(중간 4건) — (a) 가드가 움직이는 origin/prd 기준이라 prd 에 PR 이 머지되면 정상 브랜치도 걸림
- [x] (a) 재수정: 트리 구조로 판정(src/navigation/RootStackNavigator.tsx 있고 app/_layout.tsx 없음 = prd 계열, 전환 88329e4), 뒤처짐은 "N커밋 뒤" 안내만 — 시험: 옛 main ⏭·엄격 exit 1 ✅ / 현 origin/prd 가드 없음 ✅ / origin/prd~1 가드 없음·6커밋 뒤 안내 ✅
- [x] 낮음: Next 중복 줄, Issue 줄에 channeltalk-qa-flag, linkHandler.ts:127 을 딥링크 v1 과 나눠(웹뷰 링크 클릭 분류) gotchas·이슈에
- [x] reviewer 재검증 — 승인 가능(심각·중간 해결, 원격 68개 브랜치에서 구조 판정 겹침 0)
- [x] 커밋 a69f06b push
- [x] prd 워크트리(Node 20.19.4) 표준 검증·commit.sh 실전 ✅ — 실전 시험 계획서
- [x] expo lint 가 package.json 을 바꾸던 것 수정분 커밋 — `fe7da08` push

### Next
1. 없음

### Blocked
- 없음

### Validation
- `scripts/verify/bznav-rn-app.sh` (prd a161710, Node 20.20.2): Node 버전 ⏭(20.19.4 미설치) · `yarn expo lint` ⏭ 레포 eslint 설정 오류로 실행 불가 · `yarn tsc --noEmit` ✅. 엄격 모드 exit 1
- archify validate: architecture 9/9 · domains 9/9 · sequence ok
- check-diagrams: rn-app 7장 ✅ 최신 · 심층 탭 5장 validate 9/9

## 지시
> 에이전트 하나 더 — FE 가 아니라 앱, 레포 bznav-rn-app. 이름 bznav-rn-app · PR base 는 최근 작업 브랜치가 딴 곳(prd) · yarn · 범위 "다이어그램까지"

## 결과
- 에이전트·config·검증 스크립트·지식 5종·다이어그램 3장+심층 5탭·가이드·문서 표 반영. 이슈 4건 등록(eslint-config · webview-origin · committed-keys · channeltalk-qa-flag)

## Commits
- 2026-09-29 · hermes · main · `e310a1c` — rn-app 에이전트 추가 · pushed
- 2026-09-29 · hermes · main · `fe7da08` — 검증이 package.json 을 바꾸던 것(eslint 직접 실행) · pushed
- 2026-09-29 · hermes · main · `a69f06b` — 검증 스크립트 리뷰 반영(mark_skipped·옛 main 가드·근거) · pushed
- 2026-09-29 · hermes · main · `a94a6c4` — 지식 문서 점검(rn-app 문서·프로필 다듬음 포함) · pushed
