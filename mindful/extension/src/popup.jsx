import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  const [url, setUrl] = useState("Loading...");

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeUrl = tabs && tabs[0] && tabs[0].url;
        setUrl(activeUrl || "Unable to read the active tab URL.");
      });
    } else {
      setUrl("Chrome tabs API unavailable.");
    }
  }, []);

  return (
    <div>
      <h1>Second Thought</h1>
      <p>Current product URL:</p>
      <div className="url">{url}</div>
      <button className="button" type="button">
        Add to Mindful Cart
      </button>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
