# 002 엔진 구현·검증 기록 — 03 당시 이력

- 날짜: 2026-10-23
- 대상: [002 DOM 독립 스도쿠 엔진](../tasks/002-sudoku-engine.md)
- 기준: [설계 3~6·11~12절](plans/sudoku-mvp.md), [D-002](decisions/002-unique-bounded-generation.md), [리뷰 기준](review-checklist.md)
- 상태: 03 구현·자동 검증 수행. 작업은 진행 중이며 04 코드 리뷰·최종 완료 판단은 미실행이다.
- 선행: 001의 완료 기록·사용자 검증과 현재 서버·package.json·테스트 코드를 확인했다. 독립 Git 저장소는 없어 브랜치 생성·기본 브랜치 비교를 생략했고 사용자 002 실행 지시에 따라 현재 폴더에서 구현했다.
- 실제 브랜치: 없음. 예정 이름은 feat/task-002-sudoku-engine이다. 커밋·푸시·PR 생성·병합은 수행하지 않았다.

## 구현 범위

| 파일 | 동작 |
|---|---|
| [board.js](../src/core/board.ts) | dense Board 형식, 0 제외 모든 충돌, 유효성, 원본 단서 보존 완료 판정 |
| [solver.js](../src/core/solver.ts) | MRV·비트 마스크 백트래킹, Promise 풀이·해답 수, 입력 복사 |
| [generator.js](../src/core/generator.ts) | 완성 보드·Fisher–Yates 제거, 유일해·목표 빈칸, 전체/개별 제한 |
| [search-runtime.js](../src/utils/search-runtime.ts) | 범위·시계·난수 검증, 노드 누계, 공유 전체 예산, 다음 task 양보 |
| [boards.js](../tests/fixtures/boards.js) | 계획 fixture와 seed 난수 |
| [board 테스트](../tests/board.test.js) | 형식·충돌 전체·완료·단서 |
| [solver 테스트](../tests/solver.test.js) | 정상·무해답·복수해·충돌·완성·불완전 탐색·취소·예산 |
| [generator 테스트](../tests/generator.test.js) | seed별 생성·독립 재검증·실패·취소·누계·우선순위 |

게임 store·DOM 보드·입력·타이머·로딩/실패 UI는 구현하지 않았다. 준비 화면과 main.js는 그대로다.
외부 의존성·Node 전용 core import가 없고 Native ESM 모듈로 구현했다.

## 계약 적용과 구현 선택

- Board는 길이 81의 실제 Array이며 빈 슬롯·NaN·문자열·소수·0~9 밖의 값은 TypeError다. 옵션·난수·단조 시계 위반은 RangeError다.
- 입력은 복사하며 DFS의 최소 후보 수 동률은 셀 인덱스 순이다. 주입 rng만 후보 순서를 바꾼다.
- countSolutions의 complete/count=1만 유일해다. 실제 첫 해답 노드 수에서 제한한 복수해 fixture가 budget-exceeded/count=1임을 검증했다.
- DFS 진입을 노드 하나로 센다. 기본 128노드마다 setTimeout 기반 task로 양보하며, 생성은 제거 사이에도 양보한다. 단순 Promise.resolve를 기본 양보로 사용하지 않는다.
- generator의 전체 노드·시간 컨텍스트는 별도 내부 인수로 전달한다. public options의 sharedBudget은 거부하며 solver의 runSearch export는 모듈 간 내부 연결용이다.
- 개별 탐색 예산 초과는 숫자 복구 또는 다음 시도다. 전체 노드·시간 초과는 전체 실패며 취소 → 전체 시간 → 전체 노드 → 시도 제한 순으로 판단한다.
- 성공은 마지막 허용 제거의 완전 탐색 유일해 증거와 단서·빈칸 수를 확인한다. 실패에 puzzle을 넣지 않고 성공에 solution을 넣지 않는다.
- D-002와 초기 예산·API 계약을 유지했다. MRV 비트 마스크, 런타임 분리, seed용 LCG는 범위 내 구현 선택이며 새 ADR을 발급하지 않았다.

## fixture 확인

- uniquePuzzle은 계획의 uniqueSolution과 같은 해답으로 solved, countSolutions는 complete/count=1.
- conflictingPuzzle은 invalid/count=0이다. 행·열·박스 충돌의 양쪽과 3개 이상 중복 인덱스도 별도 확인했다.
- multipleSolutions(빈 보드)는 limit-reached/count=2.
- 제안된 unsolvablePuzzle(uniquePuzzle index 2를 1로 변경)은 초기 충돌 없음, solved 결과 unsolvable, countSolutions complete/count=0이다. 후보를 교체하지 않고 고정 fixture로 확정했다.
- 1·2 전체 치환 완성 보드는 규칙상 유효해도 단서가 달라 isComplete=false다.
- frozen 입력, 독립 결과 배열, 동일 seed 재현, 동시 풀이의 상태 격리를 검증했다.

## 실제 실행과 결과

실행 환경은 Windows PowerShell, 기존 Node v24.22.1·npm CLI 8.19.4다. 시스템 Node 설치·전역 PATH는 변경하지 않았다.

프로젝트 루트에서:

    $nodeDirectory = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
    $nodeExecutable = Join-Path $nodeDirectory 'node.exe'
    $npmEntry = Join-Path $env:ProgramFiles 'nodejs\node_modules\npm\bin\npm-cli.js'
    $env:Path = "$nodeDirectory;$env:Path"
    & $nodeExecutable $npmEntry test

- 최초 엔진 단독 검사: node --test tests/board.test.js tests/solver.test.js tests/generator.test.js → 19 통과·0 실패.
- 옵션 null·난이도 형식 검증과 추가 실패 경로를 보강한 뒤 전체 npm test → **40개 중 39 통과·0 실패·1 skip**, exit 0, 약 7.53초.
- 최종 엔진 22개 모두 통과, 기존 서버 18개 중 17 통과·1 skip.
- skip은 기존 서버의 Windows junction 생성 EPERM이다. 새 엔진 검사는 skip이 없다. 001의 사용자 확인 18개 통과 이력은 이번 도구 결과로 덮어쓰지 않는다.
- 실제 CLI 자식 시작·HTTP·정상 종료 회귀도 통과했다. 이번에 장기 실행 서버는 시작하지 않았다.
- 제한·취소 테스트는 작은 예산·고정 시계·AbortController·양보 주입으로 재현한다. 기본 task 양보가 실제 timer의 취소를 처리하는 검사도 있다.
- 전체 검사에서 전역 누계가 여러 탐색에 걸쳐 100노드에서 멈춤, 개별 1노드·시도 2회 실패, 개별 유일해 검사 제한 후 복구·다음 제거 성공, 전체 시간과 노드·시도 동시 소진 시 시간 우선도 확인했다.

## 기본 예산 seed 측정

전체 npm test의 마지막 실행에서 생성 기본 예산·기본 시계·기본 task 양보를 유지했다. 바꾼 옵션은 고정 seed rng뿐이다.
측정 수치는 이 Windows 도구 환경의 관찰값이며 기기 전반의 성능 보장이 아니다.

| 난이도 | seed | 결과 | 시도 | 전체 노드 | 엔진 경과 ms |
|---|---|---|---|---|---|
| easy | 1 | success | 1 | 822 | 604.50 |
| easy | 42 | success | 1 | 791 | 628.24 |
| easy | 2026 | success | 1 | 752 | 604.34 |
| normal | 1 | success | 1 | 1237 | 825.67 |
| normal | 42 | success | 1 | 1307 | 778.54 |
| normal | 2026 | success | 1 | 1281 | 772.94 |
| hard | 1 | success | 1 | 1883 | 980.63 |
| hard | 42 | success | 1 | 1978 | 1064.99 |
| hard | 2026 | success | 1 | 1855 | 953.28 |

9/9 성공, 실패 seed 없음. 각 성공의 빈칸 수 35/45/50, 별도 solveBoard의 단서 일치, countSolutions complete/count=1을 재검증했다.
초기 전체 5초·1,000,000노드·8회와 개별 2초·100,000노드·128노드 양보 설정을 완화하지 않았다.

## 모듈 사용 예

Node 22 이상 프로젝트 루트에서 node --input-type=module을 실행한 뒤 아래 모듈을 호출하거나 후속 UI 모듈에서 같은 API를 import한다.

    import { generatePuzzle } from './src/core/generator.js';
    import { solveBoard, countSolutions } from './src/core/solver.js';
    const generated = await generatePuzzle('easy');
    if (generated.status === 'success') {
      const counted = await countSolutions(generated.puzzle);
      // 유일해 판정: counted.status === 'complete' && counted.count === 1
    }

생성 실패는 failed/reason, 취소는 aborted로 처리한다. 풀이 해답은 개발 검증용으로만 사용하며 게임 UI에 연결하지 않았다.

## 미실행·다음 조치

- 04 코드 리뷰·최종 완료 판단은 미실행이다. REV-01과 완료일을 채우지 않았다.
- 기존 서버 junction 검사는 이번 환경에서 skip이다. 04에서 이전 001 사용자 증거와 이번 서버 코드 무변경을 대조하고 필요하면 사용자 환경에서 전체 검사를 재실행한다.
- 엔진 단독 단계에는 실제 브라우저 UI 시연 의무가 없다. DOM·새 게임 중 반응성·취소 화면은 003~005 연계 후 확인하며 이번 결과로 통과를 주장하지 않는다.
- 독립 Git 저장소가 없어 실제 diff·브랜치·기본 브랜치 반영은 확인하지 않았다.
- 다음 요청 대상은 동일한 tasks/002-sudoku-engine.md의 04 검증·리뷰다.
## 문서·경계 최종 확인

- Markdown 24개·내부 파일 링크 222개 확인, 깨진 링크 0개.
- 001 완료, 002 진행 중, 003~005 예정과 목록이 일치한다.
- 002의 REV-01·ENG-05 미체크, 리뷰 미실행·완료일 미정을 확인했다.
- core·utils의 import가 상대 ESM 경로이며 Node 전용 import·document/window 사용이 없음을 확인했다.
- 외부 패키지 선언이 없다. 이번 새 파일은 생성 전 경로를 확인하고 CreateNew로 작성했다.
- 마지막 전체 검사 이후에는 문서만 갱신했다. 03에서 완료 처리하거나 새 ADR·커밋·PR을 만들지 않았다.

## 후속 04 리뷰·완료

위 내용은 03 당시 이력이다. 이후 옵션 상속 속성의 취소·시계·양보 누락을 수정했고 개별 시간 제한·독립 기준 풀이 검증을 보강했다.
최신 전체 검사는 43개 중 42 통과·0 실패·1 skip, 엔진 25개 모두 통과다. 기존 서버 코드는 무변경이므로 이번 17개 통과와 001의 링크 검사 사용자 증거를 함께 적용했다.
002는 완료이며 상세 수정·seed 재측정·증거 구분·완료 판단은 [04 리뷰 기록](review-002.md)을 따른다. 다음은 05 초안 준비다.

> 007 전환 안내: 위 과거 기록의 .js 파일명은 당시 구현을 뜻한다. 소스 링크는 이동한 현재 .ts 파일을 가리키도록 갱신했다. 브라우저 출력은 계속 .js다.
