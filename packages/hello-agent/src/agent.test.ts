import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout as sleep } from 'timers/promises';

// Construct __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Hello Agent Integration Test', () => {
  let agentProcess: ChildProcess;
  let messageId = 1;

  // Helper to send JSON-RPC requests to the agent
  async function sendRequest(method: string, params: any = {}) {
    const request = {
      jsonrpc: '2.0',
      id: messageId++,
      method,
      params
    };
    
    return new Promise<any>((resolve, reject) => {
      if (!agentProcess.stdout) {
        return reject(new Error('Agent process stdout is not available'));
      }
      
      const rl = createInterface({ input: agentProcess.stdout });
      
      const listener = (line: string) => {
        try {
          const response = JSON.parse(line);
          if (response.id === request.id) {
            rl.removeListener('line', listener);
            rl.close();
            resolve(response);
          }
        } catch (error) {
          // Ignore non-JSON lines (like logs)
        }
      };
      
      rl.on('line', listener);
      
      // Set a timeout in case we don't get a response
      const timeout = setTimeout(() => {
        rl.removeListener('line', listener);
        rl.close();
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, 5000);
      
      if (!agentProcess.stdin) {
        clearTimeout(timeout);
        return reject(new Error('Agent process stdin is not available'));
      }
      
      agentProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  beforeAll(async () => {
    // Start the agent as a child process
    const agentEntrypoint = path.resolve(__dirname, '../dist/index.js');
    agentProcess = spawn('node', [agentEntrypoint], {
      stdio: ['pipe', 'pipe', 'inherit']
    });
    
    // Wait for the agent to start
    await sleep(1000); // Give the agent some time to start
  });

  afterAll(() => {
    // Clean up the agent process
    if (agentProcess && !agentProcess.killed) {
      agentProcess.kill();
    }
  });

  it('should be able to list available tools', async () => {
    const response = await sendRequest('tools/list');
    
    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeInstanceOf(Array);
    expect(response.result.tools.length).toBe(1);
    
    const tool = response.result.tools[0];
    expect(tool.name).toBe('sayHello');
    expect(tool.description).toContain('hello world');
  });

  it('should be able to call the sayHello tool', async () => {
    const response = await sendRequest('tools/call', {
      name: 'sayHello',
      arguments: {}
    });
    
    expect(response.result).toBeDefined();
    expect(response.result.result).toBeDefined();
    expect(response.result.result.markdown).toBe('# hello world');
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].type).toBe('text');
    expect(response.result.content[0].text).toBe('# hello world');
  });
}); 