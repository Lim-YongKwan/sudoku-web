# 005 게임 제어·시간·완료 구현 — 03 당시 이력

- 날짜: 2026-10-26
- 대상: [005 태스크](../tasks/005-game-controls-timer.md)
- 상태: 03 구현·자동 검증 수행. 필수 실제 UI 검증 차단됨·04 리뷰 전. 완료 아님.
- 선행002·003·004 완료 기록과 현재 코드를 확인했다. 004의 사용자 잔여 검증은 [004 리뷰](review-004.md)에 반영하고 [05 초안](pr-drafts/task-004.md)을 작성했다.
- 독립 Git 저장소·기본 브랜치가 없어 브랜치·실제 diff 비교는 미실행. 사용자 후속 요청에 따라 현재 폴더에서 구현했다. Git·원격 쓰기는 없다.
- 기준: [설계 계약](plans/sudoku-mvp.md), [D-002](decisions/002-unique-bounded-generation.md), [D-003](decisions/003-state-input-and-time.md).

## 구현

| 파일 | 동작 |
|---|---|
| [main.js](../src/main.ts) | DOM 없는 createGameSession으로 store·시계·생성·scheduler 효과 조정. mountGame에서 UI·visibility·정리 연결 |
| [controls.js](../src/ui/controls.ts) | 난이도·재시작·시간·현재 난이도·native dialog 렌더, change/click/cancel/close 정리 |
| [time.js](../src/utils/time.ts) | 유한 시각 검사·초 내림·완료 시각 고정·mm:ss, 100분 이상 표시 |
| [index.html](../index.html)·[CSS](../styles/main.css) | 다음 게임 난이도·새 게임·타이머·완료 제목/설명/닫기와 반응형 배치 |
| [시간 검사](../tests/time.test.js)·[제어 검사](../tests/game-controls.test.js) | 시계 경계·요청 경합·실패·정리·완료 잠금·컨트롤 이벤트 경계 |
| [controls.html](../tests/browser/controls.html)·[controls-checks.js](../tests/browser/controls-checks.js) | 실제 seed 생성·완료 직전·첫 실패 후 재시도·첫 지연 후 오래된 응답 전달 |
| [HTTP 검사](../tests/server.test.js) | 새 JS·개발 HTML·fixture의 HTTP/MIME 검사 확장 |

- 드롭다운의 easy/normal/hard는 다음 요청에 적용한다. 기존 normal 식별자를 사용한다. 현재 퍼즐 난이도와 선택 난이도를 구분한다.
- 새 게임 시 이전 AbortController와 tick을 정리하고 requestId를 증가시킨다. 오래된 성공·실패·reject는 payload 검증 전에 무시한다. 현재 요청의 난이도 불일치·예상 밖 reject는 일반 실패로 전환한다.
- generating은 이전 보드·메모·시간·dialog를 비우고 보드/숫자 도구만 잠근다. 새 게임 버튼은 계속 사용 가능하다.
- 타이머는 주입 단조 시각의 차이를 표시한다. playing 동안250ms interval 하나를 유지하고 새 게임·완료·dispose에서 정리한다. visibilitychange로 복귀 시 즉시 보정한다.
- 완료 조건은 기존 isComplete와 reducer 재검증을 사용한다. native dialog는 제목·설명·닫기·Escape를 연결하고 닫은 후 새 게임 버튼에 포커스를 돌린다. 타이머는 aria-live=off다.
- pagehide에서 기존 상태 snapshot·session·입력·컨트롤·interval·생성을 정리한다. 캐시 복귀는 기존 수명주기 helper로 재마운트한다. 실제 BFCache 관찰은 미실행이다.
- 기존003/004 개발 페이지는 dialog가 없는 상태로 계속 사용 가능하다. 005 화면 검증은 새 controls.html을 사용한다. fixture/정답 버튼은 프로덕션에 없다.

## 자동 검증 — 실제 결과

Windows PowerShell, Node24.22.1, npm CLI8.19.4. 외부 설치·전역 PATH 변경 없음.

    $nodeBin = 'C:\Users\임용관\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
    $env:PATH = "$nodeBin;$env:PATH"
    & "$nodeBin\node.exe" 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' test

| 수행 | 결과 |
|---|---|
| 초기 시간/제어14개 | 14통과·0실패 |
| 최초 전체 회귀 | 로컬 연결 EACCES로 HTTP 관련 실패. 성공으로 계산하지 않음 |
| 네트워크 권한 승인 후 전체 | 85개 중84통과·0실패·1skip, exit0 |
| 난이도 생성 중 선택·오래된 abort 회귀2개 추가 후 최종 전체 | **87개 중86통과·0실패·1skip**, exit0, 약7.97초 |
| 최종 신규 범위 | 시간4개·제어12개, 모두 통과 |
| node --check | main·controls·time·개발 script·새 테스트2개 통과 |

skip은 기존 Windows junction 생성 EPERM이다. 이번005에서 통과로 바꾸지 않았으며004의 사용자71개 통과 보고를 신규005 결과로 쓰지 않는다.
제어 검사의 구조적 생성 응답 double은 엔진의 유일해 증거가 아니다. 실제 생성·seed·유일해는 기존 generator 회귀에서 검증한다.
EventTarget 컨트롤 double은 실제 DOM·native modal·포커스·touch 통과 증거가 아니다.

## HTTP·브라우저·서버 종료

최초 서버의 자체 fetch도 EACCES였다. 해당 프로세스는 exit1로 끝났다. 실제 오류 근거로 네트워크 권한을 요청·승인받았다.
승인 후 새 서버 http://127.0.0.1:54621 PID50428에서 /tests/browser/controls.html의 HTTP200을 확인했다.
앱 내 브라우저 새 탭으로 같은 페이지에 접근했지만 net::ERR_CONNECTION_TIMED_OUT이었다. 실제 화면·콘솔·dialog·키보드·터치·반응형·탭 복귀는 확인하지 못했다.
이 HTTP200은 브라우저 ESM 실행 증거가 아니다. 정확한 환경 간 연결 실패 원인은 미확정이다.
소유한 임시 서버에 종료 marker를 전달해 005_REVIEW_SERVER_CLOSED·exit0을 확인했다. 해당 서버는 종료했다.

## 남은 실제 확인 절차

아래는 아직 수행하지 않은 안내이며 통과 결과가 아니다. 프로젝트 폴더의 PowerShell에서 Node22 이상을 준비한다.

    Set-Location 'C:\Users\임용관\Documents\Codex\2026-10-23\agents-md\outputs\sudoku-project'
    $nodeBin = 'C:\Users\임용관\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
    $env:PATH = "$nodeBin;$env:PATH"
    & "$nodeBin\node.exe" 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' test
    $env:PORT = '8082'
    & "$nodeBin\node.exe" 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' start

포트8082가 사용 중이면 다른 빈 포트를 선택한다. 출력된 실제 주소로 다음을 확인한다.

1. 루트 앱에서 퍼즐 생성·00:00 시작·입력·메모·충돌·타이머를 확인한다. 다음 게임 난이도만 바꿨을 때 현재 보드·타이머·난이도 태그는 유지돼야 한다. 새 게임에서 선택 난이도와35/45/50 빈칸이 적용되는지 확인한다.
2. 새 게임을 빠르게 반복한다. 생성 중 입력은 잠기고 이전 보드는 사라지며 마지막 게임만 남아야 한다. 10초 이상 다른 탭으로 갔다 돌아오면 숨겨진 시간이 포함돼 즉시 따라잡는지 확인한다.
3. /tests/browser/controls.html에서 '첫 요청 실패' → 실패 안내·00:00·빈 보드·'다시 시도' → 성공·시간 시작을 확인한다.
4. '첫 요청 지연' → generating → 새 게임 → 성공을 기다린 뒤 '오래된 응답 전달'. report의 requestId·보드·상태가 유지되고 pendingSignalAborted=true인지 확인한다.
5. '완료 직전 fixture' →1행3열에4 입력. completed·시간 정지·native dialog 제목/설명·닫기 포커스·배경 입력 차단을 확인한다. 닫기 또는Escape 후 새 게임 포커스, 보드 잠금·정지 시간 유지, 새 게임 재시작을 확인한다.
6. 320px·1280px에서 컨트롤·dialog·오류 안내·가로 넘침을 확인한다. Tab·방향키·외부 input/select 키 동작, 터치로 선택·패드·새 게임·닫기를 확인한다.
7. Console 오류·Network 자산 실패 없음과 반복 fixture 교체 후 메모 한 번 토글·중복 시간 증가 없음·정리 동작을 확인한다. 실제 BFCache 복귀는 별도 기록한다.
8. 서버 터미널에서 Ctrl+C 후 종료 로그·주소 접속 실패와 해당 포트 LISTEN 없음으로 종료를 확인한다. 다른 Node 프로세스를 일괄 종료하지 않는다.

브라우저 이름/버전·viewport·실제 터치 또는 에뮬레이션 환경·각 관찰 결과를 기록한다. 스크린샷은 미첨부다.
다음04 입력 경로는 tasks/005-game-controls-timer.md이며 필수 증거·리뷰가 끝나기 전 완료 처리하지 않는다.
## 문서·상태 최종 확인

Markdown33개·내부 파일 링크423개·깨진 링크0개를 확인했다. 004는 완료·미체크0개이며005는 차단됨·04 리뷰 전으로 작업 목록과 일치한다.
git rev-parse는 프로젝트와 상위 폴더 모두 Git 저장소가 아니라고 반환했다. 실제 브랜치·비교 diff·커밋·원격 작업은 없다.
마지막 전체 테스트 이후 변경은 문서뿐이다. 이번03에서 정식04 리뷰·완료 또는05 초안을 수행하지 않았다.
## 후속04 기록 — 2026-10-26

이 문서는03 당시 이력이다. 이후04에서 지연 close의 중복 처리·포커스 이동을 수정하고 신규2개 회귀와 전체89개 중88통과·0실패·1skip을 확인했다. 실제 Chrome 시도는 현재 URL 확인 실패로 도구가 중단돼 필수 UI·터치는 남아 있다. 최신 근거는[04 리뷰](review-005.md)를 따른다.
## 후속 사용자 확인·완료 — 2026-10-26

위는03·04 당시 이력이다. 이후 사용자 전체89개 통과·필수 UI/터치·콘솔 오류 없음·서버 종료 보고로005를 완료했다. 최종 근거는[04 리뷰](review-005.md), 커밋/PR 제안은[05 초안](pr-drafts/task-005.md)을 따른다. 실제 Git 작업은 미실행이다.

> 007 전환 안내: 위 과거 기록의 .js 파일명은 당시 구현을 뜻한다. 소스 링크는 이동한 현재 .ts 파일을 가리키도록 갱신했다. 브라우저 출력은 계속 .js다.
