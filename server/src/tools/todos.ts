/**
 * tools/todos.ts – Gerenciamento de TODOs no VS Code
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerTodosTools(server: McpServer): void {

  server.tool('vscode_todo_add', 'Adiciona um novo TODO.', { text: z.string(), priority: z.enum(['high','medium','low']).optional().default('medium'), file: z.string().optional(), line: z.number().optional(), tag: z.string().optional() },
    async ({ text, priority, file, line, tag }) => { try { const r = await bridge.call('todos.add', { text, priority, file, line, tag }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );

  server.tool('vscode_todo_list', 'Lista todos os TODOs.', { filter: z.string().optional(), priority: z.enum(['high','medium','low']).optional(), path: z.string().optional() },
    async ({ filter, priority, path }) => { try { const r = await bridge.call('todos.list', { filter, priority, path }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );

  server.tool('vscode_todo_update', 'Atualiza um TODO existente.', { id: z.string(), text: z.string().optional(), priority: z.enum(['high','medium','low']).optional() },
    async ({ id, text, priority }) => { try { const r = await bridge.call('todos.update', { id, text, priority }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );

  server.tool('vscode_todo_done', 'Marca um TODO como concluído.', { id: z.string(), deleteComment: z.boolean().optional().default(false) },
    async ({ id, deleteComment }) => { try { const r = await bridge.call('todos.done', { id, deleteComment }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );
}
