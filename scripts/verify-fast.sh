#!/usr/bin/env bash
set -euo pipefail
echo "==> Lint..."
pnpm lint
echo "==> Typecheck..."
pnpm typecheck
echo "==> Unit tests..."
pnpm test:unit
echo "==> All fast checks passed."
