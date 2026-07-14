import * as vscode from 'vscode';

export async function handleDebug(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'start': {
      const config = params.configuration as vscode.DebugConfiguration || {
        type: params.type as string || 'node',
        request: 'launch',
        name: params.name as string || 'MCP Debug',
        program: params.program as string,
        args: params.args as string[],
        cwd: params.cwd as string,
      };
      const folder = vscode.workspace.workspaceFolders?.[0];
      const started = await vscode.debug.startDebugging(folder, config);
      return { success: started };
    }

    case 'control': {
      const command = params.command as string;
      const session = vscode.debug.activeDebugSession;
      if (!session) { throw new Error('No active debug session'); }
      switch (command) {
        case 'continue': await vscode.commands.executeCommand('workbench.action.debug.continue'); break;
        case 'pause': await vscode.commands.executeCommand('workbench.action.debug.pause'); break;
        case 'stepOver': await vscode.commands.executeCommand('workbench.action.debug.stepOver'); break;
        case 'stepInto': await vscode.commands.executeCommand('workbench.action.debug.stepInto'); break;
        case 'stepOut': await vscode.commands.executeCommand('workbench.action.debug.stepOut'); break;
        case 'stop': await vscode.commands.executeCommand('workbench.action.debug.stop'); break;
        case 'restart': await vscode.commands.executeCommand('workbench.action.debug.restart'); break;
        default: throw new Error(`Unknown debug command: ${command}`);
      }
      return { success: true, command };
    }

    case 'setBreakpoint': {
      const filePath = params.path as string;
      const line = params.line as number;
      const condition = params.condition as string | undefined;
      const uri = vscode.Uri.file(filePath);
      const bp = new vscode.SourceBreakpoint(
        new vscode.Location(uri, new vscode.Position(line, 0)),
        true,
        condition
      );
      vscode.debug.addBreakpoints([bp]);
      return { success: true, path: filePath, line };
    }

    case 'evaluate': {
      const expression = params.expression as string;
      const session = vscode.debug.activeDebugSession;
      if (!session) { throw new Error('No active debug session'); }
      const result = await session.customRequest('evaluate', {
        expression,
        context: params.context as string || 'repl',
      });
      return { result: result.result, type: result.type };
    }

    case 'listBreakpoints': {
      const bps = vscode.debug.breakpoints;
      return {
        breakpoints: bps.map(bp => {
          if (bp instanceof vscode.SourceBreakpoint) {
            return {
              type: 'source',
              path: bp.location.uri.fsPath,
              line: bp.location.range.start.line,
              enabled: bp.enabled,
              condition: bp.condition,
            };
          }
          return { type: 'other', enabled: bp.enabled };
        }),
      };
    }

    default:
      throw new Error(`Unknown debug action: ${action}`);
  }
}
