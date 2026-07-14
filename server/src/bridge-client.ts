/**
 * bridge-client.ts — manages WebSocket connections from VS Code extension instances.
 *
 * Protocol (JSON over WebSocket):
 *   Client → Server:  { type: "hello", workspaceFolders: string[], vscodeVersion: string, machineId: string }
 *   Server → Client:  { id: string, method: string, params: Record<string,unknown> }
 *   Client → Server:  { id: string, result?: unknown, error?: { code: string, message: string } }
 *   Client → Server:  { type: "event", event: string, data: unknown }
 */

import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface BridgeHello {
  type: 'hello';
  workspaceFolders: string[];
  vscodeVersion: string;
  machineId: string;
  extensionVersion: string;
  hasGit: boolean;
  sharedSecret?: string;
}

export interface BridgeMessage {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface BridgeResponse {
  id: string;
  result?: unknown;
  error?: { code: string; message: string };
}

export interface BridgeEvent {
  type: 'event';
  event: string;
  data: unknown;
}

interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface BridgeConnection {
  ws: WebSocket;
  hello: BridgeHello;
  pending: Map<string, PendingCall>;
  connectedAt: Date;
}

class BridgeRegistry extends EventEmitter {
  private connections = new Map<string, BridgeConnection>();
  private wss: WebSocketServer | null = null;
  private sharedSecret: string | null = null;
  private callTimeout = 30_000;

  start(port: number, sharedSecret: string, host?: string): void {
    this.sharedSecret = sharedSecret;
    const bindHost = host ?? '127.0.0.1';
    const isDockerMode = bindHost === '0.0.0.0';

    this.wss = new WebSocketServer({ host: bindHost, port });

    this.wss.on('connection', (ws, req) => {
      const remoteAddr = req.socket.remoteAddress ?? '';
      if (!isDockerMode) {
        if (remoteAddr !== '127.0.0.1' && remoteAddr !== '::1' && remoteAddr !== '::ffff:127.0.0.1') {
          ws.close(1008, 'Forbidden');
          return;
        }
      }

      let hello: BridgeHello | null = null;
      const pending = new Map<string, PendingCall>();

      ws.on('message', (raw) => {
        let msg: unknown;
        try { msg = JSON.parse(raw.toString()); } catch { return; }

        if (!hello) {
          const h = msg as BridgeHello;
          if (h.type !== 'hello') { ws.close(1002, 'Expected hello'); return; }
          if (this.sharedSecret && h.sharedSecret !== this.sharedSecret) { ws.close(1008, 'Invalid shared secret'); return; }

          hello = h;
          for (const folder of hello.workspaceFolders) {
            this.connections.set(this._normalizeKey(folder), { ws, hello, pending, connectedAt: new Date() });
          }
          this.connections.set(`machine:${hello.machineId}`, { ws, hello, pending, connectedAt: new Date() });
          console.log(`[bridge] Extension connected: ${hello.workspaceFolders.join(', ')} (VS Code ${hello.vscodeVersion})`);
          this.emit('connected', hello);
          return;
        }

        const resp = msg as BridgeResponse;
        if (resp.id && pending.has(resp.id)) {
          const call = pending.get(resp.id)!;
          clearTimeout(call.timer);
          pending.delete(resp.id);
          if (resp.error) { call.reject(new Error(`[bridge:${resp.error.code}] ${resp.error.message}`)); }
          else { call.resolve(resp.result); }
          return;
        }

        const evt = msg as BridgeEvent;
        if (evt.type === 'event') { this.emit('vscode-event', evt.event, evt.data); }
      });

      ws.on('close', () => {
        if (!hello) return;
        for (const folder of hello.workspaceFolders) { this.connections.delete(this._normalizeKey(folder)); }
        this.connections.delete(`machine:${hello.machineId}`);
        for (const call of pending.values()) { clearTimeout(call.timer); call.reject(new Error('[bridge] VS Code disconnected')); }
        pending.clear();
        console.log(`[bridge] Extension disconnected: ${hello.workspaceFolders.join(', ')}`);
        this.emit('disconnected', hello);
      });

      ws.on('error', (err) => { console.error('[bridge] WebSocket error:', err.message); });
    });

    console.log(`[bridge] Listening for VS Code extensions on ws://${bindHost}:${port}`);
  }

  async call(method: string, params: Record<string, unknown>, workspacePath?: string): Promise<unknown> {
    const conn = this._findConnection(workspacePath);
    if (!conn) {
      const available = this.getWorkspaces();
      if (available.length === 0) {
        throw new Error('Nenhuma inst\u00e2ncia do VS Code conectada. Abra o VS Code com a extens\u00e3o \"VS Code MCP Bridge\" ativa.');
      }
      throw new Error(`Workspace n\u00e3o encontrado: \"${workspacePath}\". Dispon\u00edveis: ${available.map(w => w.path).join(', ')}`);
    }

    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const msg: BridgeMessage = { id, method, params };
      const timer = setTimeout(() => {
        conn.pending.delete(id);
        reject(new Error(`[bridge] Timeout (${this.callTimeout}ms) aguardando resposta de ${method}`));
      }, this.callTimeout);
      conn.pending.set(id, { resolve, reject, timer });
      conn.ws.send(JSON.stringify(msg));
    });
  }

  getWorkspaces(): Array<{ path: string; vscodeVersion: string; connectedAt: Date; hasGit: boolean }> {
    const seen = new Set<string>();
    const result: Array<{ path: string; vscodeVersion: string; connectedAt: Date; hasGit: boolean }> = [];
    for (const [key, conn] of this.connections) {
      if (key.startsWith('machine:')) continue;
      if (seen.has(conn.hello.machineId + key)) continue;
      seen.add(conn.hello.machineId + key);
      result.push({ path: key, vscodeVersion: conn.hello.vscodeVersion, connectedAt: conn.connectedAt, hasGit: conn.hello.hasGit });
    }
    return result;
  }

  isConnected(workspacePath?: string): boolean { return !!this._findConnection(workspacePath); }

  getConnectionCount(): number {
    const machines = new Set<string>();
    for (const conn of this.connections.values()) { machines.add(conn.hello.machineId); }
    return machines.size;
  }

  private _findConnection(workspacePath?: string): BridgeConnection | null {
    if (workspacePath) { return this.connections.get(this._normalizeKey(workspacePath)) ?? null; }
    const first = this.connections.values().next();
    return first.done ? null : first.value;
  }

  private _normalizeKey(path: string): string {
    return path.replace(/\\\\/g, '/').toLowerCase().replace(/\\/$/, '');
  }

  stop(): void { this.wss?.close(); }
}

export const bridge = new BridgeRegistry();
