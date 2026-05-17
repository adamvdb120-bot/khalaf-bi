import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GeenToegang from "@/components/portal/GeenToegang";
import { CLIENTS, isClientSlug } from "@/lib/clients/config";

export default async function PortalHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Niet ingelogd → layout heeft al naar /login gestuurd, maar defensieve check.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_slug")
    .eq("id", user.id)
    .single();

  // Admins gaan naar het command center.
  if (profile?.role === "admin") {
    redirect("/portal/admin");
  }

  // Klanten met een bekende slug → direct naar hun eigen dashboard.
  if (
    profile?.role === "client" &&
    isClientSlug(profile.client_slug)
  ) {
    redirect(CLIENTS[profile.client_slug].dashboardRoute);
  }

  // Alles daarbuiten (client zonder geldige slug, user-rol, geen profiel):
  // geen dashboardtoegang.
  return <GeenToegang />;
}
