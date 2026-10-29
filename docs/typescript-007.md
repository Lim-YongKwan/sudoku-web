# 007 TypeScript 전환 — 03 구현과 검증 기록

- 작업: [007](../tasks/007-typescript-migration.md)
- 구현: 2026-10-28, 검증·문서 정리: 2026-10-29.
- 브랜치: feat/task-007-typescript-migration, 시작 커밋 1c45a8b.
- 상태: 03 구현 이력. 현재 04 리뷰·수정과 사용자 로컬 잔여 확인을 마쳤으며 checkout·공개 배포 대기다. 최신 결과는 [04 기록](review-007.md)을 따른다.
- 커밋·push·원격 Pages 설정 변경은 수행하지 않았다.

## 실제 변경

- src의 게임 모듈 10개를 .ts로 전환하고 [공통 타입](../src/types.ts)을 추가했다.
- Board·GameState·Action 판별 유니온·검색/생성 결과·주입 함수·구독·DOM 경계에 타입을 적용했다.
- Board는 readonly 배열이며 길이/숫자 범위는 assertBoard가 계속 검사한다. notes는 readonly 배열/ReadonlySet으로 노출하고 reducer 내부에서는 복사본만 변경한다.
- strict·noEmitOnError·NodeNext·ES2022를 적용했다. 상대 import는 .js를 유지하고 컴파일러가 .ts 원본을 해석한다.
- 런타임 검증·단서 보호·생성 제한·시계·입력·완료 계약을 보존했다. 새로운 게임 기능은 추가하지 않았다.
- TypeScript 7.0.2를 직접 개발 의존성으로 고정했다. 이 버전의 플랫폼별 컴파일러 패키지는 optional 개발 전이 의존성이며 게임 런타임에 포함하지 않는다.
- scripts·Node 테스트·브라우저 fixture는 JavaScript로 유지했다.
- [빌드 스크립트](../scripts/build.mjs)는 고정된 프로젝트 출력 경로만 정리한다. 오류 발생 시 해당 출력을 지우고 비정상 종료한다.
- .build는 컴파일된 src·index.html·styles·개발 fixture를 포함한다. dist의 최상위는 index.html·src·styles뿐이다.
- 소스 .ts·소스맵·package/config·docs·tests·scripts는 배포 출력에서 제외했다.
- npm test는 최신 개발 출력 생성 후 tests/*.test.js를 실행한다. 단위 검사는 .build/src를 import하고 fixture의 기존 상대 import는 복사된 위치에서 컴파일 결과로 연결된다.
- 정적 서버의 기본 루트는 .build다. 루프백·원시 경로/실경로 경계·공개 경로 제한을 유지했다.
- [Pages workflow](../.github/workflows/pages.yml)를 작성했다. PR은 검증만, main은 설치→타입 검사→전체 검사→빌드 성공 후 dist 업로드·배포하도록 했다.
- [AGENTS 수정안](plans/agents-typescript-proposal.md)의 개발 도구·원본/출력·타입·검증 규칙을 현재 지침에 반영했다.

## 실행과 검증 결과

Node 24.22.1·npm 8.19.4를 세션 PATH에서 선택했다. 전역 설치/PATH 변경은 없다.

| 검증 | 실제 결과 |
|---|---|
| npm ci --no-audit --no-fund | 성공, lockfile 기준 개발 컴파일러 재현 설치. 별도 입력 복사에서는 --ignore-scripts도 적용 |
| npm run typecheck | 성공 |
| npm run build:dev / npm test의 pretest | 성공 |
| npm test | 97개: 96 통과·0 실패·1 skip |
| npm run build | 성공, 게임 전용 dist 구성 |
| npm start | 개발 출력 재생성 후 HTTP 서버 시작 확인 |
| 별도 새 디렉터리에서 재현 | 원본·설정·lockfile만 복사, 이전 출력/node_modules 없이 설치·타입 검사·전체 테스트·배포 빌드 성공 |
| 개발/배포 출력 HTTP | HTML·CSS·ESM 200/MIME 확인, package.json 차단, 원본 .ts 미제공, dist에 fixture 없음 |
| 서버 정리 | 별도 HTTP 서버 두 개 close 후 연결 거부 확인. 장시간 브라우저 시도에 사용한 60366 포트도 종료 확인 |
| 브라우저 직접 접속 | 미완료 — in-app browser의 로컬 접속이 ERR_CONNECTION_TIMED_OUT |
| 실제 Actions/Pages 배포 | 미실행 — 커밋·push·원격 변경 금지 범위 준수 |
| 04 코드 리뷰 | 아직 요청·실행하지 않음 |

새 디렉터리 검증은 커밋 전 작업 트리의 입력 파일을 복사한 재현 검사이며, 새 커밋을 Git checkout한 검사는 아니다.
Windows의 junction 생성 권한 EPERM 때문에 기존 링크 경계 검사 1개를 건너뛰었다. 통과로 계산하지 않는다.
기존 92개를 유지하고 실제 컴파일러를 사용하는 빌드 검사 5개를 추가했다.

## 추가한 빌드 검증

[build.test.js](../tests/build.test.js)는 고유한 임시 프로젝트에서 실제 설치된 컴파일러를 사용한다.
다른 테스트의 .build/dist나 개발 원본을 변경하지 않으며, 정리 전에 임시 디렉터리의 부모와 접두어를 확인한다.

1. 배포 출력에서 타입 구문 제거·ESM 유지·허용 자산만 포함.
2. 개발 fixture 복사·매번 이전 출력 제거.
3. 잘못된 Action 숫자 타입과 readonly 메모 변경을 타입 오류로 거부하고 개발/배포 출력 제거.
4. 정적 자산 누락 시 실패·부분 배포 출력 제거·원본 복원 후 성공.
5. 잘못된 빌드 모드가 기존 출력에 영향을 주지 않음.

## 남은 04·배포 확인

- 실제 브라우저에서 320px/1280px·키보드/터치·포커스·메모·충돌·새 게임·타이머·완료 dialog·콘솔을 확인한다.
- Windows junction 검사를 권한이 있는 환경에서 다시 확인한다.
- 04에서 실제 diff·타입 계약·빌드 경계·전체 회귀를 리뷰하고 결함이 있으면 수정한다.
- 커밋 후 깨끗한 checkout의 npm ci·검증과 실제 GitHub Actions를 확인한다.
- 사용자 승인으로 main 반영/배포를 진행할 때, 기존 main/(root) 자동 게시가 TS 원본을 게시하지 않도록 main 반영 직전에 Pages 소스를 GitHub Actions로 전환한다. 기존 게시본은 유지한다.
- 현재 공개 사이트는 이전 JavaScript 배포다. 이번 브랜치의 workflow 작성은 실제 배포 완료를 뜻하지 않는다.
- Actions의 성공과 공개 주소 동작을 확인하기 전 TS-05와 007 전체를 완료 처리하지 않는다. D-001도 그때까지 채택됨을 유지하고 D-004의 부분 반영을 기록한다.

로컬 재확인 명령은 프로젝트 루트에서 Node 22 이상을 선택한 뒤 순서대로 실행한다.

    npm.cmd ci
    npm.cmd run typecheck
    npm.cmd test
    npm.cmd run build
    npm.cmd start

현재 컴퓨터의 Node 선택 방법은 [README](../README.md)를 따른다. 출력된 로컬 HTTP 주소와 /tests/browser/board.html, /tests/browser/interaction.html, /tests/browser/controls.html을 확인한다.
서버는 Ctrl+C로 종료한다. npm 명령을 동시에 실행해 같은 출력 폴더를 재생성하지 않는다.

## 참고한 공식 문서

- [TypeScript strict](https://www.typescriptlang.org/tsconfig/strict.html)
- [GitHub Pages custom workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

문서 검증: Markdown 51개의 로컬 파일 링크 648개를 대조해 깨진 링크가 없었다. 이전 .js 소스 링크는 현재 .ts로 연결하고 당시 설명은 이력으로 보존했다. git diff --check 공백 오류는 없었다.

## 04 후속 — 2026-10-29

[04 리뷰 기록](review-007.md)에 Action 큐 검증 회귀 수정·배포 workflow 전체 동시 실행 제어·숫자 마스크 타입 보강을 기록했다.
최신 전체 검사는 99개 중 98 통과·0 실패·1 권한 skip이다. 이 문서의 97개·리뷰 미실행·브라우저 시간 초과는 03 당시 이력이다.
04의 브라우저 조작은 URL 확인 불가로 컴퓨터 사용 도구가 중단했고, 원격 Actions/공개 배포는 미실행이다.

## 사용자 잔여 검증 확인 — 2026-10-29

- 근거: 사용자가 안내 절차에 따라 테스트 99개 모두 통과, 브라우저·터치 에뮬레이션·반응형·완료 대화상자·콘솔 오류 없음·서버 종료를 확인했다고 보고했다.
- 사용자 보고 결과: 99 통과·0 실패·0 skip. 이전 도구 실행의 98 통과·1 Windows 권한 skip과 구분한다.
- 브라우저/화면은 안내한 로컬 검증 절차의 사용자 확인이다. 도구가 직접 관찰한 것으로 기록하지 않는다.
- 터치는 에뮬레이션 확인이며 실제 휴대전화/물리 터치 기기 검증으로 확대하지 않는다.
- 이전 검증 서버와 새 개발 서버의 종료 확인은 안내 절차를 수행했다는 사용자 보고로 충족했다.
- 원시 테스트 로그·브라우저 이름/버전·화면별 수치·스크린샷·종료 PID 목록은 제공되지 않았다.
- 깨끗한 Git checkout과 실제 Actions/공개 배포는 아직 미실행이다. 007 상태는 진행 중을 유지한다.
