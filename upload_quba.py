import urllib.request, json, uuid

SUPABASE_URL = "https://bviyqkxyyqdcqlalibhe.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2aXlxa3h5eXFkY3FsYWxpYmhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQzMDc2NSwiZXhwIjoyMDkyMDA2NzY1fQ.5ZhSFt4awSKkU3QItBMfVoUTvyxJ_t3DMGeWZq4kOdg"

# Haal admin user_id op
def supabase_get(path):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def supabase_post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=body,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Haal admin profiel op
profiles = supabase_get("profiles?role=eq.admin&select=id&limit=1")
admin_id = profiles[0]["id"]
print(f"Admin ID: {admin_id}")

# Kosten data Ramadan 2026
kosten_rows = [
    {"Leverancier": "Emin Food Cash en Carry", "Bedrag": 10623.68, "Categorie": "Inkoop"},
    {"Leverancier": "Salaris", "Bedrag": 10000.00, "Categorie": "Personeel"},
    {"Leverancier": "RAE Trading BV", "Bedrag": 5274.49, "Categorie": "Inkoop"},
    {"Leverancier": "Afval", "Bedrag": 2457.38, "Categorie": "Facilitair"},
    {"Leverancier": "Threestarr", "Bedrag": 2805.38, "Categorie": "Inkoop"},
    {"Leverancier": "Jawda", "Bedrag": 2060.61, "Categorie": "Inkoop"},
    {"Leverancier": "Lidl", "Bedrag": 1616.65, "Categorie": "Inkoop"},
    {"Leverancier": "Heman", "Bedrag": 1393.01, "Categorie": "Facilitair"},
    {"Leverancier": "Onvoorziene kosten", "Bedrag": 1000.00, "Categorie": "Overig"},
    {"Leverancier": "Jumbo", "Bedrag": 839.19, "Categorie": "Inkoop"},
    {"Leverancier": "Banketbakkerij", "Bedrag": 585.00, "Categorie": "Inkoop"},
    {"Leverancier": "Master Car Rent", "Bedrag": 447.00, "Categorie": "Transport"},
    {"Leverancier": "Schoonmaak Tapijt", "Bedrag": 400.00, "Categorie": "Facilitair"},
    {"Leverancier": "Heijman Schoonmaak", "Bedrag": 338.23, "Categorie": "Facilitair"},
    {"Leverancier": "Sanvir Groenten", "Bedrag": 316.56, "Categorie": "Inkoop"},
    {"Leverancier": "Tango", "Bedrag": 291.15, "Categorie": "Transport"},
    {"Leverancier": "Hooyo Kitchen", "Bedrag": 220.00, "Categorie": "Inkoop"},
    {"Leverancier": "Aldi", "Bedrag": 174.64, "Categorie": "Inkoop"},
    {"Leverancier": "Kruidvat", "Bedrag": 166.50, "Categorie": "Facilitair"},
    {"Leverancier": "AH", "Bedrag": 75.76, "Categorie": "Inkoop"},
    {"Leverancier": "Hornbach", "Bedrag": 68.80, "Categorie": "Facilitair"},
    {"Leverancier": "Media Markt", "Bedrag": 66.99, "Categorie": "Facilitair"},
    {"Leverancier": "Action", "Bedrag": 63.11, "Categorie": "Facilitair"},
    {"Leverancier": "Ikea", "Bedrag": 57.91, "Categorie": "Facilitair"},
    {"Leverancier": "ABC", "Bedrag": 84.00, "Categorie": "Inkoop"},
    {"Leverancier": "AGF Overtoom", "Bedrag": 266.60, "Categorie": "Inkoop"},
    {"Leverancier": "Makro", "Bedrag": 700.78, "Categorie": "Inkoop"},
    {"Leverancier": "Autokosten", "Bedrag": 154.20, "Categorie": "Transport"},
    {"Leverancier": "Suhoor", "Bedrag": 29.94, "Categorie": "Inkoop"},
    {"Leverancier": "Hanos", "Bedrag": 24.08, "Categorie": "Inkoop"},
    {"Leverancier": "Overig kosten", "Bedrag": 32.50, "Categorie": "Overig"},
]

# Bezoekers data
bezoekers_rows = [
    {"Datum": "2026-02-18", "Dag": "Woensdag", "Mannen": 210, "Vrouwen": 50, "Totaal": 260},
    {"Datum": "2026-02-19", "Dag": "Donderdag", "Mannen": 240, "Vrouwen": 40, "Totaal": 280},
    {"Datum": "2026-02-20", "Dag": "Vrijdag", "Mannen": 285, "Vrouwen": 70, "Totaal": 355},
    {"Datum": "2026-02-21", "Dag": "Zaterdag", "Mannen": 300, "Vrouwen": 105, "Totaal": 405},
    {"Datum": "2026-02-22", "Dag": "Zondag", "Mannen": 290, "Vrouwen": 95, "Totaal": 385},
    {"Datum": "2026-02-23", "Dag": "Maandag", "Mannen": 276, "Vrouwen": 116, "Totaal": 392},
    {"Datum": "2026-02-24", "Dag": "Dinsdag", "Mannen": 275, "Vrouwen": 80, "Totaal": 355},
    {"Datum": "2026-02-25", "Dag": "Woensdag", "Mannen": 250, "Vrouwen": 45, "Totaal": 295},
    {"Datum": "2026-02-26", "Dag": "Donderdag", "Mannen": 280, "Vrouwen": 165, "Totaal": 445},
    {"Datum": "2026-02-27", "Dag": "Vrijdag", "Mannen": 275, "Vrouwen": 65, "Totaal": 340},
    {"Datum": "2026-02-28", "Dag": "Zaterdag", "Mannen": 282, "Vrouwen": 175, "Totaal": 457},
    {"Datum": "2026-03-01", "Dag": "Zondag", "Mannen": 270, "Vrouwen": 75, "Totaal": 345},
    {"Datum": "2026-03-02", "Dag": "Maandag", "Mannen": 226, "Vrouwen": 56, "Totaal": 282},
    {"Datum": "2026-03-03", "Dag": "Dinsdag", "Mannen": 214, "Vrouwen": 55, "Totaal": 269},
    {"Datum": "2026-03-04", "Dag": "Woensdag", "Mannen": 217, "Vrouwen": 45, "Totaal": 262},
    {"Datum": "2026-03-05", "Dag": "Donderdag", "Mannen": 226, "Vrouwen": 75, "Totaal": 301},
    {"Datum": "2026-03-06", "Dag": "Vrijdag", "Mannen": 272, "Vrouwen": 70, "Totaal": 342},
    {"Datum": "2026-03-07", "Dag": "Zaterdag", "Mannen": 275, "Vrouwen": 101, "Totaal": 376},
    {"Datum": "2026-03-08", "Dag": "Zondag", "Mannen": 251, "Vrouwen": 70, "Totaal": 321},
    {"Datum": "2026-03-09", "Dag": "Maandag", "Mannen": 240, "Vrouwen": 60, "Totaal": 300},
    {"Datum": "2026-03-10", "Dag": "Dinsdag", "Mannen": 221, "Vrouwen": 60, "Totaal": 281},
    {"Datum": "2026-03-11", "Dag": "Woensdag", "Mannen": 225, "Vrouwen": 70, "Totaal": 295},
    {"Datum": "2026-03-12", "Dag": "Donderdag", "Mannen": 260, "Vrouwen": 75, "Totaal": 335},
    {"Datum": "2026-03-13", "Dag": "Vrijdag", "Mannen": 285, "Vrouwen": 105, "Totaal": 390},
    {"Datum": "2026-03-14", "Dag": "Zaterdag", "Mannen": 290, "Vrouwen": 80, "Totaal": 370},
    {"Datum": "2026-03-15", "Dag": "Zondag", "Mannen": 295, "Vrouwen": 135, "Totaal": 430},
    {"Datum": "2026-03-16", "Dag": "Maandag", "Mannen": 230, "Vrouwen": 65, "Totaal": 295},
    {"Datum": "2026-03-17", "Dag": "Dinsdag", "Mannen": 245, "Vrouwen": 65, "Totaal": 310},
    {"Datum": "2026-03-18", "Dag": "Woensdag", "Mannen": 275, "Vrouwen": 67, "Totaal": 342},
    {"Datum": "2026-03-19", "Dag": "Donderdag", "Mannen": 225, "Vrouwen": 50, "Totaal": 275},
]

# Upload kosten
result1 = supabase_post("uploads", {
    "id": str(uuid.uuid4()),
    "user_id": admin_id,
    "name": "Markaz_Quba_Ramadan_Kosten_2026",
    "columns": ["Leverancier", "Bedrag", "Categorie"],
    "rows": kosten_rows,
})
kosten_id = result1[0]["id"]
print(f"Kosten upload ID: {kosten_id}")

# Upload bezoekers
result2 = supabase_post("uploads", {
    "id": str(uuid.uuid4()),
    "user_id": admin_id,
    "name": "Markaz_Quba_Ramadan_Bezoekers_2026",
    "columns": ["Datum", "Dag", "Mannen", "Vrouwen", "Totaal"],
    "rows": bezoekers_rows,
})
bezoekers_id = result2[0]["id"]
print(f"Bezoekers upload ID: {bezoekers_id}")
print("\nKlaar! Gebruik deze IDs in de Markaz Quba dashboard.")
