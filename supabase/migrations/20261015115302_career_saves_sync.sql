create table if not exists public.career_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  save_id text not null,
  save_name text not null,
  season text not null,
  save_data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, save_id)
);

alter table public.career_saves enable row level security;
revoke all on public.career_saves from anon;
grant select, insert, update, delete on public.career_saves to authenticated;

drop policy if exists career_saves_select_own on public.career_saves;
create policy career_saves_select_own on public.career_saves
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists career_saves_insert_own on public.career_saves;
create policy career_saves_insert_own on public.career_saves
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists career_saves_update_own on public.career_saves;
create policy career_saves_update_own on public.career_saves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists career_saves_delete_own on public.career_saves;
create policy career_saves_delete_own on public.career_saves
  for delete to authenticated
  using ((select auth.uid()) = user_id);
