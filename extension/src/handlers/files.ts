import * as vscode from 'vscode';

export async function handleFiles(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'open': {
      const filePath = params.path as string;
      const uri = vscode.Uri.file(filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { preview: false });
      return { success: true, path: filePath };
    }

    case 'readFile': {
      const filePath = params.path as string;
      const uri = vscode.Uri.file(filePath);
      const content = await vscode.workspace.fs.readFile(uri);
      return { content: Buffer.from(content).toString('utf-8'), path: filePath };
    }

    case 'writeFile': {
      const filePath = params.path as string;
      const content = params.content as string;
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
      return { success: true, path: filePath };
    }

    case 'editFile': {
      const filePath = params.path as string;
      const edits = params.edits as Array<{ range: { start: { line: number; character: number }; end: { line: number; character: number } }; text: string }>;
      const uri = vscode.Uri.file(filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(doc);
      const success = await editor.edit(editBuilder => {
        for (const e of edits) {
          const range = new vscode.Range(
            new vscode.Position(e.range.start.line, e.range.start.character),
            new vscode.Position(e.range.end.line, e.range.end.character)
          );
          editBuilder.replace(range, e.text);
        }
      });
      return { success, path: filePath };
    }

    case 'findFiles': {
      const pattern = params.pattern as string;
      const exclude = params.exclude as string | undefined;
      const maxResults = params.maxResults as number || 100;
      const files = await vscode.workspace.findFiles(pattern, exclude, maxResults);
      return { files: files.map(f => f.fsPath) };
    }

    case 'searchInFiles': {
      const query = params.query as string;
      const include = params.include as string | undefined;
      const exclude = params.exclude as string | undefined;
      const pattern = include || '**/*';
      const files = await vscode.workspace.findFiles(pattern, exclude, 50);
      const results: Array<{ path: string; matches: string[] }> = [];
      for (const file of files) {
        try {
          const content = Buffer.from(await vscode.workspace.fs.readFile(file)).toString('utf-8');
          const lines = content.split('\n');
          const matchLines = lines.filter(l => l.includes(query));
          if (matchLines.length > 0) {
            results.push({ path: file.fsPath, matches: matchLines.slice(0, 5) });
          }
        } catch { /* skip binary files */ }
      }
      return { results };
    }

    case 'saveAll': {
      await vscode.workspace.saveAll();
      return { success: true };
    }

    case 'ops': {
      const operation = params.operation as string;
      const source = params.source as string;
      const destination = params.destination as string | undefined;
      const srcUri = vscode.Uri.file(source);
      switch (operation) {
        case 'copy':
          if (!destination) { throw new Error('destination required for copy'); }
          await vscode.workspace.fs.copy(srcUri, vscode.Uri.file(destination), { overwrite: true });
          return { success: true };
        case 'move':
          if (!destination) { throw new Error('destination required for move'); }
          await vscode.workspace.fs.rename(srcUri, vscode.Uri.file(destination), { overwrite: true });
          return { success: true };
        case 'delete':
          await vscode.workspace.fs.delete(srcUri, { recursive: true });
          return { success: true };
        case 'mkdir':
          await vscode.workspace.fs.createDirectory(srcUri);
          return { success: true };
        case 'stat': {
          const stat = await vscode.workspace.fs.stat(srcUri);
          return { type: stat.type, size: stat.size, ctime: stat.ctime, mtime: stat.mtime };
        }
        default:
          throw new Error(`Unknown file operation: ${operation}`);
      }
    }

    default:
      throw new Error(`Unknown files action: ${action}`);
  }
}
