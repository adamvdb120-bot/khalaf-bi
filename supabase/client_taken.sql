-- ═══════════════════════════════════════════════════════════════════════════
-- Tabel: client_taken — takenlijst per klant
-- Run eenmalig in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.client_taken (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug     text          NOT NULL,
  titel           text          NOT NULL,
  beschrijving    text,
  notitie         text,
  bedrag          numeric,
  status          text          NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'gedaan', 'genegeerd')),
  -- 'manual' (gebruiker zelf aangemaakt), of later: 'attention', 'ai',
  -- 'budget', 'creditor', etc. — zodat we kunnen filteren waar een taak
  -- vandaan kwam zonder de business-logic te hardcoden.
  source          text          NOT NULL DEFAULT 'manual',
  aangemaakt_op   timestamptz   NOT NULL DEFAULT now(),
  gewijzigd_op   timestamptz   NOT NULL DEFAULT now(),
  voltooid_op    timestamptz
);

-- Veel queries filteren op slug + status → samengestelde index houdt het snel
CREATE INDEX IF NOT EXISTS idx_client_taken_slug_status
  ON public.client_taken (client_slug, status);

-- RLS aan; geen policies → alleen service_role kan erbij. De API-routes
-- handelen toegang af via requireClientAccess (admin alles, klant eigen slug).
-- Zelfde patroon als attiva_pgb_budgetten en attiva_declaraties.
ALTER TABLE public.client_taken ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificatie — run apart om te checken
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'client_taken'
-- ORDER BY ordinal_position;
