export function injectStyles(styleContent) {
  const style = document.createElement("style");
  style.textContent = styleContent;
  document.head.appendChild(style);
}

export function applyStyles(element, cssText) {
  element.style.cssText = cssText;
}

export function createOverlay() {
  const overlay = document.createElement("div");
  overlay.classList.add("modal-overlay");
  return overlay;
}

export function closeModal(modal) {
  if (modal && modal.parentNode) {
    modal.remove();
  }
}

export function setupOutsideClickClose(overlay, onClose) {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      onClose?.();
    }
  });
}

export function on(element, event, handler) {
  element.addEventListener(event, handler);
  return () => element.removeEventListener(event, handler);
}

export function delegate(parent, selector, event, handler) {
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target) handler.call(target, e);
  });
}

export function elementExists(element) {
  if (typeof element === "string") {
    return document.querySelector(element) !== null;
  }
  return element instanceof HTMLElement;
}

export function safeQuery(selector) {
  try {
    return document.querySelector(selector);
  } catch (e) {
    console.error(`Error querying selector: ${selector}`, e);
    return null;
  }
}

export function safeQueryAll(selector) {
  try {
    return document.querySelectorAll(selector);
  } catch (e) {
    console.error(`Error querying selector: ${selector}`, e);
    return [];
  }
}
