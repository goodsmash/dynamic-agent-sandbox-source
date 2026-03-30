#!/usr/bin/env node
/**
 * Platform-agnostic development starter script for OpenClaw
 * 
 * This script handles cross-platform differences:
 * - Environment variable syntax (Windows vs Unix)
 * - Process spawning differences
 * - Path separators
 * - Shell command compatibility
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWindows = platform() === 'win32';

// Platform-agnostic environment variable setting
function getEnvVars() {
  if (isWindows) {
    return {
      NODE_ENV: 'development',
      PORT: '8080',
      // Use Windows-specific SQLite instead of requiring PostgreSQL for testing
      DATABASE_URL: 'sqlite://./test.db' 
    };
  } else {
    return {
      NODE_ENV: 'development',
      PORT: '8080',
      DATABASE_URL: 'sqlite:./test.db'
    };
  }
}

// Cross-platform command execution
async function runCommand(command, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: isWindows,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

// Platform command mapping
const commands = {
  buildAPIServer: async () => {
    console.log('🛠️  Building API Server...');
    await runCommand('node', ['build.mjs'], join(__dirname, 'artifacts', 'api-server'));
  },
  
  startAPI: async () => {
    console.log('🚀 Starting API Server...');
    const env = getEnvVars();
    await runCommand('node', ['--enable-source-maps', './dist/index.mjs'], 
                     join(__dirname, 'artifacts', 'api-server'), env);
  },
  
  startFrontend: async () => {
    console.log('🌐 Starting Frontend...');
    const env = { NODE_ENV: 'development' };
    // Platform-specific Vite command
    if (isWindows) {
      await runCommand('npx.cmd', ['vite', '--config', 'vite.config.ts', '--host', '0.0.0.0'], 
                       join(__dirname, 'artifacts', 'agent-sandbox'), env);
    } else {
      await runCommand('npx', ['vite', '--config', 'vite.config.ts', '--host', '0.0.0.0'], 
                       join(__dirname, 'artifacts', 'agent-sandbox'), env);
    }
  }
};

// Main execution
async function main() {
  console.log('🦞 OpenClaw Development Environment');
  console.log(`${isWindows ? '🪟' : '🐧'} Platform: ${isWindows ? 'Windows' : 'Unix'}`);
  
  try {
    // Build backend
    await commands.buildAPIServer();
    
    // Start backend
    commands.startAPI();
    
    // Start frontend
    await commands.startFrontend();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);