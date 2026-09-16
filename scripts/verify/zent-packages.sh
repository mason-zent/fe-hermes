#!/usr/bin/env bash
# zent-packages(frontend/) 표준 검증: 패키지 타입체크(build=tsc) → lint → changeset 존재 확인
#   scripts/verify/zent-packages.sh <패키지명...>   예: @zenterprise-inc/brics-fe-ui @zenterprise-inc/brics-fe-zent-auth
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"; source "$HERMES_DIR/scripts/verify/_lib.sh"
REPO_DIR="$HERMES_DIR/repos/zent-packages"
[ $# -ge 1 ] || { echo "사용: $0 <패키지명...>"; exit 2; }
[ -d "$REPO_DIR" ] || { echo "repos/zent-packages 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
[ -d node_modules ] || skip_step "pnpm install 확인" "node_modules 없음 — 루트에서 pnpm install 먼저 (GitHub Packages 토큰)"
for PKG in "$@"; do
  run_step "pnpm build --filter=$PKG..." pnpm build --filter="$PKG..."
  run_step "pnpm lint --filter=$PKG" pnpm lint --filter="$PKG"
done
# changeset: 작업 트리에 새 .changeset/*.md 가 있어야 PR 머지 가능
if git status --porcelain -- .changeset | grep -q '\.md$'; then
  run_step "changeset 존재" true
else
  skip_step "changeset 존재" "새 .changeset/*.md 없음 — 변경이 있으면 pnpm changeset 필요 (문서만이면 --empty)"
fi
print_summary "zent-packages frontend/" "$REPO_DIR"
