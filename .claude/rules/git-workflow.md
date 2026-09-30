# Git 규칙

- FE 에이전트는 사용자가 pane 에서 **"커밋해줘" 라고 할 때만** `scripts/commit.sh` 로 로컬 커밋한다(지정 파일만·엄격 검증·계획서 `## Commits` 기록). 직접 `git commit`·`git add -A`, `revert`·`merge`·`cherry-pick`·`am`, `stash`·`reset --hard` 는 보호 훅이 막는다(필요하면 이유를 말하고 사용자가 직접)
- **push·PR 은 사용자가 "PR 올려줘" 라고 할 때 `scripts/ship.sh` 로만** 한다(직접 `git push`·`gh pr create` 는 보호 훅이 막는다). 레포 하나짜리 작업만 받고, 미리보기(base 후보·커밋·검증·리뷰 기록·제목 제안·본문 초안)를 사용자에게 보여 주고 확인받은 뒤 draft PR. 여러 레포에 걸친 작업은 헤르메스가 순서를 정해 올린다
- PR 제목 `type(범위): 티켓 요약`, 본문은 공통 템플릿 — 정본 `docs/knowledge/common/git.md` "PR 제목·본문"
- 작업 시작 전 `git status --short --branch`로 대상 레포의 기존 변경 사항을 확인하고, 사용자가 만든 변경과 무관한 파일은 건드리지 않는다
- 커밋 메시지는 한국어, 티켓 번호가 있으면 `feat: REF-1234 설명` 형식 (각 레포 최근 커밋 관례 따름)
- 브랜치 전략은 사용자 지시에 따른다
