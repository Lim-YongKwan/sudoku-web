import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { assertSupportedRuntime } from './check-runtime.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function build(mode = 'development') {
  assertSupportedRuntime();
  if (!['development', 'production'].includes(mode)) throw new RangeError('Unknown build mode.');
  const output = resolve(projectRoot, mode === 'production' ? 'dist' : '.build');
  // Both recursive removal targets are fixed, verified immediate children of this project.
  if (dirname(output) !== projectRoot || !['dist', '.build'].includes(output.slice(projectRoot.length + 1))) {
    throw new Error('Unexpected build output.');
  }
  await rm(output, { recursive: true, force: true });
  try {
    const compiler = resolve(projectRoot, 'node_modules/typescript/bin/tsc');
    const result = spawnSync(process.execPath, [compiler, '-p', resolve(projectRoot, 'tsconfig.json'), '--outDir', resolve(output, 'src')], {
      cwd: projectRoot, stdio: 'inherit', windowsHide: true,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('TypeScript compilation failed.');
    await mkdir(output, { recursive: true });
    await cp(resolve(projectRoot, 'index.html'), resolve(output, 'index.html'));
    await cp(resolve(projectRoot, 'styles'), resolve(output, 'styles'), { recursive: true });
    if (mode === 'development') {
      await cp(resolve(projectRoot, 'tests/browser'), resolve(output, 'tests/browser'), { recursive: true });
      await cp(resolve(projectRoot, 'tests/fixtures'), resolve(output, 'tests/fixtures'), { recursive: true });
    }
    return output;
  } catch (error) {
    await rm(output, { recursive: true, force: true });
    throw error;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await build(process.argv[2] ?? 'development'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
