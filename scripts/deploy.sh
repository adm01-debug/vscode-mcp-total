#!/usr/bin/env bash
# ============================================================
# deploy.sh — Deploy completo no Docker Swarm (AtomicaBR)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
STACK_NAME="vscode-mcp"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.swarm.yml"
SECRETS_FILE="$PROJECT_DIR/.secrets"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✓]${NC} $*"; }
info()  { echo -e "${BLUE}[i]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║       VS Code MCP Total — Deploy Swarm           ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
  error "Docker Swarm não está ativo. Execute: docker swarm init"
fi
log "Docker Swarm ativo."

if ! docker network ls | grep -q "AtomicaBRNet"; then
  warn "Rede 'AtomicaBRNet' não encontrada."
  info "Criando rede overlay AtomicaBRNet..."
  docker network create --driver=overlay --attachable AtomicaBRNet
  log "Rede AtomicaBRNet criada."
else
  log "Rede AtomicaBRNet encontrada."
fi

if [[ -f "$SECRETS_FILE" ]]; then
  source "$SECRETS_FILE"
  log "Segredos carregados de $SECRETS_FILE"
else
  MCP_TOKEN=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  BRIDGE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  CODE_SERVER_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))")
  cat > "$SECRETS_FILE" << EOF
MCP_TOKEN=$MCP_TOKEN
BRIDGE_SECRET=$BRIDGE_SECRET
CODE_SERVER_PASSWORD=$CODE_SERVER_PASSWORD
EOF
  chmod 600 "$SECRETS_FILE"
  log "Segredos gerados e salvos em $SECRETS_FILE"
fi

export MCP_TOKEN BRIDGE_SECRET CODE_SERVER_PASSWORD

docker stack deploy \
  --compose-file "$COMPOSE_FILE" \
  --with-registry-auth \
  "$STACK_NAME"

echo ""
log "Deploy concluído!"
echo "  code-server: https://code.atomicabr.com.br"
echo "  MCP URL: https://mcp.atomicabr.com.br/mcp/$MCP_TOKEN"
echo ""
