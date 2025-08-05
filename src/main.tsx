import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient(); // Force fresh build trigger

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/push-sw.js')
      .then(reg => {
        console.log('Service Worker registered:', reg);
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ThemeProvider>
);
