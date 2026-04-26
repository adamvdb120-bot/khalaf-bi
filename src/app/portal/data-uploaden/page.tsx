"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DataUploadenPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function parseFile(f: File) {
    setFile(f);
    setStatus("parsing");
    setErrorMsg("");

    try {
      const XLSX = await import("xlsx");
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (raw.length === 0) throw new Error("Het bestand bevat geen data.");

      const columns = Object.keys(raw[0]);
      setPreview({ columns, rows: raw.slice(0, 5) });
      setStatus("idle");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Bestand kon niet worden gelezen.");
      setStatus("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  }

  async function handleSave() {
    if (!preview || !file) return;
    setStatus("saving");

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const allRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("uploads").insert({
        user_id: user!.id,
        name: file.name.replace(/\.[^.]+$/, ""),
        rows: allRows,
        columns: preview.columns,
      });

      if (error) throw new Error(error.message);
      setStatus("done");
      setTimeout(() => router.push("/portal"), 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Opslaan mislukt.");
      setStatus("error");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-700">Data uploaden</h1>
        <p className="text-gray-400 mt-1 text-sm">Upload uw Excel of CSV bestand — het dashboard wordt automatisch bijgewerkt.</p>
      </div>

      {/* Upload zone */}
      {!preview && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-200 ${
            dragging ? "border-gold-500 bg-gold-50" : "border-gray-200 hover:border-navy-700 hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
          />
          <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-semibold text-navy-700 mb-1">
            Sleep uw bestand hierheen
          </p>
          <p className="text-sm text-gray-400">of klik om te bladeren</p>
          <p className="text-xs text-gray-300 mt-3">Ondersteund: .xlsx, .xls, .csv</p>
        </div>
      )}

      {status === "parsing" && (
        <div className="text-center py-12 text-gray-400">Bestand wordt ingelezen...</div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Er ging iets mis</p>
            <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
            <button onClick={() => { setStatus("idle"); setFile(null); setPreview(null); }}
              className="text-sm text-red-600 underline mt-2">Opnieuw proberen</button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600" />
          <p className="font-semibold text-green-700">Data opgeslagen! U wordt doorgestuurd...</p>
        </div>
      )}

      {/* Preview */}
      {preview && status !== "done" && (
        <div className="space-y-6">
          {/* Bestand info */}
          <div className="flex items-center justify-between bg-navy-700/5 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-navy-700" />
              <div>
                <p className="font-semibold text-navy-700 text-sm">{file?.name}</p>
                <p className="text-xs text-gray-400">{preview.rows.length} rijen bekeken (max 5 preview) · {preview.columns.length} kolommen</p>
              </div>
            </div>
            <button onClick={() => { setPreview(null); setFile(null); setStatus("idle"); }}
              className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Gevonden kolommen */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-3">Gevonden kolommen</p>
            <div className="flex flex-wrap gap-2">
              {preview.columns.map((col) => (
                <span key={col} className="bg-navy-700 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Data preview tabel */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-3">Eerste 5 rijen</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="text-xs w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {preview.columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left font-semibold text-gray-500 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {preview.columns.map((col) => (
                        <td key={col} className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Opslaan knop */}
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            <Upload size={16} />
            {status === "saving" ? "Opslaan..." : "Data opslaan en dashboard bijwerken"}
          </button>
        </div>
      )}
    </div>
  );
}
