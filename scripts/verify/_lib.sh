#!/usr/bin/env bash
# 검증 스크립트 공통 라이브러리. 각 레포 스크립트가 source 해서 쓴다.
#   run_step "<이름>" <명령...>   → 실행·시간 측정·로그 저장, 실패해도 계속 진행
#   skip_step "<이름>" "<이유>"   → 건너뜀으로 기록
#   print_summary                 → 표준 형식 요약 출력, 실패가 있으면 exit 1
# 출력은 에이전트 보고서의 "검증 결과" 절에 그대로 붙일 수 있는 마크다운이다.
set -uo pipefail
VERIFY_LOG_DIR="${VERIFY_LOG_DIR:-$(mktemp -d /tmp/hermes-verify.XXXXXX)}"
declare -a STEP_NAMES=() STEP_RESULTS=() STEP_SECS=() STEP_LOGS=()
VERIFY_FAILED=0

resolve_repo_dir() { # resolve_repo_dir <메인 체크아웃> — 검증할 트리 경로를 출력한다
  # HERMES_VERIFY_DIR(워크트리)가 **같은 레포**의 워크트리일 때만 그쪽을 쓴다.
  # 다른 레포 워크트리를 가리키면 엉뚱한 트리를 검증하게 되므로 무시하고 메인 체크아웃을 쓴다.
  local main_dir="$1" target="${HERMES_VERIFY_DIR:-}" main_common target_common
  if [ -z "$target" ]; then echo "$main_dir"; return; fi
  main_common="$(cd "$main_dir" 2>/dev/null && cd "$(git rev-parse --git-common-dir 2>/dev/null)" 2>/dev/null && pwd -P)"
  target_common="$(cd "$target" 2>/dev/null && cd "$(git rev-parse --git-common-dir 2>/dev/null)" 2>/dev/null && pwd -P)"
  if [ -n "$main_common" ] && [ "$main_common" = "$target_common" ]; then
    git -C "$target" rev-parse --show-toplevel
  else
    echo "⚠️ HERMES_VERIFY_DIR($target)는 $(basename "$main_dir") 의 워크트리가 아니다 — 메인 체크아웃을 검증한다" >&2
    echo "$main_dir"
  fi
}

check_node_version() { # check_node_version <레포경로> — .nvmrc 와 현재 node 버전이 다르면 경고 단계로 기록
  local repo_dir="$1" want cur
  [ -f "$repo_dir/.nvmrc" ] || return 0
  want="$(tr -d ' \n' < "$repo_dir/.nvmrc")"; cur="$(node -v 2>/dev/null)"
  [ -n "$want" ] || return 0
  if [ "${want#v}" != "${cur#v}" ]; then
    skip_step "Node 버전" "레포는 $want 를 요구하는데 현재 $cur. 네이티브 모듈·lint 결과가 달라질 수 있다 → nvm use ${want#v}"
  fi
}

run_step() {
  local name="$1"; shift
  local log="$VERIFY_LOG_DIR/$(echo "$name" | tr ' /:' '___').log"
  local start=$SECONDS
  if "$@" >"$log" 2>&1; then
    STEP_RESULTS+=("✅ 통과")
  else
    STEP_RESULTS+=("❌ 실패 (exit $?)"); VERIFY_FAILED=1
  fi
  STEP_NAMES+=("$name"); STEP_SECS+=("$((SECONDS - start))"); STEP_LOGS+=("$log")
}
skip_step() { STEP_NAMES+=("$1"); STEP_RESULTS+=("⏭ 건너뜀 — $2"); STEP_SECS+=("0"); STEP_LOGS+=(""); }

print_summary() { # print_summary <레포명> <레포경로>
  local repo="$1" path="$2" sha branch
  sha="$(git -C "$path" rev-parse --short HEAD 2>/dev/null || echo '?')"
  branch="$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  echo
  echo "## 검증 결과 — $repo ($branch @ $sha, $(date '+%Y-%m-%d %H:%M'))"
  echo
  echo "| 단계 | 결과 | 소요 |"
  echo "|---|---|---|"
  local i
  for i in "${!STEP_NAMES[@]}"; do
    echo "| \`${STEP_NAMES[$i]}\` | ${STEP_RESULTS[$i]} | ${STEP_SECS[$i]}s |"
  done
  for i in "${!STEP_NAMES[@]}"; do
    case "${STEP_RESULTS[$i]}" in ❌*)
      echo; echo "### ❌ ${STEP_NAMES[$i]} 로그 (마지막 40줄)"; echo '```'
      tail -40 "${STEP_LOGS[$i]}"; echo '```' ;;
    esac
  done
  echo; echo "전체 로그: $VERIFY_LOG_DIR"
  [ "$VERIFY_FAILED" = 0 ]
}
