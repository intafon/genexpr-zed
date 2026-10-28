#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
project_root="$PWD"
build=true
open_zed=false
for argument in "$@"; do
  case "$argument" in
    --no-build) build=false ;;
    --open) open_zed=true ;;
    *) echo 'Usage: scripts/install-zed.sh [--no-build] [--open]' >&2; exit 1 ;;
  esac
done

if "$build"; then ./scripts/bootstrap.sh; fi
if [[ ! -f server/dist/genexpr-language-server.cjs || ! -f extension.wasm ]]; then
  echo 'Build artifacts are missing. Run scripts/install-zed.sh without --no-build.' >&2
  exit 1
fi
mkdir -p .cache
node scripts/zed-settings.mjs > .cache/zed-settings.json
cat <<EOF

Build ready. Finish installation in Zed:

1. Open Zed's user settings (command palette: "zed: open settings file").
   Merge the "lsp" entry from:
     $project_root/.cache/zed-settings.json
   into your settings. Keep your other settings and existing LSP entries.

2. Run "zed: install dev extension" from Zed's command palette.
   Select this directory:
     $project_root
   You can also use Extensions > Install Dev Extension.

3. Open examples/oscillator.genexpr. Type "pha" for phasor completion,
   hover "cycle", or type "peek(samples, in1, interp=" for enum help.

Zed currently registers dev extensions through its UI; its CLI has no dev
extension install flag. This helper does not modify Zed's private extension
database or overwrite your settings. Keep this checkout in place while using it.
EOF

if "$open_zed"; then
  if command -v zed >/dev/null 2>&1; then
    zed "$project_root" "$project_root/.cache/zed-settings.json"
  elif [[ -x /Applications/Zed.app/Contents/MacOS/cli ]]; then
    /Applications/Zed.app/Contents/MacOS/cli "$project_root" "$project_root/.cache/zed-settings.json"
  else
    echo 'Zed CLI not found. Open Zed manually and follow the instructions above.' >&2
  fi
fi
