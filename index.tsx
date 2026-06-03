// Forcing a refresh to sync the preview with the latest file versions.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Manage scroll position ourselves (see ScrollToTop). Stops the browser restoring
// a previous scroll on reload/redirect — which left pages opening at the bottom,
// especially after the post-auth reload on mobile.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);