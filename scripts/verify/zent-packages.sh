#!/usr/bin/env bash
# zent-packages(frontend/) 표준 검증: 패키지 타입체크(build=tsc) → lint → test(스크립트가 있는 패키지만) → changeset 존재 확인
#   scripts/verify/zent-packages.sh <패키지명...>   예: @zenterprise-inc/brics-fe-ui @zenterprise-inc/brics-fe-zent-auth
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"; source "$HERMES_DIR/scripts/verify/_lib.sh"
# HERMES_VERIFY_DIR 가 이 레포의 워크트리면 그쪽을 검증한다 (delegate.sh --cwd 가 넣어준다)
REPO_DIR="$(resolve_repo_dir "$HERMES_DIR/repos/zent-packages")"
[ $# -ge 1 ] || { echo "사용: $0 <패키지명...>"; exit 2; }
[ -d "$REPO_DIR" ] || { echo "repos/zent-packages 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
check_node_version "$REPO_DIR"
[ -d node_modules ] || skip_step "pnpm install 확인" "node_modules 없음 — 루트에서 pnpm install 먼저 (GitHub Packages 토큰)"
# CI(.github/workflows/ci.yml)가 lint 에서 제외하는 패키지 — eslint 설정이 빈 파일이라 항상 실패한다
LINT_EXCLUDED="@zenterprise-inc/brics-fe-ui @zenterprise-inc/brics-fe-zent-auth @zenterprise-inc/brics-fe-datadog-trace"
for PKG in "$@"; do
  run_step "pnpm build --filter=$PKG..." pnpm build --filter="$PKG..."
  case " $LINT_EXCLUDED " in
    *" $PKG "*) skip_step "pnpm lint --filter=$PKG" "CI 도 제외하는 패키지 (brics eslint 프리셋이 빈 파일). prettier 만 맞출 것" ;;
    *) run_step "pnpm lint --filter=$PKG" pnpm lint --only --filter="$PKG" ;;
  esac
  # test 스크립트가 있는 패키지만(예 brics-fe-zent-auth 의 vitest) — 없으면 단계를 만들지 않는다
  if pnpm --filter="$PKG" exec node -e "process.exit(require('./package.json').scripts?.test ? 0 : 1)" >/dev/null 2>&1; then
    run_step "pnpm --filter=$PKG test" pnpm --filter="$PKG" test
  fi
done
# changeset: 새 .changeset/*.md 가 있어야 PR 머지 가능. CI 처럼 **브랜치에 추가된 것**(origin/main...HEAD)과 미커밋을 함께 본다
# (미커밋만 보면 changeset 을 먼저 커밋한 뒤부터 엄격 검증이 매번 실패한다)
# 후보: 브랜치에 추가된 것 + 미커밋으로 추가·수정된 것(삭제 제외). README 는 빼고, 마지막으로 **지금 파일이 있는지** 본다
#   (브랜치에서 추가한 뒤 작업 트리에서 지운 changeset 은 인정하지 않는다)
CHANGESET_FOUND=""
while IFS= read -r candidate; do
  [ -n "$candidate" ] && [ -f "$candidate" ] && CHANGESET_FOUND="$candidate" && break
done < <(
  { git diff --name-only --diff-filter=A origin/main...HEAD -- .changeset 2>/dev/null
    git status --porcelain --untracked-files=all -- .changeset | grep -v '^.D\|^D' | cut -c4-
  } | grep '\.md$' | grep -v '/README\.md$'
)
if [ -n "$CHANGESET_FOUND" ]; then
  run_step "changeset 존재" true
else
  skip_step "changeset 존재" "브랜치(origin/main 이후)·작업 트리 어디에도 새 .changeset/*.md 없음 — 변경이 있으면 pnpm changeset 필요 (문서만이면 --empty)"
fi
print_summary "zent-packages frontend/" "$REPO_DIR"
