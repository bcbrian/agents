# Multi-Tab Management Implementation Plan

This document outlines the implementation details for adding multi-tab
management capabilities to the Browser Driver MCP.

## Overview

The current implementation only works with a single tab (always the first tab in
the browser). The goal is to enable AI agents to handle scenarios where clicks
open new tabs and provide a way to effectively work with multiple browser
contexts.

## Core Implementation Details

### 1. Tab Selection Parameters

Add these optional parameters to ALL tool argument schemas for consistent tab
selection:

```typescript
// Tab selection parameters to add to all tool schemas
{
  "tabIndex": {
    "type": "number",
    "description": "Select tab by position (0-based index)"
  },
  "tabUrl": {
    "type": "string",
    "description": "Select first tab with URL containing this string"
  },
  "tabTitle": {
    "type": "string",
    "description": "Select first tab with title containing this string"
  }
}
```

### 2. Tab Registry System

Implement a tab tracking system:

```typescript
// Tab tracking
interface TabInfo {
  id: string; // Unique ID for the tab (using target().url() as a unique identifier)
  index: number; // Position in the tabs array
  url: string; // Current URL
  title: string; // Page title
  createdAt: number; // Timestamp when the tab was first detected
  isFocused: boolean; // Whether this is the currently active tab
}

let currentTabId: string | null = null;
const tabRegistry = new Map<string, TabInfo>();

// Update tab registry - implemented in updateTabRegistry() function
```

### 3. Dedicated Tab Selection Helper

The `findTabBySelector` helper function centralizes tab selection logic and
includes robust error handling:

```typescript
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
```

### 4. Enhanced Tab Management Tools

The implementation includes dedicated tools for tab management:

1. **puppeteer_list_tabs**: Lists all open tabs with their index, URL, and title
2. **puppeteer_new_tab**: Opens a new browser tab with optional navigation to a
   URL
3. **puppeteer_close_tab**: Closes the specified tab or the current tab if no
   selector is provided

All of these tools include robust error handling to deal with common edge cases
such as:

- Attempting to close the last remaining tab
- Tabs closing during operation
- Invalid tab selectors
- Browser or page objects becoming null

### 5. Robust Tab Registry Updates

The `updateTabRegistry` function includes comprehensive error handling and edge
case management:

```typescript
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
        continue;
      }
    }

    // Remove tabs that no longer exist
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        tabRegistry.delete(id);
      }
    }

    // Update current tab ID and handle cases where the current page is closed
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
```

## Implementation Status

All the core tab management features have been implemented, including:

- [x] Tab selection parameters for all tools
- [x] Tab registry tracking system
- [x] Tab selection helper function
- [x] puppeteer_list_tabs tool
- [x] puppeteer_new_tab tool
- [x] puppeteer_close_tab tool
- [x] Robust error handling and edge case management
- [x] README.md documentation updates

Future enhancements could include:

- [ ] Automatic detection of new tabs created by clicks
- [ ] More tab manipulation options (duplicate, reload, etc.)
- [ ] Tab grouping and organization
- [ ] Better handling of browser crashes or disconnects

## Implementation Phases

### Phase 1: Core Tab Infrastructure

- [ ] Add `updateTabRegistry` function for tab tracking
- [ ] Modify all tool schemas to include tab selection parameters
- [ ] Update `ensureBrowser` to handle tab selection

### Phase 2: Tool Modifications

- [ ] Update `handleToolCall` to extract tab parameters
- [ ] Implement `puppeteer_list_tabs` tool
- [ ] Add new tab detection to `puppeteer_click`
- [ ] Update all other tools to work with the selected page

### Phase 3: Testing & Refinement

- [ ] Test with websites that open new tabs
- [ ] Test tab switching with various patterns
- [ ] Fix edge cases (e.g., tabs that close themselves)
- [ ] Optimize tab detection timing

### Phase 4: Documentation & Examples

- [ ] Update tool documentation with tab selection parameters
- [ ] Create example flows for multi-tab scenarios

## Edge Cases to Handle

1. Multiple tabs opening simultaneously
2. Tabs that redirect immediately
3. Tab closing (manually or via script)
4. Handling very large numbers of tabs
5. Performance considerations with many tabs

## Notes on Potential Improvements

After the initial implementation, we could consider:

1. Adding a tab history feature to easily go back to previously used tabs
2. Tab grouping functionality for complex workflows
3. Automatic tab cleanup options
4. Tab-specific console log filtering
