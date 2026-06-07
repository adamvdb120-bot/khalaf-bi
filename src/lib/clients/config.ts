// Centrale config per klant. Bron van waarheid voor branding, dashboard-route
// en welke features een klant wel/niet ziet. Wordt zowel server-side
// (route-gating, page.tsx) als client-side (Sidebar, ActiesMenu, Tabs) gebruikt.
//
// Slugs komen overeen met `profiles.client_slug` in Supabase.

export type ClientSlug = "attiva" | "areys" | "quba";

export type DashboardTabId =
  | "financieel"
  | "cashflow"
  | "crediteuren"
  | "declaraties";

export interface ClientFeatures {
  tabs: Record<DashboardTabId, boolean>;
  aiChat: boolean;
  pdfExport: boolean;
  notifications: boolean;
  monthlyReportEmail: boolean;
}

export interface ClientConfig {
  slug: ClientSlug;
  displayName: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  dashboardRoute: string;
  features: ClientFeatures;
}

export const CLIENTS: Record<ClientSlug, ClientConfig> = {
  attiva: {
    slug: "attiva",
    displayName: "Attiva Zorg",
    shortName: "Attiva",
    logo: "/logos/attiva.svg",
    primaryColor: "#1B3A5C",
    dashboardRoute: "/portal/dashboard/attiva",
    features: {
      tabs: {
        financieel: true,
        cashflow: false, // verborgen: overlapte met Financieel overzicht (component blijft bestaan)
        crediteuren: true,
        declaraties: true,
      },
      aiChat: true,
      pdfExport: true,
      notifications: true,
      monthlyReportEmail: true,
    },
  },
  areys: {
    slug: "areys",
    displayName: "Areys Restaurant",
    shortName: "Areys",
    logo: "/logos/areys.svg",
    primaryColor: "#C9A84C",
    dashboardRoute: "/portal/dashboard/areys",
    features: {
      tabs: {
        financieel: true,
        cashflow: false,
        crediteuren: false,
        declaraties: false,
      },
      aiChat: true,
      pdfExport: true,
      notifications: true,
      monthlyReportEmail: false,
    },
  },
  quba: {
    slug: "quba",
    displayName: "Markaz Quba",
    shortName: "Quba",
    logo: "/logos/quba.svg",
    primaryColor: "#1B3A5C",
    dashboardRoute: "/portal/dashboard/markaz-quba",
    features: {
      tabs: {
        financieel: true,
        cashflow: false,
        crediteuren: false,
        declaraties: false,
      },
      aiChat: true,
      pdfExport: false,
      notifications: false,
      monthlyReportEmail: false,
    },
  },
};

export const CLIENT_SLUGS = Object.keys(CLIENTS) as ClientSlug[];

export function isClientSlug(slug: unknown): slug is ClientSlug {
  return typeof slug === "string" && slug in CLIENTS;
}

export function getClientConfig(
  slug: string | null | undefined
): ClientConfig | null {
  if (!isClientSlug(slug)) return null;
  return CLIENTS[slug];
}

type ToggleFeature = Exclude<keyof ClientFeatures, "tabs">;

// Standaard alles aan voor admins (geen client_slug) zodat het admin-overzicht
// niets verstopt. Klanten zonder bekende slug krijgen alles uit.
export function isFeatureEnabled(
  slug: string | null | undefined,
  feature: ToggleFeature,
  { adminFallback = true }: { adminFallback?: boolean } = {}
): boolean {
  if (slug == null) return adminFallback;
  const cfg = getClientConfig(slug);
  if (!cfg) return false;
  return cfg.features[feature];
}

export function isTabEnabled(
  slug: string | null | undefined,
  tab: DashboardTabId,
  { adminFallback = true }: { adminFallback?: boolean } = {}
): boolean {
  if (slug == null) return adminFallback;
  const cfg = getClientConfig(slug);
  if (!cfg) return false;
  return cfg.features.tabs[tab];
}
