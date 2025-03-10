#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

// Function to run the driver and send a command
async function runCommand() {
  try {
    console.log("Starting browser driver and sending commands...");

    // Create the JSON-RPC request that follows MCP format
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "puppeteer_navigate",
        arguments: {
          url: "https://example.com",
        },
      },
    };

    // Spawn the driver process with our input
    const driverPath = path.join(__dirname, "dist", "index.js");
    const result = spawnSync("node", [driverPath], {
      input: JSON.stringify(request) + "\n",
      encoding: "utf-8",
    });

    console.log("--- STDOUT ---");
    console.log(result.stdout);

    console.log("--- STDERR ---");
    console.log(result.stderr);

    console.log("--- EXIT CODE ---");
    console.log(result.status);

    // Try to parse the response
    try {
      // The response might be multiple JSON objects separated by newlines
      const lines = result.stdout.trim().split("\n");

      // Look for the response by filtering for potential JSON-RPC responses
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);

          // Check if this looks like our response
          if (parsed.id === 1 && parsed.result) {
            console.log("\nFound response:");
            console.log(JSON.stringify(parsed, null, 2));
            break;
          }

          // Log other JSON objects that might be important
          if (parsed.type === "log" || parsed.type === "error") {
            console.log(`\nLog entry: ${parsed.message}`);
            if (parsed.data) {
              console.log(JSON.stringify(parsed.data, null, 2));
            }
          }
        } catch (e) {
          // Skip lines that aren't valid JSON
          continue;
        }
      }
    } catch (e) {
      console.error("Error parsing response:", e.message);
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

runCommand().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
