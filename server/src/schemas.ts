/**
 * schemas.ts — Shared Zod schemas used across tools.
 */

import { z } from 'zod';

/** Optional workspace_path parameter for multi-window routing */
export const WorkspaceParam = z.object({
  workspace_path: z
    .string()
    .optional()
    .describe('Caminho da pasta do workspace (ex: C:/projetos/meu-app). Omita se só houver uma janela aberta.'),
});

/** File position (line is 1-based, column is 1-based) */
export const Position = z.object({
  line: z.number().int().min(1).describe('Número da linha (começa em 1)'),
  column: z.number().int().min(1).default(1).describe('Número da coluna (começa em 1)'),
});

/** Range in a file */
export const Range = z.object({
  startLine: z.number().int().min(1),
  startColumn: z.number().int().min(1).default(1),
  endLine: z.number().int().min(1),
  endColumn: z.number().int().min(1).default(1),
});

/** Severity levels for diagnostics */
export const Severity = z.enum(['error', 'warning', 'information', 'hint']);

/** Git operations */
export const GitSyncType = z.enum(['pull', 'push', 'fetch', 'sync']);

/** Task group */
export const TaskGroup = z.enum(['build', 'test', 'rebuild', 'clean', 'none']).default('none');

/** Debug control actions */
export const DebugAction = z.enum(['continue', 'stepOver', 'stepInto', 'stepOut', 'pause', 'stop', 'restart']);

/** File operations */
export const FileOp = z.enum(['move', 'copy', 'delete', 'rename']);

/** TODO status */
export const TodoStatus = z.enum(['pending', 'in_progress', 'done', 'cancelled']);

/** Notification level */
export const MessageLevel = z.enum(['info', 'warning', 'error']);
