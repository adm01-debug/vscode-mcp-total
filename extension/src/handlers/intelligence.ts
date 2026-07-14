import * as vscode from 'vscode';

export async function handleIntelligence(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'getDiagnostics': {
      const filePath = params.path as string | undefined;
      let diagnostics: [vscode.Uri, readonly vscode.Diagnostic[]][];
      if (filePath) {
        const uri = vscode.Uri.file(filePath);
        const diags = vscode.languages.getDiagnostics(uri);
        diagnostics = [[uri, diags]];
      } else {
        diagnostics = vscode.languages.getDiagnostics();
      }
      return {
        diagnostics: diagnostics.map(([uri, diags]) => ({
          path: uri.fsPath,
          issues: diags.map(d => ({
            message: d.message,
            severity: vscode.DiagnosticSeverity[d.severity],
            range: { start: { line: d.range.start.line, character: d.range.start.character }, end: { line: d.range.end.line, character: d.range.end.character } },
            source: d.source,
            code: d.code,
          })),
        })),
      };
    }

    case 'documentSymbols': {
      const filePath = params.path as string;
      const uri = vscode.Uri.file(filePath);
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', uri) || [];
      const flatten = (syms: vscode.DocumentSymbol[], prefix = ''): any[] =>
        syms.flatMap(s => [
          { name: prefix ? `${prefix}.${s.name}` : s.name, kind: vscode.SymbolKind[s.kind], range: { start: { line: s.range.start.line, character: s.range.start.character }, end: { line: s.range.end.line, character: s.range.end.character } } },
          ...flatten(s.children, prefix ? `${prefix}.${s.name}` : s.name),
        ]);
      return { symbols: flatten(symbols) };
    }

    case 'workspaceSymbols': {
      const query = params.query as string || '';
      const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', query) || [];
      return {
        symbols: symbols.slice(0, 50).map(s => ({
          name: s.name,
          kind: vscode.SymbolKind[s.kind],
          path: s.location.uri.fsPath,
          range: { start: { line: s.location.range.start.line, character: s.location.range.start.character }, end: { line: s.location.range.end.line, character: s.location.range.end.character } },
        })),
      };
    }

    case 'goToDefinition': {
      const filePath = params.path as string;
      const line = params.line as number;
      const character = params.character as number;
      const uri = vscode.Uri.file(filePath);
      const pos = new vscode.Position(line, character);
      const locations = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeDefinitionProvider', uri, pos) || [];
      return {
        definitions: locations.map(l => ({
          path: l.uri.fsPath,
          range: { start: { line: l.range.start.line, character: l.range.start.character }, end: { line: l.range.end.line, character: l.range.end.character } },
        })),
      };
    }

    case 'findReferences': {
      const filePath = params.path as string;
      const line = params.line as number;
      const character = params.character as number;
      const uri = vscode.Uri.file(filePath);
      const pos = new vscode.Position(line, character);
      const locations = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeReferenceProvider', uri, pos) || [];
      return {
        references: locations.slice(0, 50).map(l => ({
          path: l.uri.fsPath,
          range: { start: { line: l.range.start.line, character: l.range.start.character }, end: { line: l.range.end.line, character: l.range.end.character } },
        })),
      };
    }

    case 'hover': {
      const filePath = params.path as string;
      const line = params.line as number;
      const character = params.character as number;
      const uri = vscode.Uri.file(filePath);
      const pos = new vscode.Position(line, character);
      const hovers = await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', uri, pos) || [];
      const contents = hovers.flatMap(h => h.contents.map(c => typeof c === 'string' ? c : (c as vscode.MarkdownString).value));
      return { contents };
    }

    case 'renameSymbol': {
      const filePath = params.path as string;
      const line = params.line as number;
      const character = params.character as number;
      const newName = params.newName as string;
      const uri = vscode.Uri.file(filePath);
      const pos = new vscode.Position(line, character);
      const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>('vscode.executeDocumentRenameProvider', uri, pos, newName);
      if (edit) {
        await vscode.workspace.applyEdit(edit);
        return { success: true, filesChanged: edit.size };
      }
      return { success: false, reason: 'No rename edit returned' };
    }

    case 'codeActions': {
      const filePath = params.path as string;
      const startLine = params.startLine as number || 0;
      const endLine = params.endLine as number || startLine;
      const uri = vscode.Uri.file(filePath);
      const range = new vscode.Range(startLine, 0, endLine, 999);
      const actions = await vscode.commands.executeCommand<vscode.CodeAction[]>('vscode.executeCodeActionProvider', uri, range) || [];
      return {
        actions: actions.slice(0, 20).map(a => ({
          title: a.title,
          kind: a.kind?.value,
          isPreferred: a.isPreferred,
        })),
      };
    }

    case 'format': {
      const filePath = params.path as string;
      const uri = vscode.Uri.file(filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>('vscode.executeFormatDocumentProvider', uri, { tabSize: 2, insertSpaces: true });
      if (edits?.length) {
        const we = new vscode.WorkspaceEdit();
        for (const e of edits) { we.replace(uri, e.range, e.newText); }
        await vscode.workspace.applyEdit(we);
        await doc.save();
      }
      return { success: true, editsApplied: edits?.length || 0 };
    }

    case 'organizeImports': {
      const filePath = params.path as string;
      const uri = vscode.Uri.file(filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
      await vscode.commands.executeCommand('editor.action.organizeImports');
      await doc.save();
      return { success: true };
    }

    default:
      throw new Error(`Unknown intelligence action: ${action}`);
  }
}
