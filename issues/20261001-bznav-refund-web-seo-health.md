---
title: refund-web SEO Health — 🔴 13 · 🟠 5 (10-01 기준)
status: open
repo: bznav-web/refund-web
agent: bznav-refund-fe
kind: seo
seo-key: refund
severity: high
source: slack seo-health-bznav SEO Health 봇
plan:
---

SEO Health 봇 주간 리포트를 서비스 단위로 추적하는 이슈. 매주 월요일 헤르메스(`/seo-feedback`)가 갱신한다. 항목 하나를 골라 [처리 시작]하면 그 항목으로 계획서를 만들고, 그 줄 끝에 계획서·PR 을 적는다.

## 현재 항목
- [ ] 🔴 `lab/lcp` 모바일 LCP 기준 초과 — 13건 · 최대 27.7s(`/help/faq`) · 2회째(09-28~) ▲
- [ ] 🟠 `index/pending` 색인 안 됨 — 5건 · 2회째(09-28~)
- [ ] 🔴 `lab/cls` 모바일 CLS 기준 초과 — 해결 추정(10-01 미검출, 직전 2건 · 최대 1.02)

## 경로별 (최신 리포트)
| 규칙 | 경로 | 값 |
|---|---|---|
| `lab/lcp` | `/help/faq` | 27.7s |
| `lab/lcp` | `/home/event/share` | 26.2s |
| `lab/lcp` | `/home/reviews` | 22.4s |
| `lab/lcp` | `/help/guide/tax-refund-check` | 21.3s |
| `lab/lcp` | `/home/event/refund-notice` | 19.1s |
| `lab/lcp` | 외 8건 (`/help` 18.7s · `/help/guide/correction-claim` 17.2s · `/home/capital-gain` 14.3s · `/home/event/refund-notice-kbcard` 13.5s · `/help/guide/income-tax-refund` 12.7s · `/home/corp` 11.1s · `/home/event/refundbada` 10.8s · `/help/guide/business-tax-refund` 9.5s) | |
| `index/pending` | `/home/capital-gain` · `/home/corp` · `/help/guide/tax-refund-check` · `/help/guide/correction-claim` | Discovered - currently not indexed |
| `index/pending` | `/home/event/refund-notice-kbcard` | URL is unknown to Google |

- 직전 대비 `lab/lcp` 경로 변화: 새로 `/home/event/refundbada` · 빠진 `/home/event/refund-notice-shinhancard`
- 도메인 실사용자(CrUX 28일) 🟢 — 실험실 수치와 차이가 크다

## 주간 기록
| 리포트 | 종류 | 🔴 | 🟠 | 신규 | 해결 | 비고 | ts |
|---|---|---|---|---|---|---|---|
| 09-28 | 정기 | 15 | 5 | — | — | 비교 기준(직전) · run 36357415090 | 1790550764.244479 |
| 10-01 | 수동 | 13 | 5 | — | `lab/cls` 해결 추정 | run 36824292303 | 1790836232.607689 |
