#!/usr/bin/env bash
# ============================================================
# update.sh — Atualizar a stack vscode-mcp no Swarm
#
# Uso:
#   ./scripts/update.sh               # apenas re-deploya
#   ./scripts/update.sh --rebuild     # rebuild da imagem do servidor
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
STACK_NAME="vscode-mcp"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.swarm.yml"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
info() { echo -e "${BLUE}[i]${NC} $*"; }

REBUILD="${1:-}"

if [[ "$REBUILD" == "--rebuild" ]]; then
  docker build -t mcp-server:latest "$PROJECT_DIR/server"
  docker service update --force "${STACK_NAME}_mcp-server"
fi

docker stack deploy \
  --compose-file "$COMPOSE_FILE" \
  --with-registry-auth \
  "$STACK_NAME"

log "Stack atualizada."
docker service ls --filter "name=${STACK_NAME}"
