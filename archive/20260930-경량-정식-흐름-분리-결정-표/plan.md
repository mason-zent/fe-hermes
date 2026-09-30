# 경량·정식 흐름 분리 — 다이어그램 두 장 · 결정은 터미널 표 · 판단을 한 줄로 알림

## Checkpoint
- Updated: 2026-09-30 / 헤르메스
- Status: done
- Scope: hermes 워크스페이스 자체 (CLAUDE.md · AGENTS.md · rules · 템플릿 · scripts · docs/diagrams · playbook)
- Work ref: hermes 메인 체크아웃 · main (헤르메스 자체 구조 — 워크트리 없이 main)
- Review: /Users/mason/mason-zent/hermes · 🌿 main · pane w2:p3C (reviewer)
- Approved scope: 1절 결정 3건 — 대화에서 확정(2026-09-30, "A로 진행해줘")

### Progress
- [x] 규칙: 정식 계획서의 결정은 터미널 표로, html 결정 콘솔 폐지 — CLAUDE.md 1·2·5단계, AGENTS.md 5절, dispatch-protocol, plan-template.md(html 절 → 결정 표 절), plan-template-light.md, README, new-plan.mjs, docs/plan-template.html 삭제. 현황판·commit.sh 의 기존 html 동기화는 유지
- [x] 규칙: 판단 한 줄 알림 — CLAUDE.md 1단계, AGENTS.md 5절, delegate.sh /call 머리말
- [x] 다이어그램 JSON: hermes-flow-light · hermes-flow-formal (기존 배치·화살표 뼈대 유지, 이름·보기·카드만) · 옛 hermes-flow.* 삭제
- [x] 다이어그램 HTML: archify(/tmp/archify, 사용자 clone) validate standard 두 장 모두 ok → deliver 성공(hermes-flow-light.html · hermes-flow-formal.html)
- [x] 목록(build-diagram-index 카드 2개, index.html 재생성) · diagrams/README · guide 메뉴·스킬 · playbook(흐름 절·결정 표·트리·FAQ) · CLAUDE.md 머리 안내문
- [x] 커밋 443571c(규칙·JSON·문서) · 01080b7(현황판 날짜 — 옛 파일 삭제 3개가 --amend 로 딸려 들어감, push 됨) · push · 아티팩트 재게시
- [x] reviewer(w2:p3C) — 수정 필요 2: 경량 그림이 /call 경로만 그림(브랜치를 누가 만드나) · 정식 req 에 /call. 제안: skipped 태그 · report→에이전트 · quality_profile · 주석·보조 문서(commit.sh·archive-plans·plan-template-light·board SKILL·playbook 칩) · /call 알림 문구 · 이슈 [처리 시작] 알림 · README 이슈 링크 → 전부 반영. 이슈 [처리 시작] detached 워크트리는 범위 밖 → issues/20260930-hermes-board-issue-start-detached.md
- [x] HTML 재생성(standard validate·deliver ok, 태그 길이 두 번 줄임) · 커밋·push

### Next
1. 없음 — detached 이슈는 따로

### Blocked
- 없음

### Validation
- archify validate workflow --quality standard: light ok · formal ok (8개 검사 모두 ok) · deliver ok
- build-diagram-index: 작업 흐름 2 카드 · 잔여 문구 grep: 결정 콘솔은 현황판·commit.sh 의 예전 html 지원과 템플릿 설명만

### Decisions
- D1 정식 계획서 승인 방식: **터미널 결정 표**(선택지·영향·추천을 표로 보여 주고 대화로 확정 → md "사용자 결정 사항"에 기록). html 결정 콘솔(docs/plan-template.html)은 새로 만들지 않는다. 기존 계획서의 html 은 남겨 두고 현황판·commit.sh 동기화는 있으면 계속 맞춘다 (사용자 "A로 진행해줘", 메모리 "결정은 터미널 표로"와 일치)
- D2 경량/정식 판단: 헤르메스가 라우팅할 때 정하고 **한 줄로 알린다**(`📋 경량으로 진행합니다 — 이유 · 경로`, 정식이면 결정 개수). /call 은 뜬 에이전트가 첫 보고에 붙인다. 사용자가 "정식으로"/"바로 고쳐"로 바꿀 수 있다
- D3 다이어그램: 흐름을 **두 장**으로 나눈다 — 경량(레포 하나, pane 에서 커밋·리뷰·PR 까지) / 정식(여러 레포·결정 표 승인·순차 디스패치·헤르메스 리뷰·ship.sh --repo-agent). 공통 규칙·재개·정리 카드는 정식 쪽에만. 품질은 standard(서비스 다이어그램은 showcase 유지 — docs/diagrams/README.md)

### Commits
- 443571c 규칙·템플릿·다이어그램 JSON·문서
- 01080b7 현황판 날짜 표시 — ⚠️ 이 작업의 옛 파일 삭제 3개(hermes-flow.html · hermes-flow.workflow.json · plan-template.html)가 --amend 로 함께 들어갔다. 이 커밋을 revert 하면 옛 파일이 되살아난다
- (다음 커밋) HTML 두 장 · 리뷰 반영

## 1. 개요
- 작업 유형: refactor (워크스페이스 운영 구조)
- 요청 사항: 다이어그램이 경량·정식을 한 흐름으로 그려 "라우팅 → 계획서 → 승인" 을 모든 작업이 겪는 것처럼 보인다. 실제로는 대부분 경량이라 계획서를 보여 주지도 승인받지도 않고, 레포 하나짜리는 pane 안에서 리뷰·PR 까지 끝난다. 흐름을 둘로 나눠 그리고, 판단을 사용자에게 알리고, 정식의 결정은 html 대신 터미널 표로 받는다
- 대상: hermes 자체 (FE 레포 변경 없음)
- 사용자 결정 사항: 위 Decisions D1~D3 (모두 확정)

## 2. 현재 상태
- `CLAUDE.md` 1·2단계 — 정식 = md + html(결정 콘솔, `docs/plan-template.html` 복사, `decisions[]`), [프롬프트로 복사] 로 확정
- `docs/plan-template.md` — html 동시 생성 절 · "결정은 HTML로" 원칙
- `docs/diagrams/hermes-flow.workflow.json` — 한 장. mainPath req → route → plan → approve → branch → pane → agent, agent → review(헤르메스) → report
- 판단을 알리는 규칙 없음. `/call` 은 `delegate.sh --plan new` 로 조용히 경량 계획서를 만든다
- 다른 세션이 hermes-flow 를 standard 품질로 재생성(b2e7aea) — 새 두 장도 standard

## 3. 설계
### 3.1 결정 표 (D1)
```
| # | 결정 | 선택지 | 추천 ★ | 영향 |
```
- 헤르메스가 정식 계획서 md 를 쓰고 결정 표를 대화에 보여 준다 → 사용자가 대화로 고른다("추천대로", "D2 는 B") → md "사용자 결정 사항"·Checkpoint Decisions 에 확정 기록 → "✅ 확정" 한 줄
- 계획서 파일은 md 하나. 기존 html 은 지우지 않는다

### 3.2 판단 알림 (D2)
```
📋 경량으로 진행합니다 — 레포 하나 · 버그 하나 · plans/task/20260930-….md
   (정식으로 하려면 "정식으로")
📋 정식으로 진행합니다 — 여러 레포(refund·hub) · 결정 3개 · plans/feature/….md
```
- `/call`: delegate.sh 의 /call 머리말에 "첫 보고에 '📋 경량 계획서로 진행 — <경로>' 를 붙인다"

### 3.3 다이어그램 두 장 (D3)
- `hermes-flow-light.workflow.json` — 레인: 사용자 · 헤르메스 · 멈춤 · 에이전트 pane · 기록. 경로: 요청(대화·/call·이슈) → 판단(경량) → 계획서 자동 기록 → pane(브랜치 묻기·워크트리) → 작업·커밋 → 리뷰(옆 reviewer pane) → PR(ship.sh 미리보기 → draft) → 보고. 멈춤: 레포 모호 · 커밋·PR 거부 · 범위가 커짐 → 정식
- `hermes-flow-formal.workflow.json` — 요청 → 라우팅·판단(정식) → 정식 계획서·결정 표 → 사용자 승인 → 브랜치(공유 패키지 먼저) → 레포별 pane → 헤르메스 reviewer·교차 확인 → ship.sh --repo-agent 순서대로 → 보고. 멈춤: 범위 밖 · 확정 전 디스패치 없음 · 브랜치 있음/건너뜀 · 커밋·PR 거부
- 카드: 경량(요청·판단 / pane 에서 작업·커밋 / 리뷰·PR / 멈춤) · 정식(1~6단계 + 멈춤, 공통 규칙·재개·정리 포함)
- 옛 `hermes-flow.*` 삭제, `build-diagram-index.mjs` 카드 두 개

## 4. 작업 배분
| 담당 | 작업 | 의존성 |
|---|---|---|
| 헤르메스 | 규칙·템플릿·scripts·다이어그램 JSON·문서 (hermes 자체) | 없음 |
| 사용자 | archify validate·deliver 실행 (외부 코드라 헤르메스 실행이 막힌다) | JSON 완료 |
| reviewer | 규칙 정합성 · 다이어그램 ↔ CLAUDE.md 대조 | 위 완료 후 |

## 5. 검증
- `git grep` 결정 콘솔·plan-template.html·decisions[]·[프롬프트로 복사]·hermes-flow — 새 규칙과 어긋나는 곳 0건(기존 계획서·현황판의 기존 html 지원 제외)
- archify `validate workflow <두 장> --quality standard` 0건 → `deliver` 성공
- `node scripts/build-diagram-index.mjs` 후 index.html 에 두 카드
- 다이어그램 카드 문구 ↔ CLAUDE.md "작업 흐름" 대조
