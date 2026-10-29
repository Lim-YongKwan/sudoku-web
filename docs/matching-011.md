# 011 셀 선택 기준 같은 숫자 강조 — 03 구현 기록

- 일자: 2026-10-29. 현재 상태: 완료・PR #5 main 병합・Actions 배포・사용자 공개 확인 완료. 아래 03 시점의 대기 문구는 당시 이력이다.
- 기반: 깨끗한 main 1dda61d (010 병합·배포·공개 확인 문서 반영). 브랜치: feat/task-011-matching-digit-highlight.
- [작업011](../tasks/011-matching-digit-highlight.md), [D-005](decisions/005-assistance-highlights-and-undo.md), [후속 계약](plans/sudoku-next-iteration.md).

## 실제 구현

- 기존 readonly assistance.highlightMatchingDigits와 SET_ASSISTANCE를 그대로 사용한다. 새로운 상태 스냅샷·Action·라이브러리·타이머를 추가하지 않았다.
- 옵션ON·playing·선택 셀의 현재 values가1~9일 때 같은 값을 가진 모든 셀을 파생 matching 모델로 표시한다. 단서·사용자 입력·충돌 숫자를 모두 포함하고 빈칸·메모는 제외한다.
- 선택 셀이 빈칸/null이거나 옵션OFF·생성/실패/완료 상태면 모두 해제한다. 입력·덮어쓰기·삭제·방향키 후 현재 상태에 즉시 따라간다. 새 게임의 두 옵션false 초기화는 기존 reducer를 유지한다.
- controls.ts가 같은 숫자 체크박스의 change/render/dispose를 소유한다. 초기/새 게임/새로고침은OFF이며 playing 외에는 잠근다. 스톡과 독립적인 native checkbox/label/도움말을 제공한다.
- board.ts가 .is-matching과 접근성 이름 선택한 숫자와 같음을 투영한다. 선택 상태와tabstop은 여전히한 칸이다. 모든 칸을 실제 선택하거나 수정하지 않는다.
- CSS는 연한 파란 배경, 일치 단서에는 별도 배경, 선택된 일치 셀에는 선택 배경을 사용한다. 기존 단서 굵기·최근 입력의 갈색 밑줄·충돌 inset 테두리/느낌표·포커스 outline을 유지한다. 실제 색/겹침·가독성은 아직 화면 확인이 필요하다.
- 메인·interaction/controls/stock 개발 화면에 토글을 노출하고 interaction에assistance/matchingIndices, controls에assistance/matchingCount를 보고한다. fixture는개발출력만 포함한다.
- 이벤트 라우터는 변경하지 않았다. 셀 클릭·터치·방향키를 같은 선택 계약으로 처리하고 숫자 패드는 기존 입력만 수행한다. 회색 스톡 버튼도 기존 입력 가능 규칙을 유지한다.
- 012 실행 취소·013 저장, 후보/정답 추천·숫자 우선 입력·옵션 영구 저장은 구현하지 않았다. 공통 규칙 변경이 없어 AGENTS.md는 수정하지 않았다.

## 자동 검증

Node v24.22.1과기존고정TypeScript를 사용했다. 설치·전역환경·배포설정은변경하지않았다.

| 명령/검사 | 결과 |
|---|---|
| npm run typecheck / npm run build:dev | 통과 |
| node --test tests/matching-digit.test.js | 신규8개 모두통과 |
| npm test | 총141개: 140통과·0실패·1skip. 기존Windows디렉터리링크생성EPERM |
| npm run build | 통과, 깨끗한dist |
| HTTP | /, CSS, board.js, controls.js, interaction.html/checks.js, controls.html, stock.html의8경로200·개발출력본문일치·JS MIME 확인 |
| 배포 경계 | dist에tests/docs/TS/소스맵미포함 확인 |
| 서버 종료 | npm start의임시포트62599 서버Ctrl+C 종료로그·재접속ECONNREFUSED, 별도HTTP검사서버close 후ECONNREFUSED 확인 |

신규검사는단서/입력/메모구분·현재값파생·선택/방향키·덮어쓰기/삭제·해제/초기화·옵션4조합/최근/충돌/단일선택/탭정지·토글change/잠금/dispose·불법옵션투영거부를검증한다. 기존스톡·회색버튼입력·이벤트·완료/타이머회귀도전체검사에서통과했다.

## 브라우저 시도와 남은 확인

최신개발출력을npm start로실행하고IAB에서 /tests/browser/interaction.html을열었으나 net::ERR_CONNECTION_TIMED_OUT으로실제 DOM·화면·터치·콘솔을확인하지못했다. HTTP200은브라우저ESM실행의증거로대체하지않는다. 재시도를반복하지않았고검증서버는종료했다.

04에서코드리뷰·필수브라우저/터치검증·발견사항수정/재검증후완료를판단한다. 다음수동절차는아직미실행이다.

1. README의Node22+ 환경을선택하고 npm test, npm start를실행한다. 서버가출력한HTTP주소를사용한다.
2. /tests/browser/interaction.html에서두옵션이OFF인지확인한다. 같은숫자ON 후고정1행1열5를선택하면단서5들이강조되고다른값/빈칸은강조되지않아야한다.
3. 빈1행3열선택시전체해제. 5를입력하면기존5들과함께강조되며중복느낌표/테두리·최근밑줄·선택/포커스가모두식별돼야한다. 다른숫자로덮어쓰면새숫자기준으로바뀌고삭제하면해제돼야한다.
4. 같은칸에메모5만넣고고정5선택시메모칸은강조하지않아야한다. 보고서matchingIndices는values에서선택값과같은인덱스만포함한다.
5. 클릭·방향키·터치탭으로값있는칸/빈칸을번갈아선택한다. 같은숫자ON/OFF와스톡ON/OFF의4조합,회색스톡버튼입력,외부텍스트폼입력,단서수정불가를확인한다. 선택/탭정지는한칸이며토글로불필요하게포커스를옮기지않아야한다.
6. 완료직전fixture에서옵션ON→1행3열4입력시completed/matchingIndices=[]/옵션잠금을확인한다. controls.html에서는완료dialog·닫기·포커스도확인한다. 새게임·실패/재시도·새로고침은두옵션OFF·잔여강조없음을확인한다.
7. 메인게임과320px/1280px·터치모드에서같은절차를반복한다. 단서/선택/최근/충돌/포커스가겹쳐도식별되고가로넘침이없어야한다. Console오류와ESM로드실패가없어야한다.
8. Ctrl+C로서버종료후접속불가를확인한다.

현재브랜치HEAD는1dda61d이며커밋·push·PR·배포를하지않았다. 다음04의대상은tasks/011-matching-digit-highlight.md다.

## 011의04 리뷰 — 2026-10-29

[리뷰·수동 절차](review-011.md): 개발스톡검증의이전토글부재조건을수정하고matching DOM/접근성·토글판정과회귀4개를보강했다. 관련12개통과·전체145개중144통과/1권한skip·타입/빌드·HTTP/종료확인. 실제UI/터치는사용자확인대기로진행중이며커밋·push·012구현은하지않았다. 앞선03검증대기문구는당시이력이다.

## 011 사용자 최종 확인·완료·05 — 2026-10-29

사용자는 안내 절차에 따라 테스트 145개가 모두 통과했고, 같은 숫자 강조·메모 제외·옵션 조합·회색 버튼 입력·완료 시 해제·포커스·터치·반응형·콘솔 오류 없음과 서버 종료를 확인했다고 보고했다.

[04 최종 기록](review-011.md)에서 사용자 보고를 근거로 MATCH-03/REV-01을 충족한 것으로 판정했다. 도구의 이전 144통과/1권한skip과 03 시간 초과·04 UI 미시도는 당시 이력으로 보존한다. 원시 로그·스크린샷·브라우저/기기 버전·실기기/에뮬레이션 구분은 미제공이며 도구 직접 관찰로 표현하지 않는다.

[05 커밋 메시지·PR 초안](pr-drafts/task-011.md)을 작성했다. 이번에는 문서만 갱신해 기능 검사를 재실행하지 않았다. 검토 범위 내 중대한 미해결 문제는 확인되지 않았다. 로컬 완료는 원격 CI·병합·배포 완료를 뜻하지 않으며 커밋·push·012/013 구현은 하지 않았다. D-005는 같은 숫자 강조까지 부분 적용한 상태다.

## 011 병합·배포·공개 확인 — 2026-10-29

011은 구현 1d03c53을 PR #5로 main 4a2edad에 병합했고, Actions 40843161441의 validate/deploy 성공·145개 전체 통과와 사용자 공개 화면의 같은 숫자 강조·옵션 초기화 정상 확인까지 마쳤다. 012~013은 예정이며 구현하지 않았다.

[최종 배포 기록](deployment-011.md)에 PR/병합 커밋·Actions 검증·사용자 공개 확인 근거를 모았다. 공개 동작은 사용자 보고이며 도구 직접 관찰과 구분한다. 이전 미커밋·미배포·확인 대기 문구는 각 단계 당시 이력이다. 이번 후속 변경은 문서만 main에서 커밋·push하는 작업이다.
