// utils/fetchWithRetry.js — Network resilience layer
// Provides fetch with automatic retries, timeout, and structured error logging.

import { logError, logWarn } from './logger.js';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 1;
const BASE_RETRY_DELAY = 800; // milliseconds
const MAX_RETRY_DELAY = 10000; // 10 seconds

// ============================================================================
// Helper: sleep
// ============================================================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// Helper: calculate retry delay with exponential backoff and jitter
// ============================================================================

function getRetryDelay(attempt) {
  // attempt is 0-based, so first retry is attempt 0
  const exponential = BASE_RETRY_DELAY * Math.pow(2, attempt);
  const capped = Math.min(exponential, MAX_RETRY_DELAY);
  // Add a small random jitter to avoid thundering herd
  return capped + Math.random() * 200;
}

// ============================================================================
// Core: fetchWithRetry
// ============================================================================

/**
 * Fetch a resource with automatic retries, timeout, and detailed logging.
 *
 * @param {string} url - The target URL.
 * @param {object} options - Standard fetch options (method, headers, body, etc.).
 * @param {object} config - Retry configuration.
 * @param {number} [config.retries=1] - Number of retry attempts (total attempts = retries + 1).
 * @param {number} [config.timeout=10000] - Timeout in milliseconds per request.
 * @param {string} [config.context='general'] - Logging context (e.g., 'api', 'auth').
 * @param {object} [config.meta={}] - Additional metadata to include in logs.
 * @returns {Promise<Response>} The fetch Response object.
 * @throws {Error} If all attempts fail, the last error is re-thrown.
 */
export async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    retries = DEFAULT_RETRIES,
    timeout = DEFAULT_TIMEOUT,
    context = 'general',
    meta = {},
  } = config;

  let lastError = null;
  let attempt = 0;

  // We'll create a fresh AbortController for each attempt.
  // The signal is passed via fetchOptions, which is recreated per attempt.
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions = {
      ...options,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Treat non-2xx responses as errors (they may be retryable depending on status)
      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      // Success – return the response
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      // AbortError indicates timeout or user abortion (AbortController.abort())
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        logError(context, timeoutError, { url, ...meta });
        throw new Error('Koneksi terlalu lambat. Silakan coba lagi.');
      }

      // Determine if we should retry based on error type
      const isRetryable = isErrorRetryable(error);
      if (attempt < retries && isRetryable) {
        const delay = getRetryDelay(attempt);
        logWarn(context, `Retry ${attempt + 1}/${retries} for ${url}`, {
          error: error.message,
          delay,
          ...meta,
        });
        await sleep(delay);
        attempt++;
        continue;
      }

      // If not retryable or no attempts left, break out
      break;
    }
  }

  // If we exit the loop, all attempts failed
  logError(context, lastError, { url, retries, ...meta });
  throw lastError;
}

// ============================================================================
// Helper: Determine if an error is retryable
// ============================================================================

function isErrorRetryable(error) {
  // Network errors (e.g., DNS failure, connection refused) are retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // HTTP status codes that are usually retryable (5xx, 429, 408)
  if (error.status) {
    const status = error.status;
    return status >= 500 || status === 429 || status === 408;
  }

  // Timeout errors (not AbortError) – fetch may throw a custom timeout
  if (error.message && error.message.toLowerCase().includes('timeout')) {
    return true;
  }

  // Default: do not retry
  return false;
}

// ============================================================================
// Wrapper: supabaseQueryWithRetry
// ============================================================================

/**
 * Retry a Supabase query function that returns a Promise with { data, error }.
 *
 * @param {Function} queryFn - Async function that executes the Supabase query.
 * @param {string} [context='supabase'] - Logging context.
 * @param {object} [meta={}] - Additional metadata for logs.
 * @param {number} [retries=1] - Number of retry attempts.
 * @returns {Promise<object>} The query result (same as queryFn).
 * @throws {Error} If all attempts fail, the last error is re-thrown.
 */
export async function supabaseQueryWithRetry(
  queryFn,
  context = 'supabase',
  meta = {},
  retries = DEFAULT_RETRIES
) {
  let lastError = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const result = await queryFn();

      // Supabase returns { data, error }
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Success
      return result;
    } catch (error) {
      lastError = error;

      // Determine if error is retryable (e.g., network error, timeout, or specific Supabase errors)
      const isRetryable = isSupabaseErrorRetryable(error);
      if (attempt < retries && isRetryable) {
        const delay = getRetryDelay(attempt);
        logWarn(context, `Supabase retry ${attempt + 1}/${retries}`, {
          error: error.message,
          delay,
          ...meta,
        });
        await sleep(delay);
        attempt++;
        continue;
      }

      // Not retryable or no attempts left
      break;
    }
  }

  logError(context, lastError, { ...meta, queryContext: context });
  throw lastError;
}

/**
 * Determine if a Supabase error is retryable.
 * Usually network errors, timeout, or temporary service errors.
 */
function isSupabaseErrorRetryable(error) {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // Timeout-like errors
  if (error.message && error.message.toLowerCase().includes('timeout')) {
    return true;
  }

  // Supabase may return specific error codes for retryable issues
  // Example: 'PGRST' errors (PostgREST) that are temporary
  if (error.message && error.message.includes('PGRST')) {
    // Could inspect further, but for simplicity, we treat all PGRST as retryable
    return true;
  }

  // Default: no retry
  return false;
}