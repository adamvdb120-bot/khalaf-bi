"use client";

import { useEffect, useState } from "react";
import {
  ListChecks, Plus, Check, X, Trash2, Loader2, MessageSquare,
  CheckCircle2, Circle, MinusCircle, Pencil,
} from "lucide-react";

type Status = "open" | "gedaan" | "genegeerd";

interface Taak {
  id: string;
  client_slug: string;
  titel: string;
  beschrijving: string | null;
  notitie: string | null;
  bedrag: number | null;
  status: Status;
  source: string;
  aangemaakt_op: string;
  gewijzigd_op: string;
  voltooid_op: string | null;
}

function euro(v: number) {
  return `€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}

interface TakenlijstProps {
  /**
   * Wanneer deze waarde verandert haalt de Takenlijst zijn data opnieuw op.
   * Wordt door AttivaCharts opgehoogd na een '+ Taak'-klik in WatVraagtAandacht,
   * zodat de net aangemaakte taak direct in de lijst verschijnt.
   */
  refreshKey?: number;
}

export default function Takenlijst({ refreshKey = 0 }: TakenlijstProps) {
  const [taken, setTaken] = useState<Taak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status>("open");

  // Inline add-form
  const [addingOpen, setAddingOpen] = useState(false);
  const [newTitel, setNewTitel] = useState("");
  const [newBeschrijving, setNewBeschrijving] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline edit-states per taak-id
  const [editingNotitieId, setEditingNotitieId] = useState<string | null>(null);
  const [notitieValue, setNotitieValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attiva/taken");
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setTaken(json.taken ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function addTaak() {
    const titel = newTitel.trim();
    if (!titel) return;
    setSaving(true);
    try {
      const res = await fetch("/api/attiva/taken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel,
          beschrijving: newBeschrijving.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setTaken((prev) => [json.taak, ...prev]);
      setNewTitel("");
      setNewBeschrijving("");
      setAddingOpen(false);
    } catch (e) {
      alert(`Aanmaken mislukt: ${e instanceof Error ? e.message : "onbekend"}`);
    } finally {
      setSaving(false);
    }
  }

  async function updateTaak(id: string, patch: Partial<Taak>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/attiva/taken/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setTaken((prev) => prev.map(t => t.id === id ? json.taak : t));
    } catch (e) {
      alert(`Bijwerken mislukt: ${e instanceof Error ? e.message : "onbekend"}`);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTaak(id: string) {
    if (!confirm("Deze taak verwijderen?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/attiva/taken/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setTaken((prev) => prev.filter(t => t.id !== id));
    } catch (e) {
      alert(`Verwijderen mislukt: ${e instanceof Error ? e.message : "onbekend"}`);
    } finally {
      setBusyId(null);
    }
  }

  function startEditNotitie(t: Taak) {
    setEditingNotitieId(t.id);
    setNotitieValue(t.notitie ?? "");
  }

  async function saveNotitie(id: string) {
    await updateTaak(id, { notitie: notitieValue.trim() ? notitieValue.trim() : null });
    setEditingNotitieId(null);
    setNotitieValue("");
  }

  const gefilterd = taken.filter(t => t.status === filter);
  const aantalPerStatus: Record<Status, number> = {
    open: taken.filter(t => t.status === "open").length,
    gedaan: taken.filter(t => t.status === "gedaan").length,
    genegeerd: taken.filter(t => t.status === "genegeerd").length,
  };

  // Compacte lege staat — zonder taken nemen header + filtertabs + lege-tekst
  // onnodig veel ruimte in. Toon dan alleen een slanke balk met de toevoeg-knop.
  // Zodra de gebruiker op toevoegen klikt valt 'ie door naar de volledige kaart.
  if (!loading && !error && taken.length === 0 && !addingOpen) {
    return (
      <div className="card flex items-center justify-between gap-3 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-navy-700/5 rounded-lg flex items-center justify-center">
            <ListChecks size={14} className="text-navy-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-700">Takenlijst</h3>
            <p className="text-[10px] text-gray-400">Geen open taken</p>
          </div>
        </div>
        <button
          onClick={() => setAddingOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-700/5 hover:bg-navy-700/10 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={12} />
          Taak toevoegen
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-navy-700/5 rounded-lg flex items-center justify-center">
            <ListChecks size={14} className="text-navy-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-700">Takenlijst</h3>
            <p className="text-[10px] text-gray-400">
              {aantalPerStatus.open} open · {aantalPerStatus.gedaan} gedaan
            </p>
          </div>
        </div>

        <button
          onClick={() => setAddingOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-700/5 hover:bg-navy-700/10 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={12} />
          Taak toevoegen
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {(["open", "gedaan", "genegeerd"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              filter === s ? "bg-white text-navy-700 shadow-sm" : "text-gray-500 hover:text-navy-700"
            }`}
          >
            {s === "open" ? "Open" : s === "gedaan" ? "Gedaan" : "Genegeerd"}
            <span className="ml-1 text-gray-400">{aantalPerStatus[s]}</span>
          </button>
        ))}
      </div>

      {/* Inline add-form */}
      {addingOpen && (
        <div className="mb-4 rounded-xl border border-navy-700/20 bg-navy-700/5 p-3 space-y-2">
          <input
            autoFocus
            type="text"
            value={newTitel}
            onChange={(e) => setNewTitel(e.target.value)}
            placeholder="Wat moet er gebeuren?"
            className="w-full text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-navy-700"
            disabled={saving}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) addTaak(); }}
          />
          <textarea
            value={newBeschrijving}
            onChange={(e) => setNewBeschrijving(e.target.value)}
            placeholder="Korte beschrijving (optioneel)"
            rows={2}
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-navy-700 resize-none"
            disabled={saving}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setAddingOpen(false); setNewTitel(""); setNewBeschrijving(""); }}
              disabled={saving}
              className="text-xs font-semibold text-gray-500 hover:text-navy-700 px-3 py-1.5 disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              onClick={addTaak}
              disabled={saving || !newTitel.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-navy-700 hover:bg-navy-600 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Lijst */}
      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {error && (
        <p className="py-4 text-xs text-red-600">{error}</p>
      )}

      {!loading && !error && gefilterd.length === 0 && (
        <div className="py-8 text-center text-xs text-gray-400">
          {filter === "open"
            ? "Geen openstaande taken. Voeg er één toe met de knop rechtsboven."
            : filter === "gedaan"
            ? "Nog niets afgevinkt."
            : "Geen genegeerde taken."}
        </div>
      )}

      {!loading && !error && gefilterd.length > 0 && (
        <div className="space-y-2">
          {gefilterd.map((t) => (
            <TaakRij
              key={t.id}
              taak={t}
              busy={busyId === t.id}
              isEditingNotitie={editingNotitieId === t.id}
              notitieValue={notitieValue}
              onNotitieChange={setNotitieValue}
              onStartEditNotitie={() => startEditNotitie(t)}
              onSaveNotitie={() => saveNotitie(t.id)}
              onCancelEditNotitie={() => { setEditingNotitieId(null); setNotitieValue(""); }}
              onMarkGedaan={() => updateTaak(t.id, { status: "gedaan" })}
              onMarkGenegeerd={() => updateTaak(t.id, { status: "genegeerd" })}
              onHeropen={() => updateTaak(t.id, { status: "open" })}
              onDelete={() => deleteTaak(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaakRijProps {
  taak: Taak;
  busy: boolean;
  isEditingNotitie: boolean;
  notitieValue: string;
  onNotitieChange: (v: string) => void;
  onStartEditNotitie: () => void;
  onSaveNotitie: () => void;
  onCancelEditNotitie: () => void;
  onMarkGedaan: () => void;
  onMarkGenegeerd: () => void;
  onHeropen: () => void;
  onDelete: () => void;
}

function TaakRij({
  taak, busy, isEditingNotitie, notitieValue, onNotitieChange,
  onStartEditNotitie, onSaveNotitie, onCancelEditNotitie,
  onMarkGedaan, onMarkGenegeerd, onHeropen, onDelete,
}: TaakRijProps) {
  const isOpen = taak.status === "open";
  const isGedaan = taak.status === "gedaan";

  return (
    <div className={`rounded-xl border p-3 ${
      isGedaan
        ? "border-gray-100 bg-gray-50/60 opacity-70"
        : "border-gray-100 bg-white hover:border-gray-200"
    } transition-colors`}>
      <div className="flex items-start gap-3">
        {/* Status-toggle (links) */}
        <button
          onClick={isGedaan ? onHeropen : onMarkGedaan}
          disabled={busy}
          aria-label={isGedaan ? "Heropenen" : "Markeer als gedaan"}
          className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isGedaan ? (
            <CheckCircle2 size={18} className="text-emerald-600" />
          ) : (
            <Circle size={18} />
          )}
        </button>

        {/* Inhoud */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isGedaan ? "text-gray-500 line-through" : "text-navy-700"}`}>
                {taak.titel}
              </p>
              {taak.beschrijving && (
                <p className="text-xs text-gray-500 mt-0.5">{taak.beschrijving}</p>
              )}
            </div>
            {taak.bedrag !== null && (
              <span className="text-xs font-semibold text-navy-700 opacity-80 flex-shrink-0 mt-0.5">
                {euro(taak.bedrag)}
              </span>
            )}
          </div>

          {/* Notitie (collapsed of edit) */}
          {isEditingNotitie ? (
            <div className="mt-2 flex items-start gap-1.5">
              <textarea
                autoFocus
                value={notitieValue}
                onChange={(e) => onNotitieChange(e.target.value)}
                placeholder="Notitie toevoegen…"
                rows={2}
                className="flex-1 text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-navy-700 resize-none"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={onSaveNotitie}
                  aria-label="Notitie opslaan"
                  className="text-emerald-600 hover:bg-emerald-50 rounded p-0.5"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={onCancelEditNotitie}
                  aria-label="Annuleren"
                  className="text-gray-400 hover:bg-gray-100 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : taak.notitie ? (
            <button
              onClick={onStartEditNotitie}
              className="mt-2 flex items-start gap-1.5 text-left w-full hover:bg-gray-50 rounded p-1 -ml-1 transition-colors group"
            >
              <MessageSquare size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-gray-600 italic flex-1">{taak.notitie}</span>
              <Pencil size={10} className="text-gray-300 group-hover:text-navy-700 flex-shrink-0 mt-1" />
            </button>
          ) : (
            <button
              onClick={onStartEditNotitie}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-navy-700 transition-colors"
            >
              <MessageSquare size={10} />
              Notitie toevoegen
            </button>
          )}

          {/* Acties */}
          <div className="mt-2 flex items-center gap-1.5">
            {isOpen && (
              <button
                onClick={onMarkGenegeerd}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                <MinusCircle size={10} />
                Negeren
              </button>
            )}
            {!isOpen && (
              <button
                onClick={onHeropen}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-navy-700 transition-colors disabled:opacity-50"
              >
                <Circle size={10} />
                Heropenen
              </button>
            )}
            <button
              onClick={onDelete}
              disabled={busy}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 ml-auto"
            >
              <Trash2 size={10} />
              Verwijderen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
