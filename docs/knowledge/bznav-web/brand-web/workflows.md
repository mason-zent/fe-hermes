# bznav-web apps/brand-web 반복 작업 절차
## 새 페이지
1. `app/<route>/page.tsx`(서버) + `layout.tsx`에서 `LogoLayout` 감싸기(home·terms 선례)
2. 페이지 메타는 `page.tsx`에 `export const metadata`(`brand-resource` 선례)
3. 클라이언트 인터랙션은 `app/<route>/_components/*.tsx`(`'use client'`)
4. **sitemap**: `next-sitemap.config.mjs`가 manifest에서 자동 수집 → 별도 등록 불필요. 동적 세그먼트는 자동 제외. `EXCLUDE_ROUTES` 는 **sitemap 에서 빼는 설정**이고 그 페이지에 `noindex` 를 붙이지는 않는다. `/` rewrite 충돌 확인
5. 외부 서비스 링크는 `lib/constants/common.ts` `SERVICE_LINKS`(UTM 포함) + `useWindowOpen()`
## 스토어 — 선례 0. 도입 전 헤르메스 확인(위치 결정 필요)
## 약관 변경 — 코드 아님, DatoCMS 데이터. `graph-ql-query.ts` → `dato-cms.ts` → `terms/[...terms]/page.tsx`(+`popup/`). `revalidate = 3600` 지연
## 검증 — `scripts/verify/bznav-web.sh brand-web`
