# 008 PR 병합·Actions 배포·공개 숫자 디자인 확인

- 날짜: 2026-10-29 (Asia/Seoul).
- 작업: [008](../tasks/008-number-typography.md) — 완료. 009~013은 예정이며 이번 요청에서 시작하지 않았다.
- 구현 커밋: 1ec138ca21e8d6cc6db3478d0d25d68ef025cf7a.
- PR: [#2](https://github.com/Lim-YongKwan/sudoku-web/pull/2), feat/task-008-number-typography → main, merge 방식으로 병합.
- 병합 커밋: a59dd562552f0c5b50c56e692061c5f1e16e2289. GitHub의 merged=true와 실제 병합 화면을 확인했다.
- 병합 시각: 2026-10-29 11:34:08 KST.

## 검증과 실제 배포

| 대상 | 실제 결과 |
|---|---|
| PR 검증 | [Actions40806321920](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40806321920), validate 성공,105통과·0실패·0skip. PR 실행의 배포는 의도적으로 건너뜀 |
| main 실행 | [Actions40807127859](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40807127859), head_sha=a59dd562552f0c5b50c56e692061c5f1e16e2289, push 실행 성공 |
| validate / job123228635186 | npm ci·typecheck·npm test·build·Pages artifact 업로드 모두 성공. CI 로그105통과·0실패·0skip |
| deploy / job123228700954 | configure-pages·Deploy 성공. 로그의 Reported success 및 environment URL 확인 |
| 배포 자산 | 검증된 dist의 github-pages artifact12868154655. 개발 fixture는 배포 출력에 포함하지 않는 기존 빌드 경계를 유지 |
| 공개 주소 | [스도쿠 게임](https://lim-yongkwan.github.io/sudoku-web/) |

기존 Pages 소스 GitHub Actions 설정을 유지했다. 별도 배포 설정 변경이나 원격 브랜치 삭제는 하지 않았다.

## 공개 화면의 확인 근거

도구는 이전 저장된 접근 권한 설정으로 lim-yongkwan.github.io의 공개 게임 직접 접속이 차단되어 있어 직접 육안 확인을 수행하지 않았다. 다른 브라우저·도구·프록시로 우회하지 않았다.
사용자에게 공개 주소 강력 새로고침 후 입력 숫자 선명도·고정 숫자 구분·단서 배경·정렬·숫자 패드 확인을 안내했고, 사용자가 “새 숫자 디자인 정상 적용 확인”으로 답했다. 이것이 이번 공개 숫자 디자인 검증의 근거다.
사용자의 기존 로컬105개 전체 통과·320px/1280px·키보드/터치·포커스·완료 dialog·콘솔·서버 종료 보고는 [04 기록](review-008.md)에 보존한다. 이 전체 시나리오를 공개 사이트에서 새로 직접 검증했다고 표현하지 않는다. 정확한 기기/브라우저 버전·실제 폰트 이름·공개 화면 스크린샷은 미제공이다.

GitHub 병합·Actions 성공 화면은 도구가 직접 확인했다. 공개 게임 화면 확인은 사용자 보고와 구분한다.

## 문서 공유와 범위

사용자 후속 요청으로 로컬 main을 원격과 같은 a59dd562552f0c5b50c56e692061c5f1e16e2289까지 fast-forward한 뒤 이 배포/공개 확인 결과를 문서 커밋으로 공유한다. 기능 코드·의존성·빌드/workflow·009~013 작업 파일은 수정하지 않는다.
이번 요청은 문서만 갱신하므로 로컬 기능 검사를 재실행하지 않는다. 기존 main CI105개 전체 통과와 사용자 공개 확인을 근거로 하고 변경 문서의 링크·상태·공백을 검사한다.
사용자 승인 범위에서 main 문서 커밋과push를 수행한다. 원격 쓰기 도구의 권한 실패와 실제 성공 여부는 실행 결과로 확인하며 새 배포가 성공하기 전에는 성공으로 기록하지 않는다. 009는 별도 요청 전까지 시작하지 않는다.

## 완료 문서 정합성

이번 변경은Markdown12개뿐이다. 로컬 링크270개에서 깨진 링크0개를 확인했고 git diff --check를 통과했다. 기능 코드·009~013 태스크 파일은 변경하지 않았다.
