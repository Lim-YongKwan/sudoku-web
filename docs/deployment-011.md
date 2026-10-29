# 011 PR 병합·배포·공개 화면 확인

- 기록일: 2026-10-29. [작업011](../tasks/011-matching-digit-highlight.md) 완료.
- 구현 커밋: 1d03c5391bc8d4ce3ba903a01c3b8e59e1d6aed2.
- PR: [#5](https://github.com/Lim-YongKwan/sudoku-web/pull/5), feat/task-011-matching-digit-highlight → main.
- 병합 커밋: 4a2edad32211dbcc36facfea3d828cea1797000d.
- 병합 시각: 2026-10-29 17:34:50 KST. GitHub merged=true와 병합 커밋을 확인했다.

## 검증과 배포 근거

| 대상 | 실제 확인 |
|---|---|
| PR 검증 | [Actions 40841677505](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40841677505): validate 성공, 145통과·0실패·0skip. PR deploy는 의도적으로 skip |
| main 배포 | [Actions 40843161441](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40843161441): push/main 4a2edad, validate/deploy 성공 |
| validate job 123344177228 | npm ci·typecheck·npm test·build·Pages artifact 업로드 성공. 테스트 로그 145통과·0실패·0skip |
| deploy job 123344282659 | configure-pages·Deploy·Complete job 성공 |
| 공개 주소 | [스도쿠](https://lim-yongkwan.github.io/sudoku-web/) |

기존 GitHub Actions Pages 설정을 유지했다. 패키지·workflow·Pages 설정은 변경하지 않았다.

## 공개 화면 확인

공개 origin은 저장된 브라우저 접근 권한 설정으로 도구 접속이 차단됐다. 다른 브라우저·HTTP 도구·프록시로 우회하지 않았다.
사용자에게 Ctrl+F5 후 두 보조 옵션 초기 OFF, 같은 숫자 강조 ON일 때 선택한 숫자와 같은 셀만 단서 포함 강조, 빈칸 선택/OFF 시 해제, 새 게임·새로고침 후 두 옵션 OFF 여부를 확인하도록 안내했다.
사용자는 “같은 숫자 강조·옵션 초기화 정상 확인”이라고 보고했다. 공개 게임 동작의 근거는 이 사용자 보고이며 GitHub/Actions의 도구 확인과 구분한다.
로컬 사용자 145개 전체 통과·포커스/터치/반응형·콘솔/서버 종료 보고와 도구의 144통과/1권한skip 이력은 [04 리뷰](review-011.md)에 보존한다. 공개 사이트에서 전체 로컬 검증을 도구로 다시 수행했다는 뜻은 아니다. 사용자 확인의 원시 로그·기기/브라우저 버전·공개 게임 스크린샷은 미제공이다.

## 완료 문서 공유

깨끗한 로컬 main을 원격 병합 커밋 4a2edad32211dbcc36facfea3d828cea1797000d로 fast-forward했다. 병합·배포·사용자 공개 확인을 문서에 반영하여 main에서 문서 커밋·push를 진행한다.
제품 코드·테스트·의존성·빌드/배포 설정·012/013 작업 파일은 수정하지 않는다. 문서만 변경하므로 기능 검사를 재실행하지 않고 기존 main CI 145개 통과를 근거로 한다. 변경 문서의 링크·현재 상태·공백을 검사한다.
이번 문서 push로 새로 발생하는 Actions는 확인 전 성공으로 기록하지 않는다. 012 구현은 시작하지 않았다. 이전 단계의 미커밋·미배포·검증 대기 기록은 당시 이력이다.
