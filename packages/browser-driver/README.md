# Browser Driver MCP Server

A browser automation tool based on Puppeteer that follows the Model Context
Protocol (MCP).

## Overview

This package provides a simple MCP server that enables browser automation
through Puppeteer. It allows AI models or other MCP clients to control a
browser, navigate to websites, take screenshots, fill forms, and more.

## Key Features

- **Visible Browser**: Always runs in non-headless mode so you can see what's
  happening
- **Simple API**: Provides basic Puppeteer actions through a clean MCP interface
- **Screenshots**: Capture full page or element screenshots
- **Form Manipulation**: Fill forms, click buttons, select options

## Installation

```bash
npm install -g @brianbuildz/browser-driver
```

## Usage

### As a Command Line Tool

Run the MCP server:

```bash
browser-driver
```

This will start the MCP server and open a browser window. The server
communicates using the MCP protocol via standard input/output.

### In an MCP Client

You can use this tool with any MCP client. Here's a basic example:

```javascript
// Example MCP client communication
const mcp = require("some-mcp-client-library");

async function runBrowserAutomation() {
  // Connect to the browser-driver
  const browser = await mcp.connect("browser-driver");

  // Navigate to a URL
  await browser.call("puppeteer_navigate", { url: "https://www.google.com" });

  // Take a screenshot
  await browser.call("puppeteer_screenshot", { name: "google-home" });

  // Fill in a form field
  await browser.call("puppeteer_fill", {
    selector: 'textarea[name="q"]',
    value: "Puppeteer automation",
  });

  // Click a button
  await browser.call("puppeteer_click", { selector: 'input[name="btnK"]' });
}
```

### Testing with the Included Test Script

We've included a simple test script to demonstrate the functionality:

```bash
node test-puppeteer.js
```

This will run a sequence of browser automation commands to navigate to Google,
search for "Puppeteer browser automation", and take screenshots of the process.

## Available Tools

| Tool Name              | Description                       | Parameters                                                                                              |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `puppeteer_navigate`   | Navigate to a URL                 | `url` (string)                                                                                          |
| `puppeteer_screenshot` | Take a screenshot                 | `name` (string), `selector` (string, optional), `width` (number, optional), `height` (number, optional) |
| `puppeteer_click`      | Click an element                  | `selector` (string)                                                                                     |
| `puppeteer_fill`       | Fill an input field               | `selector` (string), `value` (string)                                                                   |
| `puppeteer_select`     | Select an option in a dropdown    | `selector` (string), `value` (string)                                                                   |
| `puppeteer_hover`      | Hover over an element             | `selector` (string)                                                                                     |
| `puppeteer_evaluate`   | Execute JavaScript in the browser | `script` (string)                                                                                       |
| `puppeteer_list_tabs`  | List all open tabs                | (no parameters)                                                                                         |
| `puppeteer_new_tab`    | Open a new browser tab            | `url` (string, optional)                                                                                |
| `puppeteer_close_tab`  | Close a browser tab               | (`tabIndex`, `tabUrl` or `tabTitle` to specify which tab to close)                                      |

## Multi-Tab Support

The Browser Driver MCP supports working with multiple tabs in the browser
session. All tools accept optional tab selection parameters that determine which
browser tab to operate on:

### Tab Selection Parameters

| Parameter  | Type   | Description                                        |
| ---------- | ------ | -------------------------------------------------- |
| `tabIndex` | number | Select tab by position (0-based index)             |
| `tabUrl`   | string | Select first tab with URL containing this string   |
| `tabTitle` | string | Select first tab with title containing this string |

If no tab parameters are provided, the most recently used tab will be selected.
If this is your first command, the first tab will be used.

### Example Usage

```javascript
// Navigate to a URL in the first tab
await browser.call("puppeteer_navigate", { url: "https://example.com" });

// Open a new tab with a specific URL
await browser.call("puppeteer_new_tab", { url: "https://github.com" });

// List all open tabs
const tabs = await browser.call("puppeteer_list_tabs", {});

// Fill a form in a tab that has "login" in its URL
await browser.call("puppeteer_fill", {
  tabUrl: "login",
  selector: "#username",
  value: "user123",
});

// Click a button in the second tab
await browser.call("puppeteer_click", {
  tabIndex: 1,
  selector: "#submit-button",
});

// Close the tab with "github.com" in its URL
await browser.call("puppeteer_close_tab", { tabUrl: "github.com" });
```

For more detailed implementation information, see the
[tab-implementation.md](./implementation-docs/tab-implementation.md) document.

## Available Resources

| Resource URI          | Description                          |
| --------------------- | ------------------------------------ |
| `console://logs`      | Browser console logs                 |
| `screenshot://{name}` | Screenshots taken during the session |

## License

MIT
