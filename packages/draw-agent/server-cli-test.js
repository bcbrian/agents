#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Set up logging to a file to avoid console output interfering with JSON-RPC
const logDir = path.join(os.tmpdir(), 'draw-agent-tests');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, `server-test-${Date.now()}.log`);

function logToFile(message) {
  fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`);
}

// Start the draw agent process
logToFile('Starting draw agent for CLI renderer test...');
const agentProcess = spawn('node', ['dist/index.js'], {
  cwd: __dirname,
  env: {
    ...process.env,
    // Disable console output from the agent process
    NODE_ENV: 'production',
    SILENT_MODE: 'true'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Buffer to accumulate stdout data
let stdoutBuffer = '';

// Set up event handlers
agentProcess.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  
  // Process complete JSON messages
  let newlineIndex;
  while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
    const line = stdoutBuffer.substring(0, newlineIndex);
    stdoutBuffer = stdoutBuffer.substring(newlineIndex + 1);
    
    try {
      const response = JSON.parse(line);
      logToFile(`Received response: ${JSON.stringify(response, null, 2)}`);
      
      // Only output clean result data to stdout
      console.log(JSON.stringify({ 
        success: true, 
        id: response.id,
        result: response.result || response.error 
      }));
    } catch (error) {
      // Non-JSON output is logged to file but not sent to stdout
      logToFile(`Received non-JSON output: ${line}`);
    }
  }
});

agentProcess.stderr.on('data', (data) => {
  // Log stderr to file but don't send to stdout
  logToFile(`Agent stderr: ${data.toString()}`);
});

agentProcess.on('close', (code) => {
  logToFile(`Agent process exited with code ${code}`);
  console.log(JSON.stringify({ 
    success: true, 
    message: `Agent process exited with code ${code}`,
    logFile: logFile
  }));
});

// Wait for server to start
setTimeout(() => {
  logToFile('Sending ListTools request...');
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'list_tools',
    params: {}
  };
  agentProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Wait a bit and then send a renderChart request with useCLI=true
  setTimeout(() => {
    logToFile('Sending CallTool request for renderChart with useCLI=true...');
    const renderRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'call_tool',
      params: {
        name: 'renderChart',
        arguments: {
          mermaidCode: '```mermaid\ngraph TD\n  A[Start] --> B{Is it?}\n  B -->|Yes| C[OK]\n  C --> D[Rethink]\n  D --> B\n  B ---->|No| E[End]\n```',
          width: 800,
          height: 600,
          useCLI: true
        }
      }
    };
    agentProcess.stdin.write(JSON.stringify(renderRequest) + '\n');

    // Terminate after a few seconds
    setTimeout(() => {
      logToFile('Test complete, terminating agent...');
      agentProcess.kill();
    }, 10000);
  }, 2000);
}, 2000); 