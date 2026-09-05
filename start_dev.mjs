import { spawn } from 'node:child_process';

console.log('Starting Next.js dev server...');
const child = spawn('npx', ['next', 'dev'], {
  cwd: new URL('.', import.meta.url).pathname,
  stdio: 'inherit',
  shell: true,
});

child.on('error', (e) => {
  console.error('Failed to start:', e);
  process.exit(1);
});
