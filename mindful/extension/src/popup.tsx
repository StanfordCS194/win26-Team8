import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AddItemForm } from '../../components/AddItemForm';
import type { Item } from '../../types/item';

declare const chrome: any;

const App = () => {
  const [activeUrl, setActiveUrl] = useState('');
  const [urlStatus, setUrlStatus] = useState('Loading...');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const currentUrl = tabs && tabs[0] && tabs[0].url;
        if (currentUrl) {
          setActiveUrl(currentUrl);
          setUrlStatus('');
        } else {
          setUrlStatus('Unable to read the active tab URL.');
        }
      });
    } else {
      setUrlStatus('Chrome tabs API unavailable.');
    }
  }, []);

  const handleSubmit = (item: Omit<Item, 'id' | 'addedDate'>) => {
    console.log('🧾 Popup add item submission:', item);
    setSubmitMessage('Item captured. Open the app to view it.');
  };

  return (
    <div>
      <h1>Second Thought</h1>
      {urlStatus && <p>{urlStatus}</p>}
      {submitMessage && <p>{submitMessage}</p>}
      <AddItemForm
        onSubmit={handleSubmit}
        onCancel={() => window.close()}
        initialUrl={activeUrl}
      />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
