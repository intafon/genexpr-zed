# Roadmap

## 0.2 — Editing and operator help

- [x] Improve bracket/comment configuration, constants, parameters, attributes, indentation, declaration outline, and Vim function selections.
- [x] Add original snippets and example files.
- [x] Curated common/gen~ catalog with official reference links.
- [x] Standalone LSP: operator/constant completion, hover, signatures, named attribute keys/enums, declared Delay methods.
- [x] Lock dependencies; bootstrap, build, check, and guided installation scripts.
- [x] Check the upstream parser corpus, representative fixtures, known parser limitations, and query compatibility.
- [x] Test the built server over actual stdio LSP, including incremental document changes and shutdown.

This milestone does not imply complete operator/overload coverage or semantic
validation. Manual visual verification in Zed and audio verification in Max are
also required before publishing a release.

## Next — Distribution and catalog completeness

1. Publish a separately versioned server artifact (npm or release archive).
   Add adapter installation through Zed's supported APIs with a local binary
   override. Verify first install, upgrade, offline reuse, and supported platforms.
2. Audit each remaining common/DSP operator and overload against installed
   references and executable Max examples. Add explicit return/default metadata.
3. Add an optional local-reference importer to enrich documentation for the
   installed Max version without redistributing its full documentation corpus.
4. Manually verify themes, indentation, outline navigation, completions, and
   keybindings across supported Zed versions. Declare a minimum tested version.

Acceptance: a user can install the published extension without cloning this
repository, and supported calls have verified signatures and linked references.

## Then — Library navigation and local symbols

1. Add syntax-tree-backed symbol indexing and scope resolution. Complete local
   variables, arguments, declarations, and user functions; honor shadowing.
2. Resolve `require` recursively using workspace roots plus configurable Max
   search directories. Handle extensionless names, duplicate imports, cycles,
   missing files, open unsaved documents, and changing search paths.
3. Add definitions, references, document/workspace symbols, and user-function
   signature help. Resolve abstraction interfaces without treating patch JSON
   as plain source.

Acceptance: navigation through a multi-file library works with overlapping
names, shared dependencies, and external search roots. Unresolved external
abstractions do not generate false errors.

## Then — Parser accuracy and conservative diagnostics

1. Expand fixtures from documented language constructs and representative Max
   examples. Resolve optional-semicolon and single-expression differences;
   contribute fixes upstream and update the pinned revision deliberately.
2. Add syntax diagnostics only after valid fixtures parse reliably. Start semantic
   checks with unknown attributes and invalid enum values for known built-ins.
3. Add selected declaration/scope checks and quick fixes. Keep checks requiring
   Max search paths or domain knowledge configurable.
4. Model multiple returns, dynamic user attributes, default arguments, and state
   before adding arity, undefined-name, or unused-value warnings.

Acceptance: fixtures known to compile in Max produce no false errors; supported
invalid cases get precise ranges. Diagnostics remain useful during incomplete edits.

## Later — Formatting

Build a comment-preserving GenExpr formatter, exposed through LSP. Preserve
statement order, declaration placement, imports, and state operations. Do not
route source through a generic C/JavaScript formatter.

Acceptance: formatting is idempotent, preserves comments, and representative
formatted programs compile and behave identically in Max. Offer format-on-save
only once it meets those checks.

## Later — Jitter

Extend the catalog with explicit Jitter/vector/texture domains and appropriate
coordinate globals and swizzles. Verify domain-specific call forms, including
operators that share names with DSP operators. Add Jitter snippets and examples.

Acceptance: selecting a Jitter domain changes signatures and suggestions without
leaking incompatible DSP operators. Domain-specific examples compile in Max.

## Exploratory — Max integration and embedded editing

- Provide a task/helper that creates a disposable `.gendsp` wrapper for complete
  codebox programs, while retaining `require`-based editing for function libraries.
- Add optional companion Max patches for compilation feedback, auditioning,
  signal inspection, and CPU measurements. Transport, error ranges, reconnects,
  and Max version support need investigation before promising runtime tooling.
- Extract codeboxes from patcher JSON into editable source with explicit
  synchronization/conflict handling. Respect escaped strings and multiple
  codeboxes. Avoid rewriting unrelated patch data.
- Investigate code-export tasks after compilation/audition workflows are stable.

Acceptance for each experiment must be defined separately. A conventional
step-through debugger or fully standalone GenExpr compiler is not committed work.
