# 에이전트 로컬 커밋 허용 — scripts/commit.sh 와 세션 보호 훅

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-29 16:14 / 헤르메스
- Status: done
- Agent: (정해지지 않음)
- Issue: 없음
- Work ref: hermes main (hermes 자체 변경)
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p32 (reviewer)

### Progress
- [x] Codex 교차 검토(읽기 전용) — 구멍 5건(기존 스테이징 섞임·워크트리 비강제·검증 exit 0≠통과·검증 후 수정·Work ref 덮어씀) 반영
- [x] scripts/commit.sh — 메인 체크아웃·detached·보호 브랜치·기존 스테이징·glob·안 바뀐 파일 거부, 지정 파일만 스테이징→엄격 검증→전후 동일할 때만 커밋, 계획서 ## Commits 기록, 워크트리 잠금
- [x] scripts/verify/_lib.sh 엄격 모드 — 건너뜀 실패 처리(--allow-skip), 잘못된 HERMES_VERIFY_DIR 에서 멈춤
- [x] scripts/hooks/commit-guard.py + delegate.sh·agent-context.py 가 FE 세션에만 전달 (reviewer 제외)
- [x] 템플릿 ## Commits, 현황판 워크트리 삭제는 push 안 된 커밋이 있으면 거부
- [x] 규칙·에이전트 11개·레포 rules 6개·스킬·playbook·작업 흐름 다이어그램(9/9)
- [x] reviewer(w2:p20) 리뷰 반영 1차 — 심각 1·중간 3
  - commit.sh: bznav-web 검증 대상이 비면 멈춤(bash 3.2 빈 배열·검증 0회 통과 방지), INT·TERM·예상 못 한 종료에도 스테이징 원복(EXIT trap, 커밋 전만)
  - commit.sh: `## Commits`·`### Commits` 둘 다 찾고, 끝 개행 보정, 기록이 안 되면 경고
  - commit.sh: 검증 전후 비교를 작업 트리 전체(추적 diff·상태 목록)로, 지정 밖 미커밋 변경은 경고·계획서 기록 · common/git.md 에 한계
  - commit-guard.py: 줄바꿈·&·( )·$( )·백틱 분리, shlex, VAR=·env·command·sudo 앞붙임, git·gh 경로 무시, sh|bash|zsh -c(묶인 -lc 포함) 재귀, commit.sh 통과는 실행 토큰일 때만, git add -Av·./·디렉터리, gh -R … pr
  - plan-template.md: Decisions 줄이 Commits 아래로 밀려 있던 것 바로잡음
- [x] 추가 차단(사용자 결정 1번 "전부 막기"): revert·merge·cherry-pick·am, stash(list·show 제외), reset --hard — 판정 13건 ✅ (merge-base·log --merges·reset -- 파일 은 통과)
- [x] reviewer 재검증 1차 — 심각 1·중간 3 해결 확인(TERM·INT 원복 포함), 새 중간 1건
- [x] 새 중간 반영: 전후 비교에서 미추적 파일은 **검증 전부터 있던 것의 내용**만 본다. 검증 중 새로 생긴 미추적(gitignore 안 된 산출물, 예 packages/ui storybook-static)은 거부하지 않고 경고·기록
- [x] reviewer 재검증 2차 중 성능 문제 발견 — 미추적 파일마다 git hash-object 를 불러 3000개에서 16분+ (리뷰어 세션은 메모리 12GB 로 닫음)
- [x] 성능 수정: 존재 확인은 셸 내장, 해시는 hash-object --stdin-paths 한 번 → 3000개 0.15초, 수정·삭제 감지 ✅, 4경우 회귀 ✅
- [x] reviewer 재검증 3차(w2:p32) — 이전 심각1·중간4·성능 해결, 새 차단 오탐 없음. 새 발견 중간 2·낮음 1·확인 1
- [x] 중간1: `[` 거부 삭제 + `GIT_LITERAL_PATHSPECS=1` → 동적 라우트 app/[id]/page.tsx 커밋 가능
- [x] 중간2: 모든 git 호출 `-c core.quotePath=false`(git 함수 래퍼) → 한글 경로 지정·한글 미추적 수정 감지
- [x] 낮음3: guard 가 따옴표 구간을 가린 채 조각·서브셸을 찾는다(큰따옴표 안 $( ) · 백틱은 계속 검사)
- [x] 곁들여: 워크트리 경로에 공백이 있으면 awk 가 잘라 먹던 것
- [x] 확인4 사용자 결정: 새로 막지 않는다(pull·rebase·clean·checkout -- .·restore .·reset --keep/--merge·eval/xargs 는 통과 유지)
- [x] 범위: _lib.sh·bznav-rn-app.sh 변경은 rn-app 계획서 몫 — 따로 커밋
- [x] reviewer 재검증 4차(w2:p32) — **승인 가능**. 3차 발견·공백 경로 해결, guard 43건 기대대로
- [x] 4차 권장 반영: GIT_LITERAL_PATHSPECS 를 export 하지 않고 git() 래퍼 안에서만(검증 스크립트·lint-staged 로 새지 않음 ✅)
- [x] 4차 낮음 반영: guard 중첩 $( )·( ) 괄호 짝 세기 · commit.sh 파일 목록 -z(" \ 공백 이름)
- [x] 실전: rn-app 시험 워크트리 pane 에서 "커밋해줘" → 허락 확인 후 commit.sh 커밋·계획서 기록 ✅ (plans/task/20260929-bznav-rn-app-실전-시험-…md)

### Next
1. 없음
2. 사용자가 새로 띄운 pane 에서 "커밋해줘" 로 실전 확인

### Blocked
- 없음

### Validation
- commit.sh 임시 레포 7경우 — 거부 6(메인 체크아웃·보호 브랜치·기존 스테이징·glob·안 바뀐 파일)·정상 1(커밋·계획서 기록·스테이징 잔여 0)
- 엄격 모드 skip 판정 3경우, commit-guard 11 명령 판정, 실제 claude 세션에서 git add -A 차단 확인
- 실제 레포(bznav-web)에서 엄격 검증 + 커밋 — **실행 못 함**(실전 테스트 예정)
- 리뷰 반영 1차(2026-09-29, bash 3.2.57, mktemp 임시 레포 `bznav-web` 이름): 루트 파일만 → "검증할 앱을 찾지 못했다" 로 멈추고 스테이징 0 ✅ · `### Commits`+끝 개행 없음 → 절 안에 기록 ✅ · `## Commits`+끝 개행 없음 → 기록 ✅ · 지정 밖 미추적 파일 → 경고 ✅
- commit-guard 판정 44건 ✅ — 줄바꿈·묶인 -lc·큰따옴표 안 $( )·따옴표 안 괄호/; 오탐 없음·pull/rebase 통과
- guard 49건 ✅(중첩 $( ) 포함) · commit.sh 9경우(mktemp, 워크트리 경로 공백): a b.ts·q"x.txt 포함 ✅, 검증 스크립트로 GIT_LITERAL_PATHSPECS 안 샘 ✅
- (이전) commit.sh 7경우(mktemp, 워크트리 경로 공백): app/[id]/page.tsx·화면/목록.tsx 커밋 ✅ · 새 미추적→커밋+경고 ✅ · 기존 미추적·한글 미추적·추적·지정 수정→거부 ✅ · 스테이징 잔여 0
- INT·TERM 중단 시 원복 — reviewer 재검증에서 확인 ✅
- 검증 중 변경 4경우(mktemp 임시 레포 + 임시 검증 스크립트): 새 미추적 생성 → 커밋+경고+기록 ✅ · 기존 미추적 수정 → 거부 ✅ · 추적 파일 수정 → 거부 ✅ · 지정 파일 수정 → 거부 ✅ (스테이징 잔여 0)

## 지시
> 사용자 결정(2026-09-29, Codex 교차 검토 반영): 에이전트 pane 에서 사용자가 "커밋해줘" 라고 하면 로컬 커밋을 허용한다. 단 전용 스크립트로만. push·PR 은 계속 헤르메스가 맡는다.
> 1) scripts/commit.sh — 워크트리·브랜치 확인(메인 체크아웃·detached·보호 브랜치 거부, 메인 체크아웃은 사용자가 명시하면 --allow-main-checkout), 기존 스테이징 거부, 리터럴 파일만 스테이징, 그 상태로 엄격 검증, 검증 전후 동일할 때만 커밋, 계획서 ## Commits 에 기록
> 2) scripts/verify/_lib.sh 엄격 모드 — 건너뜀·잘못된 검증 대상을 실패로
> 3) FE 세션 보호 훅 — git commit 직접·git add -A/. 는 commit.sh 로 안내, git push·gh pr 차단 (delegate.sh 가 FE 세션에만 전달)
> 4) 계획서 템플릿 ## Commits, 현황판 워크트리 삭제는 push 안 된 커밋이 있으면 거부
> 5) 규칙·에이전트 프로필·스킬·문서·작업 흐름 다이어그램 갱신

## 결과
- (변경 파일 · 요약 · 남은 위험 — AGENTS.md 6절 보고 형식)

## Commits
- 2026-09-29 · hermes · main · `707cca2` — 에이전트 로컬 커밋 허용 · pushed
- 2026-09-29 · hermes · main · `580b53a` — delegate 따옴표·리뷰 디스패치·board stop · pushed
- 2026-09-29 · hermes · main · `825d2ab` — commit.sh·보호 훅 리뷰 반영(4차 승인) · pushed
