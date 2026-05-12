"use client";

import { useEffect, useState } from "react";
import {
  Target, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle,
  Settings2, Save, X, RefreshCw, Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Doelen {
  jaar: number;
  omzet_doel: number | null;
  kosten_doel: number | null;
  marge_pct_doel: number | null;
  resultaat_doel: number | null;
  notitie?: string | null;
}

interface Props {
  jaar: number;
  totaalOmzet: number;
  totaalKosten: number;
  margePercent: number;
}

function euro(v: number) {
  return `€ ${Math.round(v).toLocaleString("nl-NL")}`;
}

// Bereken hoeveel % van het jaar voorbij is (op vandaag)
function dagVanJaarPct(jaar: number): number {
  const now = new Date();
  const isHuidigJaar = now.getFullYear() === jaar;
  const isToekomst = jaar > now.getFullYear();
  const isVerleden = jaar < now.getFullYear();

  if (isToekomst) return 0;
  if (isVerleden) return 100;
  if (!isHuidigJaar) return 100;

  const start = new Date(jaar, 0, 1).getTime();
  const eind = new Date(jaar + 1, 0, 1).getTime();
  return ((now.getTime() - start) / (eind - start)) * 100;
}

export default function DoelenVoortgang({
  jaar, totaalOmzet, totaalKosten, margePercent,
}: Props) {
  const [doelen, setDoelen] = useState<Doelen | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status zelf — zodat parent componenten dit niet hoeven door te geven
  useEffect(() => {
    async function checkRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "admin") setIsAdmin(true);
    }
    checkRole();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/attiva/doelen?jaar=${jaar}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!cancelled) setDoelen(json);
      } catch {
        if (!cancelled) setDoelen({ jaar, omzet_doel: null, kosten_doel: null, marge_pct_doel: null, resultaat_doel: null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [jaar, editing]);

  const heeftDoelen = doelen && (
    doelen.omzet_doel !== null ||
    doelen.kosten_doel !== null ||
    doelen.marge_pct_doel !== null ||
    doelen.resultaat_doel !== null
  );

  const jaarVoortgangPct = dagVanJaarPct(jaar);
  const resultaat = totaalOmzet - totaalKosten;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-navy-700 to-navy-600 flex items-center justify-center shadow-sm">
            <Target size={15} className="text-gold-400" />
          </div>
          <div>
            <h3 className="font-bold text-navy-700">Doelen voortgang — {jaar}</h3>
            <p className="text-[11px] text-gray-400">
              {jaarVoortgangPct < 100
                ? `Dag ${Math.round(jaarVoortgangPct * 3.65)} van 365 (${jaarVoortgangPct.toFixed(0)}% van het jaar)`
                : "Jaar voltooid"}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 hover:border-navy-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Settings2 size={12} />
            {heeftDoelen ? "Doelen wijzigen" : "Doelen instellen"}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
          <RefreshCw size={14} className="animate-spin" /> Doelen laden...
        </div>
      )}

      {!loading && !heeftDoelen && (
        <div className="bg-gray-50 rounded-xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-sm">
            <Target size={20} className="text-gold-500" />
          </div>
          <div>
            <p className="font-semibold text-navy-700">Stel je jaardoelen in</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Definieer omzet-, kosten- en marge-doelen voor {jaar}. Het dashboard toont
              dan live of je op koers ligt — geen guess-work meer.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              <Target size={14} />
              Doelen instellen
            </button>
          )}
        </div>
      )}

      {!loading && heeftDoelen && doelen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <DoelKaart
            label="Omzet"
            actual={totaalOmzet}
            target={doelen.omzet_doel}
            jaarVoortgangPct={jaarVoortgangPct}
            hoeHoger="meer is beter"
            format="euro"
            accent="navy"
          />
          <DoelKaart
            label="Kosten"
            actual={totaalKosten}
            target={doelen.kosten_doel}
            jaarVoortgangPct={jaarVoortgangPct}
            hoeHoger="minder is beter"
            format="euro"
            accent="gold"
          />
          <DoelKaart
            label="Marge"
            actual={margePercent}
            target={doelen.marge_pct_doel}
            jaarVoortgangPct={100} // marge is een ratio, niet cumulatief over de tijd
            hoeHoger="meer is beter"
            format="pct"
            accent="emerald"
          />
          <DoelKaart
            label="Resultaat"
            actual={resultaat}
            target={doelen.resultaat_doel}
            jaarVoortgangPct={jaarVoortgangPct}
            hoeHoger="meer is beter"
            format="euro"
            accent="emerald"
          />
        </div>
      )}

      {editing && doelen && (
        <DoelenInstellenModal
          initial={doelen}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ─── Doel-kaartje ──────────────────────────────────────────────────────────────
function DoelKaart({
  label, actual, target, jaarVoortgangPct, hoeHoger, format, accent,
}: {
  label: string;
  actual: number;
  target: number | null;
  jaarVoortgangPct: number;
  hoeHoger: "meer is beter" | "minder is beter";
  format: "euro" | "pct";
  accent: "navy" | "gold" | "emerald" | "red";
}) {
  if (target === null) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm text-gray-400">Geen doel ingesteld</p>
      </div>
    );
  }

  // Verwachte voortgang op dit moment in het jaar
  const verwachtNu = target * (jaarVoortgangPct / 100);

  // % van doel behaald
  const procentBehaald = target > 0 ? (actual / target) * 100 : 0;

  // Pace ratio: actueel vs wat je nu zou moeten hebben
  // >1 = sneller dan verwacht, <1 = langzamer
  const pace = verwachtNu > 0 ? actual / verwachtNu : 0;

  // Status bepalen
  let status: "boven" | "op_koers" | "onder" | "verre_onder";
  if (hoeHoger === "meer is beter") {
    if (pace >= 1.05) status = "boven";
    else if (pace >= 0.95) status = "op_koers";
    else if (pace >= 0.85) status = "onder";
    else status = "verre_onder";
  } else {
    // Voor kosten: minder is beter → omgekeerd
    if (pace <= 0.95) status = "boven";
    else if (pace <= 1.05) status = "op_koers";
    else if (pace <= 1.15) status = "onder";
    else status = "verre_onder";
  }

  const statusStyling: Record<typeof status, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
    boven: { bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700", icon: Trophy, label: "Boven doel" },
    op_koers: { bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700", icon: CheckCircle2, label: "Op koers" },
    onder: { bg: "bg-amber-50 text-amber-700", text: "text-amber-700", icon: AlertTriangle, label: "Achter" },
    verre_onder: { bg: "bg-red-50 text-red-700", text: "text-red-700", icon: AlertTriangle, label: "Ver achter" },
  };
  const s = statusStyling[status];
  const StatusIcon = s.icon;

  const accentBar = {
    navy: status === "boven" || status === "op_koers" ? "bg-navy-700" : status === "onder" ? "bg-amber-500" : "bg-red-500",
    gold: status === "boven" || status === "op_koers" ? "bg-gold-500" : status === "onder" ? "bg-amber-500" : "bg-red-500",
    emerald: status === "boven" || status === "op_koers" ? "bg-emerald-500" : status === "onder" ? "bg-amber-500" : "bg-red-500",
    red: "bg-red-500",
  }[accent];

  const fmt = (v: number) => format === "euro" ? euro(v) : `${v.toFixed(1)}%`;

  // Voor visualisatie: max 100% op de progressbar
  const progressWidth = Math.min(Math.max(procentBehaald, 0), 100);

  return (
    <div className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${s.bg}`}>
          <StatusIcon size={9} />
          {s.label}
        </span>
      </div>

      <p className="text-xl font-bold text-navy-700 leading-tight">{fmt(actual)}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">
        van {fmt(target)} ({procentBehaald.toFixed(0)}%)
      </p>

      {/* Progress bar met "verwacht nu" markering */}
      <div className="mt-3 relative">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${accentBar} rounded-full transition-all`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        {/* "Op deze datum verwacht" marker — alleen voor cumulatieve doelen */}
        {jaarVoortgangPct < 100 && jaarVoortgangPct > 0 && format === "euro" && (
          <div
            className="absolute top-0 -mt-0.5 w-px h-3 bg-gray-700"
            style={{ left: `${jaarVoortgangPct}%` }}
            title={`Verwachte voortgang op dit moment in het jaar: ${jaarVoortgangPct.toFixed(0)}%`}
          />
        )}
      </div>

      {format === "euro" && jaarVoortgangPct > 0 && jaarVoortgangPct < 100 && (
        <p className={`text-[10px] mt-2 ${s.text} flex items-center gap-1`}>
          {pace >= 1 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {pace >= 1
            ? `+${((pace - 1) * 100).toFixed(0)}% op verwachting`
            : `${((pace - 1) * 100).toFixed(0)}% op verwachting`}
        </p>
      )}
    </div>
  );
}

// ─── Modal voor doelen instellen ──────────────────────────────────────────────
function DoelenInstellenModal({
  initial, onClose, onSaved,
}: {
  initial: Doelen;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [omzet, setOmzet] = useState<string>(initial.omzet_doel?.toString() ?? "");
  const [kosten, setKosten] = useState<string>(initial.kosten_doel?.toString() ?? "");
  const [marge, setMarge] = useState<string>(initial.marge_pct_doel?.toString() ?? "");
  const [resultaat, setResultaat] = useState<string>(initial.resultaat_doel?.toString() ?? "");
  const [notitie, setNotitie] = useState<string>(initial.notitie ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/attiva/doelen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jaar: initial.jaar,
          omzet_doel: omzet || null,
          kosten_doel: kosten || null,
          marge_pct_doel: marge || null,
          resultaat_doel: resultaat || null,
          notitie: notitie || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Opslaan mislukt");
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-navy-700 text-lg">Doelen voor {initial.jaar}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Laat leeg om geen doel in te stellen</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <DoelInput
            label="Omzet jaardoel"
            placeholder="bv. 720000"
            unit="€"
            value={omzet}
            onChange={setOmzet}
            hint="Totale omzet die je dit jaar wil halen"
          />
          <DoelInput
            label="Kosten plafond"
            placeholder="bv. 540000"
            unit="€"
            value={kosten}
            onChange={setKosten}
            hint="Maximale kosten die je dit jaar wil maken"
          />
          <DoelInput
            label="Marge-doel"
            placeholder="bv. 25"
            unit="%"
            value={marge}
            onChange={setMarge}
            hint="Gewenste brutomarge in procenten"
          />
          <DoelInput
            label="Resultaat-doel"
            placeholder="bv. 180000"
            unit="€"
            value={resultaat}
            onChange={setResultaat}
            hint="Netto resultaat (omzet − kosten) waar je naar streeft"
          />
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Notitie</label>
            <textarea
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              placeholder="Bv. 'Realistisch op basis van Q1 plan'"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-700/20"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500 hover:text-navy-700 px-4 py-2">Annuleren</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

function DoelInput({
  label, placeholder, unit, value, onChange, hint,
}: {
  label: string;
  placeholder: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{unit}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{hint}</p>
    </div>
  );
}
