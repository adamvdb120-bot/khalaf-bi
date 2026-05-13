-- ═══════════════════════════════════════════════════════════════════════════
-- Migratie: voeg client_slug toe aan profiles tabel
-- Doel: klant-specifieke toegangscontrole (Attiva-user kan alleen Attiva zien)
-- Run dit in Supabase SQL Editor één keer
-- ═══════════════════════════════════════════════════════════════════════════

-- Kolom toevoegen (NULL voor admins, gevuld voor klanten)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_slug text;

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_profiles_client_slug
  ON public.profiles(client_slug);

-- ── Backfill bestaande klantprofielen op basis van naam/email/company ─────
-- Pas aan als je specifieke gebruikers anders wilt mappen
UPDATE public.profiles
SET client_slug = 'attiva'
WHERE LOWER(COALESCE(company, '') || ' ' || COALESCE(full_name, '')) LIKE '%attiva%'
  AND role = 'client'
  AND client_slug IS NULL;

UPDATE public.profiles
SET client_slug = 'areys'
WHERE LOWER(COALESCE(company, '') || ' ' || COALESCE(full_name, '')) LIKE '%areys%'
  AND role = 'client'
  AND client_slug IS NULL;

UPDATE public.profiles
SET client_slug = 'quba'
WHERE LOWER(COALESCE(company, '') || ' ' || COALESCE(full_name, '')) LIKE '%quba%'
  AND role = 'client'
  AND client_slug IS NULL;

-- ── Verificatie ──────────────────────────────────────────────────────────
-- Run dit apart om te controleren:
-- SELECT id, full_name, company, role, client_slug FROM public.profiles ORDER BY role, created_at;
