# 011 커밋 메시지·PR 초안 — 05

- 작성일: 2026-10-29
- 대상: [011 셀 선택 기준 같은 숫자 강조](../../tasks/011-matching-digit-highlight.md) — 완료
- head: feat/task-011-matching-digit-highlight / base: main
- 비교 기준: main에서 분기한 HEAD 1dda61da75cbd786df93f35be6e90fffbc067f4b 대비 작업 트리 diff와 신규 파일을 함께 검토했다.
- 상태: 구현·검사·완료 문서는 로컬 변경이다. 커밋·push·PR 생성·원격 CI·병합·배포는 미실행.

## 권장 커밋 메시지

~~~text
feat(game): highlight matching digits from the selected cell

Expose an independent assistance toggle and derive matches from current values.
Include clues while excluding notes and clear matches on empty selection or completion.
Preserve last-input, conflict, focus and digit-stock input behavior.
Update browser checks, regression coverage and user-verified task 011 records.
~~~

기능·검사·관련 문서는 같은 변경의 근거이므로 하나의 커밋으로 묶는 것을 권장한다. 이번 요청은 메시지 제안과 초안 작성까지다.

## PR 제목

~~~text
feat(game): 셀 선택 기준 같은 숫자 강조 옵션 구현
~~~

## PR 본문 초안

### 문제와 변경 후 동작

선택한 숫자가 보드의 어디에 있는지 찾기 어려웠다. 기본 OFF인 같은 숫자 강조를 켜면 선택한 셀의 현재 숫자와 같은 모든 숫자를 단서까지 포함해 연한 배경과 접근성 이름으로 표시한다. 빈칸·메모는 제외하며 빈칸 선택·옵션OFF·새 게임·완료 시 해제한다. 입력·덮어쓰기·삭제와 방향키 이동에 따라 현재 값 기준으로 즉시 갱신한다.

### 주요 변경

- ui/board.ts: 기존 assistance.highlightMatchingDigits와 현재 선택/values에서 matching을 파생한다. 별도 상태 스냅샷을 저장하지 않으며 원본 보드를 변경하지 않는다.
- ui/controls.ts·HTML: 스톡과 독립적인 native checkbox·label·도움말을 연결한다. change/render/dispose를 관리하고 playing 외에는 토글을 잠근다. 기존 초기/새 게임의 두 옵션false 계약을 유지한다.
- CSS: 일치 셀·일치 단서·선택된 일치 셀 배경을 구분하고 기존 최근 입력 밑줄·충돌 테두리/느낌표·포커스 outline을 유지한다.
- 개발 fixture: interaction의 matchingIndices/측정 checks, controls의 matchingCount, stock의 새 토글 상태 검사를 연결한다. 개발 출력에만 포함한다.
- 회귀 검사: 상태 투영·옵션 조합·토글 생명주기 8개와 측정 판정 4개를 추가했다.

### 리뷰에서 수정한 사항

스톡 검증 페이지가 새 토글이 없어야 통과하도록 남아 있어 정상 화면도 실측 실패하는 결함을 수정했다. 토글 개수·label·checked·disabled와 실제 강조 위치/접근성 이름/가시성을 판정하도록 보강하고 누락·과잉·잔여 강조 등의 회귀 검사를 추가했다.

### 검증 결과

| 수행 주체 | 검사 | 결과 |
|---|---|---|
| 도구04 / Node24.22.1·TypeScript7.0.2 | 타입·깨끗한 개발/배포 빌드 | 통과 |
| 도구04 | 관련12개·전체145개 | 관련12개 통과. 전체144통과·0실패·1 Windows 디렉터리 링크 EPERM skip |
| 도구04 | fixture 구문·HTTP9개 자산/MIME·배포 경계·서버 종료 | 통과. dist에 개발 fixture 없음, close 후ECONNREFUSED |
| 사용자 최종 보고 | 전체 테스트 | 145개 모두 통과 |
| 사용자 최종 보고 | 같은 숫자 강조·메모 제외·옵션 조합·회색 버튼 입력·완료 시 해제 | 확인 |
| 사용자 최종 보고 | 안내 절차의 포커스·터치·반응형·콘솔 오류 없음·서버 종료 | 확인 |

도구는03에서 로컬 브라우저 접속 시간 초과로 UI를 확인하지 못했고04에서는 사용자 요청으로 시도하지 않았다. 사용자 보고를 도구 직접 관찰로 표현하지 않는다. 이번05는 문서만 갱신해 기능 검사를 재실행하지 않았다.

### 포함·제외 범위와 영향

같은 숫자 옵션과 셀 선택 기준 파생 강조만 포함한다. 숫자 패드 검색/숫자 우선 입력·후보/정답 추천·옵션 영구 저장·추가 타이머·새 패키지는 추가하지 않았다. 단서 수정 금지·외부 폼 키 처리·회색 스톡 버튼 입력·선택/최근/충돌/포커스 계약은 유지한다. 실행 취소012·저장013은 미구현이며 빌드/Pages 설정은 변경하지 않았다.

### 스크린샷과 확인 한계

미첨부. 원시 로그·실제 이미지·기기/브라우저 버전·실기기/에뮬레이션 구분은 미제공이다. 가짜 스크린샷 경로나 다른 기능의 이미지를 증거로 사용하지 않는다.

### 관련 문서와 다음 단계

- [작업011](../../tasks/011-matching-digit-highlight.md)
- [03 구현](../matching-011.md)·[04 리뷰와 사용자 최종 확인](../review-011.md)
- [D-005](../decisions/005-assistance-highlights-and-undo.md) — 같은 숫자 강조까지 부분 적용
- [현재 구조](../../architecture.md)·[후속 계약](../plans/sudoku-next-iteration.md)

별도 요청 후 커밋·push·main 대상 PR·CI 검증을 진행한다. 로컬 완료는 병합·배포 완료가 아니다. 기본 브랜치 반영 후012를 별도 브랜치에서 시작한다.
