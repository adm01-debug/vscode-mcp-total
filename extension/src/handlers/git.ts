import * as vscode from 'vscode';

function getGitApi(): any {
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (!gitExtension) { throw new Error('Git extension not available'); }
  const git = gitExtension.isActive ? gitExtension.exports : undefined;
  if (!git) { throw new Error('Git extension not active'); }
  const api = git.getAPI(1);
  if (!api || !api.repositories.length) { throw new Error('No git repositories found'); }
  return api;
}

export async function handleGit(action: string, params: Record<string, unknown>): Promise<unknown> {
  const api = getGitApi();
  const repoIndex = params.repoIndex as number || 0;
  const repo = api.repositories[repoIndex];
  if (!repo) { throw new Error(`Repository index ${repoIndex} not found`); }

  switch (action) {
    case 'status': {
      const state = repo.state;
      return {
        branch: state.HEAD?.name,
        commit: state.HEAD?.commit,
        ahead: state.HEAD?.ahead || 0,
        behind: state.HEAD?.behind || 0,
        changes: state.workingTreeChanges.map((c: any) => ({
          path: c.uri.fsPath,
          status: c.status,
        })),
        staged: state.indexChanges.map((c: any) => ({
          path: c.uri.fsPath,
          status: c.status,
        })),
      };
    }

    case 'diff': {
      const filePath = params.path as string | undefined;
      const staged = params.staged as boolean || false;
      if (filePath) {
        const diff = await repo.diffWith(staged ? 'HEAD' : '~', filePath);
        return { diff, path: filePath };
      }
      const diff = staged
        ? await repo.diff(true)
        : await repo.diff(false);
      return { diff };
    }

    case 'commit': {
      const message = params.message as string;
      const stageAll = params.stageAll !== false;
      if (stageAll) {
        const changes = repo.state.workingTreeChanges;
        if (changes.length) {
          await repo.add(changes.map((c: any) => c.uri.fsPath));
        }
      }
      await repo.commit(message);
      return { success: true, message };
    }

    case 'branch': {
      const subAction = params.action as string || 'list';
      switch (subAction) {
        case 'list': {
          const refs = repo.state.refs || [];
          return {
            current: repo.state.HEAD?.name,
            branches: refs
              .filter((r: any) => r.type === 0)
              .map((r: any) => r.name),
          };
        }
        case 'create': {
          const name = params.name as string;
          await repo.createBranch(name, true);
          return { success: true, branch: name };
        }
        case 'checkout': {
          const name = params.name as string;
          await repo.checkout(name);
          return { success: true, branch: name };
        }
        case 'delete': {
          const name = params.name as string;
          await repo.deleteBranch(name, false);
          return { success: true, branch: name };
        }
        default:
          throw new Error(`Unknown branch action: ${subAction}`);
      }
    }

    case 'sync': {
      await repo.sync();
      return { success: true };
    }

    case 'log': {
      const maxEntries = params.maxEntries as number || 20;
      const log = await repo.log({ maxEntries });
      return {
        entries: log.map((entry: any) => ({
          hash: entry.hash,
          message: entry.message,
          author: entry.authorName,
          date: entry.authorDate,
        })),
      };
    }

    default:
      throw new Error(`Unknown git action: ${action}`);
  }
}
