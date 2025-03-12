#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

// Get the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const agentPath = resolve(__dirname, 'dist/index.js');

// Create a custom output directory for testing
const outputDir = join(__dirname, 'test-output');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}
const customOutputPath = join(outputDir, `custom-chart-${Date.now()}.png`);

console.log('Starting draw agent to test custom output path...');
const agentProcess = spawn('node', [agentPath], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Buffer to collect stdout
let outputBuffer = '';

// Listen for data from the agent
agentProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  outputBuffer += chunk;
  
  try {
    // Try to parse complete JSON messages
    const lines = outputBuffer.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line) {
        const response = JSON.parse(line);
        console.log('\nReceived response:');
        
        // If this is a renderChart response, extract and display the markdown
        if (response.id === 2 && response.result && response.result.content) {
          console.log('\n=== MARKDOWN PREVIEW ===\n');
          console.log(response.result.content[0].text);
          console.log('\n=== END MARKDOWN PREVIEW ===\n');
          
          // Check if our custom path was used
          if (response.result.content[0].text.includes(customOutputPath)) {
            console.log('✅ SUCCESS: Custom output path was used!');
          } else {
            console.log('❌ ERROR: Custom output path was not used properly');
          }
        } else {
          // For other responses, just log the message type
          console.log(`ID: ${response.id}, Type: ${response.method || 'result'}`);
        }
      }
    }
    // Keep the last partial line in the buffer
    outputBuffer = lines[lines.length - 1];
  } catch (e) {
    // If we can't parse JSON, just keep accumulating the buffer
  }
});

// Handle agent termination
agentProcess.on('close', (code) => {
  console.log(`Agent process exited with code ${code}`);
});

// Send a test renderChart request
setTimeout(() => {
  console.log('\nSending renderChart request with custom output path...');
  console.log(`Using custom path: ${customOutputPath}`);
  
  const renderRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'renderChart',
      arguments: {
        mermaidCode: `
        flowchart TD
          A[Start] --> B{Custom Path Test}
          B -->|Yes| C[Success!]
          B -->|No| D[Fail]
          C --> E[End]
          D --> E
        `,
        width: 800,
        height: 600,
        theme: 'default',
        outputPath: customOutputPath
      }
    }
  };
  
  agentProcess.stdin.write(JSON.stringify(renderRequest) + '\n');
  
  // Terminate the test after a few seconds
  setTimeout(() => {
    console.log('\nTest complete, terminating agent...');
    agentProcess.kill();
  }, 5000);
}, 1000); 