# 001 환경 구현·검증 기록 — 03

- 기준일: 2026-10-23
- 작업: [001 실행·검증 환경](../tasks/001-development-environment.md)
- 단계: 03 코드 구현. 작업 상태는 진행 중, 04 리뷰는 미실행.
- 선행 작업: 없음. 프로젝트는 기존 문서만 있었고 Git 저장소·다른 코드 변경이 없었다.

## 실제 사용 환경

| 항목 | 확인 |
|---|---|
| 기본 Node | C:\Program Files\nodejs\node.exe, v16.20.2 |
| 검증용 Node | C:\Users\임용관\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe, v24.22.1 |
| npm CLI | C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js, 8.19.4 |
| Git | 2.39.1.windows.1. 프로젝트의 Git 저장소·브랜치는 없음 |
| 시스템 변경 | 설치·업데이트·전역 PATH 변경 없음. 실행 명령의 PowerShell 세션 PATH만 Node 24 경로를 앞에 둠 |

검증은 해당 Node 실행 파일로 npm CLI를 호출해 pretest·test·prestart·start lifecycle의 node도 24를 사용했다.
상세 재현 명령은 [README](../README.md)에 있다. 외부 패키지 설치·npm install은 실행하지 않았다.

## 구현과 작은 조정

- package.json: type=module, engines >=22, start/test와 runtime 검사 prehook. 외부 의존성 없음.
- scripts/static-server.mjs: 공개 경로와 MIME, 원시 경로 검증, realpath 루트 경계, GET/HEAD, 명시적 400·403·404·405, no-store·nosniff.
- scripts/serve.mjs: CLI와 PORT, 루프백 바인딩, 포트 충돌 안내, SIGINT·SIGTERM 종료 처리.
- scripts/check-runtime.mjs: 오래된 Node에서 명확한 오류를 내도록 검사.
- index.html·src/main.js·styles/main.css: Native ESM 초기화 표시용 준비 화면. 게임 기능 없음.
- tests/server.test.js: Node 내장 테스트·assert·HTTP만 사용. 테스트는 임시 루트·임시 포트로 실행하고 종료·파일 정리를 수행.
- .gitignore: 향후 로그·coverage·환경값·node_modules를 제외하도록 준비.
- CLI와 재사용 HTTP 모듈 분리는 테스트·수명주기를 분리하기 위한 구현 세부 조정이다. D-001을 대체하는 새 결정은 필요하지 않았다.

## 실제 자동 검증

최종 명령은 Node 24로 npm CLI의 test를 실행하는 방식이다. pretest가 runtime 검사를 하고 test가 node --test를 실행한다.

- 총 16개: 15개 통과, 0개 실패, 1개 건너뜀.
- 통과: runtime·포트 입력, 루프백 바인딩, HTML 길이·MIME, JS/CSS, HEAD, 404, 405,
  원시/인코딩 traversal, 잘못된 인코딩·null·Windows 경로, 메타데이터 차단, UTF-8·개발용 fixture 경로,
  포트 충돌·명시적 종료, CLI 오류 종료, 실제 프로젝트 asset·package 설정.
- 건너뜀: 외부 디렉터리로 가는 junction 생성이 Windows 샌드박스에서 EPERM으로 거부됨.
  이 조건에서만 명시적으로 skip한다. 정상 권한 환경에서는 실제 링크를 생성해 403을 확인한다.
- 첫 실행에서는 샌드박스가 127.0.0.1 연결도 EACCES로 거부했다. 네트워크 권한이 부여된 뒤 HTTP 검사를 다시 실행했다.
- 첫 실패 과정에서 드러난 테스트 서버 정리 경로를 try/finally로 보완했다. force-exit은 진단 실행에만 사용했고 최종 test 명령에는 쓰지 않는다.

## npm start와 브라우저

- npm start의 prestart·start가 실행되어 http://127.0.0.1:8080과 Ctrl+C 안내를 출력한 것을 확인했다.
- 브라우저 도구의 첫 탭 생성은 세션 오류, 새 탭의 HTTP 접근은 ERR_CONNECTION_TIMED_OUT으로 실패했다.
- 별도 셸 명령의 8080 접근도 타임아웃이었다. 동일 테스트 프로세스 내부 HTTP 검증은 통과했지만 다른 실행 경계에서는 접근을 확인하지 못했다.
- 호스트의 다른 실행 도구에서 같은 재사용 서버 모듈을 띄우려 했으나 listen EACCES로 거부됐다. 이를 성공한 브라우저 검증으로 기록하지 않는다.
- 실제 화면·ESM 초기화·브라우저 콘솔 확인은 미실행이다. ENV-04는 체크하지 않았다.
- 사용자 터미널에서 README의 Node 22 이상 실행 절차로 서버를 연 뒤 실제 브라우저 화면·Network·콘솔을 확인해야 한다.

## 서버 정리와 정책 제약

- 자동 테스트가 만든 서버는 테스트에서 닫고 임시 파일을 정리했다. 포트 충돌·종료 테스트는 통과했다.
- 첫 실패 테스트 세션에는 종료 입력을 보내 종료 응답을 받았다.
- 별도로 띄운 npm start 세션(57776)에 Ctrl+C를 보내는 작업은 자동 권한 정책이 거부했다.
  사유: sandbox_approval이 허용되지 않아 종료 입력에 필요한 승인을 진행할 수 없음.
- 다른 셸의 netstat에서는 8080 리스너를 찾지 못했다. 따라서 해당 격리 세션의 종료 여부를 확정하지 못했다.
- 범위가 불명확한 다른 Node 프로세스를 종료하거나 보안 설정을 바꾸지 않았다. 해당 서버가 남아 있다면 원래 실행 세션에서 종료해야 한다.

## 남은 일

1. 실제 사용자 브라우저에서 ENV-04를 확인하고 절차·브라우저 버전·화면을 기록.
2. 가능하면 링크 생성이 허용된 환경에서 skipped junction 검사를 수행. 현재 기록은 skip이며 통과가 아님.
3. 04 리뷰 수행, 코드·증거·현재 문서를 대조하고 완료 판단.
4. Git 저장소·기본 브랜치 준비 후 실제 승인 범위에 따라 반영. 지금은 브랜치·커밋·원격 작업 미실행.

전체 환경 완료나 다음 엔진 작업의 선행 완료를 선언하지 않는다.

## 사용한 API 문서

- [Node.js HTTP 서버·종료 API](https://nodejs.org/api/http.html)
- [Node.js 파일 경로의 실제 위치 확인](https://nodejs.org/api/fs.html)
- [Node.js 내장 테스트 runner](https://nodejs.org/api/test.html)

## 03 문서 정합성 확인

- Markdown 21개와 로컬 파일 링크 168 개를 확인했다.
- 001은 진행 중, 04 리뷰와 ENV-04는 미완료로 남았고 실제 결과에 맞게 문서·코드·D-001 반영 상태를 갱신했다.
- 외부 의존성 선언·프로젝트 node_modules 설치가 없음을 확인했다.
- 최종 npm test 결과는 15 통과·0 실패·1 skip이며, 임시 삭제 경로는 실제 생성한 tmpdir 바로 아래 sudoku-server- 디렉터리인지 확인한 뒤 정리한다.

## 04 정정과 후속 검증

이 문서 위 내용은 03 당시 기록이다. 이후 코드 리뷰·현재 판단은 [04 기록](review-001.md)을 따른다.
03에서 정상 시작 출력은 모듈 분리 전 실행이었다. 분리 후 최종 CLI에는 HOST 미정의 오류가 남았고 기존 자동 테스트가 정상 CLI 경로를 확인하지 않아 이를 놓쳤다.
04에서 실패를 재현하고 수정했으며 정상 CLI·HTTP·종료 회귀를 추가했다. 현재 자동 검사는 18개 중 17 통과·0 실패·1 skip이다.
04 재시도용 90초 서버는 종료 로그·exit 0을 확인했다. 예전 세션 종료 입력은 여전히 정책에 거부돼 종료 여부가 미확인이다.


## 후속 완료 기록 — 사용자 검증·05

위 내용은 03·04 도구 실행 당시 이력이다. 이후 2026-10-23 사용자가 안내 절차의 테스트 18개 통과·브라우저 ESM 초기화·콘솔 오류 없음·서버 종료를 확인해 잔여 차단을 해제했다. 001은 완료이며 [최신 04 판단](review-001.md)과 [05 커밋 메시지·PR 초안](pr-drafts/task-001.md)을 따른다. 사용자 확인을 도구의 직접 관찰로 기록하지 않는다.