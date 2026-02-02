import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  const [url, setUrl] = useState("Loading...");
  const [showQuestions, setShowQuestions] = useState(false);

  const questions = [
    "What are you hoping to use this for?",
    "How often do you expect to use it?",
    "What is your budget for this item?",
    "What would make you feel confident about buying it?",
  ];

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
      <button
        className="button"
        type="button"
        onClick={() => setShowQuestions(true)}
      >
        Add to Mindful Cart
      </button>
      {showQuestions && (
        <div className="questions">
          {questions.map((question) => (
            <label className="question" key={question}>
              <span>{question}</span>
              <input type="text" />
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
