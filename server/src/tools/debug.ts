/**
 * tools/debug.ts – Controle do debugger do VS Code
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerDebugTools(server: McpServer): void {
  server.tool('vscode_start_debug', 'Inicia uma sessão de debug.', { configName: z.string().optional(), workspaceFolder: z.string().optional(), noDebug: z.boolean().optional().default(false) },
    async ({ configName, workspaceFolder, noDebug }) => { try { const r = await bridge.call('debug.start', { configName, workspaceFolder, noDebug }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_debug_control', 'Controla o fluxo do debug.', { action: z.enum(['continue','pause','stepOver','stepIn','stepOut','stop','restart']), threadId: z.number().optional() },
    async ({ action, threadId }) => { try { const r = await bridge.call('debug.control', { action, threadId }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_set_breakpoint', 'Adiciona breakpoint.', { path: z.string(), line: z.number(), enabled: z.boolean().optional().default(true), condition: z.string().optional(), logMessage: z.string().optional() },
    async ({ path, line, enabled, condition, logMessage }) => { try { const r = await bridge.call('debug.setBreakpoint', { path, line, enabled, condition, logMessage }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_debug_eval', 'Avalia expressão na sessão de debug.', { expression: z.string(), frameId: z.number().optional() },
    async ({ expression, frameId }) => { try { const r = await bridge.call('debug.evaluate', { expression, frameId }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_list_breakpoints', 'Lista todos os breakpoints.', {},
    async () => { try { const r = await bridge.call('debug.listBreakpoints', {}); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });
}
