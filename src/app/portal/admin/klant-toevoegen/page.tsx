"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, UserPlus, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const KLANT_OPTIES = [
  { slug: "attiva", label: "Attiva Zorg" },
  { slug: "areys", label: "Areys Restaurant" },
  { slug: "quba", label: "Markaz Quba" },
];

export default function KlantToevoegenPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", company: "", client_slug: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/admin/klant-aanmaken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Er ging iets mis.");
      setStatus("error");
    } else {
      setStatus("done");
      setTimeout(() => router.push("/portal/admin/klanten"), 1500);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/portal/admin/klanten"
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-navy-700 mb-6 transition-colors">
        <ChevronLeft size={16} /> Terug naar klanten
      </Link>

      <h1 className="text-3xl font-bold text-navy-700 mb-1">Klant toevoegen</h1>
      <p className="text-gray-400 text-sm mb-8">
        De klant ontvangt toegang tot het portaal met het ingestelde wachtwoord.
      </p>

      {status === "done" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
          <CheckCircle2 size={20} className="text-green-600" />
          <p className="text-green-700 font-semibold">Klant aangemaakt! U wordt doorgestuurd...</p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Naam *</label>
            <input name="full_name" required value={form.full_name} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
              placeholder="Jan de Vries" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bedrijf</label>
            <input name="company" value={form.company} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
              placeholder="Restaurant De Hoek" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">E-mailadres *</label>
          <input name="email" type="email" required value={form.email} onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
            placeholder="klant@bedrijf.nl" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Wachtwoord *</label>
          <input name="password" type="password" required minLength={8} value={form.password} onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
            placeholder="Minimaal 8 tekens" />
          <p className="text-xs text-gray-400 mt-1">Deel dit wachtwoord veilig met uw klant.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Toegang tot dashboard *
          </label>
          <select
            name="client_slug"
            required
            value={form.client_slug}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition bg-white"
          >
            <option value="">— Kies een klantdashboard —</option>
            {KLANT_OPTIES.map((k) => (
              <option key={k.slug} value={k.slug}>
                {k.label} ({k.slug})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Deze gebruiker krijgt <strong>alleen</strong> toegang tot het geselecteerde dashboard.
          </p>
        </div>

        <button type="submit" disabled={status === "loading" || status === "done"}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
          <UserPlus size={16} />
          {status === "loading" ? "Aanmaken..." : "Klant aanmaken"}
        </button>
      </form>
    </div>
  );
}
