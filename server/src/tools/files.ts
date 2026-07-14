/**
 * tools/files.ts – Operações de sistema de arquivos via VS Code
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerFilesTools(server: McpServer): void {
  server.tool('vscode_open', 'Abre um arquivo no editor.', { path: z.string(), line: z.number().optional(), column: z.number().optional(), preview: z.boolean().optional().default(false) },
    async ({ path, line, column, preview }) => { try { const r = await bridge.call('files.open', { path, line, column, preview }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_read_file', 'Lê conteúdo de um arquivo.', { path: z.string(), startLine: z.number().optional(), endLine: z.number().optional() },
    async ({ path, startLine, endLine }) => { try { const r = await bridge.call('files.readFile', { path, startLine, endLine }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_write_file', 'Escreve conteúdo em um arquivo.', { path: z.string(), content: z.string(), createIfNotExists: z.boolean().optional().default(true) },
    async ({ path, content, createIfNotExists }) => { try { const r = await bridge.call('files.writeFile', { path, content, createIfNotExists }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_edit_file', 'Aplica edições pontuais.', { path: z.string(), edits: z.array(z.object({ oldText: z.string().optional(), newText: z.string(), startLine: z.number().optional(), endLine: z.number().optional() })) },
    async ({ path, edits }) => { try { const r = await bridge.call('files.editFile', { path, edits }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_find_files', 'Busca arquivos por glob.', { pattern: z.string(), exclude: z.string().optional(), maxResults: z.number().optional().default(100) },
    async ({ pattern, exclude, maxResults }) => { try { const r = await bridge.call('files.findFiles', { pattern, exclude, maxResults }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_search_in_files', 'Busca texto dentro dos arquivos.', { query: z.string(), isRegex: z.boolean().optional().default(false), caseSensitive: z.boolean().optional().default(false), include: z.string().optional(), exclude: z.string().optional(), maxResults: z.number().optional().default(50) },
    async ({ query, isRegex, caseSensitive, include, exclude, maxResults }) => { try { const r = await bridge.call('files.searchInFiles', { query, isRegex, caseSensitive, include, exclude, maxResults }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_save_all', 'Salva todos os arquivos abertos.', { includeUntitled: z.boolean().optional().default(false) },
    async ({ includeUntitled }) => { try { const r = await bridge.call('files.saveAll', { includeUntitled }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_file_ops', 'Operações de arquivo.', { operation: z.enum(['copy','move','rename','delete']), source: z.string(), destination: z.string().optional(), overwrite: z.boolean().optional().default(false) },
    async ({ operation, source, destination, overwrite }) => { try { const r = await bridge.call('files.ops', { operation, source, destination, overwrite }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });
}
