import { describe, it, expect } from 'vitest';
import {
  ChartType,
  PieChartData,
  BarChartData,
  FlowchartData,
  generateMermaidCode,
  generateMermaidMarkdown,
  suggestChartType
} from './mermaid-generator';

describe('Mermaid Generator', () => {
  // Test chart type suggestion
  describe('suggestChartType', () => {
    it('should suggest flowchart for data with nodes and edges', () => {
      const data = {
        nodes: [
          { id: 'A', label: 'Node A' },
          { id: 'B', label: 'Node B' }
        ],
        edges: [
          { from: 'A', to: 'B' }
        ]
      };
      expect(suggestChartType(data)).toBe(ChartType.FLOWCHART);
    });

    it('should suggest pie chart for data with labels and values arrays', () => {
      const data = {
        labels: ['A', 'B', 'C'],
        values: [10, 20, 30]
      };
      expect(suggestChartType(data)).toBe(ChartType.PIE_CHART);
    });

    it('should default to flowchart for unknown data structures', () => {
      const data = {
        someProperty: 'someValue'
      };
      expect(suggestChartType(data)).toBe(ChartType.FLOWCHART);
    });
  });

  // Test pie chart generation
  describe('Pie Chart Generation', () => {
    it('should generate correct mermaid code for pie chart', () => {
      const pieData: PieChartData = {
        chartType: ChartType.PIE_CHART,
        labels: ['Category A', 'Category B', 'Category C'],
        values: [30, 40, 30],
        title: 'Distribution by Category'
      };

      const result = generateMermaidCode(pieData);
      expect(result).toContain('pie');
      expect(result).toContain('title: Distribution by Category');
      expect(result).toContain('"Category A" : 30');
      expect(result).toContain('"Category B" : 40');
      expect(result).toContain('"Category C" : 30');
    });

    it('should generate pie chart without title if not provided', () => {
      const pieData: PieChartData = {
        chartType: ChartType.PIE_CHART,
        labels: ['X', 'Y'],
        values: [60, 40]
      };

      const result = generateMermaidCode(pieData);
      expect(result).not.toContain('title:');
      expect(result).toContain('pie');
      expect(result).toContain('"X" : 60');
      expect(result).toContain('"Y" : 40');
    });
  });

  // Test bar chart generation (currently implemented the same as pie chart)
  describe('Bar Chart Generation', () => {
    it('should generate bar chart code (currently same as pie chart)', () => {
      const barData: BarChartData = {
        chartType: ChartType.BAR_CHART,
        labels: ['Jan', 'Feb', 'Mar'],
        values: [10, 20, 15],
        title: 'Monthly Sales',
        xAxisLabel: 'Month',
        yAxisLabel: 'Sales'
      };

      const result = generateMermaidCode(barData);
      expect(result).toContain('title: Monthly Sales');
      // Currently it generates a pie chart format
      expect(result).toContain('pie');
      expect(result).toContain('"Jan" : 10');
    });
  });

  // Test flowchart generation
  describe('Flowchart Generation', () => {
    it('should generate correct mermaid code for flowchart', () => {
      const flowData: FlowchartData = {
        chartType: ChartType.FLOWCHART,
        title: 'Simple Process',
        direction: 'TB',
        nodes: [
          { id: 'A', label: 'Start' },
          { id: 'B', label: 'Process', shape: 'rectangle' },
          { id: 'C', label: 'End' }
        ],
        edges: [
          { from: 'A', to: 'B', label: 'Begin' },
          { from: 'B', to: 'C' }
        ]
      };

      const result = generateMermaidCode(flowData);
      expect(result).toContain('flowchart TB');
      expect(result).toContain('title: Simple Process');
      expect(result).toContain('A(Start)');
      expect(result).toContain('B[Process]');
      expect(result).toContain('C(End)');
      expect(result).toContain('A -->|Begin| B');
      expect(result).toContain('B --> C');
    });
  });

  // Test markdown wrapping
  describe('Markdown Generation', () => {
    it('should wrap mermaid code in markdown code block', () => {
      const pieData: PieChartData = {
        chartType: ChartType.PIE_CHART,
        labels: ['A', 'B'],
        values: [70, 30]
      };

      const result = generateMermaidMarkdown(pieData);
      expect(result).toMatch(/^```mermaid\n[\s\S]*\n```$/);
      expect(result).toContain('pie');
      expect(result).toContain('"A" : 70');
      expect(result).toContain('"B" : 30');
    });
  });
}); 