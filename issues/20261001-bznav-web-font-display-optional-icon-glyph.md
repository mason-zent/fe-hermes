---
title: BZNAVSans font-display optional 로 첫 방문에 아이콘 글자(사용자 정의 영역)가 빈 네모로 보인다
status: open
repo: bznav-web
agent: bznav-packages-fe
kind: bug
severity: medium
source: bznav-brand-fe 2026-10-01 (zent 전환 ② dev 스냅샷 080514 확인 중) · plans/feature/20261001-bznav-web-앱-repo-패키지-zent-전환.md
plan:
pr:
fix:
reason:
---

`eb65e78b2 fix(refund): REF-3742 폰트 로딩 최적화` 가 `packages/ui/src/styles/globals.css` 의 BZNAVSans `@font-face` 8개를 `font-display: optional` 로 바꿨다(origin/dev 반영, prd-brand 미반영). zent `bznav-fe-ui` dev 스냅샷 `0.0.0-dev-20261001080514` 에도 들어 있다.

BZNAVSans 는 텍스트뿐 아니라 **아이콘 글자(사용자 정의 영역, 예 U+E92C)** 도 담고 있다. `optional` 은 폰트가 아주 짧은 시간 안에 오지 않으면 그 페이지 동안 대체 폰트를 쓰는데, 대체 폰트에는 아이콘 글자가 없어 **빈 네모(□)** 로 보인다. 텍스트는 다른 글꼴로 보일 뿐이지만 아이콘은 깨져 보인다.

## 재현 (brand-web, next dev, 시스템 Chrome)
- 같은 브라우저 컨텍스트로 `/brand-resource` 두 번 방문: 1번째(폰트 캐시 없음) "다운로드" 앞 아이콘 □ → 2번째(캐시) 다운로드 화살표 정상
- bznav-fe-ui `062354`(fallback 시절 소스)에서는 1번째 방문에도 화살표가 보였다(폰트가 늦게 와도 교체됨)

## 영향
- brand-web 아이콘 글자 3곳: `HeaderItems.tsx`(도움말 센터 화살표) · `TermContentSection.tsx`(시행일자 드롭다운 화살표) · `brand-resource/_components/ContentSection.tsx`(다운로드)
- 다른 앱(refund·care·sena·plus)도 BZNAVSans 아이콘 글자를 쓰면 같다 — 미조사
- 이번 zent 전환과 무관 — origin/dev 의 `@repo/ui` 로 배포해도 같다

## 후보 (결정 필요)
- A 아이콘 글자가 든 폰트만 `font-display: block`(또는 fallback)으로 되돌리기 — 텍스트 LCP 이득은 유지하려면 아이콘을 별도 폰트로 분리해야 할 수 있음(폰트 파일 구조 확인 필요)
- B 아이콘이 쓰이는 폰트 굵기를 preload 에 추가(첫 화면에서 대부분 해결되지만 보장은 아님 — 추측)
- C 수용(첫 방문 아이콘 깨짐 허용) — 2026-09-28 결정 때 아이콘 영향이 검토됐는지 확인 필요

## 추가 확인 — refund-web (2026-10-06, 헤르메스 QA 시뮬레이션)
- `apps/refund-web` `/home/landing` 모바일(390) 하단 CTA **"내 환급금 무료조회"** 의 화살표 아이콘이 □ 로 보인다 — QA 전체 검수(라이브 화면)에서 사용자가 발견, 헤르메스가 재현
- 재현: qa-base 워크트리(`origin/dev` 9d10cf915) `next dev` · Playwright Chromium 새 컨텍스트(캐시 없음) → 화면 로드 2초 뒤 CDP `CSS.getPlatformFontsForNode` 로 아이콘 글자의 실제 렌더 글꼴 = **Apple SD Gothic Neo**(BZNAVSans 아님)
- 같은 컨텍스트로 다시 열어도 그대로였다(dev 서버의 글꼴 캐시 헤더 때문일 수 있음 — 추측, 운영 빌드에서는 미확인)
- 그래서 "다른 앱도 같다 — 미조사" 중 **refund-web 은 확인됨**. care·sena·plus 는 아직
- QA 가 이제 자동으로 잡는다: `scripts/qa/run.mjs` `iconFontProblems` — 화면마다 아이콘 글자(U+E000–F8FF)의 렌더 글꼴을 확인해 BZNAVSans 가 아니면 문제(`font`)로 남긴다

## 진행 (헤르메스 2026-10-07)
- REF-3904(PR #2002, `893610a6e`)가 **prd-refund 에만** `optional → fallback` 원복을 넣어 운영 배포됨(2026-10-06). dev·다른 앱 prd·zent `bznav-fe-ui` 는 아직 optional — dev 반영 여부·zent 반영(packages-fe)은 결정 필요
