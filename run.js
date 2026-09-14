const { spawn } = require('child_process');
const path = require('path');

console.log('================================================================');
console.log('🛡️  Starting Software Security Code Review Checklist Platform');
console.log('================================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

// 1. Start Server
console.log('[Runner] Starting Express AppSec Backend on port 5000...');
const serverProcess = spawn('node', ['src/index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

// 2. Start Frontend Vite Dev Server
console.log('[Runner] Starting React Vite Frontend on port 5173...');
const clientProcess = spawn(npxCmd, ['vite', '--host'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

function handleExit() {
  console.log('\n[Runner] Shutting down application servers...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
serverProcess.on('close', (code) => {
  console.log(`[Backend] Process exited with code ${code}`);
});
clientProcess.on('close', (code) => {
  console.log(`[Frontend] Process exited with code ${code}`);
});
