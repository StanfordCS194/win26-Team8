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

type BannerVariant = 'time' | 'goals' | 'unlocked';

interface BannerLine {
  label?: string;
  value: string;
  kind?: 'metrics';
}

interface BannerContent {
  variant: BannerVariant;
  title: string;
  subtitle?: string;
  lines: BannerLine[];
}

function showUrlBanner(content: BannerContent) {
  const doc = document;
  if (doc.getElementById(BANNER_ID)) return;
  const bar = doc.createElement('div');
  bar.id = BANNER_ID;
  const variantClass =
    content.variant === 'unlocked'
      ? 'st-url-banner st-url-banner--unlocked'
      : content.variant === 'goals'
        ? 'st-url-banner st-url-banner--goals'
        : 'st-url-banner st-url-banner--time';
  bar.className = variantClass;
  const headingHtml = escapeHtml(content.title);
  const subtitleHtml = content.subtitle ? escapeHtml(content.subtitle) : '';
  const linesHtml = content.lines
    .map((line) => {
      // Special rendering for metrics line (days remaining + unlock date on one row)
      if (line.kind === 'metrics') {
        const [daysRaw, unlockRaw] = line.value.split('|');
        const days = escapeHtml(daysRaw ?? '');
        const unlock = escapeHtml(unlockRaw ?? '');
        return `
          <div class="st-url-banner-line st-url-banner-line--metrics">
            <span class="st-url-banner-line-label">Days remaining:</span>
            <span class="st-url-banner-line-value st-url-banner-line-value-days">${days}</span>
            <span class="st-url-banner-line-separator">·</span>
            <span class="st-url-banner-line-label st-url-banner-line-label-unlock">Unlocks on:</span>
            <span class="st-url-banner-line-value st-url-banner-line-value-unlock">${unlock}</span>
          </div>
        `;
      }

      const value = escapeHtml(line.value);
      if (line.label) {
        const label = escapeHtml(line.label);
        return `<div class="st-url-banner-line"><span class="st-url-banner-line-label">${label}</span><span class="st-url-banner-line-value">${value}</span></div>`;
      }
      return `<div class="st-url-banner-line"><span class="st-url-banner-line-value">${value}</span></div>`;
    })
    .join('');
  bar.innerHTML = `
    <div class="st-url-banner-inner">
      <div class="st-url-banner-content">
        <div class="st-url-banner-heading-row">
          <div class="st-url-banner-heading">${headingHtml}</div>
          ${subtitleHtml ? `<div class="st-url-banner-subtitle">${subtitleHtml}</div>` : ''}
        </div>
        <div class="st-url-banner-lines">
          ${linesHtml}
        </div>
      </div>
      <button type="button" class="st-url-banner-dismiss" aria-label="Dismiss">×</button>
    </div>
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
    if (item.is_unlocked) {
      const isTimeBased = !!item.wait_until_date;
      showUrlBanner({
        variant: 'unlocked',
        title: 'Mindfulness constraint reached',
        // Second line: correct constraint type based on original item
        lines: [
          { value: isTimeBased ? 'Time-based constraint' : 'Goals-based constraint' },
          { value: 'This item is now unlocked from your mindful cart.' },
        ],
      });
      return;
    }

    if (item.wait_until_date) {
      const days = daysRemainingUntil(item.wait_until_date);
      const unlockDate = formatUnlockDate(item.wait_until_date);
      showUrlBanner({
        variant: 'time',
        title: 'Mindful constraint active',
        lines: [
          { value: 'Time-based constraint' },
          {
            kind: 'metrics',
            value: `${days}|${unlockDate}`,
          },
        ],
      });
    } else {
      const friendLabel = item.friend_name?.trim() || 'your friend';
      showUrlBanner({
        variant: 'goals',
        title: 'Mindful constraint active',
        // Second line: constraint type on its own line
        lines: [
          { value: 'Goals-based constraint' },
          {
            value: `To unlock this item, complete your goal and enter the password from ${friendLabel}.`,
          },
        ],
      });
    }
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
