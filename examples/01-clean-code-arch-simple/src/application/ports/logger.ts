/**
 * Logger port for application and adapter logging.
 *
 * This abstraction allows the application to log without depending on
 * specific logging implementations (console, Winston, Pino, etc.).
 */
export interface Logger {
  /**
   * Log an informational message.
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log an error message.
   */
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;

  /**
   * Log a warning message.
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a debug message.
   */
  debug(message: string, context?: Record<string, unknown>): void;
}
