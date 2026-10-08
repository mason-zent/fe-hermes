---
name: call
description: 담당 에이전트를 그 레포 workspace 에 pane 으로 바로 띄웁니다. 브랜치는 에이전트가 떠서 사용자에게 묻고 워크트리를 만들며, 요청도 그 pane 에서 직접 합니다. 대화하며 범위를 좁혀 가는 작업에 씁니다.
argument-hint: "<에이전트> — 예: bznav-plus-fe · brics-refund-fe"
---

# 에이전트 띄우기 (브랜치·요청은 pane 에서)

대상: $ARGUMENTS

권장 방식(CLAUDE.md 3단계 "프롬프트 없이 pane 을 열고 그 안에서 작업을 지시한다")을 한 번에 한다. **헤르메스는 띄우기만 한다.** 브랜치를 묻고 워크트리를 만드는 것, 요청을 받아 진행하는 것은 pane 안의 에이전트가 한다.

## 동작
1. 인자 = 에이전트 이름(`.claude/agents/<이름>.md`). 없거나 틀리면 에이전트 목록을 보여 주고 묻는다. `reviewer` 는 이 스킬로 띄우지 않는다(리뷰는 헤르메스에게 "리뷰해줘" — 계획서·워크트리를 붙여 `delegate.sh reviewer` 로 띄운다)
2. 바로 실행한다:
   ```bash
   scripts/delegate.sh <에이전트> --plan new "<에이전트> 작업 (pane 에서 지시)" --ask-branch
   ```
   - 경량 계획서(`plans/task/…`)를 빈 지시로 만들고, 담당 레포 workspace 에 pane 을 지시 없이 띄운다
   - `--ask-branch`: 에이전트가 ① 메인 체크아웃 브랜치·미커밋 상태를 한 줄 보고 ② **브랜치 이름(티켓)을 사용자에게 묻고** ③ `scripts/new-branch.sh <이름> <대상>` 으로 워크트리를 만든다. **브랜치가 이미 있으면**(로컬·원격) 어디에 어떤 상태로 있는지 알려 주고 "그대로 이어 쓸까요?" 를 묻는다 → 예면 `--reuse`, 아니면 새 이름. 그 뒤 그 안에서만 작업하고 계획서 Work ref 를 고친다 ④ 요청을 기다린다
   - 첫 요청을 받으면 에이전트가 계획서 제목·`## 지시` 를 그 요청으로 채운다. 끝나면 Status `ready_for_review`
3. pane id · workspace · 계획서 경로를 한 줄씩 알리고 "그 pane 에서 브랜치 이름과 요청을 답하면 된다" 한 줄

현황판(`/board`)에 계획서 카드가 **진행 중**으로 뜨고 `🤖 <에이전트>` 배지가 붙는다.

## 커밋
- 사용자가 그 pane 에서 **"커밋해줘"** 라고 하면 에이전트가 `scripts/commit.sh` 로 로컬 커밋한다 — 워크트리·보호 브랜치·기존 스테이징·지정 파일을 확인하고 엄격 검증 뒤 커밋, 계획서 `## Commits` 에 기록. 메인 체크아웃이면 거부되고 사용자가 명시해야 `--allow-main-checkout`
- 에이전트가 코드를 바꾼 요청을 보고하면 **자동으로 리뷰를 띄운다**(묻지 않음). 자동 리뷰나 **"리뷰해줘"** → 에이전트가 `scripts/delegate.sh reviewer --cwd <워크트리> --here --plan <계획서>` 로 같은 탭 옆에 reviewer pane 을 띄운다. reviewer 는 결론을 계획서 `- Review result:` 줄로 남긴다
- **"PR 올려줘"** → 에이전트가 `scripts/ship.sh` 미리보기를 보여 주고 base·제목을 확인받은 뒤 draft PR (레포 하나짜리 작업만. 규칙 `docs/knowledge/common/git.md` "PR 올리기")
- 직접 `git commit`·`git add -A`·`git push`·`gh pr create` 는 FE 세션 보호 훅이 막는다. 여러 레포에 걸친 작업의 push·PR 은 헤르메스에게

## 주의
- 요청이 여러 레포·API·구조 변경으로 커지면 에이전트가 멈추고 알린다 → 헤르메스가 정식 계획서(`docs/plan-template.md`)로 옮긴다
- 커밋·PR 은 사용자가 정한다
