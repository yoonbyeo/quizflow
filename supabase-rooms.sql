-- ──────────────────────────────────────────────
-- QuizFlow 그룹 스터디룸 테이블
-- Supabase SQL Editor에서 실행하세요.
-- ──────────────────────────────────────────────

-- 1. 스터디룸 테이블
create table if not exists study_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,           -- 6자리 초대 코드 (예: ABC123)
  name text not null,                  -- 방 이름
  description text,
  host_id uuid not null references auth.users(id) on delete cascade,
  max_members int not null default 8,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. 방 멤버 테이블
create table if not exists room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,                       -- 방에서 사용하는 닉네임
  joined_at timestamptz not null default now(),
  unique(room_id, user_id)
);

-- 3. 방 공유 카드세트 테이블
create table if not exists room_card_sets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references study_rooms(id) on delete cascade,
  set_id uuid not null references card_sets(id) on delete cascade,
  added_by uuid not null references auth.users(id),
  added_at timestamptz not null default now(),
  unique(room_id, set_id)
);

-- 4. RLS 활성화
alter table study_rooms enable row level security;
alter table room_members enable row level security;
alter table room_card_sets enable row level security;

-- ── study_rooms 정책 ──
-- 누구나 코드로 방 조회 가능 (참여 전 조회)
create policy "Anyone can view rooms by code"
  on study_rooms for select using (true);

-- 로그인 사용자만 방 생성 가능
create policy "Authenticated users can create rooms"
  on study_rooms for insert
  with check (auth.uid() = host_id);

-- 방장만 방 수정 가능
create policy "Host can update room"
  on study_rooms for update
  using (auth.uid() = host_id);

-- 방장만 방 삭제 가능
create policy "Host can delete room"
  on study_rooms for delete
  using (auth.uid() = host_id);

-- ── room_members 정책 ──
-- 방 멤버는 같은 방 멤버 목록 조회 가능
create policy "Room members can view members"
  on room_members for select
  using (
    exists (
      select 1 from room_members rm
      where rm.room_id = room_members.room_id
        and rm.user_id = auth.uid()
    )
  );

-- 로그인 사용자 자신을 멤버로 추가 가능
create policy "Users can join rooms"
  on room_members for insert
  with check (auth.uid() = user_id);

-- 자신의 멤버십만 삭제(방 나가기) 가능, 방장은 모든 멤버 강퇴 가능
create policy "Users can leave rooms"
  on room_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from study_rooms sr
      where sr.id = room_members.room_id
        and sr.host_id = auth.uid()
    )
  );

-- ── room_card_sets 정책 ──
-- 방 멤버는 공유 세트 목록 조회 가능
create policy "Room members can view shared sets"
  on room_card_sets for select
  using (
    exists (
      select 1 from room_members rm
      where rm.room_id = room_card_sets.room_id
        and rm.user_id = auth.uid()
    )
  );

-- 방 멤버는 세트 추가 가능
create policy "Room members can add sets"
  on room_card_sets for insert
  with check (
    auth.uid() = added_by
    and exists (
      select 1 from room_members rm
      where rm.room_id = room_card_sets.room_id
        and rm.user_id = auth.uid()
    )
  );

-- 추가한 사람 또는 방장만 세트 제거 가능
create policy "Room members can remove sets"
  on room_card_sets for delete
  using (
    auth.uid() = added_by
    or exists (
      select 1 from study_rooms sr
      where sr.id = room_card_sets.room_id
        and sr.host_id = auth.uid()
    )
  );

-- 5. 인덱스
create index if not exists idx_study_rooms_code on study_rooms(code);
create index if not exists idx_room_members_room on room_members(room_id);
create index if not exists idx_room_members_user on room_members(user_id);
create index if not exists idx_room_card_sets_room on room_card_sets(room_id);
