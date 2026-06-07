import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const { data, error } = await sb.from("profiles").select("*").limit(3);
if (error) { console.error(error); process.exit(1); }
console.log("Kolommen:", data[0] ? Object.keys(data[0]).join(", ") : "(geen rijen)");
for (const r of data) {
  const safe = { ...r };
  console.log(JSON.stringify(safe));
}
