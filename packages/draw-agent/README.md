# Draw Agent MCP Server

An agent that creates graphs, charts, flow charts, and diagrams following the Model Context Protocol (MCP). This agent is designed to help visualize data and concepts through appropriate charts and diagrams.

## Overview

This package provides an MCP server that can analyze data, determine the most appropriate visualization type, and generate visual representations including charts, graphs, flow charts, and diagrams.

## Key Features

- **Data Visualization**: Create various charts and graphs based on provided data
- **Flow Charts & Diagrams**: Generate visual representations of processes and relationships
- **Intelligent Format Selection**: Automatically determine the most appropriate visualization type
- **Markdown/Image Outputs**: Returns visualizations in suitable formats

## Logging in MCP Servers

This agent follows the MCP protocol requirements for logging. Instead of using direct `console.log` 
or `console.error` calls (which would break the JSON-based protocol), it uses safe logging utilities
from `utils/logger.js`.

When developing MCP servers:

1. **Never use direct console.log/console.error** - These break the JSON protocol
2. **Always use the safe logging utilities**:
   ```typescript
   import { log, logError } from './utils/logger.js';
   
   // Instead of console.log
   log('Your message here', optionalData);
   
   // Instead of console.error
   logError('Error message', errorObject);
   ```
3. These utilities ensure all output is valid JSON sent to stderr, maintaining protocol integrity

## Installation

```bash
npm install -g @brianbuildz/draw-agent
```

Alternatively, you can run the agent directly with npx:

```bash
npx -y @brianbuildz/draw-agent
```

## Usage

### As a Command Line Tool

Run the MCP server:

```bash
draw-agent
```

This will start the MCP server. The server communicates using the MCP protocol via standard input/output.

### Integration with Cursor

To use the draw-agent with Cursor:

1. In Cursor, click the settings icon ⚙️ and navigate to the "MCP Servers" section.

2. Click "+" to add a new agent.

3. Set the following:
   - **Name**: Draw Agent
   - **Type**: command
   - **Command**: `npx -y @brianbuildz/draw-agent`

4. Click "Save" to register the agent.

![Draw Agent Setup in Cursor](https://github.com/brianbuildz/agents/blob/main/packages/draw-agent/assets/cursor-setup.png?raw=true)

5. You can now use the Draw Agent by sending commands to it in Cursor. For example:
   ```
   @Draw Agent Please create a pie chart showing market share for products A (35%), B (45%), and C (20%)
   ```

6. The agent will respond with a Mermaid diagram that you can view directly in Cursor, and also provides ways to render it as an actual image.

### Verification

To verify the agent is working correctly, run:

```bash
node verify-cursor.js
```

This will start the agent and test it with different chart types.

### In an MCP Client

When provided with data or descriptions, the agent will analyze the input and generate appropriate visualizations.

## Data Formats

The draw-agent accepts the following data formats:

### Pie Charts
```json
{
  "labels": ["Item 1", "Item 2", "Item 3"],
  "values": [30, 40, 30]
}
```

### Flowcharts
```json
{
  "nodes": [
    { "id": "A", "label": "Start" },
    { "id": "B", "label": "Process", "shape": "rectangle" }
  ],
  "edges": [
    { "from": "A", "to": "B", "label": "Begin" }
  ]
}
```

## Available Tools

The Draw Agent provides two main tools:

1. **defineChart** - Creates Mermaid syntax for charts and diagrams without rendering them
2. **drawChart** - Renders Mermaid diagrams as visual images

These tools work together to create and visualize various types of charts and diagrams.

## Development

This agent was built using the hello-agent template as a starting point. It implements the MCP protocol and provides visualization capabilities using Mermaid.js.

## License

MIT 