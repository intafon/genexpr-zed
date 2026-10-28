#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

server_only=false
case "${1:-}" in
  --server-only) server_only=true ;;
  '') ;;
  *) echo 'Usage: scripts/bootstrap.sh [--server-only]' >&2; exit 1 ;;
esac

for tool in node npm git; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing $tool. Install Node.js 20+ (https://nodejs.org/) and Git, then rerun." >&2
    exit 1
  fi
done
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) { console.error("Node.js 20+ is required"); process.exit(1); }'

# Keep npm's download cache inside the checkout; no global npm installation needed.
npm ci --cache .cache/npm
node scripts/fetch-grammar.mjs

if "$server_only"; then
  npm run build:server
else
  if ! command -v rustup >/dev/null 2>&1; then
    echo 'Install Rust through https://rustup.rs/, then rerun (or use --server-only).' >&2
    exit 1
  fi
  rustup target add wasm32-wasip2
  cargo fetch --locked
  npm run build
fi

printf '\nSetup complete. Generate your Zed language-server settings with:\n  node scripts/zed-settings.mjs\n'
