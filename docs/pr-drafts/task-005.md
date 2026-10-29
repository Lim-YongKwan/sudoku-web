# 005 커밋 메시지·PR 초안 — 05

- 작성일: 2026-10-26
- 대상: [005 게임 제어·타이머·완료 UI](../../tasks/005-game-controls-timer.md) — 완료
- 브랜치 제안: feat/task-005-game-controls-timer — 실제 미생성
- 상태: 로컬 초안. 실제 스테이징·커밋·푸시·PR 생성·병합은 미실행이다.
- 비교 한계: 프로젝트와 상위 폴더는 Git 저장소가 아니며 실제 diff·기본 브랜치·추적 상태가 없다. 현재 구현·03 기록·04 리뷰·사용자 최종 검증을 기준으로 작성했다. 실제 반영 전001~004 선행 코드와005 변경 범위를 대조한다.

## 권장 커밋 메시지

    feat(game): add new game controls, timer and completion dialog

    Apply selected difficulty on restart and cancel superseded generation.
    Ignore stale responses and support retry after generation failures.
    Track elapsed time with one interval and stop on valid completion.
    Restore focus after dismissal without duplicate delayed close handling.
    Add regression coverage and document user-verified task 005 completion.

게임 제어·시간·완료 UI·관련 테스트·문서를 하나의 기능 변경으로 묶는다. 실제 스테이징 범위를 확인한 뒤 사용한다.

## PR 제목

    feat(game): 스도쿠 새 게임·난이도·타이머·완료 대화상자 구현

## PR 본문 초안

### 해결하는 문제와 변경 후 동작

입력 가능한 보드에 게임을 다시 시작하고 완료를 안내하는 흐름이 필요했다. 이제 선택 난이도는 다음 새 게임부터 적용하고, 새 요청은 이전 생성을 취소한다. 실패 후 재시도할 수 있으며 늦게 도착한 이전 응답은 현재 게임을 덮어쓰지 않는다.
퍼즐 준비 후 경과 시간을 표시하고 유효 완성 시 시간을 멈추고 완료 대화상자를 연다. 닫기·Escape 후 새 게임 버튼으로 포커스를 복귀한다.

### 포함·제외 범위

- 포함: easy/normal/hard 선택·새 게임·로딩/잠금·실패 재시도·abort/requestId·단일 타이머·완료 dialog·이벤트 정리·개발 fixture·회귀 검사·문서.
- 난이도는 빈칸35/45/50 기준의 간이 난이도다. 기존 엔진의 유일해 생성·예산·실패 계약을 유지한다.
- 제외: 저장·새로고침 복구·일시정지·실행 취소·힌트·논리 난이도 평가·배포.
- 외부 npm/CDN 패키지·번들러 추가 없음. HTTP·Native ESM을 사용한다.

### 주요 변경 파일

| 파일 | 변경 |
|---|---|
| [main.js](../../src/main.ts) | createGameSession으로 생성/상태/시계/scheduler 효과 조정, mountGame의 입력·컨트롤·visibility·정리 연결 |
| [controls.js](../../src/ui/controls.ts) | 난이도·새 게임·시간·native dialog 렌더와 이벤트 소유·정리·포커스 복귀 |
| [time.js](../../src/utils/time.ts) | 시각 차이를 초로 내림, 완료 시간 고정,100분 이상 mm:ss 표시 |
| [index.html](../../index.html)·[main.css](../../styles/main.css) | 난이도·새 게임·현재 난이도·경과 시간·접근성 제목/설명의 완료 dialog·반응형 배치 |
| [시간 검사](../../tests/time.test.js)·[제어 검사](../../tests/game-controls.test.js) | 시간 경계·경합·재시도·단일 interval·완료 잠금·정리·지연 close 회귀 |
| [HTTP 검사](../../tests/server.test.js) | 신규 JS/개발 페이지의 HTTP·MIME 검사 |
| [controls.html](../../tests/browser/controls.html)·[controls-checks.js](../../tests/browser/controls-checks.js) | 실제 seed 생성·완료 직전·첫 실패·지연/오래된 응답 전달 개발 전용 fixture |

playing 동안250ms interval 하나를 유지하며 실제 시각 차이로 표시한다. 숨겨진 탭 시간은 포함하고 복귀 시 즉시 보정한다. 새 게임·완료·dispose에서 interval을 정리한다.
프로덕션 화면에 테스트 fixture나 정답 공개 버튼은 없다.

### 리뷰에서 해결한 사항

R1: dialog.close() 이후 지연된 native close 이벤트가 불필요한 닫기 Action·포커스 복귀를 반복하던 경로를 수정했다.
마지막 렌더의 completionDialogOpen을 확인하고 dispatch 전에 플래그를 내려 한 번만 처리한다.
신규 회귀2개는 수정 전 실패·수정 후 통과했다. [04 리뷰](../review-005.md)에 상세 근거가 있다.

### 검증 결과와 출처

| 수행 주체 | 절차 | 결과 |
|---|---|---|
| Codex04 | Windows PowerShell·Node24.22.1·npm CLI8.19.4, npm test | 89개 중88통과·0실패·1skip(junction EPERM), exit0 |
| Codex04 | 시간/제어 범위 검사 | 18개 모두 통과 |
| Codex04 | node --check·HTTP 자산·임시 서버 정리 | 통과·검증 페이지 HTTP200·종료 로그와exit0 확인 |
| 사용자 최종 보고 / 2026-10-26 | 안내 절차의 전체 테스트 | 89개 모두 통과 |
| 사용자 실제 검증 | 난이도·새 게임·타이머·실패 재시도·오래된 응답 무시 | 확인 보고 |
| 사용자 실제 검증 | 완료 대화상자·포커스·터치·반응형·콘솔 오류 없음·서버 종료 | 확인 보고 |

기존 EACCES·도구 중단·junction skip은 당시 이력으로 보존한다. 사용자 결과를 Codex 직접 관찰로 표현하지 않는다.
브라우저 버전·정확한 viewport·터치 장치/에뮬레이션 구분·원시 로그·스크린샷은 미제공이다. 실제 BFCache 복귀는 별도 미확인이다.
이번05는 문서 변경으로 테스트를 다시 실행하지 않았다. EventTarget double은 실제 DOM·모달·터치 증거가 아니다.

### 스크린샷

미첨부. 실제 캡처 파일을 전달받지 않아 이미지·경로를 만들지 않았다.

### 영향·알려진 제약·다음 단계

CONTROL-01~05·DOC-01·REV-01을 기존 리뷰/자동 검사와 사용자 잔여 확인으로 충족했다. 확인된 범위 내 중대한 미해결 결함은 없다.
D-002·D-003을 구현에 적용했고 결정 상태는 채택됨을 유지한다. 새 ADR은 없다.
001~004 선행 코드와 함께 기본 브랜치에 반영하는 순차 흐름을 따른다. 현재 Git 저장소가 없으므로 실제 반영은 별도로 수행해야 한다.
001~005 완료 후 다음 단계는06 전체 인수 검증이다. 개별 태스크 완료가06 인수 검증·PR 병합·배포 완료를 의미하지 않는다. 이번 요청에서06은 실행하지 않았다.

### 관련 문서

- [005 태스크](../../tasks/005-game-controls-timer.md)·[작업 목록](../../tasks/README.md)
- [현재 아키텍처](../../architecture.md)·[실행 안내](../../README.md)
- [설계 계약](../plans/sudoku-mvp.md)·[D-002](../decisions/002-unique-bounded-generation.md)·[D-003](../decisions/003-state-input-and-time.md)
- [03 구현 기록](../controls-005.md)·[04 리뷰·사용자 최종 확인](../review-005.md)

## 실제 반영 전

저장소·기본 브랜치 준비 후 실제 diff·스테이징 파일·선행 코드 반영 상태와 이 초안을 대조한다.
이 파일은 실제 PR 생성·리뷰 승인·병합의 증거가 아니다.

> 007 전환 안내: 위 과거 기록의 .js 파일명은 당시 구현을 뜻한다. 소스 링크는 이동한 현재 .ts 파일을 가리키도록 갱신했다. 브라우저 출력은 계속 .js다.
