"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck, ChevronDown, ChevronUp, Check, Loader2,
  Circle, CheckCircle2, MessageSquare, Pencil,
} from "lucide-react";

type Status = "open" | "in_verwerking" | "gecontroleerd" | "afgesloten";

interface MaandRow {
  id: string | null;
  client_slug: string;
  jaar: number;
  maand: number;
  status: Status;
  check_boekingen: boolean;
  check_omzet: boolean;
  check_kosten: boolean;
  check_declaraties: boolean;
  check_budgetten: boolean;
  check_crediteuren: boolean;
  check_afwijkingen: boolean;
  check_maandrapport: boolean;
  notitie: string | null;
  aangemaakt_op: string | null;
  gewijzigd_op: string | null;
}

type CheckVeld =
  | "check_boekingen" | "check_omzet" | "check_kosten" | "check_declaraties"
  | "check_budgetten" | "check_crediteuren" | "check_afwijkingen" | "check_maandrapport";

const CHECK_VELDEN: CheckVeld[] = [
  "check_boekingen", "check_omzet", "check_kosten", "check_declaraties",
  "check_budgetten", "check_crediteuren", "check_afwijkingen", "check_maandrapport",
];

const CHECK_LABELS: Record<CheckVeld, string> = {
  check_boekingen: "Boekingen bijgewerkt",
  check_omzet: "Omzet gecontroleerd",
  check_kosten: "Kosten gecontroleerd",
  check_declaraties: "Declaraties gecontroleerd",
  check_budgetten: "Budgetten gecontroleerd",
  check_crediteuren: "Crediteuren gecontroleerd",
  check_afwijkingen: "Afwijkingen verklaard",
  check_maandrapport: "Maandrapport gegenereerd",
};

const MAAND_NAMEN = [
  "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
];

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  in_verwerking: "In verwerking",
  gecontroleerd: "Gecontroleerd",
  afgesloten: "Afgesloten",
};

// Kleur-tokens per status. Background voor het chip + tekstkleur.
const STATUS_STYLES: Record<Status, { bg: string; text: string; border: string; dot: string }> = {
  open:           { bg: "bg-gray-100",    text: "text-gray-600",    border: "border-gray-200",   dot: "bg-gray-400" },
  in_verwerking:  { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-500" },
  gecontroleerd:  { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-500" },
  afgesloten:     { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
};

function aantalKlaar(m: MaandRow): number {
  return CHECK_VELDEN.reduce((n, v) => n + (m[v] ? 1 : 0), 0);
}

interface Props {
  /** Jaar dat de gebruiker op het dashboard heeft geselecteerd. */
  jaar: number;
}

export default function Administratiestatus({ jaar }: Props) {
  const [maanden, setMaanden] = useState<MaandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMaand, setOpenMaand] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  // Standaard ingeklapt — werkmodus-tool, niet de eerste scan. De header toont
  // wel de samenvatting (X/12 afgesloten) zodat de status in één oogopslag duidelijk is.
  const [collapsed, setCollapsed] = useState(true);
  // Notitie-edit state (key = maand)
  const [editingNotitieMaand, setEditingNotitieMaand] = useState<number | null>(null);
  const [notitieValue, setNotitieValue] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attiva/maandafsluiting?jaar=${jaar}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setMaanden((json.maanden as MaandRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    setOpenMaand(null);
    setEditingNotitieMaand(null);
  }, [jaar]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(maand: number, patch: Partial<MaandRow>) {
    setBusy(maand);
    try {
      const res = await fetch("/api/attiva/maandafsluiting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jaar, maand, ...patch }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const updated = json.maand as MaandRow;
      setMaanden((prev) => prev.map(m => m.maand === maand ? updated : m));
    } catch (e) {
      alert(`Bijwerken mislukt: ${e instanceof Error ? e.message : "onbekend"}`);
    } finally {
      setBusy(null);
    }
  }

  function toggleCheck(maand: MaandRow, veld: CheckVeld) {
    patch(maand.maand, { [veld]: !maand[veld] } as Partial<MaandRow>);
  }

  function setStatus(maand: number, status: Status) {
    patch(maand, { status });
  }

  function startEditNotitie(m: MaandRow) {
    setEditingNotitieMaand(m.maand);
    setNotitieValue(m.notitie ?? "");
  }

  async function saveNotitie(maand: number) {
    await patch(maand, { notitie: notitieValue.trim() || null });
    setEditingNotitieMaand(null);
    setNotitieValue("");
  }

  // Samenvatting: hoeveel maanden zijn afgesloten?
  const afgeslotenCount = useMemo(
    () => maanden.filter(m => m.status === "afgesloten").length,
    [maanden]
  );

  return (
    <div className="card">
      {/* Header — klikbaar om in/uit te klappen */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-start justify-between gap-3 w-full text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-navy-700/5 rounded-lg flex items-center justify-center">
            <ClipboardCheck size={14} className="text-navy-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-700">Administratiestatus</h3>
            <p className="text-[10px] text-gray-400">
              {collapsed
                ? (!loading ? `${afgeslotenCount}/12 afgesloten in ${jaar}` : "Laden…")
                : <>Werk achterstanden weg en sluit maanden gecontroleerd af.{!loading && ` · ${afgeslotenCount}/12 afgesloten in ${jaar}`}</>}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 bg-navy-700/5 hover:bg-navy-700/10 px-2.5 py-1.5 rounded-lg flex-shrink-0">
          {collapsed ? <>Openen <ChevronDown size={12} /></> : <>Inklappen <ChevronUp size={12} /></>}
        </span>
      </button>

      {!collapsed && <div className="mt-4">

      {loading && (
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="py-4 text-xs text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <>
          {/* 12-maands raster */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {maanden.map((m) => {
              const stijl = STATUS_STYLES[m.status];
              const klaar = aantalKlaar(m);
              const isOpen = openMaand === m.maand;
              // Counter krijgt zelfde tint als de maandnaam bij niet-open
              // statussen — versterkt het verschil tussen "leeg" en "in
              // uitvoering / klaar / afgesloten" zonder het laten te schreeuwen.
              const counterColor = m.status === "open" ? "text-gray-500" : stijl.text;
              return (
                <button
                  key={m.maand}
                  onClick={() => setOpenMaand(isOpen ? null : m.maand)}
                  className={`rounded-lg border ${stijl.border} ${stijl.bg} p-2 text-left transition-all hover:shadow-sm ${
                    isOpen ? "ring-2 ring-navy-700 shadow-sm" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${stijl.text}`}>
                      {MAAND_NAMEN[m.maand - 1]}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${stijl.dot}`} />
                  </div>
                  <p className={`text-[10px] font-medium ${counterColor}`}>{klaar}/8 klaar</p>
                </button>
              );
            })}
          </div>

          {/* Detail-paneel voor geopende maand */}
          {openMaand !== null && (() => {
            const m = maanden.find(x => x.maand === openMaand);
            if (!m) return null;
            const stijl = STATUS_STYLES[m.status];
            const klaar = aantalKlaar(m);
            const isEditingNotitie = editingNotitieMaand === m.maand;
            const isBusy = busy === m.maand;
            return (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/40 p-4">
                {/* Detail-header */}
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-sm font-bold text-navy-700">
                      {MAAND_NAMEN[m.maand - 1]} {m.jaar}
                    </h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stijl.text} ${stijl.bg}`}>
                      {STATUS_LABELS[m.status]}
                    </span>
                    {/* Voortgang: progressbar + counter geeft tastbaar gevoel */}
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy-700 rounded-full transition-all"
                          style={{ width: `${(klaar / 8) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500">{klaar}/8</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenMaand(null)}
                    className="text-[10px] font-semibold text-gray-500 hover:text-navy-700 inline-flex items-center gap-1"
                  >
                    <ChevronUp size={12} />
                    Sluiten
                  </button>
                </div>

                {/* Checklist */}
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4">
                  {CHECK_VELDEN.map((veld) => {
                    const aan = m[veld];
                    return (
                      <button
                        key={veld}
                        onClick={() => toggleCheck(m, veld)}
                        disabled={isBusy}
                        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white text-left transition-colors disabled:opacity-50"
                      >
                        {aan ? (
                          <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Circle size={15} className="text-gray-300 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${aan ? "text-gray-500 line-through" : "text-navy-700"}`}>
                          {CHECK_LABELS[veld]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Notitie */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Managementnotitie
                  </p>
                  {isEditingNotitie ? (
                    <div className="flex items-start gap-1.5">
                      <textarea
                        autoFocus
                        value={notitieValue}
                        onChange={(e) => setNotitieValue(e.target.value)}
                        placeholder="Bv. April afgerond. Omzetdaling verklaard door cliënt A. Duale."
                        rows={2}
                        disabled={isBusy}
                        className="flex-1 text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-navy-700 resize-none disabled:opacity-50"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => saveNotitie(m.maand)}
                          disabled={isBusy}
                          aria-label="Notitie opslaan"
                          className="text-emerald-600 hover:bg-emerald-50 rounded p-0.5 disabled:opacity-50"
                        >
                          {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        </button>
                        <button
                          onClick={() => { setEditingNotitieMaand(null); setNotitieValue(""); }}
                          disabled={isBusy}
                          aria-label="Annuleren"
                          className="text-gray-400 hover:bg-gray-100 rounded p-0.5 disabled:opacity-50"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    </div>
                  ) : m.notitie ? (
                    <button
                      onClick={() => startEditNotitie(m)}
                      className="flex items-start gap-1.5 text-left w-full hover:bg-white rounded p-1.5 transition-colors group"
                    >
                      <MessageSquare size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700 italic flex-1">{m.notitie}</span>
                      <Pencil size={10} className="text-gray-300 group-hover:text-navy-700 flex-shrink-0 mt-1" />
                    </button>
                  ) : (
                    <button
                      onClick={() => startEditNotitie(m)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-navy-700 transition-colors"
                    >
                      <MessageSquare size={10} />
                      Notitie toevoegen
                    </button>
                  )}
                </div>

                {/* Status-keuze */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Status
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {(["open", "in_verwerking", "gecontroleerd", "afgesloten"] as Status[]).map((s) => {
                      const stijlS = STATUS_STYLES[s];
                      const actief = m.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(m.maand, s)}
                          disabled={isBusy}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-colors disabled:opacity-50 ${
                            actief
                              ? `${stijlS.bg} ${stijlS.text} border ${stijlS.border}`
                              : "bg-white text-gray-500 hover:text-navy-700 border border-gray-200"
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    Tip: als je alle 8 checks afvinkt, gaat de status automatisch naar &ldquo;Gecontroleerd&rdquo;.
                    &ldquo;Afgesloten&rdquo; blijft handmatig zodat jij bepaalt wanneer een maand echt dicht is.
                  </p>
                </div>
              </div>
            );
          })()}
        </>
      )}

      </div>}
    </div>
  );
}
