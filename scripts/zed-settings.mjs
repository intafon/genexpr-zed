import { fileURLToPath } from 'node:url';

// Print settings instead of modifying the user's Zed configuration.
console.log(JSON.stringify({
  lsp: {
    'genexpr-language-server': {
      binary: {
        path: process.execPath,
        arguments: [fileURLToPath(new URL('../server/dist/genexpr-language-server.cjs', import.meta.url)), '--stdio'],
      },
      initialization_options: { domain: 'dsp' },
    },
  },
}, null, 2));
