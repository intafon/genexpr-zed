import { createConnection, TextDocuments, TextDocumentSyncKind } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { completions, hover, signatureHelp } from './features.js';

const connection = createConnection(process.stdin, process.stdout);
const documents = new TextDocuments(TextDocument);
let settings = { domain: 'dsp' };

function configure(options) {
  if (!options || !Object.hasOwn(options, 'domain')) return;
  if (options?.domain !== undefined && !['dsp', 'common'].includes(options.domain)) {
    connection.console.warn(`Unknown GenExpr domain ${JSON.stringify(options.domain)}; using dsp. Supported: dsp, common. Jitter support is planned.`);
  }
  settings = { domain: options?.domain === 'common' ? 'common' : 'dsp' };
}

connection.onInitialize(params => {
  configure(params.initializationOptions);
  return {
    serverInfo: { name: 'genexpr-language-server', version: '0.2.0' },
    capabilities: {
      positionEncoding: 'utf-16',
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { triggerCharacters: ['.', '=', '"'] },
      hoverProvider: true,
      signatureHelpProvider: { triggerCharacters: ['(', ',', '='], retriggerCharacters: [')'] },
    },
  };
});
connection.onDidChangeConfiguration(change => configure(change.settings?.genexpr ?? change.settings));
connection.onCompletion(params => {
  const document = documents.get(params.textDocument.uri);
  return document ? completions(document, params.position, settings) : [];
});
connection.onHover(params => {
  const document = documents.get(params.textDocument.uri);
  return document ? hover(document, params.position, settings) : null;
});
connection.onSignatureHelp(params => {
  const document = documents.get(params.textDocument.uri);
  return document ? signatureHelp(document, params.position, settings) : null;
});

documents.listen(connection);
connection.listen();
