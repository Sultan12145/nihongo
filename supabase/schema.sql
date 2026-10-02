-- Run in the owner's Supabase SQL editor. No service-role key belongs in the app.
create table if not exists public.study_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  event jsonb not null,
  created_at timestamptz not null default now(),
  primary key(user_id,id),
  check (jsonb_typeof(event)='object'),
  check (event->>'id'=id),
  check (event->>'type' in ('review','word','book','bookmark','goal','session'))
);
alter table public.study_events enable row level security;
revoke all on public.study_events from anon;
grant select,insert on public.study_events to authenticated;
create policy "Read own learning events" on public.study_events for select to authenticated using ((select auth.uid())=user_id);
create policy "Append own learning events" on public.study_events for insert to authenticated with check ((select auth.uid())=user_id);
-- Events are immutable. No UPDATE or DELETE policy is required by the client.
