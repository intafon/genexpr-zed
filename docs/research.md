# GenExpr tooling research

Research date: 2026-10-28. Local references were inspected in Max 9.2.0.
Repository and API findings are snapshots, not promises about future releases.

## Starting point

The original extension supplied file recognition, line comments, syntax
highlighting, bracket matching, indentation, and a function outline. It had no
server, snippets, formatter, or semantic analysis.

## Documentation corpus

There is no single comprehensive formal specification in the sources reviewed.
Useful primary sources are:

| Source | Use |
| --- | --- |
| [GenExpr guide](https://docs.cycling74.com/userguide/gen/gen_genexpr/) | Language syntax, declarations, functions, control flow, multiple returns, attributes, and imports |
| [Common operators](https://docs.cycling74.com/userguide/gen/gen_common_operators/) | Shared built-ins, constants, math, and logic |
| [gen~ operators](https://docs.cycling74.com/userguide/gen/gen~_operators/) | Audio state, buffers, delays, conversions, and DSP functions |
| [Jitter operators](https://docs.cycling74.com/userguide/gen/gen_jitter_operators/) | Graphics, vectors, matrices, textures, and coordinates |
| [Individual operator references](https://docs.cycling74.com/reference/gen_dsp_peek/) | Inputs, constructor variants, attributes, defaults, and enumerations |

Max also installs machine-readable references at:

```text
Max.app/Contents/Resources/C74/packages/Gen/docs/refpages/{common,dsp,jit}/
Max.app/Contents/Resources/C74/docs/userguide/content/gen/
Max.app/Contents/Resources/Examples/gen/
```

The inspected main reference tree contained **189 XML entries**: 105 common,
57 DSP, and 27 Jitter. Additional references exist in `refpages1`. These counts
include aliases and patcher-oriented objects and must not be treated as a count
of independent GenExpr functions. The Gen examples directory had 101 `.maxpat`
examples, six `.gendsp` abstractions, and one standalone `.genexpr` file; many
more code examples are embedded in help patches.

XML constructors describe object boxes. They cannot be mechanically concatenated
into GenExpr call signatures: static arguments, signal inputs, attributes,
declarations, and methods have different roles. For example, `Delay name(size)`
introduces an instance whose `.read()` and `.write()` operations need separate
help. The shipping catalog contains curated call forms and independently written
short descriptions, with links to the original references; it does not bundle
Max's reference corpus. Not every operator/overload is covered yet.

## Tree-sitter lineage and purpose

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) supplies incremental
syntax trees for editing. It is appropriate for highlighting, indentation,
outlines, and selections. It is not a GenExpr compiler or an operator database.

[Cycling74/tree-sitter-genexpr](https://github.com/Cycling74/tree-sitter-genexpr)
is an MIT-licensed fork of
[sadguitarius/tree-sitter-genexpr](https://github.com/sadguitarius/tree-sitter-genexpr).
At research time Cycling '74's main revision was
`17703728be0e51cce993a5e440bd7a3fa3d6e374`, the exact revision the original
extension already used through Isabel Kaspriskie's fork. Changing the repository
URL to Cycling '74 therefore does not itself add parser features.

The original community repository has a later commit dated 2026-09-04. A source
comparison showed divergent changes; a later date does not establish that it is
a strict improvement. Parser changes should be evaluated against the same corpus.

Cycling '74's repository includes `parser.pegjs`, a separate PEG grammar whose
header says it was based on the original Lua/LPEG Gen 2 grammar. It offers useful
historical language detail, not a complete public compiler API or normative spec.

Known differences in the pinned Tree-sitter grammar include standalone expressions
and `require` without semicolons, which Max accepts. The grammar also recognizes
some C-like constructs that should not be used as proof of language validity.
The fixtures in `test/fixtures` explicitly track known limitations. The language
server uses tolerant lexical context for help and deliberately publishes no
parser errors. Parser accuracy must improve before diagnostics are enabled.

## Existing editor tooling

- [bsssssss/genexpr-language-server](https://github.com/bsssssss/genexpr-language-server)
  is an early MIT-licensed TypeScript project. Its inspected server advertised
  document synchronization and semantic tokens, not completion, hover, signature
  help, definitions, or diagnostics. Its operator metadata was incomplete.
- [GenExprForSublime](https://github.com/emmanueljourdan/GenExprForSublime) and
  [GenExprForVSCode](https://github.com/larme/GenExprForVSCode) supply syntax/snippet
  references. This implementation does not copy their snippet collections.
- [makegendsp](https://github.com/suncop/makegendsp) demonstrates wrapping a full
  GenExpr program in a patch with connected inputs and outputs. It is a workflow
  reference, not a dependency of this extension.

No documented standalone Max GenExpr compiler or debugger API suitable for a
production editor integration was found. The installed RNBO tree contains a
private `@rnbo/genexpr_js` package described as experimental. It is not an
appropriate supported dependency for this extension.

## Zed capabilities and implementation choice

[Language queries](https://zed.dev/docs/extensions/languages) support highlights,
brackets, outlines, indentation, and Vim text objects. Extensions can also ship
[snippets](https://zed.dev/docs/extensions/snippets).

Completion, hover, signatures, definitions, diagnostics, and refactoring fit LSP.
[Zed's Rust/WASM adapter](https://zed.dev/docs/extensions/developing-extensions)
starts a separate server. This project uses a bundled JavaScript server that runs
under Node and a small Rust adapter. The help catalog is independent of Zed.

[Publishing prerequisites](https://zed.dev/docs/extensions/publishing/prerequisites)
require servers to be obtained separately rather than bundled in the extension.
The current development installation points to a locally built server. Automated
release download/install is future work and must use a real published artifact.

Zed's documented dev installation flow uses **Install Dev Extension**. The
installed CLI's `--help` has no dev-extension install flag. The installation
helper builds artifacts and prints/generates settings; registration remains a UI
step. It does not edit undocumented extension databases.

## Semantic constraints for later work

- Audio and Jitter have different operators and meanings; domain selection is
  necessary for accurate completion and checking.
- Max resolves required libraries using its search path, potentially outside a
  Zed workspace. Library search directories must be configurable.
- Unknown function names can resolve to `.gendsp`/`.genjit` abstractions; they are
  not automatically errors.
- Multiple returns can feed multiple arguments, and unused values can be legal.
  Simple argument-count checking would produce false errors.
- State and evaluation order matter. Formatters and refactorings must preserve
  History and delay behavior, rather than applying generic C/JavaScript rules.
- Patcher files contain escaped GenExpr inside JSON strings. Associating an
  entire `.gendsp` file with the GenExpr grammar is incorrect.

The immediate high-value work is editing quality, snippets, and documentation
help; cross-file navigation and conservative diagnostics follow. See the
[roadmap](roadmap.md) for dependencies and acceptance criteria.
