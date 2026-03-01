-- QuizFlow 업데이트 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 폴더 테이블
create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  color text default '#388bfd' not null,
  created_at timestamptz default now() not null
);

alter table folders enable row level security;
create policy "Users can view own folders" on folders for select using (auth.uid() = user_id);
create policy "Users can insert own folders" on folders for insert with check (auth.uid() = user_id);
create policy "Users can update own folders" on folders for update using (auth.uid() = user_id);
create policy "Users can delete own folders" on folders for delete using (auth.uid() = user_id);

-- 2. card_sets에 folder_id 컬럼 추가
alter table card_sets add column if not exists folder_id uuid references folders(id) on delete set null;

-- 3. cards에 image_url 컬럼 추가
alter table cards add column if not exists image_url text;

-- 4. Supabase Storage 버킷 생성 (Storage 탭에서 수동으로 해야 할 수도 있음)
-- insert into storage.buckets (id, name, public) values ('card-images', 'card-images', true)
-- on conflict do nothing;
