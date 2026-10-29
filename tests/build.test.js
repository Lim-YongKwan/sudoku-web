import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
let fixture;
const run = (mode) => spawnSync(process.execPath, [join(fixture, 'scripts/build.mjs'), mode], {
  cwd: fixture, encoding: 'utf8', windowsHide: true,
});
before(async () => {
  fixture = await mkdtemp(join(tmpdir(), 'sudoku-build-'));
  await mkdir(join(fixture, 'src'));
  await mkdir(join(fixture, 'styles'));
  await mkdir(join(fixture, 'scripts'));
  await mkdir(join(fixture, 'tests/browser'), { recursive: true });
  await mkdir(join(fixture, 'tests/fixtures'), { recursive: true });
  for (const path of ['scripts/build.mjs', 'scripts/check-runtime.mjs', 'tsconfig.json', 'package.json', 'src/types.ts']) {
    await cp(join(project, path), join(fixture, path));
  }
  // The actual installed compiler, including its platform package, is used in isolation.
  await cp(join(project, 'node_modules'), join(fixture, 'node_modules'), { recursive: true });
  await writeFile(join(fixture, 'src/main.ts'), "export const greeting: string = 'Sudoku';");
  await writeFile(join(fixture, 'index.html'), '<script type="module" src="./src/main.js"></script>');
  await writeFile(join(fixture, 'styles/main.css'), 'body { color: green; }');
  await writeFile(join(fixture, 'tests/browser/check.js'), 'export const check = true;');
  await writeFile(join(fixture, 'tests/fixtures/board.js'), 'export const board = [];');
});
after(async () => {
  if (!fixture) return;
  const target = resolve(fixture);
  if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('sudoku-build-')) {
    throw new Error('Unexpected cleanup target.');
  }
  await rm(target, { recursive: true, force: true });
});
test('production compiles real ESM and copies only public game assets', async () => {
  const result = run('production');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual((await readdir(join(fixture, 'dist'))).sort(), ['index.html', 'src', 'styles']);
  const emitted = await readFile(join(fixture, 'dist/src/main.js'), 'utf8');
  assert.match(emitted, /export const greeting/);
  assert.doesNotMatch(emitted, /: string/);
  await assert.rejects(access(join(fixture, 'dist/src/main.ts')));
  await assert.rejects(access(join(fixture, 'dist/src/main.js.map')));
});
test('development prepares fixtures and replaces stale output on every build', async () => {
  assert.equal(run('development').status, 0);
  await writeFile(join(fixture, '.build/src/stale.js'), 'old');
  assert.equal(run('development').status, 0);
  await access(join(fixture, '.build/tests/browser/check.js'));
  await access(join(fixture, '.build/tests/fixtures/board.js'));
  await assert.rejects(access(join(fixture, '.build/src/stale.js')));
});
test('strict action and readonly contracts reject invalid TypeScript with no usable output', async () => {
  await writeFile(join(fixture, 'src/main.ts'),
    "import type { Action, GameState } from './types.js';\n" +
    "const invalid: Action = { type: 'ENTER_DIGIT', digit: 'six' };\n" +
    "export function mutate(state: GameState) { state.notes[0].add(1); }\n");
  for (const [mode, output] of [['development', '.build'], ['production', 'dist']]) {
    const result = run(mode);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /TS2322|TS2339/);
    await assert.rejects(access(join(fixture, output)));
  }
  await writeFile(join(fixture, 'src/main.ts'), "export const greeting: string = 'Sudoku';");
});
test('missing static assets fail the build and remove partial deployment output', async () => {
  await rm(join(fixture, 'index.html'));
  const result = run('production');
  assert.notEqual(result.status, 0);
  await assert.rejects(access(join(fixture, 'dist')));
  await writeFile(join(fixture, 'index.html'), '<html>restored</html>');
  assert.equal(run('production').status, 0);
});
test('invalid build mode cannot clean existing outputs', async () => {
  const before = await readFile(join(fixture, 'dist/index.html'), 'utf8');
  assert.notEqual(run('../src').status, 0);
  assert.equal(await readFile(join(fixture, 'dist/index.html'), 'utf8'), before);
});
