"use strict";
(() => {
  // extension/src/content.ts
  var ADD_TO_CART_PATTERNS = [
    /\badd\s+to\s+(cart|bag|basket)\b/i,
    /\badd\s+to\s+shopping\s+cart\b/i,
    /\bbuy\s+now\b/i,
    /\badd\s+to\s+bag\b/i,
    /\badd\s+to\s+basket\b/i,
    /\badd\s+to\s+cart\b/i,
    /\bcart\s*[&+]\s*save\b/i,
    /^add\s+to\s+cart$/i,
    /\badd\s+cart\b/i,
    /\badd\s+bag\b/i,
    /\bpurchase\b/i
  ];
  var ADD_TO_CART_SELECTORS = [
    '[id*="add-to-cart"]',
    '[id*="addToCart"]',
    '[id*="add-to-bag"]',
    '[id*="add_to_cart"]',
    '[id="add-to-cart-button"]',
    '[id="addToCart"]',
    '[data-action*="add-to-cart"]',
    '[data-testid*="add-to-cart"]',
    '[data-testid*="addToCart"]',
    '[data-name*="add-to-cart" i]',
    '[class*="add-to-cart"]',
    '[class*="add_to_cart"]',
    '[class*="addToCart"]',
    '[class*="add-to-bag"]',
    '[name*="add-to-cart"]',
    '[name*="addToCart"]',
    '[value*="add to cart" i]',
    '[value*="add to bag" i]',
    '[aria-label*="add to cart" i]',
    '[aria-label*="add to bag" i]',
    '[title*="add to cart" i]',
    '[title*="add to bag" i]'
  ];
  var OVERLAY_ID = "second-thought-overlay";
  var DEBUG = false;
  var REMOVE_DECREASE_PATTERNS = [
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
    // just a minus character
    /\bminus\s+one\b/i,
    /\bdecrease\s+quantity\b/i
  ];
  var REMOVE_DECREASE_SELECTORS = [
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
    '[data-action*="decrease"]'
  ];
  function isRemoveOrDecreaseControl(element) {
    const text = (element.textContent || "").trim();
    const value = element.getAttribute("value") || element.value || "";
    const ariaLabel = element.getAttribute("aria-label") || "";
    const title = element.getAttribute("title") || "";
    const id = element.getAttribute("id") || "";
    const className = element.getAttribute("class") || "";
    const combined = [text, value, ariaLabel, title, id, className].join(" ");
    if (REMOVE_DECREASE_PATTERNS.some((re) => re.test(combined))) return true;
    try {
      if (REMOVE_DECREASE_SELECTORS.some((sel) => element.matches?.(sel))) return true;
    } catch {
    }
    return false;
  }
  function matchesAddToCart(element) {
    const text = (element.textContent || "").trim();
    const value = element.getAttribute("value") || element.value || "";
    const ariaLabel = element.getAttribute("aria-label") || "";
    const title = element.getAttribute("title") || "";
    const id = element.getAttribute("id") || "";
    const className = element.getAttribute("class") || "";
    const name = element.getAttribute("name") || "";
    const dataAction = element.getAttribute("data-action") || "";
    const dataTestId = element.getAttribute("data-testid") || "";
    const dataName = element.getAttribute("data-name") || "";
    const combined = [text, value, ariaLabel, title, id, className, name, dataAction, dataTestId, dataName].join(" ");
    if (ADD_TO_CART_PATTERNS.some((re) => re.test(combined))) return true;
    try {
      if (ADD_TO_CART_SELECTORS.some((sel) => element.matches?.(sel))) return true;
      for (const sel of ADD_TO_CART_SELECTORS) {
        if (element.closest?.(sel)) return true;
      }
    } catch {
    }
    return false;
  }
  function findAddToCartTarget(clickEvent) {
    const path = clickEvent.composedPath ? clickEvent.composedPath() : [];
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      if (node && typeof node.nodeType !== "undefined" && node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        if (el === document.body) continue;
        let hitRemove = false;
        for (let j = 0; j <= i; j++) {
          const n = path[j];
          if (n && typeof n.nodeType !== "undefined" && n.nodeType === Node.ELEMENT_NODE) {
            if (isRemoveOrDecreaseControl(n)) {
              hitRemove = true;
              break;
            }
          }
        }
        if (hitRemove) continue;
        if (matchesAddToCart(el)) return el;
      }
    }
    let current = clickEvent.target || null;
    while (current && current !== document.body) {
      if (isRemoveOrDecreaseControl(current)) return null;
      if (matchesAddToCart(current)) return current;
      current = current.parentElement;
    }
    return null;
  }
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `
    <div class="st-overlay-backdrop">
      <div class="st-overlay-card">
        <h1 class="st-overlay-title">Second Thought</h1>
        <p class="st-overlay-message">You're adding something to your cart. We'll help you add it to your list later.</p>
        <button type="button" class="st-overlay-close">Continue</button>
      </div>
    </div>
  `;
    const closeBtn = overlay.querySelector(".st-overlay-close");
    const backdrop = overlay.querySelector(".st-overlay-backdrop");
    function close() {
      overlay.remove();
      document.body.style.overflow = "";
    }
    closeBtn?.addEventListener("click", close);
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
    overlay.addEventListener("click", (e) => e.stopPropagation());
    return overlay;
  }
  function showOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    const overlay = createOverlay();
    document.body.style.overflow = "hidden";
    document.body.appendChild(overlay);
  }
  function onDocumentClick(e) {
    const addToCartEl = findAddToCartTarget(e);
    if (!addToCartEl) return;
    if (DEBUG) console.log("Second Thought: add-to-cart detected", addToCartEl);
    setTimeout(showOverlay, 100);
  }
  function init() {
    document.addEventListener("click", onDocumentClick, true);
    if (DEBUG) console.log("Second Thought: content script loaded");
  }
  init();
})();
