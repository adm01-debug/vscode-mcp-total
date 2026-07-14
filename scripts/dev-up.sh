#!/usr/bin/env bash
# ============================================================
# dev-up.sh — Subir ambiente local para testes (docker compose)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  echo "Edite .env com seus valores antes de continuar"
  exit 1
fi

source .env

sed "s/__BRIDGE_SECRET__/$BRIDGE_SECRET/g" \
  code-server/settings.json.template \
  > code-server/settings.json

if [[ ! -f "extension/dist/extension.js" ]]; then
  cd extension && npm install && npm run compile
  cd "$PROJECT_DIR"
fi

docker compose up -d --build

echo "Ambiente local rodando!"
echo "code-server: http://localhost:8443"
echo "MCP Server:  http://localhost:7337/ping"
