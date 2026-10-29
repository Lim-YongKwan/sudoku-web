# 004 플레이어 입력·상태 구현 — 03 당시 이력

- 날짜: 2026-10-23
- 대상: [004 태스크](../tasks/004-user-interaction.md)
- 근거: [상태·Action·UI 계약](plans/sudoku-mvp.md), [D-003](decisions/003-state-input-and-time.md)
- 상태: 코드 구현·자동 검증 수행. 필수 실제 브라우저·터치 검증은 미실행으로 차단됨이며 04 리뷰 전이다.
- 선행 002·003의 완료 기록과 현재 코드를 확인했다. 독립 Git 저장소·기본 브랜치가 없어 브랜치·diff 비교를 생략하고 사용자 지시에 따라 현재 폴더에서 구현했다.
- 실제 커밋·푸시·PR 생성·병합은 수행하지 않았다.

## 실제 구현

| 파일 | 동작 |
|---|---|
| [game-state.js](../src/core/game-state.ts) | createInitialState·reduceGame·createGameStore, 전체 계획 Action, 순수 전이·구독 정리 |
| [events.js](../src/ui/events.ts) | bindInput·키 정책, 위임 click·keydown, 보드 선택·숫자·삭제·메모·포커스 |
| [main.js](../src/main.ts) | mountGame으로 store·생성 Action·renderer·입력·완료 판정·오류 안내·정리 연결 |
| [board.js](../src/ui/board.ts) | 기존 renderer를 그대로 재사용해 선택·값·메모·충돌·Tab 위치 갱신 |
| [index.html](../index.html)·[main.css](../styles/main.css) | 화면 숫자 패드·삭제·메모·중복 안내·활성/비활성·pressed 표시 |
| [game-state.test.js](../tests/game-state.test.js) | 상태·Action·불변·단서·메모·이동·완료·구독·재진입 검사 13개 |
| [input-events.test.js](../tests/input-events.test.js) | 게임 키 매핑과 외부 폼·수정키·IME·Tab 보존 정책 검사 2개 |
| [interaction.html](../tests/browser/interaction.html)·[interaction-checks.js](../tests/browser/interaction-checks.js) | 일반·완료 직전·생성 실패 store fixture, 외부 input/select·상태 보고·재바인딩 검사 |

## 계약·구현 선택

- reducer는 DOM·시계·난수·Promise 효과를 실행하지 않는다. 시각은 Action의 nowMs로 전달하며 타이머 시작/종료 메타데이터만 기록한다.
- 임의 입력의 형식·범위는 TypeError/RangeError, 단서 수정·비활성 상태 입력·동일값/빈삭제·오래된 요청은 no-op다. 완료 판정은 빈칸·유효성·단서 일치를 모두 요구한다.
- puzzle/values는 생성 성공 때 별도 복사하며 메모는 81개 독립 Set이다. 변경된 배열·Set만 복사하고 이전 상태를 보존한다.
- getState는 계약상 읽기 전용 참조다. 반환 배열·Set을 외부에서 직접 바꾸면 안 되며 Proxy 등으로 강제 차단하는 API는 도입하지 않았다.
- store는 초기 데이터를 방어 복사한다. 구독은 독립 token으로 관리하고 unsubscribe는 반복 호출해도 안전하다. 구독자 안의 dispatch는 큐에 넣어 모든 관찰자가 전이를 순서대로 보게 한다.
- 위임 click은 마우스·네이티브 터치 click·버튼 키보드 활성화를 한 번 처리한다. touchstart/pointerdown을 중복 등록하지 않는다.
- 숫자·삭제·방향키는 보드 셀에서만 가로챈다. 외부 input/select/textarea/contenteditable·브라우저 수정키 조합·Tab·IME 입력은 보존한다.
- 숫자 패드·삭제·메모는 현재 선택에 적용하고 렌더 후 해당 셀로 포커스를 복귀한다. 고정 셀도 선택할 수 있지만 수정되지 않는다.
- 오류는 findConflicts만 사용하며 !·테두리·셀 이름·공용 상태 문구로 전달한다. 숨겨진 정답과 비교하지 않는다.
- mountGame은 초기 요청·성공/실패 Action으로 실제 퍼즐을 store에 넣는다. 입력 후 유효 완성이면 GAME_COMPLETED를 dispatch하고 시간 메타데이터를 종료한다. 실제 interval·timer UI·dialog는 아직 없다.
- completed 상태에서 입력 도구·셀을 비활성화하고 완료 안내로 포커스를 옮긴다. completionDialogOpen은 상태 계약만 반영했으며 실제 dialog를 열지 않는다.
- pagehide에 구독·입력 바인딩·진행 중 생성을 정리한다. BFCache 복귀는 playing/completed snapshot을 복사해 복원하고 생성 중이던 경우 새 signal로 초기화한다.
- 003의 createDisplayState·showInitialBoard는 기존 읽기 전용 개발 fixture 호환용으로 남겼다. 앱의 실제 경로는 mountGame/store를 사용한다.
- 새 ADR·요구 변경은 없다. D-003의 상태·Action·입력·완료 상태·시각 메타데이터에 반영했으며 타이머 표시·게임 제어 UI는 005 범위다.

## 실제 자동 검증

- 환경: Windows PowerShell, Node v24.22.1·npm CLI 8.19.4. 세션 PATH에서 lifecycle Node도 해당 버전을 선택했다.
- 첫 신규 검사 15개 중 14 통과·1 실패: 테스트가 틀린 정답이면 반드시 충돌이라고 가정했다. 상위 35칸을 비운 fixture에서 값6은 실제 충돌이 없었으므로 정상 동작이었다.
- 이를 충돌 없는 다른 값6은 경고 없음, 값3은 기존 단서와 열 충돌 발생으로 분리해 수정했다. 요구사항·제품 코드를 바꿔 잘못된 테스트에 맞추지 않았다.
- 수정 후 신규 검사 15개 전부 통과.
- 전체 npm test: **68개 중 67 통과·0 실패·1 skip**, 취소 0·exit 0, 약 7.66초.
- 구성: 엔진25·기존 보드/판정/수명주기9·새 상태/키 정책15 통과, 서버19 중18 통과·1 skip.
- skip은 기존 서버의 Windows junction 생성 EPERM이다. 이번 통과로 바꾸지 않았다.
- 새 game-state.js·events.js·interaction 개발 HTML/JS의 실제 HTTP 200·MIME 검사도 통과했다.
- 기존 CLI 시작·HTTP·정상 종료·포트 닫힘과 엔진 seed 검사도 통과했다.

실행 명령은 프로젝트 루트에서 README의 Node 22 이상 선택 후 npm test다.
Node 정책·상태 검사와 HTTP 자산 제공은 실제 click·touch·DOM 포커스·320px·완료 화면 검증이 아니다.

## 브라우저 시도

- 같은 정적 서버 모듈의 90초 자동 종료 서버: http://127.0.0.1:56717, PID 31160, 세션 58846.
- 브라우저 도구의 새 탭에서 /tests/browser/interaction.html 접근 → net::ERR_CONNECTION_TIMED_OUT.
- 실제 클릭·터치·키보드·포커스·외부 폼·완료 잠금·시각 메모/오류·Console는 관찰하지 못했다. 스크린샷·버전·viewport 증거가 없다.
- 003의 사용자 검증은 이전 표시 화면의 증거다. 이번 변경된 입력·store·main·컨트롤의 필수 UI 검증을 대신하지 않는다.

## 사용자 환경에서 남은 확인 절차

프로젝트 루트에서:

    $nodeDirectory = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
    $nodeExecutable = Join-Path $nodeDirectory 'node.exe'
    $npmEntry = Join-Path $env:ProgramFiles 'nodejs\node_modules\npm\bin\npm-cli.js'
    $env:Path = "$nodeDirectory;$env:Path"
    & $nodeExecutable $npmEntry test
    $env:PORT = '8082'
    & $nodeExecutable $npmEntry start

1. / 에서 실제 생성 퍼즐을 연다. 셀 click·터치 후 1~9/화면 숫자·Backspace/Delete/지우기/메모를 확인한다.
2. /tests/browser/interaction.html 에서 고정 입력 fixture를 연다. 기본 선택은 index2, 1행3열이다. 메모를 켜고 1을 한 번 입력하면 후보가 생기고 두 번째 입력하면 사라져야 한다. 재바인딩이 중복됐다면 토글이 취소되므로 이 동작을 확인한다.
3. 메모를 끄고 실제 숫자를 입력하면 해당 메모만 지워져야 한다. 값이 있는 셀의 메모 입력은 no-op다. 지우기는 값과 해당 메모 모두 제거한다.
4. 고정 단서 1행1열의 5를 선택하고 숫자·삭제·메모를 시도해 바뀌지 않는지 확인한다.
5. 1행3열에 5를 넣어 중복 !·경계·공용 오류 문구·셀 이름을 확인한다. 지우면 해당 충돌이 없어져야 한다.
6. 방향키로 모든 가장자리에서 래핑 없이 멈추는지 확인한다. Tab 진입점은 playing에서 하나이고 숫자 패드/메모 조작 뒤에도 선택과 포커스가 유지돼야 한다.
7. 같은 개발 페이지의 외부 텍스트·select에서 숫자·삭제·방향키를 사용한다. 게임 상태가 바뀌지 않고 기본 편집/선택이 동작해야 한다. Ctrl/Meta/Alt/Shift 조합·Tab·IME도 가로채지 않아야 한다.
8. “완료 직전 fixture”를 누르고 선택된 1행3열에 4를 입력한다. completed·완료 안내·입력 잠금·timer.stoppedAtMs·completionDialogOpen=true를 확인한다. 실제 timer 표시·dialog는 아직 없는 것이 정상이다.
9. “일반 입력 fixture”로 돌아와 다시 조작하고 “생성 실패 fixture”에서 오류 안내·빈 비활성 보드·비활성 도구를 확인한다. 앱에는 이런 테스트 버튼이 없다.
10. 320px·1280px에서 패드·메모·오류 안내·보드 넘침과 Console/Network를 확인한다. 실제 터치 기기 또는 터치 도구로 확인한 환경·결과를 별도로 기록한다.
11. 브라우저 이름·버전·viewport·검사 항목·실제 관찰을 기록하고 서버를 Ctrl+C로 종료한다.

## 다음 단계

필수 실제 입력·터치 검증과 04 리뷰가 남아 완료로 표시하지 않는다. 다음 대상은 동일한 tasks/004-user-interaction.md의 04 검증·코드 리뷰다.
이번 임시 서버 정리 결과: INPUT_004_SERVER_CLOSED 출력과 세션 exit 0을 확인했다. 장기 실행 서버를 남기지 않았다.

## 문서·경계 최종 확인

- Markdown 30개·내부 파일 링크 350개 확인, 깨진 링크 0개.
- 001~003 완료·004 차단됨·005 예정이 목록과 일치한다. 004의 필수 실제 UI/완료 검증과 REV-01은 미체크이며 리뷰는 미실행이다.
- 새 상태·이벤트·main·개발 스크립트의 node --check 통과. core·utils의 DOM/Node 전용 import와 앱의 fixture import가 없음을 확인했다.
- 마지막 전체 테스트 이후에는 문서만 수정했다. 상태 getState의 읽기 전용 계약과 미구현 timer/dialog 범위를 명시했다.
- 새 ADR·패키지·브랜치·커밋·원격 쓰기는 없다.

## 후속 04 검증·리뷰 — 2026-10-26 최종

위 03 이력 이후 키 입력 전 실제 포커스 셀 선택, 반복 unbind 소유권 보호, 초기 notes 계약을 수정했다.
상태/키/이벤트 경계18개가 통과했고 최신 전체는71개 중70통과·0실패·1skip이다.
브라우저 호출은 장시간 지연 후 연결 거부로 끝나 실제 click·touch·DOM 검증은 미실행이다. 이번 임시 서버의 종료 로그·exit0은 확인했다.
004는 차단됨이며 상세 재현·수정·검증·해제 절차는 [04 리뷰 기록](review-004.md)을 따른다.

> 007 전환 안내: 위 과거 기록의 .js 파일명은 당시 구현을 뜻한다. 소스 링크는 이동한 현재 .ts 파일을 가리키도록 갱신했다. 브라우저 출력은 계속 .js다.
