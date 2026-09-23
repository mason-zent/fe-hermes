#!/usr/bin/env bash
# client-brics-hub 표준 검증: lint:check → typecheck → test. 에이전트와 reviewer 가 같은 것을 돌린다.
# 사용: scripts/verify/client-brics-hub.sh            (hermes 어디서든)
#       scripts/verify/client-brics-hub.sh --no-test  (jest 생략)
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
source "$HERMES_DIR/scripts/verify/_lib.sh"
# HERMES_VERIFY_DIR 가 이 레포의 워크트리면 그쪽을 검증한다 (delegate.sh --cwd 가 넣어준다)
REPO_DIR="$(resolve_repo_dir "$HERMES_DIR/repos/client-brics-hub")"
[ -d "$REPO_DIR" ] || { echo "repos/client-brics-hub 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
check_node_version "$REPO_DIR"

[ -d node_modules ] || skip_step "pnpm install 확인" "node_modules 없음 — pnpm install 먼저"
run_step "pnpm lint:check" pnpm lint:check
if [ -f __generated__/index.ts ]; then
  run_step "pnpm typecheck" pnpm typecheck
else
  skip_step "pnpm typecheck" "__generated__ 없음 (@/swr 미생성). pnpm genapi:local 후 재실행"
fi
if [ "${1:-}" = "--no-test" ]; then skip_step "pnpm test" "--no-test 지정"; else run_step "pnpm test" pnpm test; fi
print_summary "client-brics-hub" "$REPO_DIR"
