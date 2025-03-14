# Draw Agent Refactoring Plan

## Problem Statement
The current implementation of the draw agent has misleading tool names and unnecessarily complex output:

1. The `drawChart` tool doesn't actually draw anything - it only generates Mermaid code
2. The output of `drawChart` is more complex than needed, containing additional text
3. The naming convention is confusing for AI models using these tools

## Proposed Changes

### 1. Rename `drawChart` to `defineChart`
This more accurately describes what the tool actually does - it defines the chart structure in Mermaid syntax rather than drawing it.

Files to modify:
- `packages/draw-agent/src/index.ts`
  - Rename the constant from `DRAW_TOOL` to `DEFINE_CHART_TOOL`
  - Update the tool name from `drawChart` to `defineChart` in the tool definition
  - Update the tool description to better reflect its purpose
  - Update all references to the tool name in the `handleToolCall` function

### 2. Simplify the output of `defineChart`
Change the output to be purely the Mermaid markdown code block without additional explanatory text.

Current output:
```
```mermaid
[mermaid code]
```

Generated [chartType] chart from provided data.
```

New output:
```
```mermaid
[mermaid code]
```
```

Files to modify:
- `packages/draw-agent/src/index.ts`
  - Modify the `responseText` construction in the `handleToolCall` function to only include the code block

### 3. Rename `renderChart` to `drawChart`
Since this tool actually produces a visual representation, rename it to `drawChart`.

Files to modify:
- `packages/draw-agent/src/index.ts`
  - Rename the constant from `RENDER_TOOL` to `DRAW_CHART_TOOL`
  - Update the tool name from `renderChart` to `drawChart` in the tool definition
  - Update all references to the tool name in the `handleToolCall` function
  - Update log messages that reference "renderChart"

## Implementation Details

### Tool Name References to Update
- Tool constants (`DRAW_TOOL`, `RENDER_TOOL`)
- Tool registrations in the server capabilities
- References in the `handleToolCall` function
- Log messages that reference the tool names

### Output Simplification
In the `handleToolCall` function, when handling the `defineChart` tool (formerly `drawChart`), modify:

```typescript
// Current:
const responseText = `\`\`\`mermaid\n${markdown}\n\`\`\`\n\nGenerated ${chartType} chart from provided data.`;

// New:
const responseText = `\`\`\`mermaid\n${markdown}\n\`\`\``;
```

## Testing Plan
1. After implementation, test both tools to ensure they function correctly
2. Verify that the renamed `defineChart` tool correctly outputs just the mermaid code block
3. Verify that the renamed `drawChart` tool (formerly `renderChart`) still renders images correctly
4. Ensure backward compatibility is maintained if needed, or document breaking changes

## Documentation Updates
Update any documentation that references these tools to reflect the new names and functionality. 