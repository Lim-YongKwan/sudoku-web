# 003 커밋 메시지·PR 초안 — 05

- 작성일: 2026-10-23
- 대상: [003 보드 렌더링·스타일](../../tasks/003-board-rendering.md) — 완료
- 브랜치 제안: feat/task-003-board-rendering — 실제 미생성
- 상태: 로컬 초안. 실제 스테이징·커밋·푸시·PR 생성·병합 미실행
- 비교 한계: 프로젝트에 독립된 Git 저장소·기본 브랜치가 없어 실제 diff·추적 상태·대상 브랜치는 미확인이다. 현재 구현·03 기록·04 리뷰·사용자 최종 검증을 기준으로 작성했다. 저장소 준비 후 001·002 선행 코드와 003의 실제 변경 범위를 대조한다.

## 권장 커밋 메시지

표시 UI·초기 생성 연결·검증 페이지·회귀 검사·관련 문서를 하나의 기능 변경으로 묶는다. 실제 스테이징 범위가 같은지 확인한 뒤 사용한다.

    feat(ui): render responsive sudoku board with accessible cells

    Connect initial easy puzzle generation to a persistent 81-cell board.
    Add box borders, clue styles, focus indicators and responsive layout.
    Cover display models, fixture checks and cached-page initialization.
    Document review fixes and user-verified task 003 completion.

## PR 제목

    feat(ui): 실제 퍼즐과 연결한 반응형 스도쿠 보드 표시 구현

## PR 본문 초안

### 해결하는 문제와 변경 후 동작

엔진이 생성한 퍼즐을 브라우저에서 확인할 보드가 필요했다. 이제 HTTP 페이지 진입 시 실제 easy 퍼즐을 생성해 81개 셀에 표시한다. 고정 단서·빈칸·3×3 경계·셀 이름·포커스를 제공하고 생성 실패는 빈 비활성 보드와 안내로 표시한다.

현재 화면은 보기 전용이다. 플레이어 숫자 입력·방향키 이동·메모 조작·새 게임·타이머는 후속 작업에서 연결한다.

### 포함·제외 범위

- 포함: 보드 마운트·상태·범례, 9열 Grid·정사각 셀·반응형 CSS, 입력 불변 renderer, 실제 초기 생성 연결, 고정 fixture·실패 주입·검증 페이지, 관련 테스트와 문서.
- 제외: 정식 store·Action·입력 이벤트·숫자 패드·난이도 변경·새 게임·타이머·완료 dialog.
- 외부 npm·CDN 패키지·번들러는 추가하지 않았다. core·utils는 DOM과 분리했다.

### 주요 파일과 동작

| 파일 | 변경 |
|---|---|
| [index.html](../../index.html)·[main.css](../../styles/main.css) | 시맨틱 보드 영역·보기 전용 안내·상태·범례, Grid·3×3 경계·단서·포커스·반응형 |
| [src/ui/board.js](../../src/ui/board.js) | 읽기 전용 표시 모델, WeakMap으로 81셀·내부 span 재사용, 셀 의미·선택·메모·충돌 표시 |
| [src/main.js](../../src/main.js) | easy 생성 성공 검증·표시 상태·로딩/실패·pagehide 취소·캐시 복귀 재초기화 |
| [board.html](../../tests/browser/board.html)·[board-checks.js](../../tests/browser/board-checks.js) | 앱과 분리된 고정 fixture, DOM/포커스/불변 검사, 실패 주입·복원 |
| [board-assertions.js](../../tests/browser/board-assertions.js) | DOM 측정값을 명시적 boolean 합격 조건으로 변환 |
| [board-rendering.test.js](../../tests/board-rendering.test.js)·[server.test.js](../../tests/server.test.js) | 표시·수명주기·판정 회귀와 새 보드 자산 HTTP/MIME 검사 |

- 앱은 실제 생성 퍼즐만 사용하고 테스트 fixture·정답 공개 버튼을 포함하지 않는다.
- puzzle/values는 별도 복사, notes는 셀별 독립 Set이다. renderer는 원본 상태를 변경하거나 입력 이벤트를 등록하지 않는다.
- 정식 store 없이 계획의 표시용 GameState 필드를 사용한다. 타이머는 시작하지 않는다.
- 오류는 values의 충돌로 표시하며 저장된 정답과 비교하지 않는다.

### 리뷰에서 해결한 사항

- selectedIndex=null일 때 모든 셀이 tabIndex=-1이던 문제를 수정했다. 첫 빈칸 또는 첫 셀을 Tab 진입점으로 사용하고 원본 선택 상태는 유지한다.
- 검증 페이지가 '1px' 경계를 합격 판정에서 무시하고 0×0 셀을 정사각형으로 판단할 수 있던 경로를 보완했다. facts와 checks를 분리하고 모든 boolean 검사가 true일 때만 합격한다.
- pagehide로 취소된 초기 생성이 캐시 복귀 후 재개되지 않던 경로를 보완했다. 새 signal로 재초기화하고 listener 정리를 제공한다.

### 검증 결과와 출처

| 수행 주체 | 절차 | 결과 |
|---|---|---|
| Codex 04 자동 검사 | Windows PowerShell·Node v24.22.1·npm CLI 8.19.4, npm test | 53개 중 52 통과·0 실패·1 skip, exit 0 |
| Codex 범위 검사 | 표시/판정/수명주기 9개·엔진 25개·자산 HTTP·CLI 수명주기 | 통과. 서버 19개 중 18 통과·1 skip |
| 사용자 최종 자동 검사 | 안내 절차의 전체 테스트 재실행 | 53 통과·0 실패·0 skip 보고 |
| 사용자 실제 UI | 실제 보드, 320px·1280px, fixture checks, 포커스·접근성 | 확인 보고 |
| 사용자 실패·정리 | 실패 주입·복원·콘솔 오류 없음·서버 종료 | 확인 보고 |

사용자 최종 보고는 2026-10-23 대화 확인을 근거로 한다. 이전 도구의 junction 생성 EPERM·브라우저 타임아웃은 당시 이력으로 보존하며 사용자 결과를 Codex 직접 관찰로 표현하지 않는다.

원시 테스트 로그·브라우저 이름/버전·스크린샷·사용자 서버 PID는 미제공이다. 실제 BFCache 복귀는 별도 보고가 없어 미확인이다. 해당 수정은 EventTarget 자동 검사로 검증했으며 실제 브라우저 캐시 복귀를 통과했다고 쓰지 않는다.

이번 05 작업은 문서 작성으로 테스트를 재실행하지 않았다. 세부 명령·실패 재현·수정·조건별 판단은 [04 리뷰 기록](../review-003.md)을 따른다.

### 스크린샷

미첨부. 실제 캡처 파일을 전달받지 않아 이미지나 경로를 생성하지 않았다.

### 영향·제약과 다음 작업

- 003의 필수 BOARD-01~04·DOC-01·REV-01은 기존 리뷰와 사용자 잔여 확인으로 충족했다. 범위 내 중대한 미해결 문제는 없다.
- D-003의 읽기 전용 상태→렌더만 반영했다. 상태 store·입력·시간까지 구현 완료한 것은 아니며 새 ADR은 없다.
- 001의 HTTP·Native ESM·Node 22 이상 환경과 002 엔진이 선행이다. file:// 실행은 지원하지 않는다.
- 시간·생성·입력 조정은 후속 store·효과 흐름으로 확장한다. 실제 BFCache 관찰의 한계는 위에 명시했다.
- 004 입력·상태 관리의 직접 선행은 002·003이다. 팀 검토 후 선행 코드가 기본 브랜치와 현재 체크아웃에 반영된 다음 004를 시작한다. 004·005는 예정이다.

### 관련 문서

- [003 태스크](../../tasks/003-board-rendering.md), [작업 목록](../../tasks/README.md)
- [현재 아키텍처](../../architecture.md), [실행 안내](../../README.md)
- [D-001 HTTP·ESM](../decisions/001-native-esm-and-tooling.md), [D-003 상태·UI 계약](../decisions/003-state-input-and-time.md)
- [설계·데이터 계약](../plans/sudoku-mvp.md)
- [03 구현·수동 절차](../board-003.md), [04 리뷰·사용자 최종 확인](../review-003.md)

## 실제 반영 전

Git 저장소·기본 브랜치를 준비한 뒤 실제 diff·스테이징 파일·선행 코드 반영 상태와 이 초안을 대조한다. 이 파일은 PR 생성·병합의 증거가 아니다. 승인된 범위에서 실제 커밋·푸시·PR·리뷰·병합을 수행한 뒤 다음 작업으로 진행한다.