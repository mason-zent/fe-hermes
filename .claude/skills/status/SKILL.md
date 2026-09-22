---
name: status
description: repos/ 에 연결된 담당 레포 전체의 git 현황(브랜치, 미커밋 변경, 최근 커밋)과 진행 중인 계획서를 파악합니다.
---

# 현황 파악

## 확인 명령
```bash
for repo in $(ls repos); do
  echo "== $repo"
  git -C repos/$repo status --short --branch | head -20
  git -C repos/$repo log --oneline -5
done
echo "== 진행 중 계획서"
for plan in $(find plans -name '*.md' -not -path 'plans/archive/*' | sort); do
  # zsh 에서 status 는 읽기 전용 변수라 쓰지 않는다
  st=$(sed -n 's/^[[:space:]]*-[[:space:]]*Status:[[:space:]]*\**\([a-z_]*\).*/\1/p' "$plan" | head -1)
  up=$(sed -n 's/^[[:space:]]*-[[:space:]]*Updated:[[:space:]]*//p' "$plan" | head -1)
  echo "  [${st:-상태없음}] $plan ${up:+— $up}"
done
```

## 보고
- 레포별 현재 브랜치, 미커밋 변경 유무(파일 수), 최근 커밋 요약
- **보호 브랜치(`prd`·`main`·`dev`·`prd-*`)에 서 있는 레포는 따로 표시한다.** 거기서 작업하면 안 된다
- `dev-ecs` 는 **폐기된 브랜치**(2026-09 이후 갱신 없음)다. 거기 서 있는 레포가 있으면 그 사실을 알린다
- 계획서별 Checkpoint 의 `Status`(planned / in_progress / blocked / ready_for_review / done)와 `Updated`
- `blocked` 인 계획서가 있으면 무엇에 막혀 있는지 `Blocked` 절을 함께 본다
