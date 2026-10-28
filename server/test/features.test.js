import test from 'node:test';
import assert from 'node:assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { catalog } from '../src/catalog.js';
import { completions, hover, signatureHelp } from '../src/features.js';

function at(source) {
  const offset = source.indexOf('|');
  assert.notEqual(offset, -1);
  const document = TextDocument.create('file:///test.genexpr', 'genexpr', 1, source.slice(0, offset) + source.slice(offset + 1));
  return [document, document.positionAt(offset)];
}
const complete = (source, options) => completions(...at(source), options);
const signature = source => signatureHelp(...at(source));

test('operator completion includes actual documentation and replacement edits', () => {
  const result = complete('out1 = pha|');
  const phasor = result.find(e => e.label === 'phasor');
  assert.ok(phasor);
  assert.equal(phasor.textEdit.newText, 'phasor');
  assert.match(phasor.documentation.value, /gen_dsp_phasor/);
  assert.equal(result.some(e => e.label === 'sin'), false);
});

test('completion in the middle of an identifier replaces its remaining suffix', () => {
  const [document] = at('out1 = pha|sor');
  const item = complete('out1 = pha|sor').find(e => e.label === 'phasor');
  assert.equal(document.getText(item.textEdit.range), 'phasor');
});

test('common-only mode filters audio features', () => {
  const result = complete('|', { domain: 'common' });
  assert.ok(result.some(e => e.label === 'sin'));
  assert.ok(result.some(e => e.label === 'Param'));
  assert.equal(result.some(e => e.label === 'phasor'), false);
  assert.equal(hover(...at('pha|sor(440)'), { domain: 'common' }), null);
});

test('hover returns a precise UTF-16 range and official reference', () => {
  const result = hover(...at('// 🎵\r\nout1 = si|n(in1);'));
  assert.match(result.contents.value, /Sine/);
  assert.deepEqual(result.range, { start: { line: 1, character: 7 }, end: { line: 1, character: 10 } });
});

test('comments and ordinary strings suppress help', () => {
  for (const source of ['// sin|', '/* sin| */', 'Buffer b("sin|");', 'require("sin|");']) {
    assert.deepEqual(complete(source), []);
    assert.equal(hover(...at(source)), null);
  }
  assert.equal(signature('sin(/* comment, |'), null);
});

test('signature help ignores commas inside strings, comments and nested calls', () => {
  const source = 'mix(sin(in1), /* one, two */ cos(in2), |)';
  assert.equal(signature(source).activeParameter, 2);
  assert.match(signature(source).signatures[0].label, /^mix\(/);
  assert.match(signature('mix(sin(|), 0, 0)').signatures[0].label, /^sin\(/);
  assert.equal(signature('peek(buffer, fn("a,b"), |)').activeParameter, 2);
});

test('unknown nested calls do not borrow signatures from their parent', () => {
  assert.equal(signature('mix(custom(|), 0, 0)'), null);
});

test('attribute keys are contextual, prefix-filtered, and exclude already used keys', () => {
  const items = complete('peek(samples, in1, int|)');
  assert.ok(items.some(e => e.label === 'interp='));
  assert.equal(complete('sin(int|)').some(e => e.label === 'interp='), false);
  assert.equal(complete('peek(samples, in1, interp="linear", int|)').some(e => e.label === 'interp='), false);
  assert.equal(complete('peek(samples, in1 + int|)').some(e => e.label === 'interp='), false);
});

test('enum completions replace complete quoted values without duplicate quotes', () => {
  const [document] = at('peek(samples, in1, interp="li|near")');
  const item = complete('peek(samples, in1, interp="li|near")').find(e => e.label === '"linear"');
  assert.ok(item);
  const text = document.getText();
  const updated = text.slice(0, document.offsetAt(item.textEdit.range.start)) + item.textEdit.newText + text.slice(document.offsetAt(item.textEdit.range.end));
  assert.equal(updated, 'peek(samples, in1, interp="linear")');
});

test('enum help supports unfinished strings, bare values, and numeric values', () => {
  assert.ok(complete('peek(samples, in1, interp="li|').some(e => e.label === '"linear"'));
  assert.ok(complete('peek(samples, in1, interp=li|)').some(e => e.label === '"linear"'));
  assert.ok(complete('Delay line(100, feedback=|)').some(e => e.label === '0'));
  assert.deepEqual(complete('peek(samples, in1, madeup=|)'), []);
});

test('attribute signature highlights the named attribute irrespective of position', () => {
  const result = signature('peek(samples, in1, interp=|)');
  assert.equal(result.signatures[0].parameters[result.activeParameter].label, 'interp="none"');
  const help = hover(...at('peek(samples, in1, int|erp="linear")'));
  assert.match(help.contents.value, /peek.interp/);
  assert.match(help.contents.value, /spline6/);
});

test('Delay declaration signatures and methods use named receiver types', () => {
  assert.match(signature('Delay line(|)').signatures[0].label, /^Delay line\(/);
  const result = complete('Delay line(100); line.re|');
  assert.deepEqual(result.map(e => e.label), ['read']);
  assert.equal(complete('untyped.re|').length, 0);
  assert.match(signature('Delay line(100); line.read(|)').signatures[0].label, /^read\(/);
  assert.match(hover(...at('Delay line(100); line.re|ad(1)')).contents.value, /Read one or more taps/);
  assert.equal(signature('untyped.read(|)'), null);
});

test('Delay receivers respect brace scopes and case-insensitive declaration spellings', () => {
  assert.ok(complete('f() { delay line(100); line.| }').some(e => e.label === 'write'));
  assert.equal(complete('f() { Delay line(100); } line.|').length, 0);
  assert.ok(complete('f() { Delay left(100), right(100); right.| }').some(e => e.label === 'write'));
});

test('optional semicolons do not prevent interactive help', () => {
  assert.ok(complete('require "helpers"\nout1 = cyc|').some(e => e.label === 'cycle'));
  assert.match(signature('sin(|').signatures[0].label, /^sin\(/);
});

test('variadic calls keep the ellipsis parameter active', () => {
  const result = signature('selector(1, in1, in2, in3, |)');
  assert.equal(result.signatures[0].parameters[result.activeParameter].label, '...');
});

test('catalog entries have unique identities and valid sources and defaults', () => {
  const keys = catalog.map(e => `${e.receiver ?? ''}:${e.name}`);
  assert.equal(new Set(keys).size, keys.length);
  for (const entry of catalog) {
    assert.match(entry.url, /^https:\/\/docs\.cycling74\.com\//);
    assert.ok(entry.description);
    for (const attribute of entry.attributes) {
      if (attribute.values && attribute.default !== null) assert.ok(attribute.values.includes(attribute.default), `${entry.name}.${attribute.name}`);
    }
  }
});
