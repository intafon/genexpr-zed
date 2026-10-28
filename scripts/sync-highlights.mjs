import { readFile, writeFile } from 'node:fs/promises';
import { catalog } from '../server/src/catalog.js';

const file = new URL('../languages/genexpr/highlights.scm', import.meta.url);
const original = await readFile(file, 'utf8');
const names = catalog.filter(e => e.kind === 'constant').map(e => e.name).sort();
const replacement = `; BEGIN GENERATED CONSTANTS\n((identifier) @constant.builtin\n  (#match? @constant.builtin "^(${names.join('|')})$"))\n; END GENERATED CONSTANTS`;
const updated = original.replace(/; BEGIN GENERATED CONSTANTS[\s\S]*?; END GENERATED CONSTANTS/, replacement);
if (process.argv.includes('--check')) {
  if (updated !== original) throw new Error('Constant highlights are stale. Run node scripts/sync-highlights.mjs');
} else await writeFile(file, updated);
