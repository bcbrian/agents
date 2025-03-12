#!/usr/bin/env node

import { renderMermaidDiagramWithCLI } from './dist/mermaid-cli-renderer.js';

async function testMermaidCLI() {
  console.log("Testing fixed Mermaid CLI rendering...");
  
  const mermaidCode = `
  graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]
  `;
  
  // Test with default options
  console.log("\nTesting with default options...");
  try {
    const defaultResult = await renderMermaidDiagramWithCLI(mermaidCode, {
      path: './fixed-cli-sample.png'
    });
    console.log("Default result:", defaultResult);
    
    // Print file info
    const { execSync } = await import('child_process');
    const fileInfo = execSync('file ./fixed-cli-sample.png').toString();
    console.log("\nFile info:");
    console.log(fileInfo);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the test
testMermaidCLI().catch(console.error); 