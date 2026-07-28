import { getSupabase } from './helpers.js';

export const LOG_LEVELS = { ERROR: 'error', WARN: 'warn', INFO: 'info', DEBUG: 'debug' };

const isDevelopment = () => {
  try {
    return process?.env?.NODE_ENV === 'development' || window?.location?.hostname === 'localhost' || window?.location?.hostname === '127.0.0.1';
  } catch { return false; }
};

function normalizeError(error) {
  if (error instanceof Error) return { message: error.message, stack: error.stack || null, name: error.name };
  if (typeof error === 'string') return { message: error, stack: null, name: 'StringError' };
  if (error && typeof error === 'object' && 'message' in error) return { message: String(error.message), stack: error.stack || null, name: error.name || 'ObjectError' };
  return { message: String(error), stack: null, name: 'UnknownError' };
}

function buildLogPayload({ level, context, message, error = null, meta = {} }) {
  const normalized = normalizeError(error);
  const safeMeta = { ...meta }; delete safeMeta.context; delete safeMeta.level; delete safeMeta.message; delete safeMeta.stack;
  const payload = { context, level, message: message || normalized.message, stack: normalized.stack, error_name: normalized.name, user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null, url: typeof window !== 'undefined' ? window.location.href : null, timestamp: new Date().toISOString(), ...safeMeta };
  if (isDevelopment()) payload._dev = { timestamp_ms: Date.now() };
  return payload;
}

function sendToSupabase(payload) {
  try {
    const sb = getSupabase();
    if (!sb) return;
    sb.from('error_logs').insert(payload).then(() => { if (isDevelopment()) console.debug('[Logger] Log sent to Supabase:', payload.context); }).catch((err) => { if (isDevelopment()) console.warn('[Logger] Failed to send log to Supabase:', err); });
  } catch (_) { if (isDevelopment()) console.warn('[Logger] Sync error while sending log to Supabase'); }
}

function log(level, context, messageOrError, meta = {}) {
  let message, errorObj;
  if (typeof messageOrError === 'string') { message = messageOrError; errorObj = null; }
  else { errorObj = messageOrError; message = errorObj instanceof Error ? errorObj.message : String(errorObj); }
  const consolePrefix = `[${context.toUpperCase()}]`;
  if (level === LOG_LEVELS.ERROR) console.error(consolePrefix, message, errorObj || '');
  else if (level === LOG_LEVELS.WARN) console.warn(consolePrefix, message);
  else if (level === LOG_LEVELS.INFO) console.info(consolePrefix, message);
  else console.debug(consolePrefix, message);
  const payload = buildLogPayload({ level, context, message, error: errorObj, meta });
  sendToSupabase(payload);
}

export async function logError(context, error, meta = {}) { log(LOG_LEVELS.ERROR, context, error, meta); }
export async function logWarn(context, message, meta = {}) { log(LOG_LEVELS.WARN, context, message, meta); }
export async function logInfo(context, message, meta = {}) { log(LOG_LEVELS.INFO, context, message, meta); }
export async function logDebug(context, message, meta = {}) { if (isDevelopment()) log(LOG_LEVELS.DEBUG, context, message, meta); }

export function withErrorLogging(fn, context, meta = {}) {
  if (typeof fn !== 'function') throw new Error('withErrorLogging expects a function');
  const isAsync = fn.constructor.name === 'AsyncFunction' || fn.toString().includes('async');
  if (isAsync) return async (...args) => { try { return await fn(...args); } catch (error) { await logError(context, error, { ...meta, args }); throw error; } };
  return (...args) => { try { return fn(...args); } catch (error) { logError(context, error, { ...meta, args }).catch(() => {}); throw error; } };
}

export async function flushLogs() { return Promise.resolve(); }