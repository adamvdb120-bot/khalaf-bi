# Khalaf BI – Setup Handleiding

## Vereisten

- **Node.js 18+** – Download op https://nodejs.org
- **Supabase account** – Gratis op https://supabase.com
- **Azure account** – Voor Power BI Embedded (https://portal.azure.com)
- **Power BI Pro of Premium** licentie voor embed

---

## Stap 1 – Node.js installeren

Download en installeer Node.js van https://nodejs.org (kies "LTS").
Controleer na installatie in de terminal:
```
node --version
npm --version
```

---

## Stap 2 – Project starten

```bash
cd C:\Users\adama\khalaf-bi
npm install
npm run dev
```

De website draait nu op http://localhost:3000

---

## Stap 3 – Supabase instellen

1. Ga naar https://supabase.com en maak een nieuw project aan
2. Ga naar **Project Settings → API** en kopieer:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Ga naar **SQL Editor** en voer `supabase/schema.sql` uit
4. Ga naar **Authentication → Users** en maak een gebruiker aan voor uw klant

---

## Stap 4 – Azure AD Service Principal voor Power BI

1. Ga naar https://portal.azure.com → **Azure Active Directory → App registrations**
2. Klik **New registration** → geef naam "KhalafBI-App"
3. Kopieer **Application (client) ID** → `POWERBI_CLIENT_ID`
4. Kopieer **Directory (tenant) ID** → `POWERBI_TENANT_ID`
5. Ga naar **Certificates & secrets → New client secret** → kopieer waarde → `POWERBI_CLIENT_SECRET`
6. Ga naar Power BI Admin Portal → **Tenant settings → Developer settings**
   → Schakel "Service principals can use Fabric APIs" in voor uw security group

---

## Stap 5 – Power BI Workspace koppelen

1. Open Power BI op https://app.powerbi.com
2. Ga naar uw Workspace → **Settings → Access** → voeg de Service Principal toe als **Member**
3. Kopieer de **Workspace ID** uit de URL → `POWERBI_WORKSPACE_ID`
4. Open een rapport → kopieer het **Report ID** uit de URL

---

## Stap 6 – .env.local invullen

Open `C:\Users\adama\khalaf-bi\.env.local` en vul alle waarden in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
POWERBI_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POWERBI_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POWERBI_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
POWERBI_WORKSPACE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Stap 7 – Rapport toevoegen aan database

In Supabase Dashboard → SQL Editor:

```sql
INSERT INTO public.reports (user_id, name, description, workspace_id, powerbi_report_id)
VALUES (
  'uuid-van-klant-uit-auth-users',
  'Financieel Dashboard',
  'Omzet, brutomarge en cashflow',
  'uw-workspace-id',
  'uw-report-id'
);
```

---

## Stap 8 – Live zetten op Vercel

1. Maak een account op https://vercel.com
2. Koppel uw GitHub repository
3. Voeg alle `.env.local` variabelen toe in Vercel → **Settings → Environment Variables**
4. Deploy!

---

## Structuur

```
src/
├── app/
│   ├── (marketing)/       ← Publieke website
│   │   ├── page.tsx       ← Homepage
│   │   ├── diensten/
│   │   ├── over-ons/
│   │   └── contact/
│   ├── login/             ← Klant login
│   ├── portal/            ← Afgeschermd klantportaal
│   │   ├── page.tsx       ← Dashboard overzicht
│   │   ├── rapporten/
│   │   └── rapport/[id]/  ← Power BI rapport view
│   └── api/powerbi/       ← Backend: genereert embed tokens
├── components/
│   ├── marketing/         ← Navbar, Hero, Features, etc.
│   └── portal/            ← Sidebar, PowerBIEmbed
└── lib/supabase/          ← Client + server Supabase helpers
```
