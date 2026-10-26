# 004 커밋 메시지·PR 초안 — 05

- 작성일: 2026-10-26
- 대상: [004 입력·상태](../../tasks/004-user-interaction.md) — 완료
- 브랜치 제안: feat/task-004-user-interaction — 실제 미생성
- 로컬 초안. 실제 스테이징·커밋·푸시·PR 생성·병합 미실행.
- 비교 한계: Git 저장소·기본 브랜치·실제 diff 기준이 없다. 현재 구현·리뷰・사용자 검증을 기준으로 작성했으며 실제 반영 전 범위를 대조한다.

## 권장 커밋 메시지

    feat(input): add sudoku player input and immutable game state

    Connect keyboard, pointer, number pad and pencil marks to store actions.
    Protect clues, show rule conflicts and lock completed boards.
    Fix focused-cell routing, binding cleanup and initial note validation.
    Add regression coverage and document user-verified completion.

관련 UI·상태·테스트·문서를 하나의 기능 변경으로 묶는다.

## PR 제목

    feat(input): 스도쿠 플레이어 입력과 불변 상태 관리 구현

## PR 본문 초안

### 문제와 변경 후 동작

보기 전용 보드에 입력 흐름이 필요했다. 이제 클릭·터치·방향키·숫자·삭제·화면 패드·메모를 Action으로 연결한다. 단서는 보호하며 충돌은 색상 외에도 안내하고 유효 완성 후 입력을 잠근다.

### 변경 범위

- [game-state.js](../../src/core/game-state.js): 순수 reducer·store·불변 복사·독립 Set·구독 정리·재진입 큐·완료 메타데이터.
- [events.js](../../src/ui/events.js): 위임 click·keydown·외부 폼 보존·선택/포커스 연결·중복 바인딩 방지.
- [main.js](../../src/main.js), [HTML](../../index.html), [CSS](../../styles/main.css): 생성·store·렌더·입력 도구·충돌·완료 잠금·정리 연결.
- [상태 검사](../../tests/game-state.test.js)·[이벤트 검사](../../tests/input-events.test.js)·[HTTP 검사](../../tests/server.test.js), [개발 fixture](../../tests/browser/interaction.html) 추가·확장.
- 외부 의존성 없음. 새 게임·난이도 UI·시간 표시·완료 dialog는005 범위.

### 리뷰 수정

R1: 키 입력 전 실제 포커스 셀을 선택한다. R2: 반복 unbind가 새 소유권을 삭제하지 않도록 보호한다. R3: 초기 notes의81개 own index·Set·1~9 정수 계약을 검증한다.
회귀3개는 수정 전 실패·수정 후 통과했다. [04 리뷰](../review-004.md) 참조.

### 검증·환경·출처

| 수행 주체 | 검사 | 결과 |
|---|---|---|
| Codex04 | Windows PowerShell·Node24.22.1·npm CLI8.19.4, npm test | 71개 중70통과·0실패·1skip(junction EPERM), exit0 |
| Codex04 | 상태14개·키/이벤트 경계4개 | 18개 통과; EventTarget double은 실제 DOM 증거가 아님 |
| 사용자 / 2026-10-26 | 안내 절차의 전체 테스트 | 71개 모두 통과 보고 |
| 사용자 실제 검증 | 입력·메모·충돌·포커스·외부 폼·완료 잠금·터치·반응형 | 확인 보고 |
| 사용자 실제 검증 | 콘솔 오류 없음·서버 종료 | 확인 보고 |

이전 도구 타임아웃·EPERM skip은 당시 이력으로 보존한다. 사용자 결과는 Codex 직접 관찰이 아니다.
원시 로그·브라우저 버전·터치 장치·정확한 viewport·스크린샷 미제공. 실제 BFCache 복귀는 별도 미확인이다.
이번05는 문서 수정으로 테스트를 다시 실행하지 않았다.

### 스크린샷

미첨부. 실제 캡처 파일이 없다.

### 영향·후속 관계

INPUT-01~05·DOC-01·REV-01 충족. 범위 내 확인된 결함은 수정했다. getState는 계약상 읽기 전용이다.
D-003 상태·입력·완료 메타데이터를 적용했으며005 시간·게임 제어 UI는 후속이다. HTTP·Native ESM·Node22 이상 개발 환경이 필요하다.
기본 흐름은002·003·004 선행 코드를 기본 브랜치에 반영한 뒤005를 진행한다. 현재 Git 반영은 별도이며 실제 diff 확인이 필요하다.

### 관련 문서

[004 태스크](../../tasks/004-user-interaction.md)·[작업 목록](../../tasks/README.md)·[아키텍처](../../architecture.md)·[계약](../plans/sudoku-mvp.md)·[D-003](../decisions/003-state-input-and-time.md)·[03 기록](../input-004.md)·[04 리뷰](../review-004.md)·[005](../../tasks/005-game-controls-timer.md).