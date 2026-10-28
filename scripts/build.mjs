import { build } from 'esbuild';
import { chmod, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
await build({
  entryPoints: ['server/src/server.js'],
  outfile: 'server/dist/genexpr-language-server.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
  legalComments: 'eof',
});
await chmod('server/dist/genexpr-language-server.cjs', 0o755);
console.log('Built server/dist/genexpr-language-server.cjs');

if (!process.argv.includes('--server-only')) {
  const result = spawnSync('cargo', ['build', '--locked', '--release', '--target', 'wasm32-wasip2'], {
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  await copyFile('target/wasm32-wasip2/release/genexpr_zed.wasm', 'extension.wasm');
  console.log('Built extension.wasm. Install this directory as a Zed dev extension.');
}
