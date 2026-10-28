import { spawnSync } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchGrammar, grammarDirectory, root } from './fetch-grammar.mjs';

await fetchGrammar();
const executable = `${root}/node_modules/.bin/tree-sitter${process.platform === 'win32' ? '.cmd' : ''}`;
function run(args, success = true) {
  const result = spawnSync(executable, args, { cwd: grammarDirectory, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (success && result.status !== 0) throw new Error(`${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result;
}
// Give the CLI a local parser cache, instead of requiring a global installation.
const cache = `${root}/.cache/tree-sitter`;
await mkdir(cache, { recursive: true });
const config = `${root}/.cache/tree-sitter-config.json`;
await writeFile(config, JSON.stringify({ 'parser-directories': [`${root}/.cache/grammars`] }));
process.env.TREE_SITTER_LIBDIR = cache;
run(['test']);
console.log('Pinned upstream grammar corpus passed.');

const fixtures = `${root}/test/fixtures`;
const known = JSON.parse(await readFile(`${fixtures}/known-limitations.json`, 'utf8'));
for (const name of await readdir(fixtures)) {
  if (!name.endsWith('.genexpr')) continue;
  const result = run(['parse', '--config-path', config, `${fixtures}/${name}`], false);
  const parseError = /\bERROR\b|\bMISSING\b/.test(result.stdout);
  if (result.status !== 0 && !parseError) throw new Error(result.stderr || result.stdout);
  if (known[name]) {
    if (!parseError) throw new Error(`${name} now parses; remove its known limitation and review affected queries.`);
    console.log(`Known parser limitation: ${name}: ${known[name]}`);
  } else if (parseError) throw new Error(`Unexpected parse error in ${name}:\n${result.stdout}`);
}
for (const name of await readdir(`${root}/languages/genexpr`)) {
  if (!name.endsWith('.scm')) continue;
  const result = run(['query', '--config-path', config, `${root}/languages/genexpr/${name}`, `${fixtures}/editing.genexpr`]);
  if (name === 'outline.scm') for (const symbol of ['shape', 'empty', 'gain', 'previous', 'last', 'last2', 'samples', 'scratch', 'line']) {
    if (!result.stdout.includes(`text: \`${symbol}\``)) throw new Error(`Outline omitted ${symbol}`);
  }
  if (name === 'textobjects.scm' && !result.stdout.includes('function.inside')) throw new Error('Function interior text object did not match');
  if (name === 'highlights.scm') for (const capture of ['constant.builtin', 'variable.parameter', 'property', 'variable.special']) {
    if (!result.stdout.includes(capture)) throw new Error(`Highlight capture ${capture} did not match`);
  }
}
console.log('All Zed queries compile and execute against the pinned grammar.');
