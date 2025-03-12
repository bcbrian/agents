import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderMermaidDiagramWithCLI } from './mermaid-cli-renderer';
import fs from 'fs';
import path from 'path';

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
vi.mock('@mermaid-js/mermaid-cli', async () => ({
  run: vi.fn().mockResolvedValue(undefined)
}));

describe('HTML Generation for Mermaid CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create temporary files for Mermaid CLI rendering', async () => {
    const mermaidCode = 'graph TD\nA-->B';
    
    await renderMermaidDiagramWithCLI(mermaidCode);
    
    // Check if writeFileSync was called twice (for input file and config file)
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    
    // First call should be for the Mermaid input file
    const firstCall = (fs.writeFileSync as any).mock.calls[0];
    expect(firstCall[1]).toBe(mermaidCode);
    
    // Second call should be for the config file
    const secondCall = (fs.writeFileSync as any).mock.calls[1];
    expect(secondCall[1]).toContain('"theme":');
  });

  it('should clean up temporary files after rendering', async () => {
    const mermaidCode = 'graph TD\nA-->B';
    
    await renderMermaidDiagramWithCLI(mermaidCode);
    
    // Check if unlinkSync was called twice (for input file and config file)
    expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
  });

  it('should handle Mermaid code with markdown code block markers', async () => {
    const mermaidCode = '```mermaid\ngraph TD\nA-->B\n```';
    
    await renderMermaidDiagramWithCLI(mermaidCode);
    
    // Check if the markdown markers were removed
    const firstCall = (fs.writeFileSync as any).mock.calls[0];
    expect(firstCall[1]).toBe('graph TD\nA-->B');
  });
}); 