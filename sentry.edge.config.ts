// Sentry config voor Vercel Edge Runtime (middleware).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
