#!/usr/bin/env bash
# client-brics-care 표준 검증: lint:check → tsc --noEmit (typecheck·test 스크립트 없음)
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"; source "$HERMES_DIR/scripts/verify/_lib.sh"
# HERMES_VERIFY_DIR 가 이 레포의 워크트리면 그쪽을 검증한다 (delegate.sh --cwd 가 넣어준다)
REPO_DIR="$(resolve_repo_dir "$HERMES_DIR/repos/client-brics-care")"
[ -d "$REPO_DIR" ] || { echo "repos/client-brics-care 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
check_node_version "$REPO_DIR"
[ -d node_modules ] || skip_step "pnpm install 확인" "node_modules 없음 — pnpm install 먼저 (GITHUB_TOKEN 필요)"
run_step "pnpm lint:check" pnpm lint:check
if [ -f __generated__/index.ts ]; then run_step "pnpm exec tsc --noEmit" pnpm exec tsc --noEmit
else skip_step "tsc --noEmit" "__generated__ 없음. pnpm genapi:local 후 재실행"; fi
print_summary "client-brics-care" "$REPO_DIR"
