/**
 * tools/terminal.ts – Controle de terminais integrados do VS Code
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerTerminalTools(server: McpServer): void {

  server.tool('vscode_run_command', 'Executa um comando shell no terminal integrado do VS Code.',
    { command: z.string().describe('Comando shell'), terminalId: z.string().optional(), cwd: z.string().optional(), timeout: z.number().optional().default(30000) },
    async ({ command, terminalId, cwd, timeout }) => { try { const r = await bridge.call('terminal.runCommand', { command, terminalId, cwd, timeout }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );

  server.tool('vscode_terminal_send', 'Envia texto a um terminal do VS Code.',
    { text: z.string(), terminalId: z.string().optional(), addNewLine: z.boolean().optional().default(true) },
    async ({ text, terminalId, addNewLine }) => { try { const r = await bridge.call('terminal.sendText', { text, terminalId, addNewLine }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );

  server.tool('vscode_list_terminals', 'Lista todos os terminais abertos no VS Code.', {},
    async () => { try { const r = await bridge.call('terminal.list', {}); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } }
  );
}
