import * as Sentry from "@sentry/react";

// Initialize Sentry for error tracking
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const isProduction = import.meta.env.MODE === 'production';
const sentryEnabled = import.meta.env.VITE_SENTRY_ENABLED === 'true';

Sentry.init({
  dsn: SENTRY_DSN, // Add your Sentry DSN here
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  tracesSampleRate: 1.0,
  // Set replaysSessionSampleRate to 0.1 to capture 10%
  // of sessions for replay.
  replaysSessionSampleRate: 0.1,
  // Set replaysOnErrorSampleRate to 1.0 to capture 100%
  // of sessions with errors for replay.
  replaysOnErrorSampleRate: 1.0,
  // Filter out localhost and development errors
  environment: isProduction ? "production" : "development",
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (!isProduction && !sentryEnabled) {
      return null;
    }
    return event;
  },
});

export default Sentry;