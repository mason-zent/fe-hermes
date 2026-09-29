# 팀 공통 Git 규칙

- 작업 시작 전 `git status --short --branch`로 대상 레포의 기존 변경을 확인하고, 사용자가 만든 변경과 무관한 파일은 건드리지 않는다
- **FE 에이전트의 커밋은 사용자가 pane 에서 "커밋해줘" 라고 할 때만, `scripts/commit.sh` 로만 한다.** 스크립트가 워크트리·보호 브랜치·기존 스테이징·지정 파일을 확인하고, 그 상태로 엄격 검증한 뒤 커밋해 계획서 `## Commits` 에 적는다. `git commit` 직접·`git add -A`·`git push`·`gh pr` 은 FE 세션의 보호 훅(`scripts/hooks/commit-guard.py`)이 막는다(실수 방지용 — 보안 경계는 아니다)
- **push·PR 은 헤르메스가 맡는다.** 여러 레포 순서·공개 범위를 확인한 뒤 사용자에게 묻는다
- PR 생성·푸시는 사용자 지시가 있을 때만. 보호 브랜치(`dev`, `prd`, `main`, `prd-<앱>` 등) 직접 push·force-push 금지
- 커밋 메시지는 한국어. 티켓이 있으면 `feat: REF-1234 설명` (레포별 세부 관례는 `<레포>/rules.md`)
- 브랜치 전략은 레포마다 다르다 → `<레포>/rules.md`. 지시가 없으면 사용자에게 묻는다
- 로컬 링크(`pnpm pkg:link`) 상태의 `package.json`·lockfile을 커밋하지 않는다
