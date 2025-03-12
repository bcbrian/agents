#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const agentPath = resolve(__dirname, 'dist/index.js');

console.log('Starting draw agent for local verification...');

// Start the agent process
const agentProcess = spawn('node', [agentPath], {
  stdio: ['pipe', 'pipe', 'inherit'] // pipe stdin/stdout, inherit stderr
});

// Setup event handlers
agentProcess.stdout.on('data', (data) => {
  const responseStr = data.toString().trim();
  console.log('\nReceived from agent:');
  try {
    // Try to parse and pretty-print the JSON response
    const jsonResponse = JSON.parse(responseStr);
    console.log(JSON.stringify(jsonResponse, null, 2));
  } catch (e) {
    // If not valid JSON, just print as is
    console.log(responseStr);
  }
});

agentProcess.on('error', (error) => {
  console.error('Error starting agent:', error);
  process.exit(1);
});

agentProcess.on('close', (code) => {
  console.log(`Agent process exited with code ${code}`);
  process.exit(code);
});

// First, let's list the available tools to confirm the agent is working
console.log('\nListing available tools...');
agentProcess.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
}) + '\n');

// Wait a second before sending the call request
setTimeout(() => {
  console.log('\nSending draw chart request...');
  agentProcess.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'drawChart',
      arguments: {
        data: JSON.stringify({
          labels: ['A', 'B', 'C'],
          values: [30, 40, 30]
        }),
        chartType: 'pie',
        title: 'Test Chart'
      }
    }
  }) + '\n');
}, 1000);

// Allow the script to run for a few seconds before automatically terminating
setTimeout(() => {
  console.log('\nTest complete. Terminating agent process...');
  agentProcess.kill();
  process.exit(0);
}, 5000); 