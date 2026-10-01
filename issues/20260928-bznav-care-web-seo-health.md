---
title: care-web SEO Health — 🔴 12 · 🟠 4 (09-28 기준)
status: open
repo: bznav-web/care-web
agent: bznav-care-fe
kind: seo
seo-key: care
severity: high
source: slack seo-health-bznav SEO Health 봇
plan:
---

SEO Health 봇 주간 리포트를 서비스 단위로 추적하는 이슈. 매주 월요일 헤르메스(`/seo-feedback`)가 갱신한다. 항목 하나를 골라 [처리 시작]하면 그 항목으로 계획서를 만들고, 그 줄 끝에 계획서·PR 을 적는다.

## 현재 항목
- [ ] 🔴 `lab/lcp` 모바일 LCP 기준 초과 — 10건 · 최대 29.0s(`/`) · 2회째(09-21~) ▲
- [ ] 🔴 `lab/cls` 모바일 CLS 기준 초과 — 2건 · 최대 0.74(`/cs-center`) · 2회째(09-21~) ▲
- [ ] 🟠 `onpage/description-duplicate` description 중복 — 2건 · 2회째(09-21~)
- [ ] 🟠 `index/pending` 색인 안 됨 — 1건 · 2회째(09-21~)
- [ ] 🟠 `index/google-canonical-differs` 구글이 다른 canonical 선택 — 1건 · 2회째(09-21~)

## 경로별 (최신 리포트)
| 규칙 | 경로 | 값 |
|---|---|---|
| `lab/lcp` | `/` | 29.0s |
| `lab/lcp` | `/cs-center` | 15.1s |
| `lab/lcp` | `/cs-center/detail/24905cb7-c94b-800e-92d4-c69096f36060` | 14.0s |
| `lab/lcp` | `/cs-center/detail/38805cb7-c94b-805a-ac9d-db81065b30fc` | 12.8s |
| `lab/lcp` | `/cs-center/detail/1e705cb7-c94b-80e8-95ee-fadd7128b8c7` | 12.8s |
| `lab/lcp` | 외 5건 (도움말 상세 7.7~9.9s) | |
| `lab/cls` | `/cs-center` | 0.74 |
| `lab/cls` | `/` | 0.60 |
| `onpage/description-duplicate` | `/cs-center` ↔ `/cs-center/detail/1c305cb7-c94b-8008-b095-f5d4178f3ce9` | 같은 description |
| `index/pending` | `/cs-center/detail/38205cb7-c94b-8005-a18d-d88d72434f4a` | Duplicate without user-selected canonical |
| `index/google-canonical-differs` | `/cs-center/detail/38205cb7-c94b-8005-a18d-d88d72434f4a` | → `/cs-center/detail/21c05cb7-c94b-802d-8dbd-d1300f321463` |

- 직전 대비 `lab/cls` 경로 변화: 빠진 `/cs-center/detail/1dc05cb7-c94b-80ac-bf39-f382c0af9b7d`(0.15)
- 도메인 실사용자(CrUX 28일) 🟠 LCP 2.4s · CLS 0.13

## 주간 기록
| 리포트 | 종류 | 🔴 | 🟠 | 신규 | 해결 | 비고 | ts |
|---|---|---|---|---|---|---|---|
| 09-21 | 정기 | 12 | 5 | — | — | 비교 기준(직전) · run 35543513798 | 1789945851.264619 |
| 09-28 | 정기 | 12 | 4 | — | — | run 36357415090 | 1790550594.520749 |
