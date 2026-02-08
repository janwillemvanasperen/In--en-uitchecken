# 🚀 Deployment naar Vercel

## Snelle Deployment Guide

### Voordat je begint

Je hebt nodig:
1. ✅ GitHub account (heb je al)
2. ⚠️ Supabase project met API keys
3. ⚠️ Vercel account (gratis)

## Stap 1: Supabase Project Opzetten (5 minuten)

### 1.1 Project aanmaken
1. Ga naar [supabase.com](https://supabase.com)
2. Klik "New Project"
3. Vul in:
   - **Name**: Aanwezigheidsregistratie
   - **Database Password**: Kies een sterk wachtwoord (bewaar dit!)
   - **Region**: Europe (eu-central-1)
4. Klik "Create new project"
5. ⏰ Wacht 2 minuten tot project klaar is

### 1.2 Database Migrations Uitvoeren

1. Klik in menu op **SQL Editor**
2. Klik **New query**

**Migration 1 - Schema:**
- Open `supabase/migrations/20240101000000_initial_schema.sql` in je editor
- Kopieer ALLES
- Plak in SQL Editor
- Klik **Run** (of Ctrl+Enter)
- Wacht op ✅ "Success"

**Migration 2 - Policies:**
- Klik weer **New query**
- Open `supabase/migrations/20240101000001_rls_policies.sql` in je editor
- Kopieer ALLES
- Plak in SQL Editor
- Klik **Run**
- Wacht op ✅ "Success"

### 1.3 API Keys Ophalen

1. Klik **⚙️ Project Settings** (linker menu)
2. Klik **API**
3. **Kopieer en bewaar** deze 2 waarden:
   ```
   Project URL: https://jouwprojectid.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIs... (lange string)
   ```

### 1.4 Authentication Configureren

1. Klik **Authentication** in menu
2. Klik **URL Configuration**
3. Onder **Redirect URLs**, klik **Add URL**
4. Voeg toe:
   ```
   https://jouwapp.vercel.app/auth/callback
   ```
   ⚠️ Je krijgt de exacte URL na Vercel deployment - pas dit later aan!

## Stap 2: Vercel Deployment (5 minuten)

### 2.1 Account Aanmaken
1. Ga naar [vercel.com](https://vercel.com)
2. Klik **Sign Up**
3. Kies **Continue with GitHub**
4. Authoriseer Vercel

### 2.2 Project Importeren

1. Klik **Add New...** > **Project**
2. Klik **Import** bij je "In--en-uitchecken" repository
3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2.3 Environment Variables Toevoegen

Klik **Environment Variables** en voeg toe:

**Variable 1:**
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: [plak je Supabase Project URL]
- ✅ Check Production, Preview, Development

**Variable 2:**
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: [plak je Supabase anon key]
- ✅ Check Production, Preview, Development

### 2.4 Deploy!

1. Klik **Deploy**
2. ⏰ Wacht 2-3 minuten
3. Bij ✅ **Success**, klik **Visit** of kopieer de URL

### 2.5 Supabase Redirect URL Updaten

1. Kopieer je Vercel URL (bijv: `https://in-en-uitchecken-abc123.vercel.app`)
2. Ga terug naar **Supabase Dashboard**
3. **Authentication** > **URL Configuration** > **Redirect URLs**
4. Voeg toe: `https://jouw-vercel-url.vercel.app/auth/callback`
5. Klik **Save**

## Stap 3: Testen

1. Open je Vercel URL
2. Klik **Registreren**
3. Maak een account aan
4. ✅ Als dit werkt, is alles succesvol!

### Eerste Admin Account Maken

1. Ga naar **Supabase Dashboard**
2. **Table Editor** > **users** table
3. Vind je account
4. Klik op **role** cel
5. Verander naar `admin`
6. Log opnieuw in op je Vercel app

## 🎉 Klaar!

Je app is nu live op: `https://jouw-url.vercel.app`

## 🔄 Updates Pushen

Na elke git push naar GitHub:
```bash
git add .
git commit -m "Jouw wijziging"
git push
```

Vercel deployed **automatisch** binnen 2 minuten! 🚀

## 🐛 Troubleshooting

### Deployment failed
- Check de Vercel logs (klik op deployment)
- Check of environment variables correct zijn
- Herstart deployment: **Deployments** > **⋯** > **Redeploy**

### "Invalid API key" error
- Check of environment variables exact kloppen (geen spaties)
- Check of je de anon key hebt (niet de service_role key!)
- Redeploy na het fixen

### Kan niet inloggen
- Check of Supabase redirect URL correct is
- Check of beide migrations zijn uitgevoerd
- Check Supabase logs: **Logs** > **Auth Logs**

### 500 Internal Server Error
- Check Vercel Function logs
- Vaak environment variables issue
- Check of Supabase database migrations zijn uitgevoerd

## 📱 Custom Domain (optioneel)

1. Vercel Dashboard > **Settings** > **Domains**
2. Voeg je eigen domein toe
3. Configureer DNS records
4. Update Supabase redirect URLs met nieuwe domein

## 💰 Kosten

- ✅ Supabase: **Gratis** (tot 500MB database, 50,000 users)
- ✅ Vercel: **Gratis** (hobby plan)

Beide gratis tiers zijn meer dan genoeg voor development en kleine productie gebruik!
