/**
 * tools/intelligence.ts – Language Intelligence (LSP) via VS Code
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerIntelligenceTools(server: McpServer): void {
  server.tool('vscode_get_diagnostics', 'Obtém diagnósticos LSP.', { path: z.string().optional(), severity: z.enum(['error','warning','information','hint']).optional() },
    async ({ path, severity }) => { try { const r = await bridge.call('intelligence.getDiagnostics', { path, severity }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_document_symbols', 'Lista símbolos de um arquivo.', { path: z.string() },
    async ({ path }) => { try { const r = await bridge.call('intelligence.documentSymbols', { path }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_workspace_symbols', 'Busca símbolos no workspace.', { query: z.string() },
    async ({ query }) => { try { const r = await bridge.call('intelligence.workspaceSymbols', { query }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_go_to_definition', 'Vai para a definição de um símbolo.', { path: z.string(), line: z.number(), column: z.number() },
    async ({ path, line, column }) => { try { const r = await bridge.call('intelligence.goToDefinition', { path, line, column }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_find_references', 'Encontra referências a um símbolo.', { path: z.string(), line: z.number(), column: z.number(), includeDeclaration: z.boolean().optional().default(true) },
    async ({ path, line, column, includeDeclaration }) => { try { const r = await bridge.call('intelligence.findReferences', { path, line, column, includeDeclaration }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_hover', 'Obtém info de hover.', { path: z.string(), line: z.number(), column: z.number() },
    async ({ path, line, column }) => { try { const r = await bridge.call('intelligence.hover', { path, line, column }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_rename_symbol', 'Renomeia símbolo via LSP.', { path: z.string(), line: z.number(), column: z.number(), newName: z.string() },
    async ({ path, line, column, newName }) => { try { const r = await bridge.call('intelligence.renameSymbol', { path, line, column, newName }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_code_actions', 'Lista/executa code actions.', { path: z.string(), line: z.number(), column: z.number(), actionTitle: z.string().optional() },
    async ({ path, line, column, actionTitle }) => { try { const r = await bridge.call('intelligence.codeActions', { path, line, column, actionTitle }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_format', 'Formata arquivo.', { path: z.string(), startLine: z.number().optional(), endLine: z.number().optional() },
    async ({ path, startLine, endLine }) => { try { const r = await bridge.call('intelligence.format', { path, startLine, endLine }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_organize_imports', 'Organiza imports.', { path: z.string() },
    async ({ path }) => { try { const r = await bridge.call('intelligence.organizeImports', { path }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });
}
