# Hello Agent MCP Server

A simple "Hello World" agent that follows the Model Context Protocol (MCP). This agent is designed to be a minimal template for building more complex agents.

## Overview

This package provides a basic MCP server that responds with a "# hello world" markdown heading when triggered. It serves as a starting point for understanding how to build agents with the MCP protocol.

## Key Features

- **Minimal Implementation**: Simple example showing the basic structure of an MCP agent
- **Markdown Response**: Returns a markdown-formatted greeting

## Installation

```bash
npm install -g @brianbuildz/hello-agent
```

Alternatively, you can run the agent directly with npx:

```bash
npx -y @brianbuildz/hello-agent
```

## Usage

### As a Command Line Tool

Run the MCP server:

```bash
hello-agent
```

This will start the MCP server. The server communicates using the MCP protocol via standard input/output.

### Integration with Cursor

To use the hello-agent with Cursor:

1. In Cursor, click the settings icon ⚙️ and navigate to the "MCP Servers" section.

2. Click "+" to add a new agent.

3. Set the following:
   - **Name**: Hello Agent
   - **Type**: command
   - **Command**: `npx -y @brianbuildz/hello-agent`

4. Click "Save" to register the agent.

5. You can now use the Hello Agent by sending commands to it in Cursor. For example:
   ```
   @Hello Agent say hello
   ```

6. The agent will respond with a markdown-formatted "# hello world" heading.

### In an MCP Client

When prompted with a "hello world" query, the agent will respond with a markdown-formatted "# hello world" heading.

## Development

This agent was built as a template using the browser-driver agent as a reference. It implements the basic structure required for an MCP-compliant agent while keeping the functionality minimal.

For more complex examples, refer to the browser-driver package which provides browser automation functionality.

## License

MIT 