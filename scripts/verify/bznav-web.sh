#!/usr/bin/env bash
# bznav-web 표준 검증 (앱 또는 패키지 단위)
#   scripts/verify/bznav-web.sh <앱>            예: refund-web · care-web · brand-web · sena-web · plus-web
#   scripts/verify/bznav-web.sh packages/<pkg>  예: packages/ui  (→ 그 폴더 package.json 의 name 으로 pnpm --filter <name> lint)
# 규칙 출처: .ai/basic-rule.md 7장. care-web 만 type-check·test:unit 이 있고 나머지는 tsc --noEmit 로 대체.
# 무거운 검증이라 한 대에 하나씩, 부하를 보며 돈다(scripts/heavy.sh — 이미 잠금 안이면 그냥 통과)
[ -z "${HERMES_HEAVY_HELD:-}" ] && exec "$(cd "$(dirname "$0")/.." && pwd)/heavy.sh" "$0" "$@"
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"; source "$HERMES_DIR/scripts/verify/_lib.sh"
# HERMES_VERIFY_DIR 가 이 레포의 워크트리면 그쪽을 검증한다 (delegate.sh --cwd 가 넣어준다)
REPO_DIR="$(resolve_repo_dir "$HERMES_DIR/repos/bznav-web")"
TARGET="${1:-}"
[ -n "$TARGET" ] || { echo "사용: $0 <앱|packages/<pkg>>"; exit 2; }
[ -d "$REPO_DIR" ] || { echo "repos/bznav-web 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
check_node_version "$REPO_DIR"
[ -d node_modules ] || skip_step "pnpm install 확인" "node_modules 없음 — pnpm install 먼저"

if [[ "$TARGET" == packages/* ]]; then
  # 폴더 이름으로 패키지 이름을 짐작하지 않는다 — ui-deprecated 는 @zenterprise-inc/ui 다
  [ -f "$TARGET/package.json" ] || { echo "$TARGET/package.json 이 없습니다."; exit 2; }
  PKG="$(node -p "require('./$TARGET/package.json').name")"
  HAS_LINT="$(node -p "Boolean(require('./$TARGET/package.json').scripts?.lint)")"
  if [ "$HAS_LINT" = true ]; then
    run_step "pnpm --filter $PKG lint" pnpm --filter "$PKG" lint
  else
    # project-config 처럼 설정만 내보내는 패키지는 lint 스크립트가 없다 — 통과로 적지 않고 건너뜀으로
    skip_step "pnpm --filter $PKG lint" "$TARGET 에 lint 스크립트가 없다(설정만 내보내는 패키지) — 바꾼 설정을 쓰는 앱을 bznav-web.sh <앱> 으로 검증한다"
  fi
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
  # jsdom 이 쓰는 canvas 네이티브 바이너리가 빌드돼 있는지 확인 (pnpm 격리 구조라 실제 경로로 본다)
  if ls node_modules/.pnpm/canvas@*/node_modules/canvas/build/Release/canvas.node >/dev/null 2>&1; then
    run_step "pnpm --filter care-web test:unit" pnpm --filter care-web test:unit
  else
    skip_step "pnpm --filter care-web test:unit" "canvas 네이티브 바이너리 없음 (jsdom 의존) — 코드 문제가 아니라 환경 문제. 고치는 법은 docs/knowledge/common/verify.md 참고"
  fi
else
  run_step "pnpm --filter $APP exec tsc --noEmit" pnpm --filter "$APP" exec tsc --noEmit
fi
print_summary "bznav-web apps/$APP" "$REPO_DIR"
