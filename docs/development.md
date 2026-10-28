# Development

## Layout

- `languages/genexpr/`: Zed language configuration and Tree-sitter queries.
- `snippets/`: Zed snippets.
- `src/lib.rs`: Rust/WASM launcher; resolves configured commands or a server on PATH.
- `server/src/catalog.js`: curated common/DSP signatures, attributes, constants, and links.
- `server/src/syntax.js`: tolerant tokens and call/receiver context, using UTF-16 offsets.
- `server/src/features.js`: editor-independent completion, hover, and signature responses.
- `server/src/server.js`: LSP lifecycle and document synchronization.
- `server/test/`: feature behavior and stdio integration checks.
- `test/fixtures/`: grammar compatibility examples and explicit known limitations.
- `scripts/`: setup, build, check, query synchronization, and installation helpers.

## Fresh checkout

Install Node 20+, npm, Git, a C compiler, and Rust through rustup. Then run:

```sh
./scripts/bootstrap.sh
npm run check
```

Bootstrap uses `npm ci`, fetches the exact grammar commit from `extension.toml`
into `.cache/grammars/tree-sitter-genexpr`, installs `wasm32-wasip2`, fetches locked Rust
dependencies, and builds. No global npm installation, Max SDK, Max documentation,
or system-wide tree-sitter installation is required. It reports missing host
tools rather than silently installing a package manager or replacing your runtimes.

`npm run build` bundles the server into `server/dist/genexpr-language-server.cjs`
and compiles/copies the Rust adapter to `extension.wasm`. The server bundle needs
Node but no `node_modules` directory at runtime. Zed compiles the pinned grammar
with its own WASI toolchain when installing a dev extension; Zed can download that
toolchain itself. The `.cache` grammar is for local validation, not Zed packaging.

`npm run check` builds the server, tests its actual stdio protocol and feature
behavior, checks the upstream parser corpus and all query files, lints Rust,
and produces release artifacts. Use `node scripts/check.mjs --server-only` when
working without Rust. `npm test` expects a current server bundle; the check command
builds it first.

## Zed server configuration

Run `node scripts/zed-settings.mjs` for an exact configuration for this machine.
The adapter honors `lsp.genexpr-language-server.binary.path`, `arguments`, and
`env`. Without a configured path it searches PATH for `genexpr-language-server`.
It does not try to download an unpublished server package.

Supported initialization options:

```json
{
  "lsp": {
    "genexpr-language-server": {
      "initialization_options": { "domain": "dsp" }
    }
  }
}
```

`domain` is `dsp` (default: common plus gen~ operators) or `common` (shared
operators only). Unknown domains are logged and fall back to DSP. Restart the
server after changing initialization options. Other clients can send
`workspace/didChangeConfiguration` with `{ "genexpr": { "domain": "common" } }`.

The standalone executable speaks LSP over stdin/stdout; stdout is reserved for
protocol messages. To use another editor, build the bundle and launch it as
`node /absolute/path/server/dist/genexpr-language-server.cjs --stdio`.

## Catalog changes

Use the original references linked in [research](research.md). Verify GenExpr
forms rather than directly copying Max object-box constructors. Each entry has a
domain, kind, description, parameter labels, reference URL, and optional return,
receiver, and attribute metadata. A parameter containing `=` documents a default;
`...` denotes additional positional inputs; `?` marks an optional input whose
default is not asserted. These are help labels, not a type system.

After changing constants, regenerate their Tree-sitter highlighting query:

```sh
node scripts/sync-highlights.mjs
node scripts/check.mjs --server-only
```

Keep descriptions independently written and concise. Do not bulk-copy the Max
reference corpus into the repository. An optional local importer is planned.
The server offers known catalog entries; it does not yet resolve user-defined
shadowing, imports, complete argument expansion, or every overload. Attribute
suggestions are constrained to the current known call. Method suggestions require
a visible, previously declared Delay receiver. Unknown calls are left alone.

## Grammar compatibility

`npm run check:grammar` fetches and uses exactly the pinned parser. It runs its
corpus, parses this project's representative fixtures, verifies expected parser
limitations, and compiles/executes every Zed query against the grammar. A parser
upgrade that fixes a known limitation requires reviewing and removing that entry
from `test/fixtures/known-limitations.json`; it should not silently change expectations.

These checks establish compatibility with the pinned parser, not semantic truth
in Max. The fixtures are independently written examples based on documented
language forms. Run representative examples in Max before changing language
validation behavior. Current limitation tracking is why this release has no
syntax diagnostics.

## Manual release checklist

1. Run bootstrap/check from a clean checkout and inspect lockfile changes.
2. Run `scripts/install-zed.sh`, merge settings, and register the dev extension.
3. Verify light/dark themes, paired brackets, comments, multiline indentation,
   function/declaration outline navigation, and Vim function selections.
4. Exercise snippets, nested calls, attributes inside incomplete strings, Delay
   methods, hover links, and signature help in Zed. Check Zed's logs for errors.
5. Audition appropriate examples in Max, including a required function library.
6. Test packaging separately from development. Published Zed extensions must
   obtain the server separately through supported extension APIs. A release
   download flow is planned; the development helper is not a publishing tool.

## Troubleshooting

- **Server not found:** merge generated `lsp` settings; confirm the bundle exists
  and the configured Node path still exists. Restart the language server.
- **Dependency downloads fail:** check your proxy/registry. Set `npm_config_registry`
  for npm if your environment's configured registry is unavailable.
- **Rust target missing:** `rustup target add wasm32-wasip2`.
- **Parser tests cannot compile:** install a C compiler and check tree-sitter's
  output. Grammar caches are local to `.cache`; Zed manages a separate WASI build.
- **Changes not visible:** rebuild, then reinstall/rebuild the dev extension in
  Zed and restart its language server. Highlighting and server help are separate.
- **Unexpected lack of Jitter suggestions:** only `dsp` and `common` catalogs
  are implemented. See the roadmap.
