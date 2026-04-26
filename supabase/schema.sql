-- ============================================================
-- Khalaf BI – Supabase database schema
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Klanten (gekoppeld aan Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company     text NOT NULL,
  sector      text,
  created_at  timestamptz DEFAULT now()
);

-- Power BI rapporten per klant
CREATE TABLE IF NOT EXISTS public.reports (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name               text NOT NULL,
  description        text,
  workspace_id       text NOT NULL,  -- Power BI workspace (groep) ID
  powerbi_report_id  text NOT NULL,  -- Het rapport ID binnen Power BI
  created_at         timestamptz DEFAULT now()
);

-- Row Level Security: elke gebruiker ziet alleen zijn eigen rapporten
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen client zien" ON public.clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Eigen rapporten zien" ON public.reports
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Voorbeeld: voeg een testrapport toe voor een bestaande user
-- ============================================================
-- INSERT INTO public.reports (user_id, name, description, workspace_id, powerbi_report_id)
-- VALUES (
--   'vervang-met-user-uuid',
--   'Financieel Dashboard',
--   'Omzet, brutomarge en cashflow per maand',
--   'vervang-met-workspace-id',
--   'vervang-met-report-id'
-- );
