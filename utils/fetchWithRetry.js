import { logError, logWarn } from './logger.js';

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 1;
const BASE_RETRY_DELAY = 800;
const MAX_RETRY_DELAY = 10000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRetryDelay(attempt) {
  const exponential = BASE_RETRY_DELAY * Math.pow(2, attempt);
  const capped = Math.min(exponential, MAX_RETRY_DELAY);
  return capped + Math.random() * 200;
}

export async function fetchWithRetry(url, options = {}, config = {}) {
  const { retries = DEFAULT_RETRIES, timeout = DEFAULT_TIMEOUT, context = 'general', meta = {} } = config;
  let lastError = null;
  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const fetchOptions = { ...options, signal: controller.signal };
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      if (!response.ok) { const errorMsg = `HTTP ${response.status}: ${response.statusText}`; const error = new Error(errorMsg); error.status = response.status; error.response = response; throw error; }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (error.name === 'AbortError') { const timeoutError = new Error(`Request timeout after ${timeout}ms`); logError(context, timeoutError, { url, ...meta }); throw new Error('Koneksi terlalu lambat. Silakan coba lagi.'); }
      const isRetryable = isErrorRetryable(error);
      if (attempt < retries && isRetryable) { const delay = getRetryDelay(attempt); logWarn(context, `Retry ${attempt + 1}/${retries} for ${url}`, { error: error.message, delay, ...meta }); await sleep(delay); attempt++; continue; }
      break;
    }
  }
  logError(context, lastError, { url, retries, ...meta });
  throw lastError;
}

function isErrorRetryable(error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  if (error.status) { const status = error.status; return status >= 500 || status === 429 || status === 408; }
  if (error.message && error.message.toLowerCase().includes('timeout')) return true;
  return false;
}

export async function supabaseQueryWithRetry(queryFn, context = 'supabase', meta = {}, retries = DEFAULT_RETRIES) {
  let lastError = null;
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const result = await queryFn();
      if (result.error) throw new Error(result.error.message);
      return result;
    } catch (error) {
      lastError = error;
      const isRetryable = isSupabaseErrorRetryable(error);
      if (attempt < retries && isRetryable) { const delay = getRetryDelay(attempt); logWarn(context, `Supabase retry ${attempt + 1}/${retries}`, { error: error.message, delay, ...meta }); await sleep(delay); attempt++; continue; }
      break;
    }
  }
  logError(context, lastError, { ...meta, queryContext: context });
  throw lastError;
}

function isSupabaseErrorRetryable(error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  if (error.message && error.message.toLowerCase().includes('timeout')) return true;
  if (error.message && error.message.includes('PGRST')) return true;
  return false;
}