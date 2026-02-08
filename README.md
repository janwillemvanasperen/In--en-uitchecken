# Aanwezigheidsregistratie App

Een moderne aanwezigheidsregistratie-app gebouwd met Next.js 14, Supabase en TypeScript voor studenten en docenten.

## Functionaliteit

### Voor Studenten:
- ✅ Rooster aanmaken en beheren
- ✅ In- en uitchecken op locaties (GPS + QR-code backup)
- ✅ Verlofaanvragen indienen (ziekte/te laat/afspraak)
- ✅ Voortgang en uren bekijken
- ✅ Notificaties voor belangrijke events

### Voor Docenten/Admins:
- ✅ Student accounts beheren
- ✅ Locaties beheren
- ✅ Roosters goedkeuren (elke 6 weken)
- ✅ Timestamps aanpassen
- ✅ Verlofaanvragen goedkeuren
- ✅ Overzichten en statistieken

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui componenten
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Auth**: Supabase Auth met Row Level Security (RLS)

## Installatie

### 1. Clone de repository

```bash
git clone <repository-url>
cd In--en-uitchecken
```

### 2. Installeer dependencies

```bash
npm install
```

### 3. Supabase Setup

1. Maak een nieuw project aan op [supabase.com](https://supabase.com)
2. Ga naar Project Settings > API
3. Kopieer de URL en anon key

### 4. Environment variabelen

Bewerk `.env.local` en vul je Supabase credentials in:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Database migrations uitvoeren

Ga naar je Supabase project dashboard:
1. Klik op "SQL Editor"
2. Open `supabase/migrations/20240101000000_initial_schema.sql`
3. Kopieer de inhoud en voer uit in de SQL Editor
4. Open `supabase/migrations/20240101000001_rls_policies.sql`
5. Kopieer de inhoud en voer uit in de SQL Editor

### 6. Email templates configureren (optioneel)

In Supabase Dashboard > Authentication > Email Templates:
- Pas de email templates aan naar jouw voorkeur
- Configureer email provider (SMTP) indien gewenst

### 7. Start de development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Database Schema

### Tables:

- **users**: Gebruikersprofielen met rollen (student/admin)
- **locations**: Locaties met GPS coördinaten en QR-codes
- **schedules**: Student roosters met goedkeuringsstatus
- **check_ins**: Check-in/uit registraties
- **leave_requests**: Verlofaanvragen met goedkeuringsstatus
- **settings**: Systeeminstellingen (minimale uren, etc.)

## Project Structuur

```
src/
├── app/
│   ├── auth/              # Authenticatie pagina's
│   │   ├── login/
│   │   ├── register/
│   │   └── callback/
│   ├── student/           # Student dashboard en functionaliteit
│   │   └── dashboard/
│   ├── admin/             # Admin dashboard en beheer
│   │   └── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/                # shadcn/ui componenten
├── lib/
│   ├── supabase/          # Supabase clients en types
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── database.types.ts
│   ├── auth.ts            # Auth helpers
│   └── utils.ts
└── middleware.ts          # Route protection en role checks

supabase/
└── migrations/            # Database schema en policies
```

## Eerste gebruik

### Admin account aanmaken:

1. Registreer een account via `/auth/register`
2. Ga naar Supabase Dashboard > Table Editor > users
3. Verander de `role` van je account naar `admin`
4. Log opnieuw in om admin rechten te krijgen

### Locatie toevoegen:

Als admin kun je locaties toevoegen met:
- Naam
- GPS coördinaten (latitude/longitude)
- Unieke QR-code

### Student rooster:

Studenten kunnen hun rooster aanmaken:
- Minimaal 16 uur per week
- Start tijd: standaard 10:00
- 1 sessie per dag
- Herhalend patroon
- Moet goedgekeurd worden door docent

## Belangrijke Features

### GPS Check-in:
- Binnen 500m van locatie (configureerbaar)
- QR-code backup als GPS niet werkt
- Automatische check-out reminder

### Vergeten uitchecken:
- Wordt geteld als 0 uur
- Blijft zichtbaar in systeem
- Admin kan timestamps aanpassen

### Rooster goedkeuring:
- Elke 6 weken moet rooster goedgekeurd worden
- Student kan wijzigingen voorstellen
- Docent keurt goed/af

## Volgende stappen

Deze eerste fase bevat:
- ✅ Complete project setup
- ✅ Database schema met RLS policies
- ✅ Authenticatie systeem
- ✅ Role-based access control
- ✅ Basis dashboards voor student en admin

### Te implementeren:

**Fase 2** - Rooster functionaliteit:
- Rooster aanmaken/bewerken interface
- Kalender weergave
- Rooster goedkeuring workflow
- Validatie (16u minimum, etc.)

**Fase 3** - Check-in/uit:
- GPS locatie detectie
- QR-code scanner
- Real-time check-in status
- Checkout reminder notificaties

**Fase 4** - Verlofbeheer:
- Verlofaanvraag formulier
- Goedkeuring workflow
- Urenberekening met verlof
- Geschiedenis overzicht

**Fase 5** - Admin functionaliteit:
- Gebruikersbeheer interface
- Locatiebeheer met maps
- Timestamp editor
- Rapportages en exports

**Fase 6** - Notificaties & Polish:
- Push notificaties
- Email notificaties
- Progressive Web App (PWA)
- Performance optimalisatie

## Development

```bash
# Development server
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

## Deployment

### Vercel (aanbevolen):

1. Push code naar GitHub
2. Importeer project in Vercel
3. Configureer environment variabelen
4. Deploy

### Andere platforms:

- Zorg dat Node.js 18+ beschikbaar is
- Configureer environment variabelen
- Run `npm run build && npm run start`

## Support

Voor vragen of problemen:
1. Check de Supabase documentatie
2. Check Next.js 14 App Router docs
3. Open een issue in de repository

## Licentie

MIT
