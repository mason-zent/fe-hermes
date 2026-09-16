---
name: sync
description: 담당 4개 레포의 origin/dev 를 훑어 에이전트 md(.claude/agents/*.md), docs/services.md, docs/playbook.html 을 실제 레포 상태에 맞게 갱신합니다. 이전 sync 이후 바뀐 부분만 찾아 고칩니다.
argument-hint: "(선택) 레포 이름 일부 — 예: hub, bznav. 비우면 전체"
---

# 레포 ↔ 문서 동기화

대상: $ARGUMENTS (비어 있으면 4개 레포 전체)

각 레포의 `origin/dev` 를 기준으로 헤르메스 문서가 사실과 맞는지 확인하고 틀린 곳만 고친다. 로컬 작업 트리는 브랜치가 제각각이라 **읽지 않는다.** 항상 `origin/dev` 트리를 본다.

## 절차

### 1단계: 지문 생성
```bash
node scripts/sync-fingerprint.mjs            # 전체
node scripts/sync-fingerprint.mjs --repo hub # 특정 레포
```
- `origin/dev` 를 fetch 하고 레포별 지문(스택 버전, scripts, 포트, prettier, 디렉토리 구조, 규칙 문서 blob)을 `.sync/pending/` 에 저장
- 이전 baseline(`.sync/snapshots/`)과 비교한 리포트를 출력하고 `.sync/last-report.md` 에도 남긴다
- 리포트에 "변경 없음 (동일 커밋)" 만 있으면 사용자에게 그렇게 보고하고 종료

### 2단계: 변경 내용 파악 (변경된 레포마다)
리포트의 세 블록을 순서대로 읽는다.
1. **지문 변화** — 버전·명령·포트·디렉토리 diff. 이건 그대로 문서에 반영할 사실이다
2. **규칙·소개 문서 변화** — README, `.ai/basic-rule.md`, `.github/agents/*.agent.md` 등이 바뀐 경우. 반드시 내용을 읽는다:
   ```bash
   git -C <레포경로> diff <이전sha>..<새sha> -- README.md
   git -C <레포경로> show origin/dev:.ai/basic-rule.md
   ```
3. **커밋 목록** — 새 도메인/화면이 생겼는지, 라이브러리 교체가 있었는지 힌트. 의심되면 해당 경로를 `git show origin/dev:<path>` 로 확인

지문에 잡히지 않는 큰 구조 변화(예: 라우터 전환, 상태 라이브러리 교체)가 커밋 제목에 보이면 `git -C <레포> diff --stat <이전sha>..<새sha>` 로 범위를 확인한다.

### 3단계: 문서 갱신
갱신 대상과 반영 범위:

| 파일 | 반영하는 것 |
|---|---|
| `.claude/agents/<agent>.md` | 기술 스택 버전, 명령어, 포트, 디렉토리 구조, 코드 스타일(prettier), 레포 규칙 문서 경로, 새 도메인 화면 |
| `docs/services.md` | 비교표의 같은 항목 (Next 버전, Node/pnpm, 포트, 검증 명령, 규칙 문서) |
| `docs/playbook.html` | 팀 구성 표의 스택·포트·검증 명령 셀, 라우팅 키워드에 새 도메인 추가, **"문서 기준 커밋" 표(레포별 sha·날짜·제목)와 헤더 `last sync` 시각**, 갱신 후 같은 URL로 아티팩트 재배포 |
| `CLAUDE.md` | 팀 구성 표의 "서비스"·"스택 요약" 셀, 라우팅 기준에 새 도메인 키워드 |

원칙:
- **사실만 자동 반영.** 스택·명령·포트·구조·포맷 설정은 지문대로 고친다
- **판단이 들어간 문장은 건드리지 않고 표시한다.** 권한 가드 설명, 주의사항, 라우팅 키워드 삭제 같은 것은 바꾸지 말고 보고서에 "확인 필요"로 적는다 (새 도메인 키워드 *추가*는 해도 된다)
- 에이전트 md 의 description(frontmatter)에 새 도메인이 생기면 추가한다. YAML 이므로 `: ` (콜론+공백)을 넣지 않는다
- 4개 문서에 같은 사실이 있으면 **모두 같은 턴에** 고친다. 한 곳만 고쳐 어긋나게 두지 않는다
- 레포 자체 규칙 문서(bznav-web 의 `.ai/basic-rule.md` 등)가 바뀌었으면 에이전트 md 의 "코드 스타일 요약" 절이 원문과 어긋나지 않는지 대조한다

### 4단계: baseline 확정
문서 갱신이 끝나면:
```bash
node scripts/sync-fingerprint.mjs --accept
```
pending 지문이 `.sync/snapshots/` 로 이동한다. **문서를 고치기 전에 accept 하지 않는다** (실패하면 다음 sync 에서 같은 diff 를 다시 봐야 한다).

### 5단계: 보고
- 레포별: origin/dev 커밋 범위, 문서에 반영한 사실 목록(파일:항목), "확인 필요"로 남긴 항목
- 변경 없는 레포는 한 줄로
- 첫 실행(baseline 없음)이면: 지문 전체를 각 md 와 대조해 틀린 사실을 고친 결과를 보고하고 accept

## 주의
- 이 스킬은 헤르메스가 **직접** 수행한다 (문서 편집은 코드 작업이 아니므로 FE 에이전트에 넘기지 않는다). 레포 내용을 깊게 읽어야 하면 Explore 에이전트를 써도 된다
- 레포 코드는 절대 수정하지 않는다. 읽기만
- `.sync/snapshots/` 는 baseline 이므로 지우지 않는다. `.sync/pending/`, `.sync/last-report.md` 는 임시
