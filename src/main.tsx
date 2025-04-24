
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx';
import './index.css';

// Create a query client instance for React Query
const queryClient = new QueryClient();

// Use window.location.origin + "/", or default to "/" if unavailable
// This ensures proper routing on direct page loads
const baseUrl = '/';

console.log("Application initializing with baseUrl:", baseUrl);

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={baseUrl}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
);
