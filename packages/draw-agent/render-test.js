#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const agentPath = resolve(__dirname, 'dist/index.js');

console.log('Starting draw agent for renderChart verification...');

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

// Wait a second before sending the render request
setTimeout(() => {
  // First use drawChart to create a Mermaid diagram
  console.log('\nSending drawChart request...');
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
        title: 'Test Pie Chart'
      }
    }
  }) + '\n');
  
  // Test pie chart with default theme
  setTimeout(() => {
    console.log('\nSending renderChart request - Pie Chart (Default Theme)...');
    agentProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'renderChart',
        arguments: {
          mermaidCode: `pie
    "A" : 30
    "B" : 40
    "C" : 30`,
          width: 800,
          height: 600
        }
      }
    }) + '\n');

    // Test flowchart with dark theme
    setTimeout(() => {
      console.log('\nSending renderChart request - Flowchart (Dark Theme)...');
      agentProcess.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'renderChart',
          arguments: {
            mermaidCode: `flowchart TD
    A[Start] --> B[Process]
    B --> C[End]`,
            width: 800,
            height: 600,
            theme: 'dark'
          }
        }
      }) + '\n');
      
      // Test flowchart with transparent background
      setTimeout(() => {
        console.log('\nSending renderChart request - Transparent Background...');
        agentProcess.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: {
            name: 'renderChart',
            arguments: {
              mermaidCode: `flowchart TD
    A[Start] --> B[Process]
    B --> C[End]`,
              width: 800,
              height: 600,
              backgroundColor: 'transparent'
            }
          }
        }) + '\n');
        
        // Test with high scale factor (2x)
        setTimeout(() => {
          console.log('\nSending renderChart request - High Scale Factor (2x)...');
          agentProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 6,
            method: 'tools/call',
            params: {
              name: 'renderChart',
              arguments: {
                mermaidCode: `flowchart TD
    A[Start] --> B[Process]
    B --> C[End]`,
                width: 400,
                height: 300,
                scale: 2
              }
            }
          }) + '\n');
          
          // Test JPEG with quality setting
          setTimeout(() => {
            console.log('\nSending renderChart request - JPEG with Quality Setting...');
            agentProcess.stdin.write(JSON.stringify({
              jsonrpc: '2.0',
              id: 7,
              method: 'tools/call',
              params: {
                name: 'renderChart',
                arguments: {
                  mermaidCode: `flowchart TD
    A[Start] --> B[Process]
    B --> C[End]`,
                  width: 800,
                  height: 600,
                  format: 'jpeg',
                  quality: 50,
                  backgroundColor: '#f0f0f0'
                }
              }
            }) + '\n');
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}, 1000);

// Allow the script to run for longer to accommodate all tests
setTimeout(() => {
  console.log('\nTest complete. Terminating agent process...');
  agentProcess.kill();
  process.exit(0);
}, 12000); 