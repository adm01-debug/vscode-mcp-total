/**
 * tools/git.ts – Operações Git via VS Code SCM API
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerGitTools(server: McpServer): void {
  server.tool('vscode_git_status', 'Retorna status do repositório Git.', { workspaceFolder: z.string().optional() },
    async ({ workspaceFolder }) => { try { const r = await bridge.call('git.status', { workspaceFolder }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_git_diff', 'Mostra o diff.', { path: z.string().optional(), staged: z.boolean().optional().default(false), workspaceFolder: z.string().optional() },
    async ({ path, staged, workspaceFolder }) => { try { const r = await bridge.call('git.diff', { path, staged, workspaceFolder }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_git_commit', 'Stage e commit.', { message: z.string(), files: z.array(z.string()).optional(), amend: z.boolean().optional().default(false), workspaceFolder: z.string().optional() },
    async ({ message, files, amend, workspaceFolder }) => { try { const r = await bridge.call('git.commit', { message, files, amend, workspaceFolder }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_git_branch', 'Gerencia branches.', { action: z.enum(['list','create','checkout','delete','rename']), name: z.string().optional(), newName: z.string().optional(), remote: z.boolean().optional().default(false), workspaceFolder: z.string().optional() },
    async ({ action, name, newName, remote, workspaceFolder }) => { try { const r = await bridge.call('git.branch', { action, name, newName, remote, workspaceFolder }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_git_sync', 'Sincroniza com remoto.', { action: z.enum(['fetch','pull','push','sync']), remote: z.string().optional(), branch: z.string().optional(), force: z.boolean().optional().default(false), workspaceFolder: z.string().optional() },
    async ({ action, remote, branch, force, workspaceFolder }) => { try { const r = await bridge.call('git.sync', { action, remote, branch, force, workspaceFolder }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });

  server.tool('vscode_git_log', 'Histórico de commits.', { limit: z.number().optional().default(20), branch: z.string().optional(), path: z.string().optional(), workspaceFolder: z.string().optional() },
    async ({ limit, branch, path, workspaceFolder }) => { try { const r = await bridge.call('git.log', { limit, branch, path, workspaceFolder }); return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] }; } catch (e) { return { content: [{ type: 'text', text: `Erro: ${(e as Error).message}` }], isError: true }; } });
}
