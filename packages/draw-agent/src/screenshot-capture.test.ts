import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderMermaidDiagramWithCLI } from './mermaid-cli-renderer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock fs and path modules
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue('{}'),
  unlinkSync: vi.fn(),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true)
}));

// Mock the mermaid-cli package
vi.mock('@mermaid-js/mermaid-cli', async () => {
  const mockRun = vi.fn().mockImplementation((input, output) => {
    // Simulate creating the output file
    fs.writeFileSync(output, 'mock image data');
    return Promise.resolve();
  });
  
  return {
    run: mockRun
  };
});

describe('Screenshot Capture with Mermaid CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the mock implementation of existsSync
    (fs.existsSync as any).mockImplementation((path: string) => {
      // Simulate that output files exist after they're created
      return path.includes('mermaid-diagram');
    });
  });

  it('should capture screenshots with default settings', async () => {
    const mermaidCode = 'graph TD\nA-->B';
    
    const result = await renderMermaidDiagramWithCLI(mermaidCode);
    
    expect(result.success).toBe(true);
    expect(result.imagePath).toBeDefined();
    expect(result.width).toBe(1920); // Default width
    expect(result.height).toBe(1080); // Default height
  });

  it('should capture screenshots with custom dimensions', async () => {
    const mermaidCode = 'graph TD\nA-->B';
    
    const result = await renderMermaidDiagramWithCLI(mermaidCode, {
      width: 800,
      height: 600
    });
    
    expect(result.success).toBe(true);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('should enforce minimum dimensions', async () => {
    const mermaidCode = 'graph TD\nA-->B';
    
    const result = await renderMermaidDiagramWithCLI(mermaidCode, {
      width: 100,
      height: 100
    });
    
    expect(result.success).toBe(true);
    expect(result.width).toBe(400); // Minimum width
    expect(result.height).toBe(300); // Minimum height
  });

  it('should handle errors gracefully', async () => {
    // Mock the run function to throw an error
    const mermaidCliModule = await import('@mermaid-js/mermaid-cli');
    (mermaidCliModule.run as any).mockRejectedValueOnce(new Error('Test error'));
    
    const result = await renderMermaidDiagramWithCLI('invalid mermaid code');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Test error');
  });
}); 