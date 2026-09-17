# Hermes 확장 가이드

스킬(슬래시 커맨드)과 에이전트는 파일 하나로 추가된다. 추가한 뒤에는 문서 몇 곳을 같이 손봐야 한다.

## 스킬 추가
- `.claude/skills/<이름>/SKILL.md` 하나 만들면 `/<이름>`으로 바로 뜬다
- frontmatter에 `name`, `description`, 필요하면 `argument-hint`를 둔다
- 본문에서 `$ARGUMENTS`로 인자를 받는다
- 기존 `.claude/skills/feature/SKILL.md`를 복사해서 고치는 게 가장 빠르다

```yaml
---
name: 이름
description: 어떤 요청이면 이 스킬인지 한 문장
argument-hint: "인자 예시"
---
```

## 에이전트 추가
- `.claude/agents/<이름>.md` 하나 만들면 된다
- frontmatter의 `description`이 헤르메스가 라우팅할 때 읽는 문장이다. "어떤 요청이면 이 에이전트"를 구체적으로 적는다
- description 안에 콜론+공백(`: `)이 들어가면 YAML이 깨진다
- 담당 레포가 있으면 `tools`와 본문에 레포 절대경로·검증 명령을 적는다 (기존 `.claude/agents/*.md` 참고)

## 같이 갱신할 곳
| 파일 | 고칠 곳 |
|---|---|
| `AGENTS.md` | 담당 레포 표, 라우팅 기준 (도구 무관 공통 문서) |
| `CLAUDE.md` | 서브에이전트 표, Skills 표 |
| `README.md` | 팀 표, 사용 목록, 구조 |
| `docs/playbook.html` | 팀 구성·슬래시 커맨드·폴더 구조 섹션, 헤더의 `agents N · skills N` |

`/sync`는 레포 쪽 변화만 반영하고 hermes 자체 구조 변화는 잡지 않는다. 스킬이나 에이전트를 추가했으면 헤르메스에게 **"방금 추가한 스킬 문서에도 반영해줘"**라고 하면 위 세 곳을 갱신한다.

## 보는 방법
- 터미널: `/guide` (이 문서를 채팅에 출력), `/guide pane` (오른쪽 pane에 **선택형 메뉴**), `/guide pane <파일>` (오른쪽 pane에 파일을 less로), `/guide 열기` (플레이북 HTML을 브라우저로)
- 메뉴(`scripts/guide-menu.sh`): 항목을 **마우스로 클릭**하거나 ↑/↓·휠·숫자로 고르고 Enter로 실행, `q`로 종료. 7개 항목이 두 그룹으로 나뉜다
  - **⚡ 실행 · 확인** — ① **스킬 목록 · 실행** ② 에이전트 · 담당 레포 · 라우팅 ③ git 현황 · 진행 중 계획서
  - **📘 문서** — ④ 플레이북 열기 ⑤ 서비스 맵 ⑥ 작업 흐름 ⑦ 확장 가이드
- **스킬 목록**은 `.claude/skills/*/SKILL.md`의 frontmatter(`name`·`argument-hint`·`description`)를 그때그때 읽어 만든다. 스킬을 추가하면 메뉴에 자동으로 나온다. 번호를 고르면 `⏎`로 인자를 입력해 **아래에 새 pane을 열어 별도 헤르메스 세션**으로 `/<스킬>`을 실행하거나(기존 Claude Code pane은 건드리지 않는다. herdr 안에서만 동작, 아니면 프롬프트를 화면에 표시), `v`로 SKILL.md 본문을 볼 수 있다
- **에이전트 목록**도 `.claude/agents/*.md`에서 `name`·`description`·`- 레포:`를 읽어 만들고, 그 아래에 `AGENTS.md`의 "어느 레포인지 고르기" 라우팅 기준을 붙인다
- 문서 항목은 **마크다운 뷰어**로 열린다. `glow`가 설치돼 있으면 glow, 없으면 내장 렌더러 `scripts/mdview.py`(의존성 없음, 제목·목록·표·코드·굵게 서식). 특정 파일을 직접 보려면 `/guide pane <파일>`을 쓴다
- 스크립트 단독: `scripts/guide-pane.sh [파일]`. `.md`를 주면 뷰어로, 그 외는 less로 띄운다. herdr 안이면 `herdr pane split`, tmux면 `split-window`, 둘 다 아니면 새 Ghostty 창으로 대체된다
- 공유용 플레이북: https://claude.ai/artifact/NDbDm5eitYXjdA6E4mehxx#extend
