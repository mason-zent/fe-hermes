#!/usr/bin/env bash
# bznav-web 표준 검증 (앱 또는 패키지 단위)
#   scripts/verify/bznav-web.sh <앱>            예: refund-web · care-web · brand-web · sena-web · plus-web
#   scripts/verify/bznav-web.sh packages/<pkg>  예: packages/ui  (→ pnpm --filter @repo/ui lint)
# 규칙 출처: .ai/basic-rule.md 7장. care-web 만 type-check·test:unit 이 있고 나머지는 tsc --noEmit 로 대체.
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"; source "$HERMES_DIR/scripts/verify/_lib.sh"
REPO_DIR="$HERMES_DIR/repos/bznav-web"
TARGET="${1:-}"
[ -n "$TARGET" ] || { echo "사용: $0 <앱|packages/<pkg>>"; exit 2; }
[ -d "$REPO_DIR" ] || { echo "repos/bznav-web 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
[ -d node_modules ] || skip_step "pnpm install 확인" "node_modules 없음 — pnpm install 먼저"

if [[ "$TARGET" == packages/* ]]; then
  PKG="@repo/${TARGET#packages/}"
  run_step "pnpm --filter $PKG lint" pnpm --filter "$PKG" lint
  [ "$PKG" = "@repo/ui" ] && run_step "pnpm --filter @repo/ui build-storybook" pnpm --filter @repo/ui build-storybook
  print_summary "bznav-web $TARGET" "$REPO_DIR"; exit $?
fi

APP="$TARGET"
[ -d "apps/$APP" ] || { echo "apps/$APP 이 없습니다."; exit 2; }
run_step "pnpm --filter $APP lint" pnpm --filter "$APP" lint
# Relay 앱은 아티팩트가 있어야 타입이 맞는다
relay_missing() {
  case "$APP" in
    care-web)   ! ls apps/care-web/__generated__/*.ts >/dev/null 2>&1 ;;
    refund-web) ! ls apps/refund-web/graphql/__generated__/*.ts >/dev/null 2>&1 ;;
    *) return 1 ;;
  esac
}
if relay_missing; then
  skip_step "타입 검증" "Relay 아티팩트 없음 — 먼저 $([ "$APP" = care-web ] && echo 'pnpm --filter care-web relay' || echo 'pnpm --filter refund-web gen:relay')"
elif [ "$APP" = care-web ]; then
  run_step "pnpm --filter care-web type-check" pnpm --filter care-web type-check
  run_step "pnpm --filter care-web test:unit" pnpm --filter care-web test:unit
else
  run_step "pnpm --filter $APP exec tsc --noEmit" pnpm --filter "$APP" exec tsc --noEmit
fi
print_summary "bznav-web apps/$APP" "$REPO_DIR"
