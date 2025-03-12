/**
 * Utility module for generating Mermaid.js diagram syntax
 */

/**
 * Chart type enumeration for supported chart/diagram types
 */
export enum ChartType {
  BAR_CHART = "bar",
  PIE_CHART = "pie",
  FLOWCHART = "flowchart",
  SEQUENCE = "sequence",
  CLASS_DIAGRAM = "classDiagram",
  ENTITY_RELATIONSHIP = "erDiagram",
  GANTT = "gantt",
  STATE_DIAGRAM = "stateDiagram-v2",
  JOURNEY = "journey",
}

/**
 * Common interface for chart data
 */
export interface ChartData {
  title?: string;
  chartType: ChartType;
  [key: string]: any;
}

/**
 * Data structure for simple bar charts
 */
export interface BarChartData extends ChartData {
  chartType: ChartType.BAR_CHART;
  labels: string[];
  values: number[];
  // Optional properties
  xAxisLabel?: string;
  yAxisLabel?: string;
}

/**
 * Data structure for pie charts
 */
export interface PieChartData extends ChartData {
  chartType: ChartType.PIE_CHART;
  labels: string[];
  values: number[];
}

/**
 * Data structure for flowcharts
 */
export interface FlowchartData extends ChartData {
  chartType: ChartType.FLOWCHART;
  // Simplified for initial implementation - can be extended later
  nodes: { id: string; label: string; shape?: string }[];
  edges: { from: string; to: string; label?: string }[];
  direction?: "TB" | "BT" | "RL" | "LR"; // Top-Bottom, Bottom-Top, Right-Left, Left-Right
}

/**
 * Generates mermaid code for a bar chart
 */
export function generateBarChart(data: BarChartData): string {
  const { title, labels, values, xAxisLabel, yAxisLabel } = data;
  
  // Create title section if provided
  const titleSection = title ? `---\ntitle: ${title}\n---\n\n` : "";
  
  // Start with the chart type declaration
  let mermaidCode = `${titleSection}pie\n`;
  
  // Add data points
  for (let i = 0; i < labels.length; i++) {
    mermaidCode += `    "${labels[i]}" : ${values[i]}\n`;
  }
  
  return mermaidCode;
}

/**
 * Generates mermaid code for a pie chart
 */
export function generatePieChart(data: PieChartData): string {
  const { title, labels, values } = data;
  
  // Create title section if provided
  const titleSection = title ? `---\ntitle: ${title}\n---\n\n` : "";
  
  // Start with the chart type declaration
  let mermaidCode = `${titleSection}pie\n`;
  
  // Add data points
  for (let i = 0; i < labels.length; i++) {
    mermaidCode += `    "${labels[i]}" : ${values[i]}\n`;
  }
  
  return mermaidCode;
}

/**
 * Generates mermaid code for a flowchart
 */
export function generateFlowchart(data: FlowchartData): string {
  const { title, nodes, edges, direction = "TB" } = data;
  
  // Create title section if provided
  const titleSection = title ? `---\ntitle: ${title}\n---\n\n` : "";
  
  // Start with the chart type and direction
  let mermaidCode = `${titleSection}flowchart ${direction}\n`;
  
  // Add nodes
  for (const node of nodes) {
    if (node.shape) {
      // Handle shaped nodes: A[This is a rectangle]
      mermaidCode += `    ${node.id}[${node.label}]\n`;
    } else {
      // Simple node: A(This is a node)
      mermaidCode += `    ${node.id}(${node.label})\n`;
    }
  }
  
  // Add edges
  for (const edge of edges) {
    if (edge.label) {
      // Edge with label: A -->|Label| B
      mermaidCode += `    ${edge.from} -->|${edge.label}| ${edge.to}\n`;
    } else {
      // Simple edge: A --> B
      mermaidCode += `    ${edge.from} --> ${edge.to}\n`;
    }
  }
  
  return mermaidCode;
}

/**
 * Main function to generate Mermaid diagram code based on chart type
 */
export function generateMermaidCode(data: ChartData): string {
  switch (data.chartType) {
    case ChartType.BAR_CHART:
      return generateBarChart(data as BarChartData);
    case ChartType.PIE_CHART:
      return generatePieChart(data as PieChartData);
    case ChartType.FLOWCHART:
      return generateFlowchart(data as FlowchartData);
    default:
      throw new Error(`Chart type ${data.chartType} is not yet implemented`);
  }
}

/**
 * Generate mermaid code and wrap it in a markdown code block
 */
export function generateMermaidMarkdown(data: ChartData): string {
  const mermaidCode = generateMermaidCode(data);
  return "```mermaid\n" + mermaidCode + "```";
}

/**
 * Utility function to analyze input data and suggest an appropriate chart type
 */
export function suggestChartType(data: any): ChartType {
  // This is a placeholder for more sophisticated logic
  
  // If it has nodes and edges, it's probably a flowchart
  if (data.nodes && data.edges) {
    return ChartType.FLOWCHART;
  }
  
  // If it has labels and values as arrays of the same length, probably a chart
  if (Array.isArray(data.labels) && Array.isArray(data.values) && 
      data.labels.length === data.values.length) {
    
    // Default to pie chart for simplicity in this initial version
    return ChartType.PIE_CHART;
  }
  
  // Default to flowchart
  return ChartType.FLOWCHART;
} 