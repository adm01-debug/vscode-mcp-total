import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface BridgeHello { type: 'hello'; workspaceFolders: string[]; vscodeVersion: string; machineId: string; extensionVersion: string; hasGit: boolean; sharedSecret?: string; }
export interface BridgeMessage { id: string; method: string; params: Record<string, unknown>; }
export interface BridgeResponse { id: string; result?: unknown; error?: { code: string; message: string }; }
export interface BridgeEvent { type: 'event'; event: string; data: unknown; }
interface PendingCall { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>; }
interface BridgeConnection { ws: WebSocket; hello: BridgeHello; pending: Map<string, PendingCall>; connectedAt: Date; }

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
      if (!isDockerMode && remoteAddr !== '127.0.0.1' && remoteAddr !== '::1' && remoteAddr !== '::ffff:127.0.0.1') { ws.close(1008, 'Forbidden'); return; }
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
          for (const folder of hello.workspaceFolders) { this.connections.set(this.nKey(folder), { ws, hello, pending, connectedAt: new Date() }); }
          this.connections.set('machine:' + hello.machineId, { ws, hello, pending, connectedAt: new Date() });
          console.log('[bridge] Connected: ' + hello.workspaceFolders.join(', '));
          this.emit('connected', hello);
          return;
        }
        const resp = msg as BridgeResponse;
        if (resp.id && pending.has(resp.id)) {
          const call = pending.get(resp.id)!; clearTimeout(call.timer); pending.delete(resp.id);
          if (resp.error) { call.reject(new Error('[bridge:' + resp.error.code + '] ' + resp.error.message)); } else { call.resolve(resp.result); }
          return;
        }
        const evt = msg as BridgeEvent;
        if (evt.type === 'event') { this.emit('vscode-event', evt.event, evt.data); }
      });
      ws.on('close', () => {
        if (!hello) return;
        for (const folder of hello.workspaceFolders) { this.connections.delete(this.nKey(folder)); }
        this.connections.delete('machine:' + hello.machineId);
        for (const call of pending.values()) { clearTimeout(call.timer); call.reject(new Error('[bridge] Disconnected')); }
        pending.clear();
        this.emit('disconnected', hello);
      });
      ws.on('error', (err) => { console.error('[bridge] WS error:', err.message); });
    });
    console.log('[bridge] Listening on ws://' + bindHost + ':' + port);
  }

  async call(method: string, params: Record<string, unknown>, workspacePath?: string): Promise<unknown> {
    const conn = this.findConn(workspacePath);
    if (!conn) {
      const avail = this.getWorkspaces();
      if (avail.length === 0) throw new Error('No VS Code connected');
      throw new Error('Workspace not found: ' + workspacePath);
    }
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => { conn.pending.delete(id); reject(new Error('[bridge] Timeout ' + method)); }, this.callTimeout);
      conn.pending.set(id, { resolve, reject, timer });
      conn.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  getWorkspaces(): Array<{ path: string; vscodeVersion: string; connectedAt: Date; hasGit: boolean }> {
    const seen = new Set<string>(); const result: Array<{ path: string; vscodeVersion: string; connectedAt: Date; hasGit: boolean }> = [];
    for (const [key, conn] of this.connections) {
      if (key.startsWith('machine:')) continue;
      if (seen.has(conn.hello.machineId + key)) continue;
      seen.add(conn.hello.machineId + key);
      result.push({ path: key, vscodeVersion: conn.hello.vscodeVersion, connectedAt: conn.connectedAt, hasGit: conn.hello.hasGit });
    }
    return result;
  }

  isConnected(wp?: string): boolean { return !!this.findConn(wp); }
  getConnectionCount(): number { const m = new Set<string>(); for (const c of this.connections.values()) m.add(c.hello.machineId); return m.size; }

  private findConn(wp?: string): BridgeConnection | null {
    if (wp) return this.connections.get(this.nKey(wp)) ?? null;
    const f = this.connections.values().next(); return f.done ? null : f.value;
  }

  private nKey(p: string): string {
    // Normalize Windows backslashes to forward slashes
    let normalized = '';
    for (let i = 0; i < p.length; i++) {
      normalized += p[i] === String.fromCharCode(92) ? '/' : p[i];
    }
    return normalized.toLowerCase().replace(/\/$/, '');
  }

  stop(): void { this.wss?.close(); }
}

export const bridge = new BridgeRegistry();
