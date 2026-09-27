#!/usr/bin/env bash
set -euo pipefail
echo "==> Installing dependencies..."
pnpm install
echo "==> Starting infrastructure..."
docker compose up -d postgres redis
echo "==> Waiting for PostgreSQL..."
until docker compose exec postgres pg_isready -U biblia; do sleep 1; done
echo "==> Running migrations..."
pnpm db:migrate
echo "==> Seeding database..."
pnpm db:seed || echo "No seeds yet"
echo "==> Done! Run 'pnpm dev' to start."
