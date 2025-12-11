import type { Logger } from "../../application/ports";

/**
 * Simple console-based logger implementation.
 *
 * In production, this could be replaced with a more sophisticated
 * logger like Winston, Pino, or a cloud-based logging service.
 */
export class ConsoleLogger implements Logger {
  info(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, context ? JSON.stringify(context) : "");
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] ERROR: ${message}`,
      error,
      context ? JSON.stringify(context) : "",
    );
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, context ? JSON.stringify(context) : "");
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] DEBUG: ${message}`, context ? JSON.stringify(context) : "");
  }
}
