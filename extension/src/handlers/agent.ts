import * as vscode from 'vscode';

export async function handleAgent(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'delegate': {
      const task = params.task as string;
      try {
        await vscode.commands.executeCommand('workbench.action.chat.open', { query: task });
        return { success: true, delegated: true, task };
      } catch {
        const terminal = vscode.window.createTerminal({ name: `Agent: ${task.slice(0, 30)}` });
        terminal.show();
        return { success: true, delegated: false, fallback: 'terminal', task };
      }
    }

    case 'continue': {
      const input = params.input as string | undefined;
      try {
        if (input) {
          await vscode.commands.executeCommand('workbench.action.chat.open', { query: input });
        } else {
          await vscode.commands.executeCommand('workbench.action.chat.open');
        }
        return { success: true };
      } catch {
        return { success: false, reason: 'Chat not available' };
      }
    }

    case 'status': {
      const folders = vscode.workspace.workspaceFolders || [];
      const editors = vscode.window.visibleTextEditors;
      const terminals = vscode.window.terminals;
      const activeEditor = vscode.window.activeTextEditor;
      
      return {
        workspace: {
          folders: folders.map(f => f.uri.fsPath),
          activeFile: activeEditor?.document.uri.fsPath || null,
          openFiles: editors.map(e => e.document.uri.fsPath),
          terminals: terminals.map(t => t.name),
          activeTerminal: vscode.window.activeTerminal?.name || null,
        },
        debug: {
          active: !!vscode.debug.activeDebugSession,
          session: vscode.debug.activeDebugSession?.name || null,
        },
      };
    }

    default:
      throw new Error(`Unknown agent action: ${action}`);
  }
}
