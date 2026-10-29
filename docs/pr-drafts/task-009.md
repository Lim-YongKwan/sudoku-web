# 009 커밋 메시지·PR 초안 — 05

- 작성일: 2026-10-29
- 대상: [009 숫자 스톡·보조 옵션 기반](../../tasks/009-digit-stock-options.md) — 완료
- head: feat/task-009-digit-stock-options / base: main
- 비교 기준: 로컬 main·HEAD17ab0077bce374978e60e2790aac3e7db3e05204 대비 추적 파일의 작업 트리 diff와009 신규 파일을 함께 확인했다.
- 현재 상태: 구현053b32d push 후 [PR #3](https://github.com/Lim-YongKwan/sudoku-web/pull/3)를main ebfb5b3에 병합했다. Actions 배포·사용자 공개 스톡/초기화 확인 완료. 아래05 메시지/본문은 작성 당시 초안으로 보존한다.

## 권장 커밋 메시지

~~~text
feat(game): add digit stock display and assistance options

Count digit usage from values and keep exhausted digits available for input.
Add a stock toggle and reset both assistance options for each new game.
Preserve notes, selection, difficulty and timing when options change.
Add stock fixtures, regression coverage and user-verified task 009 records.
~~~

기능·UI·상태/타입·관련 검사·완료 문서는 같은 변경의 근거이므로 하나의 커밋으로 묶는 것을 권장한다. 05 당시 제안한 메시지를 이후 사용자 요청으로 이번 로컬 커밋에 사용한다.

## PR 제목

~~~text
feat(game): 숫자 스톡 표시와 보조 옵션 기반 구현
~~~

## PR 본문 초안

### 문제와 변경 후 동작

보드에서 숫자별 스톡을 얼마나 사용했는지 확인하기 어려웠다. 기본OFF인 스톡 표시를 켜면 단서와 입력 숫자를 한 번씩 집계해 패드에 남은 스톡/9를 표시한다. 9개 이상 사용한 숫자는 회색과 남은 수0으로 표시하고 추가 입력은 계속 허용한다. 메모와 정답 여부는 집계에 관여하지 않는다.

### 주요 변경

- core/digit-stock.ts: values만 집계해 usedCount·remaining·exhausted를 파생. 단서 이중 합산·메모 포함·정답 판정 없음.
- types.ts·core/game-state.ts·main.ts: readonly Assistance 두 boolean과 검증된 SET_ASSISTANCE Action. 초기/새 게임은 두 옵션false이며 playing에서 옵션만 변경하고 기존 보드·메모·선택·난이도·타이머를 유지.
- ui/digit-stock.ts·ui/controls.ts·HTML/CSS: native checkbox, 남은 수·회색·접근성 설명. OFF면 추가 표시 제거. 스톡 표시가disabled를 변경하지 않으며 생성/완료의 기존 입력 잠금은 유지.
- stock.html·stock-checks.js·stock-assertions.js: 8/9/10개·완료/실패/지연 시연과 패드 개수/순서·CSS 표시/잘림·checkbox/도움말 측정 검사. 개발 출력에만 포함.
- digit-stock.test.js·stock-presentation.test.js: 상태·집계·이벤트/표시 경계11개와 측정 판정3개 추가. 작업·구조·설계 적용 범위·리뷰/사용자 확인 문서 갱신.

### 리뷰에서 보완한 사항

패드가 비었거나 일부 버튼이 누락돼도 검사 일부가 통과할 수 있던 문제를 수정했다. 실제 개수 표시·내용 잘림·OFF 도움말·checkbox label/잠금의 검증 누락도 보강했다. 측정 판정 테스트와 실제 브라우저 관찰은 구분한다.

### 검증 결과

| 수행 주체 | 검사 | 결과 |
|---|---|---|
| 도구04 / Node24.22.1 | 타입 검사·깨끗한 개발/배포 빌드 | 통과 |
| 도구04 | 관련14개·전체119개 검사 | 관련14개 통과. 전체118통과·0실패·1 Windows directory-link EPERM skip |
| 도구04 | JS 구문·HTTP10개 자산/MIME·배포 경계·서버 종료 | 통과. dist에 개발 fixture 없음, 종료 후ECONNREFUSED |
| 사용자 최종 보고 | 전체 테스트 | 119개 모두 통과 |
| 사용자 최종 보고 | 스톡 집계·회색 버튼 입력·메모 제외·옵션 초기화 | 확인 |
| 사용자 최종 보고 | 실패 재시도·완료 잠금·반응형·키보드/터치·접근성 | 확인 |
| 사용자 최종 보고 | 콘솔 오류 없음·서버 종료 | 확인 |

도구 직접 브라우저 확인은 URL 확인 불가로 중단됐다. 사용자 결과를 도구 직접 관찰로 표현하지 않으며 기존skip/중단 이력은 [04 기록](../review-009.md)에 보존했다. 이번05는 문서만 갱신해 기능 검사를 재실행하지 않았다.

### 포함·제외 범위

스톡 표시와 두 보조 옵션의 상태/초기화 기반까지만 구현했다. highlightMatchingDigits의 토글·강조 UI는011까지 노출하지 않는다. 최근 입력·같은 숫자 강조·실행 취소·저장은010~013의 범위다. 엔진·기존 입력 라우팅·난이도 계약·의존성·빌드/배포 설정은 바꾸지 않았다. 새 패키지·CDN·저장소 옵션 기록을 추가하지 않았다.

### 스크린샷·확인 한계

스크린샷 미첨부. 사용자 확인 보고는 받았으나 실제 이미지·원시 로그·기기/브라우저 버전·실기기/에뮬레이션 구분·스크린리더 종류는 미제공이다. 다른 시안이나 가짜 경로를 검증 증거로 쓰지 않았다.

### 영향과 다음 단계

GameState 주입 코드는 assistance 두 boolean이 필요하다. 기본 생성 함수와 개발 fixture는 이를 반영했으며 초기 객체는store에서 복사한다. 남은 수0은 유효 배치나 정답을 뜻하지 않는다.
009 로컬 완료는 원격 CI·main 병합·배포 완료를 뜻하지 않는다. 이후 승인된 커밋·push·main 대상 PR 생성 후 CI를 확인하고, 승인된 병합/배포 후 공개 화면을 확인한다. 010은009의 기본 브랜치 반영 후 별도 작업으로 시작한다.

### 관련 문서

- [작업009](../../tasks/009-digit-stock-options.md)
- [구현 기록](../stock-009.md)·[04 리뷰와 사용자 최종 확인](../review-009.md)
- [D-005](../decisions/005-assistance-highlights-and-undo.md) — 숫자 디자인·스톡·옵션 기반까지 적용
- [현재 구조](../../architecture.md)·[후속 계약](../plans/sudoku-next-iteration.md)

## 실제 PR·배포 후속 — 2026-10-29

[최종 기록](../deployment-009.md): PR #3 main 병합·Actions40824921514 validate/deploy 성공·119개 전체 통과·사용자 공개 스톡/초기화 정상 확인을 기록했다. 초안의 미실행 문구는 당시 이력이며 이번에는 완료 문서를main 커밋·push로 공유한다. 010 구현은 하지 않는다.
