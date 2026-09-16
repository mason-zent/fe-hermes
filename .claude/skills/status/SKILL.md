---
name: status
description: 담당 4개 레포의 git 현황(브랜치, 미커밋 변경, 최근 커밋)과 진행 중인 계획서를 파악합니다.
---

# 현황 파악

## 확인 명령
```bash
for repo in client-brics-refund client-brics-hub bznav-web web-op; do
  echo "== $repo"
  git -C /Users/mason/mason-zent/$repo status --short --branch | head -20
  git -C /Users/mason/mason-zent/$repo log --oneline -5
done
echo "== 진행 중 계획서"
find plans -name '*.md' -not -path 'plans/archive/*' | sort
```

## 보고
- 레포별 현재 브랜치, 미커밋 변경 유무(파일 수), 최근 커밋 요약
- 진행 중 계획서 목록과 각 상태(승인 대기 / 진행 중)
