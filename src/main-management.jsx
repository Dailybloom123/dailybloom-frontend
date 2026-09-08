import React from 'react'
import ReactDOM from 'react-dom/client'
import ManagementPortal from './ManagementPortal.jsx'
import './index.css'
import Sentry from './sentry.js'

// Wrap with Sentry Error Boundary
const SentryErrorBoundary = Sentry.ErrorBoundary;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={ErrorFallback}>
      <ManagementPortal />
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
      background: '#FAFAFA',
      fontFamily: 'Manrope, sans-serif'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: 40,
        maxWidth: 500,
        textAlign: 'center',
        border: '1px solid #E0E0E0'
      }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>
          Admin Portal Error
        </h2>
        <p style={{ color: '#666666', marginBottom: 24 }}>
          We encountered an unexpected error. This has been reported to our team.
        </p>
        <button
          onClick={resetError}
          style={{
            background: '#F6A623',
            color: '#1A1A1A',
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