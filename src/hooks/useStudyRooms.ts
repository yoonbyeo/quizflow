import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface StudyRoom {
  id: string;
  code: string;
  name: string;
  description?: string;
  hostId: string;
  hostName?: string;
  maxMembers: number;
  memberCount: number;
  isActive: boolean;
  createdAt: number;
  isHost: boolean;
  isMember: boolean;
}

export interface RoomMember {
  id: string;
  userId: string;
  nickname: string;
  joinedAt: number;
  isHost: boolean;
}

export interface RoomCardSet {
  id: string;
  setId: string;
  title: string;
  cardCount: number;
  addedBy: string;
  addedByName: string;
  addedAt: number;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useStudyRooms(userId: string | undefined) {
  const [myRooms, setMyRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyRooms = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 내가 속한 방 id 목록
      const { data: memberRows } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', userId);

      if (!memberRows || memberRows.length === 0) { setMyRooms([]); setLoading(false); return; }

      const roomIds = memberRows.map(r => r.room_id);
      const { data: rooms } = await supabase
        .from('study_rooms')
        .select('*')
        .in('id', roomIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!rooms) { setMyRooms([]); setLoading(false); return; }

      // 각 방의 멤버 수
      const counts = await Promise.all(
        rooms.map(r =>
          supabase.from('room_members').select('id', { count: 'exact', head: true }).eq('room_id', r.id)
        )
      );

      const result: StudyRoom[] = rooms.map((r, i) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description ?? undefined,
        hostId: r.host_id,
        maxMembers: r.max_members,
        memberCount: counts[i].count ?? 0,
        isActive: r.is_active,
        createdAt: new Date(r.created_at).getTime(),
        isHost: r.host_id === userId,
        isMember: true,
      }));

      setMyRooms(result);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchMyRooms(); }, [fetchMyRooms]);

  // 방 만들기 (customCode: 사용자가 직접 지정한 코드, 없으면 자동 생성)
  const createRoom = useCallback(async (
    name: string,
    description?: string,
    customCode?: string,
  ): Promise<{ room: StudyRoom | null; error?: string }> => {
    if (!userId) return { room: null, error: '로그인이 필요합니다.' };

    let code = customCode ? customCode.toUpperCase().trim() : generateCode();

    // 코드 형식 검사 (6자리 영숫자)
    if (!/^[A-Z0-9]{4,8}$/.test(code)) {
      return { room: null, error: '코드는 4~8자리 영문/숫자만 사용할 수 있습니다.' };
    }

    // 코드 중복 확인
    const { data: existing } = await supabase
      .from('study_rooms').select('id').eq('code', code).maybeSingle();
    if (existing) {
      if (customCode) return { room: null, error: '이미 사용 중인 코드입니다. 다른 코드를 입력해주세요.' };
      // 자동 생성인 경우 재시도
      for (let i = 0; i < 5; i++) {
        code = generateCode();
        const { data: dup } = await supabase.from('study_rooms').select('id').eq('code', code).maybeSingle();
        if (!dup) break;
      }
    }

    const { data: room, error } = await supabase
      .from('study_rooms')
      .insert({ code, name, description: description || null, host_id: userId, max_members: 8 })
      .select()
      .single();

    if (error || !room) {
      return { room: null, error: `방 생성 실패: ${error?.message ?? '알 수 없는 오류'}` };
    }

    // 방장도 멤버로 추가
    const { error: memberError } = await supabase
      .from('room_members').insert({ room_id: room.id, user_id: userId });
    if (memberError) {
      return { room: null, error: `멤버 등록 실패: ${memberError.message}` };
    }

    await fetchMyRooms();
    return {
      room: {
        id: room.id, code: room.code, name: room.name, description: room.description ?? undefined,
        hostId: room.host_id, maxMembers: room.max_members, memberCount: 1,
        isActive: true, createdAt: new Date(room.created_at).getTime(), isHost: true, isMember: true,
      },
    };
  }, [userId, fetchMyRooms]);

  // 코드로 방 참여
  const joinRoom = useCallback(async (code: string): Promise<{ ok: boolean; error?: string; roomId?: string }> => {
    if (!userId) return { ok: false, error: '로그인이 필요합니다.' };
    const { data: room } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    if (!room) return { ok: false, error: '존재하지 않는 방 코드입니다.' };

    const { count } = await supabase
      .from('room_members')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id);

    if ((count ?? 0) >= room.max_members) return { ok: false, error: '방이 가득 찼습니다. (최대 8명)' };

    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: room.id, user_id: userId });

    if (error) {
      if (error.code === '23505') return { ok: true, roomId: room.id }; // 이미 참여 중
      return { ok: false, error: '참여에 실패했습니다.' };
    }
    await fetchMyRooms();
    return { ok: true, roomId: room.id };
  }, [userId, fetchMyRooms]);

  // 방 나가기
  const leaveRoom = useCallback(async (roomId: string): Promise<void> => {
    if (!userId) return;
    const room = myRooms.find(r => r.id === roomId);
    if (room?.isHost) {
      // 방장이 나가면 방 비활성화
      await supabase.from('study_rooms').update({ is_active: false }).eq('id', roomId);
    } else {
      await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', userId);
    }
    await fetchMyRooms();
  }, [userId, myRooms, fetchMyRooms]);

  // 방 삭제 (방장만)
  const deleteRoom = useCallback(async (roomId: string): Promise<void> => {
    await supabase.from('study_rooms').update({ is_active: false }).eq('id', roomId);
    await fetchMyRooms();
  }, [fetchMyRooms]);

  return { myRooms, loading, createRoom, joinRoom, leaveRoom, deleteRoom, refresh: fetchMyRooms };
}

// ── 방 상세 데이터 ──
export function useRoomDetail(roomId: string | undefined, userId: string | undefined) {
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [sharedSets, setSharedSets] = useState<RoomCardSet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!roomId || !userId) return;
    setLoading(true);
    try {
      const [roomRes, membersRes, setsRes] = await Promise.all([
        supabase.from('study_rooms').select('*').eq('id', roomId).single(),
        supabase.from('room_members').select('*').eq('room_id', roomId).order('joined_at'),
        supabase.from('room_card_sets').select('*, card_sets(title)').eq('room_id', roomId).order('added_at'),
      ]);

      if (roomRes.data) {
        const r = roomRes.data;
        setRoom({
          id: r.id, code: r.code, name: r.name, description: r.description ?? undefined,
          hostId: r.host_id, maxMembers: r.max_members,
          memberCount: membersRes.data?.length ?? 0,
          isActive: r.is_active, createdAt: new Date(r.created_at).getTime(),
          isHost: r.host_id === userId,
          isMember: membersRes.data?.some(m => m.user_id === userId) ?? false,
        });
      }

      if (membersRes.data) {
        setMembers(membersRes.data.map(m => ({
          id: m.id, userId: m.user_id,
          nickname: m.nickname || '멤버',
          joinedAt: new Date(m.joined_at).getTime(),
          isHost: roomRes.data?.host_id === m.user_id,
        })));
      }

      if (setsRes.data) {
        // 카드 수 조회
        const cardCounts = await Promise.all(
          setsRes.data.map(s =>
            supabase.from('cards').select('id', { count: 'exact', head: true }).eq('set_id', s.set_id)
          )
        );
        setSharedSets(setsRes.data.map((s, i) => ({
          id: s.id, setId: s.set_id,
          title: (s.card_sets as any)?.title ?? '알 수 없는 세트',
          cardCount: cardCounts[i].count ?? 0,
          addedBy: s.added_by, addedByName: '멤버',
          addedAt: new Date(s.added_at).getTime(),
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [roomId, userId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // 세트 공유 추가
  const addSharedSet = useCallback(async (setId: string): Promise<{ ok: boolean; error?: string }> => {
    if (!roomId || !userId) return { ok: false };
    const { error } = await supabase
      .from('room_card_sets')
      .insert({ room_id: roomId, set_id: setId, added_by: userId });
    if (error) {
      if (error.code === '23505') return { ok: false, error: '이미 공유된 세트입니다.' };
      return { ok: false, error: '세트 추가에 실패했습니다.' };
    }
    await fetchDetail();
    return { ok: true };
  }, [roomId, userId, fetchDetail]);

  // 세트 공유 제거
  const removeSharedSet = useCallback(async (roomSetId: string): Promise<void> => {
    await supabase.from('room_card_sets').delete().eq('id', roomSetId);
    await fetchDetail();
  }, [fetchDetail]);

  // 멤버 강퇴 (방장만)
  const kickMember = useCallback(async (memberId: string): Promise<void> => {
    await supabase.from('room_members').delete().eq('id', memberId);
    await fetchDetail();
  }, [fetchDetail]);

  return { room, members, sharedSets, loading, addSharedSet, removeSharedSet, kickMember, refresh: fetchDetail };
}
