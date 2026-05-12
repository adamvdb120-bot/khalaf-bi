"use client";

import {
  TrendingUp, TrendingDown, AlertTriangle, Wallet, Sparkles,
  ArrowUpRight, ArrowDownRight, Calendar, Award, Zap,
} from "lucide-react";

interface MaandRow { maand: string; omzet: number; kosten: number; marge: number }
interface CategorieRow { name: string; value: number }
interface Crediteur { Name: string; Age0to30: number; Age31to60: number; Age61to90: number; Age90Plus: number; totaal: number }

export interface ActivityEvent {
  id: string;
  type: "groei" | "daling" | "alarm" | "milestone" | "categorie" | "crediteur";
  titel: string;
  beschrijving: string;
  cijfer?: string;
  cijferKleur?: "emerald" | "red" | "amber" | "navy";
  tijdLabel: string; // "Deze maand", "Vorige week", etc.
}

interface Props {
  maandData: MaandRow[];
  vorigMaandData: MaandRow[];
  kostenPerCategorie: CategorieRow[];
  omzetPerCategorie: CategorieRow[];
  topCrediteuren: Crediteur[];
  jaar: number;
}

function euro(v: number) {
  return `€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}

function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`;
}

const TYPE_ICONS: Record<ActivityEvent["type"], typeof TrendingUp> = {
  groei: TrendingUp,
  daling: TrendingDown,
  alarm: AlertTriangle,
  milestone: Award,
  categorie: Zap,
  crediteur: Wallet,
};

const TYPE_KLEUREN: Record<ActivityEvent["type"], { bg: string; ring: string; icon: string }> = {
  groei: { bg: "bg-emerald-50", ring: "ring-emerald-200", icon: "text-emerald-600" },
  daling: { bg: "bg-red-50", ring: "ring-red-200", icon: "text-red-600" },
  alarm: { bg: "bg-red-50", ring: "ring-red-200", icon: "text-red-600" },
  milestone: { bg: "bg-gold-500/10", ring: "ring-gold-500/30", icon: "text-gold-600" },
  categorie: { bg: "bg-blue-50", ring: "ring-blue-200", icon: "text-blue-600" },
  crediteur: { bg: "bg-amber-50", ring: "ring-amber-200", icon: "text-amber-600" },
};

const CIJFER_KLEUREN: Record<NonNullable<ActivityEvent["cijferKleur"]>, string> = {
  emerald: "text-emerald-600",
  red: "text-red-600",
  amber: "text-amber-600",
  navy: "text-navy-700",
};

function genereerEvents(props: Props): ActivityEvent[] {
  const { maandData, vorigMaandData, kostenPerCategorie, omzetPerCategorie, topCrediteuren, jaar } = props;
  const events: ActivityEvent[] = [];

  if (maandData.length === 0) return [];

  // 1) Laatste maand vs één-na-laatste (delta-event)
  if (maandData.length >= 2) {
    const laatste = maandData[maandData.length - 1];
    const vorige = maandData[maandData.length - 2];

    // Omzet-verandering
    const omzetDiff = vorige.omzet > 0 ? ((laatste.omzet - vorige.omzet) / vorige.omzet) * 100 : 0;
    if (Math.abs(omzetDiff) >= 5) {
      const isGroei = omzetDiff > 0;
      events.push({
        id: `omzet-mom-${laatste.maand}`,
        type: isGroei ? "groei" : "daling",
        titel: `Omzet ${isGroei ? "gestegen" : "gedaald"} in ${laatste.maand}`,
        beschrijving: `${pct(omzetDiff)} t.o.v. ${vorige.maand} (${euro(laatste.omzet - vorige.omzet)} verschil)`,
        cijfer: pct(omzetDiff),
        cijferKleur: isGroei ? "emerald" : "red",
        tijdLabel: `${laatste.maand} ${jaar}`,
      });
    }

    // Kosten-verandering
    const kostenDiff = vorige.kosten > 0 ? ((laatste.kosten - vorige.kosten) / vorige.kosten) * 100 : 0;
    if (Math.abs(kostenDiff) >= 8) {
      const isStijging = kostenDiff > 0;
      events.push({
        id: `kosten-mom-${laatste.maand}`,
        type: isStijging ? "alarm" : "groei",
        titel: `Kosten ${isStijging ? "gestegen" : "gedaald"} in ${laatste.maand}`,
        beschrijving: `${pct(kostenDiff)} t.o.v. ${vorige.maand} (${euro(laatste.kosten - vorige.kosten)} verschil)`,
        cijfer: pct(kostenDiff),
        cijferKleur: isStijging ? "red" : "emerald",
        tijdLabel: `${laatste.maand} ${jaar}`,
      });
    }
  }

  // 2) Best ever maand-milestone
  if (maandData.length >= 3) {
    const laatste = maandData[maandData.length - 1];
    const eerderMax = Math.max(...maandData.slice(0, -1).map(m => m.omzet));
    if (laatste.omzet > eerderMax && eerderMax > 0) {
      events.push({
        id: `record-${laatste.maand}`,
        type: "milestone",
        titel: `Beste omzetmaand tot nu toe`,
        beschrijving: `${laatste.maand} ${jaar} is de hoogste omzetmaand: ${euro(laatste.omzet)}`,
        cijfer: euro(laatste.omzet),
        cijferKleur: "navy",
        tijdLabel: `${laatste.maand} ${jaar}`,
      });
    }

    // Slechtste maand?
    const eerderMin = Math.min(...maandData.slice(0, -1).map(m => m.marge));
    if (laatste.marge < eerderMin && laatste.marge < 0) {
      events.push({
        id: `verlies-${laatste.maand}`,
        type: "alarm",
        titel: `Negatief resultaat in ${laatste.maand}`,
        beschrijving: `Kosten overstegen omzet — ${euro(Math.abs(laatste.marge))} verlies`,
        cijfer: euro(laatste.marge),
        cijferKleur: "red",
        tijdLabel: `${laatste.maand} ${jaar}`,
      });
    }
  }

  // 3) Crediteuren die nu urgent zijn
  const urgentCrediteuren = topCrediteuren.filter(c => c.Age90Plus > 0).slice(0, 2);
  for (const c of urgentCrediteuren) {
    events.push({
      id: `cred-${c.Name}`,
      type: "crediteur",
      titel: `Urgent: ${c.Name}`,
      beschrijving: `${euro(c.Age90Plus)} staat langer dan 90 dagen open — actie nodig`,
      cijfer: euro(c.Age90Plus),
      cijferKleur: "amber",
      tijdLabel: ">90 dagen",
    });
  }

  // 4) Grootste kostenpost als categorie-spotlight
  if (kostenPerCategorie.length > 0) {
    const top = kostenPerCategorie[0];
    const totaalKosten = kostenPerCategorie.reduce((s, k) => s + k.value, 0);
    const aandeel = totaalKosten > 0 ? (top.value / totaalKosten) * 100 : 0;
    if (aandeel >= 30) {
      events.push({
        id: `kosten-top-${top.name}`,
        type: "categorie",
        titel: `${top.name} is de grootste kostenpost`,
        beschrijving: `${aandeel.toFixed(0)}% van totale kosten dit jaar — ${euro(top.value)}`,
        cijfer: `${aandeel.toFixed(0)}%`,
        cijferKleur: "navy",
        tijdLabel: `${jaar}`,
      });
    }
  }

  // 5) Omzet-concentratie waarschuwing
  if (omzetPerCategorie.length > 0) {
    const top = omzetPerCategorie[0];
    const totaalOmzet = omzetPerCategorie.reduce((s, k) => s + k.value, 0);
    const aandeel = totaalOmzet > 0 ? (top.value / totaalOmzet) * 100 : 0;
    if (aandeel >= 70) {
      events.push({
        id: `omzet-concentratie-${top.name}`,
        type: "alarm",
        titel: `Omzet sterk afhankelijk van ${top.name}`,
        beschrijving: `${aandeel.toFixed(0)}% van je omzet komt uit één categorie — concentratierisico`,
        cijfer: `${aandeel.toFixed(0)}%`,
        cijferKleur: "amber",
        tijdLabel: `${jaar}`,
      });
    }
  }

  return events.slice(0, 8); // max 8 events
}

export default function ActivityFeed(props: Props) {
  const events = genereerEvents(props);

  if (events.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-navy-700/10 flex items-center justify-center">
            <Calendar size={15} className="text-navy-700" />
          </div>
          <div>
            <h3 className="font-bold text-navy-700">Recent gebeurd</h3>
            <p className="text-[11px] text-gray-400">Highlights en veranderingen</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 text-center py-6">
          Nog onvoldoende data voor een tijdlijn. Activity verschijnt zodra je meerdere maanden hebt.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-navy-700 to-navy-600 flex items-center justify-center shadow-sm">
            <Calendar size={15} className="text-gold-400" />
          </div>
          <div>
            <h3 className="font-bold text-navy-700">Recent gebeurd</h3>
            <p className="text-[11px] text-gray-400">{events.length} highlights uit je cijfers</p>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-100" />

        <div className="space-y-4">
          {events.map((event) => {
            const Icon = TYPE_ICONS[event.type];
            const kleur = TYPE_KLEUREN[event.type];
            return (
              <div key={event.id} className="relative flex items-start gap-4 pl-0">
                <div className={`relative z-10 w-8 h-8 rounded-full ${kleur.bg} ring-4 ring-white flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className={kleur.icon} />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-start justify-between gap-3 mb-0.5">
                    <p className="font-semibold text-sm text-navy-700 leading-snug">{event.titel}</p>
                    {event.cijfer && (
                      <span className={`text-sm font-bold flex-shrink-0 ${event.cijferKleur ? CIJFER_KLEUREN[event.cijferKleur] : "text-navy-700"}`}>
                        {event.cijfer.startsWith("+") ? <ArrowUpRight size={11} className="inline mb-0.5" /> :
                         event.cijfer.startsWith("-") ? <ArrowDownRight size={11} className="inline mb-0.5" /> : null}
                        {event.cijfer}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{event.beschrijving}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-1">{event.tijdLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hide unused warnings
void Sparkles;
