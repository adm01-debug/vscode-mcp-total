/**
 * tools/health.ts — Health check and system information
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerHealthTools(server: McpServer): void {

  server.tool(
    'health_check',
    'Verifica o status do servidor MCP, a conexão com a extensão-ponte do VS Code e o estado geral do sistema.',
    {
      verbose: z.boolean().default(false).describe('Retornar informações detalhadas do sistema'),
    },
    async ({ verbose }) => {
      const connected = bridge.isConnected();
      const connectionCount = bridge.getConnectionCount();
      const workspaces = bridge.getWorkspaces();

      const statusLines: string[] = [
        `🟢 Servidor MCP: online`,
        `${connected ? '🟢' : '🔴'} Extensão VS Code: ${connected ? `conectada (${connectionCount} janela(s))` : 'desconectada'}`,
      ];

      if (workspaces.length > 0) {
        statusLines.push(`\n📁 Workspaces ativos:`);
        for (const ws of workspaces) {
          statusLines.push(`  • ${ws.path} (VS Code ${ws.vscodeVersion})`);
        }
      }

      if (!connected) {
        statusLines.push(
          '\n⚠️ Para conectar:',
          '  1. Abra o VS Code no PC',
          '  2. Instale a extensão "VS Code MCP Bridge"',
          '  3. A extensão conecta automaticamente ao servidor'
        );
      }

      if (verbose) {
        statusLines.push(
          '\n📊 Sistema:',
          `  Node.js: ${process.version}`,
          `  Plataforma: ${process.platform}`,
          `  Memória: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
          `  Uptime: ${Math.round(process.uptime())}s`,
        );
      }

      return {
        content: [{ type: 'text', text: statusLines.join('\n') }],
      };
    }
  );
}
