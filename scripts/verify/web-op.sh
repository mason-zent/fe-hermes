#!/usr/bin/env bash
# web-op 표준 검증: lint → typecheck → SalesJwt 테스트(레포의 유일한 테스트, node:test 러너)
# 무거운 검증이라 한 대에 하나씩, 부하를 보며 돈다(scripts/heavy.sh — 이미 잠금 안이면 그냥 통과)
[ -z "${HERMES_HEAVY_HELD:-}" ] && exec "$(cd "$(dirname "$0")/.." && pwd)/heavy.sh" "$0" "$@"
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"; source "$HERMES_DIR/scripts/verify/_lib.sh"
# HERMES_VERIFY_DIR 가 이 레포의 워크트리면 그쪽을 검증한다 (delegate.sh --cwd 가 넣어준다)
REPO_DIR="$(resolve_repo_dir "$HERMES_DIR/repos/web-op")"
[ -d "$REPO_DIR" ] || { echo "repos/web-op 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
check_node_version "$REPO_DIR"
[ -d node_modules ] || skip_step "pnpm install 확인" "node_modules 없음 — pnpm install 먼저"
run_step "pnpm lint" pnpm lint
run_step "pnpm typecheck" pnpm typecheck
# jest·vitest 가 없어 package.json 에 test 스크립트가 없다 — 레포가 둔 경량 러너를 직접 돌린다
[ -f scripts/run-salesjwt-test.cjs ] && run_step "node scripts/run-salesjwt-test.cjs" node scripts/run-salesjwt-test.cjs
print_summary "web-op" "$REPO_DIR"
