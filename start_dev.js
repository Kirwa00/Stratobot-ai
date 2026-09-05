import { spawn } from 'node:child_process';
const child = spawn('npx', ['next', 'dev'], { cwd: process.cwd(), stdio: 'inherit', shell: true });
child.on('error', (e) => { console.error('Failed:', e); process.exit(1); });
