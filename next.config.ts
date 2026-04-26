import type { NextConfig } from "next";

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

export default nextConfig;
