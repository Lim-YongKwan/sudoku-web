# 스도쿠 MVP 전체 인수 검증 — 06

- 실행일: 2026-10-26
- 판정: **완료 — 기존 자동/통합 검증과2026-10-26 사용자 잔여 인수 확인으로 필수 조건 충족**
- 완료일: 2026-10-26
- 수행: Codex — 자동·통합·HTTP·문서 검증; 사용자 — 전체92개 재검증·실제 브라우저/터치·서버 종료 확인.
- 선행: 001~005 구현·리뷰·사용자 잔여 검증 완료와 현재 코드를 확인했다.
- 범위: 환경→실제 엔진→보드→입력/상태→게임 제어/시간/완료, 전체 회귀·문서 정합성.
- 최초06 도구 실행 당시에는 Git 저장소가 없었다. 이후 main에 첫 커밋2fdfd7d를 저장했다. 이번에는 후속 사용자 확인을 문서에 반영해 별도 문서 커밋으로 저장한다.
- push·실제 PR 생성·병합·배포 미실행. 단계06은 작업ID006 발급을 뜻하지 않는다. 최초 도구 실행의 미실행·실패는 아래 이력으로 보존한다.

## 1. 선행 작업과 근거

| 작업 | 현재 상태·코드 | 개별 검증 근거 |
|---|---|---|
| [001 환경](../../tasks/001-development-environment.md) | 완료, Node runtime·HTTP 서버·CLI·npm scripts | [001 리뷰](../review-001.md), 사용자18개 통과·ESM/콘솔/종료 확인 |
| [002 엔진](../../tasks/002-sudoku-engine.md) | 완료, board·solver·generator·탐색 runtime | [002 리뷰](../review-002.md), DOM 독립 계약·유일해·예산·취소 |
| [003 보드](../../tasks/003-board-rendering.md) | 완료, persistent81셀·반응형·ARIA·개발 fixture | [003 리뷰](../review-003.md), 사용자53개 통과·실제 화면 확인 |
| [004 입력/상태](../../tasks/004-user-interaction.md) | 완료, reducer/store·위임 입력·메모·충돌·완료 잠금 | [004 리뷰](../review-004.md), 사용자71개 통과·필수 UI/터치 확인 |
| [005 제어/시간/완료](../../tasks/005-game-controls-timer.md) | 완료, 새 게임·취소/경합·타이머·native dialog | [005 리뷰](../review-005.md), 사용자89개 통과·타이머/dialog/포커스/터치 등 확인 |

기존 사용자 보고는 유효한 선행 증거로 보존한다. 이번06에서 이를 직접 관찰·새로 실행한 것으로 표현하지 않는다.
이번 변경은 통합 테스트 추가와 문서 보완이며 게임 실행 코드는 변경하지 않았다. 기존 사용자 UI 확인을 무효화하는 게임 동작 변경은 없다.
원시 사용자 로그·브라우저 버전·정확한 viewport·터치 장치/에뮬레이션 구분·스크린샷은 미제공이다.

## 2. 이번에 발견한 문제와 처리

### A-01: D-001의 현재 상태 메타데이터가 실제 구현과 불일치

[D-001](../decisions/001-native-esm-and-tooling.md)은 현재 적용 범위에 게임 미구현, 관련 작업에002/003 예정이 남아 있었다. 실제로는001~005가 구현·개별 검증 완료 상태였다.

[001 태스크](../../tasks/001-development-environment.md)의 문서 범위를 근거와 함께 재개했다. 현재 메타데이터를 실제 코드/작업 목록과 맞추고 링크·ID·상태 확인 후 같은001을 재완료했다.
과거 날짜의 이력·최초 완료·사용자 확인·05 초안은 삭제하지 않았다. 결정의 결론·채택됨 상태도 유지했다.
게임 실행 코드의 새 결함은 이번 검증 범위에서 재현되지 않았다. 새 기능 태스크·ADR은 만들지 않았다.

### A-02: 모듈별 검사에 더해 실제 엔진→게임 session 통합 근거 보강

[acceptance.test.js](../../tests/acceptance.test.js)에3개 검사를 추가했다.

1. 실제 generator→유일해 count/solver→session의 단서 보호·메모·입력·삭제→정상 완성·시간 정지/잠금→dialog 닫기 플래그→다음 난이도 재시작.
2. 실제 generator의 node budget 실패→빈/error 상태→실제 생성 재시도 성공.
3. 실제 진행 중 generator를 양보 지점에서 멈춘 뒤 다음 요청으로 취소→이전 aborted 결과가 최신 퍼즐을 덮어쓰지 않음.

이것은 Node에서 실제 모듈들을 연결한 통합 검사다. DOM·native dialog·터치 검사로 대신하지 않는다.

## 3. 실제 명령·환경·결과

Windows PowerShell, 기존 Node v24.22.1·npm CLI8.19.4. 외부 패키지 설치·전역 PATH 변경 없음.

프로젝트 폴더에서 실행:

    Set-Location 'C:\Users\임용관\Documents\Codex\2026-10-23\agents-md\outputs\sudoku-project'
    $nodeDirectory = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
    $nodeExecutable = Join-Path $nodeDirectory 'node.exe'
    $npmEntry = Join-Path $env:ProgramFiles 'nodejs\node_modules\npm\bin\npm-cli.js'
    $env:Path = "$nodeDirectory;$env:Path"
    & $nodeExecutable --version
    & $nodeExecutable $npmEntry --version
    & $nodeExecutable --test tests/acceptance.test.js
    & $nodeExecutable $npmEntry test

| 검사 | 이번 실제 결과 |
|---|---|
| 신규 통합3개 단독 | 3통과·0실패·0skip, 약3.96초 |
| 전 자동 테스트 | **92개 중91통과·0실패·1skip**, exit0, 약7.80초 |
| node --check | src/scripts/tests의28개 JS/MJS 모두 통과 |
| 의존성/경계 | dependencies/devDependencies 없음, core/utils에서DOM·Node 전용·원격 import 의존성 미발견 |
| 작업 ID/상태 | 001~005 파일명/ID 일치·완료·미체크0개 |
| Git | 프로젝트와 상위 폴더 모두 Git 저장소가 아니라고 반환 |

skip은 기존 Windows junction 생성 EPERM이다. 이를 통과로 계산하지 않는다.
이전 사용자의89개 전체 통과는 이번 신규3개를 포함하지 않는다.92개 모두 통과했다고 주장하지 않는다.

## 4. 생성·유일해·실패·완료 판정

기존 generator 검사의 기본 예산·양보 설정으로 seed1/42/2026을 각 난이도에서 실행했다.

| 난이도 | 목표 빈칸 | 생성 결과 | 성공 결과의 유일해 | 측정 경과 범위 |
|---|---:|---|---|---|
| easy | 35 | 3/3 성공 | 모두count=1 | 약581~611ms |
| normal | 45 | 3/3 성공 | 모두count=1 | 약794~842ms |
| hard | 50 | 3/3 성공 | 모두count=1 | 약963~1069ms |

노드·시간·시도 제한 실패, 재시도·신호 취소, 오래된 성공/실패/reject, payload·입력 불변·단서 보존은 기존 회귀를 다시 실행했다.
추가 통합은seed42의 세 난이도 모두35/45/50 빈칸·유일해·실제 입력 후completed를 확인했다.
빈칸·규칙 위반·단서 불일치·올바른 완성 판정은 board/game-state/game-controls 회귀에서 확인했다.
측정은 이번 Windows/Node 환경의 결과다. 모든 임의 seed의 성공·실제 브라우저 반응 시간에 대한 보장은 아니다.

## 5. 실행·HTTP·브라우저·종료

### 실제 npm start

    $env:PORT = '0'
    & $nodeExecutable $npmEntry start

runtime prestart와 scripts/serve.mjs가 실행돼 http://127.0.0.1:59654, 서버PID2392를 출력했다.
그 주소에 앱 내 브라우저로 접근했지만 약154초 뒤 net::ERR_CONNECTION_TIMED_OUT이었다. 이동 대기 제한을 요청했어도 도구 반환이 지연됐다.
별도 shell fetch도 해당PTY 서버 주소에 ETIMEDOUT이었다. 따라서 npm start의 시작 로그만으로 HTTP/ESM 성공이라고 쓰지 않는다.
정확한 실행 환경 간 연결 원인은 미확정이다. 이전 턴의 Chrome URL 확인 실패를 이번06의 새 Chrome 실행 결과로 쓰지 않는다.

### 정적 서버 모듈 직접 HTTP

같은 승인된 shell 실행에서 startServer(port0)→HTTP fetch→finally closeServer를 수행했다.
주소는 http://127.0.0.1:64438이었다.

| 경로 | 상태 | Content-Type |
|---|---:|---|
| / | 200 | text/html |
| /src/main.js | 200 | text/javascript |
| /styles/main.css | 200 | text/css |
| /tests/browser/board.html | 200 | text/html |
| /tests/browser/interaction.html | 200 | text/html |
| /tests/browser/controls.html | 200 | text/html |

전체 회귀의 실제 CLI 시작·HTTP·소유 부모IPC 종료 검사도 통과했다.
이 결과는 정적 응답·서버 처리의 증거이며 브라우저 ESM 실행·DOM·focus의 증거는 아니다.

### 서버 정리

- npm start의 소유PTY 세션에Ctrl+C를 전달해 '서버를 종료했습니다.'를 확인했다. Windows 인터럽트로 세션exit는-1073741510이며exit0으로 기록하지 않는다.
- 이후PID2392 없음·59654 LISTEN 없음으로 해당 서버 종료를 확인했다.
- 직접 HTTP 서버는 closeServer 후 listening=false와06_DIRECT_SERVER_CLOSED true를 확인했다.
- 다른 Node 프로세스·이전 사용자 서버를 일괄 종료하지 않았다.

## 6. 전체 인수 항목별 판단 — 사용자 확인 전 도구 실행 당시

| 항목 | 자동/코드 근거 | 실제 UI 근거와 이번06 한계 |
|---|---|---|
| 환경·HTTP·ESM | runtime·MIME·경계·종료·전 회귀 통과 | 기존001 사용자ESM 확인. 이번06 브라우저ESM 관찰 미실행 |
| 생성·난이도·유일해 | 실제9seed·추가3난이도 통합 통과 | 기존005 사용자 난이도/새 게임 확인. 이번 재관찰 미실행 |
| 입력·메모·단서·충돌 | board/state/event 정책·통합 입력 통과 | 기존003/004 사용자 확인. 이번DOM/키보드/패드 미실행 |
| 재시작·잠금·실패·오래된 응답 | session 및 실제 실패/취소 통합 통과 | 기존005 사용자 확인. 이번 생성 중UI 반응 미실행 |
| 타이머·탭 비활성·정리 | 시각·단일tick·완료 정지·재시작 회귀 통과 | 기존005 안내 절차 확인 보고. 이번 실제 탭 이동 미실행 |
| 완료 판정·dialog·focus | 정상/실패 판정·R1 이벤트 경계 회귀 통과 | 기존005 사용자dialog/focus 확인. 이번native modal/Escape 미실행 |
| 320px·일반 화면·터치·콘솔 | CSS·ARIA·키 정책 코드 검토 | 기존003~005 사용자 확인. 이번뷰포트/터치/콘솔 미실행 |
| 문서·ID·상태·명령 | D-001 보완·링크·상태 검사 | 최종 문서 점검란 참조 |

당시 상태는 '자동/문서 검증 수행, 필수 현재 브라우저 관찰 차단'이었다. 이후 사용자 최종 확인으로 아래에서 인수 완료로 갱신했다. 배포 완료는 아니다.
001~005의 완료 상태는 유지한다. 실제BFCache 복귀는 기존처럼 별도 미확인이다.

## 7. 사용자에게 안내한 확인 절차 — 최종 보고로 수행 확인

Node22 이상을 준비하고 같은프로젝트 폴더에서 실행한다. PORT8082가 사용 중이면 다른 빈 포트를 선택한다.

    & $nodeExecutable $npmEntry test
    $env:PORT = '8082'
    & $nodeExecutable $npmEntry start

서버가 출력한 주소를 사용한다. 현재 테스트 수는92개다. pass/fail/skip 수를 그대로 기록한다.

1. 루트 게임에서 실제 퍼즐 표시, 단서 보호·숫자 입력·삭제·메모·충돌 안내·숫자 패드·방향키 경계·Tab과 포커스를 확인한다.
2. 난이도 선택만 바꾸면 현재 게임이 유지되는지, 새 게임에서 선택이 적용되고 시간이 초기화되는지 확인한다. 연속 요청·생성 중 입력 잠금·마지막 보드만 남는지도 확인한다.
3. /tests/browser/controls.html에서 첫 요청 실패→재시도, 첫 요청 지연→새 게임→오래된 응답 전달을 확인한다. requestId·보드가 유지되고 pendingSignalAborted=true여야 한다.
4. 완료 직전 fixture에서1행3열에4 입력 후 완료 dialog·시간 정지·배경 잠금·닫기 포커스·Tab/Shift+Tab을 확인한다. Escape/닫기 후 새 게임 포커스와 완료 보드의 입력 잠금이 유지돼야 한다. 이후 다른 컨트롤의 포커스를 지연 close가 가져가지 않아야 한다.
5. 플레이 중 다른 탭에서10초 이상 머문 뒤 돌아와 시간이 포함되고 즉시 보정되는지 확인한다. 새 게임을 반복해도 시간이 두 배 속도로 증가하면 안 된다.
6. /tests/browser/board.html의 checks와 실패 주입·복원을 확인한다. /tests/browser/interaction.html에서는 외부 input/select 키 동작·메모1회 토글·충돌 안내·실패/복원·완료 잠금을 확인한다.
7. 320px·1280px에서 보드·컨트롤·dialog의 잘림과 가로 넘침을 확인한다. 실제 터치 또는 에뮬레이션으로 셀·패드·메모·새 게임·닫기를 확인하고 환경을 구분해 기록한다.
8. Console 오류·Network 자산 실패 없음과 Ctrl+C 종료 안내·해당PID/포트 종료를 확인한다. 실제 BFCache 복귀는 별도 기록한다.

브라우저/버전·viewport·터치 환경·각 기대/관찰/결과·발견 사항을 이 기록에 추가한다.
아래 사용자 최종 보고로 브라우저 검증 차단을 해제했다. 새 기능/별도 문제를 발견하면 기존 태스크 재개 또는 다음ID 발급 규칙을 따른다.
이 기록은 실제 Git 반영·PR 승인·병합·배포의 증거가 아니다.

## 8. 도구 실행 당시 문서 점검

Markdown36개·내부 파일 링크495개·깨진 링크0개를 확인했다. 001~005 파일명/ID·완료 상태·미체크0개가 목록과 일치하고 D-001~003 채택 상태를 유지한다. 마지막 전체 테스트 이후에는 문서만 수정했다.

## 9. 사용자 최종 확인·인수 완료 — 2026-10-26

사용자가 안내한06 절차대로 테스트92개 모두 통과, 브라우저·터치·반응형·완료 대화상자·포커스·콘솔 오류 없음·서버 종료를 확인했다고 보고했다.
절차에는 기본 게임·보드/입력/제어 검증 페이지, 난이도·새 게임·실패/지연 응답·타이머·입력 잠금·키보드·외부 폼 확인이 포함돼 있었다.
이 결과는 사용자 환경의 실제 확인이며 Codex가 직접 화면·터치를 관찰했다는 뜻이 아니다.

- [x] 전체92개 테스트 통과 — 사용자 재실행 보고.
- [x] 환경·실제 HTTP 게임·ESM·콘솔 — 기존 자동 근거와 사용자 안내 절차 확인.
- [x] 세 난이도·유일해·입력/메모/단서/충돌 — 기존 실제 엔진·통합 회귀와 사용자 절차 확인.
- [x] 새 게임·생성 잠금·실패 재시도·오래된 응답 무시 — 자동/통합 근거와 사용자 절차 확인.
- [x] 타이머 초기화·숨김 탭 시간·완료 정지·중복 방지 — 기존 회귀와 사용자 절차 확인.
- [x] 보드 checks·실패/복원·외부 폼·완료 잠금 — 사용자 안내 절차 확인.
- [x] 완료 dialog·닫기/Escape·포커스·터치·반응형 — 사용자 실제 확인 보고.
- [x] 콘솔 오류 없음·서버 종료 — 사용자 확인 보고.
- [x] 코드·문서·ID·상태·링크 일치 — 문서 갱신 후 검사.

기존 도구 결과92개 중91통과·0실패·1skip(junction EPERM), 브라우저/교차접속 타임아웃, Windows Ctrl+C 종료 상태는 당시 이력으로 보존한다. 사용자92개 모두 통과 보고와 구분한다.
브라우저 버전·정확한 viewport·실제 터치/에뮬레이션 구분·원시 로그·스크린샷은 미제공이다. 실제 BFCache 복귀는 별도 미확인인 선택 항목이며 필수 인수 차단 요소가 아니다.
이번 범위의 필수 인수 항목은 충족했고 보고된 미해결 문제는 없다. 06 전체 인수 검증을 완료 처리한다.
게임 코드·테스트 변경 없이 문서만 수정하므로 이번 턴에 테스트를 다시 실행하지 않는다. 사용자 요청대로 변경 문서를 커밋하며 push·원격 PR·병합·배포는 하지 않는다.

최종 문서 갱신 검사: Markdown37개·내부 파일 링크504개·깨진 링크0개, git diff --check 통과. 변경은 문서6개뿐이다.
