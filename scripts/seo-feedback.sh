#!/usr/bin/env bash
# SEO Health 슬랙 리포트 → 칸반 이슈 (/seo-feedback) 를 헤드리스로 돌리고, 매주 월 08:15 launchd 에 건다.
# 사용:
#   scripts/seo-feedback.sh [run [서비스...]]  지금 한 번 실행 (claude -p "/seo-feedback <서비스> --auto")
#   scripts/seo-feedback.sh install    이 맥의 launchd 에 매주 월 08:15 등록
#   scripts/seo-feedback.sh uninstall  등록 해제
#   scripts/seo-feedback.sh status     등록 여부 · 최근 로그
#
# 자동 실행은 설치한 맥에서만 돈다(레포를 받기만 해서는 걸리지 않는다). 슬랙은 그 맥의 로그인 계정으로 읽기만 한다.
# 팀에 한 명만 설치한다 — 이슈는 각 맥의 로컬에 쌓이므로 여러 대면 이슈가 갈라진다.
set -uo pipefail
HERMES_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="kr.zent.hermes.seo-feedback"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/hermes-seo-feedback.log"

# 헤드리스 세션에 허용할 도구 — 슬랙 읽기, 이슈 파일 읽기·쓰기만 (슬랙에 보내는 도구는 넣지 않는다)
ALLOWED_TOOLS=(
  mcp__claude_ai_Slack__slack_read_channel
  mcp__claude_ai_Slack__slack_read_thread
  mcp__claude_ai_Slack__slack_read_file
  ToolSearch Read Write Edit Glob Grep
)

run_once() {
  local claude_bin services="$*"
  claude_bin="$(command -v claude)" || { echo "claude 를 찾지 못했습니다" >&2; exit 1; }
  cd "$HERMES_DIR" || exit 1
  {
    echo "===== $(date '+%Y-%m-%d %H:%M:%S') seo-feedback 시작 ${services:-(전체)}"
    "$claude_bin" -p "/seo-feedback ${services:+$services }--auto" --allowedTools "${ALLOWED_TOOLS[@]}" 2>&1
    echo "===== $(date '+%Y-%m-%d %H:%M:%S') 종료 (exit $?)"
  } >>"$LOG"
}

install_agent() {
  local claude_bin
  claude_bin="$(command -v claude)" || { echo "claude 를 찾지 못했습니다" >&2; exit 1; }
  echo "⚠️  자동 실행은 팀에 한 명만 설치합니다. 슬랙은 이 맥의 로그인 계정으로 읽기만 합니다."
  mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
  # launchd 는 로그인 셸 PATH 를 모른다 — claude·node·git 이 있는 경로를 넣어 둔다
  local path_env
  path_env="$(dirname "$claude_bin"):$(dirname "$(command -v node 2>/dev/null || echo /usr/local/bin/node)"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
  cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$HERMES_DIR/scripts/seo-feedback.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$path_env</string></dict>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key><integer>1</integer>
    <key>Hour</key><integer>8</integer>
    <key>Minute</key><integer>15</integer>
  </dict>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
  launchctl bootstrap "gui/$(id -u)" "$PLIST" && echo "✅ 등록됨 — 매주 월 08:15 · 로그 $LOG"
}

uninstall_agent() {
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
  rm -f "$PLIST" && echo "해제됨"
}

status_agent() {
  if launchctl print "gui/$(id -u)/$LABEL" >/dev/null 2>&1; then
    echo "등록됨 — $PLIST"
  else
    echo "등록 안 됨"
  fi
  [ -f "$LOG" ] && { echo "--- 최근 로그 ($LOG)"; tail -20 "$LOG"; }
}

case "${1:-run}" in
  run) shift; run_once "$@" ;;
  install) install_agent ;;
  uninstall) uninstall_agent ;;
  status) status_agent ;;
  *) echo "사용: $0 [run|install|uninstall|status]" >&2; exit 2 ;;
esac
