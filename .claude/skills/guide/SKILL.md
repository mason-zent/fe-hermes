---
name: guide
description: 헤르메스 사용·확장 가이드를 터미널에 보여주거나 플레이북 HTML을 브라우저로 엽니다. 스킬·에이전트 추가 방법을 다시 볼 때 사용합니다.
argument-hint: "(없음) | pane | pane <파일> | 열기 | 스킬 | 팀 | 흐름"
---

# 가이드 보기

인자: $ARGUMENTS

## 동작
인자에 따라 아래 중 하나만 수행한다. 파일을 수정하지 않는다.

| 인자 | 동작 |
|---|---|
| 없음 / `확장` | `docs/extending.md`를 읽어 **본문 그대로** 터미널에 출력 |
| `pane` / `창` / `메뉴` | `scripts/guide-pane.sh`를 실행해 **현재 pane 오른쪽에 새 pane**을 열고 선택형 메뉴(`scripts/guide-menu.sh`)를 띄운다. 클릭 또는 ↑/↓·숫자로 고르고 Enter로 실행, `q`로 닫는 메뉴다. 첫 항목이 **스킬 목록·실행**이다 (herdr면 `herdr pane split`, tmux면 `split-window`, 아니면 새 Ghostty 창). 스크립트가 stderr에 ⚠️ 경고를 내면 그대로 전한다. 성공하면 띄웠다는 한 줄과 조작법 한 줄만 답한다 |
| `pane <파일>` / `창 <파일>` | 메뉴 대신 지정 파일을 `less`로 띄운다 (예: `pane CLAUDE.md`) |
| `열기` / `open` | `open docs/playbook.html`로 플레이북을 기본 브라우저에서 연다. 열었다는 한 줄만 답한다 |
| `스킬` / `skills` | `.claude/skills/*/SKILL.md`의 frontmatter(`name`·`argument-hint`·`description`)를 읽어 **쓸 수 있는 슬래시 커맨드 목록**을 표로 출력 |
| `팀` / `에이전트` | `.claude/agents/*.md`의 `name`·`description`·담당 레포를 읽어 표로 출력하고, 이어서 `AGENTS.md`의 "어느 레포인지 고르기" 절을 그대로 붙인다 |
| `흐름` | `CLAUDE.md`의 "작업 흐름 (Plan-First)" 절을 그대로 출력 |
| 그 외 | `docs/extending.md`, `CLAUDE.md`, `docs/services.md`에서 해당 키워드가 있는 절을 찾아 출력 |

## 출력 규칙
- 요약하거나 다시 쓰지 않는다. 문서 본문을 그대로 보여준다
- 마지막 줄에 원본 경로를 한 줄 덧붙인다 (예: `원본: docs/extending.md`)
