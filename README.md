# FOOTBALL CAREER 2027

A browser-based football career simulator. Initial project bootstrap; see setup steps below.

## Stack
- React + TypeScript + Vite
- Local multi-slot career saves
- Deterministic lightweight match simulation
- Optional Supabase Edge Function proxy for API-Football (API keys stay server-side)

## Quick start

```bash
npm install
npm run dev
```

## API-Football security
Never put `API_FOOTBALL_KEY` in frontend environment variables or commit it to GitHub. Add it only to Supabase Edge Function secrets. Any key pasted into chat, documentation, or a repository should be rotated.
