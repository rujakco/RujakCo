// utils/logger.js — Structured Error Logging for RUJAK.Co
// Captures errors from various contexts and sends them to Supabase
// Designed to be non-blocking and resilient to logging failures.

import { getSupabase } from './helpers.js';

// ============================================================================
// Constants
// ============================================================================

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determines if the application is running in development mode.
 */
const isDevelopment = () => {
  try {
    // Check for typical development environment indicators
    return (
      process?.env?.NODE_ENV === 'development' ||
      window?.location?.hostname === 'localhost' ||
      window?.location?.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
};

/**
 * Safely extracts error details.
 */
function normalizeError(error) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack || null,
      name: error.name,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      stack: null,
      name: 'StringError',
    };
  }

  // If it's an object with a message property
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      stack: error.stack || null,
      name: error.name || 'ObjectError',
    };
  }

  return {
    message: String(error),
    stack: null,
    name: 'UnknownError',
  };
}

/**
 * Builds a consistent log payload.
 */
function buildLogPayload({ level, context, message, error = null, meta = {} }) {
  const normalized = normalizeError(error);

  // Ensure meta does not override critical fields
  const safeMeta = { ...meta };
  delete safeMeta.context;
  delete safeMeta.level;
  delete safeMeta.message;
  delete safeMeta.stack;

  const payload = {
    context,
    level,
    message: message || normalized.message,
    stack: normalized.stack,
    error_name: normalized.name,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    url: typeof window !== 'undefined' ? window.location.href : null,
    timestamp: new Date().toISOString(),
    ...safeMeta,
  };

  // For development, add extra debugging info if available
  if (isDevelopment()) {
    payload._dev = {
      timestamp_ms: Date.now(),
    };
  }

  return payload;
}

/**
 * Sends the log payload to Supabase (fire-and-forget).
 * Silently fails if Supabase is unavailable or the insert fails.
 */
function sendToSupabase(payload) {
  try {
    const sb = getSupabase();
    if (!sb) {
      // Silently skip if Supabase client is not initialized
      return;
    }

    // Fire-and-forget: we do NOT await this.
    // The `.then().catch()` ensures unhandled rejection warnings are suppressed.
    sb.from('error_logs')
      .insert(payload)
      .then(() => {
        // Optional: log successful send in verbose debug mode
        if (isDevelopment()) {
          console.debug('[Logger] Log sent to Supabase:', payload.context);
        }
      })
      .catch((err) => {
        // Logging failure should never break the main application.
        // Only log to console in development to aid debugging.
        if (isDevelopment()) {
          console.warn('[Logger] Failed to send log to Supabase:', err);
        }
      });
  } catch (_) {
    // Catch any synchronous errors from getSupabase or property access
    if (isDevelopment()) {
      console.warn('[Logger] Sync error while sending log to Supabase');
    }
  }
}

// ============================================================================
// Core Logger
// ============================================================================

/**
 * Internal core logging function.
 * @param {string} level - Log level (error, warn, info, debug).
 * @param {string} context - Application context (e.g., 'supabase', 'payment').
 * @param {string|Error} messageOrError - Error object or message string.
 * @param {object} [meta={}] - Additional metadata.
 */
function log(level, context, messageOrError, meta = {}) {
  // Determine the message and error object
  let message, errorObj;
  if (typeof messageOrError === 'string') {
    message = messageOrError;
    errorObj = null;
  } else {
    errorObj = messageOrError;
    message = errorObj instanceof Error ? errorObj.message : String(errorObj);
  }

  // Log to console with appropriate styling
  const consolePrefix = `[${context.toUpperCase()}]`;
  if (level === LOG_LEVELS.ERROR) {
    console.error(consolePrefix, message, errorObj || '');
  } else if (level === LOG_LEVELS.WARN) {
    console.warn(consolePrefix, message);
  } else if (level === LOG_LEVELS.INFO) {
    console.info(consolePrefix, message);
  } else {
    console.debug(consolePrefix, message);
  }

  // Build the structured payload
  const payload = buildLogPayload({
    level,
    context,
    message,
    error: errorObj,
    meta,
  });

  // Send to Supabase (non-blocking)
  sendToSupabase(payload);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Log an error.
 * @param {string} context - Application context (e.g., 'supabase', 'payment').
 * @param {Error|string} error - Error object or message string.
 * @param {object} [meta={}] - Additional metadata (userId, productId, etc.).
 */
export async function logError(context, error, meta = {}) {
  log(LOG_LEVELS.ERROR, context, error, meta);
}

/**
 * Log a warning (non-critical issue).
 * @param {string} context - Application context.
 * @param {string} message - Warning message.
 * @param {object} [meta={}] - Additional metadata.
 */
export async function logWarn(context, message, meta = {}) {
  log(LOG_LEVELS.WARN, context, message, meta);
}

/**
 * Log an informational event (e.g., user action, page transition).
 * @param {string} context - Application context.
 * @param {string} message - Info message.
 * @param {object} [meta={}] - Additional metadata.
 */
export async function logInfo(context, message, meta = {}) {
  log(LOG_LEVELS.INFO, context, message, meta);
}

/**
 * Log a debug message (only recommended for development/tracing).
 * @param {string} context - Application context.
 * @param {string} message - Debug message.
 * @param {object} [meta={}] - Additional metadata.
 */
export async function logDebug(context, message, meta = {}) {
  if (isDevelopment()) {
    log(LOG_LEVELS.DEBUG, context, message, meta);
  }
}

// ============================================================================
// Utility: Wrapper for Async Functions
// ============================================================================

/**
 * Wraps an async function with automatic error logging.
 * If the wrapped function throws, the error is logged and then re-thrown.
 *
 * @param {Function} fn - The async function to wrap.
 * @param {string} context - Logging context.
 * @param {object} [meta={}] - Default metadata to include with every error.
 * @returns {Function} Wrapped function with the same signature.
 *
 * @example
 * const fetchUser = withErrorLogging(async (id) => {
 *   const res = await fetch(`/api/user/${id}`);
 *   return res.json();
 * }, 'api', { endpoint: 'getUser' });
 */
export function withErrorLogging(fn, context, meta = {}) {
  if (typeof fn !== 'function') {
    throw new Error('withErrorLogging expects a function');
  }

  // Detect if it's an async function or returns a promise
  const isAsync = fn.constructor.name === 'AsyncFunction' || fn.toString().includes('async');

  if (isAsync) {
    // Async wrapper
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        await logError(context, error, { ...meta, args });
        throw error; // Re-throw so caller can handle it
      }
    };
  }

  // Sync wrapper (just in case)
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      // Log synchronously (fire-and-forget)
      logError(context, error, { ...meta, args }).catch(() => {});
      throw error;
    }
  };
}

// ============================================================================
// Utility: Graceful Shutdown / Flush (Optional)
// ============================================================================

/**
 * Since logs are fire-and-forget, there is no internal queue to flush.
 * This function is provided for API consistency and does nothing.
 * @returns {Promise<void>}
 */
export async function flushLogs() {
  // No-op: logs are already non-blocking.
  // If you implement a batching mechanism in the future, place it here.
  return Promise.resolve();
}