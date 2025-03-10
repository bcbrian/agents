# @brianbuildz/agents

A collection of agent tools and utilities for building autonomous agents that
can interact with various systems.

## Overview

This monorepo contains various packages that enable agents to interact with
different systems, such as web browsers, APIs, and more. Each package is
designed to be modular and can be used independently.

## Packages

- `@brianbuildz/browser-driver`: A browser automation tool based on Puppeteer
  that follows the Model Context Protocol (MCP)

## Installation

You can install any of the packages using npm:

```bash
npm install @brianbuildz/browser-driver
```

Or run directly with npx:

```bash
npx @brianbuildz/browser-driver
```

## Local Development

To develop locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/brianbuildz/agents.git
   cd agents
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build all packages:
   ```bash
   npm run build
   ```

## Credits

This project draws inspiration from and builds upon the
[Model Context Protocol (MCP) Servers](https://github.com/modelcontextprotocol/servers),
particularly their Puppeteer implementation.

## License

MIT
