#!/usr/bin/env node

import { renderMermaidDiagram } from './dist/playwright-renderer.js';

async function testFitOptions() {
  console.log("Testing fit options...");
  
  const mermaidCode = `
  graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]
  `;
  
  // Test with 'contain' fit option
  console.log("\nTesting 'contain' fit option...");
  const containResult = await renderMermaidDiagram(mermaidCode, {
    width: 800,
    height: 600,
    fit: 'contain',
    path: './sample-contain.png'
  });
  console.log("contain result:", containResult);
  
  // Test with 'fill' fit option
  console.log("\nTesting 'fill' fit option...");
  const fillResult = await renderMermaidDiagram(mermaidCode, {
    width: 800,
    height: 600,
    fit: 'fill',
    path: './sample-fill.png'
  });
  console.log("fill result:", fillResult);
  
  // Test with 'actual' fit option
  console.log("\nTesting 'actual' fit option...");
  const actualResult = await renderMermaidDiagram(mermaidCode, {
    width: 800,
    height: 600,
    fit: 'actual',
    path: './sample-actual.png'
  });
  console.log("actual result:", actualResult);
  
  // Print file sizes to compare
  const { promises: fs } = await import('fs');
  
  try {
    const containStat = await fs.stat('./sample-contain.png');
    const fillStat = await fs.stat('./sample-fill.png');
    const actualStat = await fs.stat('./sample-actual.png');
    
    console.log("\nFile sizes:");
    console.log(`contain: ${containStat.size} bytes`);
    console.log(`fill: ${fillStat.size} bytes`);
    console.log(`actual: ${actualStat.size} bytes`);
  } catch (error) {
    console.error("Error getting file sizes:", error);
  }
}

// Run the test
testFitOptions().catch(console.error); 