# 스도쿠 MVP 설계와 데이터 계약

- 작성·갱신일: 2026-10-23 / 2026-10-26
- 단계: 01 설계 완료. 아래는 설계 계약이며 현재 구현·검증 상태는 각 작업 기록을 따른다. 001 환경 코드·검증의 현재 상태는 architecture.md와 001 기록에서 확인한다.
- 근거: [개발 지침](../../AGENTS.md), 사용자가 실행을 요청한 01 초기 설계 프롬프트.
- 현재 구현: [architecture.md](../../architecture.md). 환경 코드와 002의 DOM 독립 보드·풀이·생성 엔진이 추가됐다. 003의 보기 전용 보드·초기 생성 표시는 구현됐고 필수 브라우저 검증은 사용자 확인으로 충족했다. 004 상태·입력은 리뷰·사용자 확인 후 완료됐으며 005에서타이머·제어·완료 UI를 구현했고 04 리뷰·수정과 사용자 잔여 UI 확인 후005를 완료했다.
- 적용할 결정: [D-001](../decisions/001-native-esm-and-tooling.md), [D-002](../decisions/002-unique-bounded-generation.md), [D-003](../decisions/003-state-input-and-time.md). D-001의 환경 코드와 D-002의 엔진은 반영됐다. 003에서 D-002 초기 생성 표시·D-003 읽기 전용 상태→렌더를 반영했다. 004에서 store·Action·입력·완료 상태·시각 메타데이터를 반영했고 005에서 실제 시간·게임 제어 UI를 구현, 04 리뷰·수정·사용자 잔여 검증 후005 완료.

## 1. 범위와 단계별 결과

브라우저에서 9x9 스도쿠를 생성·표시하고 입력·메모·충돌 안내·새 게임·시간·완료 확인을 제공한다.
외부 라이브러리·번들러·게임 백엔드는 없다. Node.js 22 이상은 개발 서버와 내장 테스트에만 사용한다.

| 순서 | 작업 범위 | 선행 범위 | 단계별 시연 가능 결과 |
|---|---|---|---|
| A | 개발 환경 | 없음 | HTTP 정적 페이지와 ESM 로딩, 서버 테스트 |
| B | 순수 엔진 | A | DOM 없이 풀이·충돌·해답 수·생성 검증 |
| C | 보드 렌더링 | A, B | 실제 생성 퍼즐의 9x9 표시. 플레이 입력은 아직 없음 |
| D | 입력·게임 상태 | B, C | 단서 보호·입력·삭제·메모·충돌·완료 상태 전이. 타이머·축하 UI는 후속 |
| E | 게임 제어·시간·완료 UI | B, C, D | 난이도·새 게임·실패·타이머·완료 대화상자 통합 |

02에서 실제 작업 ID·브랜치를 명세했다. A~E는 설계상의 구분이며 아래 실제 작업에 연결된다. 001 환경 코드는 추가됐으나 브랜치는 아직 없다. 002 엔진은 03 구현과 04 코드 리뷰·수정·재검증을 완료했다. 003 표시 UI는 리뷰·사용자 브라우저 확인 후 완료됐으며 004 상태·입력은 리뷰·사용자 확인 후 완료, 005 게임 제어 UI는04 리뷰·수정·사용자 잔여 검증 후 완료됐다.

| 설계 구분 | 실제 작업 | 직접 선행 |
|---|---|---|
| A | [001 환경 준비](../../tasks/001-development-environment.md) | 없음 |
| B | [002 엔진](../../tasks/002-sudoku-engine.md) | 001 |
| C | [003 보드](../../tasks/003-board-rendering.md) | 001, 002 |
| D | [004 입력·상태](../../tasks/004-user-interaction.md) | 002, 003 |
| E | [005 게임 제어·타이머](../../tasks/005-game-controls-timer.md) | 002, 003, 004 |
일시정지, 힌트, 실행 취소, 저장·복구, 이웃 셀 메모 자동 정리는 제외한다.

## 2. 예정 파일과 책임

이 표는 목표 책임이다. index.html·main.js·CSS·서버·package.json은 001에서 최소 환경용으로 생성됐고 003에서 보드 표시·초기 생성 연결을 추가했지만 004에서 정식 상태·입력을 추가했으며 게임 제어 UI는005에서03 구현했으며 04 리뷰·수정과 사용자 잔여 검증 후005를 완료했다. 세부 현재 구조는 architecture.md를 따른다.

| 예정 경로 | 책임 |
|---|---|
| index.html | 제목·설명·보드 마운트·컨트롤·상태 안내·완료 dialog의 시맨틱 구조 |
| styles/main.css | Grid 보드·3x3 경계·단서·메모·충돌·선택·포커스·반응형 |
| src/main.js | DOM 연결, store·renderer·events 초기화, 생성·타이머 효과 조정과 정리 |
| src/core/board.js | 배열 검증, 충돌 인덱스, 유효성·완료 판정 |
| src/core/solver.js | 풀이와 해답 개수 탐색, 중단·예산·입력 불변성 |
| src/core/generator.js | 완성 보드 생성과 단서 제거, 유일해 확인, 시도·전체 예산 |
| src/core/game-state.js | 초기 상태·순수 상태 전이·구독 store. DOM·실제 시계 없음 |
| src/ui/board.js | 상태를 읽어 셀·메모·접근성 속성을 렌더링 |
| src/ui/events.js | 보드·키보드·화면 숫자 패드 이벤트를 Action으로 변환 |
| src/ui/controls.js | 로딩·실패·난이도·타이머·완료 dialog 표시와 포커스 관리 |
| src/utils/search-runtime.js | 주입 가능한 난수·단조 시계·양보 함수의 기본 구현과 예산 헬퍼 |
| src/utils/time.js | 주입받은 시각으로 경과 초 계산·표시 문자열 생성 |
| scripts/serve.mjs | 루프백 정적 HTTP 제공, MIME·파일 범위·404·오류·종료 처리 |
| tests/*.test.js | Node 내장 runner로 엔진·상태·시간·서버 테스트 |
| tests/fixtures/boards.js | 고정 보드·해답·복수 해답·해답 없음 fixture |
| tests/browser/board.html | 고정 fixture 렌더링·입력·접근성·완료 확인용 개발 페이지 |
| package.json | type: module, start와 test scripts. 외부 dependencies 없음 |

의존 방향: UI → store/순수 core 계약, generator → solver → board, main → UI·core·runtime.
core는 DOM·window·document·UI 파일을 import하지 않는다. Node 전용 모듈은 scripts와 tests에만 둔다.
순수 상태 전이 안에서 난수·시계 읽기·DOM·Promise 생성·타이머 시작을 하지 않는다.

## 3. 공통 데이터

| 이름 | 계약 |
|---|---|
| Board | Array<number>, 길이 정확히 81, 정수 0~9. 행 우선, 0은 빈칸 |
| index | 정수 0~80. row=floor(index/9), col=index%9, box=floor(row/3)*3+floor(col/3) |
| puzzle | 생성 당시 단서 보드. 게임 중 수정하지 않고 상태 진입 때 복사 |
| values | 플레이어 보드. puzzle과 다른 배열 참조 |
| 고정 셀 | puzzle[index] !== 0으로 파생. 별도 변경 가능한 mask를 원본으로 두지 않음 |
| notes | 길이 81의 Array<Set<number>>, 집합은 1~9만 포함하고 셀 사이 참조를 공유하지 않음 |
| difficulty | 'easy' / 'normal' / 'hard' |
| game status | 'idle' / 'generating' / 'playing' / 'completed' / 'error' |

배열·값 형식 위반은 공개 core API에서 TypeError로 통일한다. index·limit·옵션 범위 위반은 RangeError다.
숫자 문자열·NaN·소수는 자동 변환하지 않는다. 행·열·박스의 숫자 충돌은 형식 오류와 구분해 결과로 반환한다.
API 호출자가 제공한 보드·상태·Set은 읽기 전용으로 취급하며 변경된 가지를 복사한다.

## 4. 보드 API — src/core/board.js

아래 시그니처는 JavaScript 계약 표기이며 구현 코드는 아니다.

| API | 결과와 처리 |
|---|---|
| assertBoard(board): void | 배열·길이·정수·범위 확인. 위반은 TypeError |
| findConflicts(board): Set<number> | 행·열·박스에서 중복된 모든 셀 인덱스. 0 제외, 입력 변경 없음 |
| isValidBoard(board): boolean | 형식이 맞고 충돌이 없으면 true. 빈칸은 허용하며 풀 수 있음을 보장하지 않음 |
| isComplete(board, puzzle): boolean | 두 Board 형식 확인 후, board에 0 없음·충돌 없음·puzzle의 모든 단서 일치를 모두 요구 |

isComplete는 모순된 puzzle 자체도 false로 처리한다. 입력 형식 위반은 TypeError다.
findConflicts의 결과는 같은 숫자의 충돌 양쪽·여러 셀을 모두 포함한다.
사용자 입력의 오류 표시는 이 결과만 사용하며 저장된 해답과 비교하지 않는다.

## 5. 탐색 API — src/core/solver.js

### 공통 SearchOptions

- maxNodes: 기본 100,000. 양의 정수. DFS 상태 한 번 진입을 노드 1개로 센다.
- maxElapsedMs: 기본 2,000. 양의 유한 수. 전체 호출의 실제 경과 시간 상한.
- yieldEveryNodes: 기본 128. 양의 정수. 노드 수마다 검사·양보하고 각 탐색 시작·종료에도 검사한다.
- signal: 선택 AbortSignal.
- now: 기본 performance.now에 대응하는 단조 시계 함수. 테스트에서 주입 가능.
- yieldControl: 기본 setTimeout 기반 다음 task 양보 함수로 Promise<void> 반환. 테스트에서 주입 가능.
- rng: 선택 함수, 호출마다 0 이상 1 미만 유한 수 반환. 지정한 경우 후보 순서를 재현 가능하게 섞는다. 값 위반은 RangeError.
- 내부 sharedBudget: generator가 전달하는 전체 예산 객체. 공개 옵션으로 받지 않고 내부 탐색 컨텍스트로 공유한다.

now는 호출 중 역행하면 안 된다. Node·브라우저 모두 같은 의미로 사용하며 테스트는 증가하는 가짜 시계를 쓴다.
입력 배열은 작업용으로 복사한다. 최소 후보 수 셀을 우선하고 동률은 인덱스 순으로 정한다.

### solveBoard(board, options = {}): Promise<SolveResult>

| status | board | 의미 |
|---|---|---|
| solved | 새 Board | 조건을 만족하는 첫 해답. 유일해 여부는 보장하지 않음 |
| unsolvable | null | 탐색을 완전히 마쳤고 해답 없음 |
| invalid | null | 형식은 맞지만 입력 단서에 행·열·박스 충돌이 있음 |
| budget-exceeded | null | 노드 또는 시간 예산 때문에 해답 여부를 확정 못함 |
| aborted | null | AbortSignal로 중단 |

모든 결과에 stats: {nodes, elapsedMs}를 포함한다. 이미 완성된 유효 보드는 복사본으로 solved다.
형식·옵션 위반은 각각 TypeError·RangeError로 reject한다. 예상 가능한 탐색 실패는 status로 처리한다.

### countSolutions(board, options = {}): Promise<CountResult>

options에 limit을 추가하며 MVP 기본·허용값은 2다. 다른 값은 RangeError다.
CountResult = {status, count, stats}; count는 0~2 범위에서 실제 발견한 수다.

| status | 의미와 유일해 판단 |
|---|---|
| complete | 전체 탐색 완료. count=0은 해답 없음, count=1만 유일해의 증거 |
| limit-reached | 2개 발견해 조기 종료. count=2이며 복수 해답이 확정됨 |
| invalid | 충돌 단서. count=0이나 일반적인 해답 없음 탐색 결과와 구분 |
| budget-exceeded | 탐색 미완료. count가 0 또는 1이어도 해답 없음·유일해로 해석 금지 |
| aborted | 취소. 발견 수와 무관하게 유일해 증거로 사용 금지 |

2개를 발견하면 limit-reached로 종료한다. 이미 완성된 유효 보드는 complete, count=1이다.

## 6. 생성 API와 예산 — src/core/generator.js

### generatePuzzle(difficulty, options = {}): Promise<GenerationResult>

성공은 {status:'success', puzzle:Board, difficulty, blankCount, stats}다.
실패는 {status:'failed', reason, stats} 또는 {status:'aborted', stats}다.
reason은 'attempts-exhausted' / 'node-budget' / 'time-budget'다. puzzle은 실패 결과에 포함하지 않는다.
부적절한 difficulty·옵션·난수·보드 형식은 프로그래밍 오류로 reject한다.
options에는 위 예산 외에 rng(기본 Math.random), signal, now, yieldControl을 주입할 수 있다.
stats는 {attempts, totalNodes, elapsedMs}이며 실제 수행한 누계를 반환한다.
해답 보드는 UI 상태나 생성 성공 결과에 전달하지 않는다. 테스트는 solveBoard로 별도 확인한다.

| difficulty | 화면 이름 | 목표 빈칸 | 단서 수 |
|---|---|---|---|
| easy | 쉬움 | 35 | 46 |
| normal | 보통 | 45 | 36 |
| hard | 어려움 | 50 | 31 |

빈칸 기반 간이 난이도다. 논리 풀이 단계나 개인 체감 난이도 등급을 보장하지 않는다.
목표 빈칸을 정확히 채우지 못하면 더 쉬운 퍼즐을 성공으로 반환하지 않는다.

### 알고리즘

1. 빈 보드에서 난수 후보 순서로 완성 해답을 만든다. 호출자는 seed 기반 rng를 주입할 수 있다.
2. 셀 인덱스를 Fisher–Yates 방식으로 섞어 순서대로 숫자 제거를 시도한다. 대칭 제거는 MVP 요구사항이 아니다.
3. 제거마다 countSolutions를 호출한다. complete와 count=1일 때만 제거를 유지한다.
4. 복수 해답·탐색 불완료는 숫자를 복구한다. 전역 예산 소진·취소면 호출 전체를 종료한다.
5. 한 완성 보드에서 목표에 도달하지 못하면 다음 시도를 한다. 성공 직전 단서·빈칸·유일해 증거를 확인한다.
6. 후보 보드·해답·탐색 중간 상태는 요청마다 독립적이며 UI 상태를 변경하지 않는다.

### 초기 예산

| 옵션 | 초기값 | 범위와 의미 |
|---|---|---|
| maxAttempts | 8 | 완성 보드 생성부터 다시 시도하는 최대 횟수 |
| maxTotalNodes | 1,000,000 | 한 generatePuzzle 호출 전체 DFS 노드 누계 |
| maxNodesPerSearch | 100,000 | 개별 완성·유일해 탐색 노드 제한 |
| maxElapsedMs | 5,000 | 양보 대기를 포함한 생성 호출 전체 경과 시간 |
| yieldEveryNodes | 128 | 노드 누계 기반 검사·양보 간격 |

한도는 양의 수이고 횟수·노드는 정수다. 테스트는 작은 한도를 주입해 실패 경로를 재현한다.
기본 탐색의 2초 제한도 유지하되 생성 전체 남은 시간보다 길어지지 않도록 min으로 제한한다.
개별 탐색의 예산 소진은 해당 제거를 되돌리거나 다음 시도로 이동한다. 전체 예산 소진은 즉시 전체 실패다.
취소 → 전체 시간 → 전체 노드 → 시도 횟수 순서로 동시에 관찰된 종료 이유의 우선순위를 정한다.

숫자 제거 사이와 128노드마다 now·signal을 검사하고 다음 task로 양보한다. Promise.resolve만으로 양보를 대체하지 않는다.
시간 한도는 검사 시점에서 적용되며 다음 검사까지의 계산·스케줄링 지연만큼 초과할 수 있다. 모든 기기에서 정확한 밀리초를 보장하지 않는다.
초기 구현은 협력적 양보 방식이다. Web Worker 추가는 반응성 측정이 요구를 충족하지 못할 때 재검토한다.
초기 예산은 유지했으며 002의 고정 seed 9건에서 성공을 측정했다. 관찰값·환경은 [002 구현 기록](../engine-002.md)에 있다. 이 결과가 모든 기기의 성능을 보장하지는 않는다. 완화가 필요하면 실제 seed·노드·시간·기기 근거를 작업에 남기고 계약과 테스트를 같이 갱신한다.
유일해나 목표 빈칸 조건을 조용히 완화하는 방식으로 성능 문제를 해결하지 않는다.

실패 UI: '퍼즐을 만들지 못했습니다. 다시 시도해 주세요.'와 새 게임 재시도 제공. 탐색 통계는 개발 검증용이며 기본 화면에 노출하지 않는다.

## 7. GameState와 store

```text
GameState = {
  status: 'idle' | 'generating' | 'playing' | 'completed' | 'error',
  puzzle: Board | null,
  values: Board | null,
  notes: Array<Set<number>>,
  selectedIndex: number | null,
  noteMode: boolean,
  selectedDifficulty: 'easy' | 'normal' | 'hard',
  activeDifficulty: 'easy' | 'normal' | 'hard' | null,
  requestId: number,
  timer: { startedAtMs: number | null, stoppedAtMs: number | null },
  completionDialogOpen: boolean,
  error: { code: string, message: string } | null
}
```

초기값은 idle, puzzle·values·selectedIndex·activeDifficulty는 null, 빈 독립 Set 81개,
selectedDifficulty는 easy, requestId=0, noteMode와 dialog=false, 시간·error=null이다.
activeDifficulty는 생성 중에는 요청의 난이도, playing·completed에는 그 퍼즐의 난이도다. 드롭다운의 selectedDifficulty와 독립적이다.
requestId는 음이 아닌 안전한 정수이며 새 요청마다 증가한다. 오류·취소 결과는 해당 요청 ID로 구분한다.
충돌 인덱스·고정 셀·경과 초는 원본 상태가 아니라 현재 상태에서 파생한다.
시간은 performance.now 계열의 세션 내 단조 값이며 날짜나 저장용 timestamp가 아니다.

- createInitialState(): GameState — 매번 새로운 배열·Set을 만든다.
- reduceGame(state, action): GameState — 순수 함수. 무효 사용자 동작은 같은 상태를 반환한다.
- createGameStore(initialState): {getState, dispatch, subscribe} — listener는 상태가 바뀐 뒤 호출하고 unsubscribe 함수를 제공한다.
- getState의 반환값은 읽기 전용이다. reducer는 이전 상태·배열·Set을 변경하지 않는다.
- 알 수 없는 action type 또는 잘못된 payload 형식은 TypeError/RangeError다. 단서·현재 status에 따른 금지는 사용자 no-op다.
- selectedIndex는 null 또는 범위 내 정수다. Action index가 범위를 벗어나면 RangeError다.

## 8. Action 계약과 효과

| Action | payload | 적용과 결과 |
|---|---|---|
| SET_DIFFICULTY | difficulty | 드롭다운 선택만 갱신. 현재 퍼즐·시간은 변경 안 함 |
| NEW_GAME_REQUESTED | requestId, difficulty | 더 큰 requestId만 수락. generating, activeDifficulty=difficulty, 보드 null, notes·선택·메모·시간·오류·dialog 초기화 |
| GENERATION_SUCCEEDED | requestId, puzzle, difficulty, nowMs | 현재 요청 ID·activeDifficulty와 일치하고 generating이면 보드 복사·playing·타이머 시작, 첫 편집 셀 선택 |
| GENERATION_FAILED | requestId, code, message | 현재 요청 ID와 일치하고 generating이면 error 상태. 보드 null, 타이머 없음 |
| SELECT_CELL | index | playing에서 선택 변경. 고정 셀도 선택 가능 |
| MOVE_SELECTION | direction: up/down/left/right | playing에서 좌표 한 칸 이동, 경계에서 그대로. 선택이 null이면 첫 편집 셀 선택 |
| ENTER_DIGIT | digit: 1~9 | playing·편집 셀에서 숫자 입력 또는 메모 토글. 실제 값 입력 시 해당 메모 삭제 |
| CLEAR_CELL | 없음 | playing·편집 셀에서 값과 해당 셀 메모 모두 삭제 |
| TOGGLE_NOTE_MODE | 없음 | playing에서 noteMode 변경. 값이 있는 셀에서는 메모 입력만 no-op |
| GAME_COMPLETED | nowMs | playing이고 isComplete가 true일 때만 completed·시간 정지·dialog 열기 |
| CLOSE_COMPLETION_DIALOG | 없음 | completed에서 dialog 닫기. 퍼즐은 읽기 전용으로 남음 |

noteMode에서 ENTER_DIGIT은 현재 값이 0인 편집 셀에만 집합 토글을 적용한다.
방향키는 고정 셀을 건너뛰지 않으며 보드 경계에서 래핑하지 않는다.
사용자 숫자·삭제 action은 완료 후 no-op다. 초기 생성 성공 시 puzzle의 형식·충돌·난이도·빈칸 수를 검증한다.
유일해 증명은 엔진 계약의 책임이며 reducer 안에서 비동기 탐색하지 않는다.

main의 효과 순서:
1. 새 게임 요청 시 기존 AbortController를 abort하고 이전 tick을 정리한 후 증가한 requestId로 NEW_GAME_REQUESTED를 dispatch.
2. generatePuzzle을 호출하고 현재 요청의 성공만 적용한다. abort 결과는 실패 화면으로 만들지 않는다.
3. 오래된 성공·실패는 무시한다. 예상하지 못한 엔진 reject는 console에 개발 근거를 남기고 사용자에게 일반 실패 안내.
4. 숫자 입력 후 상태를 확인해 완성이면 주입 시계로 GAME_COMPLETED를 dispatch. reducer도 완성을 재검증한다.
5. playing 동안 하나의 interval만 유지하고 표시 갱신을 요청한다. 상태 reducer에 tick을 누적하지 않는다.
6. 재시작·완료·페이지 정리 시 interval, listener, 진행 중 생성을 정리한다.

새 게임 버튼은 generating에서도 재요청할 수 있어야 한다. 보드·숫자 입력은 잠그고 이전 요청은 취소한다.
상태를 초기화해 이전 퍼즐은 제거한다. 생성 실패 후에는 재시도 화면을 표시하고 이전 퍼즐로 되돌리지 않는다.

## 9. UI·접근성 계약

- renderBoard(root, state): void — 81개 셀 노드를 유지하며 내용·속성만 갱신한다. 노드 재생성으로 포커스를 잃지 않는다.
- bindInput(root, dispatch): () => void — 이벤트 등록은 한 번, 반환 함수로 정리한다. 실제 폼 요소 키 입력은 가로채지 않는다.
- 셀은 row·column을 포함한 접근성 이름을 가진 button으로 제공한다. 별도 ARIA grid 역할은 불완전하게 추가하지 않는다.
- playing 중 한 셀만 tabIndex=0인 roving tabindex를 사용하고 방향키 이동과 실제 DOM 포커스를 맞춘다.
- 각 셀의 단서·입력값·메모·충돌 여부를 이름·설명으로 전달한다. 충돌은 색상과 함께 경계·아이콘·공용 오류 안내로 표현한다.
- 숫자 패드·삭제·메모 버튼은 터치·키보드로 사용 가능하며 선택 셀을 유지한다.
- 3x3 경계는 굵은 선, 셀은 정사각형. 320px 폭에서 보드·컨트롤에 가로 스크롤이 발생하지 않아야 한다.
- 완료 UI는 native dialog와 접근성 제목을 사용한다. 열 때 닫기 버튼으로 포커스, Escape·닫기 버튼 지원.
- dialog를 닫으면 보드가 읽기 전용인 completed 상태이므로 새 게임 버튼으로 포커스를 복귀한다.
- 로딩·실패는 상태 안내 영역으로 전달하고 타이머 매초 갱신을 매번 음성 알림으로 읽지 않는다.
- C 단계는 표시 중심이므로 고정 fixture의 포커스·셀 이름까지 검증하고 실제 입력·키보드 이동은 D 단계에서 구현한다.

## 10. 시간 계약 — src/utils/time.js

- getElapsedSeconds(timer, nowMs): number — startedAtMs가 null이면 0, 종료 시각이 있으면 그 값을 사용.
- 결과는 floor(max(0, (effectiveEnd-startedAtMs)/1000)). nowMs와 저장 시각은 유한 수이며 역행하지 않는다.
- formatElapsed(seconds): string — 0 이상 정수를 mm:ss로 표시. 분은 99를 넘어도 자르지 않는다.
- 표시 주기는 250ms. 정확도는 interval 호출 횟수가 아닌 시각 차이로 결정된다.
- 탭이 숨겨진 시간은 포함하고 다시 보이면 실제 경과 초로 즉시 갱신한다.
- OS 절전·재시작·페이지 새로고침을 넘는 시간 보존은 MVP 범위 밖이다.
- 시계·interval 조정은 main에서 수행하고 시간 계산은 순수 함수로 테스트한다.

## 11. fixture와 단계별 연결

B 단계에서 tests/fixtures/boards.js에 아래 고정 데이터를 만든다. 이 설계 단계에서는 실행 파일을 만들지 않는다.

- uniquePuzzle: 아래 9행 문자열을 행 우선 숫자 배열로 변환. 0은 빈칸이다.
- uniqueSolution: 아래 해답. B에서 단서 일치·유효성·해답 수를 실제 검증한다. 002에서 단서 일치·해답·complete/count=1을 실제 검증했다.

```text
uniquePuzzle:
530070000
600195000
098000060
800060003
400803001
700020006
060000280
000419005
000080079

uniqueSolution:
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286179
```

- conflictingPuzzle: uniquePuzzle의 index=2를 5로 바꾼 복사본. 첫 행의 5 충돌 양쪽을 확인한다.
- multipleSolutions: 0으로 채운 81셀. limit=2 탐색은 복수 해답을 발견하면 종료한다.
- unsolvablePuzzle: uniquePuzzle의 index=2를 1로 바꾼 복사본을 초기 후보로 삼는다.
  B에서 행·열·박스 충돌 없음과 countSolutions complete/count=0을 실제 확인한 후 fixture로 확정한다.
  조건을 만족하지 않으면 다른 후보를 실제 검증해 고정하고 그 근거를 작업 문서에 남긴다.
- completedWithChangedClue: uniqueSolution 전체의 숫자 1과 2를 서로 치환한 복사본. 완성 보드의 행·열·박스 유효성은 유지하지만 초기 단서는 달라지므로 isComplete는 false여야 한다. 규칙 위반과 별개로 단서 불일치를 검증한다.

C는 fixture만으로 renderBoard를 검증하되 src/main.js의 초기 생성 흐름에서는 실제 generatePuzzle 성공을 연결한다.
D는 테스트 store에 고정 puzzle을 넣어 입력·완료 상태를 검증한다. E는 개발용 브라우저 페이지의 near-complete fixture로 dialog·타이머를 검증한다.
테스트 fixture는 개발 페이지에서만 import하며 사용자용 정답 공개·테스트 버튼을 기본 게임 UI에 넣지 않는다.

## 12. 검증 계획과 완료 조건

| 범위 | 필수 자동 확인 | 필수 실제 브라우저 확인 |
|---|---|---|
| A 환경 | 정적 파일·MIME·404·경로 이탈 요청·서버 종료 | HTTP 페이지와 ESM 로딩, 콘솔 오류 없음 |
| B 엔진 | 형식 오류·충돌 전체 인덱스·풀이·무해답·복수해·입력 불변·난수 재현·3난이도 성공 또는 명시적 제한 실패·취소 | 엔진 단독이면 UI 시연 의무 없음 |
| C 보드 | 기존 엔진 회귀·fixture 데이터 검증 | 81셀·3x3 선·단서 구분·셀 이름·포커스·320px·일반 데스크톱 |
| D 입력 | reducer 전이·단서 보호·메모·충돌·완료 판정·배열/Set 불변 | 클릭·터치·방향키 경계·삭제·숫자 패드·외부 폼·포커스 |
| E 제어 | requestId로 오래된 응답 무시·시간 계산·완료 조건·실패/취소 | 새 게임 반복·생성 잠금·실패 재시도·탭 비활성·timer/dialog·초점 복귀 |

생성 검증은 난이도별 고정 seed 3개 이상으로 성공한 결과의 단서·빈칸·유일해를 확인하고,
각 난이도에서 기본 예산 안에 성공하는 seed를 최소 하나 확보한다. 한도 축소로 노드·시간·시도 실패와 취소를 별도 확인한다.
모든 seed가 성공할 필요는 없지만 성공률·실패 seed·소요 자원은 기록하고, 난이도가 기본 설정에서 전혀 성공하지 못하면 B 완료 불가다.
소요 시간의 엄격한 성능 합격 수치는 측정 환경 없이 임의로 주장하지 않는다. 실제 브라우저 생성 중 새 게임·상태 갱신 반응을 확인한다.

브라우저 수동 확인 기록에는 실제 브라우저·버전·화면 크기·절차·기대·관찰·결과를 남긴다.
터치 도구가 없으면 터치 항목은 미실행이다. 콘솔 함수 출력은 DOM·키보드·반응형 통과 근거가 아니다.

001에서 npm test는 node --test, npm start는 node scripts/serve.mjs로 구현했다. 각 prehook에서 Node 22 이상을 검사한다.
필수 테스트는 node:test와 node:assert/strict만 사용한다. DOM 라이브러리를 테스트용으로 임의 추가하지 않는다.
Node 22 이상 준비, npm·브라우저 도구 확인은 A에서 수행한다. 001에서 기존 Node 24.22.1로 자동 검증·npm start를 수행했다. 도구 브라우저는 연결 제약으로 미실행이었고 이후 사용자가 ESM·콘솔 오류 없음·서버 종료와 18개 테스트 통과를 확인해 001을 완료했다. 기본 Node는 16.20.2로 남아 있다.

## 13. 기록·조정·후속 작업

- 02에서 작업 ID 001~005를 발급하고 위 선행 관계를 실제 링크로 연결했다. 다음 ID 발급은 작업 목록과 파일을 다시 확인한다.
- 단계별 완료는 코드·필수 검증·리뷰·문서 갱신 기준이며 Git 병합·배포 완료와 다르다.
- 구현과 성능 측정으로 조정할 초기값은 예산·양보 간격·생성 세부 구현이다. 요구사항·유일해·외부 의존성 정책 변경은 별도 결정 검토가 필요하다.
- 기존 결정 대체는 실제 전환 후 상태·양방향 링크·목록을 갱신한다. 현재 D-001 환경과 D-002 엔진은 코드에 반영됐다. 003의 D-002 초기 표시·D-003 읽기 전용 렌더는 부분 반영됐고 004에서 상태·입력·시각 메타데이터를 추가했으며 005에서 실제 시간·게임 제어 UI를 구현, 04 리뷰·수정·사용자 잔여 검증 후005 완료 상태다.
- 현재 요구사항을 막는 미해결 설계 질문은 없다. 001 환경은 사용자 검증 후 완료됐고 002에서 fixture·seed별 엔진 성능을 확인했다. 실제 UI 반응성은 후속 연계에서 확인한다.
- 이번 단계의 완료는 문서 설계 완료다. 게임 구현·테스트 통과를 뜻하지 않는다.




## 06 인수 실행 연결 — 2026-10-26

설계 계약은 유지한다. 현재001~005 구현·개별 검증 완료 후 [전체 인수 기록](../acceptance/sudoku-mvp.md)을 작성했다.
실제 엔진→상태→완료·재시작·실패·취소 통합 검증 후, 도구의 직접 브라우저 관찰 실패는 이력으로 보존했다. 이후2026-10-26 사용자 전체92개 통과·안내 절차의 브라우저/터치·반응형·dialog/포커스·콘솔·종료 확인으로06 인수를 완료했다. 실제 배포와는 구분한다.

## 007 개발 도구 전환 — 2026-10-29

이 문서의 JS 경로·빌드 없음은 초기 MVP 설계 이력이다. 게임 동작 계약은 유지하고 현재 TS 원본·빌드·검증은 [007 기록](../typescript-007.md)과 [D-004](../decisions/004-typescript-toolchain.md)를 따른다. 상대 import의 .js는 컴파일 출력 주소다.
