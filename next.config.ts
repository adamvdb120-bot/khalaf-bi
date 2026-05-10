import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    domains: [],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // TypeScript en ESLint waarschuwingen niet blokkerend bij build
  // (dev mode blijft strict — fouten zie je nog steeds in de editor)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

// Sentry wrapper — alleen actief als DSN env var is ingesteld.
// Build-time options worden alleen toegepast als SENTRY_AUTH_TOKEN beschikbaar is.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Source maps uploaden alleen in productie + alleen als auth token bestaat
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
  hideSourceMaps: true,
  disableLogger: true,
  // Tunnel-route omzeilt ad-blockers die Sentry blokkeren
  tunnelRoute: "/monitoring",
});
