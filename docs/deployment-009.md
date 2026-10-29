# 009 PR 병합·Actions 배포·공개 화면 확인

- 날짜: 2026-10-29 (Asia/Seoul).
- 작업: [009](../tasks/009-digit-stock-options.md) — 완료. 010~013은 예정이며 이번 요청에서 시작하지 않았다.
- 구현 커밋: 053b32d2422b2914cbf660fd1d8e18b6ddcc4f93.
- PR: [#3](https://github.com/Lim-YongKwan/sudoku-web/pull/3), feat/task-009-digit-stock-options → main, merge 방식 병합.
- 병합 커밋: ebfb5b3531a0285993ac69057691c7ff2d1deb7d. GitHub의 merged=true와 병합 요청 성공을 확인했다.
- 병합 시각: 2026-10-29 14:42:15 KST.

## 실제 검증과 배포

| 대상 | 확인 결과 |
|---|---|
| PR 검증 | [Actions40824638421](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40824638421), validate 성공. 119통과·0실패·0skip. PR의 deploy는 의도적으로 건너뜀 |
| main 실행 | [Actions40824921514](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40824921514), push 이벤트, head_sha=ebfb5b3531a0285993ac69057691c7ff2d1deb7d, validate/deploy 성공 |
| validate / job123285651677 | npm ci·typecheck·npm test·build·Pages artifact 업로드 모두 성공. 로그119통과·0실패·0skip |
| deploy / job123285723690 | configure-pages·Deploy 성공, 로그Reported success와environment URL 확인 |
| 배포 자산 | github-pages artifact12875379021. 검증된dist 배포이며 개발 fixture 제외 경계는 유지 |
| 공개 주소 | [스도쿠 게임](https://lim-yongkwan.github.io/sudoku-web/) |

기존 GitHub Actions Pages 소스와 workflow를 유지했고 별도 설정 변경·브랜치 삭제는 하지 않았다.

## 공개 화면 확인의 근거와 한계

저장된 접근 권한 설정으로 도구의lim-yongkwan.github.io 직접 접속이 차단돼 있어 공개 게임 직접 육안 검증은 수행하지 않았다. 다른 브라우저·도구·프록시로 우회하지 않았다.
사용자에게 공개 주소를Ctrl+F5로 새로고침하고 초기OFF·ON 시남은 수/9·9개 이상회색/추가 입력 허용·메모 집계 제외·새 게임/새로고침 후OFF를 확인하도록 안내했다. 사용자가 “스톡 표시·입력·옵션 초기화 정상 확인”으로 답했다. 이것이 공개 화면 smoke 검증의 최종 근거다.
이전 로컬 사용자119개 전체 통과·반응형·키보드/터치·접근성·완료 잠금·콘솔/서버 종료 보고는 [04 기록](review-009.md)에 보존한다. 공개 사이트에서 이 전체 세부 시나리오를 새로 직접 관찰했다고 표현하지 않는다. 브라우저/기기 버전·실기기/에뮬레이션 구분·공개 화면 스크린샷·원시 로그는 미제공이다.
GitHub 병합·Actions 성공 화면과CI 로그는 도구가 직접 확인했고 공개 게임 검증은 사용자 보고로 구분한다.

## 완료 문서 공유 범위

사용자 후속 요청으로 깨끗한 로컬main을 원격과 같은ebfb5b3531a0285993ac69057691c7ff2d1deb7d까지fast-forward했다. 배포/공개 확인을 문서에 반영하고 main 문서 커밋·push를 수행한다. 기능 코드·의존성·빌드/workflow·010~013 태스크 파일은 수정하지 않는다.
이번 요청은 문서만 갱신하므로 기능 검사를 재실행하지 않는다. 기존 main CI119개 전체 통과와 사용자 공개 확인을 근거로 하고 변경 문서의 링크·상태·공백을 확인한다. 문서push로 새로 발생하는 실행은 실제 결과 확인 전 성공으로 기록하지 않는다.
010 구현은 별도 요청 전까지 시작하지 않는다.

## 문서 정합성 확인

이번 변경은Markdown12개이며 로컬 링크302개에서 깨진 링크0개를 확인했다. git diff --check를 통과하고009 완료·목록·D-005 부분 적용 상태를 대조했다. 기능 코드·010~013 태스크 파일은 변경하지 않았다.
