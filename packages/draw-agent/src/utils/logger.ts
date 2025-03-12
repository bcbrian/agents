/**
 * Safe logging utilities for MCP protocol
 * 
 * These logging functions ensure all output is valid JSON,
 * which is required for the MCP protocol to function correctly.
 * Direct console.log calls break the protocol.
 */

/**
 * Safely logs a message to stderr as JSON
 * @param message The message to log
 * @param data Optional data to include with the log
 */
export function log(message: string, data?: any) {
  const logObj = {
    type: "log",
    timestamp: Date.now(),
    message,
    data,
  };
  // Use process.stderr instead of console.log to avoid interfering with JSON-RPC communication
  process.stderr.write(JSON.stringify(logObj) + "\n");
}

/**
 * Safely logs an error message to stderr as JSON
 * @param message The error message
 * @param error Optional error object or details
 */
export function logError(message: string, error?: any) {
  const logObj = {
    type: "error",
    timestamp: Date.now(),
    message,
    data: error?.toString(),
  };
  // Use process.stderr instead of console.error
  process.stderr.write(JSON.stringify(logObj) + "\n");
} 