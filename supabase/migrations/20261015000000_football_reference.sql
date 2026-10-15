-- Official/reference football data is kept separate from simulation career state.
create table if not exists public.football_leagues (
  id bigint primary key,
  name text not null,
  country text,
  logo text,
  league_type text,
  season integer not null,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.football_teams (
  id bigint primary key,
  name text not null,
  country text,
  founded integer,
  national boolean not null default false,
  logo text,
  league_id bigint references public.football_leagues(id) on delete set null,
  venue jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.football_players (
  id bigint primary key,
  name text not null,
  firstname text,
  lastname text,
  age integer,
  nationality text,
  height text,
  weight text,
  injured boolean,
  photo text,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.football_squads (
  team_id bigint not null references public.football_teams(id) on delete cascade,
  player_id bigint not null references public.football_players(id) on delete cascade,
  season integer not null,
  shirt_number integer,
  position text,
  role text,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  primary key (team_id, player_id, season)
);

create table if not exists public.football_import_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  status text not null check (status in ('running','succeeded','partial','failed')),
  requested_count integer not null default 0,
  imported_count integer not null default 0,
  error_summary text,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists football_teams_league_idx on public.football_teams(league_id);
create index if not exists football_squads_player_idx on public.football_squads(player_id);
create index if not exists football_leagues_season_idx on public.football_leagues(season,country);
create index if not exists football_import_runs_user_idx on public.football_import_runs(user_id,started_at desc);

alter table public.football_leagues enable row level security;
alter table public.football_teams enable row level security;
alter table public.football_players enable row level security;
alter table public.football_squads enable row level security;
alter table public.football_import_runs enable row level security;

drop policy if exists "Authenticated users can read reference leagues" on public.football_leagues;
create policy "Authenticated users can read reference leagues" on public.football_leagues for select to authenticated using (true);
drop policy if exists "Authenticated users can read reference teams" on public.football_teams;
create policy "Authenticated users can read reference teams" on public.football_teams for select to authenticated using (true);
drop policy if exists "Authenticated users can read reference players" on public.football_players;
create policy "Authenticated users can read reference players" on public.football_players for select to authenticated using (true);
drop policy if exists "Authenticated users can read reference squads" on public.football_squads;
create policy "Authenticated users can read reference squads" on public.football_squads for select to authenticated using (true);
drop policy if exists "Users can read own import runs" on public.football_import_runs;
create policy "Users can read own import runs" on public.football_import_runs for select to authenticated using (auth.uid() = user_id);
-- Explicit grants for the Data API: authenticated users may read reference data,
-- while only the server-side service role may write through the importer.
grant select on public.football_leagues, public.football_teams, public.football_players,
  public.football_squads, public.football_import_runs to authenticated;
grant select, insert, update, delete on public.football_leagues, public.football_teams,
  public.football_players, public.football_squads, public.football_import_runs to service_role;

-- Writes happen only through authenticated server functions using the service role.