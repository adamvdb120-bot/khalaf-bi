-- ═══════════════════════════════════════════════════════════════════════════
-- Tabel: client_maandafsluiting — administratiestatus per maand per klant.
-- Run eenmalig in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.client_maandafsluiting (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug         text          NOT NULL,
  jaar                int           NOT NULL CHECK (jaar BETWEEN 2020 AND 2050),
  maand               int           NOT NULL CHECK (maand BETWEEN 1 AND 12),

  status              text          NOT NULL DEFAULT 'open'
                                    CHECK (status IN ('open', 'in_verwerking', 'gecontroleerd', 'afgesloten')),

  -- 8 checklist-velden, allemaal default false.
  -- Volgorde matcht de UI-volgorde van controles.
  check_boekingen       boolean     NOT NULL DEFAULT false,
  check_omzet           boolean     NOT NULL DEFAULT false,
  check_kosten          boolean     NOT NULL DEFAULT false,
  check_declaraties     boolean     NOT NULL DEFAULT false,
  check_budgetten       boolean     NOT NULL DEFAULT false,
  check_crediteuren     boolean     NOT NULL DEFAULT false,
  check_afwijkingen     boolean     NOT NULL DEFAULT false,
  check_maandrapport    boolean     NOT NULL DEFAULT false,

  notitie             text,

  aangemaakt_op       timestamptz   NOT NULL DEFAULT now(),
  gewijzigd_op        timestamptz   NOT NULL DEFAULT now(),

  -- Eén rij per maand per klant per jaar.
  UNIQUE (client_slug, jaar, maand)
);

-- Veel queries lopen op slug + jaar (alle 12 maanden ophalen) → composite index.
CREATE INDEX IF NOT EXISTS idx_client_maandafsluiting_slug_jaar
  ON public.client_maandafsluiting (client_slug, jaar);

-- RLS aan; geen policies → alleen service_role kan erbij. De API-routes
-- handelen toegang af via checkClientAccess (admin alles, klant eigen slug).
-- Zelfde patroon als client_taken, attiva_pgb_budgetten, etc.
ALTER TABLE public.client_maandafsluiting ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificatie — run apart om te checken
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'client_maandafsluiting'
-- ORDER BY ordinal_position;
