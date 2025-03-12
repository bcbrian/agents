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
  const mockRun = vi.fn().mockResolvedValue(undefined);
  return {
    run: mockRun
  };
});

describe('Advanced Rendering Features with Mermaid CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should support transparent backgrounds', async () => {
    const mermaidCode = 'graph TD\nA-->B';
    
    await renderMermaidDiagramWithCLI(mermaidCode, {
      backgroundColor: 'transparent'
    });
    
    // Check if the config was updated with transparent background
    const configCall = (fs.writeFileSync as any).mock.calls.find(call => 
      typeof call[1] === 'string' && call[1].includes('"backgroundColor"')
    );
    
    expect(configCall).toBeDefined();
    expect(configCall[1]).toContain('"backgroundColor":"transparent"');
  });

  it('should support custom background colors', async () => {
    const mermaidCode = 'graph TD\nA-->B';
    
    await renderMermaidDiagramWithCLI(mermaidCode, {
      backgroundColor: '#ff0000'
    });
    
    // Check if the config was updated with the custom background color
    const configCall = (fs.writeFileSync as any).mock.calls.find(call => 
      typeof call[1] === 'string' && call[1].includes('"backgroundColor"')
    );
    
    expect(configCall).toBeDefined();
    expect(configCall[1]).toContain('"backgroundColor":"#ff0000"');
  });

  it('should support scale factor', async () => {
    const mermaidCode = 'graph TD\nA-->B';
    
    await renderMermaidDiagramWithCLI(mermaidCode, {
      scale: 2
    });
    
    // Check if the run function was called with the correct scale factor
    const mermaidCliModule = await import('@mermaid-js/mermaid-cli');
    const runCalls = (mermaidCliModule.run as any).mock.calls;
    
    expect(runCalls.length).toBeGreaterThan(0);
    expect(runCalls[0][2].puppeteerConfig.defaultViewport.deviceScaleFactor).toBe(2);
  });

  it('should support different output formats', async () => {
    const formats = ['png', 'svg', 'pdf'];
    
    for (const format of formats) {
      await renderMermaidDiagramWithCLI('graph TD\nA-->B', {
        format: format as any
      });
      
      // Check if the output path has the correct extension
      const result = await renderMermaidDiagramWithCLI('graph TD\nA-->B', {
        format: format as any
      });
      
      expect(result.imagePath).toContain(`.${format}`);
    }
  });
}); 