import * as vscode from 'vscode';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority?: string;
  created: string;
  completed?: string;
}

async function getTodosFilePath(): Promise<vscode.Uri> {
  const config = vscode.workspace.getConfiguration('vscodeMcp');
  const relative = config.get<string>('todosFilePath', '.vscode/todos.json');
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) { throw new Error('No workspace open'); }
  return vscode.Uri.joinPath(folders[0].uri, relative);
}

async function readTodos(): Promise<Todo[]> {
  const uri = await getTodosFilePath();
  try {
    const data = await vscode.workspace.fs.readFile(uri);
    return JSON.parse(Buffer.from(data).toString('utf-8'));
  } catch {
    return [];
  }
}

async function writeTodos(todos: Todo[]): Promise<void> {
  const uri = await getTodosFilePath();
  const dir = vscode.Uri.joinPath(uri, '..');
  try { await vscode.workspace.fs.createDirectory(dir); } catch { /* exists */ }
  await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(todos, null, 2), 'utf-8'));
}

export async function handleTodos(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'add': {
      const text = params.text as string;
      const priority = params.priority as string || 'medium';
      const todos = await readTodos();
      const id = `todo_${Date.now()}`;
      const todo: Todo = { id, text, done: false, priority, created: new Date().toISOString() };
      todos.push(todo);
      await writeTodos(todos);
      return { success: true, todo };
    }

    case 'list': {
      const filter = params.filter as string | undefined;
      let todos = await readTodos();
      if (filter === 'done') { todos = todos.filter(t => t.done); }
      else if (filter === 'pending') { todos = todos.filter(t => !t.done); }
      return { todos };
    }

    case 'update': {
      const id = params.id as string;
      const todos = await readTodos();
      const todo = todos.find(t => t.id === id);
      if (!todo) { throw new Error(`Todo not found: ${id}`); }
      if (params.text !== undefined) { todo.text = params.text as string; }
      if (params.priority !== undefined) { todo.priority = params.priority as string; }
      await writeTodos(todos);
      return { success: true, todo };
    }

    case 'done': {
      const id = params.id as string;
      const todos = await readTodos();
      const todo = todos.find(t => t.id === id);
      if (!todo) { throw new Error(`Todo not found: ${id}`); }
      todo.done = true;
      todo.completed = new Date().toISOString();
      await writeTodos(todos);
      return { success: true, todo };
    }

    default:
      throw new Error(`Unknown todos action: ${action}`);
  }
}
