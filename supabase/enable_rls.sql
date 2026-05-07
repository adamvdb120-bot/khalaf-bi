-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY FIX: Enable Row-Level Security on all public tables
-- Run this once in Supabase SQL Editor
-- Geverifieerd tegen schema.sql + actuele code
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Enable RLS op alle tabellen
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exact_tokens            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exact_data_cache        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attiva_pinned_charts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attiva_pgb_budgetten    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attiva_declaraties      ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) Policies — alleen voor tabellen die de BROWSER direct aanspreekt
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── profiles: gebruiker leest eigen profiel (id = auth.uid()) ────────────
DROP POLICY IF EXISTS "users read own profile" ON public.profiles;
CREATE POLICY "users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ─── uploads: gebruiker leest + insert eigen uploads ──────────────────────
DROP POLICY IF EXISTS "users read own uploads" ON public.uploads;
CREATE POLICY "users read own uploads"
  ON public.uploads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users insert own uploads" ON public.uploads;
CREATE POLICY "users insert own uploads"
  ON public.uploads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─── clients: eigen client (user_id direct gekoppeld) ─────────────────────
DROP POLICY IF EXISTS "Eigen client zien" ON public.clients;
DROP POLICY IF EXISTS "users read own client" ON public.clients;
CREATE POLICY "users read own client"
  ON public.clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ─── reports: eigen rapporten (user_id direct gekoppeld) ──────────────────
DROP POLICY IF EXISTS "Eigen rapporten zien" ON public.reports;
DROP POLICY IF EXISTS "users read own reports" ON public.reports;
CREATE POLICY "users read own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) Server-only tabellen: GEEN policies → alleen service_role kan erbij
--    (exact_tokens, exact_data_cache, attiva_pinned_charts,
--     attiva_pgb_budgetten, attiva_declaraties)
--    Service role bypassed RLS automatisch — je API routes blijven werken.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) Verificatie — run apart om te checken
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' ORDER BY tablename;
