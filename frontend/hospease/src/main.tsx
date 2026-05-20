import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';

// Clear any stale mock sessions from previous demo mode — they will never
// authenticate against the real backend and cause redirect loops.
try {
  const raw = localStorage.getItem('hospease-auth');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.state?.token === 'mock-jwt-token') {
      localStorage.removeItem('hospease-auth');
    }
  }
} catch { /* ignore */ }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
