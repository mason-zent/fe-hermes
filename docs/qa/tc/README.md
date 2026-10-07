# 비즈넵 웹 5개 앱 QA TC 리스트

> 2026-10-02 · 헤르메스가 앱마다 코드를 읽어 정리(읽기 전용 조사 5개 병렬) · 계획서 `plans/feature/20261002-QA-시뮬레이션-영향-화면.md`
> 기준은 로컬 `repos/bznav-web` `dev` `4b382c733` — 앱마다 운영 브랜치와 차이가 있으면 각 문서 머리에 적었다. **TC 의 문구·경로는 코드에서 읽은 것이고, 실제로 돌려 확인한 것은 refund-web 흐름 씬 5개뿐이다.** 추측은 "(추측)" 으로 표시했다

| 앱 | 문서 | 라우터 | 화면 | TC | P0 | 지금 scripts/qa 로 되는 것 |
|---|---|---|---|---|---|---|
| refund-web | [refund-web.md](refund-web.md) | Pages | 106 | 45 (RF-) | 14 | 화면 설정 · 씬 5개(RF-005·006·011·012·013) · 영향 QA · 전체 검수 |
| care-web | [care-web.md](care-web.md) | App | 266 page | 45 (CR-) | 20 | 없음 — GraphQL 연산별 흉내·세션(소셜 전용)부터 |
| brand-web | [brand-web.md](brand-web.md) | App | 4 (+리다이렉트·SEO) | 25 (BR-) | 5 | 없음 — 가장 쉬움(로그인 없음) |
| sena-web | [sena-web.md](sena-web.md) | App | 20 | 45 (SN-) | 9 | 인수인계 스크립트(`.qa-runs/handoff-sena-web-20261002/`) — 편입 예정(D15) |
| plus-web | [plus-web.md](plus-web.md) | App | 20 | 44 (PL-) | 15 | 없음 — 계산 TC 는 dp-logs 본문으로 정답 확인 |

## 각 문서의 짜임
1. **먼저 알아둘 것** — 그 앱에서 TC 설계·자동화에 직접 영향을 주는 구조(가드·API·폭 경계·시간 분기)
2. **A) 화면** — 전체 화면 목록(라우트·그룹·로그인·본인인증·동적 샘플·단계형·근거). **이 표가 스모크 대상 목록**이다
3. **B) TC** — `ID | 분류 | 제목 | 세션 | 뷰포트 | 사전 조건 | 단계 | 기대 결과 | 자동화 | 우선 | 근거`. 화면마다 스모크를 따로 만들지 않고 그룹 스모크로 묶었다. 단계의 버튼 문구는 코드 그대로
4. **누르면 안 되는 것** — 신청·결제·탈퇴·제출 등 되돌릴 수 없는 동작과 대신 확인하는 방법
5. **에러·예외** · **확인 못 한 것·추측** · **scripts/qa 로 옮길 때**

## 용어
- **분류**: 스모크(열리는지) · 가드(로그인·본인인증·쿼리 검증에 따른 이동) · 흐름(누르고 입력하며 따라감) · 계산(입력 → 기대 숫자) · 에러 · 반응형 · SEO
- **세션**: `logout` · `login`(로그인만 — 약관·본인인증 전) · `verified`(본인인증까지) — `scripts/qa/routes/<앱>.json` `profiles` 와 같다
- **자동화**: 스모크(URL 바로 열기) · 씬(`scripts/qa/scenarios/<앱>/*.json` 단계) · 응답 흉내(`mock` — API 응답을 가짜로) · 사람 단계(보이는 창에서 사람이 진행) · 수동(서버 설정·계정 상태 등 자동화 밖)
- **우선**: P0 핵심(깨지면 서비스가 안 된다) · P1 · P2

## 공통으로 드러난 것

### ⚠ 열기만 해도 부작용이 있는 화면 — 스모크에서 뺀다
- refund-web `/tax/refund/lookup/queue`(대기열 알림톡 예약) · `/tax/refund/lookup/request`(홈택스 실조회) → `routes/refund-web.json` 에 `skip` 으로 넣었다(⛔ 건너뜀(부작용)). 다른 앱도 옮길 때 같은 검사를 한다

### 러너(scripts/qa)에 더해야 할 것 — 여러 앱이 같은 걸 요구한다
| 기능 | 필요한 앱 · TC | 지금 |
|---|---|---|
| **GraphQL 연산 이름으로 고르는 응답 흉내**(요청 본문 `query` 의 `mutation xxx`) | care(거의 전부) · refund(RF-016·019~040) | ✖ — mock 은 URL·method 만 |
| **App Router 화면 목록**(`app/**/page.tsx`) | care · brand · sena · plus | ✖ — impact.mjs 는 Pages Router 만 |
| 시계 조작(`page.clock`) | refund(0~6시·9시) · care(홈택스 시간·신고 기간) · plus(간이과세 7월·인증 5분) | ✖ |
| 쿠키·localStorage 주입 단계 | care·refund·sena(CI 필요 쿠키) · plus(진단 결과) | ✖ |
| 요청 본문 기대 확인(보낸 요청을 검사) | plus 계산 TC 정답(`dp-logs` `payload.result`) | ✖ |
| SSE 응답 흉내(`data: {…}<ENDLINE>`) · 답변 완료 대기 | sena | ✖ (인수인계 스크립트에 대기 방식 있음) |
| 새 탭 URL 확인 · HTTP 요청 단계(상태·리다이렉트) | brand(외부 링크·sitemap) · refund(RF-043 POST) | ✖ |
| 뷰포트별 UA | brand(앱 다운로드 버튼이 UA 로 갈림) · plus | ✖ — 폭만 바꾼다 |
| 가로 넘침·무한 스크롤 검사 | sena(인수인계) · 전 앱 | ✖ |
| `next start`(빌드) 서버 | sena(next dev postcss 폭주 이력) | ✖ — next dev 만 |

### 세션(로그인) 만들기
- refund-web: 이메일 로그인 → `login.mjs` 세션 저장(된다)
- sena-web: 이메일 로그인(dev/loc 만) · 계정 파일 유지(D16 예외)
- care-web: 로그인 화면에 이메일이 없지만(카카오·네이버·애플만) **refund 와 같은 세션**이다 — 토큰 쿠키 이름만 다르다(`B_AT.loc`·`B_AS.loc` → `B_AT.care.loc`·`B_AS.care.loc`, `packages/common-utils/constants/storage-keys.ts` `APP_SUFFIX`). refund 세션에서 이름만 바꿔 `.qa-auth/care-web.login.json` 을 만든다(2026-10-06). **다만 로컬 실행용 `.env` 를 못 받는다** — `generate-env.mjs --app=care-web` 가 Secrets Manager `loc-care-web-bznav-web_secret` 권한 거부(AccessDenied)
- brand-web: 로그인 없음 · plus-web: 로그인 필수 화면 없음(`B_AT*` 쿠키로 미리 채우기만)

### 조사 중 찾은 문제 후보 (확인 전 — 이슈 등록 여부는 확인 뒤)
| 앱 | 내용 | TC |
|---|---|---|
| brand-web | 모든 페이지 canonical 이 `https://bznav.com/`(추측) · 아이콘 3개 경로가 `public/` 에 없음 · IMC 배너 문구 `bzr; 바로가기` | BR-023 · 025 · 006 |
| care-web | `/global-income` → `/global-income/incomeamt` 로 보내는데 그 페이지가 없음(404, 코드상 확실) | CR-044 |
| plus-web | 약관 API 실패 시 로딩이 안 풀림(추측) · 진단 결과 일부 누락 시 TypeError(추측) · 없는 콘텐츠 slug 가 404 가 아니라 200 | PL-030 · 038 · 040 |
| sena-web | 물결표 이슈 실제 증상은 취소선이 아니라 `~` 가 사라짐(이슈 파일 문구 부정확) | SN-021 |
| refund-web | 씬 02 기대 문구가 CRM 실험군이면 달라짐 | RF-006 |

## 갱신하기
- `/qa-tc <앱>` — 그 앱 담당 에이전트가 코드를 다시 읽어 이 문서를 맞춘다(전체) · `/qa-tc <앱> #<PR>` 은 그 변경 때문에 바뀔 TC 만. 씬 초안은 `scripts/qa/scenarios/<앱>/_draft/`

## 다음
1. 러너 확장(위 표) — GraphQL 연산별 흉내 · App Router 화면 목록이 가장 많은 TC 를 연다
2. D15 sena-web 편입 → D14 순서대로 brand(가장 쉬움)·plus·care
3. P0 부터 씬으로 옮기고, 옮긴 TC 는 각 문서 "자동화" 칸에 **(있음 NN)** 으로 표시
