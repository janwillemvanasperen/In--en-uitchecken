# Snelstart Gids

## 🚀 Stap-voor-stap Setup

### 1️⃣ Dependencies installeren (al gedaan)

```bash
npm install
```

### 2️⃣ Supabase Project aanmaken

1. Ga naar [supabase.com](https://supabase.com)
2. Klik op "New Project"
3. Vul de gegevens in:
   - **Name**: Aanwezigheidsregistratie
   - **Database Password**: Kies een sterk wachtwoord
   - **Region**: Kies een regio dichtbij (bijv. eu-central-1)
4. Klik op "Create new project"
5. Wacht tot het project klaar is (~2 minuten)

### 3️⃣ Database Migrations uitvoeren

1. Ga naar je Supabase project dashboard
2. Klik in het linker menu op **SQL Editor**
3. Klik op **New query**

#### Migration 1: Schema
1. Open in je code editor: `supabase/migrations/20240101000000_initial_schema.sql`
2. Kopieer de VOLLEDIGE inhoud
3. Plak in de SQL Editor
4. Klik op **Run** (of Ctrl/Cmd + Enter)
5. Wacht op "Success" bericht

#### Migration 2: RLS Policies
1. Open in je code editor: `supabase/migrations/20240101000001_rls_policies.sql`
2. Kopieer de VOLLEDIGE inhoud
3. Plak in een nieuwe SQL query
4. Klik op **Run**
5. Wacht op "Success" bericht

### 4️⃣ API Keys ophalen

1. Klik in het linker menu op **Project Settings** (tandwiel icoon)
2. Klik op **API**
3. Kopieer deze twee waarden:
   - **Project URL** (onder Project URL)
   - **anon public** key (onder Project API keys)

### 5️⃣ Environment Variabelen configureren

1. Open `.env.local` in je code editor
2. Vervang de placeholder waarden:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jouwprojectid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6️⃣ Authentication configureren

1. Ga naar **Authentication** in het Supabase menu
2. Klik op **Providers**
3. Zorg dat **Email** enabled is
4. Klik op **URL Configuration**
5. Voeg toe aan **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```

### 7️⃣ App starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 8️⃣ Eerste Admin Account aanmaken

1. Ga naar [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
2. Vul in:
   - Naam: Je naam
   - Email: Je email
   - Wachtwoord: Minimaal 6 tekens
3. Klik op "Registreren"

4. **Maak jezelf admin:**
   - Ga naar Supabase Dashboard
   - Klik op **Table Editor** in het menu
   - Klik op de **users** tabel
   - Vind je account
   - Klik op de **role** cel
   - Verander `student` naar `admin`
   - Druk op Enter

5. **Log opnieuw in:**
   - Klik op "Uitloggen"
   - Log opnieuw in
   - Je wordt nu doorgestuurd naar het Admin Dashboard

## ✅ Verificatie

Je setup is succesvol als:
- ✅ Je kunt inloggen zonder errors
- ✅ Je wordt doorgestuurd naar /admin/dashboard of /student/dashboard
- ✅ Je ziet je naam in de header
- ✅ Geen console errors in de browser

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Check of je de juiste URL en key hebt gekopieerd
- Check of er geen spaties voor/na de waarden staan in .env.local
- Herstart de dev server (`Ctrl+C` en dan `npm run dev`)

### Error: "relation does not exist"
- De migrations zijn niet uitgevoerd
- Voer beide migrations opnieuw uit in SQL Editor

### Error: "Failed to fetch"
- Check of de Supabase project URL correct is
- Check of je internet connectie werkt

### Kan niet inloggen na registratie
- Check of email confirmation vereist is:
  - Ga naar Supabase > Authentication > Providers
  - Bij Email provider, schakel "Confirm email" uit voor development

### Redirect loop bij inloggen
- Clear browser cookies voor localhost:3000
- Check of de middleware correct werkt
- Herstart de dev server

## 🎯 Volgende Stappen

Na succesvolle setup:

1. **Test locatie toevoegen** (als admin):
   - Ga naar Admin Dashboard
   - Klik op "Beheer locaties"
   - Voeg een test locatie toe

2. **Test student account**:
   - Maak een tweede account aan (als student)
   - Test de student dashboard

3. **Bekijk de database**:
   - Open Supabase Table Editor
   - Bekijk de verschillende tabellen
   - Check of de triggers werken (updated_at wordt automatisch gezet)

## 📚 Handige Links

- [Supabase Docs](https://supabase.com/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🆘 Hulp nodig?

Als je vast loopt:
1. Check de browser console voor errors (F12)
2. Check de terminal voor server errors
3. Check de Supabase logs (Logs menu in dashboard)
4. Vraag om hulp met de specifieke error message
