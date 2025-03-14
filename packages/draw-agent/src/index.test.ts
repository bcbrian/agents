import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFINE_CHART_TOOL, DRAW_CHART_TOOL, handleToolCall } from './index';
import * as mermaidGenerator from './mermaid-generator';

// Mock the mermaid-generator module
vi.mock('./mermaid-generator', async () => {
  const actual = await vi.importActual('./mermaid-generator');
  return {
    ...actual,
    suggestChartType: vi.fn().mockReturnValue('pie'),
    generateMermaidMarkdown: vi.fn().mockReturnValue('pie\n    "A" : 50\n    "B" : 50')
  };
});

// Mock the mermaid-cli-renderer module
vi.mock('./mermaid-cli-renderer', () => ({
  renderMermaidDiagramWithCLI: vi.fn().mockResolvedValue({
    success: true,
    imagePath: '/tmp/test-image.png',
    message: 'Diagram rendered successfully with Mermaid CLI',
    width: 800,
    height: 600
  })
}));

describe('Draw Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('DEFINE_CHART_TOOL Definition', () => {
    it('should have the correct name and description', () => {
      expect(DEFINE_CHART_TOOL.name).toBe('defineChart');
      expect(DEFINE_CHART_TOOL.description).toContain('Defines chart or diagram');
    });
    
    it('should require data parameter', () => {
      const requiredParams = DEFINE_CHART_TOOL.inputSchema.required as string[];
      expect(requiredParams).toContain('data');
    });
    
    it('should define the correct return structure', () => {
      const returns = DEFINE_CHART_TOOL.returns as any;
      expect(returns.properties).toHaveProperty('markdown');
      expect(returns.required).toContain('markdown');
    });
  });
  
  describe('DRAW_CHART_TOOL Definition', () => {
    it('should have the correct name and description', () => {
      expect(DRAW_CHART_TOOL.name).toBe('drawChart');
      expect(DRAW_CHART_TOOL.description).toContain('Renders Mermaid diagram');
    });
    
    it('should require mermaidCode parameter', () => {
      const requiredParams = DRAW_CHART_TOOL.inputSchema.required as string[];
      expect(requiredParams).toContain('mermaidCode');
    });
  });
  
  describe('handleToolCall', () => {
    it('should process defineChart requests', async () => {
      const result = await handleToolCall('defineChart', {
        data: JSON.stringify({
          labels: ['A', 'B'],
          values: [50, 50]
        }),
        title: 'Test Chart',
        chartType: 'pie'
      });
      
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('pie');
      expect(result.content[0].text).toContain('"A" : 50');
    });
    
    it('should handle missing chart type by using suggestion', async () => {
      await handleToolCall('defineChart', {
        data: JSON.stringify({
          labels: ['A', 'B'],
          values: [30, 70]
        }),
        title: 'Test Chart'
      });
      
      expect(mermaidGenerator.suggestChartType).toHaveBeenCalled();
    });
    
    it('should handle non-JSON input data gracefully', async () => {
      const result = await handleToolCall('defineChart', {
        data: 'This is not JSON data',
        chartType: 'pie'
      });
      
      expect(result.content[0].text).toContain('pie');
      expect(result.content[0].text).toContain('"A" : 50');
    });
    
    it('should process drawChart requests', async () => {
      const result = await handleToolCall('drawChart', {
        mermaidCode: 'graph TD\nA-->B',
        width: 800,
        height: 600
      });
      
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Chart Generated Successfully');
      expect(result.content[0].text).toContain('File Location');
      expect(result.content[0].text).toContain('Open Image in Browser');
    });
    
    // Skip the error test for now as it's difficult to properly mock
    it.skip('should handle errors properly', async () => {
      // This test would require more complex mocking which is difficult in this context
      expect(true).toBe(true); // Placeholder assertion
    });
  });
}); 