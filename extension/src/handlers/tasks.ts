import * as vscode from 'vscode';

export async function handleTasks(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'list': {
      const tasks = await vscode.tasks.fetchTasks();
      return {
        tasks: tasks.map(t => ({
          name: t.name,
          source: t.source,
          group: t.group?.id,
          detail: t.detail,
        })),
      };
    }

    case 'run': {
      const taskName = params.name as string;
      const tasks = await vscode.tasks.fetchTasks();
      const task = tasks.find(t => t.name === taskName);
      if (!task) { throw new Error(`Task not found: ${taskName}`); }
      const execution = await vscode.tasks.executeTask(task);
      return { success: true, task: execution.task.name };
    }

    case 'create': {
      const name = params.name as string;
      const command = params.command as string;
      const type = params.type as string || 'shell';
      const cwd = params.cwd as string | undefined;
      const taskDef: vscode.TaskDefinition = { type: 'shell' };
      const shellExec = new vscode.ShellExecution(command, { cwd });
      const task = new vscode.Task(taskDef, vscode.TaskScope.Workspace, name, type, shellExec);
      await vscode.tasks.executeTask(task);
      return { success: true, name };
    }

    case 'terminate': {
      const taskName = params.name as string;
      const executions = vscode.tasks.taskExecutions;
      const exec = executions.find(e => e.task.name === taskName);
      if (!exec) { throw new Error(`Running task not found: ${taskName}`); }
      exec.terminate();
      return { success: true, name: taskName };
    }

    default:
      throw new Error(`Unknown tasks action: ${action}`);
  }
}
