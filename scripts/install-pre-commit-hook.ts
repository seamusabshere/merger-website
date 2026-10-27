import { execSync } from 'node:child_process';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

class PreCommitHook {
  readonly hooksDirectory: string;
  readonly pnpmExecutable: string;

  constructor({ hooksDirectory, pnpmExecutable }: { hooksDirectory: string; pnpmExecutable: string }) {
    this.hooksDirectory = hooksDirectory;
    this.pnpmExecutable = pnpmExecutable;
  }

  static discover(): PreCommitHook {
    return new PreCommitHook({
      hooksDirectory: execSync('git rev-parse --git-path hooks', { encoding: 'utf8' }).trim(),
      pnpmExecutable: execSync('command -v pnpm', { encoding: 'utf8' }).trim(),
    });
  }

  install(): void {
    mkdirSync(this.hooksDirectory, { recursive: true });
    const hookPath = join(this.hooksDirectory, 'pre-commit');
    writeFileSync(hookPath, `#!/bin/sh\nexec '${this.pnpmExecutable.replaceAll("'", "'\\''")}' check\n`);
    chmodSync(hookPath, 0o755);
  }
}

PreCommitHook.discover().install();
