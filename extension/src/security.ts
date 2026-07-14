import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Default commands considered safe to execute remotely.
 * Users can extend this via vscodeMcp.allowedCommands config.
 */
export const DEFAULT_ALLOWED_COMMANDS: string[] = [
  // Editor
  'editor.action.formatDocument',
  'editor.action.formatSelection',
  'editor.action.organizeImports',
  'editor.action.quickFix',
  'editor.action.rename',
  'editor.action.revealDefinition',
  'editor.action.goToReferences',
  'editor.action.triggerSuggest',
  'editor.action.commentLine',
  'editor.action.blockComment',
  'editor.action.indentLines',
  'editor.action.outdentLines',
  'editor.action.selectAll',
  // Workbench
  'workbench.action.files.save',
  'workbench.action.files.saveAll',
  'workbench.action.closeActiveEditor',
  'workbench.action.closeAllEditors',
  'workbench.action.revertFile',
  'workbench.action.terminal.new',
  'workbench.action.terminal.focus',
  'workbench.action.toggleSidebarVisibility',
  'workbench.action.togglePanel',
  'workbench.view.explorer',
  'workbench.view.search',
  'workbench.view.scm',
  'workbench.view.debug',
  'workbench.view.extensions',
  // Search
  'workbench.action.findInFiles',
  'editor.action.startFindReplaceAction',
  // Git
  'git.refresh',
  'git.pull',
  'git.push',
  'git.sync',
  'git.stage',
  'git.stageAll',
  'git.unstage',
  'git.unstageAll',
  'git.commit',
  'git.commitAll',
  'git.checkout',
  'git.branch',
  'git.deleteBranch',
  'git.merge',
  'git.rebase',
  'git.stash',
  'git.stashPop',
  // Terminal
  'workbench.action.terminal.kill',
  'workbench.action.terminal.clear',
  // Diff
  'vscode.diff',
  'vscode.open',
];

/**
 * Check if a VS Code command is allowed to be executed remotely.
 */
export function isCommandAllowed(command: string): boolean {
  const config = vscode.workspace.getConfiguration('vscodeMcp');
  const userAllowed: string[] = config.get('allowedCommands', []);
  const allAllowed = [...DEFAULT_ALLOWED_COMMANDS, ...userAllowed];
  return allAllowed.includes(command);
}

/**
 * Validate the shared secret sent by the MCP server.
 */
export function validateSecret(received: string | undefined): boolean {
  const config = vscode.workspace.getConfiguration('vscodeMcp');
  const expected = config.get<string>('bridgeSecret', '');

  // If no secret configured, also check BRIDGE_SECRET env var
  const envSecret = process.env.BRIDGE_SECRET ?? '';
  const secret = expected || envSecret;

  if (!secret) {
    // No secret configured — allow connection (useful for local dev)
    return true;
  }

  return received === secret;
}

/**
 * Sanitize a file path to prevent directory traversal attacks.
 * Resolves the path relative to workspace root and ensures it stays within.
 */
export function sanitizePath(filePath: string, workspaceRoot: string): string {
  const resolved = path.resolve(workspaceRoot, filePath);

  // Ensure the resolved path is within the workspace
  if (!resolved.startsWith(workspaceRoot)) {
    throw new Error(`Path "${filePath}" escapes workspace root`);
  }

  return resolved;
}

/**
 * Get workspace root path (first workspace folder).
 */
export function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    throw new Error('No workspace folder open');
  }
  return folders[0].uri.fsPath;
}
