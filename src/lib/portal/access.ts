import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
