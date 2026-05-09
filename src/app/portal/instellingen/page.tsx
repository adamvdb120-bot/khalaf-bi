"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User, Mail, Shield, Calendar, Lock, CheckCircle2, AlertCircle,
  Save, RefreshCw, Plug, Bell,
} from "lucide-react";

interface ProfileData {
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface ExactStatus {
  connected: boolean;
  expires_at?: string;
  minutes_until_expiry?: number;
  is_expired?: boolean;
  is_expiring_soon?: boolean;
  created_at?: string;
  division?: number;
}

export default function InstellingenPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Exact status (admin only)
  const [exactStatus, setExactStatus] = useState<ExactStatus | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, role, created_at")
        .eq("id", user.id)
        .single();

      const p: ProfileData = {
        email: user.email ?? "",
        full_name: profileData?.full_name ?? "",
        role: profileData?.role ?? "user",
        created_at: profileData?.created_at ?? user.created_at ?? "",
      };
      setProfile(p);
      setFullName(p.full_name);

      // Exact-status alleen voor admin
      if (p.role === "admin") {
        const res = await fetch("/api/exact/status");
        if (res.ok) {
          const json = await res.json();
          setExactStatus(json);
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleProfileSave() {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Opslaan mislukt");
      setProfileMsg({ type: "success", text: "Naam succesvol bijgewerkt" });
      if (profile) setProfile({ ...profile, full_name: fullName });
    } catch (e) {
      setProfileMsg({ type: "error", text: e instanceof Error ? e.message : "Onbekende fout" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave() {
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Wachtwoord moet minimaal 8 tekens zijn" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Wachtwoorden komen niet overeen" });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Wijzigen mislukt");
      setPasswordMsg({ type: "success", text: "Wachtwoord succesvol gewijzigd" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPasswordMsg({ type: "error", text: e instanceof Error ? e.message : "Onbekende fout" });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="card animate-pulse h-72 flex items-center justify-center gap-3 text-gray-300">
        <RefreshCw size={20} className="animate-spin" />
        <span className="text-sm">Instellingen laden...</span>
      </div>
    );
  }

  if (!profile) {
    return <div className="card text-center text-gray-400 py-16">Geen profiel gevonden.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-navy-700">Instellingen</h1>
        <p className="text-gray-500 mt-1">Beheer je account, profiel en koppelingen</p>
      </div>

      {/* Account info */}
      <div className="card">
        <h2 className="font-bold text-navy-700 mb-5 flex items-center gap-2">
          <User size={18} />
          Accountgegevens
        </h2>
        <div className="space-y-3">
          <InfoRow icon={<Mail size={14} className="text-gray-400" />} label="E-mail" value={profile.email} />
          <InfoRow
            icon={<Shield size={14} className="text-gray-400" />}
            label="Rol"
            value={
              profile.role === "admin"
                ? <span className="inline-flex items-center gap-1 text-[11px] bg-gold-500/15 text-gold-600 px-2 py-0.5 rounded-full font-semibold">
                    <Shield size={10} /> Admin
                  </span>
                : <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                    Gebruiker
                  </span>
            }
          />
          <InfoRow
            icon={<Calendar size={14} className="text-gray-400" />}
            label="Lid sinds"
            value={profile.created_at ? new Date(profile.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "—"}
          />
        </div>
      </div>

      {/* Profiel */}
      <div className="card">
        <h2 className="font-bold text-navy-700 mb-1 flex items-center gap-2">
          <User size={18} />
          Profiel
        </h2>
        <p className="text-sm text-gray-500 mb-5">Hoe je naam in het portaal verschijnt</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Volledige naam</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adam Khalaf"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-colors text-sm"
            />
          </div>

          {profileMsg && <FormMessage msg={profileMsg} />}

          <button
            onClick={handleProfileSave}
            disabled={savingProfile || fullName === profile.full_name}
            className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {savingProfile ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Opslaan
          </button>
        </div>
      </div>

      {/* Wachtwoord */}
      <div className="card">
        <h2 className="font-bold text-navy-700 mb-1 flex items-center gap-2">
          <Lock size={18} />
          Wachtwoord wijzigen
        </h2>
        <p className="text-sm text-gray-500 mb-5">Minimaal 8 tekens</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nieuw wachtwoord</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Bevestig nieuw wachtwoord</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-colors text-sm"
            />
          </div>

          {passwordMsg && <FormMessage msg={passwordMsg} />}

          <button
            onClick={handlePasswordSave}
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {savingPassword ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Wachtwoord wijzigen
          </button>
        </div>
      </div>

      {/* Exact koppeling — alleen admin */}
      {profile.role === "admin" && (
        <div className="card">
          <h2 className="font-bold text-navy-700 mb-1 flex items-center gap-2">
            <Plug size={18} />
            Exact Online koppeling
          </h2>
          <p className="text-sm text-gray-500 mb-5">Status van de Attiva Zorg API-koppeling</p>

          {!exactStatus ? (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-400">Status laden...</div>
          ) : !exactStatus.connected ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-700 font-semibold">Geen koppeling actief</p>
              <a href="/api/exact/auth" className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                Koppel Exact Online
              </a>
            </div>
          ) : (
            <div className="rounded-xl p-4 border bg-emerald-50 border-emerald-100 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">Verbonden met Exact Online</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">Division</p>
                  <p className="font-semibold text-navy-700">{exactStatus.division}</p>
                </div>
                <div>
                  <p className="text-gray-500">Gekoppeld op</p>
                  <p className="font-semibold text-navy-700">
                    {exactStatus.created_at
                      ? new Date(exactStatus.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-700/70 leading-relaxed">
                Toegangstokens worden automatisch ververst. Als je toch problemen hebt met data
                ophalen, klik dan op &quot;Opnieuw koppelen&quot;.
              </p>
              <div className="pt-2 border-t border-white/40">
                <a href="/api/exact/auth"
                  className="inline-flex items-center gap-2 text-xs text-navy-700 hover:text-navy-600 font-semibold">
                  <RefreshCw size={12} /> Opnieuw koppelen
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* E-mailvoorkeuren — placeholder */}
      <div className="card">
        <h2 className="font-bold text-navy-700 mb-1 flex items-center gap-2">
          <Bell size={18} />
          E-mailvoorkeuren
        </h2>
        <p className="text-sm text-gray-500 mb-4">Welke updates je wilt ontvangen</p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
          <p className="font-semibold text-navy-700 mb-1">Binnenkort beschikbaar</p>
          <p className="text-xs">
            Je krijgt straks de keuze: maandelijks PDF-rapport, urgent crediteuren-alerts,
            of helemaal stil. Voor nu: alle automatische e-mails staan standaard aan.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm text-navy-700 font-medium">{value}</div>
    </div>
  );
}

function FormMessage({ msg }: { msg: { type: "success" | "error"; text: string } }) {
  return (
    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
      msg.type === "success"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
        : "bg-red-50 text-red-700 border border-red-100"
    }`}>
      {msg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {msg.text}
    </div>
  );
}
