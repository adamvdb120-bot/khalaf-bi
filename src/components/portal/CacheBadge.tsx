"use client";

import { Cloud, CheckCircle2 } from "lucide-react";

/**
 * Toont leeftijd van data + of het uit cache komt of vers gefetched.
 * Gebruik vanuit X-Cache + X-Cache-Age headers van /api/exact/data.
 */
export function CacheBadge({
  cacheStatus,
  ageSeconds,
}: {
  cacheStatus: "HIT" | "MISS" | null;
  ageSeconds: number | null;
}) {
  if (!cacheStatus) return null;

  const isHit = cacheStatus === "HIT";
  const ageLabel = ageSeconds !== null ? formatAge(ageSeconds) : null;

  return (
    <span
      title={isHit
        ? `Data uit cache · ${ageLabel ?? "onbekend hoe oud"}`
        : "Verse data direct uit Exact Online opgehaald"}
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
        isHit
          ? "bg-blue-50 text-blue-700 border border-blue-100"
          : "bg-emerald-50 text-emerald-700 border border-emerald-100"
      }`}
    >
      {isHit ? <Cloud size={10} /> : <CheckCircle2 size={10} />}
      {isHit ? `Cache · ${ageLabel ?? "?"}` : "Vers"}
    </span>
  );
}

function formatAge(seconds: number): string {
  if (seconds < 60) return "net nu";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} uur`;
  return `${Math.round(seconds / 86400)} dagen`;
}
