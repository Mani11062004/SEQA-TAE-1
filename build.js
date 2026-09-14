const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('================================================================');
console.log('📦 Building SecureShield AppSec Platform for Production');
console.log('================================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

function run(cmd, args, cwd) {
  console.log(`\n[Build] Executing: ${cmd} ${args.join(' ')} in ${cwd}`);
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  if (res.status !== 0) {
    console.error(`\n[Build Error] Command failed with exit code ${res.status}`);
    process.exit(res.status || 1);
  }
}

// 1. Install server dependencies if needed
const serverNodeModules = path.join(__dirname, 'server', 'node_modules');
if (!fs.existsSync(serverNodeModules)) {
  console.log('[Build] Installing server dependencies...');
  run(npmCmd, ['install'], path.join(__dirname, 'server'));
} else {
  console.log('[Build] Server dependencies already installed.');
}

// 2. Install client dependencies if needed or if vite is missing
const clientNodeModules = path.join(__dirname, 'client', 'node_modules');
const viteModule = path.join(clientNodeModules, 'vite');
if (!fs.existsSync(clientNodeModules) || !fs.existsSync(viteModule)) {
  console.log('[Build] Installing client dependencies (including Vite)...');
  run(npmCmd, ['install', '--include=dev'], path.join(__dirname, 'client'));
} else {
  console.log('[Build] Client dependencies and Vite already installed.');
}

// 3. Build client production bundle
console.log('[Build] Building React Vite client bundle...');
run(npmCmd, ['run', 'build'], path.join(__dirname, 'client'));

console.log('\n================================================================');
console.log('✅ Build successful! Production artifacts ready in client/dist');
console.log('================================================================\n');
