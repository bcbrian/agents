#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
  TextContent,
  Tool,
  LATEST_PROTOCOL_VERSION,
} from "@modelcontextprotocol/sdk/types.js";

import {
  ChartType,
  ChartData,
  BarChartData,
  PieChartData,
  FlowchartData,
  generateMermaidMarkdown,
  suggestChartType,
} from "./mermaid-generator.js";

// Import the Mermaid CLI renderer
import { renderMermaidDiagramWithCLI } from './mermaid-cli-renderer.js';

// Import safe logging utilities
import { log, logError } from './utils/logger.js';

// Helper function to ensure notifications include the jsonrpc field
// This works around any type issues by using a type assertion
function safeNotification(server: Server, notification: any) {
  // Create a properly formatted notification with the jsonrpc field
  const jsonrpcNotification = {
    jsonrpc: "2.0",
    method: notification.method,
    params: notification.params || {},
  };

  // Use type assertion to bypass TypeScript constraints
  (server as any).notification(jsonrpcNotification);
}

// Define our drawing tool with original schema properties
export const DRAW_TOOL: Tool = {
  name: "drawChart",
  description: "Creates visualizations including charts, graphs, diagrams, and flow charts",
  inputSchema: {
    type: "object",
    properties: {
      data: {
        type: "string",
        description: "The data or description to visualize. Can be JSON string with chart configuration or text description",
      },
      chartType: {
        type: "string",
        description: "The type of chart to create (optional, will be determined from data if not provided)",
        enum: Object.values(ChartType),
      },
      title: {
        type: "string",
        description: "The title of the chart (optional)",
      }
    },
    required: ["data"],
  },
  returns: {
    type: "object",
    properties: {
      markdown: {
        type: "string",
        description: "Markdown formatted visualization or diagram",
      },
    },
    required: ["markdown"],
  },
};

// Define our rendering tool
export const RENDER_TOOL: Tool = {
  name: "renderChart",
  description: "Renders Mermaid diagram code as a visual image using Mermaid CLI",
  inputSchema: {
    type: "object",
    properties: {
      mermaidCode: {
        type: "string",
        description: "The Mermaid syntax to render",
      },
      width: {
        type: "number",
        description: "Image width in pixels (default: 1920)",
      },
      height: {
        type: "number",
        description: "Image height in pixels (default: 1080)",
      },
      format: {
        type: "string",
        description: "Image format (png, jpeg, svg, pdf)",
        enum: ["png", "jpeg", "svg", "pdf"],
      },
      theme: {
        type: "string",
        description: "Mermaid theme to use (default: default)",
      },
      backgroundColor: {
        type: "string",
        description: "Background color (CSS color value or 'transparent' for transparent PNG)"
      },
      scale: {
        type: "number",
        description: "Scale factor for rendering (1 = 100%, 2 = 200%, etc.)"
      },
      quality: {
        type: "number",
        description: "Quality setting for JPEG format (0-100)"
      },
      fit: {
        type: "string",
        description: "Fit mode for rendering",
        enum: ["contain", "fill", "actual"]
      },
      outputPath: {
        type: "string",
        description: "Custom file path where the image should be saved. If not provided, a temporary directory will be used."
      }
    },
    required: ["mermaidCode"],
  },
  returns: {
    type: "object",
    properties: {
      content: {
        type: "object",
        description: "Markdown formatted response with links to view and access the generated image",
        properties: {
          type: {
            type: "string",
            enum: ["text"],
            description: "Content type (always 'text' for markdown)"
          },
          text: {
            type: "string",
            description: "Markdown formatted text with links to the image"
          }
        },
        required: ["type", "text"]
      }
    },
    required: ["content"],
  },
};

// Parse the data string into a structured format
function parseInputData(dataString: string): any {
  try {
    // Try parsing as JSON first
    return JSON.parse(dataString);
  } catch (error) {
    // If not valid JSON, treat as descriptive text
    // For now, we'll create a simple example chart
    // In a more advanced implementation, we could use NLP to parse the text
    return {
      labels: ["Example 1", "Example 2", "Example 3"],
      values: [30, 50, 20],
    };
  }
}

// Handle tool calls
export async function handleToolCall(
  toolName: string,
  params: Record<string, any>
): Promise<CallToolResult> {
  try {
    if (toolName === 'drawChart') {
      try {
        // Log the data
        const dataString = params.data as string;
        const explicitChartType = params.chartType as ChartType | undefined;
        const title = params.title as string | undefined;
        
        log(`drawChart request received: ${dataString}, chartType: ${explicitChartType}, title: ${title}`);
        
        // Parse input data
        const parsedData = parseInputData(dataString);
        
        // Determine chart type (use explicit type if provided, otherwise infer from data)
        const chartType = explicitChartType ? 
                        explicitChartType : 
                        suggestChartType(parsedData);
        
        log(`Determined chart type: ${chartType}`);
        
        // Combine all data into one structure
        const chartData: ChartData = {
          ...parsedData,
          chartType,
          title: title || parsedData.title,
        };
        
        // Generate Mermaid markdown
        const markdown = generateMermaidMarkdown(chartData);
        
        log(`Generated Mermaid markdown for ${chartType} chart`);
        log("Markdown content", markdown);
        
        // Construct a response with both the markdown and a log message
        const responseText = `\`\`\`mermaid\n${markdown}\n\`\`\`\n\nGenerated ${chartType} chart from provided data.`;
        
        // Return the result with proper content formatting
        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        logError('Error processing drawChart:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error generating chart: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    } else if (toolName === 'renderChart') {
      try {
        // Log the Mermaid code
        const mermaidCode = params.mermaidCode as string;
        const width = params.width as number | undefined;
        const height = params.height as number | undefined;
        const format = params.format as 'png' | 'jpeg' | 'svg' | 'pdf' | undefined;
        const theme = params.theme as string | undefined;
        const backgroundColor = params.backgroundColor as string | undefined;
        const scale = params.scale as number | undefined;
        const quality = params.quality as number | undefined;
        const fit = params.fit as 'contain' | 'fill' | 'actual' | undefined;
        const outputPath = params.outputPath as string | undefined;
        
        log(`renderChart request received with ${mermaidCode.length} characters of Mermaid code`);
        log(`Render options: width=${width}, height=${height}, format=${format}, theme=${theme}, backgroundColor=${backgroundColor}, scale=${scale}, quality=${quality}, fit=${fit}, outputPath=${outputPath}`);
        
        // Use Mermaid CLI renderer
        const result = await renderMermaidDiagramWithCLI(mermaidCode, {
          width,
          height,
          format,
          theme,
          backgroundColor,
          scale,
          quality,
          fit,
          path: outputPath // Pass the custom path if provided
        });
        
        log('renderChart result:', result);
        
        if (result.success && result.imagePath) {
          // Create file:// URL for direct file access
          const fileUrl = `file://${result.imagePath}`;
          
          // Get file format for display purposes
          const fileFormat = format || 'png';
          const fileFormatName = fileFormat.toUpperCase();
          
          // Determine if a custom path was used
          const isCustomPath = outputPath !== undefined;
          
          // Create enhanced markdown response with clickable links
          const markdownResponse = `
## 📊 Chart Generated Successfully

Your chart has been generated as a ${fileFormatName} image with dimensions ${result.width || width || 1920}×${result.height || height || 1080}px.

### 🔍 View Your Image

- **[Open Image in Browser](${fileUrl})** - Click to open in your browser

### 📝 File Details

**File Location**: \`${result.imagePath}\`${isCustomPath ? ' (custom location)' : ' (temporary file)'}

- **Format**: ${fileFormatName}
- **Size**: ${result.width || width || 1920}×${result.height || height || 1080}px
${scale ? `- **Scale**: ${scale}×\n` : ''}${theme ? `- **Theme**: ${theme}\n` : ''}

> **Note**: ${isCustomPath 
  ? 'The image was saved to your specified location.'
  : 'To save this image permanently, open the image in your browser and save it to your desired location.\n> You can also copy the file path above and access it directly through your file system.'}
`;
          
          // Return the enhanced markdown response
          return {
            content: [
              {
                type: "text",
                text: markdownResponse
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `### ❌ Error Rendering Chart\n\n${result.message}`
              }
            ]
          };
        }
      } catch (error) {
        logError('Error processing renderChart:', error);
        return {
          content: [
            {
              type: "text",
              text: `### ❌ Error Rendering Chart\n\n${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    } else {
      throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    logError('Error handling tool call:', error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

// Create the server instance with proper capabilities
const server = new Server(
  { 
    name: "draw-agent",
    version: "0.1.0"
  },
  {
    capabilities: {
      resources: {},
      tools: {
        drawChart: DRAW_TOOL,
        renderChart: RENDER_TOOL,
      },
    },
  }
);

// Start the MCP server
async function runServer() {
  // Log startup to stderr instead of stdout to avoid interfering with JSON-RPC
  process.stderr.write(
    JSON.stringify({
      type: "startup",
      timestamp: Date.now(),
      message: "Starting Draw Agent MCP Server",
    }) + "\n"
  );

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Set up request handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [DRAW_TOOL, RENDER_TOOL],
    }));

    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      // Log the incoming request for debugging
      log("Received tool call request", {
        name: request.params.name,
        args: request.params.arguments,
      });
   
      try {
        // Handle the tool call
        return await handleToolCall(
          request.params.name,
          request.params.arguments ?? {}
        );
      } catch (error: any) {
        logError("Error handling tool call", error);
        throw error;
      }
    });

    // Log connected to stderr
    process.stderr.write(
      JSON.stringify({
        type: "startup",
        timestamp: Date.now(),
        message: "Draw Agent MCP Server ready",
      }) + "\n"
    );
  } catch (error: any) {
    process.stderr.write(
      JSON.stringify({
        type: "startup_error",
        timestamp: Date.now(),
        message: "Error starting MCP server",
        error: error.toString(),
      }) + "\n"
    );
    process.exit(1);
  }
}

// Start the server
runServer().catch((error) => logError("Error starting server:", error));

// Handle process closing
process.stdin.on("close", () => {
  logError("Draw Agent MCP Server closed");
  if (server) {
    server.close();
  }
}); 