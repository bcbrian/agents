#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
// Custom logging function that ensures all output is valid JSON
function log(message, data) {
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
function logError(message, error) {
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
function safeNotification(server, notification) {
    try {
        server.sendNotification(notification.method, notification.params);
    }
    catch (error) {
        logError(`Error sending notification: ${notification.method}`, error);
    }
}
// Define our hello world tool
const HELLO_TOOL = {
    name: "sayHello",
    description: "Returns a markdown 'hello world' heading",
    schema: {
        type: "object",
        properties: {
        // No required parameters for this simple tool
        },
        required: [],
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
async function handleSayHello() {
    // Simply return a markdown hello world heading
    return {
        result: {
            markdown: "# hello world",
        },
        content: {
            type: "text/markdown",
            text: "# hello world",
        },
    };
}
// Main handler for tool calls
async function handleToolCall(name, args) {
    log("Tool call received", { name, args });
    // Handle our single tool
    if (name === "sayHello") {
        return await handleSayHello();
    }
    // Return error for unknown tools
    throw new Error(`Unknown tool: ${name}`);
}
// Start the MCP server
async function runServer() {
    // Log startup to stderr instead of stdout to avoid interfering with JSON-RPC
    process.stderr.write(JSON.stringify({
        type: "startup",
        timestamp: Date.now(),
        message: "Starting Hello Agent MCP Server",
    }) + "\n");
    // Create MCP server with stdio transport
    const transport = new stdio_js_1.StdioServerTransport();
    const server = new index_js_1.Server(transport, { version: types_js_1.LATEST_PROTOCOL_VERSION });
    try {
        // Set up request handlers
        server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            result: {
                tools: [HELLO_TOOL],
            },
        }));
        server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => ({
            result: {
                resources: [],
            },
        }));
        server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            // Log the incoming request for debugging
            log("Received tool call request", {
                name: request.params.name,
                args: request.params.args,
            });
            try {
                // Handle the tool call
                const result = await handleToolCall(request.params.name, request.params.args);
                return { result };
            }
            catch (error) {
                logError("Error handling tool call", error);
                throw error;
            }
        });
        // Log connected to stderr
        process.stderr.write(JSON.stringify({
            type: "startup",
            timestamp: Date.now(),
            message: "Hello Agent MCP Server ready",
        }) + "\n");
    }
    catch (error) {
        process.stderr.write(JSON.stringify({
            type: "startup_error",
            timestamp: Date.now(),
            message: "Error starting MCP server",
            error: error.toString(),
        }) + "\n");
        process.exit(1);
    }
}
// Start the server
runServer().catch((error) => logError("Error starting server:", error));
// Handle process closing
process.stdin.on("close", () => {
    logError("Hello Agent MCP Server closed");
    server.close();
});
