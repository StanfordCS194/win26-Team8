/**
 * Content script: add-to-cart overlay + "already in cart" banner.
 * Banner is checked here on load so it doesn't depend on the background service worker staying alive (MV3).
 *
 * All extension UI is rendered inside Shadow DOM: overlay and banner each have a host with
 * attachShadow(). Styles are injected only into those shadow roots (webapp design tokens +
 * content.css). Nothing the extension does affects the page styling, and nothing the page
 * does affects the extension.
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

/** Webapp design tokens (from styles/globals.css :root) scoped to :host so extension
 *  inherits webapp styling. All extension styling lives inside Shadow DOM so the page
 *  cannot affect the extension and the extension cannot affect the page. */
const WEBAPP_DESIGN_TOKENS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
:host {
  --font-size: 16px;
  --background: #F5F3EF;
  --foreground: #5A6B72;
  --card: #FDFCFA;
  --card-foreground: #5A6B72;
  --popover: #FDFCFA;
  --popover-foreground: #5A6B72;
  --primary: #8BA89A;
  --primary-foreground: #FDFCFA;
  --secondary: #D9C5B3;
  --secondary-foreground: #5A6B72;
  --muted: #E8E4DE;
  --muted-foreground: #848F95;
  --accent: #C9B8A7;
  --accent-foreground: #5A6B72;
  --destructive: #B85C5C;
  --destructive-foreground: #FDFCFA;
  --border: rgba(139, 168, 154, 0.15);
  --input: transparent;
  --input-background: #FDFCFA;
  --switch-background: #C9B8A7;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --ring: #8BA89A;
  --radius: 0.75rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: var(--font-size);
  line-height: 1.5;
  color: var(--foreground);
  font-weight: var(--font-weight-normal);
  font-style: normal;
  letter-spacing: normal;
  text-transform: none;
  text-align: left;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

let contentStylesCache: string | null = null;

function getContentStyles(): Promise<string> {
  if (contentStylesCache) return Promise.resolve(contentStylesCache);
  const cr = typeof chrome !== 'undefined' ? (chrome as { runtime?: { getURL?: (path: string) => string } }) : undefined;
  const url = cr?.runtime?.getURL ? cr.runtime.getURL('content.css') : '';
  if (!url) return Promise.resolve(WEBAPP_DESIGN_TOKENS);
  return fetch(url)
    .then((r) => r.text())
    .then((css) => {
      contentStylesCache = WEBAPP_DESIGN_TOKENS + css;
      return contentStylesCache;
    })
    .catch(() => WEBAPP_DESIGN_TOKENS);
}

function injectStylesIntoShadow(shadowRoot: ShadowRoot, css: string): void {
  const style = document.createElement('style');
  style.textContent = css;
  shadowRoot.appendChild(style);
}

let lastOverlayCloseTime = 0;

async function showOverlay() {
  const doc = document;
  if (doc.getElementById(OVERLAY_ID)) return;
  if (Date.now() - lastOverlayCloseTime < CLOSE_COOLDOWN_MS) return;

  const host = doc.createElement('div');
  host.id = OVERLAY_ID;
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;overflow:hidden;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const css = await getContentStyles();
  injectStylesIntoShadow(shadow, css);
  const container = doc.createElement('div');
  container.className = 'st-overlay-root';
  shadow.appendChild(container);
  doc.body.appendChild(host);

  const root = createRoot(container);

  function handleClose() {
    lastOverlayCloseTime = Date.now();
    try {
      root.unmount();
    } catch (_) {
      // ignore if already unmounted
    }
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
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

async function showUrlBanner(content: BannerContent) {
  const doc = document;
  if (doc.getElementById(BANNER_ID)) return;
  const variantClass =
    content.variant === 'unlocked'
      ? 'st-url-banner st-url-banner--unlocked'
      : content.variant === 'goals'
        ? 'st-url-banner st-url-banner--goals'
        : 'st-url-banner st-url-banner--time';
  const headingHtml = escapeHtml(content.title);
  const subtitleHtml = content.subtitle ? escapeHtml(content.subtitle) : '';
  const linesHtml = content.lines
    .map((line) => {
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
  const innerHtml = `
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

  const host = doc.createElement('div');
  host.id = BANNER_ID;
  host.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483646;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const css = await getContentStyles();
  injectStylesIntoShadow(shadow, css);
  const bar = doc.createElement('div');
  bar.className = variantClass;
  bar.innerHTML = innerHtml;
  const dismiss = bar.querySelector('.st-url-banner-dismiss');
  if (dismiss) {
    dismiss.addEventListener('click', () => {
      host.remove();
    });
  }
  shadow.appendChild(bar);
  doc.body.insertBefore(host, doc.body.firstChild);
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
      await showUrlBanner({
        variant: 'unlocked',
        title: 'Mindfulness constraint reached',
        lines: [
          { value: isTimeBased ? 'Time-based constraint ⏳' : 'Goals-based constraint 🎯' },
          ...(item.goal?.trim() && !isTimeBased
            ? [{ label: 'Your goal:', value: item.goal.trim() }]
            : []),
          { value: 'Congrats on unlocking this item and making a more mindful purchase!' },
        ],
      });
      return;
    }

    if (item.wait_until_date) {
      const days = daysRemainingUntil(item.wait_until_date);
      const unlockDate = formatUnlockDate(item.wait_until_date);
      await showUrlBanner({
        variant: 'time',
        title: 'Mindful constraint active',
        lines: [
          { value: 'Time-based constraint ⏳' },
          {
            kind: 'metrics',
            value: `${days}|${unlockDate}`,
          },
        ],
      });
    } else {
      const friendLabel = item.friend_name?.trim() || 'your friend';
      const goalText = item.goal?.trim();
      await showUrlBanner({
        variant: 'goals',
        title: 'Mindful constraint active',
        lines: [
          { value: 'Goals-based constraint 🎯' },
          ...(goalText ? [{ label: 'Your goal:', value: goalText }] : []),
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

