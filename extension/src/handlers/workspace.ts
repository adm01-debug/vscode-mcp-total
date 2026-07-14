import * as vscode from 'vscode';

export async function handleWorkspace(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'listWorkspaces': {
      const folders = vscode.workspace.workspaceFolders || [];
      return {
        name: vscode.workspace.name,
        folders: folders.map(f => ({
          name: f.name,
          path: f.uri.fsPath,
          index: f.index,
        })),
      };
    }

    case 'tabs': {
      const tabGroups = vscode.window.tabGroups;
      const groups = tabGroups.all.map(group => ({
        isActive: group.isActive,
        tabs: group.tabs.map(tab => ({
          label: tab.label,
          isActive: tab.isActive,
          isDirty: tab.isDirty,
          isPinned: tab.isPinned,
          path: (tab.input as any)?.uri?.fsPath || null,
        })),
      }));
      return { groups };
    }

    case 'status': {
      const folders = vscode.workspace.workspaceFolders || [];
      const editors = vscode.window.visibleTextEditors;
      const terminals = vscode.window.terminals;
      const activeEditor = vscode.window.activeTextEditor;
      const diagnostics = vscode.languages.getDiagnostics();
      
      let totalErrors = 0;
      let totalWarnings = 0;
      for (const [, diags] of diagnostics) {
        for (const d of diags) {
          if (d.severity === vscode.DiagnosticSeverity.Error) { totalErrors++; }
          else if (d.severity === vscode.DiagnosticSeverity.Warning) { totalWarnings++; }
        }
      }

      return {
        workspace: vscode.workspace.name,
        folders: folders.map(f => f.uri.fsPath),
        activeFile: activeEditor?.document.uri.fsPath || null,
        openEditors: editors.length,
        openTerminals: terminals.length,
        diagnostics: { errors: totalErrors, warnings: totalWarnings },
        debug: {
          active: !!vscode.debug.activeDebugSession,
          session: vscode.debug.activeDebugSession?.name || null,
        },
      };
    }

    default:
      throw new Error(`Unknown workspace action: ${action}`);
  }
}
