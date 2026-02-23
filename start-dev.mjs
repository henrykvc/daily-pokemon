import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

const child = spawn(
  'C:\\Program Files\\nodejs\\node.exe',
  ['node_modules/next/dist/bin/next', 'dev'],
  { stdio: 'inherit', shell: false, cwd: __dirname }
);

child.on('error', (err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
