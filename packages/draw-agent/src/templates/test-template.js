#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the HTML template
const templatePath = path.join(__dirname, 'mermaid-template.html');
const template = fs.readFileSync(templatePath, 'utf8');

// Sample Mermaid diagram - a simple pie chart
const sampleDiagram = `pie
    "Slice A" : 30
    "Slice B" : 50
    "Slice C" : 20`;

// Insert the diagram into the template
const htmlContent = template.replace('<!-- DIAGRAM_CONTENT_PLACEHOLDER -->', sampleDiagram);

// Write the HTML to a file
const outputPath = path.join(__dirname, 'test-output.html');
fs.writeFileSync(outputPath, htmlContent);

console.log(`Test HTML file created at: ${outputPath}`);
console.log('Open this file in your browser to verify the template is working correctly.');
console.log('You should see a pie chart with three slices labeled A, B, and C with values 30, 50, and 20 respectively.'); 