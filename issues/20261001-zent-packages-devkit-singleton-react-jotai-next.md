---
title: zent-fe-devkit link on 시 react·react-dom·next·jotai 가 zent 사본으로 풀린다 — withZentDevkit SINGLETONS 에 없음
status: open
repo: zent-packages
agent: packages-fe
kind: check
severity: medium
source: bznav-packages-fe 2026-10-01 (zent 전환 ① 루트 준비) · plans/feature/20261001-bznav-web-앱-repo-패키지-zent-전환.md
plan:
pr:
fix:
reason:
---

devkit 0.4.0 `withZentDevkit` 는 `react-hook-form·next-themes·react-cookie·next-auth` 만 앱 사본으로 alias 하고 **react/react-dom/next 는 "Next 가 자체 dedupe" 한다고 일부러 뺀다. jotai 는 목록에 없다.** bznav 패키지(platform·user-sign·ui 등)는 react·next·jotai 를 peer 가 아니라 `dependencies` 로 들고 있어, link on 이면 zent 워크트리 `node_modules/.pnpm/...` 사본으로 해석된다(버전은 같음: react 19.2.6 · next 16.2.5 · jotai 2.17.0). 7월 시도에서 본 `Cannot read properties of null (reading 'useContext')` 와 jotai atom 두 벌 문제가 다시 날 수 있다(실제 재현은 plus-web 전환 뒤 확인).

## 근거
- `frontend/devkit/src/next.mjs` SINGLETONS (zent feature/bznav-pkg 16ba05a)
- `frontend/bznav/{platform,user-sign}/package.json` dependencies 에 jotai·next·react, ui 에 react·react-dom
- require.resolve 결과: platform·user-sign 에서 react/next/jotai → `.worktrees/zent-packages/feature-bznav-pkg/node_modules/.pnpm/...`

## 할 일 (제안 — 결정 필요)
- A: devkit SINGLETONS 에 `jotai` 추가, react/react-dom/next 는 plus-web 링크 실측 뒤 필요하면 추가(App Router react-server 조건 주의) — packages-fe
- B: bznav 패키지의 react·react-dom·next·jotai 를 `peerDependencies`(+devDependencies)로 — 정식 설치에서도 버전이 갈리면 두 벌이 되는 것을 막는다. link 모드 중복은 그래도 남아 A 와 같이 필요
- C: 앱 next.config 에서 resolveAlias 로 고정 — 앱마다 반복이라 비추천

## 후속

## plus-web 링크 실측 (bznav-plus-fe 2026-10-01, feature/zent-pkg-plus @ 03361c71e + 미커밋 전환 · zent feature/bznav-pkg 16ba05a)
| 대상 | Node require.resolve (zent 패키지 기준) | 실제 번들(next dev --turbo 브라우저 로드 청크 · next build 산출물) | 영향 |
|---|---|---|---|
| react · react-dom | zent 사본 | **한 벌** — App Router 는 `next/dist/compiled/react` 를 쓴다. `react@` 경로가 번들에 없음 | 훅 오류 없음(`useContext` null 재현 안 됨) |
| next (런타임) | zent 사본(peer 해시가 달라 다른 디렉토리) | **한 벌** — 앱 사본만 번들 | 없음 |
| next (**타입**) | — | — | ❌ `tsc`·`next build` 타입 검사 실패: `proxy.ts` 의 `NextRequest`/`NextResponse` 가 zent 사본 `next` 타입과 private 멤버(`[Internal]`) 불일치. **link 모드에서만** — 레지스트리 설치에선 통과 |
| jotai | zent 사본 | ❌ **두 벌** 번들(앱 사본 + zent 사본) | plus-web 은 jotai `Provider` 가 없고 platform atom 을 platform 훅으로만 써서 실사용 문제는 안 보임. **sena·brand·refund·care 는 layout/_app 에 jotai `Provider` 가 있어** link 모드에서 platform·user-sign 훅이 앱 Provider store 를 못 본다(추측 아님 — 구조상 확정, 실제 화면 재현은 각 앱 전환 때) |
| @ebay/nice-modal-react | ui 에서 zent 사본 | ❌ **두 벌** 번들 | plus-web 은 앱 정의 모달만 써서 동작(모달 열림·닫힘 확인). ui 의 `IframeModal`·`BankListDrawer`(zent 사본 nice-modal) 를 쓰는 앱은 앱 `NiceModal.Provider` 를 못 본다 — SINGLETONS 후보 |
| react-hook-form | 앱 사본만 | 한 벌 | 없음 |

- 레지스트리 설치(link off) 번들: jotai·next 모두 한 벌
- 결론 제안: SINGLETONS 에 `jotai`·`@ebay/nice-modal-react` 추가(런타임). react·react-dom·next 런타임 alias 는 불필요. **next 타입 불일치는 번들러 alias 로 안 풀린다** — tsc 가 링크 실경로(zent 워크트리) 기준으로 `next` 를 찾기 때문. peerDependencies(B) 로 옮겨도 zent 워크스페이스에 개발용 `next` 가 남아 link 모드에선 그대로일 것으로 본다(추측). 후보: link 중에만 앱 tsconfig `paths` 로 `next`·`next/*` 를 앱 사본에 고정(devkit 이 생성), 또는 link 모드 tsc 실패를 허용하고 레지스트리 모드에서만 타입 검증 — packages-fe·헤르메스 결정
- ⚠️ **App Router 한정 결론**(reviewer 2026-10-01): "react·react-dom·next 런타임 한 벌" 은 App Router 가 `next/dist/compiled/react` 를 쓰기 때문이다. **refund-web 은 Pages Router** 라 React 를 node_modules 에서 찾으므로 link 모드에서 React 가 두 벌이 될 수 있다(7월 `useContext` null — 추측, refund-web 전환 때 따로 실측)

## 확인 결과 (packages-fe 2026-10-01, D9)
- devkit `next.mjs` SINGLETONS 에 `jotai`·`@ebay/nice-modal-react` 추가 + Turbopack `resolveAlias` 에 `<name>/*` 와일드카드 추가(zent feature/bznav-pkg, 미커밋)
- 와일드카드가 필요한 이유(실측): Turbopack 은 키가 정확히 같을 때만 alias → `jotai` 만 넣으면 `jotai/utils`·`jotai/react` 가 링크 사본으로 남아 **여전히 두 벌**. 고친 뒤 Turbopack·webpack 모두 한 벌(scratchpad 최소 Next 16.2.5 앱, 표식 비교)
- next 타입 tsc ❌ 원인: platform `src/utils/middleware.ts` 의 `next/server` 타입을 tsc 가 링크 실경로(zent 워크스페이스 next 사본)에서 찾는다 — 번들러 alias 로 안 풀림. 후보는 link 중 앱 tsconfig `paths` 고정(미실측·결정 필요)

## brand-web link 실측 — D9 jotai 디렉터리 alias 가 서버 컴포넌트에서 `Provider` 를 undefined 로 만든다 (bznav-brand-fe 2026-10-01)
- 조건: bznav-web feature/zent-pkg-brand · 앱 devkit `0.0.0-dev-20261001062354`(D9 포함) · `pkg:link`(zent feature/bznav-pkg 952e4b4) · `next dev --turbo`
- 증상: `/`·`/brand-resource` 500 — `Element type is invalid … got: undefined` at `RootLayout (app/layout.tsx:157)` `<JotaiProvider>`(= `import { Provider as JotaiProvider } from 'jotai'`, **서버 컴포넌트 layout**). link off(레지스트리 설치)에선 200·정상
- 원인(실험으로 확인): Turbopack `resolveAlias` 가 `jotai` → `./node_modules/jotai`(**디렉터리**)라 `exports` 의 `import` 조건(`esm/index.mjs`) 대신 `main`(CJS `index.js`)으로 해석된다. CJS `index.js` 는 `'use client'` 인 `react.js` 를 `require` 로 재수출하는 구조라 RSC 에서 `Provider` 가 undefined. changeset 의 "링크 중 jotai 는 CJS 로 번들" 이 바로 이 경로
- 확인 실험(임시, 원복함): 앱 `turbopack.resolveAlias = { jotai: './node_modules/jotai/esm/index.mjs' }` → link 상태에서 `/`·`/brand-resource` 200, 브라우저 pageerror 0, dev 청크 jotai·nice-modal·next 모두 bznav-web 사본 한 벌
- 영향: link 모드 로컬 개발만(운영·레지스트리 설치 무관). **jotai `Provider` 를 서버 컴포넌트에서 import 하는 앱**(brand 확인, sena·care·refund 도 layout/_app 에 Provider — 각 앱 전환 때 확인)은 link 하면 첫 화면부터 깨진다. plus-web 은 Provider 가 없어 못 봤고 D9 fixture 도 서버 컴포넌트 Provider 를 안 써서 놓친 것으로 보인다(추측)
- 후보(packages-fe 판단): A Turbopack alias 를 디렉터리 대신 패키지 `exports` 를 따르는 진입 파일로(조건별 해석이 필요 — ESM `esm/index.mjs`·서브패스 `esm/*.mjs`), B jotai 는 Turbopack alias 에서 빼고 webpack 만 유지(두 벌 복귀), C 앱이 각자 `turbopack.resolveAlias` 지정(앱 5개 반복 — 비추천)
- brand-web 은 우회 코드를 넣지 않았다(link 모드 전용 문제라 devkit 에서 고칠 일)

### 원인 확정 (bznav-brand-fe 2026-10-01 17:5x, devkit 0.0.0-dev-20261001080514 · zent 952e4b4)
- 서버(RSC) 번들 실물: link 모드에서 `jotai` 가 `node_modules/jotai/index.js [app-rsc]`(CJS)로 들어간다. 그 본문은 `var react = r("jotai/react.js [app-rsc]")` → `Object.keys(react).forEach(defineProperty…)` 그대로이고, `jotai/react.js [app-rsc]` 는 Next 가 `'use client'` 라서 만든 **`createClientModuleProxy(...)` 대리 객체**(`(client reference proxy)` 모듈)다
- Next 16.2.5 `react-server-dom-turbopack/server.node.js` 의 `createClientModuleProxy` 를 react-server 조건으로 직접 호출해 확인: `Object.keys(proxy)` = **[]**, `proxy.Provider` 직접 접근은 client reference(function) → CJS 식 재수출을 거치면 `exports.Provider` 가 **undefined** → layout `<JotaiProvider>` 에서 `Element type is invalid` → 500
- 비링크(레지스트리) 또는 alias 를 `esm/index.mjs` 로 주면 `export * from 'jotai/react'` 정적 재수출이라 Next 가 client reference 를 이름별로 잇는다 → 200
- 왜 CJS 로 가나: devkit Turbopack alias 값이 **디렉터리 상대경로**(`./node_modules/jotai`)라 bare specifier 가 아니게 되고, 디렉터리 해석은 package.json `exports` 를 안 보고 `main`(`./index.js`)을 쓴다
- 새 dev 스냅샷 080514 devkit 은 062354 와 내용이 같아(version 외 diff 0) 이 문제가 그대로다

### 시제품 수정·검증 (bznav-brand-fe 2026-10-01 17:5x, 사용자 선택: 시제품 → packages-fe 반영)
- zent 레포는 건드리지 않았다. zent feature/bznav-pkg 952e4b4 의 `frontend/devkit` 사본에 아래 diff 를 넣고, brand 에서 `pkg:link` + 루트 overrides 에 devkit 을 임시 `link:` 로 걸어 시험한 뒤 모두 원복했다
- 내용: Turbopack alias 를 만들 때 패키지에 `exports` 가 있고 `react-server`·`browser` 조건이 없으면, exports 서브패스마다 ESM 진입 파일을 정확히 가리킨다(jotai → `jotai`: `./node_modules/jotai/esm/index.mjs`, `jotai/*`: `./node_modules/jotai/esm/*.mjs`). 해당 안 되면 기존 폴더 alias 그대로(react-hook-form 은 react-server 조건이 있어 기존 유지, nice-modal 은 exports 없어 기존 유지). webpack alias 는 안 바꿨다
- 결과(brand-web, link 상태, 워크트리 env): next dev `/`·`/brand-resource`·`/terms/service`·`/popup/terms/service` **200**, 브라우저 pageerror 0·4xx/5xx 0 (수정 전 500) · dev·prod 번들 jotai(ESM)·nice-modal·next 모두 bznav-web 사본 한 벌, zent 사본 0 · link 상태 `next build` 페이지 데이터 수집까지 ✅ · `turbopack.root` 확장 정상
- 못 본 것(packages-fe 몫): D9 fixture(webpack·Turbopack) 재실행, plus-web link 회귀, `<name>/*` 의 접미사 와일드카드(`esm/*.mjs`)가 Turbopack 에서만 확인됨(webpack 경로는 기존 코드라 영향 없음), changeset(devkit patch 추천 — 추측)

```diff
--- a/frontend/devkit/src/next.mjs
+++ b/frontend/devkit/src/next.mjs
@@ -113,10 +113,64 @@
     const linkPath = join(appDir, 'node_modules', name)
     const target = existsSync(linkPath) ? linkPath : pkgDirOf(req, name)
     const rel = './' + relative(appDir, target).split(sep).join('/')
+    const esm = esmExportAliases(target, name, rel)
+    if (esm) {
+      Object.assign(out, esm)
+      continue
+    }
     out[name] = rel
     out[`${name}/*`] = `${rel}/*` // 서브패스(jotai/utils, next-auth/react …)도 같은 사본으로
   }
   return out
+}
+
+// 환경마다 다른 파일을 고르는 조건. 이런 조건이 있으면 진입 파일 하나로 고정할 수 없어 폴더 alias 를 유지한다
+const ENV_CONDITIONS = ['react-server', 'browser']
+// ESM 진입 파일을 고르는 조건 우선순위(types 는 건너뛴다)
+const ESM_CONDITIONS = ['import', 'module', 'default']
+
+const hasEnvCondition = (entry) => {
+  if (!entry || typeof entry !== 'object') return false
+  return Object.entries(entry).some(([key, value]) => ENV_CONDITIONS.includes(key) || hasEnvCondition(value))
+}
+
+const pickEsmTarget = (entry) => {
+  if (typeof entry === 'string') return entry
+  if (!entry || typeof entry !== 'object') return null
+  for (const condition of ESM_CONDITIONS) {
+    if (condition in entry) {
+      const target = pickEsmTarget(entry[condition])
+      if (target) return target
+    }
+  }
+  return null
+}
+
+/**
+ * 폴더 alias(`./node_modules/jotai`)는 bare specifier 가 아니라 경로라서 package.json `exports` 를 안 보고
+ * `main`(CJS)으로 풀린다. jotai 의 CJS index.js 는 `'use client'` 인 react.js 를 Object.keys 로 재수출하는데,
+ * 서버 컴포넌트에서는 그 모듈이 client reference proxy(키 0개)라 `Provider` 가 undefined 가 된다(Next 16.2.5 실측).
+ * 그래서 exports 가 있고 환경별 조건이 없는 패키지는 exports 의 서브패스마다 ESM 진입 파일을 정확히 가리킨다.
+ * 해당하지 않으면 null → 기존 폴더 alias 를 쓴다.
+ */
+const esmExportAliases = (pkgDir, name, rel) => {
+  let exportsField
+  try {
+    exportsField = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).exports
+  } catch {
+    return null
+  }
+  if (!exportsField || typeof exportsField !== 'object' || !Object.keys(exportsField).some((key) => key.startsWith('.'))) return null
+  if (hasEnvCondition(exportsField)) return null
+  const out = {}
+  for (const [subpath, entry] of Object.entries(exportsField)) {
+    if (subpath === './package.json') continue
+    const target = pickEsmTarget(entry)
+    if (!target) continue
+    const key = subpath === '.' ? name : `${name}/${subpath.slice(2)}`
+    out[key] = `${rel}/${target.replace(/^\.\//, '')}`
+  }
+  return out[name] ? out : null
 }
 
 // 두 절대경로의 공통 상위 디렉토리
```

### brand-web 에서 수정본 확인 (bznav-brand-fe 2026-10-02, devkit 0.0.0-dev-20261001234459 = zent 4d0eb78)
- 임시 override 없이 `pnpm --filter brand-web pkg:link` 만으로: Turbopack alias 가 jotai 서브패스별 `esm/*.mjs`(와일드카드 대신 실제 경로를 펼침), nice-modal 은 기존 폴더 alias
- link 상태 next dev `/`·`/brand-resource`·`/terms/service`·`/popup/terms/service` **200**, pageerror 0·4xx/5xx 0, 서버 로그 오류 0 · dev·prod 번들 jotai(ESM)·nice-modal·next 모두 bznav-web 사본 한 벌 · link 상태 tsc ✅ · link build(데이터 수집 포함) ✅ → **brand 기준 해소**
- 비링크에서 alias 0개(no-op) 확인

## refund-web link 실측 — Pages Router 는 React 가 두 벌 (bznav-refund-fe 2026-10-02)
- 조건: feature/zent-pkg-refund @ ef48fb648 + 미커밋 전환 · 앱 devkit `0.0.0-dev-20261001234459`(= zent 4d0eb78 jotai alias 수정 포함) · `ZENT_LOCAL_PATH=…/zent-packages/feature-bznav-pkg` 4d0eb78 · 8개 링크 · `next dev --webpack`(refund dev 스크립트)
- 결과: 대표 8화면(/ · /home/landing · /event/model-marketing · /home/event/share · /hometax-auth/select-method · /tax/refund/lookup/request · /survey/intro · /help/guide/tax-refund-check) **모두 실패 — `Invalid hook call … more than one copy of React`**. 비링크(레지스트리 설치)는 같은 화면이 정상
- 근거: dev 청크(`.next/dev/static/chunks/pages/_app.js` 등)에 앱 사본 react 와 함께 `zent-packages/feature-bznav-pkg/node_modules/.pnpm/react@19.2.6/…/react/index.js`·`jsx-dev-runtime.js`·`react-dom/index.js` 가 들어간다. jotai·nice-modal·next 는 앱 사본 한 벌(D9 수정 동작)
- 원인: devkit `src/next.mjs` 31행 "react/react-dom/next 는 Next 가 자체 dedupe 하므로 제외" — App Router 는 next 내장 React 를 써서 맞지만 **Pages Router 는 `node_modules/react` 를 그대로 번들**하므로 링크 패키지가 zent 워크트리의 react 로 풀린다. bznav 앱 중 Pages Router 는 refund-web 하나
- 제안(packages-fe, 결정 필요 — 추측, 미실측): A Pages Router(또는 `pages/` 존재) 감지 시 react·react-dom(+ `react/jsx-runtime`·`jsx-dev-runtime`) 도 앱 사본으로 alias — App Router 의 react-server 조건은 건드리지 않게 webpack 클라이언트·pages 레이어로 한정 / B 링크 대상 bznav 패키지의 react·react-dom 을 peerDependencies 로 (zent 워크트리 node_modules 에 react 가 없게) / C 앱 next.config 에 직접 alias(비추천)
- 영향: 레지스트리 설치·운영 무관. refund-web 은 지금 pkg:link 로컬 개발 불가(화면 전부 hook 오류)
- 같은 실측의 tsc: proxy.ts 7건(TS2345 ×5, TS2741 ×2) — D10 과 같은 원인

### refund-web 원인 확정·수정안 실측 (bznav-refund-fe 2026-10-02 12:00~12:45)
같은 조건(zent 4d0eb78, 8개 링크)에서 앱 설정에 **임시로** 넣어 시험하고 원복함(next.config·tsconfig·package.json·lock 백업과 동일, skip-worktree 0, verify ✅).

**1) React 두 벌 — 번들러마다 원인이 다르다**
| 경로 | 원인 | 임시 수정 | 결과 |
|---|---|---|---|
| `next dev --webpack`(refund dev 스크립트) | devkit SINGLETONS 에 react·react-dom 이 없음 → 링크 패키지 소스의 `react` import 가 zent 사본으로 풀림(Pages Router 는 next 내장 React 를 안 씀) | webpack `resolve.alias.react`·`react-dom` = 앱 사본 디렉터리 | ✅ 대표 8화면 hook 오류 0, dev 청크 react·react-dom·jotai·nice-modal·next 한 벌. 남은 404 2건(/event/model-marketing·/hometax-auth/select-method)은 전환 전 기준 서버도 같은 404 |
| `next build`(Next 16 기본 Turbopack) | Pages Router 서버는 node_modules 를 **external** 로 남겨 Node 가 런타임에 require. 링크 패키지의 전이 의존성(framer-motion·rc-util·react-day-picker·class-variance-authority 등)이 zent 스토어 사본으로 external 되어(`.next/node_modules/<name>-<hash>` → zent 경로) 각자 zent react 를 부른다. jotai 도 `jotai-bdd…`(앱)·`jotai-fd5…`(zent) 두 개 — **resolveAlias 는 external 에 안 먹는다** | Turbopack `resolveAlias` react·react-dom(+`/*`) | ❌ prerender `Cannot read properties of null (reading 'useContext')` (/auth/ci-authentication·/auth/sign-up/input·/survey/completed …) |
| 위 + `bundlePagesRouterDependencies: true` | 서버 의존성을 번들 → alias 가 먹음 | | build ✅·서버 출력에 zent react/jotai 0 — **그러나 `fetchGraphQL error: TypeError: d.call is not a function` 7건 새로 생김**(정상 build·링크 build 는 0) → 그대로 쓸 수 없음 |

**2) tsc next 타입(D10) — 원인 확정**
- platform `src/utils/middleware.ts` 가 `next/server` 의 `NextRequest`·`NextResponse` 를 import. tsc 는 링크 실경로(zent `frontend/bznav/platform/node_modules/next` → zent 스토어 `next@16.2.5_…@opentelemetry+api…`)에서 타입을 찾는다. 앱은 bznav 스토어 `next@16.2.5_…babel-plugin-macros…` — **버전은 같지만 peer 조합이 달라 물리적으로 다른 선언 파일**이라 `[INTERNALS]`·`[Internal]`(unique symbol private 멤버)가 호환되지 않아 TS2345·TS2741. 번들러 alias 와 무관(tsc 는 번들러 설정을 안 읽음). 설치본은 같은 스토어 경로 하나라 오류 없음
- 임시 수정: 앱 tsconfig `paths` 에 `"next": ["./node_modules/next"]`, `"next/*": ["./node_modules/next/*"]` → **링크 상태 tsc 0건**(7건 → 0) ✅
- 대안(미실측, 추측): link 중 `preserveSymlinks: true` — 링크 경로 기준으로 풀려 앱 next 를 찾을 수 있음 / platform 이 next 클래스 대신 구조적 타입을 받게

**packages-fe 수정 요청(제안)**
- R-a ★ webpack: 앱이 Pages Router(`pages/`·`src/pages` 있고 `app/`·`src/app` 없음)면 SINGLETONS 에 react·react-dom 을 더해 alias(App Router 는 지금처럼 제외 — react-server 조건 보호). 실측 근거 위 표 1행
- R-b Turbopack build 는 **링크 모드 지원 범위에서 제외**하고 문서화(링크는 로컬 dev 용, refund dev 는 `--webpack`) — external 문제는 alias 로 못 풀고 `bundlePagesRouterDependencies` 는 부작용. 지원하려면 별도 설계(external 해석을 앱 사본으로 돌리는 방법) 필요
- R-c tsc: `link on` 이 앱 tsconfig 에 `next`·`next/*` paths 를 넣고 `link off` 가 원복(또는 devkit 이 생성하는 별도 tsconfig) — plus·sena·refund(platform 미들웨어 쓰는 앱) 공통. 실측 근거 위 2)

### 7월 선례 — 같은 문제를 앱 스크립트로 풀었었다 (bznav-refund-fe 2026-10-02 확인, 읽기만)
- bznav-web `feature/zent-packages`(PR #1630) `9ed3333d9` 2026-07-29 "chore(refund): 환급 zent-packages 도입" 이 **`scripts/dedupe-linked-react.mjs`** 를 추가했고 refund 만 `"pkg:link": "zent-fe-devkit link on && node ../../scripts/dedupe-linked-react.mjs && rm -rf .next"` 로 썼다(다른 앱은 안 씀). 스크립트 주석이 이번 실측과 같은 결론: 'App Router 는 next 내장 react 라 괜찮고 refund 만 Pages Router 라 중복' · '`useContext` null' · '**Turbopack resolveAlias 는 외부 스토어에서 시작된 import 에 적용되지 않는다**'
- 방법: 링크 중일 때 (A) **zent-packages 의 pnpm 스토어 엔트리** `react`·`react-dom`·`jotai`·`next`·`@ebay/nice-modal-react`(버전이 같고 peer react 가 같은 것만)를 앱 사본 심볼릭 링크로 바꾸고 원본은 `<name>.orig` 로 백업 → 전이 의존성(@radix-ui·framer-motion 등)도 함께 한 벌 (B) 링크된 각 패키지의 nested `node_modules/<name>` 도 앱 사본으로 1단 링크(2단이면 Turbopack middleware 가 `Can't resolve 'jotai'`). `--revert` 로 원복
- 이번 실측과 대조: (A) 가 Turbopack build 의 external 문제(위 표 2행)를 정면으로 푼다 · `next` 도 대상이라 tsc D10(next 선언 파일 두 벌)도 같이 풀릴 것으로 본다(추측, 미실측) · webpack dev 도 해결
- 7월 구현의 빈틈: `pkg:unlink` 가 `--revert` 를 부르지 않아(`zent-fe-devkit link off && rm -rf .next`) zent 스토어가 바뀐 채 남는다 · devkit 에 흡수되지 않아 zent 쪽 이력 없음(`git log -S dedupe-linked-react` 0)
- 주의: 다른 레포(zent-packages)의 node_modules 를 고치는 방식이라, 링크 중엔 zent 워크트리 자체의 dev·test 가 앱 사본 react·next 를 쓴다. 이번엔 zent 워크트리를 건드리지 않으려고 직접 실행하지 않았다

**packages-fe 수정 요청(갱신 — 위 R-a·R-b·R-c 대체)**
- R-1 ★ 7월 `dedupe-linked-react.mjs` 방식을 devkit `link on`/`link off` 에 흡수: on 때 zent 스토어·nested 링크를 앱 사본으로(`.orig` 백업), **off 때 반드시 원복**. 대상 react·react-dom·next·jotai·nice-modal. App Router 앱에도 해가 없는지(next 내장 react 라 영향 없을 것 — 추측) plus·brand 로 회귀 확인
- R-2 흡수 뒤 refund 로 재실측: webpack dev 8화면 · Turbopack link build · link tsc(D10 이 풀리는지 — 안 풀리면 tsconfig paths 생성안 R-c)
- R-3 흡수 전까지 refund 는 pkg:link 미지원으로 기록(운영·레지스트리 설치 무관)
