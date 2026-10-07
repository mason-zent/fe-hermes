---
title: bznav-web 커밋된 .npmrc 토큰이 GitHub Packages 에서 401 — @zenterprise-inc 레지스트리 설치가 CI·Docker 에서 실패할 것
status: open
repo: bznav-web
agent:
kind: check
severity: high
source: bznav-packages-fe 2026-10-01 (zent 전환 ① 루트 준비) · plans/feature/20261001-bznav-web-앱-repo-패키지-zent-전환.md
plan:
pr:
fix:
reason:
---

bznav-web 루트 `.npmrc` 에 평문으로 커밋된 `_authToken` 이 GitHub Packages 에서 **401**(`User cannot be authenticated with the token provided`)을 낸다. 지금까지는 레지스트리에서 받는 `@zenterprise-inc/*` 가 없어 드러나지 않았지만, devkit(루트 devDependency)·`bznav-fe-*` 전환이 들어가면 `pnpm install --frozen-lockfile`(CI 3곳)과 `infrastructure/*/Dockerfile`(`.npmrc` 를 그대로 COPY)이 실패할 것으로 본다.

## 근거
- `pnpm view @zenterprise-inc/zent-fe-devkit` → bznav-web 안에서 E401, 같은 명령이 client-brics-refund·web-op 에서는 성공
- devkit 0.4.0 tarball 직접 요청: 커밋된 토큰 401 / 사용자 `GITHUB_TOKEN` 200 (2026-10-01, feature/zent-pkg-plus)
- `.github/workflows/{pull-request,auto-deployment,design-system-deployment}.yml` 에 npm 토큰 주입 단계 없음, `infrastructure/plus-web/Dockerfile:27` 이 `.npmrc` 를 COPY

## 할 일
- 토큰 교체(또는 env 참조 `${NPM_TOKEN}` + CI secret 주입) — 보안 결정이라 사용자·헤르메스
- 로컬은 임시로 `env "npm_config_//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" pnpm install` 로 우회 가능(파일은 안 바꾼다)

## 후속

## 조치 (bznav-plus-fe 2026-10-01, D8=A · feature/zent-pkg-plus 미커밋)
- `.npmrc`·`apps/care-web/.npmrc` 평문 토큰 → `${GITHUB_TOKEN}` 참조 (web-op·brics 와 같은 형식)
- 워크플로 `GITHUB_TOKEN: ${{ secrets.ZENT_ACCESS_TOKEN }}`: pull-request·auto-deployment·design-system-deployment(install 단계) · pr-preview(docker buildx `--secret id=github_token,env=GITHUB_TOKEN`) · ecs-deploy-service(Run build script 단계 env)
- Dockerfile 7개 pnpm fetch/install RUN 13곳에 `--mount=type=secret,id=github_token` + `export GITHUB_TOKEN="$(cat /run/secrets/github_token)"`
- **남은 확인(범위 밖, devops)**: ECS(`ecs-deploy-service` → zent-gitops `repository/<repo>/<service>/build-deploy.sh`)·EKS(`default-build.yaml` → zent-gitops `zent-mono-build.yaml`) 의 docker build 가 `--secret id=github_token,env=GITHUB_TOKEN` 을 넘기는지 — zent-gitops 접근 권한이 없어 확인 못 함(404). 안 넘기면 `cat /run/secrets/github_token` 에서 이미지 빌드 실패. web-op·brics 가 쓰는 `zent-default-build.yaml` 은 넘기는 것으로 보이나(그쪽 Dockerfile 이 secret 필수) mono 쪽은 미확인
- pnpm 11+ 는 프로젝트 .npmrc 의 auth `${...}` 확장을 거부한다. 지금은 `packageManager: pnpm@10.33.0` 으로 Docker 의 `npm i -g pnpm`(현재 12.8.1)·corepack 모두 10.33.0 으로 넘겨 동작함을 확인. pnpm 11 로 올릴 때 이 방식은 깨진다

## 2026-10-07 실측 확정 — ECS build-deploy.sh 가 secret 을 넘기지 않는다 (bznav-refund-fe)

- 실행: Actions run `37556697347` (Deploy to dev `bznav-refund-web<dev-1>` from `feature/zent-pkg-refund`, `6bba87434`) → `Run build script` 실패
- 로그 원문(토큰 가림):
  - `#14 0.334 cat: /run/secrets/github_token: No such file or directory`
  - `ERR_PNPM_FETCH_401  GET https://npm.pkg.github.com/download/@zenterprise-inc/bznav-fe-common-utils/0.0.0-dev-20261001234459/…: Unauthorized - 401`
- 해석: 워크플로는 `GITHUB_TOKEN` env 를 넘기지만 zent-gitops `repository/zenterprise-inc/bznav-web/bznav-refund-web/build-deploy.sh` 의 docker build 에 `--secret id=github_token,env=GITHUB_TOKEN` 이 없어 BuildKit secret 이 마운트되지 않음 → 빈 토큰 → 첫 private 패키지에서 401. 공개 npm 패키지 1602개는 정상 다운로드
- 영향: `ff4ae961e` 를 포함한 브랜치(`feature/zent-pkg-plus·brand·care·refund`, 이후 sena)의 **ECS dev/prd 이미지 빌드 전부**. 코드 수정으로는 못 고침
- 조치: devops 가 zent-gitops 앱별 `build-deploy.sh`(refund·care·brand·sena·plus)와 EKS `zent-mono-build.yaml` 에 `--secret id=github_token,env=GITHUB_TOKEN` 추가. 그 전까지 이 브랜치들의 dev 배포는 실패한다
- 참고: 같은 시기 dev 기준 브랜치(`fix/REF-3904`, 10-06) 배포는 성공 — 그 브랜치엔 secret 마운트·private 의존이 없다

## 2026-10-07 EKS(zent-mono-build) 실측 — 같은 문제 + 토큰 env 도 없음 (bznav-refund-fe)

- 근거: EKS 성공 실행 `36798219404`(plus-web/dev, 10-01)·`37419011264`(sena-web/prd-sena, 10-06) 로그의 `docker buildx build` 명령에 `--secret` 이 없다. 그 step env 에 `GITHUB_TOKEN` 도 없다(`ZENT_ACCESS_TOKEN` 은 workflow_call secret 으로 들어가기만 함). 두 실행은 secret 마운트가 없는 Dockerfile(ff4ae961e 이전)이라 성공했다
- 결론: ff4ae961e 가 들어간 브랜치를 EKS 로 빌드하면 ECS 와 같은 401 이 난다(추측 아님 — 명령에 옵션 부재 확인, 실제 실패 실행은 아직 없음)
- 조치(devops): `zent-mono-build.yaml` build step 에 `env: GITHUB_TOKEN: ${{ secrets.ZENT_ACCESS_TOKEN }}` + `docker buildx build … --secret id=github_token,env=GITHUB_TOKEN`
