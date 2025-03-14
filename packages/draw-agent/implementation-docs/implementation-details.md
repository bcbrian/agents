# Draw Agent Implementation Details

This document provides specific code changes required to implement the refactoring plan.

## Code Changes in `packages/draw-agent/src/index.ts`

### 1. Rename Tool Constants

```typescript
// FROM
export const DRAW_TOOL: Tool = {
  name: "drawChart",
  // ...
};

export const RENDER_TOOL: Tool = {
  name: "renderChart",
  // ...
};

// TO
export const DEFINE_CHART_TOOL: Tool = {
  name: "defineChart",
  // ...
};

export const DRAW_CHART_TOOL: Tool = {
  name: "drawChart",
  // ...
};
```

### 2. Update Tool Descriptions

```typescript
// FROM
export const DRAW_TOOL: Tool = {
  name: "drawChart",
  description: "Creates visualizations including charts, graphs, diagrams, and flow charts",
  // ...
};

// TO
export const DEFINE_CHART_TOOL: Tool = {
  name: "defineChart",
  description: "Defines chart or diagram structure in Mermaid syntax without rendering it visually",
  // ...
};
```

### 3. Update Server Capabilities Registration

```typescript
// FROM
const server = new Server(
  { 
    name: "draw-agent",
    version: "0.1.0"
  },
  {
    capabilities: {
      resources: {},
      tools: {
        drawChart: DRAW_TOOL,
        renderChart: RENDER_TOOL,
      },
    },
  }
);

// TO
const server = new Server(
  { 
    name: "draw-agent",
    version: "0.1.0"
  },
  {
    capabilities: {
      resources: {},
      tools: {
        defineChart: DEFINE_CHART_TOOL,
        drawChart: DRAW_CHART_TOOL,
      },
    },
  }
);
```

### 4. Update Tool Handlers in `handleToolCall` Function

```typescript
// FROM
export async function handleToolCall(
  toolName: string,
  params: Record<string, any>
): Promise<CallToolResult> {
  try {
    if (toolName === 'drawChart') {
      try {
        // ...
        const responseText = `\`\`\`mermaid\n${markdown}\n\`\`\`\n\nGenerated ${chartType} chart from provided data.`;
        // ...
      } catch (error) {
        // ...
      }
    } else if (toolName === 'renderChart') {
      try {
        // ...
      } catch (error) {
        // ...
      }
    } else {
      throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    // ...
  }
}

// TO
export async function handleToolCall(
  toolName: string,
  params: Record<string, any>
): Promise<CallToolResult> {
  try {
    if (toolName === 'defineChart') {
      try {
        // ...
        const responseText = `\`\`\`mermaid\n${markdown}\n\`\`\``;
        // ...
      } catch (error) {
        // ...
      }
    } else if (toolName === 'drawChart') {
      try {
        // ...
      } catch (error) {
        // ...
      }
    } else {
      throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    // ...
  }
}
```

### 5. Update Log Messages

```typescript
// FROM
log(`drawChart request received: ${dataString}, chartType: ${explicitChartType}, title: ${title}`);

// TO
log(`defineChart request received: ${dataString}, chartType: ${explicitChartType}, title: ${title}`);
```

```typescript
// FROM
log(`renderChart request received with ${mermaidCode.length} characters of Mermaid code`);
log('renderChart result:', result);

// TO
log(`drawChart request received with ${mermaidCode.length} characters of Mermaid code`);
log('drawChart result:', result);
```

### 6. Update Tool List Handler

```typescript
// FROM
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [DRAW_TOOL, RENDER_TOOL],
}));

// TO
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [DEFINE_CHART_TOOL, DRAW_CHART_TOOL],
}));
```

## Complete Code Changes Overview

1. Tool constants renamed:
   - `DRAW_TOOL` → `DEFINE_CHART_TOOL` 
   - `RENDER_TOOL` → `DRAW_CHART_TOOL`

2. Tool names renamed:
   - `drawChart` → `defineChart`
   - `renderChart` → `drawChart`

3. Tool descriptions updated to better reflect functionality

4. Tool handler function updated to:
   - Handle the new tool names 
   - Simplify the output of `defineChart` to just the mermaid code block

5. All log messages updated to reference the new tool names

6. Server capabilities configuration updated to register the tools with their new names

## Backward Compatibility Considerations

This is a breaking change to the API. If other parts of the system depend on the current names, we might need to:

1. Create an implementation strategy that maintains backward compatibility
2. Document the changes for downstream consumers
3. Consider adding deprecation warnings for a transition period

## Testing Requirements

After implementing these changes, ensure:

1. `defineChart` tool works correctly and outputs just the markdown code block
2. `drawChart` (formerly `renderChart`) continues to render images correctly
3. No regressions in functionality occur

## Documentation Updates

Any existing documentation that references these tools should be updated to reflect the new names and functionality. 