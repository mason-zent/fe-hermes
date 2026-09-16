#!/usr/bin/env bash
# client-brics-refund 표준 검증: lint:check → tsc --noEmit (typecheck 스크립트 없음)
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"; source "$HERMES_DIR/scripts/verify/_lib.sh"
REPO_DIR="$HERMES_DIR/repos/client-brics-refund"
[ -d "$REPO_DIR" ] || { echo "repos/client-brics-refund 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
check_node_version "$REPO_DIR"
[ -d node_modules ] || skip_step "pnpm install 확인" "node_modules 없음 — pnpm install 먼저"
run_step "pnpm lint:check" pnpm lint:check
if [ -f __generated__/index.ts ]; then run_step "pnpm exec tsc --noEmit" pnpm exec tsc --noEmit
else skip_step "tsc --noEmit" "__generated__ 없음 (@/generated 미생성). pnpm gen:api:local 후 재실행"; fi
print_summary "client-brics-refund" "$REPO_DIR"
