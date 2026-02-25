/**
 * Content script: add-to-cart overlay + "already in cart" banner.
 * Banner is checked here on load so it doesn't depend on the background service worker staying alive (MV3).
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { findAddToCartTarget } from './cartDetection';
import { ContentOverlay, OVERLAY_ID } from './ContentOverlay';
import { supabase } from './supabaseClient';
import { fetchItemByProductUrlWithClient } from '../../lib/fetchUserProductUrls';
import { daysRemainingUntil, formatUnlockDate } from '../../lib/dateUtils';

const DEBUG = false;
const CLOSE_COOLDOWN_MS = 800;
const BANNER_ID = 'second-thought-url-banner';

let lastOverlayCloseTime = 0;

function showOverlay() {
  const doc = document;
  if (doc.getElementById(OVERLAY_ID)) return;
  if (Date.now() - lastOverlayCloseTime < CLOSE_COOLDOWN_MS) return;

  const container = doc.createElement('div');
  container.id = OVERLAY_ID;
  doc.body.style.overflow = 'hidden';
  doc.body.appendChild(container);

  const root = createRoot(container);

  function handleClose() {
    lastOverlayCloseTime = Date.now();
    try {
      root.unmount();
    } catch (_) {
      // ignore if already unmounted
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    doc.body.style.overflow = '';
  }

  root.render(
    <ContentOverlay onClose={handleClose} pageUrl={doc.location?.href} />
  );
}

function onDocumentClick(e: MouseEvent) {
  if (Date.now() - lastOverlayCloseTime < CLOSE_COOLDOWN_MS) return;

  const addToCartEl = findAddToCartTarget(e, OVERLAY_ID);
  if (!addToCartEl) return;
  if (DEBUG) console.log('Second Thought: add-to-cart detected', addToCartEl);

  setTimeout(showOverlay, 100);
}

function showUrlBanner(opts: { daysRemaining: number; unlockDate: string }) {
  const doc = document;
  if (doc.getElementById(BANNER_ID)) return;
  const { daysRemaining, unlockDate } = opts;
  const text =
    `You have not yet unlocked this item in your mindful cart! ${daysRemaining} days remaining. Unlocks on ${unlockDate}.`;
  const bar = doc.createElement('div');
  bar.id = BANNER_ID;
  bar.className = 'st-url-banner';
  bar.innerHTML = `
    <span class="st-url-banner-text">${escapeHtml(text)}</span>
    <button type="button" class="st-url-banner-dismiss" aria-label="Dismiss">×</button>
  `;
  const dismiss = bar.querySelector('.st-url-banner-dismiss');
  if (dismiss) {
    dismiss.addEventListener('click', () => {
      bar.remove();
    });
  }
  doc.body.insertBefore(bar, doc.body.firstChild);
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

declare const chrome: { runtime?: { onMessage?: { addListener: (cb: (message: { type?: string }) => void) => void } } };

async function checkUrlAndShowBanner() {
  if (window !== window.top) return;
  const url = document.location?.href || '';
  if (!url || url.startsWith('chrome:') || url.startsWith('edge:') || url.startsWith('about:')) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const { item, error } = await fetchItemByProductUrlWithClient(supabase, session.user.id, url);
    if (error || !item) return;
    const waitUntil = item.wait_until_date ?? '';
    const daysRemaining = daysRemainingUntil(waitUntil);
    const unlockDate = formatUnlockDate(waitUntil);
    showUrlBanner({ daysRemaining, unlockDate });
  } catch {
    // ignore
  }
}

function init() {
  document.addEventListener('click', onDocumentClick, true);
  chrome.runtime?.onMessage?.addListener((message: { type?: string }) => {
    if (message.type === 'SHOW_URL_BANNER' && window === window.top) {
      checkUrlAndShowBanner();
    }
  });
  if (window === window.top) {
    checkUrlAndShowBanner();
  }
  if (DEBUG) console.log('Second Thought: content script loaded');
}

init();
