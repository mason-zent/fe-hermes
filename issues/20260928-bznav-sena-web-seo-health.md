---
title: sena-web SEO Health — 🔴 8 · 🟠 56 (09-28 기준)
status: open
repo: bznav-web/sena-web
agent: bznav-sena-fe
kind: seo
seo-key: sena
severity: high
source: slack seo-health-bznav SEO Health 봇
plan:
---

SEO Health 봇 주간 리포트를 서비스 단위로 추적하는 이슈. 매주 월요일 헤르메스(`/seo-feedback`)가 갱신한다. 항목 하나를 골라 [처리 시작]하면 그 항목으로 계획서를 만들고, 그 줄 끝에 계획서·PR 을 적는다. 세나는 sitemap 전체(약 42만 URL) 중 50개 표본 점검이라 **규칙 단위로** 비교한다.

## 현재 항목
- [ ] 🔴 `lab/lcp` 모바일 LCP 기준 초과 — 8건 · 최대 11.5s(`/contents/3747`) · 2회째(09-21~) ▲
- [ ] 🟠 `lab/cls` 모바일 CLS 기준 초과 — 4건 · 최대 0.22(`/contents/2233`) · 2회째(09-21~) ▼
- [ ] 🟠 `onpage/description-duplicate` description 중복 — 50건(표본 전부, 사이트 기본 description) · 2회째(09-21~)
- [ ] 🟠 `onpage/title-length` title 60자 초과 — 2건 · 2회째(09-21~)

## 경로별 (최신 리포트)
| 규칙 | 경로 | 값 |
|---|---|---|
| `lab/lcp` | `/contents/3747` | 11.5s |
| `lab/lcp` | `/contents/1526` | 11.1s |
| `lab/lcp` | `/contents/1697` | 10.1s |
| `lab/lcp` | `/contents/6778` | 10.1s |
| `lab/lcp` | `/` | 9.1s |
| `lab/lcp` | 외 3건 (`/contents/6466` 8.7s · `/contents/6641` 7.7s · `/contents/2233` 5.7s) | |
| `lab/cls` | `/contents/2233` · `/contents/1697` · `/contents/1526` · `/contents/6778` | 0.22 · 0.20 · 0.15 · 0.10 |
| `onpage/description-duplicate` | `/` 포함 표본 50개 전부 | "세무, 법률, 노무와 관련한 어떤 질문이든…" |
| `onpage/title-length` | `/contents/7645` · `/contents/8136` | 67자 · 62자 |

- 봇 안내 관련 파일: `apps/sena-web/app/contents/(conversion)/[id]/page.tsx`(generateMetadata) · `app/layout.tsx`(기본 description)
- 도메인 실사용자(CrUX 28일) 🟢 LCP 1.2s · CLS 0.08

## 주간 기록
| 리포트 | 종류 | 🔴 | 🟠 | 신규 | 해결 | 비고 | ts |
|---|---|---|---|---|---|---|---|
| 09-21 | 정기 | 8 | 56 | — | — | 비교 기준(직전) · run 35543513798 | 1789945973.687909 |
| 09-28 | 정기 | 8 | 56 | — | — | run 36357415090 | 1790550786.031819 |
