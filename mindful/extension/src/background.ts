/**
 * Service worker: add-to-cart tab opening + URL-in-cart check on tab load.
 * Uses shared lib (fetchUserProductUrlsWithClient, isUrlInStoredUrls) and extension supabase.
 */

import { supabase } from './supabaseClient';
import { fetchUserProductUrlsWithClient } from '../../lib/fetchUserProductUrls';
import { isUrlInStoredUrls } from '../../lib/urlUtils';

const PENDING_ADD_KEY = 'secondThought_pendingAddPage';
const SHOW_URL_BANNER = 'SHOW_URL_BANNER';
const CHECK_URL_BANNER = 'CHECK_URL_BANNER';

function openAddPageTab(url: string) {
  if (!url || typeof url !== 'string') return;
  const addPath = 'add.html?url=' + encodeURIComponent(url);
  const addUrl = chrome.runtime.getURL(addPath);
  chrome.tabs.create({ url: addUrl, active: true });
}

chrome.runtime.onMessage.addListener((message: { type?: string; url?: string }, _sender, sendResponse) => {
  if (message.type === 'OPEN_ADD_PAGE' && typeof message.url === 'string') {
    openAddPageTab(message.url);
    sendResponse({ ok: true });
    return;
  }
  if (message.type === CHECK_URL_BANNER && typeof message.url === 'string') {
    checkUrlAndRespond(message.url).then((show) => sendResponse({ show })).catch(() => sendResponse({ show: false }));
    return true; // keep channel open for async sendResponse
  }
  return true;
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  chrome.storage.local.get(PENDING_ADD_KEY, (data) => {
    const p = data[PENDING_ADD_KEY];
    if (!p || p.tabId !== details.tabId || !p.url) return;
    if (Date.now() - p.t > 15000) return;
    chrome.storage.local.remove(PENDING_ADD_KEY);
    openAddPageTab(p.url);
  });
});

/** Returns true if the URL is in the user's stored product URLs (for banner). */
async function checkUrlAndRespond(url: string): Promise<boolean> {
  if (!url || url.startsWith('chrome:') || url.startsWith('edge:') || url.startsWith('about:')) return false;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return false;
    const { urls, error } = await fetchUserProductUrlsWithClient(supabase, session.user.id);
    if (error || !urls?.length) return false;
    return isUrlInStoredUrls(url, urls);
  } catch {
    return false;
  }
}

async function checkTabUrlAndNotify(tabId: number, url: string) {
  const show = await checkUrlAndRespond(url);
  if (!show) return;
  chrome.tabs.sendMessage(tabId, { type: SHOW_URL_BANNER }).catch(() => {
    // Content script may not be loaded yet (handled by content requesting CHECK_URL_BANNER on load)
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  checkTabUrlAndNotify(tabId, tab.url);
});
