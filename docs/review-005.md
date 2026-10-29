# 005 게임 제어·타이머·완료 UI 검증·코드 리뷰 — 04

- 검토·실행일: 2026-10-26
- 대상: [005 태스크](../tasks/005-game-controls-timer.md)
- 기준: [아키텍처](../architecture.md)·[데이터/시간/UI 계약](plans/sudoku-mvp.md)·[리뷰 기준](review-checklist.md)·[D-002](decisions/002-unique-bounded-generation.md)·[D-003](decisions/003-state-input-and-time.md)
- 리뷰 상태: 검토 완료. 범위 내 발견 사항 수정·자동 재검증 수행.
- 완료 판단: **완료**. 기존 리뷰·수정·회귀와2026-10-26 사용자 잔여 검증 보고로 필수 조건을 충족했다. 아래 도구 실행 당시의 실패·차단 기록은 이력이다.
- Git 저장소·기본 브랜치가 없어 현재 코드·03 기록·이번 수정 범위로 검토했다. 실제 diff·브랜치·커밋·원격 쓰기는 미실행이다.

## 발견 사항과 수정

| 항목 | 문제·영향 | 수정 | 재현·재검증 |
|---|---|---|---|
| R1 / P2: 지연 close 이벤트의 중복 처리·포커스 이동 | render가 새 게임·초기화 때문에 dialog.close()를 호출한 뒤 브라우저의 close 이벤트가 나중에 오면, 기존 nativeClose는 현재 상태와 관계없이 CLOSE_COMPLETION_DIALOG와 새 게임 focus를 다시 실행했다. 정상 닫기 후 중복 이벤트도 같은 문제 | 마지막 렌더의 completionDialogOpen을 컨트롤에 보관하고 dismiss에서 열린 상태일 때만 처리. dispatch 전에 플래그를 내려 동기 렌더·지연 close 모두 한 번만 처리한다. 새 dialog가 이미 열려 있으면 기존 open 검사로 이전 이벤트를 무시 | 새 회귀2개 모두 수정 전 실패: 초기화 후 불필요 Action1개, 실제 닫기 후 Action2개. 수정 후 불필요 Action0개·중복 focus0개, 정상 닫기는 Action1개·focus1개 통과 |

수정 파일은 [controls.js](../src/ui/controls.ts), 회귀는 [game-controls.test.js](../tests/game-controls.test.js)다.
이 증거는 EventTarget 경계 double의 이벤트 순서 검사다. 실제 브라우저의 native close·Escape·focus를 관찰한 것으로 표현하지 않는다.

## 검토 범위와 판단

- 요청: selectedDifficulty와 activeDifficulty 분리, easy/normal/hard와35/45/50 빈칸, 새 요청의 controller abort·requestId 증가·기존 보드 제거·generating 입력 잠금 검토. 기존 실제 generator seed·유일해 검사는 전체 회귀에서 재실행했다.
- 경합/실패: 현재 요청·generating 상태·난이도 확인 후 결과 적용, 오래된 성공/실패/reject와 malformed stale payload 무시, 예상 밖 실패의 console 개발 근거·일반 사용자 안내·재시도 검토.
- 시간: performance.now 계열의 주입 시각, 초 내림·종료 시각 고정·100분 이상 표시,250ms 단일 interval, 새 게임/완료/dispose 정리 검토. 가짜 시계의 지연 tick·refreshTime을 검사했으며 실제 숨김 탭 동작은 미확인이다.
- 상태/입력: 기존 단서 보호·메모·충돌만 표시·완료 세 조건을 유지한다. 입력 후 main과 reducer가 완료를 확인한다. 실제 외부 폼·터치·포커스는 이번005에서 재관찰하지 못했다.
- UI: native dialog의 제목·설명·닫기 버튼·cancel의 preventDefault·새 게임 복귀, timer의 aria-live=off를 코드로 확인했다. 실제 배경 잠금·Escape·포커스 트랩·320px/1280px는 미확인이다.
- 수명주기: mountGame dispose에서 session/입력/컨트롤/visibility/abort 정리, pagehide snapshot과 복귀 재마운트 검토. 실제 BFCache는 별도 미확인이다.
- 환경: 외부 패키지/번들러 추가 없음. core에 DOM 의존성 없음. controls는DOM, time은 순수 함수, main은 효과 조정을 담당한다.
- 제외: 저장·새로고침 복구·일시정지·힌트·배포·실제 PR/병합. 새 ADR·후속 태스크는 발급하지 않았다.

## 실제 자동 검사

Windows PowerShell·기존 Node v24.22.1·npm CLI8.19.4. 전역 PATH·설치 변경 없음.

    $nodeBin = 'C:\Users\임용관\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
    $env:PATH = "$nodeBin;$env:PATH"
    & "$nodeBin\node.exe" --test tests/time.test.js tests/game-controls.test.js
    & "$nodeBin\node.exe" 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' test

| 검사 | 결과 |
|---|---|
| R1 신규2개만 수정 전 실행 | 0통과·2실패, exit1. 중복 Action과 포커스 경로 확인 |
| R1 수정 후 시간/제어 범위 | 18통과·0실패·0skip, exit0 |
| 네트워크 권한 승인 후 전체 npm test | **89개 중88통과·0실패·1skip**, exit0, 약7.96초 |
| node --check | main·controls·time·game-controls 검사·controls 개발 script 통과 |

skip은 기존 Windows junction 생성 EPERM이다. 이를 통과로 보고하지 않으며003/004의 이전 사용자 전체 통과를 새005의 증거로 대신하지 않는다.
주입 응답 double은 구조적 상태 흐름 검사이고 생성 유일해 증거는 기존 실제 엔진 회귀에서 확보한다.

## 브라우저·터치 시도와 한계

1. 새 소유 서버127.0.0.1:61879 PID41020은 listen 후 자체 fetch가 EACCES였다. closeServer·종료 로그·exit1로 정리했다.
2. 실제 오류 근거로 이번 턴의 네트워크 권한을 요청·승인받았다.
3. 새 서버127.0.0.1:54968 PID47060에서 /tests/browser/controls.html의 실제 HTTP200을 확인했다. 최대10분 유지·소유 marker 종료 방식이다.
4. 이전03의 앱 내 브라우저 연결 타임아웃 이력을 확인하고 이번04에서는 Computer Use 스킬로 실제 로컬 Chrome 대체 확인을 시도했다.
5. 기존 Chrome 창은 최소화 상태여서 복원을 시도했다. 이후 도구가 현재 브라우저 URL을 충분히 확인하지 못해 정책을 적용할 수 없다는 이유로 이번 턴의 Computer Use를 중단했다.
6. 중단 후 UI 입력·다른 UI 경로를 계속 시도하지 않았다. 실제 앱 화면·native dialog·touch·responsive·tab visibility·Console은 미실행이다. 이번04의 앱 내 브라우저 접속 성공/실패를 새로 관찰했다고 적지 않는다.
7. 임시 서버는 소유한 marker로 정리해 005_04_SERVER_CLOSED·exit0을 확인했다. 이전 서버나 다른 Node 프로세스는 종료하지 않았다.

HTTP200·Node 경계 double·자동 테스트는 실제 DOM·브라우저 ESM·키보드·터치 통과 증거가 아니다.
브라우저 버전·viewport·터치 장치·스크린샷도 이번 실행에서 확보하지 못했다.

## 완료 조건별 근거 — 사용자 확인 전

| 조건 | 근거·현재 판단 |
|---|---|
| CONTROL-01 | 실제 엔진 seed/유일해 회귀와 선택/요청 상태 검사 통과. 실제 난이도 UI 확인 남음 |
| CONTROL-02 | 경합·실패·재시도·abort·오래된 응답 자동 검사와 코드 검토 통과. 실제 생성/잠금/실패 UI 남음 |
| CONTROL-03 | 순수 시간·단일 interval·정지·초기화·늦은 tick 검사 통과. 실제 탭 전환·표시 관찰 남음 |
| CONTROL-04 | 완료 세 조건·입력 잠금·dialog 플래그·R1 이벤트 경계 수정 통과. 실제 native modal·Escape·닫기·포커스 남음 |
| CONTROL-05 | 반복 요청·정리·HTTP 자산·전 회귀 통과(skip은 별도). 실제320px/1280px·키보드·터치·콘솔 남음 |
| DOC-01 | 현재 구조·기록·상태·ID·링크 동기화 검사 |
| REV-01 | 코드 검토·수정·재검증 수행. 필수 실제 UI 검증이 남아 완료 게이트 미충족 |

확인한 코드 범위의 결함은 수정했다. 필수 검증의 공백이 있으므로 작업은 완료가 아니다.

## 수동 확인 안내 — 사용자 확인 전

[03 구현 기록의 실행 명령·수동 절차](controls-005.md)를 따른다. 추가로 R1 수정 영향은 다음처럼 확인한다.

- 완료 직전 fixture에서1행3열4 입력 → 닫기 버튼 포커스·시간 정지·입력 잠금.
- 닫기와Escape를 각각 확인해 새 게임 버튼으로 복귀. 이후 다른 컨트롤을 선택했을 때 지연 close가 포커스를 다시 가져가지 않는지 확인.
- 완료 dialog가 열린 상태에서 개발 fixture 교체·새 게임 상태 전환 후 보드/드롭다운 포커스가 불필요하게 새 게임으로 이동하지 않는지 확인.
- 실제 난이도 선택·연속 새 게임·지연/실패 fixture·재시도·숨김 탭 경과 포함·320px/1280px·터치·외부 폼·콘솔 오류 없음·서버 종료.
- 브라우저 이름/버전·viewport·실제 터치 또는 에뮬레이션 환경·관찰 결과를 기록한다. 실제 BFCache는 별도 확인 항목이다.

결과를 같은005에 반영해 완료 조건을 재평가한다. 이번에는05 초안이나 실제 Git 작업을 진행하지 않았다.
## 문서 확인 — 도구 실행 당시

Markdown34개·내부 파일 링크440개 검사, 깨진 링크0개. 005는 차단됨·검토 완료, 필수CONTROL-01~05·REV-01 미체크와 작업 목록 상태가 일치한다.
마지막 전체 테스트 이후 변경은 문서뿐이다. 실제 Git·원격 쓰기는 없으며 새 설계 결정은 발급하지 않았다.
## 사용자 최종 확인·완료 판단 — 2026-10-26

사용자가 안내 절차대로 테스트89개 모두 통과와 난이도·새 게임·타이머·실패 재시도·오래된 응답 무시·완료 대화상자·포커스·터치·반응형·콘솔 오류 없음·서버 종료를 확인했다고 보고했다.
이 보고는 사용자 환경의 실제 확인이며 Codex 직접 브라우저 관찰이 아니다. 이전88통과·1skip·네트워크 실패·Computer Use 중단은 당시 증거로 보존한다.

| 조건 | 최종 근거 |
|---|---|
| CONTROL-01 | 기존 실제 엔진 회귀·상태 검사와 사용자 난이도/새 게임 확인으로 충족 |
| CONTROL-02 | 경합·취소·실패/재시도 자동 검사 및 사용자 절차 확인으로 충족 |
| CONTROL-03 | 시간·tick·정지/초기화 자동 검사와 안내 절차에 따른 사용자 타이머 확인으로 충족 |
| CONTROL-04 | 완료 계약·R1 수정 회귀 및 사용자 대화상자/포커스 확인으로 충족 |
| CONTROL-05 | 반복 정리·HTTP 회귀와 사용자89개 통과·터치/반응형/콘솔/서버 종료로 충족 |
| DOC-01 / REV-01 | 문서 정합성·코드 리뷰·R1 수정/재검증·사용자 잔여 확인으로 충족 |

따라서005 차단을 해제하고 완료일을2026-10-26으로 기록했다. 확인된 범위 내 중대한 미해결 결함은 없다.
브라우저 버전·정확한 viewport·터치 장치/에뮬레이션 구분·원시 로그·스크린샷은 미제공이다. 실제 BFCache 복귀는 별도 미확인이다.
[05 커밋 메시지·PR 초안](pr-drafts/task-005.md)을 작성했다. 이번 요청은 문서만 변경했으므로 테스트를 다시 실행하지 않았다. 실제 Git·원격 쓰기는 없다.
## 완료·05 문서 최종 점검 — 2026-10-26

Markdown35개·내부 파일 링크473개·깨진 링크0개를 확인했다. 005는 완료·미체크0개이며001~005 완료 목록과 일치한다.
이번 요청은 문서 갱신과 로컬 초안 작성만 수행했다. 코드 변경·테스트 재실행·Git/원격 쓰기는 없다. 06 인수 검증은 별도 단계로 남겼다.

> 007 전환 안내: 위 과거 기록의 .js 파일명은 당시 구현을 뜻한다. 소스 링크는 이동한 현재 .ts 파일을 가리키도록 갱신했다. 브라우저 출력은 계속 .js다.
