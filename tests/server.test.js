import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startServer, closeServer, parsePort } from '../scripts/static-server.mjs';
import { assertSupportedRuntime } from '../scripts/check-runtime.mjs';

let temporaryRoot;
let root;
let server;
let port;

function get(path, method = 'GET', targetPort = port) {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port: targetPort, path, method, agent: false }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    req.setTimeout(3000, () => req.destroy(new Error('HTTP test timeout')));
    req.on('error', reject);
    req.end();
  });
}

before(async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), 'sudoku-server-'));
  root = join(temporaryRoot, 'public');
  await mkdir(join(root, 'src'), { recursive: true });
  await mkdir(join(root, 'styles'), { recursive: true });
  await mkdir(join(root, 'tests', 'browser'), { recursive: true });
  await writeFile(join(root, 'index.html'), '<html lang="ko">HTTP fixture</html>');
  await writeFile(join(root, 'src', 'main.js'), 'export const ready = true;');
  await writeFile(join(root, 'src', '한글.js'), 'export const greeting = "안녕";');
  await writeFile(join(root, 'styles', 'main.css'), 'body { color: green; }');
  await writeFile(join(root, 'tests', 'browser', 'board.html'), '<html>browser fixture</html>');
  await writeFile(join(root, 'package.json'), '{"private":true}');
  await mkdir(join(temporaryRoot, 'outside'));
  await writeFile(join(temporaryRoot, 'outside', 'secret.js'), 'outside-secret-marker');
  server = await startServer({ root, port: 0 });
  port = server.address().port;
});

after(async () => {
  if (server?.listening) await closeServer(server);
  // Only the unique disposable directory created by this test is removed.
  if (temporaryRoot) {
    const cleanupRoot = resolve(temporaryRoot);
    if (dirname(cleanupRoot) !== resolve(tmpdir()) || !basename(cleanupRoot).startsWith('sudoku-server-')) {
      throw new Error('Refusing to remove an unexpected temporary directory.');
    }
    await rm(cleanupRoot, { recursive: true, force: true });
  }
});

test('supports the project runtime and rejects older Node versions', () => {
  assert.doesNotThrow(() => assertSupportedRuntime());
  assert.throws(() => assertSupportedRuntime('16.20.2'), /22/);
  assert.doesNotThrow(() => assertSupportedRuntime('22.0.0'));
});

test('parses valid ports and rejects malformed or out-of-range values', () => {
  for (const [input, expected] of [['8080', 8080], ['0', 0], ['65535', 65535]]) {
    assert.equal(parsePort(input), expected);
  }
  for (const input of ['', '-1', '65536', '1.5', '8080abc', 'NaN', ['8080'], null, true, {}]) {
    assert.throws(() => parsePort(input), RangeError);
  }
});

test('binds only to IPv4 loopback and supports an ephemeral test port', () => {
  assert.equal(server.address().address, '127.0.0.1');
  assert.ok(port > 0);
});

test('serves the home page with a matching length and HTML content type', async () => {
  const res = await get('/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /^text\/html/);
  assert.equal(Number(res.headers['content-length']), Buffer.byteLength(res.body));
  assert.match(res.body, /HTTP fixture/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('serves JavaScript and CSS with browser-compatible MIME types', async () => {
  const js = await get('/src/main.js?v=1');
  const css = await get('/styles/main.css');
  assert.equal(js.status, 200);
  assert.match(js.headers['content-type'], /^text\/javascript/);
  assert.match(js.body, /export const ready/);
  assert.equal(css.status, 200);
  assert.match(css.headers['content-type'], /^text\/css/);
});

test('supports HEAD without a response body', async () => {
  const head = await get('/src/main.js', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.ok(Number(head.headers['content-length']) > 0);
});

test('returns 404 for absent or unsupported files, without directory listings', async () => {
  for (const path of ['/src/missing.js', '/src/main.unknown', '/styles/']) {
    assert.equal((await get(path)).status, 404, path);
  }
});

test('rejects methods other than GET and HEAD', async () => {
  const res = await get('/', 'POST');
  assert.equal(res.status, 405);
  assert.equal(res.headers.allow, 'GET, HEAD');
});

test('rejects raw and encoded traversal without normalizing the request first', async () => {
  for (const path of ['/../outside/secret.js', '/src/../../outside/secret.js', '/%2e%2e/outside/secret.js', '/src/%2e%2e/%2e%2e/outside/secret.js', '/src/%2e%2e%2f%2e%2e%2foutside/secret.js']) {
    const res = await get(path);
    assert.equal(res.status, 403, path);
    assert.doesNotMatch(res.body, /outside-secret-marker/);
  }
});

test('rejects malformed encoding, null bytes, Windows separators and alternate streams', async () => {
  for (const path of ['/src/%ZZ.js', '/src/main.js%00', '/src/..%5coutside.js', '/src/main.js:secret', '//outside/secret.js']) {
    assert.equal((await get(path)).status, 400, path);
  }
});

test('does not expose project metadata or hidden directories', async () => {
  for (const path of ['/package.json', '/AGENTS.md', '/docs/project-setup.md', '/scripts/serve.mjs', '/.git/config', '/src/.env']) {
    assert.equal((await get(path)).status, 403, path);
  }
});

test('allows UTF-8 asset paths and intended browser fixture pages', async () => {
  const unicode = await get(`/src/${encodeURIComponent('한글')}.js`);
  assert.equal(unicode.status, 200);
  assert.match(unicode.body, /안녕/);
  assert.equal((await get('/tests/browser/board.html')).status, 200);
});

test('blocks directory links to outside or private project paths', async (t) => {
  try {
    await symlink(join(temporaryRoot, 'outside'), join(root, 'src', 'escaped'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) {
      t.skip(`Windows environment does not allow test directory links: ${error.code}`);
      return;
    }
    throw error;
  }
  const res = await get('/src/escaped/secret.js');
  assert.equal(res.status, 403);
  assert.doesNotMatch(res.body, /outside-secret-marker/);
  await mkdir(join(root, 'docs'));
  await writeFile(join(root, 'docs', 'private.js'), 'private-project-marker');
  await symlink(join(root, 'docs'), join(root, 'src', 'private-link'), process.platform === 'win32' ? 'junction' : 'dir');
  const privateResult = await get('/src/private-link/private.js');
  assert.equal(privateResult.status, 403);
  assert.doesNotMatch(privateResult.body, /private-project-marker/);
});

test('rejects a busy port and allows explicit server shutdown', async () => {
  await assert.rejects(startServer({ root, port }), { code: 'EADDRINUSE' });
  const second = await startServer({ root, port: 0 });
  const secondPort = second.address().port;
  try {
    assert.equal((await get('/', 'GET', secondPort)).status, 200);
  } finally {
    await closeServer(second);
  }
  assert.equal(second.listening, false);
  await assert.rejects(get('/', 'GET', secondPort), { code: 'ECONNREFUSED' });
});

test('CLI exits with an actionable busy-port error', async () => {
  const cliPath = fileURLToPath(new URL('../scripts/serve.mjs', import.meta.url));
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath], { env: { ...process.env, PORT: String(port) }, windowsHide: true });
    let stderr = '';
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stderr }));
  });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /PORT/);
});

test('the actual project page points to real CSS and ESM assets', async () => {
  const actual = await startServer({ port: 0 });
  try {
    const actualPort = actual.address().port;
    const page = await get('/', 'GET', actualPort);
    assert.equal(page.status, 200);
    assert.match(page.body, /type="module" src="\.\/src\/main\.js"/);
    const js = await get('/src/main.js', 'GET', actualPort);
    const css = await get('/styles/main.css', 'GET', actualPort);
    assert.equal(js.status, 200);
    assert.equal(css.status, 200);
    assert.match(js.headers['content-type'], /^text\/javascript/);
    assert.ok(js.body.trim().length > 0);
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.type, 'module');
    assert.equal(pkg.scripts.test, 'node --test tests/*.test.js');
    assert.equal(pkg.scripts.pretest, 'node scripts/build.mjs development');
    assert.equal(pkg.scripts.start, 'node scripts/serve.mjs');
    assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0);
    assert.deepEqual(Object.keys(pkg.devDependencies ?? {}), ['typescript']);
    assert.match(pkg.devDependencies.typescript, /^\d+\.\d+\.\d+$/);
  } finally {
    await closeServer(actual);
  }
});






test('CLI starts, serves HTTP and exits after its owning process requests shutdown', { timeout: 10000 }, async () => {
  const cliPath = fileURLToPath(new URL('../scripts/serve.mjs', import.meta.url));
  const child = spawn(process.execPath, [cliPath], {
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((resolveExit, rejectExit) => {
    child.once('error', rejectExit);
    child.once('close', (code, signal) => resolveExit({ code, signal }));
  });
  try {
    const ready = await new Promise((resolveReady, rejectReady) => {
      const timeout = setTimeout(() => rejectReady(new Error(`CLI never became ready. stderr: ${stderr}`)), 3000);
      child.once('error', (error) => { clearTimeout(timeout); rejectReady(error); });
      child.once('exit', (code) => { clearTimeout(timeout); rejectReady(new Error(`CLI exited before ready: ${code}; ${stderr}`)); });
      child.on('message', (message) => {
        if (message?.type === 'ready') { clearTimeout(timeout); resolveReady(message); }
      });
    });
    assert.equal(ready.host, '127.0.0.1');
    assert.ok(ready.port > 0);
    assert.equal((await get('/', 'GET', ready.port)).status, 200);
    assert.match(stdout, /Sudoku development server: http:\/\/127\.0\.0\.1:/);
    child.send({ type: 'shutdown' });
    const result = await exited;
    assert.equal(result.code, 0, stderr);
    assert.equal(result.signal, null);
    assert.match(stdout, /서버를 종료했습니다/);
    assert.equal(stderr, '');
    await assert.rejects(get('/', 'GET', ready.port), { code: 'ECONNREFUSED' });
  } finally {
    // This is the child process created by this exact test; never target other Node processes.
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await exited;
  }
});



test('startServer normalizes numeric ports instead of opening a pipe', async () => {
  const numericStringServer = await startServer({ root, port: '0' });
  try {
    assert.equal(typeof numericStringServer.address(), 'object');
    assert.equal(numericStringServer.address().address, '127.0.0.1');
    assert.equal((await get('/', 'GET', numericStringServer.address().port)).status, 200);
  } finally {
    await closeServer(numericStringServer);
  }
  await assert.rejects(startServer({ root, port: ['8080'] }), RangeError);
});

test('board entry and development fixture modules are served as native ESM assets', async () => {
  const actual = await startServer({ port: 0 });
  try {
    const actualPort = actual.address().port;
    const page = await get('/', 'GET', actualPort);
    assert.match(page.body, /data-game-board/);
    assert.match(page.body, /aria-describedby="board-help"/);
    const cases = [
      ['/src/main.js', /text\/javascript/, /generatePuzzle/],
      ['/src/ui/board.js', /text\/javascript/, /export function renderBoard/],
      ['/src/core/game-state.js', /text\/javascript/, /export function reduceGame/],
      ['/src/ui/controls.js', /text\/javascript/, /export function bindControls/],
      ['/src/utils/time.js', /text\/javascript/, /export function getElapsedSeconds/],
      ['/tests/browser/controls.html', /text\/html/, /data-completion-dialog/],
      ['/tests/browser/controls-checks.js', /text\/javascript/, /resolveDelayed/],
      ['/src/ui/events.js', /text\/javascript/, /export function bindInput/],
      ['/tests/browser/interaction.html', /text\/html/, /interaction-board/],
      ['/tests/browser/interaction-checks.js', /text\/javascript/, /mountGame/],
      ['/tests/browser/board.html', /text\/html/, /fixture-board/],
      ['/tests/browser/board-checks.js', /text\/javascript/, /sameNodes/],
      ['/tests/browser/board-assertions.js', /text\/javascript/, /layoutChecks/],
      ['/tests/fixtures/boards.js', /text\/javascript/, /uniquePuzzle/],
    ];
    for (const [path, mime, content] of cases) {
      const response = await get(path, 'GET', actualPort);
      assert.equal(response.status, 200, path);
      assert.match(response.headers['content-type'], mime, path);
      assert.match(response.body, content, path);
    }
  } finally { await closeServer(actual); }
});