# 에이전트 pane 에서 리뷰 · push · PR 까지

## Checkpoint
- Updated: 2026-09-30 / 헤르메스
- Status: done
- Scope: hermes 워크스페이스 자체 (scripts · .claude · 문서)
- Work ref: hermes 메인 체크아웃 · main (헤르메스 자체 구조 — 워크트리 없이 main 에서 작업하는 관례)
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p3B (reviewer)
- Approved scope: 1절 결정 9건 모두 추천안으로 확정 (2026-09-30 사용자 "그대로 진행하자")

### Progress
- [x] 결정 확정 — D1~D9 추천안
- [x] `scripts/ship.sh` 신규 — 미리보기/보내기 2단계, 거부 조건·draft PR·계획서 기록 → 확인: 임시 bare 원격 + gh 스텁으로 정상 1 · 거부 10경로 → 성공 조건 충족(아래 Validation)
- [x] `commit-guard.py` — ship.sh 통과, gh pr view·list·status·checks·diff 허용, push·gh pr create·merge 차단 유지(안내 문구 ship.sh 로)
- [x] `delegate.sh` 에이전트 지시문 — "리뷰해줘" → delegate.sh reviewer, "PR 올려줘" → ship.sh 미리보기 → AskUserQuestion → --yes
- [x] 문서 — AGENTS.md 2.2·5절, CLAUDE.md 4·5단계·/call 행, git-workflow·dispatch-protocol, git.md "PR 올리기"·"PR 제목·본문"(정본), 에이전트 프로필 12 · rules.md 7 공통 줄, bznav·rn-app·zent-packages 개별 줄, call SKILL, commit.sh 안내, README, playbook, hermes-flow.workflow.json 카드
- [x] reviewer 1차(w2:p3B) — 수정 필요 7건: 헤르메스 여러 레포 PR 불가 · --yes 가 초안 덮어씀 · 정식 계획서 리뷰 cwd · Review 줄만으로 리뷰 판정 · 훅 basename 예외 우회 · flow html · 잔여 문구 → 반영: --repo-agent(FE 훅 차단) · 초안 미리보기 때만 · reviewer --cwd --here + Work ref 로 레포 · scripts/review-result.sh(승인 @HEAD) · 훅 실제 경로 비교 + gh api 쓰기 차단 · reporting.md·board 문구 · frz · 본문 로컬 경로·내부 URL · reviewer 전용 머리말
- [x] reviewer 2차 — 수정 필요 4건: gh api 붙여 쓴 옵션 우회 · 미리보기 뒤 새 커밋이면 낡은 초안 · .env.local 오탐 · flow html. 제안: --repo-agent 레포 고정 · 여러 레포 리뷰 결론 덮어씀 → flow html 외 전부 반영(초안 HEAD 기록·대조, URL 안에서만 검사, 브랜치별 Review result 줄)
- [x] `docs/diagrams/hermes-flow.html` — 사용자가 archify deliver 실행 → 기존 레이아웃 8건으로 실패(바꾸기 전 json 도 동일, 기존 이슈 issues/20260930-hermes-flow-diagram-archify-validate.md). HTML 글자만 json 과 맞춤, 이슈에 한 줄 추가
- [x] 커밋 f5e16a7 · push origin main · 플레이북 아티팩트 재게시

### Next
1. 없음 — 첫 실사용(에이전트 pane 에서 "PR 올려줘")에서 실제 GitHub draft PR 생성 확인

### Blocked
- 없음

### Validation
- `bash -n` ship.sh·delegate.sh·commit.sh 통과 · `py_compile` commit-guard.py 통과 · `build-derived.mjs --check` 일치
- 훅: git push / gh pr create / bash -c "git push" / gh pr merge / ship.sh 뒤 && git push / git commit → 2 · gh pr view / gh pr list / ship.sh / commit.sh → 0
- ship.sh (임시 bare 원격 + gh 스텁): 미리보기 0 · 제목 형식 · 티켓 누락 · 범위 불일치 · 리뷰 기록 없음 · 미커밋 · HEAD 미기록 · 여러 에이전트 · 메인 체크아웃 · 본문 plans/ 경로 · 원격에 없는 base → 모두 거부(원격 변화 없음) · 정상 → push + gh pr create --draft 호출, Commits 줄 PR 링크로 바뀜, Checkpoint - PR: 줄
- 2차 반영 후 회귀: gh api -XPUT·-X=POST·-fquery=·-Fhead= → 2, gh api GET → 0 · --repo-agent 다른 레포 거부 · 다른 브랜치 승인만 있으면 '기록 없음' · 이 브랜치 승인 → 통과 · 미리보기 뒤 새 커밋 → 거부 · .env.local 통과 · http://*.internal 거부 · review-result 수정필요 → '승인이 아니다' 경고
- 실제 GitHub PR 생성은 미실행(첫 실사용에서 확인)

### Decisions
- D1 레포 하나짜리 작업만(경량·정식 무관) · D2 draft PR · D3 매번 미리보기 + 선택지 확인 · D4 리뷰 권장(없으면 한 번 더 묻기) · D5 reviewer 는 같은 탭 옆 pane
- D6 제목 `type(범위): 티켓 요약` · D7 base 는 prBase 기본 제안 + 다른 후보 선택지 · D8 본문 공통 템플릿 · D9 규칙은 hermes 에만(git.md 정본)

### Commits
- (hermes 자체 작업이라 헤르메스가 직접 커밋한다)

## 1. 개요
- 작업 유형: refactor (워크스페이스 운영 구조)
- 요청 사항: `/call` 로 띄운 FE 에이전트 pane 에서 **리뷰 · push · PR 까지** 끝낼 수 있게 한다. 지금은 이 세 가지 때문에 매번 메인 헤르메스로 돌아와야 해서 불편하다. 레포별 헤르메스를 따로 두는 안은 pane 이 두 겹이 되고 여러 레포 순서 조율이 흩어져 채택하지 않았다
- 대상: hermes 자체 (FE 레포 코드 변경 없음)
- 사용자 결정 사항:
  - D1 에이전트가 push·PR 할 수 있는 범위: **레포 하나짜리 작업만(경량·정식 무관)** (추천) / 경량 계획서 + 레포 하나만 / 제한 없음
  - D2 PR 형태: **draft PR** (추천) / 일반 PR / push 만 (PR 은 사용자가 GitHub 에서)
  - D3 확인 방식: **매번 에이전트가 브랜치·base·커밋 목록·검증 결과를 보여 주고 선택지로 확인** (추천) / "PR 올려줘" 라는 말이 곧 승인
  - D4 리뷰와 PR 의 관계: **리뷰 권장, 안 했으면 PR 전에 한 번 더 묻기** (추천) / reviewer 승인이 있어야만 PR / 상관없음
  - D5 에이전트 pane 에서 "리뷰해줘" 할 때 reviewer 위치: **같은 탭에 옆 pane 으로** (추천) / 새 탭
  - D6 PR 제목 형식 (모든 레포 공통, 5.1절): **`type(범위): 티켓 요약`** (추천) / `type: 티켓 요약` (범위 없음) / `[티켓] type: 요약`
  - D8 PR 본문 형식 (모든 레포 공통, 5.2절): **공통 템플릿 고정 — 작업 내용 · 변경 사항 · 검증 · 확인 필요 · 스크린샷(화면 변경 시)** (추천) / 작업 내용 · 검증만
  - D9 규칙을 레포에도 넣을지: **hermes 에만 둔다(`docs/knowledge/common/git.md` — ship.sh 가 적용)** (추천) / 각 레포에 `.github/pull_request_template.md` 도 추가(레포별 별도 작업·PR 필요, 팀 합의 대상)
  - D7 PR 대상(base) 정하기: **`prBase` 를 기본으로 제안하고 원격의 진행 중 `release/*`·그 밖의 브랜치를 선택지로 함께 보여 주기** (추천) / `prBase` 고정 / 매번 직접 입력

## 2. 현재 상태 분석
- `scripts/hooks/commit-guard.py` — FE 세션(`reviewer` 제외)에 PreToolUse 훅으로 걸려 `git push`·`gh pr` 을 막는다. 통과 예외는 첫 실행 토큰이 `scripts/commit.sh` 인 조각뿐
- `scripts/agent-context.py:47-51` — 위 훅을 FE 세션 settings 에 주입
- `scripts/commit.sh` — 워크트리·보호 브랜치·스테이징 검사 → 엄격 검증 → 커밋 → 계획서 `## Commits` 기록. **push·PR 을 새로 만들 때 이 검사·기록 방식을 그대로 따른다**
- `scripts/delegate.sh reviewer --cwd <워크트리> --here --plan <계획서>` — reviewer 를 계획서·워크트리에 붙여 띄우는 기존 경로. `--here` 는 "지금 탭"이라 에이전트 pane 안에서 부르면 그 탭에 쪼개진다(추측입니다 — herdr `--current` 가 호출한 pane 기준인지 구현 때 확인)
- `hermes.config.json` 의 `prBase` — PR 대상 브랜치 정본 (콘솔 dev · bznav 앱 dev · zent-packages main · rn-app prd)
- 계획서 `## Commits` 줄 형식에 `push 여부` 칸이 이미 있다

### 2.1 PR 관례 (2026-09-30 각 레포 최근 머지 PR 6건씩 확인)
- **PR 템플릿·제목 규칙 문서는 어느 레포에도 없다**(`.github/pull_request_template.md` 없음). 제목은 사실상 **커밋 메시지 관례 그대로**
  - 콘솔: `feat: REF-3671 설명` · web-op 은 `[REF-3624] 설명` 도 섞임 · bznav: `type(scope): 티켓 설명`(예 `feat(care): NEWCARE-651 …`, `.ai/basic-rule.md`) · rn-app: 브랜치 이름 그대로(`Feature/v5.1.2/sena 269`)
  - 본문: 대부분 비어 있고 일부만 요약. bznav `create-pr` 스킬은 제목 기본값 = 마지막 커밋 메시지 → 확인 후 수정, 본문 `--fill`
- **base 는 대부분 `dev` 이지만 예외가 있다**
  - bznav: 기능 PR 을 `release/care/v.26.09.400` 같은 릴리즈 브랜치로 모으는 경우
  - rn-app: 같은 브랜치로 `prd`·`dev` **양쪽**에 PR, 또는 `release/*` 로 모음 (`bznav-rn-app/rules.md`)
  - zent-packages: config 는 `main` 인데 `dev` 로 간 PR 도 있다(확인 필요 — `issues/` 등록 후보)
  - bznav `create-pr` 스킬의 base 추론(`dev-ecs`)은 낡았다(`bznav-web/rules.md`) — 따르지 않는다
- 그래서 ship.sh 는 base 를 **자동 확정하지 않고** `prBase` 를 기본값으로 제안한 뒤 사용자가 고른다(D7). rn-app 은 "prd·dev 둘 다" 선택지를 둔다

## 3. API 의존성
- 없음. `gh` CLI 사용 (사용자 로그인 상태 전제)

## 4. 설계
### 4.1 `scripts/ship.sh` (신규) — push + PR
```
scripts/ship.sh --plan <계획서> --dir <워크트리> [--title "<PR 제목>"] [--dry-run]
```
확인하는 것 (하나라도 걸리면 아무것도 보내지 않고 멈춘다):
- 워크트리 · 보호 브랜치 아님 · detached 아님 (commit.sh 와 같은 규칙)
- **미커밋 변경 없음** — 커밋 안 된 게 있으면 먼저 "커밋해줘"
- 계획서 `## Commits` 에 이 브랜치 커밋이 있고, **HEAD 가 마지막으로 검증 통과한 커밋과 같다**
- D1 범위 검사 — 계획서가 가리키는 레포가 하나인지 (Work ref · 작업 배분). 아니면 거부하고 "헤르메스에서" 안내
- base = D7 방식으로 사용자가 고른 브랜치(기본 제안 `prBase`). 원격에 그 브랜치가 없으면 거부. 이미 PR 이 있으면 새로 만들지 않고 push 만 하고 PR 링크를 알린다

그다음: `--dry-run` 결과(브랜치 → base, 커밋 목록, 검증 결과, PR 제목·본문 미리보기)를 에이전트가 사용자에게 보여 주고 확인(D3) → 실제 실행 → 계획서 `## Commits` 의 해당 줄 push 칸 갱신 + Checkpoint 에 PR 링크.
PR 제목·본문: 5.1·5.2 공통 형식(D6·D8). 제목이 형식에 안 맞으면(type·범위 누락 등) 보내기 전에 거부하고 고칠 값을 제안한다.

### 4.2 보호 훅 예외
- `commit-guard.py` 통과 예외에 `scripts/ship.sh` 추가. 직접 `git push`·`gh pr create` 는 계속 막는다 (안내 문구를 "ship.sh 로" 로 변경)
- `gh pr view`·`gh pr list` 같은 읽기 전용은 허용할지 — 구현 때 판단(허용 추천, ship.sh 가 필요)

### 4.3 에이전트 안에서 리뷰
- 에이전트 컨텍스트(`agent-context.py` 가 만드는 안내)에 "사용자가 리뷰해줘 → `delegate.sh reviewer --cwd <내 워크트리> --here --plan <내 계획서>`" 추가. reviewer 결과는 사용자가 그 pane 에서 보고, 수정 필요 항목은 원래 에이전트 pane 에 말한다
- D4 에 따라 ship.sh 가 계획서 `- Review:` 줄 유무를 보고 경고/거부

### 4.4 문서
- `CLAUDE.md` 4·5단계, Skills 표 `/call` 행 · `AGENTS.md` 5절(push·PR 금지 → 조건부 허용) · `.claude/rules/git-workflow.md` · `dispatch-protocol.md` 리마인드 문구 · `docs/knowledge/common/git.md` (ship.sh 절 추가) · `.claude/skills/call/SKILL.md` · 에이전트 프로필 공통 문구 · `README.md` · `docs/playbook.html`(`/call` 카드·작업 흐름 5단계·규칙 카드) · `docs/diagrams/hermes-flow.workflow.json` 카드 + HTML 재생성 · 아티팩트 재게시

## 5. 공통 스펙
### 5.1 PR 제목 (D6 추천안)
```
type(범위): 티켓 요약
feat(refund): REF-3671 랜딩 SEO 기본 정보에 랜딩타입 입력 추가
fix(care-web): NEWCARE-651 프리미엄 랜딩 OG 값 적용
chore(brics-fe-ui): REF-3820 버튼 variant 추가
```
- `type`: feat · fix · refactor · chore · docs · style · test (커밋과 같은 목록)
- `범위`: 레포별 고정값 — refund · hub · care · op · refund-web · care-web · brand-web · sena-web · plus-web · packages(bznav `@repo/*`, 여럿이면 `packages`) · 발행 패키지명(zent-packages) · app(rn-app). ship.sh 가 계획서 대상으로 채운다
- `티켓`: 있으면 필수, 없으면 생략. 요약은 한국어 한 줄(50자 안팎), 마침표 없음
- 기본값은 계획서 제목·마지막 커밋에서 만들고, 사용자에게 보여 주고 그대로/수정 선택

### 5.2 PR 본문 (D8 추천안)
```markdown
## 작업 내용
- 왜·무엇을 (계획서 요청 요약, 2~4줄)

## 변경 사항
- 경로 — 주요 변경

## 검증
(scripts/verify 출력 표 그대로 · 실행 못 한 것은 "실행 못 함")

## 확인 필요
- 남은 위험 · 다른 서비스 영향 · 리뷰어가 볼 곳 (없으면 "없음")

## 스크린샷
(화면 변경이 있을 때만 — 없으면 절을 뺀다)

---
티켓: REF-1234
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
- 계획서 `## 지시`·`## 결과`·`### Validation` 에서 채운다. hermes 내부 경로(`plans/…`)는 적지 않는다(레포 밖 로컬 파일)
- `.env`·토큰·내부 URL 은 넣지 않는다

### 5.3 그 밖
- 에이전트 pane 에서 사용자가 쓰는 말: "커밋해줘" → commit.sh · "리뷰해줘" → reviewer pane · "PR 올려줘" → ship.sh
- 여러 레포 작업은 지금처럼 헤르메스가 순서를 정해 push·PR

## 6. 작업 배분
| 담당 | 작업 내용 | 의존성 |
|---|---|---|
| 헤르메스 | ship.sh · commit-guard 예외 · agent-context 안내 (hermes 자체 코드) | 결정 확정 |
| 헤르메스 | 4.4 문서 일괄 | 스크립트 완료 |
| reviewer | 훅 우회 가능성 · ship.sh 검사 누락 · 문서 정합성 | 위 완료 후 |

## 7. 검증 방법
- `bash -n scripts/ship.sh` · `python3 -m py_compile scripts/hooks/commit-guard.py`
- 훅: `git push` · `gh pr create` · `bash -c "git push"` 는 막히고 `scripts/ship.sh …` 는 통과 → 확인: 훅에 JSON 입력을 넣어 exit code → 성공 조건: 2 / 2 / 2 / 0
- ship.sh 거부 경로: 메인 체크아웃 · 보호 브랜치 · 미커밋 있음 · Commits 없음 · HEAD≠검증 커밋 · 레포 여럿 → 각각 메시지와 함께 exit≠0, 원격 변화 없음
- ship.sh 정상 경로: 실제 테스트 레포 대신 `--dry-run` 으로 브랜치·base·본문 미리보기 확인. 실제 push·PR 은 사용자 확인 뒤 한 번 실사용으로 확인
- 잔여 문구 grep: "push·PR 은 하지 않는다" · "헤르메스에게" 류가 새 규칙과 어긋나는 곳 0건
