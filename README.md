# FOOTBALL CAREER 2027

A Ukrainian-language browser football career simulator built from scratch with React, TypeScript and Vite.

## Working foundation in this commit

- Responsive dark UI for desktop and mobile.
- New player career setup: name, position, age, nationality, preferred foot, starting club and difficulty.
- Three independent local save slots, autosave, JSON import/export and delete confirmation.
- Deterministic double round-robin starter season calendar.
- Lightweight event-based match simulation with goals, shots, xG, possession, passing, fouls, cards, corners and news events.
- League standings calculated from played fixture results.
- Player attributes, potential, fitness, morale, training and career statistics.
- Transfer offers that can be accepted or rejected; accepting changes club, wage and career news.
- Catalogue of the 20 target national leagues, with demo/reference data labels.
- Protected Supabase Edge Function for API-Football access; the key is read only from server secret API_FOOTBALL_KEY.
- PostgreSQL reference tables with row-level security and an import-job journal.

This is a playable foundation, not a claim that all parts of the full specification or every real team roster are complete. The initial gameplay world uses a starter set of Ukrainian clubs and explicitly virtual simulated squad members. These must not be presented as verified current rosters.

## Run locally

1. Install Node.js 20 or newer.
2. Run npm install.
3. Copy .env.example to .env.
4. Run npm run dev, then open the Vite URL printed in the terminal.
5. Run npm run build to check the production build and npm test to run core game tests.

## Secure API-Football setup

1. Create a Supabase project.
2. Apply the migration at supabase/migrations/20261015000000_football_reference.sql.
3. Set API_FOOTBALL_KEY only in Supabase Edge Function Secrets.
4. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY locally or in the hosting platform.
5. Deploy supabase/functions/football-api.
6. Use the Import Football Database screen to sign in and test a leagues query.

Example Supabase CLI commands:

    supabase login
    supabase link --project-ref YOUR_PROJECT_REF
    supabase db push
    supabase secrets set API_FOOTBALL_KEY=YOUR_NEW_ROTATED_KEY
    supabase functions deploy football-api

Never commit API keys or put API_FOOTBALL_KEY in Vite variables. A key pasted into chat or source should be considered exposed and rotated through the provider dashboard before use.

## Current boundaries

- Career saves currently persist locally in the browser. Cross-device cloud saves are not implemented yet.
- The importer currently checks the API and saves returned league metadata. It does not yet import all teams, squads, players, schedules, transfers, historic stats, portraits or logos.
- Team/player ratings, career values, match results and generated transfer offers are game-model values, not official API data.
- The game calendar and clubs currently support the starter simulation world. The other 19 league cards are a target catalogue, not a declaration of imported real-world league data.
- Official club crests and player portraits are not bundled; neutral stylized initials and avatar icons are used.

## Roadmap

1. Finish paginated import for each target league, full squads, fixtures and per-league completeness reports.
2. Connect verified clubs and players from the reference database into career squads.
3. Extend tactical controls, substitutions, injuries, suspensions, international teams, cups and continental competitions.
4. Implement transactional cloud saves and world isolation.
5. Add end-to-end tests for full seasons, transfer windows, imports and persistence.