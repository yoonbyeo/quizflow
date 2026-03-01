-- ============================================================
-- QuizFlow 클라우드 학습 세션 동기화 SQL
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행하세요.
-- ============================================================

-- 1. 학습 세션 테이블 (진행 위치·완료 여부)
create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  set_id uuid references card_sets not null,
  mode text not null,             -- 'flashcard' | 'learn' | 'test' | 'review'
  progress jsonb not null default '{}',  -- 모드별 진행 데이터
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id, set_id, mode)
);

alter table study_sessions enable row level security;

drop policy if exists "own sessions" on study_sessions;
create policy "own sessions" on study_sessions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function update_study_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists study_sessions_updated_at on study_sessions;
create trigger study_sessions_updated_at
  before update on study_sessions
  for each row execute function update_study_sessions_updated_at();

-- 2. 학습 활동 테이블 (스트릭·캘린더)
create table if not exists study_activity (
  user_id uuid references auth.users not null,
  date date not null,
  count integer not null default 0,
  primary key (user_id, date)
);

alter table study_activity enable row level security;

drop policy if exists "own activity" on study_activity;
create policy "own activity" on study_activity
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
