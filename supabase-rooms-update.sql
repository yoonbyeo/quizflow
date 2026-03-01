-- ──────────────────────────────────────────────────────────────
-- QuizFlow 그룹 스터디룸 업데이트 SQL
-- Supabase SQL Editor에서 실행하세요.
-- ──────────────────────────────────────────────────────────────

-- 1. study_rooms에 공개/비공개 컬럼 추가
alter table study_rooms
  add column if not exists is_public boolean not null default true;

-- 2. room_card_sets에 세트 제목 컬럼 추가 (RLS 우회용 denormalization)
alter table room_card_sets
  add column if not exists set_title text;

-- 3. room_members에 표시 이름 컬럼 추가
alter table room_members
  add column if not exists display_name text;

-- 4. study_rooms: 공개 방은 누구나 조회 (기존 정책 대체)
drop policy if exists "Anyone can view rooms by code" on study_rooms;
create policy "Anyone can view public rooms"
  on study_rooms for select
  using (is_active = true and is_public = true)
  -- 비공개 방은 멤버만 조회 가능
  ;

-- 비공개 방 멤버 조회 정책
create policy "Members can view their private rooms"
  on study_rooms for select
  using (
    exists (
      select 1 from room_members rm
      where rm.room_id = study_rooms.id
        and rm.user_id = auth.uid()
    )
  );

-- 5. card_sets: 방 멤버는 같은 방에 공유된 다른 사람 세트도 조회 가능
--    (기존 card_sets RLS에 정책 추가 - 이미 있는 경우 무시)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'card_sets'
      and policyname = 'Room members can view shared card sets'
  ) then
    execute $policy$
      create policy "Room members can view shared card sets"
        on card_sets for select
        using (
          exists (
            select 1 from room_card_sets rcs
            join room_members rm on rm.room_id = rcs.room_id
            where rcs.set_id = card_sets.id
              and rm.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
end;
$$;

-- 6. cards: 방 멤버는 공유된 세트의 카드도 조회 가능
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cards'
      and policyname = 'Room members can view shared cards'
  ) then
    execute $policy$
      create policy "Room members can view shared cards"
        on cards for select
        using (
          exists (
            select 1 from room_card_sets rcs
            join room_members rm on rm.room_id = rcs.room_id
            where rcs.set_id = cards.set_id
              and rm.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
end;
$$;

-- 7. room_members: display_name 업데이트 허용 (본인만)
drop policy if exists "Users can update own membership" on room_members;
create policy "Users can update own membership"
  on room_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8. 인덱스 추가
create index if not exists idx_study_rooms_public on study_rooms(is_active, is_public);
create index if not exists idx_room_card_sets_set on room_card_sets(set_id);
