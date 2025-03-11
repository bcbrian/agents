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

## Usage

### As a Command Line Tool

Run the MCP server:

```bash
hello-agent
```

This will start the MCP server. The server communicates using the MCP protocol via standard input/output.

### In an MCP Client

When prompted with a "hello world" query, the agent will respond with a markdown-formatted "# hello world" heading.

## Development

This agent was built as a template using the browser-driver agent as a reference. It implements the basic structure required for an MCP-compliant agent while keeping the functionality minimal.

For more complex examples, refer to the browser-driver package which provides browser automation functionality.

## License

MIT 