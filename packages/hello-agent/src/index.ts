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

// Custom logging function that ensures all output is valid JSON
function log(message: string, data?: any) {
  const logObj = {
    type: "log",
    timestamp: Date.now(),
    message,
    data,
  };
  // Use process.stderr instead of console.log to avoid interfering with JSON-RPC communication
  process.stderr.write(JSON.stringify(logObj) + "\n");
}

// Custom error logging function
function logError(message: string, error?: any) {
  const logObj = {
    type: "error",
    timestamp: Date.now(),
    message,
    data: error?.toString(),
  };
  // Use process.stderr instead of console.error
  process.stderr.write(JSON.stringify(logObj) + "\n");
}

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

// Define our hello world tool
export const HELLO_TOOL: Tool = {
  name: "sayHello",
  description: "Returns a markdown 'hello world' heading",
  inputSchema: {
    type: "object",
    properties: {
      // No required parameters for this simple tool
    },
  },
  returns: {
    type: "object",
    properties: {
      markdown: {
        type: "string",
        description: "Markdown formatted hello world message",
      },
    },
    required: ["markdown"],
  },
};

// Handler for the sayHello tool
export async function handleSayHello(): Promise<CallToolResult> {
  // Simply return a markdown hello world heading
  return {
    result: {
      markdown: "# hello world",
    },
    // Cast to any to work around type issues
    content: [{ 
      type: "text",
      text: "# hello world",
    }] as any,
  };
}

// Main handler for tool calls
async function handleToolCall(
  name: string,
  args: any
): Promise<CallToolResult> {
  log("Tool call received", { name, args });

  // Handle our single tool
  if (name === "sayHello") {
    return await handleSayHello();
  }

  // Return error for unknown tools
  throw new Error(`Unknown tool: ${name}`);
}

// Create the server instance with proper capabilities
const server = new Server(
  { 
    name: "hello-agent",
    version: "0.1.0"
  },
  {
    capabilities: {
      resources: {},
      tools: {
        sayHello: HELLO_TOOL,
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
      message: "Starting Hello Agent MCP Server",
    }) + "\n"
  );

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Set up request handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [HELLO_TOOL],
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
        message: "Hello Agent MCP Server ready",
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
  logError("Hello Agent MCP Server closed");
  if (server) {
    server.close();
  }
}); 