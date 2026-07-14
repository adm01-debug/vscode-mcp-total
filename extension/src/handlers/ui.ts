import * as vscode from 'vscode';

export async function handleUI(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'showMessage': {
      const message = params.message as string;
      const level = params.level as string || 'info';
      switch (level) {
        case 'warning':
          await vscode.window.showWarningMessage(message);
          break;
        case 'error':
          await vscode.window.showErrorMessage(message);
          break;
        default:
          await vscode.window.showInformationMessage(message);
      }
      return { success: true };
    }

    case 'openExternal': {
      const url = params.url as string;
      await vscode.env.openExternal(vscode.Uri.parse(url));
      return { success: true };
    }

    case 'setContext': {
      const key = params.key as string;
      const value = params.value;
      await vscode.commands.executeCommand('setContext', key, value);
      return { success: true };
    }

    case 'showProgress': {
      const title = params.title as string;
      const message = params.message as string || '';
      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title, cancellable: false },
        async (progress) => {
          progress.report({ message });
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      );
      return { success: true };
    }

    default:
      throw new Error(`Unknown ui action: ${action}`);
  }
}
