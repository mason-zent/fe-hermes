---
name: feature
description: 신규 기능을 개발합니다. 대상 서비스를 라우팅하고 계획서 승인 후 담당 FE 에이전트에게 배분합니다.
argument-hint: "기능 설명 (예: hub 메시지 템플릿에 미리보기 추가)"
---

# 신규 기능 개발

요청 기능: $ARGUMENTS

## 절차 (Plan-First)

### 1단계: 라우팅 & 분석
1. CLAUDE.md의 라우팅 기준으로 대상 서비스(복수 가능)를 정한다
2. 대상 레포에서 관련 기존 코드를 탐색한다 (Explore 에이전트 활용). 재사용 가능한 컴포넌트/훅/API 생성물을 찾는다
3. 백엔드·공유 패키지 변경이 필요한지 판단한다 → 있으면 "외부 의존"

### 2단계: 계획서 작성 (= 작업 카드)
- `plans/feature/YYYYMMDD-제목.md` + `.html` (docs/plan-template.md 참고)
- **개요 다음에 Checkpoint 블록**(Status / Work ref / Progress / Next / Blocked / Validation / Decisions)을 넣는다. `/new` 이후 재개의 근거다
- 서비스별 화면 설계, API 의존성, 공통 스펙, 작업 배분표 포함
- 사용자에게 두 파일 경로 제시 → 승인 요청

### 3단계: 승인 후 — 작업 브랜치 → 디스패치
1. **`/branch <티켓> <대상...>` 으로 작업 브랜치·워크트리를 먼저 만든다.** 기본이 워크트리라 레포가 지저분해도 시작할 수 있고 여러 서비스를 동시에 돌릴 수 있다. 건너뛴 레포에는 디스패치하지 않는다
2. 브랜치·base SHA·워크트리 경로를 계획서 Checkpoint 의 `Work ref` 에 적는다
3. `scripts/delegate.sh <에이전트> --cwd <워크트리>` 로 pane 을 열고 그 안에서 작업을 지시한다. 서비스마다 pane 을 따로 연다. 한 번에 끝나는 일이면 두 번째 인자로 프롬프트를 실어 보낸다
4. 디스패치 프로토콜: `.claude/rules/dispatch-protocol.md`

### 4단계: 검증
- `reviewer` 디스패치 (계획서 경로 + 대상 레포)
- 수정 필요 시 해당 FE 에이전트 재디스패치

### 5단계: 보고
- 서비스별 변경 파일, 주요 변경, 검증 결과, 남은 위험. 커밋 여부는 사용자에게 확인
