import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
// anon key = wat de browser/login gebruikt
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false } });

const { data, error } = await sb.auth.signInWithPassword({ email: "docent@khalaf-bi.nl", password: "AttivaDemo2026!" });
if (error) { console.error("✗ LOGIN MISLUKT:", error.message); process.exit(1); }
console.log("✓ Login werkt. user id:", data.user.id, "| email bevestigd:", !!data.user.email_confirmed_at);
