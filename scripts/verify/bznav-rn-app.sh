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
# 메인 체크아웃이 2025-12 에 멈춘 main 이면 옛 코드를 검증하고 ✅ 가 나온다 — 트리 구조로 prd 계열인지 본다.
# 움직이는 origin/prd 를 기준으로 삼지 않는다(작업 브랜치를 딴 뒤 prd 에 PR 이 머지되면 정상 브랜치도 걸린다).
#   prd 계열 = src/navigation/RootStackNavigator.tsx 가 있고 expo-router app/_layout.tsx 가 없다 (전환 커밋 88329e4, 2026-03)
if [ -f src/navigation/RootStackNavigator.tsx ] && [ ! -f app/_layout.tsx ]; then
  # 뒤처짐은 실패가 아니다 — 알리기만 (ref 가 없으면 조용히 넘어간다)
  if base="$(git -C "$REPO_DIR" merge-base HEAD origin/prd 2>/dev/null)"; then
    behind="$(git -C "$REPO_DIR" rev-list --count "$base..origin/prd" 2>/dev/null || echo 0)"
    [ "${behind:-0}" -gt 0 ] && echo "ℹ️ origin/prd 보다 ${behind}커밋 뒤(분기 이후 prd 에 들어온 것) — 실패로 치지 않는다"
  fi
else
  skip_step "기준 브랜치 포함" "옛 구조다(expo-router app/ · src/navigation 없음, HEAD $(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)) — 2025-12 에 멈춘 main 일 수 있다. prd 에서 딴 워크트리를 HERMES_VERIFY_DIR 로 준다"
fi

if [ ! -d node_modules ]; then
  skip_step "yarn install 확인" "node_modules 없음 — yarn install 먼저 (패키지 매니저는 yarn, yarn.lock 기준)"
else
  run_step "yarn expo lint" yarn expo lint
  # prd 의 eslint.config.js 가 깨져 있으면 규칙 검사 전에 죽는다(issues/20260929-bznav-rn-app-eslint-config.md).
  # 그건 "lint 오류"가 아니라 "lint 를 못 돌렸다"이므로 실패 대신 건너뜀으로 바꿔 적는다 — 엄격 모드에선 여전히 실패다
  last=$((${#STEP_NAMES[@]} - 1))
  if [ "${STEP_RESULTS[$last]}" != "✅ 통과" ] && grep -q 'could not find plugin "@typescript-eslint"' "${STEP_LOGS[$last]}" 2>/dev/null; then
    mark_skipped "$last" "레포 eslint.config.js 설정 오류로 lint 실행 불가(@typescript-eslint 플러그인 미등록) — 코드 문제 아님, issues/20260929-bznav-rn-app-eslint-config.md · 로그 ${STEP_LOGS[$last]}"
  fi
  run_step "yarn tsc --noEmit" yarn tsc --noEmit
fi
print_summary "bznav-rn-app" "$REPO_DIR"
