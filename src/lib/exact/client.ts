import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

async function refreshExactToken(admin: Admin, row: Record<string, string>) {
  const res = await fetch("https://start.exactonline.nl/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
      client_id: process.env.EXACT_CLIENT_ID!,
      client_secret: process.env.EXACT_CLIENT_SECRET!,
    }),
  });
  const refreshBody = await res.text();
  if (!res.ok) return { error: refreshBody };

  const tokens = JSON.parse(refreshBody);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await admin.from("exact_tokens").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
  }).eq("client_name", "attiva");
  return { token: tokens.access_token, division: row.division };
}

export async function getValidExactToken(admin: Admin):
  Promise<{ token: string; division: number } | { error: string }> {
  const { data: row, error: dbError } = await admin
    .from("exact_tokens")
    .select("*")
    .eq("client_name", "attiva")
    .single();

  if (dbError || !row) return { error: "Geen token opgeslagen — koppel opnieuw" };

  if (new Date(row.expires_at).getTime() - Date.now() >= 300_000) {
    return { token: row.access_token, division: row.division };
  }

  const result = await refreshExactToken(admin, row);

  if ("error" in result) {
    const { data: fresh } = await admin
      .from("exact_tokens")
      .select("*")
      .eq("client_name", "attiva")
      .single();

    if (fresh && new Date(fresh.expires_at).getTime() - Date.now() > 30_000) {
      return { token: fresh.access_token, division: fresh.division };
    }
    return { error: `Refresh mislukt — koppel opnieuw via Exact Online` };
  }
  return result;
}

export async function exactGet(
  token: string,
  division: number,
  path: string,
  paginate = false
): Promise<unknown[] | null> {
  const baseUrl = `https://start.exactonline.nl/api/v1/${division}/${path}`;
  let url: string | null = baseUrl;
  const allResults: unknown[] = [];

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`Exact GET ${path} faalde: ${res.status}`);
      return null;
    }
    const json = await res.json();
    const results: unknown[] = json?.d?.results ?? [];
    allResults.push(...results);

    if (!paginate) return results;
    url = json?.d?.__next ?? null;
    if (allResults.length > 5000) break; // safety cap
  }
  return allResults;
}
