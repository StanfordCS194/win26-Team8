/**
 * Add-to-cart detection for content script. No React dependency.
 */

export const ADD_TO_CART_PATTERNS = [
  /\badd\s+to\s+(cart|bag|basket)\b/i,
  /\badd\s+to\s+(my|your)\s+bag\b/i,
  /\badd\s+to\s+shopping\s+cart\b/i,
  /\bbuy\s+now\b/i,
  /\badd\s+to\s+bag\b/i,
  /\badd\s+to\s+basket\b/i,
  /\badd\s+to\s+cart\b/i,
  /\bcart\s*[&+]\s*save\b/i,
  /^add\s+to\s+cart$/i,
  /\badd\s+cart\b/i,
  /\badd\s+bag\b/i,
  /\bpurchase\b/i,
  /^add\s+to\s+bag\s*$/i,
  /^add\s+to\s+cart\s*$/i,
];

export const ADD_TO_CART_SELECTORS = [
  '[id*="add-to-cart"]',
  '[id*="addToCart"]',
  '[id*="add-to-bag"]',
  '[id*="addToBag"]',
  '[id*="add_to_cart"]',
  '[id*="add_to_bag"]',
  '[id="add-to-cart-button"]',
  '[id="addToCart"]',
  '[id="add-to-bag"]',
  '[data-action*="add-to-cart"]',
  '[data-action*="add-to-bag"]',
  '[data-action*="addToCart"]',
  '[data-action*="addToBag"]',
  '[data-testid*="add-to-cart"]',
  '[data-testid*="addToCart"]',
  '[data-testid*="add-to-bag"]',
  '[data-testid*="addToBag"]',
  '[data-name*="add-to-cart" i]',
  '[data-add-to-cart]',
  '[data-add-to-cart-trigger]',
  '[data-automation*="add-to-bag" i]',
  '[data-automation*="add-to-cart" i]',
  '[class*="add-to-cart"]',
  '[class*="add_to_cart"]',
  '[class*="addToCart"]',
  '[class*="add-to-bag"]',
  '[class*="addToBag"]',
  '[class*="add_to_bag"]',
  '[class*="product-form__submit"]',
  '[class*="btn--add-to-cart"]',
  '[class*="add-to-bag"]',
  '[name="add"]',
  '[name*="add-to-cart"]',
  '[name*="addToCart"]',
  '[name*="add-to-bag"]',
  '[value*="add to cart" i]',
  '[value*="add to bag" i]',
  '[value*="add to basket" i]',
  '[aria-label*="add to cart" i]',
  '[aria-label*="add to bag" i]',
  '[aria-label*="add to basket" i]',
  '[title*="add to cart" i]',
  '[title*="add to bag" i]',
];

const REMOVE_DECREASE_PATTERNS = [
  /\bremove\b/i,
  /\bdelete\b/i,
  /\bminus\b/i,
  /\bdecrease\b/i,
  /\bsubtract\b/i,
  /\bless\b/i,
  /\bdrop\b/i,
  /\btake\s+away\b/i,
  /\bempty\s+cart\b/i,
  /\bclear\s+cart\b/i,
  /\bquantity\s*[-–—]\s*$/i,
  /^[-–—]$/,
  /\bminus\s+one\b/i,
  /\bdecrease\s+quantity\b/i,
];

const REMOVE_DECREASE_SELECTORS = [
  '[class*="remove"]',
  '[class*="delete"]',
  '[class*="minus"]',
  '[class*="decrease"]',
  '[class*="quantity-decrement"]',
  '[class*="quantity-minus"]',
  '[id*="remove"]',
  '[id*="delete"]',
  '[id*="minus"]',
  '[id*="decrease"]',
  '[aria-label*="remove" i]',
  '[aria-label*="delete" i]',
  '[aria-label*="minus" i]',
  '[aria-label*="decrease" i]',
  '[title*="remove" i]',
  '[title*="delete" i]',
  '[data-action*="remove"]',
  '[data-action*="decrease"]',
];

export function isRemoveOrDecreaseControl(element: Element): boolean {
  const text = (element.textContent || '').trim();
  const value = element.getAttribute('value') || (element as HTMLInputElement).value || '';
  const ariaLabel = element.getAttribute('aria-label') || '';
  const title = element.getAttribute('title') || '';
  const id = element.getAttribute('id') || '';
  const className = element.getAttribute('class') || '';
  const combined = [text, value, ariaLabel, title, id, className].join(' ');
  if (REMOVE_DECREASE_PATTERNS.some((re) => re.test(combined))) return true;
  try {
    if (REMOVE_DECREASE_SELECTORS.some((sel) => element.matches?.(sel))) return true;
  } catch {
    // ignore
  }
  return false;
}

/** True if element is a submit button for a Shopify-style cart add form */
function isCartAddSubmitButton(element: Element): boolean {
  const tag = (element.tagName || '').toLowerCase();
  const type = (element.getAttribute('type') || (element as HTMLInputElement).type || '').toLowerCase();
  if (tag === 'button' && type === 'submit') {
    const form = (element as HTMLButtonElement).form;
    if (form && form.action) {
      const action = form.action.toLowerCase();
      if (action.includes('/cart/add') || action.includes('cart/add.js')) return true;
    }
  }
  if (tag === 'input' && type === 'submit') {
    const form = (element as HTMLInputElement).form;
    if (form && form.action) {
      const action = form.action.toLowerCase();
      if (action.includes('/cart/add') || action.includes('cart/add.js')) return true;
    }
  }
  return false;
}

export function matchesAddToCart(element: Element): boolean {
  if (isCartAddSubmitButton(element)) return true;

  const text = (element.textContent || '').trim();
  const innerText = typeof (element as HTMLElement).innerText === 'string' ? (element as HTMLElement).innerText.trim() : '';
  const value = element.getAttribute('value') || (element as HTMLInputElement).value || '';
  const ariaLabel = element.getAttribute('aria-label') || '';
  const title = element.getAttribute('title') || '';
  const id = element.getAttribute('id') || '';
  const className = element.getAttribute('class') || '';
  const name = element.getAttribute('name') || '';
  const dataAction = element.getAttribute('data-action') || '';
  const dataTestId = element.getAttribute('data-testid') || '';
  const dataName = element.getAttribute('data-name') || '';
  const dataAutomation = element.getAttribute('data-automation') || element.getAttribute('data-automation-id') || '';

  const combined = [text, innerText, value, ariaLabel, title, id, className, name, dataAction, dataTestId, dataName, dataAutomation].join(' ');

  if (ADD_TO_CART_PATTERNS.some((re) => re.test(combined))) return true;
  try {
    if (ADD_TO_CART_SELECTORS.some((sel) => element.matches?.(sel))) return true;
    for (const sel of ADD_TO_CART_SELECTORS) {
      if (element.closest?.(sel)) return true;
    }
  } catch {
    // ignore selector errors
  }

  return false;
}

/**
 * Returns the add-to-cart element if the click was on one (and not on remove/decrease).
 * Ignores clicks inside the extension overlay (so "Continue without adding" doesn't re-open it).
 */
export function findAddToCartTarget(clickEvent: MouseEvent, overlayRootId?: string): Element | null {
  const overlayRoot = overlayRootId ? document.getElementById(overlayRootId) : null;

  const path = clickEvent.composedPath ? clickEvent.composedPath() : [];
  for (let i = 0; i < path.length; i++) {
    const node = path[i];
    if (node && typeof (node as Element).nodeType !== 'undefined' && (node as Element).nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el === document.body) continue;
      if (overlayRoot && (el === overlayRoot || overlayRoot.contains(el))) continue;
      let hitRemove = false;
      for (let j = 0; j <= i; j++) {
        const n = path[j];
        if (n && typeof (n as Element).nodeType !== 'undefined' && (n as Element).nodeType === Node.ELEMENT_NODE) {
          if (isRemoveOrDecreaseControl(n as Element)) {
            hitRemove = true;
            break;
          }
        }
      }
      if (hitRemove) continue;
      if (matchesAddToCart(el)) return el;
    }
  }
  // Fallback: walk up the tree (including through shadow DOM) to find a matching add-to-cart element
  let current: Element | null = (clickEvent.target as Element) || null;
  while (current && current !== document.body) {
    if (overlayRoot && (current === overlayRoot || overlayRoot.contains(current))) return null;
    if (isRemoveOrDecreaseControl(current)) return null;
    if (matchesAddToCart(current)) return current;
    // Cross shadow DOM: if parent is a shadow root, go to its host
    const nextParent: Element | null = current.parentElement
      ? current.parentElement
      : current.parentNode && (current.parentNode as ShadowRoot).host !== undefined
        ? ((current.parentNode as ShadowRoot).host as Element)
        : null;
    current = nextParent;
  }
  // Last resort: if click was on a child of a button/link, check closest interactive ancestor
  const target = clickEvent.target as Element;
  if (target) {
    const interactive = target.closest?.('button, [role="button"], a[href], input[type="submit"]');
    if (interactive && interactive !== overlayRoot && !(overlayRoot && overlayRoot.contains(interactive)) && !isRemoveOrDecreaseControl(interactive) && matchesAddToCart(interactive)) {
      return interactive;
    }
  }
  return null;
}
