import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './lib/auth';
import { AuthGate } from './components/AuthGate.tsx';
import './index.css';

// Feature flags
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';
const PUBLIC_PLAYGROUND_ENABLED = import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND === 'true';
const pathname = typeof window !== 'undefined' ? window.location?.pathname || '' : '';
const isPlaygroundPath = pathname.startsWith('/play/');
const isPublicGalleryPath = pathname === '/playground';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {AUTH_ENABLED && !(PUBLIC_PLAYGROUND_ENABLED && (isPlaygroundPath || isPublicGalleryPath)) ? (
        <AuthProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </AuthProvider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </StrictMode>
);
