# 011 같은 숫자 강조 — 04 코드 리뷰와 검증

- 일자: 2026-10-29. 브랜치: feat/task-011-matching-digit-highlight. HEAD: 1dda61d.
- 대상: [작업011](../tasks/011-matching-digit-highlight.md), [03 구현 기록](matching-011.md), 현재 미커밋 변경과 신규 파일.
- 기준: [공통 리뷰 기준](review-checklist.md), [현재 구조](../architecture.md), [D-005](decisions/005-assistance-highlights-and-undo.md), [후속 계약](plans/sudoku-next-iteration.md).
- 최종 판단: 코드 리뷰·수정·자동 재검증 및 사용자 145개 전체 통과/필수 UI 확인으로 011 완료. 이후 PR #5 main 병합·Actions 배포·사용자 공개 확인도 완료했다. 아래 단계별 대기 문구는 당시 이력이다. 012/013은 구현하지 않았다.

## 발견 사항과 수정

1. 스톡 개발 검증 페이지의 기존 hiddenMatchingToggle 조건이 같은 숫자 토글의 부재를 요구했다. 011에서 토글을 추가했으므로 정상 UI에서도 실측 검사가 항상 실패하는 결함이다. 토글이 정확히 하나 존재하고 label·checked·disabled가 현재 옵션/게임 상태와 일치하는지 검사하도록 수정했다.
2. interaction 페이지는 matchingIndices만 출력하고 실제 DOM 표식·접근성 이름·토글 상태를 판정하지 않았다. matching-assertions.js의 측정 판정을 연결해 누락/과잉/잔여 강조·잘못된 접근성 이름·숨겨진 강조·누락/중복 토글을 탐지하도록 보강했다. 기존 최근 입력 checks도 함께 유지한다.
3. 새 측정 판정의 회귀 4개를 추가해 정상적인 ON/OFF·게임 잠금과 위 실패 조건을 확인했다. 순수 판정 테스트는 실제 브라우저 측정이 수행됐다는 뜻이 아니다.

제품 상태 전이/렌더링의 명세 위반은 검토 범위에서 발견하지 못했다. 이번 수정은 개발 검증 결함과 검증 누락의 보완이다. 실제 배경 대비·단서/선택/최근/충돌/포커스 겹침은 사용자 검증 전까지 확정하지 않는다.

## 조건별 리뷰

| 조건 | 근거와 판단 |
|---|---|
| MATCH-01 | 보드 형식·옵션 boolean·선택 범위를 검사한 뒤 현재 values만 비교한다. 단서·입력·충돌 숫자 포함, 빈칸·메모 제외. 파생값만 사용하며 원본을 변경하지 않는다. 관련 자동 검사 통과 |
| MATCH-02 | null/빈칸 선택·OFF·playing 외 상태는 selectedDigit=0으로 강조 없음. 새 요청은 기존 reducer에서 두 옵션false. 완료 잠금·삭제 후 재투영도 자동 검사 통과 |
| MATCH-03 | 두 옵션4조합·단일 선택/탭정지·최근 표식/충돌 모델과 기존 이벤트/스톡 회귀 통과. CSS는 배경만 확장하고 최근 밑줄·충돌 테두리·포커스 outline 유지. 실제 키보드/터치/가독성은 대기 |
| DOC-01 | 현재 구현·계획·부분 적용 범위·작업 목록·이번 리뷰 결과 갱신 |
| REV-01 | 코드 리뷰·수정·자동 재검증 수행. 필수 실제 화면 확인이 남아 완료 판정 대기 |

controls는 checkbox change/render/dispose를 소유하고 기존 board 이벤트를 중복 등록하지 않는다. 보드 클릭/터치/방향키는 기존 SELECT/MOVE 흐름을 유지한다. 패드는 검색 모드로 바뀌지 않았으며 회색 스톡 버튼의 입력 허용도 유지한다. 단서 수정·외부 폼 키 처리·타이머·완료 dialog는 기존 경계를 유지한다. core·상태 계약·빌드/의존성·Pages 설정은 이번 리뷰에서 변경하지 않았다. 같은 숫자 표시를 별도 상태로 저장하거나 후보/정답을 추천하지 않는다.

## 이번 실제 실행 결과

Node v24.22.1, 기존 고정 TypeScript 7.0.2를 사용했다. 패키지 설치·전역 환경 변경 없음.

| 명령/검사 | 결과 |
|---|---|
| npm run typecheck | 통과 |
| npm run build:dev | 통과, 깨끗한 .build |
| node --test tests/matching-digit.test.js tests/matching-presentation.test.js | 관련12개 모두 통과 |
| npm test | 총145개: 144통과·0실패·1skip. 기존 Windows 디렉터리 링크 생성 EPERM |
| npm run build | 통과, 깨끗한 dist |
| fixture 구문 검사 | interaction-checks.js·stock-checks.js 통과 |
| HTTP | /, CSS, board.js·controls.js, interaction.html/checks.js, matching-assertions.js, stock.html/checks.js의9경로200·출력 본문 일치·JS MIME 확인 |
| 배포 경계 | dist에 tests/docs/TS/소스맵 미포함 확인 |
| 서버 종료 | 임시 HTTP 서버 close 후 ECONNREFUSED 확인. 실행 중인 검증 서버 없음 |
| 브라우저/터치/콘솔 | 이번에는 사용자 요청에 따라 시도하지 않음. 아래 방법만 제공. 03의 로컬 접속 시간 초과는 당시 이력 |

실제 UI 필수 항목이 남아 있으므로 진행 중이다. 과거 로컬·CI·다른 태스크의 사용자 확인을 011의 화면 검증으로 간주하지 않는다.

## 사용자 실행 명령

PowerShell에서 다음을 실행한다. 기존 node_modules가 있으므로 재설치할 필요는 없다. 각 명령이 실패하면 다음으로 넘어가지 않고 오류를 확인한다.

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

Node는22 이상이어야 한다. 현재 세션의 PATH만 변경한다. 포트8082가 사용 중이면 기존 서버를 소유 터미널에서 종료하거나 빈 포트로 변경한다. 아래 주소도 실제 출력 포트로 바꾼다. GitHub 공개 게임에는 아직011이 배포되지 않았으므로 로컬 주소에서 확인한다.

## 브라우저·터치 확인 순서

1. http://127.0.0.1:8082/tests/browser/interaction.html 을 Ctrl+F5로 연다. Console을 비운다. 두 옵션이OFF, matchingIndices=[], checks가 모두true인지 확인한다.
2. 같은 숫자 강조를ON하고 고정2행1열의6을 선택한다. 보드의 실제6만 단서 포함 연한 배경으로 강조되고 빈칸/다른 숫자는 제외되는지 확인한다. 보고서matchingIndices와셀 접근성 이름 선택한 숫자와 같음을 대조한다. 단서 셀의숫자는 입력/삭제해도 바뀌지 않아야 한다.
3. 빈1행3열 선택→강조 전체 해제. 숫자6 입력→기존6들과 함께 강조. 5로 덮어쓰기→5들로 즉시 변경. Delete/지우기→강조 해제. 같은 칸에서 메모ON→6 입력→메모OFF 후 고정6 선택 시 메모 칸은 강조하지 않아야 한다.
4. 일반 입력 fixture를 다시 누른다. 같은 숫자ON→1행3열에5 입력하면 단서5와 충돌한다. 최근 입력 밑줄·충돌 테두리/느낌표·선택 배경·포커스 링이 구분되는지 확인한다. 고정1행1열5를 선택해도 최근 입력은1행3열에 남고 같은 숫자 강조는5 전체에 있어야 한다.
5. 스톡/같은 숫자를 OFF/OFF, ON/OFF, OFF/ON, ON/ON 네 조합으로 변경한다. 옵션 자체로 values/notes/lastInputIndex가 바뀌지 않고, 같은 숫자OFF면 강조/접근성 이름이 사라져야 한다. 방향키로 값 있는 칸/빈칸 이동, 마우스/터치 셀 선택, Tab/Space 토글을 확인한다. 단일 선택과 단일 보드 탭정지를 유지하고 외부 텍스트 입력/선택상자의 키를 가로채지 않아야 한다.
6. http://127.0.0.1:8082/tests/browser/stock.html 에서 스톡9개 버튼을 누른다. 두 옵션ON, 비어 있는2행1열에 회색9 패드 버튼으로 입력한다. 입력이 허용되고 현재9들이 강조되는지 확인한다. 스톡 실측 검사 버튼을 눌러 checks 전부true인지 확인한다. 이번에 수정한matchingToggle도true여야 한다.
7. interaction 페이지의 완료 직전 fixture에서 같은 숫자ON→1행3열에4 입력한다. completed, matchingIndices=[], 토글/숫자 입력 잠금을 확인한다. http://127.0.0.1:8082/tests/browser/controls.html 에서도 완료 직전 fixture→옵션ON→같은 입력으로 완료 dialog·닫기/Esc·포커스 복귀·matchingCount=0을 확인한다.
8. controls 페이지의 첫 요청 실패→다시 시도를 확인한다. 새 게임·재시도·새로고침은 두 옵션OFF이고 이전 강조가 없어야 한다. 메인 http://127.0.0.1:8082/ 에서도 토글·입력·새 게임 초기화를 확인한다.
9. Ctrl+Shift+M 장치 모드에서320px·1280px 폭과 터치 입력으로 위 주요 절차를 반복한다. interaction의 현재 표시 checks 갱신을 눌러 모두true인지 확인한다. 단서/선택 배경 차이·최근 밑줄·충돌·포커스·도움말/토글 잘림·가로 넘침은 육안으로도 확인한다. 에뮬레이션/실기기 여부는 구분해 보고한다.
10. 각 페이지 Console에 예기치 않은 오류나 ESM 로딩 실패가 없는지 확인한다. 서버 터미널에서 Ctrl+C→종료 로그 확인 후 새로고침 시 접속 불가를 확인한다. 새 PowerShell의 아래 결과는False여야 한다.

~~~powershell
Test-NetConnection 127.0.0.1 -Port 8082 -InformationLevel Quiet
~~~

체크 판정 자체의 회귀는 자동으로 검증했지만 실제 DOM·CSS·기기 동작은 위 사용자 확인이 필요하다. 결과와 테스트 개수/skip 여부를 알려주면 MATCH-03/REV-01을 최종 판정하고 완료 후05 초안을 작성한다. 현재는 커밋·push·012 구현을 진행하지 않는다.

## 011 사용자 최종 확인·완료·05 — 2026-10-29

사용자는 안내 절차에 따라 테스트 145개가 모두 통과했고, 같은 숫자 강조·메모 제외·옵션 조합·회색 버튼 입력·완료 시 해제·포커스·터치·반응형·콘솔 오류 없음과 서버 종료를 확인했다고 보고했다.

[04 최종 기록](review-011.md)에서 사용자 보고를 근거로 MATCH-03/REV-01을 충족한 것으로 판정했다. 도구의 이전 144통과/1권한skip과 03 시간 초과·04 UI 미시도는 당시 이력으로 보존한다. 원시 로그·스크린샷·브라우저/기기 버전·실기기/에뮬레이션 구분은 미제공이며 도구 직접 관찰로 표현하지 않는다.

[05 커밋 메시지·PR 초안](pr-drafts/task-011.md)을 작성했다. 이번에는 문서만 갱신해 기능 검사를 재실행하지 않았다. 검토 범위 내 중대한 미해결 문제는 확인되지 않았다. 로컬 완료는 원격 CI·병합·배포 완료를 뜻하지 않으며 커밋·push·012/013 구현은 하지 않았다. D-005는 같은 숫자 강조까지 부분 적용한 상태다.

## 011 병합·배포·공개 확인 — 2026-10-29

011은 구현 1d03c53을 PR #5로 main 4a2edad에 병합했고, Actions 40843161441의 validate/deploy 성공·145개 전체 통과와 사용자 공개 화면의 같은 숫자 강조·옵션 초기화 정상 확인까지 마쳤다. 012~013은 예정이며 구현하지 않았다.

[최종 배포 기록](deployment-011.md)에 PR/병합 커밋·Actions 검증·사용자 공개 확인 근거를 모았다. 공개 동작은 사용자 보고이며 도구 직접 관찰과 구분한다. 이전 미커밋·미배포·확인 대기 문구는 각 단계 당시 이력이다. 이번 후속 변경은 문서만 main에서 커밋·push하는 작업이다.
