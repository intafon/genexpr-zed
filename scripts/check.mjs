import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const serverOnly = process.argv.includes('--server-only');
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' && command === 'npm' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(process.execPath, ['scripts/sync-highlights.mjs', '--check']);
run('npm', ['run', 'build:server']);
run('npm', ['test']);
run('npm', ['run', 'check:grammar']);
if (!serverOnly) {
  run('cargo', ['fmt', '--check']);
  run('cargo', ['clippy', '--locked', '--target', 'wasm32-wasip2', '--', '-D', 'warnings']);
  run('npm', ['run', 'build']);
}
