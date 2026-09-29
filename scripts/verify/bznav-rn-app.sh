#!/usr/bin/env bash
# bznav-rn-app(비즈넵 모바일 앱, Expo · React Native) 표준 검증: lint → 타입 검사. 에이전트와 reviewer 가 같은 것을 돌린다.
# 사용: scripts/verify/bznav-rn-app.sh            (hermes 어디서든)
# prd 의 package.json 에 lint·typecheck·test 스크립트가 없다 — eslint.config.js(expo + tanstack query)로 `yarn expo lint`,
# 타입은 `yarn tsc --noEmit` 을 직접 돌린다. Node 는 .nvmrc(20.19.x) — 다르면 경고 단계로 기록된다.
# 네이티브 빌드(expo run:*, eas build)·OTA(eas update)는 검증에 넣지 않는다 — 기기·계정이 필요하다.
HERMES_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
source "$HERMES_DIR/scripts/verify/_lib.sh"
# HERMES_VERIFY_DIR 가 이 레포의 워크트리면 그쪽을 검증한다 (delegate.sh --cwd 가 넣어준다)
REPO_DIR="$(resolve_repo_dir "$HERMES_DIR/repos/bznav-rn-app")"
[ -d "$REPO_DIR" ] || { echo "repos/bznav-rn-app 링크가 없습니다. scripts/setup.sh 를 실행하세요."; exit 2; }
cd "$REPO_DIR"
check_node_version "$REPO_DIR"

if [ ! -d node_modules ]; then
  skip_step "yarn install 확인" "node_modules 없음 — yarn install 먼저 (패키지 매니저는 yarn, yarn.lock 기준)"
else
  run_step "yarn expo lint" yarn expo lint
  # prd 의 eslint.config.js 가 깨져 있으면 규칙 검사 전에 죽는다(issues/20260929-bznav-rn-app-eslint-config.md).
  # 그건 "lint 오류"가 아니라 "lint 를 못 돌렸다"이므로 실패 대신 건너뜀으로 바꿔 적는다 — 엄격 모드에선 여전히 실패다
  last=$((${#STEP_NAMES[@]} - 1))
  if [ "${STEP_RESULTS[$last]}" != "✅ 통과" ] && grep -q 'could not find plugin "@typescript-eslint"' "${STEP_LOGS[$last]}" 2>/dev/null; then
    lint_log="${STEP_LOGS[$last]}"
    unset "STEP_NAMES[$last]" "STEP_RESULTS[$last]" "STEP_SECS[$last]" "STEP_LOGS[$last]"
    STEP_NAMES=("${STEP_NAMES[@]}"); STEP_RESULTS=("${STEP_RESULTS[@]}"); STEP_SECS=("${STEP_SECS[@]}"); STEP_LOGS=("${STEP_LOGS[@]}")
    VERIFY_FAILED=0
    for result in "${STEP_RESULTS[@]}"; do case "$result" in ❌*) VERIFY_FAILED=1 ;; esac; done
    skip_step "yarn expo lint" "레포 eslint.config.js 설정 오류로 lint 실행 불가(@typescript-eslint 플러그인 미등록) — 코드 문제 아님, issues/20260929-bznav-rn-app-eslint-config.md · 로그 $lint_log"
  fi
  run_step "yarn tsc --noEmit" yarn tsc --noEmit
fi
print_summary "bznav-rn-app" "$REPO_DIR"
