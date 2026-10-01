---
title: 워크트리를 만들 때 .env·.aws 키 파일이 따라오지 않아 env 없이 검증하게 된다
status: done
repo: hermes
agent:
kind: knowledge
severity: medium
source: bznav-plus-fe 2026-10-01 (zent 전환 ① 시범) · plans/feature/20261001-bznav-web-앱-repo-패키지-zent-전환.md
plan: plans/task/20261001-hermes-워크트리-생성-시-git-무시-로컬-파일-env-aws-등-복사.md
pr:
fix: 2df5222
reason:
---

`scripts/new-branch.sh` 가 만든 워크트리에는 git 무시 대상인 `.env`·`.aws/access-key.js` 가 없다. 그래서 plus·brand 를 env 없이 빌드·dev 확인했고(plus: 아이콘 404·노션 400, brand: 빌드 실패 추정), `gen:env` 로 만들려 해도 AWS 자격 증명이 없거나 권한이 없어(plus-web 은 Secrets Manager — `zent-FE-Chapter` 키에 `secretsmanager:GetSecretValue` 권한 없음) 실패했다.

## 조치(이번 워크트리, 사용자 지시)
- 메인 체크아웃 `repos/bznav-web` 의 `.aws/access-key.js`·`apps/{brand,plus,refund,sena}-web/.env` 를 `.worktrees/bznav-web/feature-zent-pkg-plus` 로 내용 출력 없이 복사(600, git 무시 대상 확인). care-web 은 메인에도 `.env` 없음
- 복사 뒤 plus-web build 노션 오류 사라짐, dev 대표 화면 오류·404 0

## 할 일 (제안)
- `new-branch.sh` 가 워크트리를 만들 때 메인 체크아웃의 git 무시 비밀 파일(`.env*`, `.aws/*` 등 레포별 목록)을 내용 출력 없이 복사(또는 심볼릭 링크)하고 이름만 보고하게 한다. 레포별 목록은 `hermes.config.json` 에 둔다
- 이미 있는 워크트리(예: feature/zent-pkg-brand)에도 같은 복사를 한 번 돌린다

## 처리 (2026-10-01)
- `scripts/wt-copy-local.sh` + `hermes.config.json` `worktreeCopy` — `new-branch.sh` 가 워크트리를 만들 때 `.env`·`.env.*`·`.aws/*`·`.claude/settings.local.json` 을 메인 체크아웃에서 복사(이름만 보고)
- 기존 워크트리 4개에 `--all` 적용(brand 에 plus·refund·sena .env 추가 등)
- 남은 것: 메인에도 없는 care-web `.env` · plus-web `gen:env` Secrets Manager 권한 — 이건 복사로 해결 안 됨
