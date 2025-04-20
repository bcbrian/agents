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

## Create New Agent

To create a new agent in this repository:

1. Duplicate the hello-agent template:

   ```bash
   cp -r packages/hello-agent packages/your-agent-name
   cd packages/your-agent-name
   ```

2. Update package information:

   - Rename the package in `package.json` following the naming convention:
     `@brianbuildz/[purpose]-agent` (e.g., `@brianbuildz/translation-agent`)
   - Update the description, bin name, and other relevant fields
   - Reset the version to "0.1.0"

3. Modify the agent implementation in `src/index.ts` to provide your custom
   functionality

4. Build your agent in the agent's directory:

   ```bash
   # Make sure you're in your agent's directory
   cd packages/your-agent-name
   npm run build
   ```

5. Configure in Cursor AI to use your local agent:

   - In Cursor, go to settings (⚙️) → "MCP Servers"
   - Click "+" to add a new agent
   - Set Name: Your Agent Name (Local)
   - Set Type: command
   - Set Command: `npx -y /absolute/path/to/agents/packages/your-agent-name`
     (Replace with the absolute path to your agent's directory where
     package.json is located)
   - Save and test with: `@Your Agent Name (Local) [command]`

6. Publish your agent to NPM when it's ready:

   ```bash
   cd packages/your-agent-name
   npm run publish:public
   ```

7. Configure in Cursor AI to use the deployed version:

   - In Cursor, go to settings (⚙️) → "MCP Servers"
   - Click "+" to add a new agent
   - Set Name: Your Agent Name (Prod)
   - Set Type: command
   - Set Command: `npx -y @brianbuildz/your-agent-name`
   - Save and test with: `@Your Agent Name (Prod) [command]`
   - You can disable the local version when using the deployed version, or keep
     both active to switch between them

8. Start with the functional hello-agent template as your base to ensure you
   have a working foundation before adding more complex functionality.

9. Begin your development process:
   - As you make changes to your agent, regularly build and test locally
   - Test against your local Cursor configuration (@Your Agent Name (Local))
   - When ready to publish updates, increment the version in package.json and
     publish again
   - Test your published updates using your production configuration

## Credits

This project draws inspiration from and builds upon the
[Model Context Protocol (MCP) Servers](https://github.com/modelcontextprotocol/servers),
particularly their Puppeteer implementation.

## License

MIT
