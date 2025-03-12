import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Define our own types
export interface RenderOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg' | 'svg' | 'pdf';
  theme?: string;
  backgroundColor?: string;
  scale?: number;
  quality?: number;
  fit?: 'contain' | 'fill' | 'actual';
  path?: string;
}

export interface RenderResult {
  success: boolean;
  imagePath?: string;
  message?: string;
  width?: number;
  height?: number;
}

// Import safe logging utilities
import { log, logError } from './utils/logger.js';

// Get the current directory for resolving paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom logger that writes to a file in addition to using the safe logging utilities
function logToFile(message: string) {
  // Log using the safe log function for MCP protocol
  log(`[mermaid-cli] ${message}`);
  
  // Also log to a file for debugging purposes
  try {
    const logDir = path.join(os.tmpdir(), 'mermaid-cli-logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, `mermaid-cli-${Date.now()}.log`);
    fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`);
  } catch (err) {
    // Use the safe error logging for errors
    logError('[mermaid-cli] Error writing to log file', err);
  }
}

/**
 * Renders a Mermaid diagram to an image using the Mermaid CLI
 * @param mermaidCode The Mermaid syntax to render
 * @param options Rendering options
 * @returns Result of the rendering operation
 */
export async function renderMermaidDiagramWithCLI(
  mermaidCode: string, 
  options: RenderOptions = {}
): Promise<RenderResult> {
  try {
    // Default options
    const defaults = {
      width: 1920,
      height: 1080,
      format: 'png' as const,
      path: path.join(os.tmpdir(), `mermaid-diagram-${Date.now()}.png`),
      backgroundColor: 'white',
      scale: 1, // Default scale is 1 (100%)
      quality: 90, // Default quality for JPEG
      fit: 'contain' as const, // Default fit mode (note: CLI may handle this differently)
      theme: 'default'
    };
    
    // Merge options
    const mergedOptions = { ...defaults, ...options };
    
    // Ensure output path has the correct extension based on format
    let outputPath = mergedOptions.path;
    if (mergedOptions.format === 'jpeg') {
      // Ensure path ends with .png since mermaid-cli doesn't support jpeg directly
      if (!outputPath.endsWith('.png')) {
        outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.png';
      }
    } else if (mergedOptions.format === 'png') {
      // Ensure path ends with .png 
      if (!outputPath.endsWith('.png')) {
        outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.png';
      }
    } else if (mergedOptions.format === 'svg') {
      // Ensure path ends with .svg
      if (!outputPath.endsWith('.svg')) {
        outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.svg';
      }
    } else if (mergedOptions.format === 'pdf') {
      // Ensure path ends with .pdf
      if (!outputPath.endsWith('.pdf')) {
        outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.pdf';
      }
    }
    
    // Ensure minimum dimensions
    if (mergedOptions.width < 400) {
      logToFile('Width too small, using minimum of 400px');
      mergedOptions.width = 400;
    }
    
    if (mergedOptions.height < 300) {
      logToFile('Height too small, using minimum of 300px');
      mergedOptions.height = 300;
    }
    
    // Clean up the mermaid code - remove markdown code block markers if present
    let cleanMermaidCode = mermaidCode;
    if (cleanMermaidCode.includes('```mermaid')) {
      cleanMermaidCode = cleanMermaidCode
        .replace(/```mermaid\n/g, '')
        .replace(/```/g, '');
    }
    
    // Create a temporary file to write the Mermaid code to
    const tempInputPath = path.join(os.tmpdir(), `mermaid-input-${Date.now()}.mmd`);
    fs.writeFileSync(tempInputPath, cleanMermaidCode);
    
    // Create a configuration file for mermaid
    const configPath = path.join(os.tmpdir(), `mermaid-config-${Date.now()}.json`);
    const config = {
      theme: mergedOptions.theme || 'default',
      startOnLoad: true,
      securityLevel: 'loose',
      fontFamily: 'arial, sans-serif',
      fontSize: 18,
      themeCSS: `
        .node rect, .node circle, .node ellipse, .node polygon, .node path {
          stroke-width: 2px !important;
        }
        .edgeLabel {
          font-size: 14pt !important;
        }
        .label {
          font-size: 16pt !important;
        }
        .edgePath {
          stroke-width: 2px !important;
        }
        .cluster rect {
          stroke-width: 2px !important;
        }
      `,
      flowchart: {
        htmlLabels: true,
        curve: 'linear',
        useMaxWidth: true,
        diagramPadding: 20
      },
      sequence: {
        useMaxWidth: true,
        diagramMarginX: 50,
        diagramMarginY: 30,
        messageMargin: 40,
        noteMargin: 25,
        boxMargin: 25
      },
      gantt: {
        useMaxWidth: true,
        fontSize: 18,
        topPadding: 75,
        leftPadding: 75
      },
      pie: {
        useMaxWidth: true,
        textPosition: 0.75
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    logToFile('Rendering diagram with Mermaid CLI Node.js API...');
    
    // Import the run function from the mermaid-cli package
    const { run } = await import('@mermaid-js/mermaid-cli');
    
    // Convert our format to mermaid-cli's expected format
    const mermaidOutputFormat = mergedOptions.format === 'jpeg' ? 'png' : 
                               (mergedOptions.format === 'png' ? 'png' : 
                               (mergedOptions.format === 'svg' ? 'svg' : 
                               (mergedOptions.format === 'pdf' ? 'pdf' : 'png')));
    
    // Make sure the background color and theme are set in the config
    try {
      const configObj = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      configObj.backgroundColor = mergedOptions.backgroundColor;
      fs.writeFileSync(configPath, JSON.stringify(configObj, null, 2));
    } catch (err) {
      logToFile(`Error updating config file with background color: ${err}`);
    }
    
    // Call the run function with the input file, output file, and options object
    await run(
      tempInputPath,
      outputPath as `${string}.png` | `${string}.svg` | `${string}.pdf` | "/dev/stdout",
      {
        puppeteerConfig: {
          args: ['--no-sandbox'],
          defaultViewport: {
            width: mergedOptions.width,
            height: mergedOptions.height,
            deviceScaleFactor: mergedOptions.scale
          }
        },
        quiet: true, // Set to true to suppress CLI output
        outputFormat: mermaidOutputFormat as 'png' | 'svg' | 'pdf' | undefined
      }
    );
    
    logToFile(`Mermaid CLI generated image at: ${outputPath}`);
    
    // For JPEG format, convert the PNG to JPEG if needed
    if (mergedOptions.format === 'jpeg' && mergedOptions.path !== outputPath) {
      // We'd normally convert here, but for now we'll just use the PNG
      logToFile('Note: JPEG format requested, but Mermaid CLI produces PNG. Using PNG output.');
    }
    
    // Clean up temporary files
    try {
      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(configPath);
      logToFile('Cleaned up temporary files');
    } catch (err) {
      logToFile(`Error cleaning up files: ${err}`);
    }
    
    return {
      success: true,
      imagePath: outputPath,
      message: "Diagram rendered successfully with Mermaid CLI",
      width: mergedOptions.width,
      height: mergedOptions.height
    };
  } catch (error) {
    logToFile(`Error rendering with Mermaid CLI: ${error}`);
    return {
      success: false,
      message: `Error rendering diagram with Mermaid CLI: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 