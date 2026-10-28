# 006 GitHub Pages 공개 배포

- 작업 ID: 006
- 상태: 완료
- 담당: Codex
- 담당 브랜치: main — 기존 코드의 Pages 설정 배포, 기능 코드 변경 없음
- 선행 작업: [005 게임 제어](005-game-controls-timer.md), [06 전체 인수](../docs/acceptance/sudoku-mvp.md)
- 코드 기준: main 7189215d77c6a113ed7a94d03ced6dd8dc663ec4. GitHub main과 두 커밋 일치 확인.
- 작성일 / 마지막 갱신: 2026-10-26
- 관련 이슈 / PR: 없음

## 목표·범위

공개 저장소 Lim-YongKwan/sudoku-web의 main 루트를 GitHub Pages로 배포해 다른 사람이 HTTPS 링크로 게임을 플레이하게 한다.
외부 의존성·번들러·서버 API·사용자 계정 기능을 추가하지 않는다. DNS·유료 서비스·별도 도메인은 범위 밖이다.

## 관련 계약·결정

[현재 구조](../architecture.md)·[D-001](../docs/decisions/001-native-esm-and-tooling.md)의 정적 HTML/CSS/Native ESM 구성을 유지한다.
사용자가 GitHub Pages 공개 배포를 직접 요청했다. 게임 자산과 모듈은 상대 경로로 저장소 하위 경로 실행을 지원한다.
기존 공개 저장소의 main/(root)를 배포 소스로 선택한다. 코드·의존성·데이터 계약 변경은 없다.

## 완료 조건·검증

- [x] Pages 배포 소스를 main/(root)로 설정하고 실제 빌드·배포 성공 확인.
- [x] 실제 공개 URL에서 게임 콘텐츠·모듈 동작 확인 — 사용자 보드 표시·숫자 입력·새 게임·타이머 정상 보고. HTTP 상태/MIME의 개별 계측은 미실행.
- [x] 공개 페이지의 보드·입력·새 게임·타이머가 정상 작동함을 사용자 보고로 확인. 81셀 개별 계수·Console 원시 기록은 미제공.
- [x] 작업 목록·실제 배포 주소·검증 근거·남은 제약 기록.

## 진행·결과

저장소·코드 기준·상대 경로와 공식 Pages 소스 설정 문서를 확인했다. 게임 코드 변경 없이 설정 배포를 진행한다.
현재 미실행 항목을 통과로 표시하지 않는다. 결과와 제약은 배포 후 갱신한다.
## 실제 배포·검증 결과

- 공개 주소: [스도쿠 게임](https://lim-yongkwan.github.io/sudoku-web/)
- 저장소: [Lim-YongKwan/sudoku-web](https://github.com/Lim-YongKwan/sudoku-web)
- 소스: Deploy from a branch → main → / (root).
- 배포 커밋: 7189215d77c6a113ed7a94d03ced6dd8dc663ec4.
- [Pages 빌드·배포40294007460](https://github.com/Lim-YongKwan/sudoku-web/actions/runs/40294007460): completed / success를 GitHub API로 확인.
- GitHub Pages 설정 화면에서 Your site is live와위주소·main/root·HTTPS 적용을 직접 확인.
- 게임 HTML의 ./styles/main.css·./src/main.js와모듈의상대import를 확인했다. 게임 코드·외부 패키지·빌드 산출물 변경 없음.
- 직접 공개 사이트로 이동한 시도는 브라우저 보안 정책의 사용자 접속 승인 거부로 중단됐다. 다른 브라우저·raw HTTP·간접 실행으로 우회하지 않았다.
- 따라서 공개 자산의HTTP/MIME·실제 퍼즐81셀·입력·새 게임·타이머·콘솔 오류는 이번배포환경에서 미확인이다. 이전06 사용자 인수 결과를 새 공개환경의 직접 관찰로 쓰지 않는다.
- 기존92개테스트와06인수완료는 유지한다. 게임 코드변경없이설정배포·문서기록만 수행해자동테스트를 다시 실행하지 않았다.
- 새 ADR 없음. Pages 설정은 사용자명시요청 범위이며 기존 Native ESM 계약을 유지한다.
- 이 작업문서·README·현재구조·목록은 로컬에 저장했으며 이번요청에서 추가 문서커밋·push·PR·병합은 하지 않았다. 배포는 기존GitHub main 커밋으로 완료됐다.

## 사용자 확인 전의 차단 판단 — 당시 이력

배포 자체는 성공했다. 공개 환경의 필수 직접 검증이 남아 작업 전체 상태는 차단됨으로 기록한다.
사용자가 위공개주소에서 퍼즐표시·숫자입력·메모·새 게임·타이머·콘솔오류없음을 확인하거나, 명시적으로 접속을 허용한 뒤 같은주소를 검증하면 완료조건을 재평가한다.
접속 승인 거부를 반복 재시도로 우회하지 않는다. 게임 공개URL이 배포되지 않았다는 뜻은 아니다.

## 설정 근거

[GitHub 공식 Pages 소스 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)의브랜치루트배포방식을 사용했다.
## 사용자 최종 확인·완료 — 2026-10-26

사용자가 공개 주소에서 보드 표시·숫자 입력·새 게임·타이머가 정상 동작하는지 묻는 질문에 '정상 동작함'이라고 답했다.
GitHub의 실제 배포 성공·게시 완료 근거와 이 사용자 기능 확인을 합쳐 다른 사람이 링크로 게임을 플레이한다는 배포 목표를 충족했다. 006을 완료 처리한다.
위 완료 조건의 상세 자산 계측·개별 셀 계수는 배포 확인 수단으로 제안한 항목이며, 사용자 정상 플레이를 동등한 기능 확인 근거로 사용했다. 원시HTTP/MIME·Console 검사까지 직접 수행했다고 쓰지 않는다.
기존 접속 승인 거부·도구 미실행 이력은 보존하며 우회 접속은 시도하지 않았다.
브라우저 버전·장치·스크린샷·자산 응답·콘솔 원시 기록은 미제공이다. 게임 코드·테스트는 변경하지 않았다.
커밋·push는 추가로 수행하지 않았다. 도메인 연결은 별도 논의 중이며 yongkwan.com의DNS·GitHub Custom domain은 변경하지 않았다.