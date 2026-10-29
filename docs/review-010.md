# 010 최근 입력 지속 표시 — 04 검증·코드 리뷰

- 일자: 2026-10-29. 브랜치: feat/task-010-last-input-highlight. HEAD: 0f5e5c2.
- 대상: [작업 명세](../tasks/010-last-input-highlight.md), [03 구현](last-input-010.md), 현재 미커밋 diff.
- 기준: [리뷰 체크리스트](review-checklist.md), [현재 구조](../architecture.md), [D-005](decisions/005-assistance-highlights-and-undo.md), [후속 계약](plans/sudoku-next-iteration.md).
- 최종 판단: 코드 리뷰·보완·자동 재검증 및2026-10-29 사용자133개 전체 통과·필수 UI/터치 확인으로010 완료. 커밋·push·PR·배포는 하지 않았다. 아래 대기 문구는 당시 이력이며 최종 확인은 하단을 따른다.

## 확인한 동작과 구조

| 조건 | 검토 근거와 결과 |
|---|---|
| RECENT-01 | reducer는 실제 숫자 변경만 index를 갱신한다. 동일값·메모·단서 입력·선택/이동·옵션4조합은 유지한다. 이전 상태 보존을 포함한 자동 검사 통과 |
| RECENT-02 | 최근 숫자 삭제는null, 다른 숫자/메모 삭제는유지, 초기/새 요청/생성/실패/완료는null. session의 마지막 입력→완료→입력 잠금 연결도 추가 검사 통과 |
| RECENT-03 | 모델 recent·접근성 이름과 CSS 숫자 밑줄을 확인했다. 선택/단서 배경·충돌 테두리/느낌표·포커스 outline을 덮어쓰지 않는다. 120초 주입 시계 지속/추가 타이머 없음 통과. 실제 시각·터치 확인은 대기 |
| DOC-01 | task/목록·현재 구조·계획·결정 부분 적용 범위·README를 갱신하고 로컬 링크를 점검 |
| REV-01 | 아래 보완과 자동 재검증 완료. 필수 사용자 UI 확인이 남아 완료 조건은 미충족 |

core는 DOM/시계를 읽지 않으며 새 runtime 의존성은 없다. lastInputIndex는 readonly이고 store/renderer 진입에서 검증한다. 렌더러는 기존 셀을 재사용하고 상태나 포커스를 바꾸지 않는다. Action/입력 이벤트/완료 dialog의 소유 경계와 strict/.js import 계약을 유지했다. 기존 엔진·생성 예산·유일해 코드는 수정하지 않았으며 전체 회귀에서 재확인했다. 011 같은 숫자·012 취소·013 저장 복원은 범위 밖이다.

## 발견 사항과 보완

1. 검증 근거 부족: interaction fixture가 index와 class만 보고하여 밑줄 CSS 누락·접근성 이름 누락·완료 후 잔여 표시를 판정하지 못했다. DOM/계산 스타일 측정값을 lastInputChecks에 전달해 81셀/최근 표식 개수·위치/접근성/보이는 밑줄/편집 숫자/가로 넘침 checks를 추가했다. 창 크기 변경과 현재 표시 checks 갱신 버튼으로 재측정한다. 없는/중복/낡은 표식·밑줄/이름 누락·숨김/단서/잠금·가로 넘침을 거부하는 순수 판정 회귀4개를 추가했다.
2. 완료 연결 검증 부족: reducer 완료 검사는 있었지만 session.dispatch의 마지막 숫자 입력에서 완료가 연결되어 반환되는 최종 상태까지 새 필드로 검사하지 않았다. 마지막 입력→completed/null/잠금/대화상자 상태의 회귀1개를 추가하고 controls fixture 보고서에 lastInputIndex/recentCount를 노출했다.
3. 문서 불일치: README의 현재 상태가010 예정/이전 main 문서 커밋 요청으로 남아 있었다. 로컬010 구현·04 자동 검증·사용자 확인 대기로 바로잡았다.

제품의 최근 입력 전이에서 명세 위반 결함은 발견하지 못해 제품 코드는 추가 수정하지 않았다. 위 사항은 검사·시연·문서 보완이다. 실제 폰트/밑줄 잘림·색상 구분·터치·포커스 품질은 아래 사용자 검증 전까지 확정하지 않는다.

## 이번 실행 결과

Node v24.22.1, 기존 TypeScript 7.0.2. 패키지 설치·전역 환경 변경 없음.

| 명령/검사 | 결과 |
|---|---|
| npm run typecheck | 통과 |
| npm run build:dev | 통과, 깨끗한 .build |
| node --test tests/last-input.test.js tests/last-input-presentation.test.js | 14개 전체 통과 |
| npm test | 총133개: 132통과·0실패·1skip (기존 Windows 디렉터리 링크 생성 EPERM) |
| npm run build | 통과, 깨끗한 dist |
| fixture JS 구문 검사 | interaction-checks.js, controls-checks.js 통과 |
| HTTP | /, CSS, 컴파일된 last-input.js, interaction.html/checks.js, last-input-assertions.js, controls-checks.js의 7경로200·본문 일치·JS MIME 확인 |
| 배포 경계 | last-input.js 포함, tests/docs/TS/소스맵 미포함 |
| 서버 종료 | 이번 임시 HTTP 서버 close 후 ECONNREFUSED 확인. 실행 중인 검증 서버를 남기지 않음 |
| 실제 브라우저/터치/콘솔 | 사용자 요청에 따라 이번에는 시도하지 않고 아래 절차 제공. 03의 URL 확인 불가와 이번 미시도를 구분 |

Node의 측정 판정 테스트는 브라우저가 해당 측정값을 실제로 반환했다는 증거가 아니다. 수동 화면의 checks가 모두true여도 포커스 링·밑줄 잘림·충돌/단서 시각 구분은 별도로 육안 확인해야 한다.

## 사용자 실행 명령

PowerShell에서 다음을 실행한다. 기존 의존성이 있으므로 재설치는 필요 없다. 아래 PATH 변경은 현재 터미널에만 적용한다.

~~~powershell
Set-Location 'C:\Users\임용관\Documents\Codex\2026-10-23\agents-md\outputs\sudoku-project'
$nodeDirectory = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
$nodeExecutable = Join-Path $nodeDirectory 'node.exe'
$npmEntry = Join-Path $env:ProgramFiles 'nodejs\node_modules\npm\bin\npm-cli.js'
$env:Path = "$nodeDirectory;$env:Path"
& $nodeExecutable --version
& $nodeExecutable $npmEntry run typecheck
& $nodeExecutable $npmEntry test
& $nodeExecutable $npmEntry run build
$env:PORT = '8082'
& $nodeExecutable $npmEntry start
~~~

Node는22 이상이어야 한다. 명령 하나라도 실패하면 다음으로 넘어가지 말고 오류를 확인한다. 8082가 이미 사용 중이면 이전 서버를 해당 터미널에서 Ctrl+C로 종료하거나 빈 포트로 변경하고 실제 출력 주소를 쓴다. GitHub 공개 주소는009 배포 상태이므로010은 로컬에서 확인한다.

## 사용자 브라우저·터치 확인 순서

1. http://127.0.0.1:8082/tests/browser/interaction.html 을 열고 Ctrl+F5한다. 개발자 도구 Console을 비운다. 보고서에서 checks가 전부true이고 lastInputIndex=null, recentCells=[]인지 확인한다.
2. 일반 입력 fixture에서1행3열에4 입력: 갈색 밑줄 하나, lastInputIndex=2, recentCells의index2/이름 최근 입력. 다른 칸을 선택해도 유지되는지 확인한다.
3. 1행4열에6 입력→index3. 1행3열에4 재입력→index3 유지. 같은 칸을8로 덮어쓰기→index2로 이동. 단서 숫자를 선택해 입력해도 단서와 최근 입력은 바뀌지 않아야 한다.
4. 빈1행6열 선택→메모ON→1 추가/제거→메모OFF. 스톡ON/OFF·방향키 이동·외부 텍스트 폼 입력을 해도index2 유지. 보드로 돌아와 숫자 입력/삭제 키가 정상인지 확인한다.
5. 1행3열에5 입력해 충돌을 만들고 다른 칸 선택. 최근 숫자의 갈색 밑줄·중복 느낌표/테두리·단서 배경과 키보드 포커스 링이 함께 구분되어야 한다. 1행4열의6 삭제→index2 유지. 1행3열의5 삭제→null/밑줄0개.
6. 1행3열에4를 다시 입력하고 다른 칸을 선택한 채30초 이상 기다린다. 현재 표시 checks 갱신을 누르면 여전히index2/표식1개/checks 전부true여야 한다. 이 버튼은 보드 포커스를 옮기는 UI이므로 보드 셀의 포커스는 별도로 Tab/방향키로 확인한다.
7. 완료 직전 fixture를 누르고1행3열에4 입력: completed, lastInputIndex=null, recentCells=[], checks 전부true, 숫자/메모/삭제 잠금. 이 페이지에는 실제 완료 dialog가 없고 완료 메시지로 이동한다.
8. http://127.0.0.1:8082/tests/browser/controls.html 에서 완료 직전 fixture→1행3열4 입력. 완료 dialog 표시/시간 정지, 보고서lastInputIndex=null·recentCount=0, 닫기/Esc/포커스 복귀를 확인한다. 생성 실패 fixture→새 게임 재시도로 성공하며 이전 표시가 없는지도 확인한다.
9. http://127.0.0.1:8082/ 실제 게임에서 입력→다른 칸 선택→새 게임 및 새로고침 후 표식 초기화, 스톡OFF 초기화를 확인한다. 난이도 드롭다운 선택만으로 기존 최근 입력이 사라지지 않고 새 게임 시작 때 해제되는지도 확인한다.
10. 개발자 도구 장치 모드(Ctrl+Shift+M)에서320px·1280px로 바꾸고 위 입력/삭제/메모/선택/충돌/완료를 반복한다. interaction 페이지에서는 크기 변경 후 checks를 갱신한다. 가로 스크롤·숫자/밑줄 잘림이 없어야 한다. 터치 모드에서 셀·패드·메모·삭제·옵션·dialog가 한 번씩 동작하고 최근 입력과 선택이 독립적인지 확인한다. 실기기 검증 여부와 에뮬레이션 여부는 구분해 보고한다.
11. 각 페이지 Console에 예기치 않은 오류가 없고 ESM 자산 로딩 실패가 없는지 확인한다. 최근 셀의 접근성 이름에 최근 입력이 포함되고 표식 해제 후 해당 이름도 제거되는지 Elements/Accessibility에서 확인한다.
12. 서버 터미널에서 Ctrl+C→서버를 종료했습니다 로그를 확인한다. 새 PowerShell에서 아래 명령 결과 False, 브라우저 로컬 주소 새로고침 시 접속 실패를 확인한다.

~~~powershell
Test-NetConnection 127.0.0.1 -Port 8082 -InformationLevel Quiet
~~~

위 명령은 True/False만 출력하므로 정상 종료의 기대값은 False다. 포트를 바꿨다면 같은 포트로 검사한다.

## 다음 단계

사용자 자동 검사 개수·skip 여부와 위 항목 결과를 확인한 뒤 tasks/010-last-input-highlight.md의 RECENT-03/REV-01을 최종 판정한다. 그전에는 진행 중을 유지한다. 05 커밋 메시지/PR 초안·실제 Git 작업은 별도 요청 후 진행하며011 구현은 시작하지 않는다.

## 사용자 최종 확인과 완료 판단 — 2026-10-29

사용자는 안내 절차에 따라 테스트133개가 모두 통과했고, 최근 입력 유지·덮어쓰기·삭제·메모·옵션·완료 시 해제·포커스·터치·반응형·콘솔 오류 없음과 서버 종료를 확인했다고 보고했다.

- 수행 주체: 사용자. 도구가 직접 브라우저/터치를 재관찰하거나133개를 재실행한 결과가 아니다.
- RECENT-01/02는 전이·세션 회귀와 사용자 입력/삭제/메모/옵션/완료 확인으로, RECENT-03은 주입 시계·모델 검사와 안내 절차에 따른 사용자 지속 표시/포커스/터치/반응형 확인으로 충족했다.
- DOC-01/REV-01은 문서 갱신·04 검토/보완/자동 재검증·사용자 잔여 확인으로 충족했다. 검토 범위 내 중대한 미해결 문제는 확인되지 않아010을 완료했다.
- 원시 로그·스크린샷·브라우저/기기 버전·실기기/에뮬레이션 구분은 미제공이며 특정 기기 검증으로 단정하지 않는다. 이전 도구의132통과/1skip과 UI 미시도는 당시 이력이다.
- [05 커밋 메시지·PR 초안](pr-drafts/task-010.md)을 작성했다. 이번 요청에서는 문서 링크·상태·diff만 확인했고 제품 코드는 바꾸거나 기능 검사를 재실행하지 않았다. 원격 CI·병합·배포는 미실행이며011은 기본 브랜치 반영 후 별도 시작한다.
