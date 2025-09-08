import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/push-sw.js', {
      scope: '/'
    })
      .then(reg => {
        console.log('Service Worker registered successfully:', reg.scope);
        
        // Update service worker if available
        if (reg.waiting) {
          reg.waiting.postMessage({ action: 'SKIP_WAITING' });
        }
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
