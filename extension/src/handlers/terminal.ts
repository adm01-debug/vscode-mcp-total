import * as vscode from 'vscode';

export async function handleTerminal(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'runCommand': {
      const command = params.command as string;
      const cwd = params.cwd as string | undefined;
      const name = params.name as string || 'MCP';
      const terminal = vscode.window.createTerminal({ name, cwd });
      terminal.show();
      terminal.sendText(command);
      return { success: true, terminalName: name };
    }

    case 'sendText': {
      const text = params.text as string;
      const terminalName = params.terminal as string | undefined;
      let target: vscode.Terminal | undefined;
      if (terminalName) {
        target = vscode.window.terminals.find(t => t.name === terminalName);
      }
      if (!target) {
        target = vscode.window.activeTerminal || vscode.window.terminals[0];
      }
      if (!target) {
        throw new Error('No terminal available');
      }
      target.sendText(text, params.addNewLine !== false);
      return { success: true, terminal: target.name };
    }

    case 'list': {
      return {
        terminals: vscode.window.terminals.map(t => ({
          name: t.name,
          processId: t.processId,
        })),
        active: vscode.window.activeTerminal?.name || null,
      };
    }

    default:
      throw new Error(`Unknown terminal action: ${action}`);
  }
}
