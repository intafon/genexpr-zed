import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('built server handles initialize, incremental edits, help and clean shutdown over stdio', { timeout: 15000 }, async t => {
  const server = spawn(process.execPath, [fileURLToPath(new URL('../dist/genexpr-language-server.cjs', import.meta.url)), '--stdio'], { stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => server.kill());
  let stderr = '';
  server.stderr.on('data', chunk => { stderr += chunk; });
  let buffer = Buffer.alloc(0);
  let id = 0;
  const pending = new Map();
  const notifications = [];
  server.stdout.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) return;
      const length = /Content-Length: (\d+)/i.exec(buffer.subarray(0, headerEnd).toString());
      assert.ok(length, 'stdout must only contain framed LSP messages');
      const end = headerEnd + 4 + Number(length[1]);
      if (buffer.length < end) return;
      const message = JSON.parse(buffer.subarray(headerEnd + 4, end).toString());
      buffer = buffer.subarray(end);
      if (message.id !== undefined && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      } else notifications.push(message);
    }
  });
  function send(message) {
    const body = JSON.stringify({ jsonrpc: '2.0', ...message });
    server.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  }
  function request(method, params) {
    return new Promise((resolve, reject) => {
      const current = ++id;
      pending.set(current, { resolve, reject });
      send({ id: current, method, params });
    });
  }
  server.on('exit', code => {
    for (const { reject } of pending.values()) reject(new Error(`Server exited ${code}: ${stderr}`));
  });
  const initialized = await request('initialize', { processId: process.pid, rootUri: null, capabilities: {}, initializationOptions: { domain: 'dsp' } });
  assert.equal(initialized.capabilities.hoverProvider, true);
  assert.equal(initialized.capabilities.textDocumentSync, 2);
  assert.equal(initialized.capabilities.diagnosticProvider, undefined);
  send({ method: 'initialized', params: {} });
  const uri = 'file:///protocol.genexpr';
  send({ method: 'textDocument/didOpen', params: { textDocument: { uri, languageId: 'genexpr', version: 1, text: 'out1 = pha' } } });
  const items = await request('textDocument/completion', { textDocument: { uri }, position: { line: 0, character: 10 } });
  assert.ok(items.some(e => e.label === 'phasor'));
  send({ method: 'textDocument/didChange', params: { textDocument: { uri, version: 2 }, contentChanges: [{ range: { start: { line: 0, character: 7 }, end: { line: 0, character: 10 } }, text: 'sin(in1)' }] } });
  const help = await request('textDocument/hover', { textDocument: { uri }, position: { line: 0, character: 8 } });
  assert.match(help.contents.value, /gen_common_sin/);
  const signature = await request('textDocument/signatureHelp', { textDocument: { uri }, position: { line: 0, character: 11 } });
  assert.match(signature.signatures[0].label, /^sin\(/);
  send({ method: 'workspace/didChangeConfiguration', params: { settings: { genexpr: { domain: 'common' } } } });
  const common = await request('textDocument/completion', { textDocument: { uri }, position: { line: 0, character: 7 } });
  assert.equal(common.some(e => e.label === 'phasor'), false);
  send({ method: 'workspace/didChangeConfiguration', params: { settings: {} } });
  const unchanged = await request('textDocument/completion', { textDocument: { uri }, position: { line: 0, character: 7 } });
  assert.equal(unchanged.some(e => e.label === 'phasor'), false);
  send({ method: 'textDocument/didClose', params: { textDocument: { uri } } });
  assert.equal(await request('textDocument/hover', { textDocument: { uri }, position: { line: 0, character: 8 } }), null);
  assert.equal(notifications.some(n => n.method === 'textDocument/publishDiagnostics'), false);
  await request('shutdown', null);
  const exited = new Promise(resolve => server.once('exit', resolve));
  send({ method: 'exit' });
  assert.equal(await exited, 0, stderr);
});
