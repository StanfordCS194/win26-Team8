const urlEl = document.getElementById("current-url");

if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeUrl = tabs && tabs[0] && tabs[0].url;
    if (urlEl) {
      urlEl.textContent = activeUrl || "Unable to read the active tab URL.";
    }
  });
} else if (urlEl) {
  urlEl.textContent = "Chrome tabs API unavailable.";
}
