#!/usr/bin/env bash
set -euo pipefail
bash scripts/verify-fast.sh
echo "==> Build..."
pnpm build
echo "==> Integration tests..."
pnpm test
echo "==> Full verification passed."
