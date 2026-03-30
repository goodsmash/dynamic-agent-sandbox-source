/**
 * Windows-compatible frontend development server
 * Handles platform differences in Vite/Rollup setup
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWindows = platform() === 'win32';

console.log('🌐 Starting OpenClaw Frontend...');
console.log(`${isWindows ? '🪟' : '🐧'} Platform: ${isWindows ? 'Windows' : 'Unix'}`);

try {
  const command = isWindows ? 'npx.cmd' : 'npx';
  const args = ['vite', '--config', 'vite.config.ts', '--host', '0.0.0.0'];
  
  const child = spawn(command, args, {
    cwd: __dirname,
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      VITE_HOST: '0.0.0.0',
      VITE_PORT: '5173'
    },
    shell: isWindows,
    stdio: 'inherit'
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Frontend server stopped');
    } else {
      console.error('❌ Frontend server failed');
      process.exit(code);
    }
  });

  child.on('error', (error) => {
    console.error('❌ Frontend error:', error.message);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Error starting frontend:', error.message);
  process.exit(1);
}