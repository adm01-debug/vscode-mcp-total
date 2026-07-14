/**
 * tools/workspace.ts – Informações do workspace e estado geral do VS Code
 * CORREÇÃO: usa 'workspace.tabs' (não 'tabs.list') e 'workspace.status' (não 'status.get')
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerWorkspaceTools(server: McpServer): void {

  server.tool(
    'vscode_list_workspaces',
    'Lista todos os workspaces abertos nas instâncias conectadas do VS Code.',
    {},
    async () => {
      try {
        const result = await bridge.call('workspace.listWorkspaces', {});
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Erro: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    'vscode_list_open_tabs',
    'Lista todas as tabs (arquivos) abertas no VS Code com seu estado (ativo, dirty, preview).',
    {
      workspaceFolder: z.string().optional().describe('Filtrar por pasta de workspace'),
    },
    async ({ workspaceFolder }) => {
      try {
        const result = await bridge.call('workspace.tabs', { workspaceFolder });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Erro: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    'vscode_get_status',
    'Retorna um snapshot completo do estado atual do VS Code: arquivo ativo, cursor, seleção, linguagem, indentação, git branch.',
    {
      workspaceFolder: z.string().optional().describe('Workspace específico (omitir = instância ativa)'),
    },
    async ({ workspaceFolder }) => {
      try {
        const result = await bridge.call('workspace.status', { workspaceFolder });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Erro: ${(err as Error).message}` }], isError: true };
      }
    }
  );
}
