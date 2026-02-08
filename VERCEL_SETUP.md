# 🚀 Vercel Deployment - Snelgids

## Environment Variables voor Vercel

Wanneer je bij "Environment Variables" komt in Vercel, voeg deze EXACT toe:

### Variable 1:
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://vffllumkljdszxsmdbyx.supabase.co`
- ✅ Check: Production
- ✅ Check: Preview
- ✅ Check: Development

### Variable 2:
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZmxsdW1rbGpkc3p4c21kYnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDQ0MTEsImV4cCI6MjA4NjEyMDQxMX0.-ZMucXzurpFzLQ6296fAapbD03aJBUUJsBDcqdMTyZQ`
- ✅ Check: Production
- ✅ Check: Preview
- ✅ Check: Development

## Na Deployment

1. Kopieer je Vercel URL (bijv: `https://in-en-uitchecken.vercel.app`)
2. Ga naar Supabase Dashboard
3. **Authentication** → **URL Configuration** → **Redirect URLs**
4. Voeg toe: `https://jouw-vercel-url.vercel.app/auth/callback`
5. Klik **Save**

## Testen

1. Ga naar je Vercel URL
2. Klik "Registreren"
3. Maak een account aan
4. Succes! ✅

## Admin maken

1. Supabase Dashboard → **Table Editor** → **users**
2. Vind je account
3. Verander `role` naar `admin`
4. Log opnieuw in
