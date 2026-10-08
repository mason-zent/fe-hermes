---
id: 20261009-zent-packages-learn-gotchas-changeset
title: 이미 들어간 changeset 을 고치기만 하면 CI 검사가 실패한다 — 후속 PR 은 새 changeset 파일
target: docs/knowledge/zent-packages/gotchas.md#changeset
source: plans/refactor/20260930-bznav-packages-sync-with-history.md (배우기 검토자 · done)
signal: review
basis: code
applied: 2026-10-09
---

## 무엇을 배웠나
zent-packages 는 패키지를 바꾸는 PR 마다 버전 변경 메모(changeset 파일)가 있는지 CI 가 검사한다. 그런데 이 검사는 PR 에서 '새로 추가된' changeset 파일만 센다. 앞 PR 로 dev 에 이미 들어간 changeset 을 고쳐서 이어 쓰면, 추가된 파일이 없다고 보고 검사가 실패한다.

## 왜 중요한가
같은 기능을 이어서 작업하는 후속 PR 에서 기존 changeset 만 고치면 CI 에서 막히고, 바뀐 내용이 버전 기록에 빠질 수 있다.

## 공책에 넣을 문장
표준 스크립트 `changeset 존재` 단계는 미커밋 `.changeset/*.md` 만 본다(`git status`). CI(`changeset-check.yml`)는 브랜치 diff 를 보지만 `--diff-filter=A` 라 **새로 추가된** changeset 만 센다. 대상 브랜치에 이미 들어간 changeset 을 고치기만 하면 실패하니, 후속 PR 은 새 changeset 파일을 만든다.

## 어디서 배웠나
- plans/refactor/20260930-bznav-packages-sync-with-history.md — .github/workflows/changeset-check.yml:20-34 (변경 changeset 을 git diff --diff-filter=A 로 고른다)

## 원래 줄
- **표준 스크립트 `changeset 존재` 단계는 미커밋 `.changeset/*.md` 만 본다**(`git status`). changeset 을 앞 커밋에 넣으면 다음 커밋의 엄격 검증이 ❌ — CI 는 브랜치 diff 로 보므로 실제로는 문제없다(`common/verify.md`)
