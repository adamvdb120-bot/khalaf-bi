import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getClientConfig, type ClientConfig } from "@/lib/clients/config";

export interface UserAccess {
  userId: string;
  email: string;
  fullName: string | null;
  role: "admin" | "client" | "user";
  clientSlug: string | null;
}

/**
 * Haalt de huidige gebruiker + profiel op. Geen toegang? Redirect naar login.
 */
export async function requireUser(): Promise<UserAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, client_slug")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: (profile?.role as "admin" | "client" | "user") ?? "user",
    clientSlug: profile?.client_slug ?? null,
  };
}

/**
 * Vereist dat de gebruiker toegang heeft tot een specifieke klant.
 *  - Admins mogen alles
 *  - Klanten mogen alleen hun eigen client_slug
 *  - Anders: redirect naar portal home
 */
export async function requireClientAccess(slug: string): Promise<UserAccess> {
  const user = await requireUser();

  if (user.role === "admin") return user;

  if (user.role === "client" && user.clientSlug === slug) return user;

  // Klant zonder match, of andere rol → terug naar portal
  // (portal home stuurt ze daarna automatisch naar het juiste dashboard, of toont een fout)
  redirect("/portal");
}

/**
 * Vereist dat de gebruiker admin is. Anders: redirect naar portal home.
 */
export async function requireAdmin(): Promise<UserAccess> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/portal");
  return user;
}

/**
 * Geeft de klant-config terug voor de huidige gebruiker. Admins krijgen `null`
 * (zien alles); klanten met een onbekende slug krijgen ook `null`.
 */
export async function getCurrentClientConfig(): Promise<ClientConfig | null> {
  const user = await requireUser();
  if (user.role === "admin") return null;
  return getClientConfig(user.clientSlug);
}

/**
 * API-variant van requireClientAccess: returnt UserAccess als de gebruiker
 * toegang heeft, anders `null` — geen redirect. Bedoeld voor route handlers
 * die zelf een 401/403 willen returnen i.p.v. een redirect te triggeren.
 */
export async function checkClientAccess(slug: string): Promise<UserAccess | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, client_slug")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as "admin" | "client" | "user") ?? "user";
  const clientSlug = profile?.client_slug ?? null;

  const access: UserAccess = {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role,
    clientSlug,
  };

  if (role === "admin") return access;
  if (role === "client" && clientSlug === slug) return access;
  return null;
}

/**
 * Vereist dat de gebruiker een geldig klantdashboard heeft (admin of klant met
 * bekende slug). Anders: terug naar /portal, waar de "geen toegang"-kaart
 * verschijnt. Gebruik dit voor portal-routes die niet bedoeld zijn voor
 * accounts zonder gekoppelde klant (bv. data-uploaden, instellingen).
 */
export async function requireDashboardAccess(): Promise<UserAccess> {
  const user = await requireUser();
  if (user.role === "admin") return user;
  if (user.role === "client" && getClientConfig(user.clientSlug)) return user;
  redirect("/portal");
}
