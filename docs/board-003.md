# 003 보드 표시 구현·검증 — 03 당시 이력

- 날짜: 2026-10-23
- 대상: [003 보드 렌더링](../tasks/003-board-rendering.md)
- 기준: [설계의 상태·UI 계약](plans/sudoku-mvp.md), [D-003](decisions/003-state-input-and-time.md)
- 상태: 코드 구현·자동 검증 수행. 필수 실제 브라우저 검증은 연결 타임아웃으로 미실행이며 작업은 차단됨이다. 04 리뷰·완료 판단 전이다.
- 선행: 001 환경·002 엔진 완료 기록·현재 코드를 확인했다. Git 저장소·기본 브랜치가 없어 브랜치 작업을 생략하고 사용자 요청으로 현재 폴더에 구현했다.
- 실제 브랜치·커밋·푸시·PR·병합: 없음·미실행.

## 실제 구현

| 파일 | 내용 |
|---|---|
| [index.html](../index.html) | 시맨틱 보드 마운트·상태 안내·보기 전용 안내·범례 |
| [main.css](../styles/main.css) | 9열 Grid·정사각 셀·3x3 굵은 경계·단서/빈칸·가시적 포커스·좁은 화면 스타일 |
| [board.js](../src/ui/board.js) | renderBoard(root,state), 상태의 읽기 전용 셀 표시 모델, WeakMap으로 81셀 노드 재사용 |
| [main.js](../src/main.js) | generatePuzzle(easy) 초기 호출·성공 검증·초기 표시·로딩·실패 안내·pagehide 취소 |
| [board.html](../tests/browser/board.html) | 개발 전용 고정 fixture 화면·실패 결과 주입·포커스/노드/불변/레이아웃 검사 |
| [board-checks.js](../tests/browser/board-checks.js) | 실제 DOM 재렌더 검사·개발 페이지 조작 연결 |
| [board-rendering.test.js](../tests/board-rendering.test.js) | 상태 필드·배열/Set 분리·단서/메모/충돌 표시·원본 불변·형식 검사 6개 |
| [server.test.js](../tests/server.test.js) | 새 보드·개발 페이지·fixture의 실제 HTTP/MIME 검사 추가 |

실제 퍼즐은 앱 진입 시 엔진으로 생성한다. 고정 fixture는 개발 페이지에서만 import하며 앱에 테스트·정답 공개 버튼을 넣지 않았다.
플레이어 입력·방향키 이동·store·난이도 변경·새 게임·타이머·완료 dialog는 아직 없다.

## 계약 적용

- createDisplayState는 계획의 GameState 필드를 사용하는 표시용 snapshot이다. puzzle/values는 별도 복사, notes는 81개 독립 Set이다. 정식 store·reducer는 구현하지 않았다.
- timer 필드는 null이며 표시 단계에서 시간 측정을 시작하지 않는다. 입력·시간 효과는 후속 작업에서 연결한다.
- getCellModels는 renderer와 Node 테스트가 공유하는 표시 계산이다. 상태·보드·Set을 쓰지 않고 메모는 새 배열로 정렬한다. 오류는 values의 충돌만 사용하며 정답을 비교하지 않는다.
- renderBoard는 첫 호출에 81개 button을 생성하고 이후 같은 button과 내부 span을 갱신한다. 상태 선택의 tabIndex만 반영하며 focus()나 입력 이벤트를 추가하지 않는다.
- 셀 이름에 행·열·숫자/빈칸·단서 여부·해당 메모·충돌을 포함한다. 오류에는 테두리와 ! 표식이 있으며 ARIA grid 역할은 넣지 않았다.
- main의 성공 결과는 easy·빈칸35·Board 형식·논리 유효성을 확인한다. 엔진의 유일해 보장에 의존하며 UI에서 별도 비동기 해답 수를 세지 않는다.
- 실패 결과는 빈 비활성 보드와 일반 실패 안내를 표시한다. 예상치 못한 예외는 console.error에 남기고 같은 안내를 표시한다. 페이지 새로고침으로 재시도하며 별도 새 게임 기능은 넣지 않았다.
- 새 ADR이나 설계 계약 변경은 없다. D-003의 읽기 전용 상태→렌더 부분만 반영했으며 전체 상태·Action·시간 구현을 완료한 것으로 적지 않는다.

## 실제 자동 검증

Windows PowerShell, 기존 Node v24.22.1·npm CLI 8.19.4를 사용했다. 시스템 설치·전역 PATH는 변경하지 않았다.

- Node 내장 테스트: 표시 모델 검사 6개 모두 통과.
- 전체 npm test: **50개 중 49 통과·0 실패·1 skip**, 취소 0·exit 0, 약 7.79초.
- 구성: 엔진 25개 통과, 표시 모델 6개 통과, 서버 19개 중 18 통과·1 skip.
- skip은 기존 junction 생성 EPERM이다. 통과로 바꾸지 않았다. 서버 구현은 그대로이며 새 자산 HTTP 검사만 추가했다.
- HTTP 검사는 새 마운트, board.js·main.js·개발 HTML/JS·fixture의 200 응답과 MIME을 확인했다. 이는 브라우저의 실제 JS 실행·DOM·레이아웃 통과 근거가 아니다.
- 기존 CLI 시작·HTTP·정상 종료·포트 닫힘도 통과했다. 엔진 세 난이도 seed 9건도 모두 기본 예산 안에 성공했다.
- 이번 단계에서 관련 코드·검증을 작성했지만 04 정식 코드 리뷰는 수행하지 않았다.

실행 명령(프로젝트 루트):

    $nodeDirectory = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
    $nodeExecutable = Join-Path $nodeDirectory 'node.exe'
    $npmEntry = Join-Path $env:ProgramFiles 'nodejs\node_modules\npm\bin\npm-cli.js'
    $env:Path = "$nodeDirectory;$env:Path"
    & $nodeExecutable $npmEntry test

## 브라우저 시도·서버 정리

- computer-use의 브라우저 도구로 HTTP 확인을 시도했다.
- 동일 서버 모듈의 임시 서버: http://127.0.0.1:56302, PID 36664, 90초 자동 종료.
- 브라우저 탭에서 /tests/browser/board.html 접근 시 net::ERR_CONNECTION_TIMED_OUT으로 실패했다.
- 실제 화면·포커스·DOM 동일성·320px/1280px·브라우저 콘솔은 미확인이다. 실제 브라우저 버전·viewport·스크린샷도 확보하지 못했다.
- 서버 세션은 BOARD_REVIEW_SERVER_CLOSED 출력과 exit 0을 확인했다. 이번 서버는 남아 있지 않다.

## 남은 실제 브라우저 확인 절차

위 Node 선택 후 사용자 PowerShell에서 실행한다.

    $env:PORT = '8082'
    & $nodeExecutable $npmEntry start

1. http://127.0.0.1:8082/ 를 연다. “퍼즐 준비 완료 · 쉬움” 표시, 81셀·46개 단서·35개 빈칸을 확인한다. 개발자 도구 Console에 예기치 않은 오류가 없는지 확인한다. 실패한 생성은 실패 안내 후 새로고침해 재시도한다.
2. http://127.0.0.1:8082/tests/browser/board.html 을 연다. 이 페이지는 고정 fixture이며 30개 단서·51개 빈칸이다. 앱의 실제 생성 결과와 혼동하지 않는다.
3. 개발자 도구 Device Toolbar에서 viewport를 320×800, 1280×900으로 각각 설정한다. 아래 검사를 양쪽 크기에서 수행한다. 브라우저 이름·버전·실제 viewport를 기록한다.
4. “포커스·재렌더 검사” 버튼을 누른다. 새 출력의 checks에서 cells81·sameNodes·focusPreserved·stateUnchanged·clueLabel·blankNotesLabel·oneTabStop·noHorizontalOverflow·squareCell·boxRightThick·boxBottomThick이 모두 true여야 한다. facts의 실제 경계 폭은 3px여야 한다.
5. 키보드 Tab으로 보드의 선택 셀에 접근해 주황색 포커스 테두리가 보이는지 확인한다. 셀 이름의 행·열·값·고정 단서/입력 칸을 접근성 트리에서 확인한다. 아직 방향키 이동·숫자 입력은 구현하지 않았다.
6. “실패 결과 주입”을 누른다. 의도한 실패 PASS, 실패 안내·빈 비활성 보드가 표시되고 가짜 퍼즐로 바뀌지 않아야 한다. “고정 보드 복원”으로 돌아온다.
7. 앱·fixture 페이지의 3x3 굵은 경계, 정사각 셀·단서 배경·빈칸 구분·가로 스크롤 부재를 눈으로 확인한다. 자동 모델 검사는 이 시각 검사를 대체하지 않는다.
8. Console 오류·Network의 HTML/JS/CSS 200과 MIME을 확인하고 관찰 결과를 기록한다. 터치·실제 플레이 검증은 이번 범위가 아니다.
9. 서버 터미널에서 Ctrl+C로 종료하고 종료 문구·프롬프트 복귀를 확인한다.

필수 항목을 실제 관찰하기 전에는 BOARD-01~04를 최종 통과로 표시하지 않는다. 다음 04 요청도 같은 tasks/003-board-rendering.md를 대상으로 한다.

## 최종 문서·정적 확인

- Markdown 27개·내부 파일 링크 282개 확인, 깨진 링크 0개.
- 003 차단됨과 BOARD-01~04·REV-01 미체크, 001·002 완료·004·005 예정 상태가 일치한다.
- main.js·board.js·개발 fixture 스크립트의 node --check가 통과했다. 실제 브라우저 실행 검증을 뜻하지 않는다.
- 프로덕션의 테스트 fixture import가 없고 core·utils의 DOM/Node 전용 import가 없음을 확인했다.
- 마지막 전체 자동 검사 이후에는 문서만 수정했다. 새 ADR·외부 의존성·Git 작업은 없다.

## 후속 04 리뷰·수정·현재 판단

위 03 이력 이후 null 선택 Tab 진입점·fixture 판정·캐시 복귀 초기화를 보완했다.
최신 전체 검사는 53개 중 52 통과·0 실패·1 skip이며 표시/검증보조/수명주기 9개가 통과했다.
브라우저 재시도는 타임아웃으로 실제 UI 증거가 없고 003 차단됨을 유지한다. 이번 90초 서버의 종료 로그·exit 0은 확인했다.
최신 수정·자동 검증·브라우저 시도·남은 절차는 [04 리뷰 기록](review-003.md)을 따른다.

## 사용자 후속 확인·완료·05

위 기록은 03·04 도구 실행 당시 이력이다. 이후 2026-10-23 사용자가 전체 53개 테스트 통과와 실제 보드·320px/1280px·checks·포커스/접근성·실패 주입/복원·콘솔 오류 없음·서버 종료를 확인했다.
필수 조건을 충족해 003을 완료 처리했고 [05 커밋 메시지·PR 초안](pr-drafts/task-003.md)을 작성했다. 증거 출처와 별도 미확인인 실제 BFCache 복귀는 [최신 리뷰 판단](review-003.md)을 따른다.