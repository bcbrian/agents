import { DEFINE_CHART_TOOL, DRAW_CHART_TOOL, handleToolCall } from './dist/index.js';

console.log('DEFINE_CHART_TOOL name:', DEFINE_CHART_TOOL.name);
console.log('DRAW_CHART_TOOL name:', DRAW_CHART_TOOL.name);

async function test() {
  console.log('\nTesting defineChart:');
  const result = await handleToolCall('defineChart', {
    data: JSON.stringify({
      labels: ['A', 'B'],
      values: [50, 50]
    }),
    title: 'Test Chart',
    chartType: 'pie'
  });
  console.log('Define Chart Result:');
  console.log(result.content[0].text);
  console.log('\nThis output should now be just the mermaid code without extra wrapping backticks.')
}

test().catch(console.error); 