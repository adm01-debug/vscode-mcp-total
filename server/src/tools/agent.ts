/**
 * tools/agent.ts – Delegação para Claude Code CLI no code-server
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { bridge } from '../bridge-client.js';

export function registerAgentTools(server: McpServer): void {

  server.tool(
    'vscode_delegate_to_agent',
    'Delega uma tarefa complexa ao Claude Code CLI rodando no code-server.',
    {
      task: z.string().describe('Descrição da tarefa para o agente'),
      workspaceFolder: z.string().optional().describe('Pasta do workspace'),
      sessionId: z.string().optional().describe('ID de sessão para continuar tarefa existente'),
      maxTurns: z.number().optional().default(10).describe('Número máximo de turnos'),
    },
    async ({ task, workspaceFolder, sessionId, maxTurns }) => {
      try {
        const result = await bridge.call('agent.delegate', { task, workspaceFolder, sessionId, maxTurns });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Erro: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    'vscode_agent_continue',
    'Envia mensagem de acompanhamento para sessão de agente em andamento.',
    {
      sessionId: z.string().describe('ID da sessão do agente'),
      message: z.string().describe('Mensagem de continuação'),
    },
    async ({ sessionId, message }) => {
      try {
        const result = await bridge.call('agent.continue', { sessionId, message });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Erro: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    'vscode_agent_status',
    'Verifica o status de uma sessão de agente.',
    {
      sessionId: z.string().optional().describe('ID da sessão'),
    },
    async ({ sessionId }) => {
      try {
        const result = await bridge.call('agent.status', { sessionId });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Erro: ${(err as Error).message}` }], isError: true };
      }
    }
  );
}
