# GenExpr for Zed

[GenExpr](https://docs.cycling74.com/userguide/gen/gen_genexpr/) support for the
[Zed editor](https://zed.dev), focused on **gen~ audio programming**.

- Syntax highlighting, bracket pairing, indentation, function/declaration outlines, and Vim function text objects.
- Snippets for functions, declarations, imports, loops, delays, and basic DSP patterns.
- Operator and constant completion, hover documentation with reference links, function signatures, contextual attribute keys/values, and methods on declared Delay objects.
- A standalone language server that also works with other LSP editors. Max is not required for editing help.

The server currently uses a curated common/DSP catalog. It does not compile GenExpr,
validate syntax, resolve imports, rename symbols, or execute DSP. Jitter-specific
completion and signatures are planned. See [research](docs/research.md) and the
[roadmap](docs/roadmap.md).

## Install from this checkout

Prerequisites: **Node.js 20+ with npm**, **Git**, **Rust installed through
[rustup](https://rustup.rs/)**, and a C compiler (Xcode Command Line Tools on macOS;
a standard C build toolchain on Linux/Windows). Use a current stable Zed release.
The shell helpers run in Bash (including Git Bash on Windows).

```sh
./scripts/install-zed.sh
```

This installs locked npm dependencies, fetches the pinned parser, installs the
Rust WASI target, and builds the server and adapter. It generates
`.cache/zed-settings.json` using the actual Node and checkout paths on this machine.

Finish these two steps in Zed:

1. Run **zed: open settings file**. Merge the generated file's `lsp` entry into
   your existing settings, preserving other entries.
2. Run **zed: install dev extension**, and select this repository directory.
   The Extensions panel also has an **Install Dev Extension** button.

Zed's CLI currently has no dev-extension installation flag; the helper prepares
the build and configuration, and Zed registers it through its UI. Add `--open` to
the helper to open the project and generated settings in Zed. It never overwrites
your Zed settings. Keep the checkout in place: the server settings point into it.
Regenerate settings if you move the checkout or change Node installations.

```sh
./scripts/install-zed.sh --no-build       # Repeat instructions using an existing build
node scripts/zed-settings.mjs             # Print configuration again
```

Open [examples/oscillator.genexpr](examples/oscillator.genexpr), hover `cycle`,
type `pha` for completion, or type `peek(samples, in1, interp=` for value
suggestions. Use Zed's completion/signature-help actions if automatic suggestions
are disabled in your settings. Snippet prefixes include `fn`, `param`, `history`,
`buffer`, `data`, `delay`, `for`, `require`, `smooth1`, and `sineosc`.

To disable the server while retaining editing features, set
`"languages": { "Genexpr": { "language_servers": [] } }` in Zed's settings.
To uninstall, remove the dev extension through Extensions and remove its `lsp`
configuration. No files in your Max installation are changed.

## Build and check

```sh
./scripts/bootstrap.sh            # Fresh checkout: dependencies, parser, WASI target, build
npm run build                    # Rebuild server and extension.wasm
npm run check                    # Server tests, grammar/queries, Rust lint, release build
```

For language-server work without Rust/Zed:

```sh
./scripts/bootstrap.sh --server-only
npm run build:server
node scripts/check.mjs --server-only
npm start                        # LSP over stdio; this is not an interactive REPL
```

Dependencies are pinned by `package-lock.json` and `Cargo.lock`. Bootstrap and
first grammar compilation need network access and a C compiler. The server bundle
itself needs only Node at runtime. See [development](docs/development.md) for
architecture, configuration, compatibility checks, and release considerations.

## Working with Max

Put reusable functions in a `.genexpr` file on Max's search path and load them
from a codebox with `require("helpers");`. Max watches required files and
recompiles when they change. [examples/helpers.genexpr](examples/helpers.genexpr)
is a reusable library; `oscillator.genexpr` is a complete codebox body intended
for pasting into a gen~ codebox. These are different uses of `.genexpr` files.
See [Cycling ’74's guide](https://docs.cycling74.com/userguide/gen/gen_genexpr/).

`.gendsp`, `.genjit`, and `.maxpat` contain patcher JSON, not plain GenExpr, and
are intentionally not associated with this language.
