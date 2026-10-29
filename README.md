# Sudoku — Vanilla TypeScript 학습 프로젝트

## 현재 상태

001~011 완료·공개 배포 완료. 게임 원본은 strict TypeScript이며 컴파일된 Native ESM을 브라우저에서 실행한다.
011은 구현 1d03c53을 PR #5로 main 4a2edad에 병합했고, Actions 40843161441의 validate/deploy 성공·145개 전체 통과와 사용자 공개 화면의 같은 숫자 강조·옵션 초기화 정상 확인까지 마쳤다. 012~013은 예정이며 구현하지 않았다.
[Actions 배포](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40843161441), [공개 게임](https://lim-yongkwan.github.io/sudoku-web/), [011 최종 배포 기록](docs/deployment-011.md), [최종 리뷰](docs/review-011.md), [05 초안과 실제 PR](docs/pr-drafts/task-011.md)을 따른다.
공개 게임 동작은 사용자 보고이며, 도구 직접 접속은 저장된 접근 제한으로 차단됐다. 아래 단계별 기록은 당시 이력이다.

## 실행 환경

- Node.js 22 이상, npm. 게임 런타임 패키지·CDN·번들러는 사용하지 않는다.
- npm ci로 고정된 TypeScript 7.0.2 개발 컴파일러를 설치한다. package-lock.json을 함께 사용한다. 게임 런타임 dependencies는 없다.
- 시스템 기본 Node는 v16.20.2다. 기존 Codex 실행 환경의 Node v24.22.1과 npm 8.19.4로 실제 검사했다.
- 시스템 설치와 전역 PATH는 변경하지 않았다. 새 터미널에서도 적절한 Node를 먼저 선택해야 한다.

### Node 22 이상이 기본 실행 환경인 경우

프로젝트 루트에서 실행한다. Windows PowerShell에서는 npm.cmd를 사용하면 npm.ps1 실행 정책과 관계없이 호출할 수 있다.

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

정상적인 사용자 터미널에서는 서버가 출력한 로컬 HTTP 주소를 브라우저로 연다. 기본 주소는 http://127.0.0.1:8080 이다.
file://로 index.html을 열어 검증하지 않는다. 종료는 서버 터미널의 Ctrl+C다.

### 이 컴퓨터의 기존 Node 24를 현재 PowerShell 세션에서 사용

아래는 이번 검증에 사용한 설치본이다. 게임 런타임 의존성은 아니며, 다른 컴퓨터에서는 설치된 Node 22 이상을 사용하면 된다.

```powershell
$nodeDirectory = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
$nodeExecutable = Join-Path $nodeDirectory 'node.exe'
$npmEntry = Join-Path $env:ProgramFiles 'nodejs\node_modules\npm\bin\npm-cli.js'
$env:Path = "$nodeDirectory;$env:Path"
& $nodeExecutable --version
& $nodeExecutable $npmEntry --version
& $nodeExecutable $npmEntry ci
& $nodeExecutable $npmEntry run typecheck
& $nodeExecutable $npmEntry test
& $nodeExecutable $npmEntry run build
& $nodeExecutable $npmEntry start
```

이는 현재 세션의 PATH만 바꾼다. 실행 파일이 없는 다른 환경에서 같은 경로를 가정하지 않는다.
PORT를 바꾸려면 시작 전에 `$env:PORT = '8082'`처럼 설정한다. 사용 중인 포트는 명시적인 오류로 안내한다.

## 001 환경 검증 이력

- 도구의 Node 24.22.1·npm 8.19.4 검사: 18개 중 17 통과·0 실패·1 skip. Windows junction 생성 EPERM으로 링크 검사만 건너뛰었다.
- 사용자 최종 재검증(2026-10-23): **18 통과·0 실패·0 skip**. 사용자가 안내 절차대로 테스트·브라우저 ESM 초기화·콘솔 오류 없음·서버 종료를 확인했다고 보고했다.
- 자동 검사는 HTTP·MIME·HEAD·404·405·경로 경계·메타데이터·UTF-8·포트 충돌·CLI 시작 및 종료를 포함한다. CLI HOST 미정의 오류·시작 후 오류 정리·포트 타입·실경로 공개 정책을 리뷰에서 수정했다.
- 브라우저와 예전·신규 서버 종료의 최종 근거는 사용자 확인이다. 도구의 격리 서버 연결 타임아웃·종료 입력 거부 이력은 보존했다.
- 사용자 실행의 원시 로그·브라우저 이름/버전·PID·스크린샷은 미제공이다. 도구가 직접 재관찰한 결과로 기록하지 않는다.
- 상세 이력은 [03 구현 기록](docs/environment-001.md), 최신 완료 판단은 [04 리뷰 기록](docs/review-001.md)에 있다.

## 제공하는 파일

| 파일 | 책임 |
|---|---|
| [index.html](index.html) | 보드 마운트·상태·보기 전용 안내·CSS/ESM 진입점 |
| [src/main.ts](src/main.ts) | 실제 easy 생성·표시 snapshot·렌더 연결·로딩/실패·pagehide 취소 |
| [styles/main.css](styles/main.css) | 9열 보드·단서/빈칸·3x3 경계·포커스·반응형 |
| [scripts/serve.mjs](scripts/serve.mjs) | CLI 시작·실제 주소/PID·중복 종료 방지·시작 후 오류 정리. 소유 부모 IPC 검증 지원 |
| [scripts/static-server.mjs](scripts/static-server.mjs) | HTTP 생성·시작·종료와 파일 경계·MIME 처리 |
| [scripts/check-runtime.mjs](scripts/check-runtime.mjs) | Node 22 이상 실행 검사 |
| [tests/server.test.js](tests/server.test.js) | 내장 runner의 실제 HTTP 통합 테스트 |

서버는 127.0.0.1에만 바인딩한다. 공개 범위는 index.html, src/, styles/, tests/browser/, tests/fixtures/의 지원 파일이다.
프로젝트 문서·스크립트·메타데이터·숨김 경로는 제공하지 않고 디렉터리를 나열하지 않는다.
003에서 tests/browser/board.html 고정 fixture 검증 페이지와 board-checks.js를 추가했다. 앱 페이지는 실제 엔진 퍼즐을 사용한다.

## 개발 문서와 다음 단계

- [AGENTS.md](AGENTS.md), [현재 아키텍처](architecture.md)
- [작업 목록](tasks/README.md), [001 환경 태스크](tasks/001-development-environment.md)
- [설계·데이터 계약](docs/plans/sudoku-mvp.md), [결정 목록](docs/decisions/README.md)
- [코드 리뷰 기준](docs/review-checklist.md)
- [00 기록](docs/project-setup.md), [01 기록](docs/design-stage.md), [02 기록](docs/backlog-stage.md)

001의 필수 조건을 충족해 완료 처리했고 [05 커밋 메시지·PR 초안](docs/pr-drafts/task-001.md)을 작성했다. 002는 사용자 요청으로 현재 폴더의 선행 코드를 확인해 03 구현과 04 검증·리뷰를 완료했다. Git 브랜치·기본 브랜치 반영은 미실행이며 팀의 Git 반영 흐름은 이후 별도로 적용한다.
Git 저장소·main 기본 브랜치는 사용자 후속 요청으로 준비했다. 아래 단계별 Git 미실행 설명은 당시 이력이다. 03 지침에 따라 브랜치 생성은 미실행으로 기록했고 커밋·푸시·PR·병합을 수행하지 않았다.



## 002 엔진 구현·04 리뷰

DOM 없는 보드 검증·풀이·해답 수·유일해 생성을 추가했다. 사용 방법과 seed별 측정은 [002 구현·검증 기록](docs/engine-002.md), API 계약은 [설계 3~6절](docs/plans/sudoku-mvp.md)을 따른다.

- 04 후 엔진 테스트 25개 통과. 최신 전체 npm test는 43개 중 42 통과·0 실패·1 skip(기존 서버 junction 생성 EPERM)이다. 변경 없는 서버 링크 검사는 001 사용자 통과 증거를 함께 적용했다.
- easy/normal/hard 목표 빈칸은 35/45/50이며 seed 1·42·2026 총 9건 모두 기본 예산 안에 성공했다.
- 이 단락은 002 엔진 단계 결과다. 이후 003에서 보드 표시 UI를 구현했으며 이후 필수 실제 브라우저 검증은 사용자 확인으로 충족했다.
- [002 태스크](tasks/002-sudoku-engine.md)는 완료됐다. [04 리뷰 기록](docs/review-002.md)에 옵션 상속 취소 누락 수정·추가 검증·완료 판단을 기록했다. [05 커밋 메시지·PR 초안](docs/pr-drafts/task-002.md)을 작성했다. 실제 커밋·PR 생성·병합은 미실행이다.

## 003 보드 표시 — 구현·04 리뷰

- npm start 후 루트 페이지에서 실제 easy 퍼즐을 생성·표시하도록 구현했다. 이는 003 당시 표시 범위다. 현재 앱은 004에서 숫자·메모·선택·삭제 입력을 연결했다.
- 개발 전용 /tests/browser/board.html에서 고정 보드·노드/포커스/불변·실패 주입을 검사할 수 있다. 실제 생성 보드와 구분한다.
- 사용자 최종 테스트는 53 통과·0 실패·0 skip이다. 도구 당시 52 통과·1 skip과 표시/검증보조/수명주기 9개 통과는 이력으로 보존한다.
- 사용자가 실제 보드·320px/1280px·checks·포커스/접근성·실패/복원·콘솔 오류 없음·서버 종료를 확인했다. 원시 로그·브라우저 버전·스크린샷은 미제공이며 도구 직접 관찰로 표현하지 않는다.
- [003 구현·검증·직접 확인 절차](docs/board-003.md)와 [003 태스크](tasks/003-board-rendering.md)를 따른다. 04 리뷰·수정 결과는 [003 리뷰 기록](docs/review-003.md)에 있다. 사용자 확인으로 완료 처리했고 [05 커밋 메시지·PR 초안](docs/pr-drafts/task-003.md)을 작성했다. 실제 커밋·PR·병합은 미실행이다.

## 004 입력·상태 — 03 구현

- 앱에서 셀 선택·방향키·숫자·Backspace/Delete·숫자 패드·지우기·메모를 store의 Action으로 연결했다. 단서는 수정할 수 없다.
- 충돌은 !·테두리·셀 이름·공용 안내로 표시한다. 유효 완성은 completed 상태로 잠그며 시간 메타데이터만 기록한다.
- /tests/browser/interaction.html은 고정 store·완료 직전·실패·외부 input/select 검증 페이지다.
- 004 도구04 당시70통과·0실패·1skip, 상태/키/이벤트 경계18개 통과. 사용자 최종 보고는 전체71개 통과다.
- 004 필수 UI·터치·반응형·콘솔·서버 종료는 사용자 보고로 충족해 완료했다.
- [004 구현·검증·직접 확인 절차](docs/input-004.md), [004 태스크](tasks/004-user-interaction.md)를 따른다.
- [004 리뷰·수정·재검증](docs/review-004.md): 키 입력 대상·unbind 소유권·초기 notes 검증을 보완했다. 실제 브라우저·터치는 사용자 보고로 확인했다.
## 004 완료·005 게임 제어 구현

004는2026-10-26 사용자 전체71개 통과·입력/메모/충돌/포커스/외부 폼/완료 잠금/터치/반응형·콘솔 오류 없음·서버 종료 보고로 완료했다. [004 PR 초안](docs/pr-drafts/task-004.md)은 로컬 파일이며 실제 Git 작업은 미실행이다.

005에서 다음 게임 난이도(easy35·normal45·hard50 빈칸), 새 게임·실패 재시도·중복 요청 취소, 경과 시간·완료 dialog를 구현했다. 새 게임은 생성 중에도 가능하며 난이도 선택만으로 현재 게임을 교체하지 않는다.
Native dialog 닫기·Escape 후 새 게임 버튼으로 복귀하도록 연결했다. 도구 직접 화면 관찰은 실패했으며 이후 사용자 잔여 확인 보고로 필수 UI 검증을 충족했다.
[005 태스크](tasks/005-game-controls-timer.md)·[구현/테스트/수동 절차](docs/controls-005.md)를 따르며 005는 완료됐으며 06 전체 인수 검증은 아래 별도 기록에서 진행 상태와 결과를 확인한다.

005의03 당시 검사:87개 중86통과·0실패·1skip. 최신04 검사:89개 중88통과·0실패·1skip(기존 junction EPERM), 시간/제어18개 모두 통과. 이후 사용자 안내 절차의 전체89개 통과·필수 UI/터치 확인 보고로005를 완료했다.

[005의04 리뷰·수정·검증 기록](docs/review-005.md): 지연 close의 중복 처리와 포커스 이동을 수정했다. 도구의 실제 Chrome 시도는 현재 URL 확인 실패로 중단됐지만 이후 사용자 확인 보고로 필수 UI 검증을 충족했다. 임시 검증 서버는 종료했다.
005는2026-10-26 사용자 전체89개 테스트 통과·난이도/새 게임/타이머/실패 재시도/오래된 응답 무시/완료 대화상자/포커스/터치/반응형/콘솔 오류 없음/서버 종료 보고로 완료했다. [005 커밋 메시지·PR 초안](docs/pr-drafts/task-005.md)을 작성했으며 실제 Git·PR·병합은 미실행이다. 전체 인수 검증06은 아래 별도 기록으로 진행했다.
## 06 전체 인수 검증 결과

[전체 인수 기록](docs/acceptance/sudoku-mvp.md)에 통과 근거와 남은 실제 화면 확인 절차가 있다.
전체 자동 검사는92개 중91통과·0실패·1skip이며 실제 엔진과 게임 session의 통합3개를 새로 포함한다. 게임 실행 코드는 변경하지 않았다.
도구의 직접 UI 관찰은 localhost 타임아웃으로 실패했지만, 이후 사용자 전체92개 통과·안내 절차의 실제 브라우저/터치·반응형·dialog·포커스·콘솔·서버 종료 확인으로06을 완료했다. 이전 도구 결과와 사용자 보고를 구분한다.
서버 실행은 위 Node22 이상 준비와 npm start 안내를 그대로 사용한다. 외부 설치·빌드가 필요하지 않으며 실제 Git·PR·병합·배포는 수행하지 않았다.
## Git 저장 상태

현재 폴더를 독립 저장소로 초기화하고 main에 코드·테스트·문서를 첫 커밋의 전체 스냅샷으로 저장한다. 기능별 커밋을 소급 구성하지 않는다. [Git 저장 기록](docs/git-setup.md)을 따른다.
원격 저장소 연결·push·실제 PR·병합·배포는 하지 않는다. 001~005와06 인수 검증은 완료됐으며 실제 PR·병합·배포는 별개다.
06 완료일은2026-10-26이다. 최종 근거·미제공 환경 정보·선택 확인 항목은 [인수 기록](docs/acceptance/sudoku-mvp.md)을 따른다. 사용자 요청으로 변경 문서를 후속 커밋에 저장하며 push는 하지 않는다.
## 공개 게임 — GitHub Pages

[스도쿠 게임 실행](https://lim-yongkwan.github.io/sudoku-web/)

GitHub Pages를 main 브랜치의 / (root)에 연결했고 [빌드·배포 성공](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40294007460)과 GitHub의 게시 완료 안내를 확인했다.
배포 기준은7189215다. 기본 도메인의 HTTPS로 제공한다. main에 후속 변경을 push하면 같은 소스에서 다시 배포된다.
게임은 브라우저에서 실행되며 방문자는 Node.js를 설치하지 않는다.
도구의 직접 접속은 승인 거부로 중단됐지만, 이후 사용자가 공개 주소의 보드·숫자 입력·새 게임·타이머 정상 동작을 확인해006을 완료했다. 상세 근거와 관찰 한계는 [006 배포 작업](tasks/006-github-pages-deployment.md)을 따른다.
## 개발 계획 — 007~013

[작업 목록](tasks/README.md)에 TypeScript 전환부터 수동 저장까지 일곱 개 예정 태스크를 추가했다.
[확정 요구사항·공통 계약](docs/plans/sudoku-next-iteration.md), [AGENTS TypeScript 수정안](docs/plans/agents-typescript-proposal.md), [설계 결정](docs/decisions/README.md)을 함께 읽는다.
007의 로컬 TypeScript 전환을 구현했다. 008~013은 예정 상태다. Pages 원격 전환은 아직 하지 않았으며 007 기록의 배포 순서를 따른다.

## 007 원본·출력과 배포

- 원본: src/**/*.ts. 브라우저의 .js 상대 import를 유지한다.
- npm run build:dev → .build에 컴파일된 src와 개발 정적 자산·fixture를 준비한다.
- npm test와 npm start는 각각 pretest/prestart에서 최신 개발 출력을 만든다. 같은 출력을 만드는 명령을 동시에 실행하지 않는다.
- npm run build → dist에 index.html·styles·컴파일된 src만 준비한다. 생성물은 Git에서 제외하고 직접 수정하지 않는다.
- 서버 기본 루트는 .build다. 저장소 루트를 다른 서버로 직접 제공하거나 원본 index.html을 file://로 열지 않는다.
- GitHub Actions 파일을 준비했으나 원격 설정은 기존 main/(root)다. main 반영 전에 Pages를 Actions로 전환한 뒤 실제 빌드·공개 사이트를 확인한다. TS 원본을 기존 루트 게시로 먼저 내보내지 않는다.

## 007의 04 결과

[리뷰·남은 확인](docs/review-007.md): Action 큐의 잘못된 입력 처리와 배포 실행 경합을 수정했다.
최신 전체 검사는 99개 중 98 통과·0 실패·1 Windows 권한 skip이다.
브라우저는 URL 확인 불가로 도구가 중단했으며 실제 DOM/터치 확인은 남아 있다. 현재 공개 사이트·원격 설정은 변경하지 않았다.

## 007 사용자 확인 후 남은 순서

2026-10-29 사용자 보고: 99 통과·0 실패·0 skip, 브라우저·터치 에뮬레이션·반응형·완료 dialog·콘솔·서버 종료 확인. 실제 휴대전화 검증으로 확대하지 않는다.
[04 기록](docs/review-007.md)의 커밋 → 깨끗한 checkout → feature push/PR validate → Pages 소스 Actions 전환 → main 반영/배포 → 공개 주소 확인 순서를 따른다. 현재는 진행 중이며 이번 문서 갱신에서 커밋·push는 하지 않았다.

## 007 커밋 기반 재현

[검증 기록](docs/checkout-007.md): 새 worktree에서 설치·타입 검사·빌드·99개 검사(98 통과·0 실패·1 Windows 권한 skip)·서버 실행/HTTP/종료를 확인했다. 사용자 로컬 99개 전체 통과 보고와 별도로 기록했다.
TS-02는 충족했고 원격 Actions/공개 배포는 대기 중이다. 이번 요청은 로컬 커밋·재현까지이며 push하지 않았다.

## 011의03 로컬 구현 — 2026-10-29

[구현/검증](docs/matching-011.md): 기존highlightMatchingDigits토글을노출하고board의현재선택값에서matching을파생해단서포함강조한다. 같은숫자접근성이름과연한배경,선택/단서구분을추가하고최근밑줄·충돌/포커스·패드입력계약을유지했다. 신규8개통과·전체141개(140통과/1권한skip)·타입/빌드·HTTP/종료확인. 브라우저로컬접속시간초과로실제UI/터치미확인·04리뷰대기다. 미커밋·미배포이며012/013은미구현이다.

## 011의04 리뷰 — 2026-10-29

[리뷰·수동 절차](docs/review-011.md): 개발스톡검증의이전토글부재조건을수정하고matching DOM/접근성·토글판정과회귀4개를보강했다. 관련12개통과·전체145개중144통과/1권한skip·타입/빌드·HTTP/종료확인. 실제UI/터치는사용자확인대기로진행중이며커밋·push·012구현은하지않았다. 앞선03검증대기문구는당시이력이다.

## 011 사용자 최종 확인·완료·05 — 2026-10-29

사용자는 안내 절차에 따라 테스트 145개가 모두 통과했고, 같은 숫자 강조·메모 제외·옵션 조합·회색 버튼 입력·완료 시 해제·포커스·터치·반응형·콘솔 오류 없음과 서버 종료를 확인했다고 보고했다.

[04 최종 기록](docs/review-011.md)에서 사용자 보고를 근거로 MATCH-03/REV-01을 충족한 것으로 판정했다. 도구의 이전 144통과/1권한skip과 03 시간 초과·04 UI 미시도는 당시 이력으로 보존한다. 원시 로그·스크린샷·브라우저/기기 버전·실기기/에뮬레이션 구분은 미제공이며 도구 직접 관찰로 표현하지 않는다.

[05 커밋 메시지·PR 초안](docs/pr-drafts/task-011.md)을 작성했다. 이번에는 문서만 갱신해 기능 검사를 재실행하지 않았다. 검토 범위 내 중대한 미해결 문제는 확인되지 않았다. 로컬 완료는 원격 CI·병합·배포 완료를 뜻하지 않으며 커밋·push·012/013 구현은 하지 않았다. D-005는 같은 숫자 강조까지 부분 적용한 상태다.

## 011 병합·배포·공개 확인 — 2026-10-29

011은 구현 1d03c53을 PR #5로 main 4a2edad에 병합했고, Actions 40843161441의 validate/deploy 성공·145개 전체 통과와 사용자 공개 화면의 같은 숫자 강조·옵션 초기화 정상 확인까지 마쳤다. 012~013은 예정이며 구현하지 않았다.

[최종 배포 기록](docs/deployment-011.md)에 PR/병합 커밋·Actions 검증·사용자 공개 확인 근거를 모았다. 공개 동작은 사용자 보고이며 도구 직접 관찰과 구분한다. 이전 미커밋·미배포·확인 대기 문구는 각 단계 당시 이력이다. 이번 후속 변경은 문서만 main에서 커밋·push하는 작업이다.
