---
name: sync
description: hermes.config.json 의 담당 레포 전체를 운영 기준 브랜치(콘솔 prd · bznav 앱별 prd-<앱> · zent-packages main)로 훑어 지문을 만들고, 사실마다 정한 정본 문서(knowledge · config · 지문)만 갱신한 뒤 파생 문서를 스크립트로 생성합니다. 이전 sync 이후 바뀐 부분만 찾아 고칩니다.
argument-hint: "(선택) 레포 이름 일부 — 예: hub, bznav. 비우면 전체"
---

# 레포 ↔ 문서 동기화

대상: $ARGUMENTS (비어 있으면 hermes.config.json 의 레포 전체)

각 레포의 `origin/<branch>`(정본은 `hermes.config.json` — 콘솔 4개 `prd` · bznav 앱별 `prd-<앱>` · bznav `packages/*` 는 `dev` · zent-packages `main`)를 기준으로 헤르메스 문서가 사실과 맞는지 확인하고 틀린 곳만 고친다. 로컬 작업 트리는 브랜치가 제각각이라 **읽지 않는다.** 레포 경로는 `repos/<name>` 링크다. bznav-web 은 앱마다 기준 브랜치가 다르므로 `docs/knowledge/bznav-web/<앱>/` 과 공통 `common.md` 를 나눠 본다.

## 절차

### 1단계: 지문 생성
```bash
node scripts/sync-fingerprint.mjs            # 전체
node scripts/sync-fingerprint.mjs --repo hub # 특정 레포
```
- 레포별 기준 브랜치(`hermes.config.json` 의 `branch`, bznav-web 은 앱마다 `prd-<앱>`)를 fetch 하고 지문(스택 버전, scripts, 포트, prettier, 디렉토리 구조, 규칙 문서 blob)을 `.sync/pending/` 에 저장
- 이전 baseline(`.sync/snapshots/`)과 비교한 리포트를 출력하고 `.sync/last-report.md` 에도 남긴다
- 리포트에 "변경 없음 (동일 커밋)" 만 있으면 사용자에게 그렇게 보고하고 종료

### 2단계: 변경 내용 파악 (변경된 레포마다)
리포트의 세 블록을 순서대로 읽는다.
1. **지문 변화** — 버전·명령·포트·디렉토리 diff. 이건 그대로 문서에 반영할 사실이다
2. **규칙·소개 문서 변화** — README, `.ai/basic-rule.md`, `.github/agents/*.agent.md` 등이 바뀐 경우. 반드시 내용을 읽는다:
   ```bash
   git -C repos/<레포> diff <이전sha>..<새sha> -- README.md
   git -C repos/<레포> show origin/<기준브랜치>:.ai/basic-rule.md
   ```
3. **커밋 목록** — 새 도메인/화면이 생겼는지, 라이브러리 교체가 있었는지 힌트. 의심되면 해당 경로를 `git show origin/<기준브랜치>:<path>` 로 확인

지문에 잡히지 않는 큰 구조 변화(예: 라우터 전환, 상태 라이브러리 교체)가 커밋 제목에 보이면 `git -C <레포> diff --stat <이전sha>..<새sha>` 로 범위를 확인한다.

### 3단계: 정본 갱신 (문서마다가 아니라 사실마다)

**사실 하나에 담당 문서 하나다.** 같은 사실을 여러 문서에 따로 적어두지 않는다. 그렇게 해서 생긴 불일치가 이미 여러 건 있었다.

| 사실 | 정본 | 파생 |
|---|---|---|
| 레포·에이전트·기준 브랜치 매핑 | `hermes.config.json` | — |
| 버전·포트·Node/pnpm·Prettier·검증 스크립트·기준 커밋 | **지문**(`.sync/snapshots/`) | `docs/services.md` 자동 표, `docs/playbook.html` 기준 커밋 표·last sync → **`scripts/build-derived.mjs` 가 생성** |
| 디렉토리·라우트 맵 | `docs/knowledge/<레포>/structure.md` (bznav 는 `<앱>/`) | — |
| 레포 규칙·필수 제약 | `docs/knowledge/<레포>/rules.md` | — |
| 함정·문서와 코드의 불일치 | `docs/knowledge/<레포>/gotchas.md` | — |
| 대표 예시·절차 | `patterns.md` · `workflows.md` | — |
| 역할·담당 범위·지식 진입 경로 | `.claude/agents/<agent>.md` | — |

**절차**:

1. **지문에서 나오는 사실은 손으로 옮겨 적지 않는다.** 문서 갱신 대신 아래를 돌린다:
   ```bash
   node scripts/build-derived.mjs          # 지문 → services.md 자동 표, playbook 기준 커밋 표·last sync
   node scripts/build-derived.mjs --check  # 쓰지 않고 차이만 확인
   ```
   pending 지문이 있으면 그것을 우선 읽는다(곧 확정할 값으로 문서를 만든다). 마커(`<!-- BEGIN:generated:... -->`) 안은 **직접 편집하지 않는다.**
   이 스크립트는 마커 밖 서술이 지문과 어긋나면 경고만 낸다. 그 경고는 사람이 판단해 고친다.

2. **구조가 바뀌었으면** `docs/knowledge/<레포>/structure.md`를 고친다 (지문의 `dirs`/`routes` 변화를 그대로 반영).

3. **레포 규칙 문서가 바뀌었으면**(리포트의 "규칙·소개 문서 변화") 원문을 읽고 `rules.md`를 고친다. `[필수]` 등급 항목이면 `rules.md`의 **"필수" 절**에 넣는다.

4. **에이전트 md 는 역할·담당 범위·지식 진입 경로가 바뀔 때만 고친다.**
   - ⛔ 버전·포트·스택·디렉토리 트리·Prettier 설정을 **다시 넣지 않는다.** 경량화로 걷어낸 것이다
   - ✅ 새 도메인이 생겨 라우팅 문장(frontmatter `description`)에 키워드를 추가하는 것은 한다. YAML 이므로 `: `(콜론+공백)을 쓰지 않는다
   - ✅ 작업 유형별 진입 표가 가리키는 파일·절이 사라졌으면 경로를 고친다

5. **판단이 들어간 문장은 건드리지 않고 표시한다.** 권한 가드 설명, 주의사항, 라우팅 키워드 삭제 같은 것은 보고서에 "확인 필요"로 남긴다. 지문의 버전이 바뀐 것만으로 사용 패턴이 바뀌었다고 단정하지 않는다.

6. **문서가 코드와 다르면 코드가 맞다.** 어느 쪽이 맞는지 확인할 수 없으면 고치지 말고 "확인 필요"로 남긴다.

### 4단계: baseline 확정
문서 갱신이 끝나면:
```bash
node scripts/build-derived.mjs --check      # 파생 문서가 지문과 일치하는지 마지막 확인
node scripts/sync-fingerprint.mjs --accept  # pending → .sync/snapshots/
```

**accept 하지 않는 경우** (하나라도 해당하면 pending 을 그대로 두고 보고한다):
- fetch 실패·기준 ref 부재로 일부 레포를 읽지 못했다
- 리포트에 "확인 필요"로 남긴 항목이 있는데 사용자 확인을 못 받았다
- `build-derived.mjs --check` 가 차이를 보고했다
- 문서 갱신을 일부만 했다

`--accept` 는 **pending 전체**를 확정한다. 일부만 확정할 수 없으므로, 미완료 대상이 섞여 있으면 돌리지 않는다. (특정 레포만 다루려면 `--repo <이름>` 으로 지문을 그 레포만 만든 뒤 accept 한다.)

성공으로 보고하고 accept 하는 일이 가장 위험하다. 다음 sync 에서 같은 diff 를 다시 보지 못하게 되고, 문서는 틀린 채로 남는다.

### 5단계: 보고
- 레포별: 기준 브랜치 커밋 범위, 문서에 반영한 사실 목록(파일:항목), "확인 필요"로 남긴 항목
- 변경 없는 레포는 한 줄로
- 첫 실행(baseline 없음)이면: 지문 전체를 각 md 와 대조해 틀린 사실을 고친 결과를 보고하고 accept

## 주의
- 이 스킬은 헤르메스가 **직접** 수행한다 (문서 편집은 코드 작업이 아니므로 FE 에이전트에 넘기지 않는다). 레포 내용을 깊게 읽어야 하면 Explore 에이전트를 써도 된다
- 레포 코드는 절대 수정하지 않는다. 읽기만
- `.sync/snapshots/` 는 baseline 이므로 지우지 않는다. `.sync/pending/`, `.sync/last-report.md` 는 임시
