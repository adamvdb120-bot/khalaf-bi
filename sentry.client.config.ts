// Sentry config voor de browser (client-side errors).
// DSN configureren via env: NEXT_PUBLIC_SENTRY_DSN
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Sample rate — in productie alle errors, in dev niets via env
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    debug: false,
    environment: process.env.NODE_ENV,
    // Filter ruis
    beforeSend(event) {
      // Skip 4xx-style chunk loading errors die niet jouw schuld zijn
      if (event.exception?.values?.some(e => e.value?.includes("ChunkLoadError"))) {
        return null;
      }
      return event;
    },
  });
}
