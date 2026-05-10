// Next.js 15 instrumentation hook — laad Sentry config op server-side
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Captureer onhandled errors uit React Server Components
export async function onRequestError(
  error: { message: string; digest?: string } | unknown,
  request: { path: string; method: string; headers: { [key: string]: string } }
) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, {
    routerKind: "App Router",
    routePath: request.path,
    routeType: "route",
  });
}
