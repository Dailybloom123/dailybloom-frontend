import React from 'react';
import ReactDOM from 'react-dom/client';
import PartnerPortal from './PartnerPortal.jsx';
import Sentry from './sentry.js';

// Wrap with Sentry Error Boundary
const SentryErrorBoundary = Sentry.ErrorBoundary;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={ErrorFallback}>
      <PartnerPortal />
    </SentryErrorBoundary>
  </React.StrictMode>,
)

// Error fallback component
function ErrorFallback({ error, componentStack, resetError }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: '#F8F9F5',
      fontFamily: 'Manrope, sans-serif'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: 40,
        maxWidth: 500,
        textAlign: 'center',
        border: '1px solid #E8EFE8'
      }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 700, color: '#1A2E23', marginBottom: 12 }}>
          Partner Portal Error
        </h2>
        <p style={{ color: '#4A5D52', marginBottom: 24 }}>
          We encountered an unexpected error. This has been reported to our team.
        </p>
        <button
          onClick={resetError}
          style={{
            background: '#4CAF50',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}