/**
 * tools/commands.ts – Execução de comandos VS Code e interação com UI
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export const DEFAULT_ALLOWED_COMMANDS = ['editor.action.clipboardCopyAction','editor.action.clipboardPasteAction','workbench.action.files.save','workbench.action.files.saveAll','workbench.action.reloadWindow','editor.action.formatDocument','editor.action.organizeImports','editor.action.fixAll','git.refresh','git.stage','git.unstage','testing.runAll'];

export function registerCommandTools(server: McpServer): void {
  server.tool('vscode_execute_command', 'Executa qualquer comando do VS Code pela sua ID.', { command: z.string(), args: z.array(z.unknown()).optional() },
    async ({ command, args }) => { try { const r = await bridge.call('commands.execute', { command, args }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_list_commands', 'Lista comandos disponíveis.', { filter: z.string().optional() },
    async ({ filter }) => { try { const r = await bridge.call('commands.list', { filter }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_show_message', 'Exibe notificação no VS Code.', { message: z.string(), type: z.enum(['info','warning','error']).optional().default('info'), actions: z.array(z.string()).optional() },
    async ({ message, type, actions }) => { try { const r = await bridge.call('commands.showMessage', { message, type, actions }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_open_diff', 'Abre editor de diff.', { leftPath: z.string(), rightPath: z.string(), title: z.string().optional() },
    async ({ leftPath, rightPath, title }) => { try { const r = await bridge.call('commands.openDiff', { leftPath, rightPath, title }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_show_input', 'Abre input box.', { prompt: z.string(), placeholder: z.string().optional(), value: z.string().optional(), password: z.boolean().optional().default(false) },
    async ({ prompt, placeholder, value, password }) => { try { const r = await bridge.call('commands.showInput', { prompt, placeholder, value, password }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_show_quick_pick', 'Abre quick pick.', { items: z.array(z.object({label: z.string(), description: z.string().optional(), detail: z.string().optional()})), title: z.string().optional(), placeholder: z.string().optional(), multiSelect: z.boolean().optional().default(false) },
    async ({ items, title, placeholder, multiSelect }) => { try { const r = await bridge.call('commands.showQuickPick', { items, title, placeholder, multiSelect }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });
}
