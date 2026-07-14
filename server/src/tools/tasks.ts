/**
 * tools/tasks.ts – Gerenciamento de tasks do VS Code
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerTaskTools(server: McpServer): void {

  server.tool('vscode_list_tasks', 'Lista todas as tasks definidas no workspace.', { type: z.string().optional().describe('Filtrar por tipo') },
    async ({ type }) => { try { const r = await bridge.call('tasks.list', { type }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );

  server.tool('vscode_run_task', 'Executa uma task pelo nome.', { name: z.string().describe('Nome da task'), waitForCompletion: z.boolean().optional().default(true) },
    async ({ name, waitForCompletion }) => { try { const r = await bridge.call('tasks.run', { name, waitForCompletion }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );

  server.tool('vscode_create_task', 'Cria uma nova task.', { name: z.string(), command: z.string(), type: z.string().optional().default('shell'), group: z.enum(['build', 'test', 'none']).optional(), problemMatcher: z.string().optional() },
    async ({ name, command, type, group, problemMatcher }) => { try { const r = await bridge.call('tasks.create', { name, command, type, group, problemMatcher }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );

  server.tool('vscode_terminate_task', 'Encerra uma task em execução.', { name: z.string() },
    async ({ name }) => { try { const r = await bridge.call('tasks.terminate', { name }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );
}
