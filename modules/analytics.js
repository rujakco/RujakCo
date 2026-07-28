import { logInfo, logWarn, logError } from '../utils/logger.js';
import { getSupabase } from '../utils/helpers.js';

const ANALYTICS_QUEUE_KEY = 'rujak_analytics_queue'; const SESSION_STORAGE_KEY = 'rujak_session_id'; const GA_RECHECK_DELAY = 3000;
let gtagAvailable = typeof window.gtag === 'function'; let supabaseClient = null; let isInitialized = false; let flushTimer = null;

function getSessionId() { try { let sid = sessionStorage.getItem(SESSION_STORAGE_KEY); if (!sid) { sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(); sessionStorage.setItem(SESSION_STORAGE_KEY, sid); } return sid; } catch { return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7); } }
function getPageContext() { try { return { url: window.location.href, referrer: document.referrer || null, path: window.location.pathname, search: window.location.search }; } catch { return { url: null, referrer: null, path: null, search: null }; } }
function getQueue() { try { const raw = localStorage.getItem(ANALYTICS_QUEUE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveQueue(queue) { try { localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue)); } catch (error) { logError('analytics', error, { action: 'saveQueue' }); } }
function sendToGA4(eventName, params) { if (!gtagAvailable) return false; try { if (typeof window.gtag === 'function') { window.gtag('event', eventName, params); return true; } return false; } catch (error) { logWarn('analytics', 'Failed to send to GA4', { error: error.message, eventName }); return false; } }
async function sendToSupabase(eventName, params) { const sb = supabaseClient || getSupabase(); if (!sb) return false; try { const { error } = await sb.from('analytics_events').insert({ event_name: eventName, params: params, created_at: new Date().toISOString() }); if (error) { logWarn('analytics', 'Supabase insert error', { error: error.message, eventName }); return false; } return true; } catch (error) { logWarn('analytics', 'Failed to send to Supabase', { error: error.message, eventName }); return false; } }
async function processEvent(event) { const { eventName, params } = event; let success = sendToGA4(eventName, params); if (!success) success = await sendToSupabase(eventName, params); return success; }

export async function flushQueuedEvents() { const queue = getQueue(); if (queue.length === 0) return; logInfo('analytics', `Processing ${queue.length} queued events`); const remaining = []; for (const event of queue) { const success = await processEvent(event); if (!success) remaining.push(event); } saveQueue(remaining); if (remaining.length > 0) { logWarn('analytics', `${remaining.length} events still queued`); scheduleFlush(); } else logInfo('analytics', 'All queued events sent successfully'); }
function scheduleFlush() { if (flushTimer) clearTimeout(flushTimer); flushTimer = setTimeout(() => { flushQueuedEvents().catch(() => {}); }, 5000); }

export function initAnalytics() { if (isInitialized) return; supabaseClient = getSupabase(); gtagAvailable = typeof window.gtag === 'function'; setTimeout(() => { gtagAvailable = typeof window.gtag === 'function'; if (gtagAvailable) { logInfo('analytics', 'GA4 detected, flushing queued events'); flushQueuedEvents().catch(() => {}); } else logWarn('analytics', 'GA4 not available after delay, using Supabase fallback'); }, GA_RECHECK_DELAY); flushQueuedEvents().catch(() => {}); isInitialized = true; logInfo('analytics', 'Analytics initialized'); }

export function trackEvent(eventName, params = {}) { const enrichedParams = { ...params, timestamp: new Date().toISOString(), session_id: getSessionId(), ...getPageContext() }; logInfo('analytics', `Event: ${eventName}`, enrichedParams); const event = { eventName, params: enrichedParams, queuedAt: Date.now() }; processEvent(event).then((success) => { if (!success) { const queue = getQueue(); queue.push(event); saveQueue(queue); logWarn('analytics', `Event "${eventName}" queued for later`); scheduleFlush(); } }).catch((error) => { const queue = getQueue(); queue.push(event); saveQueue(queue); logError('analytics', error, { eventName, action: 'trackEvent' }); scheduleFlush(); }); }
export function trackViewProduct(productId, productName, price, extra = {}) { trackEvent('view_product', { product_id: productId, product_name: productName, price, ...extra }); }
export function trackAddToCart(productId, productName, qty, spiceLevel, price, extra = {}) { trackEvent('add_to_cart', { product_id: productId, product_name: productName, quantity: qty, spice_level: spiceLevel, price, ...extra }); }
export function trackBeginCheckout(cartItems, subtotal, shippingCost, total, extra = {}) { trackEvent('begin_checkout', { item_count: cartItems?.length || 0, subtotal, shipping_cost: shippingCost, total, ...extra }); }
export function trackPurchase(orderCode, total, paymentMethod, items, extra = {}) { trackEvent('purchase', { order_code: orderCode, total, payment_method: paymentMethod, item_count: items?.length || 0, ...extra }); }
export function trackFilterCategory(category, extra = {}) { trackEvent('filter_category', { category, ...extra }); }
export function trackSearch(query, resultCount = null, extra = {}) { trackEvent('search', { query, result_count: resultCount, ...extra }); }
export function flushAnalyticsQueue() { flushQueuedEvents().catch((error) => { logError('analytics', error, { action: 'flushAnalyticsQueue' }); }); }
export function clearAnalyticsQueue() { saveQueue([]); if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; } logInfo('analytics', 'Analytics queue cleared'); }

export default { initAnalytics, trackEvent, trackViewProduct, trackAddToCart, trackBeginCheckout, trackPurchase, trackFilterCategory, trackSearch, flushAnalyticsQueue, clearAnalyticsQueue };
