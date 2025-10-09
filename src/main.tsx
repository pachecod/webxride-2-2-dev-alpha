import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './lib/auth';
import { AuthGate } from './components/AuthGate.tsx';
import './index.css';

// Feature flag: Enable auth system (set to true when ready to test)
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {AUTH_ENABLED ? (
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
