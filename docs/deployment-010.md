# 010 PR 병합·Actions 배포·공개 화면 확인

- 날짜: 2026-10-29 (Asia/Seoul). [작업010](../tasks/010-last-input-highlight.md) 완료.
- 구현 커밋: 5cff1b77808991a2fe55e978eb07902a7ba8492e.
- PR: [#4](https://github.com/Lim-YongKwan/sudoku-web/pull/4), feat/task-010-last-input-highlight → main, merge 방식.
- 병합 커밋: 40821866cee4fe685a5ab2ef2f28d01dfcbf4da8.
- 병합 시각: 2026-10-29 16:11:37 KST. GitHub merged=true와브라우저의병합 완료를확인했다.

## 검증과 배포 근거

| 대상 | 실제 확인 |
|---|---|
| PR 검증 | [Actions40832824451](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40832824451): validate 성공,133통과·0실패·0skip. PR deploy는의도적으로skip |
| main 배포 | [Actions40833855921](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40833855921): push/main 4082186, validate/deploy 성공 |
| validate job123313964441 | npm ci·typecheck·npm test·build·Pages artifact 업로드 모두성공. 로그133통과·0실패·0skip |
| deploy job123314051632 | configure-pages·Deploy·Complete job 성공, 공개URL 확인 |
| 배포 artifact | github-pages 12879408535,17.8KB. 검증된dist를배포하며기존개발fixture 제외경계를유지 |
| 공개 주소 | [스도쿠](https://lim-yongkwan.github.io/sudoku-web/) |

기존 GitHub Actions Pages 설정을유지했다. 새패키지·workflow/Pages설정 변경·브랜치 삭제는하지않았다. Actions에표시된Node20기반 action의Node24 강제실행 경고와ubuntu-latest 이관안내는실패가아니며이번문서작업에서설정을변경하지않는다.

## 공개 화면 확인

공개origin은저장된브라우저접근권한설정으로도구접속이차단됐다. 다른브라우저·HTTP도구·프록시로우회하지않았다.
사용자에게Ctrl+F5 후입력/다른칸선택/30초대기에도갈색밑줄 유지,덮어쓰기시최신칸으로이동,동일값/메모/옵션변경시유지,최근숫자삭제/새게임시해제를확인하도록안내했다.
사용자는 “최근 입력 지속 표시 정상 확인”으로답했고,이번요청에서도공개주소정상동작을재확인했다. 공개게임동작의근거는이사용자보고이며도구직접관찰과구분한다.
기존로컬사용자133개전체통과·포커스/터치/반응형·콘솔/서버종료보고는[04기록](review-010.md)에보존한다. 공개사이트에서전체로컬시나리오를다시직접검증했다고표현하지않는다. 원시로그·기기/브라우저버전·공개게임스크린샷은미제공이다.

## 완료 문서 공유

이번요청에서깨끗한로컬main을원격40821866cee4fe685a5ab2ef2f28d01dfcbf4da8로fast-forward했다. 병합/배포/사용자공개확인을문서에반영해main 문서커밋·push를진행한다.
제품코드·검사코드·의존성·빌드/배포설정·011~013작업파일은수정하지않는다. 문서만변경하므로기능검사는재실행하지않고기존main CI133개통과를근거로한다. 변경문서의링크·상태·공백을검사한다. 이번문서push로새로발생하는Actions는확인전성공으로기록하지않는다.
011구현은시작하지않는다. 이전미커밋/미배포/검증대기기록은각단계당시이력이다.
