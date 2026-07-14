/**
 * index.ts — MCP Server bootstrap
 *
 * Architecture:
 *   Claude → HTTPS → Express (port 7337)
 *     → validates token in path → creates McpServer (stateless)
 *     → server tools call bridge.call() → WebSocket to VS Code extension
 *
 * Auth: token embedded in path (/mcp/:token) — the URL IS the secret.
 * Transport: Streamable HTTP, stateless.
 * IPC: WebSocket server on 127.0.0.1:7100 (bridge-client.ts).
 */

import 'dotenv/config';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { initAuth, authMiddleware, generateToken } from './auth.js';
import { bridge } from './bridge-client.js';

import { registerHealthTools } from './tools/health.js';
import { registerWorkspaceTools } from './tools/workspace.js';
import { registerFileTools } from './tools/files.js';
import { registerIntelligenceTools } from './tools/intelligence.js';
import { registerTerminalTools } from './tools/terminal.js';
import { registerTaskTools } from './tools/tasks.js';
import { registerDebugTools } from './tools/debug.js';
import { registerGitTools } from './tools/git.js';
import { registerTodoTools } from './tools/todos.js';
import { registerCommandTools } from './tools/commands.js';
import { registerAgentTools } from './tools/agent.js';

const MCP_PORT = parseInt(process.env.MCP_PORT ?? '7337', 10);
const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT ?? '7100', 10);
const MCP_TOKEN = process.env.MCP_TOKEN ?? '';
const BRIDGE_SECRET = process.env.BRIDGE_SECRET ?? '';
const NODE_ENV = process.env.NODE_ENV ?? 'production';
const BRIDGE_HOST = process.env.BRIDGE_HOST ?? '127.0.0.1';
const MCP_HOST = process.env.MCP_HOST ?? '127.0.0.1';

if (!MCP_TOKEN) {
  const suggestion = generateToken();
  console.error('\u274c MCP_TOKEN n\u00e3o configurado!');
  console.error(`MCP_TOKEN=${suggestion}`);
  process.exit(1);
}

if (!BRIDGE_SECRET) {
  const suggestion = generateToken().slice(0, 32);
  console.error('\u274c BRIDGE_SECRET n\u00e3o configurado!');
  console.error(`BRIDGE_SECRET=${suggestion}`);
  process.exit(1);
}

initAuth(MCP_TOKEN);

bridge.start(BRIDGE_PORT, BRIDGE_SECRET, BRIDGE_HOST);

bridge.on('connected', (hello) => {
  console.log(`[bridge] \u2705 VS Code conectado: ${hello.workspaceFolders.join(', ')}`);
});
bridge.on('disconnected', (hello) => {
  console.log(`[bridge] \ud83d\udd34 VS Code desconectado: ${hello.workspaceFolders.join(', ')}`);
});

function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'vscode-mcp-total', version: '1.0.0' });
  registerHealthTools(server);
  registerWorkspaceTools(server);
  registerFileTools(server);
  registerIntelligenceTools(server);
  registerTerminalTools(server);
  registerTaskTools(server);
  registerDebugTools(server);
  registerGitTools(server);
  registerTodoTools(server);
  registerCommandTools(server);
  registerAgentTools(server);
  return server;
}

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => { next(); });

app.get('/ping', (_req, res) => {
  res.json({ ok: true, server: 'vscode-mcp-total', version: '1.0.0', bridgeConnected: bridge.isConnected(), workspaces: bridge.getWorkspaces().length });
});

app.post('/mcp/:token', authMiddleware, async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[mcp] Error handling request:', err);
    if (!res.headersSent) { res.status(500).json({ error: 'Internal server error' }); }
  }
});

app.get('/mcp/:token', authMiddleware, async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error('[mcp] Error handling SSE request:', err);
    if (!res.headersSent) { res.status(500).json({ error: 'Internal server error' }); }
  }
});

app.delete('/mcp/:token', authMiddleware, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  try { await transport.handleRequest(req, res); } catch (err) { res.status(200).json({ ok: true }); }
});

app.use((_req, res) => { res.status(404).json({ error: 'Not found' }); });

app.listen(MCP_PORT, MCP_HOST, () => {
  console.log(`\n[server] VS Code MCP Total running on http://${MCP_HOST}:${MCP_PORT}`);
  console.log(`[server] Bridge WS on ws://${BRIDGE_HOST}:${BRIDGE_PORT}`);
  console.log(`[server] Ping: http://${MCP_HOST}:${MCP_PORT}/ping`);
  console.log(`[server] Environment: ${NODE_ENV}\n`);
});

process.on('SIGINT', () => { bridge.stop(); process.exit(0); });
process.on('SIGTERM', () => { bridge.stop(); process.exit(0); });
