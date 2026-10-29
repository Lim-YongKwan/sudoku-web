# 009 숫자 스톡·보조 옵션 기반 — 03 구현

- 날짜: 2026-10-29
- 작업: [009](../tasks/009-digit-stock-options.md), 완료 — 사용자 최종 확인2026-10-29
- 현재 검증: [04 리뷰·사용자 최종 확인](review-009.md)을 우선한다. 아래03·04 중간 결과/대기 문구는 당시 이력이다.
- 브랜치: feat/task-009-digit-stock-options, 기준 main 17ab007
- 선행: [008 실제 병합·공개 배포](deployment-008.md) 완료. 시작 시main/origin/main 동기화·미커밋 변경 없음 확인.

## 구현과 계약

- types.ts에 readonly Assistance 두 boolean과 SET_ASSISTANCE(option, enabled) Action을 추가했다. 초기 상태와 표시용 snapshot은 두 옵션false다.
- game-state.ts는 옵션 이름/boolean을 런타임 검증한다. playing에서만 옵션을 변경하고 기존 board/notes/selection/timer/difficulty 참조를 보존한다. 같은 값 설정은no-op다. 저장소에 옵션을 기록하지 않는다.
- createGameStore는 초기 assistance를 검증·복사해 호출자 객체와 분리한다. NEW_GAME_REQUESTED는 초기 상태로 재구성해 두 옵션을false로 돌린다. 실패 재요청도 같은 경로다. 새로고침은 모듈 초기 상태부터 시작한다. 013 불러오기는 아직 없으며 그 작업에서 같은 초기화를 연결한다.
- core/digit-stock.ts의 getDigitStock(values)는 values만 한 번 세어1~9의 digit/usedCount/remaining/exhausted를 반환한다. puzzle을 더하지 않고notes를 받지 않으며 정답/유효성 판단도 하지 않는다. 남은 수는max(0,9-usedCount),9개 이상도 입력을 막지 않는다.
- ui/controls.ts는 native checkbox를 연결·동기화하고 생성/완료/오류에서 기존 입력 잠금과 함께 잠근다. 토글은 보드 포커스를 강제로 옮기지 않는다. listener는dispose에서 정리한다.
- ui/digit-stock.ts는 패드의 회색 class·남은 수 data 속성·사용/남은 수 aria-label을 파생 렌더링한다. OFF면 추가class/개수/도움말을 지우고 기본 입력 이름으로 복원한다. disabled는 변경하지 않는다.
- 패드 아래의 n/9는 남은 스톡을 뜻하며 도움말에 회색은 사용량이고 추가 입력 가능하다고 설명한다. 키보드/터치는 기존 events.ts 경로를 유지한다.
- highlightMatchingDigits는 상태/Action 기반만 마련했다. UI·같은 숫자 강조·최근 입력·취소·저장은 구현하지 않았다. D-005의009 부분 반영이며 새 ADR은 없다.

## 개발 검증 페이지

[stock.html](../tests/browser/stock.html)·[stock-checks.js](../tests/browser/stock-checks.js)는 실제 mountGame/store/입력/컨트롤을 연결한다. 8/9/10개 사용 표본, 완료 직전, 첫 실패·지연/오래된 응답 시연과 실측 검사 버튼을 제공한다.
스톡 표본은 의도적인 중복 숫자가 있는 비교 데이터이며 플레이 가능한 퍼즐이 아니다. 단서9 한 개는values에 이미 포함되어 있고 메모9는 집계에서 제외한다. 각 표본 버튼은 별도 게임을 만들므로 옵션을OFF로 초기화한다.
기존 controls.html·interaction.html에도 동일 스톡 토글을 연결했다. 모든 개발 fixture는 .build에만 복사하며 dist에는 포함하지 않는다.

## 실제 자동·서버 검증

- Node24.22.1, 기존 고정 TypeScript. 패키지 설치·전역 PATH 변경 없음.
- npm run typecheck·npm run build:dev·npm run build 통과.
- 관련11개 모두 통과. 집계/비정상 보드,8→9→10→9→8,독립 옵션과불변 참조,초기/새 요청/실패 재시도,런타임 검증·호출자 분리,OFF 복원·잠금,checkbox 이벤트 정리,회색 버튼 입력,타이머 연속성을 검사했다.
- npm test:116개 중115통과·0실패·1skip(Windows directory links EPERM). skip을 통과로 표시하지 않는다.
- stock-checks.js의 node --check 통과.
- 직접 HTTP로9개 자산의200·정상 MIME을 확인했다. /,CSS,core/digit-stock.js,ui/digit-stock.js,ui/controls.js,core/game-state.js,main.js,stock.html,stock-checks.js.
- dist의 신규 모듈·checkbox·CSS와 개발 fixture 제외를 확인했다.
- npm start:포트63305/PID44236 시작·Ctrl+C 정상 종료 안내. 별도 직접 서버55699는closeServer 후ECONNREFUSED 확인.

## 브라우저 시도와 미확인 범위

computer-use로 Chrome을 선택해 활성화/화면 관찰을 시도했으나 도구가 현재 URL을 충분히 확인할 수 없다는 정책상 이유로 중단했다. 이후 화면 조작을 중단하고 검증 서버를 종료했다.
실제 DOM 검사 실행·키보드/터치·스크린리더·320px/1280px·콘솔 오류 없음은 미확인이다. EventTarget/표시 경계 double과HTTP 응답은 이 관찰을 대신하지 않는다.

## 04에서 이어갈 수동 절차

Node22 이상을 선택한 프로젝트 PowerShell에서 순서대로 실행한다. 이 컴퓨터의 명시적 Node/npm 경로는README를 따른다.

~~~powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
$env:PORT = '8082'
npm.cmd start
~~~

1. 실제 게임의 스톡 토글이 처음OFF인지 확인한다. 보조 옵션에는 스톡 토글만 있어야 한다. ON 상태에서 다음 난이도를 바꿔도 현재 옵션/보드/타이머는 유지되고 새 게임을 누르면 두 옵션이 초기화되어 스톡이OFF여야 한다.
2. 서버 주소의 /tests/browser/stock.html에서 “스톡8개”를 누른 뒤 스톡을ON한다. 패드9는1/9이며 회색이 아니어야 한다. 선택 칸(1행9열)에 패드9로 입력하면9개·0/9·회색이다.
3. 2행1열을 선택해 회색9 버튼으로 입력한다.10개가 되어도 입력되고0/9·회색을 유지해야 한다. 그 칸 지우기→9개 유지,1행9열 지우기→8개·1/9·회색 해제를 확인한다.
4. 메모가 있는3행3열의9는 스톡에 포함되지 않아야 한다. 메모 입력/삭제로 스톡이 바뀌지 않는지 확인한다. 토글OFF면개수·회색·추가 aria-label/도움말을 제거해야 한다.
5. 각 표본과ON/OFF 상태에서 “스톡 실측 검사”를 눌러checks 모두true를 확인한다. 이 버튼은 육안·터치·스크린리더 확인을 대신하지 않는다.
6. “완료 직전”에서스톡ON 후선택된1행3열에4를 입력한다. 완료 dialog·포커스 복귀와완료 후패드/토글 잠금을 확인한다. “첫 요청 실패”의다시 시도 및 “첫 요청 지연”→새 게임→오래된 응답 전달도 확인한다. 생성/새 요청은스톡OFF여야 한다.
7. 실제 게임과fixture를새로고침해OFF 초기화를 확인한다.320px/1280px에서 n/9 잘림·가로 넘침·타이머/보드/옵션 레이아웃,Tab/Space로checkbox,회색 패드버튼 입력,터치와포커스를 확인한다. 콘솔 오류도 확인한다.
8. Ctrl+C 종료 안내와새로고침 연결 실패를 확인한다. 실제 기기/브라우저와결과를작업 문서에 기록하고04 리뷰로 이어간다.

## 남은 작업

실제 UI/터치 검증·권한skip 확인과04 리뷰가 남아009는진행 중이다. 커밋·push·PR/배포 변경은 하지 않았다.010~013을 시작하지 않았다.

## 문서 정합성

변경/신규 문서의 로컬 링크206개에서 깨진 링크0개를 확인했다. 작업009·목록은 진행 중이며 D-005는009의 부분 반영만 기록했다. git diff --check를 통과했고 HEAD는17ab007을 유지한다. 커밋·push·010~013 태스크 변경은 없다.

## 04 후속 — 2026-10-29

[리뷰 기록](review-009.md)에 R1 패드 누락의 거짓 통과·R2 실제 개수 표시/내용 크기·checkbox label/도움말 검증 보강을 기록했다. 개발 페이지는stock-assertions.js로 측정 판정을 분리했고 관련3개 회귀를 추가했다. 관련 총14개·전체119개 중118통과·0실패·1 권한skip,타입/빌드·HTTP10개 자산·종료를 확인했다. 제품의 스톡/상태 규칙은 그대로다. 브라우저는 URL 확인 불가로 중단해 실제 UI/터치는 대기 중이며009는 진행 중이다. 커밋·push는 하지 않았다.

## 사용자 최종 확인·완료와05 — 2026-10-29

사용자는 안내 절차에 따라 테스트119개가 모두 통과했고, 스톡 집계·회색 버튼 입력·메모 제외·옵션 초기화·실패 재시도·완료 잠금·반응형·키보드·터치·접근성·콘솔 오류 없음·서버 종료를 확인했다고 보고했다.
[04 최종 기록](review-009.md)에 근거해009를 완료하고 [05 초안](pr-drafts/task-009.md)을 작성했다. 이전 도구skip/UI 중단은 보존한다. 브라우저 이름/버전·실기기와 터치 에뮬레이션 구분·스크린리더 종류·원시 로그·스크린샷은 미제공이다. 특정 기기에서 직접 관찰했다고 기록하지 않는다.
커밋·push·PR 생성·병합·배포는 하지 않았고010~013은 시작하지 않는다.
