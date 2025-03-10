#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolResult,
  TextContent,
  Tool,
  LATEST_PROTOCOL_VERSION,
} from "@modelcontextprotocol/sdk/types.js";
import puppeteer, { Browser, Page } from "puppeteer";

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
    error: error?.toString() || "",
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

// Define the tools once to avoid repetition
const TOOLS: Tool[] = [
  {
    name: "puppeteer_navigate",
    description: "Navigate to a URL",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        tabIndex: {
          type: "number",
          description: "Select tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Select first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Select first tab with title containing this string",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "puppeteer_discover",
    description:
      "Discover actionable elements on the page like buttons, links, and form inputs",
    inputSchema: {
      type: "object",
      properties: {
        elementType: {
          type: "string",
          description:
            "Type of elements to discover (all, buttons, links, inputs, forms, options)",
        },
        tabIndex: {
          type: "number",
          description: "Select tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Select first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Select first tab with title containing this string",
        },
      },
      required: ["elementType"],
    },
  },
  {
    name: "puppeteer_click",
    description: "Click an element on the page",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for element to click",
        },
        tabIndex: {
          type: "number",
          description: "Select tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Select first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Select first tab with title containing this string",
        },
      },
      required: ["selector"],
    },
  },
  {
    name: "puppeteer_fill",
    description: "Fill out an input field",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for input field",
        },
        value: { type: "string", description: "Value to fill" },
        tabIndex: {
          type: "number",
          description: "Select tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Select first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Select first tab with title containing this string",
        },
      },
      required: ["selector", "value"],
    },
  },
  {
    name: "puppeteer_select",
    description: "Select an element on the page with Select tag",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for element to select",
        },
        value: { type: "string", description: "Value to select" },
        tabIndex: {
          type: "number",
          description: "Select tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Select first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Select first tab with title containing this string",
        },
      },
      required: ["selector", "value"],
    },
  },
  {
    name: "puppeteer_hover",
    description: "Hover an element on the page",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for element to hover",
        },
        tabIndex: {
          type: "number",
          description: "Select tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Select first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Select first tab with title containing this string",
        },
      },
      required: ["selector"],
    },
  },
  {
    name: "puppeteer_evaluate",
    description: "Execute JavaScript in the browser console",
    inputSchema: {
      type: "object",
      properties: {
        script: { type: "string", description: "JavaScript code to execute" },
        tabIndex: {
          type: "number",
          description: "Select tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Select first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Select first tab with title containing this string",
        },
      },
      required: ["script"],
    },
  },
  {
    name: "puppeteer_list_tabs",
    description: "List all open tabs in the browser",
    inputSchema: {
      type: "object",
      properties: {
        tabIndex: {
          type: "number",
          description: "Select tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Select first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Select first tab with title containing this string",
        },
      },
      required: [],
    },
  },
  {
    name: "puppeteer_new_tab",
    description: "Open a new browser tab",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Optional URL to navigate to in the new tab",
        },
      },
      required: [],
    },
  },
  {
    name: "puppeteer_close_tab",
    description: "Close a browser tab",
    inputSchema: {
      type: "object",
      properties: {
        tabIndex: {
          type: "number",
          description: "Close tab by position (0-based index)",
        },
        tabUrl: {
          type: "string",
          description: "Close first tab with URL containing this string",
        },
        tabTitle: {
          type: "string",
          description: "Close first tab with title containing this string",
        },
      },
      required: [],
    },
  },
];

// Global state
let browser: Browser | null = null;
let currentPage: Page | null = null;
const consoleLogs: Array<{ timestamp: number; message: string }> = [];

// Tab tracking system
interface TabInfo {
  id: string; // Unique ID for the tab
  index: number; // Position in the tabs array
  url: string; // Current URL
  title: string; // Page title
  createdAt: number; // Timestamp when the tab was first detected
  isFocused: boolean; // Whether this is the currently active tab
}

let currentTabId: string | null = null;
const tabRegistry = new Map<string, TabInfo>();

/**
 * Updates the tab registry with information about all current browser tabs
 * @returns An array of TabInfo objects representing all open tabs
 */
async function updateTabRegistry(): Promise<TabInfo[]> {
  if (!browser) return [];

  try {
    const pages = await browser.pages();
    const existingIds = new Set<string>(tabRegistry.keys());
    const currentIds = new Set<string>();

    // Update existing tabs and add new ones
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];

      // Skip non-page targets like browser extensions
      if (!p.target().url()) {
        continue;
      }

      // Use the target's unique identifier
      const id = p.target().url();
      currentIds.add(id);

      try {
        const url = await p.url();
        const title = await p.title();

        if (tabRegistry.has(id)) {
          // Update existing tab
          const tabInfo = tabRegistry.get(id)!;
          tabInfo.index = i;
          tabInfo.url = url;
          tabInfo.title = title;
          tabInfo.isFocused = p === currentPage;
        } else {
          // Add new tab
          tabRegistry.set(id, {
            id,
            index: i,
            url,
            title,
            createdAt: Date.now(),
            isFocused: p === currentPage,
          });
        }
      } catch (error) {
        // Handle case where page might be closed during enumeration
        log(`Error processing tab: ${error}`);
        continue;
      }
    }

    // Remove tabs that no longer exist
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        tabRegistry.delete(id);
      }
    }

    // Update current tab ID
    if (currentPage && !currentPage.isClosed()) {
      currentTabId = currentPage.target().url();
    } else {
      // Reset current tab if the current page is closed
      currentTabId = null;
      currentPage = null;

      // Try to set the current page to the first available page
      if (pages.length > 0) {
        currentPage = pages[0];
        currentTabId = currentPage.target().url();
      }
    }

    return Array.from(tabRegistry.values());
  } catch (error) {
    log(`Error updating tab registry: ${error}`);
    return Array.from(tabRegistry.values());
  }
}

/**
 * Find a browser tab that matches the given selection criteria
 * @param pages Array of Puppeteer Page objects to search
 * @param tabSelector Criteria to select the tab (index, URL, or title)
 * @returns The matching page or null if no match is found
 */
async function findTabBySelector(
  pages: Page[],
  tabSelector?: {
    tabIndex?: number;
    tabUrl?: string;
    tabTitle?: string;
  }
): Promise<Page | null> {
  if (!tabSelector) {
    return null;
  }

  let foundPage = null;

  if (
    tabSelector.tabIndex !== undefined &&
    tabSelector.tabIndex >= 0 &&
    tabSelector.tabIndex < pages.length
  ) {
    // Select by index
    foundPage = pages[tabSelector.tabIndex];
    log(`Selecting tab by index: ${tabSelector.tabIndex}`);
  } else if (tabSelector.tabUrl) {
    // Find a page matching the URL pattern
    for (const p of pages) {
      try {
        const url = await p.url();
        if (url.includes(tabSelector.tabUrl)) {
          foundPage = p;
          log(`Found tab with URL containing: ${tabSelector.tabUrl}`);
          break;
        }
      } catch (error) {
        // Skip pages that might have closed or have errors
        continue;
      }
    }

    if (!foundPage) {
      log(`No tab found with URL containing: ${tabSelector.tabUrl}`);
    }
  } else if (tabSelector.tabTitle) {
    // Find a page matching the title
    for (const p of pages) {
      try {
        const title = await p.title();
        if (title.includes(tabSelector.tabTitle)) {
          foundPage = p;
          log(`Found tab with title containing: ${tabSelector.tabTitle}`);
          break;
        }
      } catch (error) {
        // Skip pages that might have closed or have errors
        continue;
      }
    }

    if (!foundPage) {
      log(`No tab found with title containing: ${tabSelector.tabTitle}`);
    }
  }

  if (foundPage) {
    try {
      // Make sure the page is still valid before returning
      await foundPage.title(); // This will throw if the page is closed
      return foundPage;
    } catch (error) {
      log(`Selected tab is no longer valid: ${error}`);
      return null;
    }
  }

  return null;
}

async function ensureBrowser(tabSelector?: {
  tabIndex?: number;
  tabUrl?: string;
  tabTitle?: string;
}) {
  if (!browser) {
    log("Launching browser...");
    browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: null, // This will make the viewport match the window size and be resizable
    });

    const pages = await browser.pages();
    currentPage = pages[0];

    // Set initial window size
    const session = await currentPage.target().createCDPSession();
    await session.send("Browser.setWindowBounds", {
      windowId: 1,
      bounds: {
        width: 1920,
        height: 1080,
      },
    });

    currentPage.on("console", (msg) => {
      const text = msg.text();
      log(`[Browser Console] ${text}`);
      consoleLogs.push({
        timestamp: Date.now(),
        message: text,
      });
      safeNotification(server, {
        method: "notifications/resources/updated",
        params: { uri: "console://logs" },
      });
    });

    // Initialize tab registry
    await updateTabRegistry();
  }

  // Get all pages
  const pages = await browser.pages();

  // Select the appropriate page based on selector
  if (tabSelector) {
    const foundPage = await findTabBySelector(pages, tabSelector);

    if (foundPage) {
      currentPage = foundPage;
    }
  }

  // Default to the first page if no matching page was found or no selector was provided
  if (!currentPage && pages.length > 0) {
    currentPage = pages[0];
  } else if (!currentPage) {
    // If there are no pages at all, create one
    currentPage = await browser.newPage();
  }

  // Focus on the selected tab
  try {
    await currentPage.bringToFront();
  } catch (error) {
    log(`Error bringing page to front: ${error}`);
    // Try to recover by creating a new page if the current one is invalid
    if (browser && (!currentPage || currentPage.isClosed())) {
      currentPage = await browser.newPage();
      await currentPage.bringToFront();
    }
  }

  // Update tab registry
  await updateTabRegistry();

  return currentPage;
}

declare global {
  interface Window {
    mcpHelper: {
      logs: Array<{ method: string; timestamp: number; message: string }>;
      originalConsole: Partial<typeof console>;
    };
  }
}

async function handleToolCall(
  name: string,
  args: any
): Promise<CallToolResult> {
  try {
    // Extract tab selection parameters from args
    const tabSelector = {
      tabIndex: args.tabIndex,
      tabUrl: args.tabUrl,
      tabTitle: args.tabTitle,
    };

    // Clean up args by removing tab selection parameters
    const toolArgs = { ...args };
    delete toolArgs.tabIndex;
    delete toolArgs.tabUrl;
    delete toolArgs.tabTitle;

    // Get the page with the appropriate tab
    await ensureBrowser(tabSelector);

    // Verify that we have a valid page
    if (!currentPage) {
      throw new Error("Browser page not created");
    }

    // Log received arguments for debugging
    log("Handling tool call", { name, toolArgs });

    // Ensure arguments are properly formatted
    const cleanArgs = toolArgs && typeof toolArgs === "object" ? toolArgs : {};

    switch (name) {
      case "puppeteer_navigate":
        const { url } = cleanArgs;
        if (!url) {
          return {
            content: [
              { type: "text", text: "Error: URL parameter is required" },
            ],
            isError: true,
          };
        }
        await currentPage.goto(url, { waitUntil: "domcontentloaded" });

        // Update tab registry after navigation
        await updateTabRegistry();

        return {
          content: [
            {
              type: "text",
              text: `Navigated to ${url}`,
            },
          ],
          isError: false,
        };

      case "puppeteer_discover": {
        const elementType = cleanArgs.elementType || "all";

        let selectors = [];
        if (elementType === "all" || elementType === "buttons") {
          selectors.push(
            "button",
            '[role="button"]',
            'input[type="button"]',
            'input[type="submit"]'
          );
        }
        if (elementType === "all" || elementType === "links") {
          selectors.push("a");
        }
        if (elementType === "all" || elementType === "inputs") {
          selectors.push(
            'input:not([type="button"]):not([type="submit"])',
            "textarea",
            "select"
          );
        }
        if (elementType === "all" || elementType === "forms") {
          selectors.push("form");
        }
        if (elementType === "all" || elementType === "options") {
          selectors.push("option", '[role="option"]');
        }

        const selector = selectors.join(", ");

        const elements = await currentPage.evaluate((selector: string) => {
          const elements = Array.from(document.querySelectorAll(selector));
          return elements.map((el) => {
            const tagName = el.tagName.toLowerCase();

            let elementInfo = {
              tagName,
              id: el.id || null,
              type: el.getAttribute("type") || null,
              text: el.textContent?.trim() || null,
              value: (el as HTMLInputElement).value || null,
              placeholder: el.getAttribute("placeholder") || null,
              href: (el as HTMLAnchorElement).href || null,
              name: el.getAttribute("name") || null,
              ariaLabel: el.getAttribute("aria-label") || null,
              role: el.getAttribute("role") || null,
            };

            // Clean up the object by removing null properties
            Object.keys(elementInfo).forEach(
              (key) =>
                (elementInfo as any)[key] === null &&
                delete (elementInfo as any)[key]
            );

            return elementInfo;
          });
        }, selector);

        return {
          content: [
            {
              type: "text",
              text: `Discovered ${elements.length} ${elementType} elements:\n${JSON.stringify(elements, null, 2)}`,
            },
          ],
          isError: false,
        };
      }

      case "puppeteer_click":
        try {
          await currentPage.click(cleanArgs.selector);
          return {
            content: [
              {
                type: "text",
                text: `Clicked: ${cleanArgs.selector}`,
              },
            ],
            isError: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to click ${cleanArgs.selector}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }

      case "puppeteer_fill":
        try {
          await currentPage.waitForSelector(cleanArgs.selector);
          await currentPage.type(cleanArgs.selector, cleanArgs.value);
          return {
            content: [
              {
                type: "text",
                text: `Filled ${cleanArgs.selector} with: ${cleanArgs.value}`,
              },
            ],
            isError: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to fill ${cleanArgs.selector}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }

      case "puppeteer_select":
        try {
          await currentPage.waitForSelector(cleanArgs.selector);
          await currentPage.select(cleanArgs.selector, cleanArgs.value);
          return {
            content: [
              {
                type: "text",
                text: `Selected ${cleanArgs.selector} with: ${cleanArgs.value}`,
              },
            ],
            isError: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to select ${cleanArgs.selector}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }

      case "puppeteer_hover":
        try {
          await currentPage.waitForSelector(cleanArgs.selector);
          await currentPage.hover(cleanArgs.selector);
          return {
            content: [
              {
                type: "text",
                text: `Hovered ${cleanArgs.selector}`,
              },
            ],
            isError: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to hover ${cleanArgs.selector}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }

      case "puppeteer_evaluate":
        try {
          await currentPage.evaluate(() => {
            window.mcpHelper = {
              logs: [] as Array<{
                method: string;
                timestamp: number;
                message: string;
              }>,
              originalConsole: { ...console },
            };

            ["log", "info", "warn", "error"].forEach((method) => {
              (console as any)[method] = (...args: any[]) => {
                // Store structured log objects with method and timestamp
                window.mcpHelper.logs.push({
                  method,
                  timestamp: Date.now(),
                  message: args.join(" "),
                });
                (window.mcpHelper.originalConsole as any)[method](...args);
              };
            });
          });

          const result = await currentPage.evaluate(cleanArgs.script);

          const logs = await currentPage.evaluate(() => {
            Object.assign(console, window.mcpHelper.originalConsole);
            const logs = window.mcpHelper.logs;
            delete (window as any).mcpHelper;
            return logs;
          });

          // Format the response with JSON structure
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    result: result,
                    logs: logs,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Script execution failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }

      case "puppeteer_list_tabs":
        await ensureBrowser(tabSelector);
        const tabs = await updateTabRegistry();
        return {
          content: [
            {
              type: "text",
              text: `Open Tabs (${tabs.length}):\n${tabs
                .map(
                  (tab, index) =>
                    `Tab ${index}${tab.id === currentTabId ? " (current)" : ""}\n  URL: ${tab.url}\n  Title: ${tab.title}`
                )
                .join("\n")}`,
            },
          ],
          isError: false,
        };

      case "puppeteer_new_tab":
        // Make sure browser is initialized
        await ensureBrowser();

        // Ensure browser is not null before creating a new page
        if (!browser) {
          throw new Error("Browser failed to initialize");
        }

        const newPage = await browser.newPage();

        if (cleanArgs.url) {
          await newPage.goto(cleanArgs.url, { waitUntil: "domcontentloaded" });
        }

        // Update the current page to the new tab
        currentPage = newPage;
        currentTabId = newPage.target().url();
        await newPage.bringToFront();

        // Update the tab registry
        await updateTabRegistry();

        return {
          content: [
            {
              type: "text",
              text: `Opened new tab${cleanArgs.url ? ` and navigated to ${cleanArgs.url}` : ""}`,
            },
          ],
          isError: false,
        };

      case "puppeteer_close_tab":
        await ensureBrowser(tabSelector);

        // Get the updated tabs
        const tabsToClose = await updateTabRegistry();
        if (tabsToClose.length <= 1) {
          return {
            content: [
              {
                type: "text",
                text: "Cannot close the last remaining tab. Use puppeteer_navigate instead to change the URL.",
              },
            ],
            isError: true,
          };
        }

        // Ensure browser is not null
        if (!browser) {
          throw new Error("Browser failed to initialize");
        }

        // Find the tab to close using the tab selector
        let tabToClose: Page | null = currentPage;
        let targetTabId = currentTabId;
        let closedTabIndex = -1;

        // If a specific tab selector was provided, try to find that tab
        if (
          tabSelector &&
          (tabSelector.tabIndex !== undefined ||
            tabSelector.tabUrl ||
            tabSelector.tabTitle)
        ) {
          const allPages = await browser.pages();
          const selectedTab = await findTabBySelector(allPages, tabSelector);

          if (selectedTab) {
            tabToClose = selectedTab;
            targetTabId = selectedTab.target().url();
          }
        }

        // Find the index of the tab to close for reporting
        closedTabIndex = tabsToClose.findIndex((tab) => tab.id === targetTabId);

        // Verify we have a valid tab to close
        if (!tabToClose || tabToClose.isClosed()) {
          return {
            content: [
              {
                type: "text",
                text: "Could not find the specified tab to close or the tab is already closed.",
              },
            ],
            isError: true,
          };
        }

        try {
          // Close the tab
          await tabToClose.close();

          // Switch to another tab (preferably the one before or after the closed tab)
          if (browser) {
            const remainingPages = await browser.pages();
            if (remainingPages.length > 0) {
              // Choose a new active tab (try to take the tab before the closed one, or the first available)
              const newTabIndex = Math.min(
                closedTabIndex,
                remainingPages.length - 1
              );
              currentPage = remainingPages[newTabIndex >= 0 ? newTabIndex : 0];
              currentTabId = currentPage.target().url();
              await currentPage.bringToFront();
            }
          }

          // Update the registry after closing
          await updateTabRegistry();

          return {
            content: [
              {
                type: "text",
                text:
                  closedTabIndex >= 0
                    ? `Closed tab ${closedTabIndex}`
                    : "Closed the specified tab",
              },
            ],
            isError: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to close tab: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    logError("Error in handleToolCall:", error);
    return {
      content: [
        {
          type: "text",
          text: `Browser operation failed: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

const server = new Server(
  {
    name: "browser-driver",
    version: "0.1.3",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Setup request handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "console://logs",
      mimeType: "application/json",
      name: "Browser console logs",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();

  if (uri === "console://logs") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ logs: consoleLogs }),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Log the incoming request for debugging
  log("Received tool call request", {
    name: request.params.name,
    args: request.params.arguments,
  });

  return handleToolCall(request.params.name, request.params.arguments ?? {});
});

async function runServer() {
  // Log startup to stderr instead of stdout to avoid interfering with JSON-RPC
  process.stderr.write(
    JSON.stringify({
      type: "startup",
      timestamp: Date.now(),
      message: "Starting Browser Driver MCP server...",
    }) + "\n"
  );

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log connected to stderr
    process.stderr.write(
      JSON.stringify({
        type: "startup",
        timestamp: Date.now(),
        message: "Browser Driver MCP server connected",
      }) + "\n"
    );
  } catch (error: any) {
    process.stderr.write(
      JSON.stringify({
        type: "startup_error",
        timestamp: Date.now(),
        message: `Failed to start server: ${error.message}`,
        error: error.stack,
      }) + "\n"
    );
    process.exit(1);
  }
}

runServer().catch((error) => logError("Error starting server:", error));

process.stdin.on("close", () => {
  logError("Browser Driver MCP Server closed");
  if (browser) {
    browser.close().catch((error) => logError("Error closing browser:", error));
  }
  server.close();
});
