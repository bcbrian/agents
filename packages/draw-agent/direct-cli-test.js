#!/usr/bin/env node

import { handleToolCall } from './dist/index.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Set up logging to a file to avoid console output interfering with JSON-RPC
const logDir = path.join(os.tmpdir(), 'draw-agent-tests');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, `test-run-${Date.now()}.log`);

function logToFile(message) {
  fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`);
}

async function testDirectCall() {
  logToFile("Testing direct call to handleToolCall with useCLI=true...");
  
  const mermaidCode = `
  graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]
  `;
  
  try {
    // Call the handleToolCall function directly
    const result = await handleToolCall('renderChart', {
      mermaidCode,
      width: 800,
      height: 600,
      useCLI: true
    });
    
    logToFile(`Result from handleToolCall: ${JSON.stringify(result, null, 2)}`);
    console.log("Test completed successfully. See logs at:", logFile);
    
    // Only output the final result to stdout in a clean JSON format
    console.log(JSON.stringify({
      success: true,
      result: result,
      logFile: logFile
    }));
    
    // Print file info to the log file
    const { execSync } = await import('child_process');
    try {
      // Extract the image path from the result
      const imagePath = result.content[0].text.split('\n')[0].replace('Image rendered at: ', '');
      const fileInfo = execSync(`file "${imagePath}"`).toString();
      logToFile("\nFile info:");
      logToFile(fileInfo);
    } catch (err) {
      logToFile(`Error getting file info: ${err}`);
    }
  } catch (error) {
    logToFile(`Error calling handleToolCall: ${error}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      logFile: logFile
    }));
  }
}

// Run the test
testDirectCall().catch(error => {
  fs.appendFileSync(logFile, `Unhandled error: ${error}\n`);
  console.log(JSON.stringify({
    success: false,
    error: error.message,
    logFile: logFile
  }));
}); 