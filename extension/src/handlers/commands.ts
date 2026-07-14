import * as vscode from 'vscode';
import { validateCommand } from '../security';

export async function handleCommands(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'execute': {
      const command = params.command as string;
      const args = params.args as unknown[] | undefined;
      if (!validateCommand(command)) {
        throw new Error(`Command not allowed: ${command}`);
      }
      const result = await vscode.commands.executeCommand(command, ...(args || []));
      return { success: true, result };
    }

    case 'list': {
      const filter = params.filter as string | undefined;
      let commands = await vscode.commands.getCommands(true);
      if (filter) {
        const lowerFilter = filter.toLowerCase();
        commands = commands.filter(c => c.toLowerCase().includes(lowerFilter));
      }
      return { commands: commands.slice(0, 100) };
    }

    case 'showMessage': {
      const message = params.message as string;
      const level = params.level as string || 'info';
      const actions = params.actions as string[] | undefined;
      let result: string | undefined;
      switch (level) {
        case 'warning':
          result = await vscode.window.showWarningMessage(message, ...(actions || []));
          break;
        case 'error':
          result = await vscode.window.showErrorMessage(message, ...(actions || []));
          break;
        default:
          result = await vscode.window.showInformationMessage(message, ...(actions || []));
      }
      return { success: true, selected: result };
    }

    case 'openDiff': {
      const leftPath = params.leftPath as string;
      const rightPath = params.rightPath as string;
      const title = params.title as string || 'Diff';
      const leftUri = vscode.Uri.file(leftPath);
      const rightUri = vscode.Uri.file(rightPath);
      await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, title);
      return { success: true };
    }

    case 'showInput': {
      const prompt = params.prompt as string;
      const placeholder = params.placeholder as string | undefined;
      const value = params.value as string | undefined;
      const result = await vscode.window.showInputBox({ prompt, placeHolder: placeholder, value });
      return { value: result };
    }

    case 'showQuickPick': {
      const items = params.items as string[];
      const title = params.title as string | undefined;
      const canPickMany = params.canPickMany as boolean || false;
      const result = canPickMany
        ? await vscode.window.showQuickPick(items, { title, canPickMany: true })
        : await vscode.window.showQuickPick(items, { title });
      return { selected: result };
    }

    default:
      throw new Error(`Unknown commands action: ${action}`);
  }
}
