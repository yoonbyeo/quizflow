-- QuizFlow Supabase Schema
-- Run this in Supabase SQL Editor

-- Card Sets
create table if not exists card_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Cards
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid references card_sets(id) on delete cascade not null,
  term text not null,
  definition text not null,
  hint text,
  position int default 0 not null,
  created_at timestamptz default now() not null
);

-- Card Stats
create table if not exists card_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id uuid references cards(id) on delete cascade not null,
  correct int default 0 not null,
  incorrect int default 0 not null,
  streak int default 0 not null,
  difficulty text default 'unrated' not null,
  last_reviewed timestamptz,
  unique(user_id, card_id)
);

-- RLS Policies
alter table card_sets enable row level security;
alter table cards enable row level security;
alter table card_stats enable row level security;

-- card_sets policies
create policy "Users can view own card sets" on card_sets for select using (auth.uid() = user_id);
create policy "Users can insert own card sets" on card_sets for insert with check (auth.uid() = user_id);
create policy "Users can update own card sets" on card_sets for update using (auth.uid() = user_id);
create policy "Users can delete own card sets" on card_sets for delete using (auth.uid() = user_id);

-- cards policies
create policy "Users can view cards in own sets" on cards for select using (
  exists (select 1 from card_sets where card_sets.id = cards.set_id and card_sets.user_id = auth.uid())
);
create policy "Users can insert cards in own sets" on cards for insert with check (
  exists (select 1 from card_sets where card_sets.id = cards.set_id and card_sets.user_id = auth.uid())
);
create policy "Users can update cards in own sets" on cards for update using (
  exists (select 1 from card_sets where card_sets.id = cards.set_id and card_sets.user_id = auth.uid())
);
create policy "Users can delete cards in own sets" on cards for delete using (
  exists (select 1 from card_sets where card_sets.id = cards.set_id and card_sets.user_id = auth.uid())
);

-- card_stats policies
create policy "Users can view own stats" on card_stats for select using (auth.uid() = user_id);
create policy "Users can insert own stats" on card_stats for insert with check (auth.uid() = user_id);
create policy "Users can update own stats" on card_stats for update using (auth.uid() = user_id);
create policy "Users can delete own stats" on card_stats for delete using (auth.uid() = user_id);

-- Updated at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger card_sets_updated_at
  before update on card_sets
  for each row execute function update_updated_at();
