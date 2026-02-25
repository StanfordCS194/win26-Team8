/**
 * Content script: add-to-cart overlay + "already in cart" banner.
 * Banner is checked here on load so it doesn't depend on the background service worker staying alive (MV3).
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { findAddToCartTarget } from './cartDetection';
import { ContentOverlay, OVERLAY_ID } from './ContentOverlay';
import { supabase } from './supabaseClient';
import { fetchUserProductUrlsWithClient } from '../../lib/fetchUserProductUrls';
import { isUrlInStoredUrls } from '../../lib/urlUtils';

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

function showUrlBanner() {
  const doc = document;
  if (doc.getElementById(BANNER_ID)) return;
  const bar = doc.createElement('div');
  bar.id = BANNER_ID;
  bar.className = 'st-url-banner';
  bar.innerHTML = `
    <span class="st-url-banner-text">This item is already in your mindful cart.</span>
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

declare const chrome: { runtime?: { onMessage?: { addListener: (cb: (message: { type?: string }) => void) => void } } };

async function checkUrlAndShowBanner() {
  if (window !== window.top) return;
  const url = document.location?.href || '';
  if (!url || url.startsWith('chrome:') || url.startsWith('edge:') || url.startsWith('about:')) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const { urls, error } = await fetchUserProductUrlsWithClient(supabase, session.user.id);
    if (error || !urls?.length) return;
    if (isUrlInStoredUrls(url, urls)) showUrlBanner();
  } catch {
    // ignore
  }
}

function init() {
  document.addEventListener('click', onDocumentClick, true);
  chrome.runtime?.onMessage?.addListener((message: { type?: string }) => {
    if (message.type === 'SHOW_URL_BANNER' && window === window.top) {
      showUrlBanner();
    }
  });
  if (window === window.top) {
    checkUrlAndShowBanner();
  }
  if (DEBUG) console.log('Second Thought: content script loaded');
}

init();
