# VS Code MCP Total

**Controle total do VS Code a partir do Claude -- de qualquer lugar do mundo.**

Arquitetura baseada em **code-server** (VS Code no browser) rodando no seu servidor Docker Swarm com Traefik, exposto via HTTPS com certificado automatico (Let's Encrypt).

---

## O que e isso?

Um servidor MCP (Model Context Protocol) que conecta o Claude ao seu ambiente de desenvolvimento completo:

- Abrir, criar, editar e deletar arquivos no workspace
- Executar tarefas (`tasks.json`), rodar testes, fazer builds
- Controlar o terminal integrado (criar, executar comandos)
- Ver problemas de diagnostico (erros/warnings do TypeScript, ESLint etc.)
- Pesquisar por texto em arquivos com ripgrep
- Controlar sessoes de debug (breakpoints, watch, step)
- Gerenciar extensoes, configuracoes, git
- Delegar tarefas de codigo ao **Claude Code CLI** (`claude -p "..."`)
- Interface QuickPick, InputBox, diff entre arquivos, notificacoes

Mais de **53 ferramentas MCP** para controle completo do editor.

---

## Arquitetura

```
Claude (claude.ai)
        |
        | HTTPS  /mcp/<TOKEN>
        v
  +-----------------------------+
  |  Traefik (reverse proxy)    |
  |  mcp.atomicabr.com.br       |
  +-------------+---------------+
                |
                v
  +-----------------------------+
  |  mcp-server (Node.js)       |  <- Container Docker
  |  Porta 7337                 |
  |  53 MCP tools               |
  +-------------+---------------+
                | WebSocket interno
                | ws://mcp-server:7100
                v
  +-----------------------------+
  |  code-server                |  <- Container Docker
  |  VS Code no browser         |
  |  code.atomicabr.com.br      |
  |  + extensao MCP Bridge      |
  +-----------------------------+
                |
                v
       /workspace (volume compartilhado)
```

Redes: `AtomicaBRNet` (Traefik) + `internal` (overlay, DNS inter-service).
A porta 7100 (bridge WebSocket) **nao** e exposta publicamente.

---

## Deploy em Producao (Swarm via Portainer)

### 1. Variaveis de ambiente necessarias

```
MCP_TOKEN=<96 chars hex>
BRIDGE_SECRET=<64 chars hex>
CODE_SERVER_PASSWORD=<sua senha>
```

Gere com: `node scripts/generate-secrets.js`

### 2. Deploy via Portainer

1. Portainer > Stacks > Add Stack
2. Cole o conteudo de `docker-compose.swarm.yml`
3. Adicione as variaveis acima
4. Deploy

### 3. Configurar o Conector no Claude

1. claude.ai > Settings > Integrations > Add custom integration
2. URL: `https://mcp.atomicabr.com.br/mcp/SEU_TOKEN_AQUI`
3. Save and enable

---

## Desenvolvimento Local

```bash
cp .env.example .env
node scripts/generate-secrets.js --env >> .env
./scripts/dev-up.sh
```

---

## Estrutura do Projeto

```
vscode-mcp-total/
|-- server/                     # Servidor MCP (Node.js/TypeScript)
|   |-- src/
|   |   |-- index.ts            # Entrypoint Express + rotas MCP
|   |   |-- auth.ts             # Autenticacao por token no path
|   |   |-- bridge-client.ts    # WebSocket server (ponte com extensao)
|   |   +-- tools/              # 11 categorias de ferramentas MCP
|   +-- Dockerfile
|
|-- extension/                  # Extensao VS Code (TypeScript)
|   |-- src/
|   |   |-- extension.ts        # Activate, WebSocket, dispatch
|   |   |-- security.ts         # Validacoes de seguranca
|   |   +-- handlers/           # 11 handlers por dominio
|   +-- package.json
|
|-- code-server/
|   |-- settings.json.template  # Template de settings do VS Code
|   +-- install-extension.sh    # Script de instalacao da extensao
|
|-- scripts/
|   |-- deploy.sh               # Deploy Swarm
|   |-- update.sh               # Atualizar stack existente
|   |-- dev-up.sh               # Subir ambiente local
|   +-- generate-secrets.js     # Gera tokens/segredos seguros
|
|-- docker-compose.yml          # Desenvolvimento/testes
|-- docker-compose.swarm.yml    # Producao (Docker Swarm + Traefik)
|-- .env.example                # Exemplo de variaveis de ambiente
+-- README.md                   # Este arquivo
```

---

## Seguranca

| Camada | Mecanismo |
|--------|-----------|
| Acesso ao MCP | Token de 96 chars hex no path da URL |
| Ponte WebSocket | Segredo compartilhado (BRIDGE_SECRET) no handshake |
| Rede interna | Overlay `internal` nao publicado externamente |
| TLS | HTTPS obrigatorio via Traefik + Let's Encrypt |
| Rate limiting | 100 req/min por IP via middleware Traefik |
| Token invalido | Retorna 404 (nao revela existencia da rota) |

---

## 53 Ferramentas MCP

**Health:** `health_check`

**Workspace:** `vscode_list_workspaces`, `vscode_get_status`, `vscode_list_open_tabs`, `vscode_save_all`, `vscode_open`, `vscode_open_diff`

**Files:** `vscode_read_file`, `vscode_write_file`, `vscode_edit_file`, `vscode_file_ops`, `vscode_find_files`, `vscode_search_in_files`

**Intelligence:** `vscode_get_diagnostics`, `vscode_hover`, `vscode_go_to_definition`, `vscode_find_references`, `vscode_document_symbols`, `vscode_workspace_symbols`, `vscode_code_actions`, `vscode_rename_symbol`, `vscode_format`, `vscode_organize_imports`

**Terminal:** `vscode_list_terminals`, `vscode_terminal_send`

**Tasks:** `vscode_list_tasks`, `vscode_run_task`, `vscode_create_task`, `vscode_terminate_task`

**Debug:** `vscode_start_debug`, `vscode_debug_control`, `vscode_debug_eval`, `vscode_set_breakpoint`, `vscode_list_breakpoints`

**Git:** `vscode_git_status`, `vscode_git_diff`, `vscode_git_log`, `vscode_git_branch`, `vscode_git_commit`, `vscode_git_sync`

**TODOs:** `vscode_todo_list`, `vscode_todo_add`, `vscode_todo_done`, `vscode_todo_update`

**Commands:** `vscode_execute_command`, `vscode_run_command`, `vscode_list_commands`, `vscode_show_message`, `vscode_show_quick_pick`, `vscode_show_input`

**Agent:** `vscode_delegate_to_agent`, `vscode_agent_continue`, `vscode_agent_status`

---

## Troubleshooting

```bash
# Logs do servidor MCP:
docker service logs vscode-mcp_mcp-server --tail 50 -f

# Logs do code-server:
docker service logs vscode-mcp_code-server --tail 50 -f

# Ping do servidor:
curl https://mcp.atomicabr.com.br/ping
```
