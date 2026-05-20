"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { RefreshCw, AlertCircle, Users, Wallet, Heart, Pencil, ShieldCheck, AlertTriangle, X, Check, Loader2 } from "lucide-react";
import DashboardChat from "@/components/portal/DashboardChat";
import PinnedChartsSection from "@/components/portal/PinnedChartsSection";
import DownloadPDFButton from "@/components/portal/DownloadPDFButton";

interface DeclaratieData {
  totaal: number;
  perMaand: { maand: string; bedrag: number }[];
  perSoort: { soort: string; bedrag: number }[];
  perPersoon: { naam: string; bedrag: number }[];
}

function euro(v: number | string | undefined) {
  return `€ ${Number(v ?? 0).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}

const MAANDEN_NL: Record<string, string> = {
  "01":"Jan","02":"Feb","03":"Mrt","04":"Apr","05":"Mei","06":"Jun",
  "07":"Jul","08":"Aug","09":"Sep","10":"Okt","11":"Nov","12":"Dec",
};

const SOORT_COLORS: Record<string, string> = {
  "Geleverde zorg": "#1B3A5C",
  "Maandloon": "#C9A84C",
};

const AVATAR_COLORS = [
  "#1B3A5C","#264D73","#3B6EA5","#C9A84C","#D4A843",
  "#4A7FB5","#0F2A45","#E8B84B","#B8962E","#F0C75A",
];

const HUIDIG_JAAR = new Date().getFullYear();
const JAREN = Array.from({ length: HUIDIG_JAAR - 2023 }, (_, i) => 2024 + i);

function initials(naam: string) {
  return naam.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

interface BudgetRow {
  budgethouder: string;
  budget: number;
}

export default function DeclaratiesSection() {
  const [data, setData] = useState<DeclaratieData | null>(null);
  const [vorigData, setVorigData] = useState<DeclaratieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaar, setJaar] = useState<number>(HUIDIG_JAAR);
  const [maand, setMaand] = useState<string | null>(null);
  const [pinnedRefresh, setPinnedRefresh] = useState(0);
  // Budgetten: map van budgethouder → jaarbudget. Lokaal up-to-date gehouden
  // na inline-edit zonder dat we de hele pagina hoeven te reloaden.
  const [budgetten, setBudgetten] = useState<Record<string, number>>({});
  const [editingNaam, setEditingNaam] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingNaam, setSavingNaam] = useState<string | null>(null);

  async function load(j: number) {
    setLoading(true);
    setError(null);
    try {
      const [res, resVorig, resBudg] = await Promise.all([
        fetch(`/api/attiva/declaraties?jaar=${j}`),
        fetch(`/api/attiva/declaraties?jaar=${j - 1}`),
        fetch(`/api/attiva/budgetten?jaar=${j}`),
      ]);
      if (!res.ok) throw new Error(await res.text());
      const [d, dv, budg] = await Promise.all([
        res.json(),
        resVorig.ok ? resVorig.json() : null,
        resBudg.ok ? resBudg.json() : [],
      ]);
      setData(d);
      setVorigData(dv);
      const budMap: Record<string, number> = {};
      for (const row of (budg as BudgetRow[]) ?? []) {
        if (row.budgethouder && typeof row.budget === "number") {
          budMap[row.budgethouder] = row.budget;
        }
      }
      setBudgetten(budMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(jaar); }, [jaar]);
  useEffect(() => { setMaand(null); setEditingNaam(null); }, [jaar]);

  async function saveBudget(budgethouder: string, nieuwBedrag: number) {
    setSavingNaam(budgethouder);
    try {
      const res = await fetch("/api/attiva/budgetten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgethouder, jaar, budget: nieuwBedrag }),
      });
      if (!res.ok) throw new Error(await res.text());
      setBudgetten((prev) => ({ ...prev, [budgethouder]: nieuwBedrag }));
      setEditingNaam(null);
    } catch (e) {
      alert(`Budget opslaan mislukt: ${e instanceof Error ? e.message : "onbekend"}`);
    } finally {
      setSavingNaam(null);
    }
  }

  function startEdit(naam: string) {
    const huidig = budgetten[naam] ?? 0;
    setEditingNaam(naam);
    setEditValue(huidig > 0 ? String(huidig) : "");
  }

  function cancelEdit() {
    setEditingNaam(null);
    setEditValue("");
  }

  const header = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {JAREN.map((j) => (
          <button key={j} onClick={() => setJaar(j)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              jaar === j ? "bg-navy-700 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
            }`}>
            {j}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => load(jaar)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw size={12} /> Vernieuwen
        </button>
        <DownloadPDFButton
          targetId="attiva-declaraties-export"
          filename={`Attiva-Zorg-Declaraties-${jaar}`}
          clientName="Attiva Zorg"
          reportType="Declaratieoverzicht"
          jaar={jaar}
          label="PDF"
        />
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-5">
      {header}
      <div className="grid grid-cols-3 gap-5">
        {[0,1,2].map(i => <div key={i} className="card animate-pulse h-24" />)}
      </div>
      <div className="card animate-pulse h-56" />
    </div>
  );

  if (error) return (
    <div className="space-y-5">
      {header}
      <div className="card flex items-center gap-3 py-8 justify-center">
        <AlertCircle size={20} className="text-red-400" />
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    </div>
  );

  if (!data || data.perMaand.length === 0) return (
    <div className="space-y-5">
      {header}
      <div className="card text-center py-12 text-gray-400 text-sm">Geen declaratiedata voor {jaar}.</div>
    </div>
  );

  // Build display names for months
  const maandNamen = data.perMaand.map(r => MAANDEN_NL[r.maand.slice(5, 7)] ?? r.maand);

  // Month filtering
  const filteredMaandRow = maand
    ? data.perMaand.find(r => (MAANDEN_NL[r.maand.slice(5, 7)] ?? r.maand) === maand)
    : null;

  const displayTotaal = filteredMaandRow ? filteredMaandRow.bedrag : data.totaal;

  const maandGrafiek = data.perMaand.map(r => ({
    maand: MAANDEN_NL[r.maand.slice(5, 7)] ?? r.maand,
    ...Object.fromEntries(
      data.perSoort.map(s => [s.soort, 0])
    ),
    bedrag: r.bedrag,
  }));

  const zorgItem = data.perSoort.find(s => s.soort === "Geleverde zorg");
  const loonItem = data.perSoort.find(s => s.soort === "Maandloon");

  const vorigZorg = vorigData?.perSoort.find(s => s.soort === "Geleverde zorg");
  const vorigLoon = vorigData?.perSoort.find(s => s.soort === "Maandloon");


  const chatContext = [
    `Declaratieoverzicht Attiva Zorg — jaar ${jaar}:`,
    `- Totaal uitbetaald: ${euro(data.totaal)}${vorigData ? ` (vorig jaar ${jaar-1}: ${euro(vorigData.totaal)})` : ""}`,
    `- Geleverde zorg: ${euro(zorgItem?.bedrag ?? 0)}${vorigZorg ? ` (vorig jaar: ${euro(vorigZorg.bedrag)})` : ""}`,
    `- Maandloon: ${euro(loonItem?.bedrag ?? 0)}${vorigLoon ? ` (vorig jaar: ${euro(vorigLoon.bedrag)})` : ""}`,
    `- Aantal cliënten/budgethouders: ${data.perPersoon.length}`,
    ``,
    `Uitbetaald per cliënt (${jaar}):`,
    ...data.perPersoon.map(p => `- ${p.naam}: ${euro(p.bedrag)} (${data.totaal > 0 ? ((p.bedrag/data.totaal)*100).toFixed(1) : 0}%)`),
    ``,
    `Uitbetaald per maand (${jaar}):`,
    ...data.perMaand.map(m => `- ${MAANDEN_NL[m.maand.slice(5,7)] ?? m.maand}: ${euro(m.bedrag)}`),
    ...(vorigData ? [
      ``,
      `Uitbetaald per maand (${jaar - 1}):`,
      ...vorigData.perMaand.map(m => `- ${MAANDEN_NL[m.maand.slice(5,7)] ?? m.maand}: ${euro(m.bedrag)}`),
      ``,
      `Cliënten vorig jaar (${jaar - 1}):`,
      ...vorigData.perPersoon.map(p => `- ${p.naam}: ${euro(p.bedrag)}`),
    ] : []),
  ].join("\n");

  return (
    <div className="space-y-6">
      {/* Gecombineerde filterbalk */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {JAREN.map((j) => (
              <button key={j} onClick={() => setJaar(j)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  jaar === j ? "bg-navy-700 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
                }`}>
                {j}
              </button>
            ))}
          </div>
          {maandNamen.length > 0 && <div className="h-5 w-px bg-gray-200" />}
          {maandNamen.length > 0 && (
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              <button onClick={() => setMaand(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  maand === null ? "bg-navy-700 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
                }`}>
                Heel jaar
              </button>
              {maandNamen.map((m) => (
                <button key={m} onClick={() => setMaand(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    maand === m ? "bg-gold-500 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(jaar)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
            <RefreshCw size={12} /> Vernieuwen
          </button>
          <DownloadPDFButton
            targetId="attiva-declaraties-export"
            filename={`Attiva-Zorg-Declaraties-${jaar}`}
            clientName="Attiva Zorg"
            reportType="Declaratieoverzicht"
            jaar={jaar}
            label="PDF"
          />
        </div>
      </div>

      <div id="attiva-declaraties-export" className="space-y-6 bg-white">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card border-t-4 border-t-navy-700">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center">
              <Wallet size={16} className="text-navy-700" />
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
              {maand ? maand : jaar}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1">
            {maand ? `Uitbetaald ${maand}` : "Totaal uitbetaald"}
          </p>
          <p className="text-2xl font-bold text-navy-700">{euro(displayTotaal)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {maand ? `${((displayTotaal / data.totaal) * 100).toFixed(1)}% van jaartotaal` : `${data.perPersoon.length} budgethouders`}
          </p>
        </div>

        <div className="card border-t-4 border-t-[#1B3A5C]">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center">
              <Heart size={16} className="text-navy-700" />
            </div>
            {zorgItem && data.totaal > 0 && (
              <span className="text-xs font-semibold text-navy-700 bg-navy-700/8 px-2 py-1 rounded-lg">
                {((zorgItem.bedrag / data.totaal) * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-1">Geleverde zorg</p>
          <p className="text-2xl font-bold text-navy-700">{euro(zorgItem?.bedrag ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Incl. reiskosten</p>
        </div>

        <div className="card border-t-4 border-t-gold-500">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center">
              <Users size={16} className="text-gold-500" />
            </div>
            {loonItem && data.totaal > 0 && (
              <span className="text-xs font-semibold text-gold-500 bg-gold-500/10 px-2 py-1 rounded-lg">
                {((loonItem.bedrag / data.totaal) * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-1">Maandloon</p>
          <p className="text-2xl font-bold text-navy-700">{euro(loonItem?.bedrag ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Vaste loonkosten</p>
        </div>
      </div>

      {/* Maand grafiek + donut */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card col-span-2">
          <h3 className="font-bold text-navy-700 mb-5">Uitbetalingen per maand — {jaar}</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={maandGrafiek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="bedrag" name="Uitbetaald" radius={[5,5,0,0]}>
                {maandGrafiek.map((entry, i) => (
                  <Cell key={i} fill={maand === null || maand === entry.maand ? "#1B3A5C" : "#cbd5e1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card flex flex-col justify-between">
          <h3 className="font-bold text-navy-700 mb-2">Verdeling</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={data.perSoort} dataKey="bedrag" nameKey="soort" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                {data.perSoort.map((s) => (
                  <Cell key={s.soort} fill={SOORT_COLORS[s.soort] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-2">
            {data.perSoort.map((s) => (
              <div key={s.soort} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SOORT_COLORS[s.soort] ?? "#94a3b8" }} />
                <span className="text-sm text-gray-600 flex-1">{s.soort}</span>
                <span className="text-sm font-bold text-navy-700">{euro(s.bedrag)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clientenoverzicht — uitbetaald + jaarbudget per cliënt */}
      {/* id voor deep-link uit Wat-vraagt-aandacht budget-meldingen */}
      <div id="clientenoverzicht" className="card scroll-mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-navy-700">Clientenoverzicht</h3>
            <p className="text-xs text-gray-400 mt-0.5">Uitbetaald vs jaarbudget per budgethouder — {jaar}</p>
          </div>
          <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl font-medium">
            {data.perPersoon.length} cliënten
          </span>
        </div>

        {/* Banner: cliënten zonder budget */}
        {(() => {
          const zonderBudget = data.perPersoon.filter(p => !budgetten[p.naam] || budgetten[p.naam] <= 0).length;
          if (zonderBudget === 0) return null;
          return (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
              <span>
                <strong>{zonderBudget}</strong> {zonderBudget === 1 ? "cliënt heeft" : "cliënten hebben"} nog geen jaarbudget — klik het potlood om er één toe te voegen.
              </span>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          {data.perPersoon.map((p, i) => {
            const budget = budgetten[p.naam] ?? 0;
            const hasBudget = budget > 0;
            const pct = hasBudget ? (p.bedrag / budget) * 100 : 0;
            const remaining = budget - p.bedrag;

            // Status bepalen
            let status: { label: string; color: string; bg: string; barColor: string };
            if (!hasBudget) {
              status = { label: "Geen budget", color: "text-gray-500", bg: "bg-gray-100", barColor: "#cbd5e1" };
            } else if (pct >= 100) {
              status = { label: "Over budget", color: "text-red-700", bg: "bg-red-50", barColor: "#dc2626" };
            } else if (pct >= 90) {
              status = { label: "Bijna op", color: "text-orange-700", bg: "bg-orange-50", barColor: "#ea580c" };
            } else if (pct >= 75) {
              status = { label: "Let op", color: "text-amber-700", bg: "bg-amber-50", barColor: "#d97706" };
            } else {
              status = { label: "Ruim binnen budget", color: "text-emerald-700", bg: "bg-emerald-50", barColor: "#10b981" };
            }

            const isEditing = editingNaam === p.naam;
            const isSaving = savingNaam === p.naam;

            return (
              <div key={p.naam} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:border-gray-200 transition-colors">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {initials(p.naam)}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Naam + status badge */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-navy-700 truncate" title={p.naam}>{p.naam}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.color} ${status.bg} flex-shrink-0`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: status.barColor,
                      }}
                    />
                  </div>

                  {/* Bedragen-regel */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">
                      Verbruikt: <strong className="text-navy-700">{euro(p.bedrag)}</strong>
                      {hasBudget && <span className="text-gray-400"> · {pct.toFixed(0)}%</span>}
                    </span>
                    <span className="text-gray-500">
                      {hasBudget && (
                        <>
                          {remaining >= 0
                            ? <>Nog beschikbaar: <strong className="text-navy-700">{euro(remaining)}</strong></>
                            : <>Over budget: <strong className="text-red-700">{euro(Math.abs(remaining))}</strong></>}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Budget-regel met inline edit */}
                  <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-gray-50">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Jaarbudget:</span>
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const v = parseFloat(editValue.replace(",", "."));
                          if (!Number.isNaN(v) && v >= 0) saveBudget(p.naam, v);
                        }}
                        className="flex items-center gap-1 flex-1"
                      >
                        <span className="text-[11px] text-gray-500">€</span>
                        <input
                          autoFocus
                          type="number"
                          step="any"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          disabled={isSaving}
                          className="flex-1 max-w-[120px] text-[11px] border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-navy-700 disabled:opacity-50"
                          placeholder="0"
                        />
                        <button
                          type="submit"
                          disabled={isSaving}
                          aria-label="Opslaan"
                          className="text-emerald-600 hover:bg-emerald-50 rounded p-0.5 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSaving}
                          aria-label="Annuleren"
                          className="text-gray-400 hover:bg-gray-100 rounded p-0.5 disabled:opacity-50"
                        >
                          <X size={12} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="text-[11px] font-bold text-navy-700">
                          {hasBudget ? euro(budget) : <span className="text-gray-400 font-normal italic">niet ingesteld</span>}
                        </span>
                        <button
                          onClick={() => startEdit(p.naam)}
                          aria-label={hasBudget ? "Budget aanpassen" : "Budget toevoegen"}
                          className="text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded p-0.5 transition-colors"
                        >
                          <Pencil size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Jaarvergelijking */}
      {vorigData && vorigData.perMaand.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          {/* Per maand */}
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Uitbetaald per maand — {jaar - 1} vs {jaar}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(() => {
                const vorigMap = Object.fromEntries(vorigData.perMaand.map(r => [MAANDEN_NL[r.maand.slice(5,7)] ?? r.maand, r.bedrag]));
                return data.perMaand.map(r => {
                  const m = MAANDEN_NL[r.maand.slice(5,7)] ?? r.maand;
                  return { maand: m, [jaar]: r.bedrag, [jaar - 1]: vorigMap[m] ?? 0 };
                });
              })()} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="maand" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey={jaar - 1} name={`${jaar - 1}`} radius={[4,4,0,0]}>
                  {data.perMaand.map((r, i) => {
                    const m = MAANDEN_NL[r.maand.slice(5,7)] ?? r.maand;
                    return <Cell key={i} fill={maand === null || maand === m ? "#cbd5e1" : "#e9ecef"} />;
                  })}
                </Bar>
                <Bar dataKey={jaar} name={`${jaar}`} radius={[4,4,0,0]}>
                  {data.perMaand.map((r, i) => {
                    const m = MAANDEN_NL[r.maand.slice(5,7)] ?? r.maand;
                    return <Cell key={i} fill={maand === null || maand === m ? "#1B3A5C" : "#d1d5db"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per soort vergelijking */}
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Soort vergelijking — {jaar - 1} vs {jaar}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(() => {
                const soorten = ["Maandloon", "Geleverde zorg"];
                return soorten.map(s => ({
                  soort: s,
                  [jaar - 1]: vorigData.perSoort.find(r => r.soort === s)?.bedrag ?? 0,
                  [jaar]: data.perSoort.find(r => r.soort === s)?.bedrag ?? 0,
                }));
              })()} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="soort" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey={jaar - 1} name={`${jaar - 1}`} fill="#cbd5e1" radius={[4,4,0,0]} />
                <Bar dataKey={jaar} name={`${jaar}`} fill="#1B3A5C" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      </div>

      <PinnedChartsSection tab="declaraties" refresh={pinnedRefresh} />
      <DashboardChat
        context={chatContext}
        tab="declaraties"
        onChartPinned={() => setPinnedRefresh(r => r + 1)}
      />
    </div>
  );
}
