#!/usr/bin/env node

/**
 * This is a test script that demonstrates how to use the browser driver with Claude
 * through the Model Context Protocol (MCP). It simulates the JSON-RPC interface
 * that Claude would use to control the browser.
 */

const { spawn } = require("child_process");
const path = require("path");
const readline = require("readline");

// Launch the browser driver process
const driverPath = path.join(__dirname, "dist", "index.js");
const driverProcess = spawn("node", [driverPath], {
  stdio: ["pipe", "pipe", "pipe"],
});

// Set up readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Handle driver process output
let buffer = "";
driverProcess.stdout.on("data", (data) => {
  const text = data.toString();
  buffer += text;

  // Process complete JSON objects
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
    const line = buffer.substring(0, newlineIndex);
    buffer = buffer.substring(newlineIndex + 1);

    try {
      const parsed = JSON.parse(line);

      if (parsed.type === "log") {
        console.log(`[LOG] ${parsed.message}`);
        if (parsed.data) {
          console.log(JSON.stringify(parsed.data, null, 2));
        }
      } else if (parsed.id) {
        console.log(`\n[RESPONSE]`);
        console.log(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log(`[RAW] ${line}`);
    }
  }
});

driverProcess.stderr.on("data", (data) => {
  console.error(`[ERROR] ${data.toString()}`);
});

driverProcess.on("close", (code) => {
  console.log(`Browser driver process exited with code ${code}`);
  rl.close();
});

// Available commands
const commands = {
  navigate: (url) => ({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: "puppeteer_navigate",
      arguments: { url },
    },
  }),

  discover: (elementType = "all") => ({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: "puppeteer_discover",
      arguments: { elementType },
    },
  }),

  click: (selector) => ({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: "puppeteer_click",
      arguments: { selector },
    },
  }),

  fill: (selector, value) => ({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: "puppeteer_fill",
      arguments: { selector, value },
    },
  }),

  listTools: () => ({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/list",
  }),

  help: () => {
    console.log(`
Available commands:
  navigate <url>                 - Navigate to a URL
  discover [elementType]         - Discover elements (all, buttons, links, inputs)
  click <selector>               - Click an element
  fill <selector> <value>        - Fill an input field
  listTools                      - List all available tools
  help                           - Show this help
  exit                           - Exit the test
    `);
    return null;
  },

  exit: () => {
    driverProcess.kill();
    rl.close();
    process.exit(0);
    return null;
  },
};

// Process user commands
function promptUser() {
  rl.question("> ", (input) => {
    const args = input.trim().split(" ");
    const command = args[0].toLowerCase();

    if (command in commands) {
      if (command === "navigate") {
        const url = args[1];
        if (!url) {
          console.log("Please provide a URL");
        } else {
          const request = commands.navigate(url);
          sendRequest(request);
        }
      } else if (command === "discover") {
        const elementType = args[1] || "all";
        const request = commands.discover(elementType);
        sendRequest(request);
      } else if (command === "click") {
        const selector = args[1];
        if (!selector) {
          console.log("Please provide a selector");
        } else {
          const request = commands.click(selector);
          sendRequest(request);
        }
      } else if (command === "fill") {
        const selector = args[1];
        const value = args.slice(2).join(" ");
        if (!selector || !value) {
          console.log("Please provide a selector and value");
        } else {
          const request = commands.fill(selector, value);
          sendRequest(request);
        }
      } else if (command === "listtools") {
        const request = commands.listTools();
        sendRequest(request);
      } else {
        // For help and exit
        const result = commands[command]();
        if (result) {
          sendRequest(result);
        }
      }
    } else {
      console.log('Unknown command. Type "help" for available commands.');
    }

    // Continue prompt loop unless exiting
    if (command !== "exit") {
      promptUser();
    }
  });
}

// Send a request to the driver
function sendRequest(request) {
  console.log(`\n[REQUEST]`);
  console.log(JSON.stringify(request, null, 2));
  driverProcess.stdin.write(JSON.stringify(request) + "\n");
}

// Start the prompt loop
console.log("Browser Driver Test Client");
console.log('Type "help" for available commands');
promptUser();
