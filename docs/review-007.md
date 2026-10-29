# 007 TypeScript 전환 — 04 검증·코드 리뷰

- 일자: 2026-10-29 (Asia/Seoul)
- 대상: [007 작업](../tasks/007-typescript-migration.md), [03 구현 기록](typescript-007.md).
- 브랜치: feat/task-007-typescript-migration, HEAD 1c45a8b.
- 기존 03의 미커밋 구현을 보존하고 그 위에서 리뷰·수정했다. 커밋·push·병합·Pages 원격 변경은 없다.
- 현재 판정: 로컬 리뷰·수정과 사용자 로컬 잔여 검증을 확인했다. 깨끗한 checkout·실제 Actions/공개 배포 대기로 전체 완료를 보류한다. 아래 도구 중단과 초기 검사는 당시 이력이다.

## 발견 사항과 수정

| ID | 문제·영향 | 수정·검증 |
|---|---|---|
| R1 / P2 | store.dispatch가 큐에서 꺼낸 Action을 if (!action) break로 처리해 undefined/null/false 등 잘못된 입력을 오류 없이 무시했다. 구독자 재진입 큐에서는 잘못된 입력 뒤의 작업이 남아 다음 dispatch에 섞일 수 있었다. TS 전환 전 런타임 오류 계약의 회귀다. | [game-state.ts](../src/core/game-state.ts)에서 undefined를 명시적으로 거부하고 나머지는 기존 validateAction으로 검사한다. 오류 시 pending을 비우는 동작을 유지했다. [회귀 2개](../tests/game-state.test.js)를 수정 전 실행해 모두 실패함을 재현했고, 수정·재빌드 후 상태 테스트 16/16 통과. |
| R2 / P2 | 배포 job만 직렬화하면 서로 다른 커밋의 검증 job은 병렬 실행된다. 오래된 커밋의 검증이 늦게 끝나 최신 커밋 이후에 배포될 수 있다. | [workflow](../.github/workflows/pages.yml)의 workflow 전체를 workflow/ref별 concurrency로 묶고 cancel-in-progress를 true로 설정했다. main 배포 조건·validate 의존·성공 후 dist 업로드·배포 job의 한정된 쓰기 권한을 확인했다. 실제 GitHub 실행은 아직 미실행이다. |
| R3 / 타입 보강 | solver의 Array(9).fill(0)은 표준 Array 생성자의 any[] 추론에 의존했다. 마스크에 숫자 외 값이 들어가는 향후 변경을 타입 검사로 잡기 어렵다. | [solver.ts](../src/core/solver.ts)의 행/열/박스 마스크를 Array<number>로 지정하고 reducer의 새 메모도 Set<number>로 명시했다. 타입·엔진·통합·전 회귀를 재검증했다. |

R2는 로컬 코드의 실행 순서 분석으로 확인했다. 원격에서 배포 역전 사고가 실제 발생했다고 주장하지 않는다.
GitHub 공식 [workflow concurrency 문서](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)의 workflow/ref 그룹과 이전 실행 취소 방식을 적용했다.
소스의 의도된 .js import, 런타임 보드/Action 검사, 단서 보호, 노트 복사, 생성 제한·취소·시계 계약은 유지했다.

## 수행한 검사

| 검사 | 실제 결과 |
|---|---|
| 수정 전 추가 회귀 2개 | 둘 다 Missing expected exception으로 실패 재현 |
| 수정 후 npm run typecheck | 통과 |
| 수정 후 npm run build:dev | 통과 |
| 수정 후 node --test tests/game-state.test.js | 16 통과·0 실패 |
| 첫 전체 npm test | 로컬 네트워크 권한 미부여 상태의 connect EACCES로 HTTP 검사 실패. 코드 실패와 구분해 보존 |
| 네트워크 권한 부여 후 npm test | 99개: 98 통과·0 실패·1 skip |
| npm run build | 통과 |
| HTTP·서버 종료 | 위 전체 검사의 실제 HTTP/MIME·경계·CLI 시작/소유자 IPC 종료 시나리오 통과 |
| workflow 정적 리뷰 | main/PR 분기·validate 성공 의존·artifact 경로·권한·concurrency 확인. 실제 Actions 실행은 미실행 |
| 03의 새 디렉터리 재현 검사 | 이전 증거로 사용. 이번 04에서 npm ci/새 복사 디렉터리 검사를 재실행한 것으로 기록하지 않음 |

99개는 기존 92개 + 03 빌드 검사 5개 + 이번 회귀 2개다.
skip 1개는 Windows junction 생성 EPERM이며 통과로 계산하지 않는다.
사용한 실행 환경은 기존 Node 24.22.1·npm 8.19.4다. 전역 설치·설정 변경은 없다.

## 리뷰 범위

- 타입: strict/noEmitOnError·readonly 보드/메모·Action 판별 유니온·주입 함수·DOM null/이벤트 경계·런타임 검사 유지.
- 원본/출력: src는 TS만, Node 테스트와 scripts는 JS 유지. 최신 .build를 검증하고 dist에는 게임 자산만 포함한다.
- 빌드: 타입 오류·정적 자산 누락·오래된 출력 제거·실패 후 부분 출력 제거를 실제 컴파일러로 검증했다.
- 엔진: 기존 계약 검사와 실제 3난이도 생성→입력→완료→재시작 통합 검사를 유지했다.
- 상태/UI: 큐·불변 복사·단서·메모·충돌·완료 잠금·오래된 응답·타이머·이벤트 소유권 자동 검사를 확인했다.
- 문서: 현재 로컬 TS와 기존 공개 JS 배포를 구분하고 D-001의 전체 대체는 보류한다. 008~013은 구현하지 않는다.

## 브라우저 도구 중단과 관찰 한계

03의 in-app browser는 로컬 접속 시간 초과였다. 이번에는 computer-use 스킬로 설치된 Chrome의 로컬 검증을 준비했다.
창 상태 확인에서 최소화된 창을 확인했고, 활성화 시도에서 도구가 현재 브라우저 URL을 충분히 확신할 수 없다고 판단해 Computer Use를 중단했다.
이후 앱 입력이나 다른 브라우저 경로로 우회하지 않았다. 실제 보드 표시·터치·320px/1280px·포커스·완료 dialog·콘솔 오류 없음은 이번에도 미검증이다.
일반 브라우저 열기 시도와 자동 HTTP 검사를 실제 DOM 검증으로 간주하지 않는다.

별도 검증 준비 서버는 63996 포트·자식 PID 17436으로 시작했다. stdin 종료 입력은 도구의 닫힌 입력 때문에 실패했다.
CIM 조회는 권한으로 실패했고, 후속 Get-Process에서는 PID가 보이지 않았다. 포트 재접속은 ETIMEDOUT이라 이 별도 서버의 정상 종료를 확정하지 않았다.
전체 회귀의 소유자 IPC 종료 검사는 별도로 통과했다. 남은 수동 확인 시 해당 포트의 리스너 존재 여부도 확인한다.

## 완료 조건별 판정

| 조건 | 판정 |
|---|---|
| TS-01 / TS-03 / TS-04 | 로컬 타입·런타임·기존 회귀·빌드 실패 경계 검증 충족 |
| TS-02 | 새 입력 디렉터리 재현은 03에서 성공. 커밋 후 깨끗한 Git checkout 검증은 아직 |
| TS-05 | 로컬 브라우저·터치 에뮬레이션은 사용자 확인. 실제 Actions·Pages 공개 배포 대기 |
| TS-06 / DOC-01 | 로컬 반영과 원격 미반영을 구분해 갱신. 최종 문서 링크·ID 검사 결과를 아래에 기록 |
| REV-01 | 리뷰와 발견 문제 수정은 수행했으나 모든 필수 확인이 충족되지 않아 미체크 유지 |

## 사용자 안내 당시 확인 절차 — 이력

1. Node 22 이상을 준비하고 README의 명령으로 typecheck·test·build를 순서대로 실행한다.
2. 63996 포트의 남은 리스너 유무를 확인한다. 다른 Node 프로세스를 일괄 종료하지 않는다.
3. npm start가 출력한 HTTP 주소에서 보드·입력·메모·충돌·난이도·새 게임·타이머를 확인한다.
4. /tests/browser/board.html, /tests/browser/interaction.html, /tests/browser/controls.html에서 fixture/checks·실패 재시도·늦은 응답·완료/잠금·포커스를 확인한다.
5. 320px/1280px·키보드·실제 터치·콘솔을 확인하고 서버 Ctrl+C 종료를 확인한다.
6. 사용자 승인 후 커밋·깨끗한 checkout·main 반영 직전 Pages Actions 전환·실제 workflow/공개 주소 검증을 진행한다. 이번에는 실행하지 않았다.

필수 확인이 남으므로 007은 진행 중이다. 중대한 로컬 미수정 결함을 남기지는 않았지만 미실행 영역을 무결함으로 판정하지 않는다.

최종 문서 검사: Markdown 52개·로컬 파일 링크 662개, 깨진 링크 0개·중복 작업 ID 0개. git diff --check 통과. HEAD는 1c45a8b, 새 커밋·stage·push는 없다.

## 사용자 잔여 검증 확인 — 2026-10-29

- 근거: 사용자가 안내 절차에 따라 테스트 99개 모두 통과, 브라우저·터치 에뮬레이션·반응형·완료 대화상자·콘솔 오류 없음·서버 종료를 확인했다고 보고했다.
- 사용자 보고 결과: 99 통과·0 실패·0 skip. 이전 도구 실행의 98 통과·1 Windows 권한 skip과 구분한다.
- 브라우저/화면은 안내한 로컬 검증 절차의 사용자 확인이다. 도구가 직접 관찰한 것으로 기록하지 않는다.
- 터치는 에뮬레이션 확인이며 실제 휴대전화/물리 터치 기기 검증으로 확대하지 않는다.
- 이전 검증 서버와 새 개발 서버의 종료 확인은 안내 절차를 수행했다는 사용자 보고로 충족했다.
- 원시 테스트 로그·브라우저 이름/버전·화면별 수치·스크린샷·종료 PID 목록은 제공되지 않았다.
- 깨끗한 Git checkout과 실제 Actions/공개 배포는 아직 미실행이다. 007 상태는 진행 중을 유지한다.
## 남은 checkout·Actions 배포 순서 — 계획만 작성

아래 커밋·worktree·push·PR·설정·병합은 이번에 실행하지 않았다. 사용자가 각 후속 Git/원격 작업을 승인한 뒤 진행한다.

1. feature 브랜치의 실제 diff와 lockfile/workflow/새 TS 원본 포함 여부를 확인하고, 현재 사용자 검증 기록까지 구현 커밋으로 저장한다. .build/dist/node_modules는 제외한다. 이는 재현 검증의 기준 커밋이며 007 전체 완료 선언이 아니다.
2. 해당 커밋 SHA를 고정해 기존 경로를 덮어쓰지 않는 새 디렉터리에 detached worktree를 만든다. Git checkout 검증 전에는 새 커밋을 만드는 작업이 필요하다. 이전의 원본 복사 검증은 이 검증을 대신했다고 표시하지 않는다.
3. 새 worktree에서 Node 22 이상을 준비하고 npm ci → npm run typecheck → npm run build:dev → npm test → npm run build → npm start/HTTP/종료를 순서대로 확인한다. 기존 출력이나 다른 디렉터리의 node_modules에 기대지 않아야 한다. 소스의 미추적/변경 파일 없이 재현되는지 확인하고 SHA·명령·결과를 원래 작업 브랜치의 문서에 기록한다.
4. checkout 결과 문서를 후속 커밋으로 저장하고 feature를 push한 뒤 main 대상 PR을 만든다. 현재 workflow는 feature push만으로 검증하지 않으며 PR 생성/업데이트에서 validate만 실행하고 배포는 건너뛰도록 설정돼 있다. validate의 설치·타입·테스트·빌드 성공을 확인한다.
5. PR 승인/검증 후 main 반영 직전에 GitHub Settings → Pages → Build and deployment → Source를 GitHub Actions로 전환한다. 기존 main/(root) 게시 상태에 TS 변경을 먼저 병합하지 않는다. 새 workflow 배포 확인 전 기존 게시본을 유지한다.
6. PR을 main에 병합하면 main push workflow가 설치·타입·전체 검사·dist 빌드를 검증한 뒤 artifact 업로드·deploy를 실행한다. 해당 실행의 커밋 SHA·validate/deploy 성공·github-pages 배포 상태와 URL을 기록한다. 실패하면 완료 처리하지 않고 실패 단계부터 수정·재검증한다.
7. 공개 URL에서 강력 새로고침 후 실제 새 배포의 보드·입력·메모·난이도/새 게임·타이머·완료·콘솔·반응형을 확인한다. 예전 JS 게시본을 보고 성공으로 판정하지 않게 배포 SHA와 요청 모듈도 확인한다.
8. checkout·실제 Actions·공개 URL 검증이 모두 충족되면 TS-02·TS-05·REV-01을 체크하고 007을 완료로 갱신한다. 실제 전환이 끝난 D-001의 대체 상태·D-004·목록·현재 구조를 함께 갱신하고, 승인된 범위에서 완료 기록을 후속 커밋한다.

문서만 후속 커밋한 경우 코드 검증 결과를 그대로 인정할 수 있지만, 게임 코드·의존성·타입/빌드/workflow 설정이 바뀌면 영향받는 checkout/CI 검증을 다시 수행한다.
GitHub 공식 참고: [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
