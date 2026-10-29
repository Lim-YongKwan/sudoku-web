# 010 커밋 메시지·PR 초안 — 05

- 작성일: 2026-10-29
- 대상: [010 최근 입력 지속 표시](../../tasks/010-last-input-highlight.md) — 완료
- head: feat/task-010-last-input-highlight / base: main
- 비교 기준: main에서 분기한 HEAD 0f5e5c288bd968229572fd74bf8d0c00bff3d933 대비 작업 트리 diff와 신규 파일을 함께 검토했다.
- 상태: 로컬 구현·문서 완료, 미커밋·미push. PR 생성·원격 CI·병합·배포는 미실행.

## 권장 커밋 메시지

~~~text
feat(game): persistently highlight the last numeric input

Track the last changed numeric cell independently of selection and notes.
Clear the marker on deletion of that value, new games and completion.
Render an accessible colored underline while preserving conflict and focus cues.
Add regression coverage, browser checks and user-verified task 010 records.
~~~

관련 구현·검사·완료 문서·초안은 같은 기능의 근거이므로 하나의 커밋으로 묶는 것을 권장한다. 이번에는 메시지 제안만 작성하며 실제 Git 쓰기는 하지 않는다.

## PR 제목

~~~text
feat(game): 최근 숫자 입력 칸 지속 표시
~~~

## PR 본문 초안

### 문제와 변경 후 동작

다른 셀을 선택하면 마지막으로 숫자를 입력한 위치를 놓치기 쉬웠다. 실제 숫자를 입력하거나 덮어쓴 한 칸을 갈색 밑줄과 접근성 이름으로 지속 표시한다. 같은 값 재입력·메모·선택 이동·보조 옵션 변경은 최근 입력을 바꾸지 않는다. 최근 숫자 삭제·새 게임·완료 시 표시를 해제하며 다른 칸 삭제는 기존 표시를 유지한다.

### 주요 변경

- types.ts·core/game-state.ts·main.ts: readonly lastInputIndex와 초기/입력/삭제/생성/완료 전이. core/last-input.ts에서 playing 상태의 값 있는 편집 셀이라는 불변조건을 검증하며 store와 보드 투영이 공유한다.
- ui/board.ts·CSS·index.html: 기존 셀 DOM에 is-last-input을 투영하고 숫자에 갈색 밑줄, 접근성 이름에 최근 입력, 범례에 밑줄 의미를 추가한다. 선택/단서 배경·충돌 테두리/느낌표·포커스 outline을 유지한다.
- interaction fixture의 실제 DOM/계산 스타일 checks와 재측정, controls fixture의 완료 후 lastInputIndex/recentCount 보고를 추가한다.
- 최근 입력의 전이/검증/모델/시간/완료 세션 검사10개와 측정 판정 회귀4개를 추가한다. 작업·구조·결정 부분 적용 범위·최종 사용자 확인 문서를 갱신한다.

### 리뷰에서 보완한 사항

DOM 위치만 보고하던 개발 화면에 표식 개수/위치·접근성 이름·보이는 밑줄·단서/잠금·가로 넘침 검사를 추가했다. 마지막 숫자 입력이 세션에서 완료 상태로 연결되고 표식을 해제하는 검사도 보강했다. 오래된 README 상태를 수정했다. 제품 상태 전이의 명세 위반은 발견하지 못했다.

### 검증 결과

| 수행 주체 | 검사 | 결과 |
|---|---|---|
| 도구04 / Node24.22.1·TypeScript7.0.2 | 타입 검사·깨끗한 개발/배포 빌드 | 통과 |
| 도구04 | 관련14개·전체133개 | 관련14개 통과. 전체132통과·0실패·1 Windows directory-link EPERM skip |
| 도구04 | fixture 구문·HTTP7개 자산/MIME·배포 경계·서버 종료 | 통과. dist에 개발 fixture 없음, 종료 후ECONNREFUSED |
| 사용자 최종 보고 | 전체 테스트 | 133개 모두 통과 |
| 사용자 최종 보고 | 최근 입력 유지·덮어쓰기·삭제·메모·옵션·완료 시 해제 | 확인 |
| 사용자 최종 보고 | 안내 절차의 포커스·터치·반응형·콘솔 오류 없음·서버 종료 | 확인 |

도구는03에서 브라우저 URL 확인 불가로 중단됐고04에서는 사용자 요청으로 UI를 시도하지 않았다. 사용자 보고를 도구 직접 관찰로 표현하지 않는다. 원시 로그·브라우저/기기 버전·실기기/에뮬레이션 구분은 미제공이다. 이번05는 문서만 갱신해 기능 검사를 재실행하지 않았다.

### 포함·제외 범위와 영향

최근 입력 상태/지속 표시만 포함한다. 시간 기반 해제·추가 타이머·정답/후보 힌트·새 패키지·빌드/Pages 설정 변경은 없다. 같은 숫자 강조(011)·실행 취소(012)·저장/복원(013)은 미구현이다.
GameState를 직접 주입하는 코드는 lastInputIndex:null 또는 유효한 편집 숫자 셀 index가 필요하다. 기존 생성 함수/fixture는 이를 반영했다. 후속012/013이 이 필드를 복원할 수 있는 계약만 마련했다.

### 스크린샷

미첨부. 사용자 확인은 받았으나 실제 이미지가 제공되지 않아 스크린샷 경로를 기재하지 않는다.

### 다음 단계

로컬 완료는 원격 CI·main 병합·배포 완료를 뜻하지 않는다. 별도 승인 후 커밋·push·main 대상 PR 생성·CI 확인을 진행한다. 병합/배포와 공개 화면 확인 이후 다음011을 별도 브랜치에서 시작한다.

### 관련 문서

- [작업010](../../tasks/010-last-input-highlight.md)
- [03 구현](../last-input-010.md)·[04 리뷰와 사용자 최종 확인](../review-010.md)
- [D-005](../decisions/005-assistance-highlights-and-undo.md) — 최근 입력까지 부분 적용
- [현재 구조](../../architecture.md)·[후속 계약](../plans/sudoku-next-iteration.md)
