import * as vscode from 'vscode';
import WebSocket from 'ws';
import { validateSecret } from './security';
import { handleTerminal } from './handlers/terminal';
import { handleFiles } from './handlers/files';
import { handleIntelligence } from './handlers/intelligence';
import { handleTasks } from './handlers/tasks';
import { handleDebug } from './handlers/debug';
import { handleGit } from './handlers/git';
import { handleTodos } from './handlers/todos';
import { handleCommands } from './handlers/commands';
import { handleUI } from './handlers/ui';
import { handleAgent } from './handlers/agent';
import { handleWorkspace } from './handlers/workspace';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let statusBarItem: vscode.StatusBarItem;
const RECONNECT_INTERVAL = 5000;

export function activate(context: vscode.ExtensionContext): void {
  console.log('[mcp-bridge] Extension activating...');

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(plug) MCP: Connecting...';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  connect(context);

  // Reconnect on config change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('vscodeMcp')) {
        disconnect();
        connect(context);
      }
    })
  );

  // Manual reconnect command
  context.subscriptions.push(
    vscode.commands.registerCommand('vscodeMcp.reconnect', () => {
      disconnect();
      connect(context);
    })
  );
}

export function deactivate(): void {
  disconnect();
}

function getConnectionUrl(): string {
  const config = vscode.workspace.getConfiguration('vscodeMcp');
  const host = config.get<string>('bridgeHost', '127.0.0.1');
  const port = config.get<number>('bridgePort', 7100);
  return `ws://${host}:${port}`;
}

function connect(_context: vscode.ExtensionContext): void {
  if (ws) return;

  const url = getConnectionUrl();
  console.log(`[mcp-bridge] Connecting to ${url}...`);

  try {
    ws = new WebSocket(url);
  } catch (err) {
    console.error('[mcp-bridge] Failed to create WebSocket:', err);
    scheduleReconnect(_context);
    return;
  }

  ws.on('open', () => {
    console.log('[mcp-bridge] Connected!');
    statusBarItem.text = '$(plug) MCP: Connected';
    statusBarItem.backgroundColor = undefined;

    // Send hello message
    const hello = buildHello();
    ws?.send(JSON.stringify(hello));
  });

  ws.on('message', async (raw: WebSocket.RawData) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      console.error('[mcp-bridge] Invalid JSON received');
      return;
    }

    // Dispatch bridge messages (has id + method)
    if (msg.id && msg.method) {
      try {
        const result = await dispatch(msg.method, msg.params ?? {});
        ws?.send(JSON.stringify({ id: msg.id, result }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        ws?.send(JSON.stringify({
          id: msg.id,
          error: { code: 'HANDLER_ERROR', message: error.message },
        }));
      }
    }
  });

  ws.on('close', (code: number, reason: Buffer) => {
    console.log(`[mcp-bridge] Disconnected: ${code} ${reason.toString()}`);
    ws = null;
    statusBarItem.text = '$(plug) MCP: Disconnected';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    scheduleReconnect(_context);
  });

  ws.on('error', (err: Error) => {
    console.error('[mcp-bridge] WebSocket error:', err.message);
  });
}

function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}

function scheduleReconnect(context: vscode.ExtensionContext): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(context);
  }, RECONNECT_INTERVAL);
}

function buildHello(): Record<string, unknown> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const gitExtension = vscode.extensions.getExtension('vscode.git');

  return {
    type: 'hello',
    workspaceFolders: folders.map((f) => f.uri.fsPath),
    vscodVersion: vscode.version,
    machineId: vscode.env.machineId,
    extensionVersion: '1.0.0',
    hasGit: !!gitExtension,
    sharedSecret: getSecret(),
  };
}

function getSecret(): string {
  const config = vscode.workspace.getConfiguration('vscodeMcp');
  return config.get<string>('bridgeSecret', '') || process.env.BRIDGE_SECRET || '';
}

/**
 * Dispatch a bridge method call to the appropriate handler.
 */
async function dispatch(method: string, params: Record<string, unknown>): Promise<unknown> {
  const [domain, action] = method.split('.');

  switch (domain) {
    case 'terminal':
      return handleTerminal(action, params);

    case 'files':
      return handleFiles(action, params);

    case 'intelligence':
      return handleIntelligence(action, params);

    case 'tasks':
      return handleTasks(action, params);

    case 'debug':
      return handleDebug(action, params);

    case 'git':
      return handleGit(action, params);

    case 'todos':
      return handleTodos(action, params);

    case 'commands':
      return handleCommands(action, params);

    case 'ui':
      return handleUI(action, params);

    case 'agent':
      return handleAgent(action, params);

    case 'workspace':
      return handleWorkspace(action, params);

    default:
      throw new Error(`Unknown method domain: ${domain}`);
  }
}
