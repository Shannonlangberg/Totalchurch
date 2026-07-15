# Total Church — Stewardship OS

An operating system for the local church, built for Futures Church.

> We don't ask "which team are you on?" — we ask "what has God entrusted you to steward?"

## Stack
- React + Vite + TypeScript + Tailwind v4
- Supabase (auth, Postgres, RLS, edge functions)
- Resend (email notifications)
- Netlify (hosting)

## Three movements
- **Create** — environments where people encounter Jesus
- **Connect** — helping people feel welcomed, known and valued
- **Develop** — helping people become disciples

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` with your Supabase URL + publishable key
3. Apply `supabase/migrations/0001_init.sql` to your Supabase project
4. Deploy `supabase/functions/notify` and set `RESEND_API_KEY`
5. `npm run dev`
