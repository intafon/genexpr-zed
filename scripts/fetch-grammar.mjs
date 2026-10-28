import { spawnSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const grammarDirectory = fileURLToPath(new URL('../.cache/grammars/tree-sitter-genexpr', import.meta.url));

export async function fetchGrammar() {
  const manifest = await readFile(new URL('../extension.toml', import.meta.url), 'utf8');
  const section = manifest.split('[grammars.genexpr]')[1];
  const repository = /repository = "([^"]+)"/.exec(section)[1];
  const revision = /rev = "([^"]+)"/.exec(section)[1];
  function git(args) {
    const result = spawnSync('git', args, { cwd: grammarDirectory, encoding: 'utf8' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr || `git ${args[0]} failed`);
    return result.stdout.trim();
  }
  await mkdir(grammarDirectory, { recursive: true });
  if (!existsSync(`${grammarDirectory}/.git`)) git(['init', '--quiet']);
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: grammarDirectory, encoding: 'utf8' });
  if (head.stdout.trim() !== revision) {
    git(['fetch', '--depth', '1', repository, revision]);
    git(['checkout', '--detach', '--quiet', revision]);
  }
  console.log(`Grammar ready at ${revision}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await fetchGrammar();
