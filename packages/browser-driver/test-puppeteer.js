#!/usr/bin/env node

// This script demonstrates how to use the browser-driver with an MCP client
// Run with: node test-puppeteer.js

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const SERVER_EXECUTABLE = path.resolve(__dirname, "dist/index.js");

// Start browser-driver process
const serverProcess = spawn("node", [SERVER_EXECUTABLE], {
  stdio: ["pipe", "pipe", "pipe"],
});

// Create a simple MCP client
let requestId = 1;

// Log server output
serverProcess.stdout.on("data", (data) => {
  console.log(`[Server stdout]: ${data.toString().trim()}`);
});

serverProcess.stderr.on("data", (data) => {
  console.error(`[Server stderr]: ${data.toString().trim()}`);
});

// Function to send MCP request
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: "2.0",
    id: requestId++,
    method,
    params,
  };

  const requestStr = JSON.stringify(request) + "\n";
  console.log(`[Client -> Server]: ${requestStr.trim()}`);
  serverProcess.stdin.write(requestStr);
}

// Handle server responses
let buffer = "";
serverProcess.stdout.on("data", (data) => {
  buffer += data.toString();

  // Process complete JSON lines
  const lines = buffer.split("\n");
  buffer = lines.pop(); // Keep incomplete line for next time

  for (const line of lines) {
    if (line.trim()) {
      console.log(`[Server -> Client]: ${line}`);
      try {
        const response = JSON.parse(line);

        // Handle the response based on the request that was sent
        if (response.result && response.id) {
          // Handle different types of responses based on their content
          console.log(`Received response for request ${response.id}`);
        }
      } catch (err) {
        console.error("Error parsing JSON response:", err);
      }
    }
  }
});

// Set up test sequence with timeouts to see the browser in action
setTimeout(() => {
  console.log("Listing available tools...");
  sendRequest("tools/list");
}, 1000);

setTimeout(() => {
  console.log("Navigating to Google...");
  sendRequest("tools/call", {
    name: "puppeteer_navigate",
    arguments: { url: "https://www.google.com" },
  });
}, 3000);

setTimeout(() => {
  console.log("Taking a screenshot...");
  sendRequest("tools/call", {
    name: "puppeteer_screenshot",
    arguments: { name: "google-homepage", width: 1280, height: 800 },
  });
}, 5000);

setTimeout(() => {
  console.log("Filling search box...");
  sendRequest("tools/call", {
    name: "puppeteer_fill",
    arguments: {
      selector: 'textarea[name="q"]',
      value: "Puppeteer browser automation",
    },
  });
}, 7000);

setTimeout(() => {
  console.log("Clicking search button...");
  sendRequest("tools/call", {
    name: "puppeteer_click",
    arguments: { selector: 'input[name="btnK"]' },
  });
}, 9000);

setTimeout(() => {
  console.log("Taking a screenshot of search results...");
  sendRequest("tools/call", {
    name: "puppeteer_screenshot",
    arguments: { name: "search-results", width: 1280, height: 800 },
  });
}, 11000);

setTimeout(() => {
  console.log("Getting available resources...");
  sendRequest("resources/list");
}, 13000);

// Clean up after our test
setTimeout(() => {
  console.log("Test complete, shutting down...");
  serverProcess.stdin.end();
  serverProcess.kill();
  process.exit(0);
}, 15000);

// Handle process exit
process.on("SIGINT", () => {
  console.log("Terminating test...");
  serverProcess.stdin.end();
  serverProcess.kill();
  process.exit(0);
});
