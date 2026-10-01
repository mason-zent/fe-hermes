# bznav-web dev packages/* → zent-packages frontend/bznav 최신화 (git 이력 포함)

> 경량 계획서 — 사용자 지시가 곧 승인. 커지면 정식 계획서(`docs/plan-template.md`)로 옮긴다.

## Checkpoint
- Updated: 2026-09-30 / packages-fe
- Status: superseded → 정식 계획서 `plans/refactor/20260930-bznav-packages-sync-with-history.md` (2026-10-01 결정 확정, 이후 진행은 그쪽에 기록)
- Agent: packages-fe
- Issue: 없음
- Work ref: /Users/mason/mason-zent/hermes/.worktrees/zent-packages/feature-bznav-pkg · 🌿 feature/bznav-pkg (origin/main bfa6be4 기준) · pane wK:p1 (packages-fe)

### Progress
- [x] 담당 레포 브랜치·미커밋 상태 확인 — 워크트리를 만들었고 미커밋 변경 없음
- [x] 조사: 지난 이관(2026-07-23 `1a0bf68`·`3181323`, bznav-web `7f83a4ed2` "Merge to dev" 2026-07-22 까지 이력 연결) 이후 bznav-web `origin/dev` 의 `packages/` 커밋 80개(비머지 약 60), 79파일 +1744/−810
- [x] channel-talk 삭제를 결정으로 기록(사용자)
- [x] 헤르메스 pane(w2:p33)에 정식 계획서 전환 요청을 보냄 (2026-09-30)
- [ ] 정식 계획서로 전환하고 결정을 확정한 뒤 진행

### Next
1. 헤르메스가 정식 계획서로 옮기고 결정(이력 가져오는 방식·channel-talk 처리·bump 수준)을 확정한다
2. 이력을 이으려면 머지 커밋이 필요한데 보호 훅과 commit.sh 로는 만들 수 없다 → 사용자가 직접 실행할지 방식을 정한다

### Blocked
- 9개 패키지를 한꺼번에 바꾸고 이력을 병합하는 구조 변경이라 경량 범위를 넘는다 → 정식 계획서 필요
- 이력까지 가져오려면 filter-repo 로 경로를 다시 쓰고 unrelated-histories 병합을 해야 한다. FE 세션 보호 훅이 병합 명령을 막고, commit.sh 는 머지 커밋을 만들지 못한다
- ~~bznav-web fetch 실패~~ → 해결(2026-10-01). 원인은 패스프레이즈가 걸린 키가 ssh-agent 에 없었던 것. 사용자가 `ssh-add` 를 했고 `~/.ssh/config` 를 추가했다. 다시 fetch 해 보니 `origin/dev` = `4b382c733` 로 새 커밋이 없다 → 기준은 `4b382c733`, `packages/` 커밋 80개 그대로

### Validation
- 실행 못 함 (코드 변경 없음, 조사만)

## 지시
> bznav-web 레포 dev 브랜치 기준으로 packages 내용들 최신화. git 이력까지 전부 (2026-09-30 사용자)

## 결과
- 변경 파일 없음. 조사 결과는 Progress·Blocked 참고
- ✅ 결정(사용자 2026-09-30): `bznav-fe-channel-talk` 은 삭제한다. bznav-web 에서 `@repo/channel-talk` 을 없애고 소비 앱 안으로 옮겼기 때문이다(`8186dcc50`)
  - zent 에서 이 패키지를 참조하는 곳: `frontend/bznav/channel-talk/**`, `frontend/bznav/user-sign/package.json`, `user-sign/src/components/WithdrawContent.tsx`, `frontend/bznav/README.md`. 범위 밖이라 헤르메스에 넘길 곳: 루트 `README.md`, `pnpm-lock.yaml`, `.github/workflows/release-dev.yml` cleanup matrix
  - bznav-web dev `packages/` 에는 channel-talk 참조가 없다 → user-sign 을 최신화하면서 같이 지워야 한다(패키지만 먼저 지우면 user-sign 이 깨진다)
  - 발행된 npm 패키지를 deprecate 할지는 따로 정해야 한다(확인 필요)
- 영향 범위: web-op(`bznav-fe-ui`·`bznav-fe-project-config` 소비) — 반영하려면 후속 `pnpm up` 필요

## Commits
- (scripts/commit.sh 가 한 줄씩 적는다 — 날짜 · 레포 · 브랜치 · SHA · 메시지 · 검증 · push 여부)
