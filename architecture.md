# 스도쿠 프로젝트 아키텍처

- 마지막 갱신: 2026-10-29
- 현재 단계: 001~009 완료. 009는 PR #3로main에 병합됐고Actions 배포·사용자 공개 스톡 표시/옵션 초기화 확인을 마쳤다. 010~013은 미구현이다.
- DOM 독립 엔진은 구현됐다. 003 보드 표시·엔진 초기 생성 연결을 구현했다. 004 상태 store·입력·완료 상태를 구현하고 04 리뷰·수정을 수행했다. 004 필수 UI·터치는 사용자 확인으로 충족했고 005 게임 제어·시간 표시·dialog를 구현했으며 04 리뷰·수정과 사용자 잔여 검증 후005를 완료했다. 환경 검증은 [001 기록](docs/review-001.md), 엔진 구현·측정은 [002 기록](docs/engine-002.md)을 따른다.

## 현재 코드와 책임

| 파일 | 실제 구현 |
|---|---|
| [package.json](package.json) | Native ESM, Node >=22, TypeScript 7.0.2 개발 의존성·타입/빌드/prestart/pretest. 게임 런타임 의존성 없음 |
| [scripts/check-runtime.mjs](scripts/check-runtime.mjs) | 지원 Node 버전 검사. prehook과 CLI에서 사용 |
| [scripts/static-server.mjs](scripts/static-server.mjs) | createStaticServer·startServer·closeServer·parsePort, 정적 파일과 루트 경계 |
| [scripts/serve.mjs](scripts/serve.mjs) | CLI·실제 주소/PID·PORT·중복 종료 방지·시작 후 오류 정리·소유 부모 IPC 종료 |
| [index.html](index.html) | 보드·입력 도구·난이도·새 게임·타이머·native dialog·상태와 ESM 진입점 |
| [src/main.ts](src/main.ts) | mountGame으로 생성 Action·store·입력·렌더·완료·정리·캐시 복귀 연결 |
| [styles/main.css](styles/main.css) | 9열 Grid·3x3 경계·단서/빈칸·포커스·반응형, 008 공통 숫자 서체·입력600/단서700 |
| [tests/server.test.js](tests/server.test.js) | 실제 HTTP·MIME·파일 경계·종료·포트·설정의 내장 테스트 |
| [.gitignore](.gitignore) | 향후 node_modules·coverage·로그·실제 환경값 제외 |
| [src/core/board.ts](src/core/board.ts) | 보드 형식·모든 충돌 인덱스·유효성·단서 보존 완료 판정 |
| [src/core/solver.ts](src/core/solver.ts) | MRV 백트래킹 풀이·최대 2개 해답 수 검사, 비동기 제한·취소 |
| [src/core/generator.ts](src/core/generator.ts) | 완성 보드 생성·유일해 제거·3난이도 목표·전체 예산 |
| [src/utils/search-runtime.ts](src/utils/search-runtime.ts) | 옵션·단조 시계·난수·task 양보·탐색 노드·전체 공유 예산 |
| [tests/fixtures/boards.js](tests/fixtures/boards.js) | 유일해·충돌·복수해·확정 무해답·단서 변경 fixture, seed 난수 |
| [tests/board.test.js](tests/board.test.js) | 형식·행/열/박스 충돌·완료·단서 검사 |
| [tests/solver.test.js](tests/solver.test.js) | 탐색 결과 구분·불변·불완전 count·취소·예산·재현성 |
| [tests/generator.test.js](tests/generator.test.js) | 난이도별 seed·유일해·빈칸·제한·취소·우선순위 검사 |

## HTTP 처리 흐름

1. npm start의 prestart가 Node runtime 검사·TypeScript 컴파일·.build 정적 준비를 마친 뒤 CLI를 시작한다.
2. CLI는 .build를 기본 루트로 사용하고 127.0.0.1의 지정 포트에 바인딩한다.
3. GET/HEAD 요청의 원시 경로를 먼저 검사하고 인코딩을 해제한다.
4. traversal·제어문자·Windows 경로·숨김 경로와 비공개 경로를 거부한다.
5. 지원 MIME을 확인하고 resolve와 realpath 기준으로 루트 경계·실제 공개 경로·숨김 경로를 검사한다.
6. 파일·헤더를 반환하며 HEAD에는 본문이 없다. 없는 파일은 404, 금지 경로는 403, 잘못된 입력은 400, 다른 메서드는 405다.
7. CLI 종료 신호는 서버·연결 정리를 호출한다. 테스트는 직접 closeServer를 호출해 닫는다.

공개 범위는 /index.html, /src/, /styles/, /tests/browser/, /tests/fixtures/의 지원 파일이다.
문서·package.json·스크립트·숨김 파일은 HTTP로 제공하지 않는다. tests/browser/board.html과 board-checks.js는 고정 fixture·실패 주입·DOM 보존 검증용이다. 앱에서는 fixture를 import하지 않는다.
서버는 로컬 개발용이며 게임 API나 사용자 데이터 저장 기능은 없다.

## 현재 실행·검증 환경

- 기본 PATH Node: v16.20.2. 시스템 설치·전역 PATH는 변경하지 않았다.
- 실행에 사용한 기존 Node: v24.22.1. 경로 선택과 npm CLI 8.19.4 호출 방법은 [README](README.md)에 있다.
- 도구 당시 npm test: 17 통과·0 실패·1 skip(junction 생성 EPERM). 사용자 최종 재검증 보고: 18 통과·0 실패·0 skip. 원시 로그는 미제공이며 사용자 확인으로 기록한다.
- CLI 회귀: 실제 시작·주소 출력·HTTP·소유 부모 IPC 종료·exit 0·포트 닫힘을 확인했다. 이전 CLI HOST 오류를 수정했다.
- 실제 HTTP 브라우저 검증: 사용자가 안내 절차의 ESM 초기화·콘솔 오류 없음을 확인했다. 도구 자체 브라우저 연결은 타임아웃이었다. 브라우저 이름·버전·스크린샷은 미제공이다.
- 터미널 안의 자동 HTTP 통과를 브라우저에서 JavaScript가 실행됐다는 근거로 사용하지 않는다.
- 04 재확인용 자동 종료 서버는 도구가 종료 로그·exit 0을 확인했다. 예전·신규 서버 종료 안내 절차는 이후 사용자 확인으로 기록했다. 격리 세션을 도구가 직접 종료·재관찰한 것은 아니다. 최신 근거는 04 리뷰 기록에 있다.
- Git: 프로젝트 루트에 독립 저장소·main 기본 브랜치를 준비했다. 현재 코드·문서를 최초 전체 스냅샷으로 저장하며 기능별 브랜치·원격·push·PR은 없다. 이전 단계의 Git 미실행은 당시 이력이다.

## 설계와 미구현 범위

[스도쿠 MVP 계획](docs/plans/sudoku-mvp.md)은 엔진·보드·상태·입력·시간·게임 제어의 목표 책임과 계약이다.
스도쿠 보드 검증·풀이·해답 개수·유일해 생성은 구현됐다. 보드 renderer·상태 store·입력·완료 상태와005의 타이머 표시·완료 dialog를 구현했다.
현재 src/main.js는 실제 생성 결과를 store의 요청·성공/실패 Action으로 연결하고 입력 후 완료 Action을 전이시킨다. 005에서 interval·시간 표시·반복 새 게임·dialog를 연결했다. 005의04 리뷰·수정은 수행했고 브라우저·터치는 사용자 최종 보고로 확인했다.

## 적용된 결정과 기록

- [D-001](docs/decisions/001-native-esm-and-tooling.md): 환경 코드의 Native ESM·HTTP·외부 의존성 없는 개발 도구에 반영. 코드 리뷰·사용자 잔여 검증으로 001 완료. 결정 채택과 게임 기능 구현 완료는 구분한다.
- [D-002](docs/decisions/002-unique-bounded-generation.md)는 002 엔진의 유일해·예산·양보·취소에 반영됐다. 04 리뷰는 완료됐고 003에서 초기 생성 표시를 연결했다. D-003의 store·Action·입력·완료 상태·시각 메타데이터를 반영했으며 005에서 실제 시간·게임 제어 UI도 구현했으며 실제 UI는 사용자 보고로 확인했고 [결정 목록](docs/decisions/README.md)과 설계에서 관리한다.
- [작업 목록](tasks/README.md): 001~005 완료·각05 초안 작성. 06 전체 인수 검증은 사용자 잔여 확인 후 완료.
- [개발 지침](AGENTS.md), [코드 리뷰 기준](docs/review-checklist.md), [001 커밋 메시지·PR 초안](docs/pr-drafts/task-001.md).
- [00 기록](docs/project-setup.md), [01 기록](docs/design-stage.md), [02 기록](docs/backlog-stage.md), [001 구현 기록](docs/environment-001.md), [04 리뷰 기록](docs/review-001.md).

후속 구현 때 실제 모듈·책임·흐름을 갱신하고, 계획·채택·구현·검증·작업 완료를 구분한다.



## 현재 엔진 호출 흐름

1. board.js는 dense Board 형식과 행·열·박스의 모든 충돌을 검사한다. 완료 판정은 유효한 완성과 원본 단서 일치를 함께 요구한다.
2. solveBoard/countSolutions는 입력을 복사하고 행·열·박스 비트 마스크와 최소 후보 수(MRV)를 사용한다. 동률은 인덱스 순이며 주입 rng가 후보 순서만 섞는다.
3. search-runtime은 DFS 상태 진입을 노드 하나로 세고 시작·진입·종료와 task 양보 후 취소·시간을 확인한다. 기본 128노드마다 setTimeout 기반 다음 task로 양보한다.
4. generator는 완성 보드를 만든 뒤 섞인 셀 제거마다 complete/count=1만 유지한다. 개별 제한·복수해는 복구하며 전체 노드·시간 예산은 탐색 간 공유한다.
5. 제거 사이에도 task로 양보한다. 종료 우선순위는 취소 → 전체 시간 → 전체 노드 → 시도 제한이다. 불완전 count=1은 유일해 증거가 아니다.
6. 성공은 puzzle·difficulty·blankCount·stats만 반환한다. 해답을 생성 결과나 현재 준비 UI에 노출하지 않는다.

공개 함수 계약은 설계 3~6절을 유지했다. generator는 원본 options에서 hooks를 직접 읽어 상속된 취소 신호·시계·양보도 보존한다. runSearch는 generator의 공유 컨텍스트 연결용 내부 진입이며 public options의 sharedBudget은 거부한다.
04 후 엔진 검사 25개 모두 통과, 최신 전체 회귀는 43개 중 42 통과·0 실패·1 skip(기존 서버 junction 생성 EPERM)이다. 무변경 서버 링크 검사는 001 사용자 통과 증거를 함께 적용했다.
001의 이전 사용자 검증 18개 통과는 보존하며 이번 도구 실행 결과와 구분한다. 이는 002 당시 결과다. 003 UI 변경은 이후 사용자 필수 브라우저 확인으로 검증했다.
최신 검토·증거·완료 판단은 [002의 04 리뷰 기록](docs/review-002.md)을 따른다.

## 003 보드 표시 구조·검증

- [src/ui/board.ts](src/ui/board.ts)는 getCellModels로 표시를 계산하고 renderBoard로 81개 button을 유지·갱신한다. 상태·배열·Set을 변경하거나 이벤트를 등록하지 않는다.
- [tests/browser/board.html](tests/browser/board.html)과 [board-checks.js](tests/browser/board-checks.js)는 앱과 분리된 고정 fixture·노드/포커스/불변·실패 주입 검증 페이지다.
- [tests/board-rendering.test.js](tests/board-rendering.test.js)의 9개 표시/검증보조/수명주기 검사와 새 자산 HTTP 검사를 추가했다.
- main → generatePuzzle(easy) → 표시용 snapshot → renderBoard → DOM 흐름이다. 실패에는 가짜 퍼즐을 보여주지 않는다.
- 최신 사용자 검사: 53 통과·0 실패·0 skip. 실제 보드·320px/1280px·checks·포커스/접근성·실패/복원·콘솔·서버 종료 확인을 보고받았다. 도구 당시 52 통과·1 skip과 브라우저 타임아웃은 이력으로 보존한다.
- 이번 90초 서버는 종료 로그·exit 0 확인. 자세한 구현·증거·직접 확인 절차는 [003 기록](docs/board-003.md)을 따른다.

04에서 null 선택의 Tab 진입점을 보장하고, 캐시 복귀 시 취소된 초기화를 재개하도록 보완했다.
[board-assertions.js](tests/browser/board-assertions.js)는 DOM 측정 facts를 boolean checks로 해석해 3px 경계·양의 셀 크기·넘침을 합격 조건에 포함한다.
사용자 UI 확인으로 필수 조건을 충족했으며 증거 출처·최종 판단은 [003의 04 리뷰 기록](docs/review-003.md)을 따른다.

## 004 상태·입력 구조 — 03

- [game-state.ts](src/core/game-state.ts)는 순수 reducer·초기 상태·store·구독 정리·재진입 dispatch 큐를 제공한다. getState는 계약상 읽기 전용이다.
- [events.ts](src/ui/events.ts)는 bindInput의 위임 click·keydown으로 마우스/터치 click·보드 키·숫자 패드·삭제·메모를 Action으로 전달하고 정리한다.
- 흐름: 입력 이벤트 → dispatch → reducer/store → 구독 렌더 → DOM. main은 숫자/삭제 후 유효 완성을 검사해 GAME_COMPLETED를 dispatch한다.
- renderer는 노드·포커스 표시를 재사용하고 입력 이벤트 쪽에서 선택 셀의 실제 focus를 맞춘다. 오류는 findConflicts와 !·테두리·이름·공용 상태 안내다.
- [interaction.html](tests/browser/interaction.html)·[interaction-checks.js](tests/browser/interaction-checks.js)는 일반·완료 직전·실패 store와 외부 form 검증용이다.
- [game-state 검사](tests/game-state.test.js) 14개·[키/이벤트 경계 검사](tests/input-events.test.js) 4개 통과. 004 도구 당시 전체는70통과·0실패·1skip이었다. 이후 사용자 전체71개 통과 보고로004를 완료했다.
- 004 실제 UI·터치·외부 폼·포커스·반응형·완료 잠금·콘솔·서버 종료는2026-10-26 사용자 보고로 충족했다.
- 004 당시에는 타이머 메타데이터·dialog 플래그만 제공했다. 현재005에서 아래 효과·UI를 연결했다. 기존 003 표시 helper는 개발 fixture 호환용이며 앱은 store를 사용한다.
- 상세 구현·명령·남은 절차는 [004 기록](docs/input-004.md)을 따른다.
004의 04에서 키 입력을 실제 포커스 셀에 맞추고 초기 메모 계약·input binding 정리 소유권을 보완했다. 브라우저/터치 재시도·사용자 최종 확인·증거 한계는 [004 리뷰 기록](docs/review-004.md)을 따른다.
## 005 게임 제어·시간·완료 — 03 구현

- [main.ts](src/main.ts)의 createGameSession은 store·generate·단조 시계·scheduler를 조정한다. 새 요청은 이전 controller·tick을 정리하고 requestId/상태/요청 난이도를 확인한 결과만 수락한다.
- 선택 난이도는 다음 게임에 적용한다. 생성 중 보드·입력 도구는 잠그고 새 게임 재요청은 허용한다. 실패는 이전 보드를 비우고 재시도 안내로 표시한다.
- [time.ts](src/utils/time.ts)는 시각 차이의 초 내림·mm:ss를 계산한다. playing 동안250ms interval 하나를 유지하고 새 게임·완료·dispose 시 정리한다. visibilitychange에서 표시를 즉시 보정한다.
- [controls.ts](src/ui/controls.ts)는 난이도·새 게임·시간·native dialog를 렌더하고 이벤트를 정리한다. 완료 시 닫기에 포커스, 닫기·Escape 후 새 게임에 포커스를 복귀한다.
- [controls.html](tests/browser/controls.html)·[controls-checks.js](tests/browser/controls-checks.js)는 실제 seed 생성·완료 직전·첫 실패·지연/오래된 응답 전달 개발 fixture다. 프로덕션에 fixture 버튼은 없다.
- [시간 검사](tests/time.test.js)·[제어 검사](tests/game-controls.test.js), HTTP 자산 회귀를 추가했다. 도구의 실제 UI 관찰은03 타임아웃·04 URL 확인 실패로 중단됐다. 이후 사용자 안내 절차의 타이머·dialog·포커스·터치·반응형 확인 보고로 필수 UI 조건을 충족했다.
- 상세 근거·수동 절차: [005 구현 기록](docs/controls-005.md). 004 완료 근거는 [004 리뷰](docs/review-004.md)·[05 초안](docs/pr-drafts/task-004.md)이다.
005의04에서 지연 close 이벤트의 중복 닫기·포커스 이동을 completionDialogOpen 렌더 상태로 제한했다. 신규 회귀2개 수정 전 실패·수정 후 통과, 시간/제어18개와 전체89개 중88통과·0실패·1skip을 확인했다. 필수 실제 UI 검증은 사용자 최종 보고로 충족했다. [005 리뷰 기록](docs/review-005.md).
005 완료일은2026-10-26이다. 사용자 전체89개 통과·필수 UI/터치·콘솔 오류 없음·서버 종료 보고를 [리뷰 기록](docs/review-005.md)에 반영하고 [05 초안](docs/pr-drafts/task-005.md)을 작성했다. 실제 BFCache는 별도 미확인, 실제 Git 작업은 미실행이다. 06의 현재 결과는 아래 별도 기록을 따른다.
## 06 전체 인수 검증

[전체 인수 기록](docs/acceptance/sudoku-mvp.md)을 작성했다. 게임 실행 코드는 바꾸지 않았으며 실제 generator·solver·session을 연결한 [통합 검사](tests/acceptance.test.js)3개를 추가했다.
전 회귀92개 중91통과·0실패·1skip(junction EPERM), 세 난이도 seed1/42/2026의 생성·유일해와 실제 실패/재시도·진행 생성 취소를 확인했다.
npm start의 runtime prehook·실제 CLI 시작과 서버 종료를 확인했다. 정적 서버 직접 HTTP는200이며 npm PTY 서버 교차 접속·앱 내 브라우저는 타임아웃이었다. 이전 사용자 UI 확인을 이번 직접 관찰로 바꾸지 않는다.
06은 도구 실행 당시 직접 UI 관찰이 차단됐지만 이후 사용자92개 통과·안내 절차의 브라우저/터치·반응형·dialog/포커스·콘솔·종료 보고로 완료했다. 기존001~005 완료와 별개이며 새 게임 기능·후속 ID·새 ADR은 추가하지 않았다.
D-001의 오래된 현재 적용 범위·작업 상태 메타데이터를001 문서 재개·수정·확인으로 정리했다.
## Git 최초 저장 — 2026-10-26

사용자 요청으로 현재 프로젝트만 독립 Git 저장소로 초기화하고 main에 코드·테스트·문서 전체를 첫 커밋으로 저장한다. 과거 단계별 커밋·브랜치를 소급 생성하지 않는다. [Git 저장 기록](docs/git-setup.md)을 따른다.
기존 개별 PR 초안은 작성 당시 검증·비교 한계를 담은 제안이며 실제 PR·병합의 증거가 아니다. 이후 사용자 잔여 확인으로06 인수도 완료했다. 최초 보류 이력은 인수 기록에 보존한다.
## GitHub Pages 공개 배포 — 006

저장소 origin은 https://github.com/Lim-YongKwan/sudoku-web.git 이며, 사용자 push 후 원격 main의 두 커밋과최신7189215를 확인했다.
GitHub Pages를 main/(root)로 설정해기존 HTML·CSS·Native ESM 게임을 공개했다. 별도런타임서버·번들러·외부패키지는추가하지 않았다.
공개주소는 [스도쿠 게임](https://lim-yongkwan.github.io/sudoku-web/)이다. [배포40294007460](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40294007460)은 success이며GitHub설정의게시완료·HTTPS를확인했다.
도구의 직접 플레이/HTTP 검증은 접속 승인 거부로 미실행이었으나, 이후 사용자 보드·입력·새 게임·타이머 정상 보고로 배포 기능 확인을 마쳤다. [006 작업기록](tasks/006-github-pages-deployment.md)에 배포 성공·당시 검증 차단·사용자 확인 후 완료를 구분했다. 기존06인수완료는유지한다.

## 007 TypeScript 전환 — 부분 반영

원본 모듈은 .ts로 전환했고 [types.ts](src/types.ts)에 읽기 전용 보드/상태·Action 판별 유니온·생성 결과·주입/구독 계약을 정의했다. 데이터의 런타임 검증은 유지한다.
[tsconfig](tsconfig.json)는 strict·noEmitOnError·NodeNext·ES2022다. 브라우저에는 .js ESM만 제공한다.
[build.mjs](scripts/build.mjs)가 고정된 출력 폴더를 정리한 후 컴파일·정적 복사를 수행하며 실패하면 부분 출력을 제거한다.
개발 .build는 src·index.html·styles·개발 fixture, 배포 dist는 src·index.html·styles만 포함한다. 서버와 기존 단위 검사는 최신 개발 출력을 사용한다.
[build.test.js](tests/build.test.js)는 실제 컴파일러로 타입 오류·오래된 출력·정적 자산 누락·배포 경계를 검사한다.
[Pages workflow](.github/workflows/pages.yml)는 PR 검증과 main의 검증 후 dist 배포를 정의한다. 원격 Pages 소스는 아직 main/(root)이며 이 workflow를 실제 실행하지 않았다.
[D-004](docs/decisions/004-typescript-toolchain.md)의 원본·도구·로컬 출력은 반영했다. 원격 배포 전환 전까지 D-001은 채택됨을 유지한다.
97개 중 96 통과·0 실패·1 Windows 권한 skip. 브라우저 접속은 시간 초과로 미완료다. [007 기록](docs/typescript-007.md)에 근거와 남은 절차를 둔다.
008~013의 보조 표시·취소·저장 계약은 [후속 계획](docs/plans/sudoku-next-iteration.md)에 분리하며 아직 구현하지 않았다.

## 007의 04 수정

상태 store는 undefined/falsy Action을 조용히 버리지 않고 런타임 검증 오류로 처리하며 재진입 큐를 정리한다.
solver의 숫자 마스크는 number 배열로 타입을 명시한다.
Pages workflow는 workflow/ref별 전체 실행의 concurrency와 이전 실행 취소를 적용한다. 배포 job만 직렬화하던 구성을 제거했다.
[04 기록](docs/review-007.md)의 최신 결과는 99개 중 98 통과·0 실패·1 권한 skip이다. 실제 UI·원격 배포 전환은 여전히 미검증이다.

## 007 사용자 잔여 확인 — 2026-10-29

사용자가 99개 전체 통과·로컬 브라우저·터치 에뮬레이션·반응형·완료 dialog·콘솔·서버 종료를 확인했다. 이전 도구 관찰과 구분한다.
현재 원격 사이트는 이전 배포다. 고정 커밋의 깨끗한 checkout·실제 Actions/공개 배포가 남아 있으며 D-001 전체 대체는 아직 보류한다. [순서와 증거](docs/review-007.md)를 따른다.

## 007 checkout 재현 — 2026-10-29

e7624b6의 새 worktree에서 설치·타입/빌드·HTTP/종료와 전 회귀(98 통과·0 실패·1 권한 skip)를 재현했다. [기록](docs/checkout-007.md)을 따른다.
후속 문서 갱신은 코드 구조를 바꾸지 않는다. 실제 원격 배포 소스와 D-001 전체 대체 보류는 유지한다.

## 007 실제 배포 완료 — 2026-10-29

현재 Pages 소스는 GitHub Actions다. main ebb3bfb의 validate가 설치·타입·99개 전체 검사·빌드·artifact 업로드를 통과했고 deploy도 성공했다.
공개 게임 정상 동작은 사용자 보고로 확인했다. [최종 기록](docs/deployment-007.md)을 따른다. D-004가 현재 원본/도구/배포 기준이며 D-001은 대체됨이다.

## 008 부드러운형 숫자 — 03 구현

[styles/main.css](styles/main.css)는 숫자 전용 CSS 변수로 로컬 서체 스택·입력600/단서700을 공유한다. 같은 크기·Grid 정렬·단서 배경을 유지하고 메모400·오류800은 따로 둔다. 숫자 패드도 같은 서체를 사용한다. 실제 글꼴·지원 굵기는 아직 관찰하지 않았다.
[개발 비교 페이지](tests/browser/typography.html)와 [검사 코드](tests/browser/typography-checks.js)는 렌더러에 1~9 비교 배열과 상태를 주입한다. CSS 실측·텍스트 영역·경계·잠금 검사 버튼을 제공하지만 실제 브라우저 실행은 미확인이다. 개발 빌드에만 포함한다.
[D-005](docs/decisions/005-assistance-highlights-and-undo.md)의 숫자 디자인 부분만 반영했다. 009~013 상태/옵션·강조·취소·저장은 미구현이다. [008 기록](docs/typography-008.md)의 자동 검증과 UI 중단 한계를 따른다. core·TS 모듈·데이터 흐름·빌드/배포 설정은 변경하지 않았다.

## 008의 04 수정

완료 시에도 고정 셀 배경을 유지하도록 CSS를 보완했다. 개발 비교 페이지는 [상태 builder](tests/browser/typography-state.js)와 [측정 판정](tests/browser/typography-assertions.js)을 분리했다. 유효한 완성 보드, 같은1~9·메모 수·스타일·단서 배경·잠금을 확인하는 개발 검사이며 실제 게임 상태를 바꾸지 않는다. [관련 검사6개](tests/typography.test.js)와 [04 기록](docs/review-008.md)의105개 집계를 따르며 실제 UI·fallback은 미확인이다.

## 008 최종 완료 — 2026-10-29

사용자는 안내 절차에 따라 테스트105개가 모두 통과했고 숫자 디자인·실측 checks·완료 후 단서 배경·반응형·키보드·터치·포커스·완료 대화상자·콘솔 오류 없음·서버 종료를 확인했다고 보고했다.
[04 최종 근거](docs/review-008.md)와 [05 초안](docs/pr-drafts/task-008.md)을 따른다. 실제 렌더링 서체 이름·브라우저 버전·터치 기기/에뮬레이션 구분·스크린샷·원시 로그는 미제공이다. 특정 플랫폼/글꼴을 직접 관찰했다고 기록하지 않는다.
D-005의 숫자 디자인만 완료됐고009~013은 여전히 미구현이다. 커밋·push·원격 CI·배포는 미실행이다.

## 008 실제 공개 배포 — 2026-10-29

[최종 기록](docs/deployment-008.md): main a59dd56의Actions40807127859에서validate/deploy가 성공했다. CI105개 전체 통과·검증된dist 배포와 사용자 공개 새 숫자 디자인 정상 확인으로008 공개 반영을 확인했다. 도구의 공개 사이트 직접 관찰은 접근 제한으로 미실행이며 사용자 보고와 구분한다. Pages 설정·core/상태·빌드 경계는 그대로고009~013은 미구현이다.

## 009 숫자 스톡·보조 옵션 — 03 구현

[types.ts](src/types.ts)에readonly Assistance 두boolean과SET_ASSISTANCE를 정의하고 [game-state.ts](src/core/game-state.ts)에서초기값/새 요청 리셋·런타임 검증·초기 객체복사를 연결했다. playing에서 옵션만바꾸며기존데이터/시간/선택을유지한다.
[집계](src/core/digit-stock.ts)는values만읽어사용량·남은수·9개이상여부를파생한다. [표시](src/ui/digit-stock.ts)는회색/남은수/접근성 이름만갱신하며disabled를설정하지않는다. [controls.ts](src/ui/controls.ts)는스톡checkbox의change/render/dispose를소유하고기존입력라우팅을유지한다.
[개발fixture](tests/browser/stock.html)와[관련11개 검사](tests/digit-stock.test.js)를추가했다. 현재 [009 기록](docs/stock-009.md)은116개 중115통과·1권한skip이며실제UI는미확인이다. D-005의009만부분반영,010~013·011토글 UI는미구현이다.공개배포는008을유지한다.

## 009의04 검증 보강

[개발 측정 판정](tests/browser/stock-assertions.js)을 분리해 패드9개/순서·남은 수 CSS 표시·버튼 내용 잘림·checkbox label/잠금·OFF 도움말을 검사한다. [측정 판정 회귀3개](tests/stock-presentation.test.js)를 추가했다. [04 기록](docs/review-009.md)의 최신 결과는119개 중118통과·1권한skip이며 실제 DOM/터치는 아직 관찰하지 못했다. 제품의 스톡/상태·입력 규칙이나 새로운 의존성/후속 기능은 추가하지 않았다.

## 009 최종 완료 — 2026-10-29

사용자는 안내 절차에 따라 테스트119개가 모두 통과했고, 스톡 집계·회색 버튼 입력·메모 제외·옵션 초기화·실패 재시도·완료 잠금·반응형·키보드·터치·접근성·콘솔 오류 없음·서버 종료를 확인했다고 보고했다.
[04 최종 근거](docs/review-009.md)와 [05 초안](docs/pr-drafts/task-009.md)을 따른다. 도구의 직접 UI 관찰 중단과 사용자 확인을 구분한다. D-005는 숫자 디자인·스톡·옵션 기반까지 반영됐고010~013은 미구현이다. 009의 실제 커밋·push·원격 CI·공개 배포는 미실행이다.

## 009 실제 공개 배포 — 2026-10-29

[최종 기록](docs/deployment-009.md): main ebfb5b3의Actions40824921514에서validate/deploy가 성공했고119개 검사 전체 통과·검증된dist 배포를 확인했다. 사용자가 공개 스톡 표시·입력·새 게임/새로고침 옵션 초기화를 정상 확인했다. 도구의 직접 공개 게임 접속은 접근 제한으로 미실행이며 사용자 보고와 구분한다. 기존 빌드/Pages·엔진·입력 경계를 유지하고010~013은 시작하지 않는다.
