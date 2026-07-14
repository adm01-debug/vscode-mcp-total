#!/usr/bin/env bash
# Instala a extensao VS Code MCP Bridge no code-server

set -euo pipefail

BRIDGE_SECRET="${1:-${BRIDGE_SECRET:-}}"
VSIX_PATH="${2:-/workspace/vscode-mcp-bridge-1.0.0.vsix}"
CONTAINER_NAME="${CONTAINER_NAME:-vscode-mcp_code-server.1}"

if [[ -z "$BRIDGE_SECRET" ]]; then
  echo "BRIDGE_SECRET nao fornecido. Uso: $0 <BRIDGE_SECRET>"
  exit 1
fi

docker exec "$CONTAINER_NAME" \
  /usr/bin/code-server --install-extension "$VSIX_PATH"

echo "Extensao instalada com sucesso."
