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
  isPublic: boolean;
  createdAt: number;
  isHost: boolean;
  isMember: boolean;
  sharedSetCount?: number;
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
  const [publicRooms, setPublicRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [publicLoading, setPublicLoading] = useState(false);

  // ── 내가 참여한 방 목록 ──
  const fetchMyRooms = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: memberRows } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', userId);

      if (!memberRows || memberRows.length === 0) {
        setMyRooms([]);
        return;
      }

      const roomIds = memberRows.map(r => r.room_id);
      const { data: rooms } = await supabase
        .from('study_rooms')
        .select('*')
        .in('id', roomIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!rooms) { setMyRooms([]); return; }

      const [counts, setCounts] = await Promise.all([
        Promise.all(rooms.map(r =>
          supabase.from('room_members').select('id', { count: 'exact', head: true }).eq('room_id', r.id)
        )),
        Promise.all(rooms.map(r =>
          supabase.from('room_card_sets').select('id', { count: 'exact', head: true }).eq('room_id', r.id)
        )),
      ]);

      setMyRooms(rooms.map((r, i) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description ?? undefined,
        hostId: r.host_id,
        maxMembers: r.max_members,
        memberCount: counts[i].count ?? 0,
        isActive: r.is_active,
        isPublic: r.is_public ?? true,
        createdAt: new Date(r.created_at).getTime(),
        isHost: r.host_id === userId,
        isMember: true,
        sharedSetCount: setCounts[i].count ?? 0,
      })));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── 공개 방 전체 목록 ──
  const fetchPublicRooms = useCallback(async () => {
    setPublicLoading(true);
    try {
      const { data: rooms } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!rooms) { setPublicRooms([]); return; }

      const [counts, setCounts] = await Promise.all([
        Promise.all(rooms.map(r =>
          supabase.from('room_members').select('id', { count: 'exact', head: true }).eq('room_id', r.id)
        )),
        Promise.all(rooms.map(r =>
          supabase.from('room_card_sets').select('id', { count: 'exact', head: true }).eq('room_id', r.id)
        )),
      ]);

      const myRoomIds = userId
        ? (await supabase.from('room_members').select('room_id').eq('user_id', userId)).data?.map(r => r.room_id) ?? []
        : [];

      setPublicRooms(rooms.map((r, i) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description ?? undefined,
        hostId: r.host_id,
        maxMembers: r.max_members,
        memberCount: counts[i].count ?? 0,
        isActive: r.is_active,
        isPublic: r.is_public ?? true,
        createdAt: new Date(r.created_at).getTime(),
        isHost: r.host_id === userId,
        isMember: myRoomIds.includes(r.id),
        sharedSetCount: setCounts[i].count ?? 0,
      })));
    } finally {
      setPublicLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchMyRooms(); }, [fetchMyRooms]);

  // ── 방 만들기 ──
  const createRoom = useCallback(async (
    name: string,
    description?: string,
    customCode?: string,
    isPublic = true,
  ): Promise<{ room: StudyRoom | null; error?: string }> => {
    if (!userId) return { room: null, error: '로그인이 필요합니다.' };

    let code = customCode ? customCode.toUpperCase().trim() : generateCode();

    if (!/^[A-Z0-9]{4,8}$/.test(code)) {
      return { room: null, error: '코드는 4~8자리 영문/숫자만 사용할 수 있습니다.' };
    }

    // 코드 중복 확인
    const { data: existing } = await supabase
      .from('study_rooms').select('id').eq('code', code).maybeSingle();
    if (existing) {
      if (customCode) return { room: null, error: '이미 사용 중인 코드입니다. 다른 코드를 입력해주세요.' };
      for (let i = 0; i < 5; i++) {
        code = generateCode();
        const { data: dup } = await supabase.from('study_rooms').select('id').eq('code', code).maybeSingle();
        if (!dup) break;
      }
    }

    const { data: room, error: roomError } = await supabase
      .from('study_rooms')
      .insert({ code, name, description: description || null, host_id: userId, max_members: 8, is_public: isPublic })
      .select()
      .single();

    if (roomError || !room) {
      return { room: null, error: `방 생성 실패: ${roomError?.message ?? '알 수 없는 오류'}` };
    }

    // 방장을 멤버로 추가 (display_name 포함)
    const { data: profile } = await supabase.auth.getUser();
    const displayName = profile?.user?.user_metadata?.full_name
      ?? profile?.user?.user_metadata?.name
      ?? profile?.user?.email?.split('@')[0]
      ?? '방장';

    const { error: memberError } = await supabase
      .from('room_members')
      .insert({ room_id: room.id, user_id: userId, display_name: displayName });

    if (memberError) {
      // 멤버 등록 실패 시 방도 삭제 (롤백)
      await supabase.from('study_rooms').delete().eq('id', room.id);
      return { room: null, error: `멤버 등록 실패: ${memberError.message}` };
    }

    const newRoom: StudyRoom = {
      id: room.id, code: room.code, name: room.name,
      description: room.description ?? undefined,
      hostId: room.host_id, maxMembers: room.max_members,
      memberCount: 1, isActive: true, isPublic: room.is_public ?? isPublic,
      createdAt: new Date(room.created_at).getTime(),
      isHost: true, isMember: true, sharedSetCount: 0,
    };

    // state에 바로 추가 (fetchMyRooms 비동기 지연 방지)
    setMyRooms(prev => [newRoom, ...prev]);
    return { room: newRoom };
  }, [userId]);

  // ── 코드로 방 참여 ──
  const joinRoom = useCallback(async (code: string): Promise<{ ok: boolean; error?: string; roomId?: string }> => {
    if (!userId) return { ok: false, error: '로그인이 필요합니다.' };

    const { data: room } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    if (!room) return { ok: false, error: '존재하지 않는 방 코드입니다.' };

    // 이미 참여 중인지 확인
    const { data: alreadyMember } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (alreadyMember) return { ok: true, roomId: room.id };

    const { count } = await supabase
      .from('room_members')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id);

    if ((count ?? 0) >= room.max_members) return { ok: false, error: '방이 가득 찼습니다. (최대 8명)' };

    const { data: profile } = await supabase.auth.getUser();
    const displayName = profile?.user?.user_metadata?.full_name
      ?? profile?.user?.user_metadata?.name
      ?? profile?.user?.email?.split('@')[0]
      ?? '멤버';

    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: room.id, user_id: userId, display_name: displayName });

    if (error) {
      if (error.code === '23505') return { ok: true, roomId: room.id };
      return { ok: false, error: '참여에 실패했습니다.' };
    }
    await fetchMyRooms();
    return { ok: true, roomId: room.id };
  }, [userId, fetchMyRooms]);

  // ── 방 나가기 ──
  const leaveRoom = useCallback(async (roomId: string): Promise<void> => {
    if (!userId) return;
    const room = myRooms.find(r => r.id === roomId);
    if (room?.isHost) {
      await supabase.from('study_rooms').update({ is_active: false }).eq('id', roomId);
    } else {
      await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', userId);
    }
    setMyRooms(prev => prev.filter(r => r.id !== roomId));
  }, [userId, myRooms]);

  // ── 방 삭제 (방장만) ──
  const deleteRoom = useCallback(async (roomId: string): Promise<void> => {
    await supabase.from('study_rooms').update({ is_active: false }).eq('id', roomId);
    setMyRooms(prev => prev.filter(r => r.id !== roomId));
  }, []);

  return {
    myRooms, publicRooms,
    loading, publicLoading,
    createRoom, joinRoom, leaveRoom, deleteRoom,
    refresh: fetchMyRooms,
    refreshPublic: fetchPublicRooms,
  };
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
        supabase.from('room_card_sets').select('*').eq('room_id', roomId).order('added_at'),
      ]);

      if (roomRes.data) {
        const r = roomRes.data;
        setRoom({
          id: r.id, code: r.code, name: r.name,
          description: r.description ?? undefined,
          hostId: r.host_id, maxMembers: r.max_members,
          memberCount: membersRes.data?.length ?? 0,
          isActive: r.is_active, isPublic: r.is_public ?? true,
          createdAt: new Date(r.created_at).getTime(),
          isHost: r.host_id === userId,
          isMember: membersRes.data?.some(m => m.user_id === userId) ?? false,
        });
      }

      if (membersRes.data) {
        setMembers(membersRes.data.map(m => ({
          id: m.id, userId: m.user_id,
          nickname: m.display_name || m.nickname || '멤버',
          joinedAt: new Date(m.joined_at).getTime(),
          isHost: roomRes.data?.host_id === m.user_id,
        })));
      }

      if (setsRes.data) {
        // 카드 수 조회 (cards 테이블 — RLS 정책으로 방 멤버면 접근 가능)
        const cardCounts = await Promise.all(
          setsRes.data.map(s =>
            supabase.from('cards').select('id', { count: 'exact', head: true }).eq('set_id', s.set_id)
          )
        );

        // 세트 제목: set_title 컬럼 우선, 없으면 card_sets 조회 시도
        const titlesPromises = setsRes.data.map(async (s) => {
          if (s.set_title) return s.set_title as string;
          const { data } = await supabase.from('card_sets').select('title').eq('id', s.set_id).maybeSingle();
          return (data as any)?.title ?? '알 수 없는 세트';
        });
        const titles = await Promise.all(titlesPromises);

        // 추가자 이름 조회
        const addedByNames: Record<string, string> = {};
        const uniqueAdders = [...new Set(setsRes.data.map(s => s.added_by))];
        for (const uid of uniqueAdders) {
          const m = membersRes.data?.find(m => m.user_id === uid);
          addedByNames[uid] = m?.display_name || m?.nickname || '멤버';
        }

        setSharedSets(setsRes.data.map((s, i) => ({
          id: s.id, setId: s.set_id,
          title: titles[i],
          cardCount: cardCounts[i].count ?? 0,
          addedBy: s.added_by,
          addedByName: addedByNames[s.added_by] ?? '멤버',
          addedAt: new Date(s.added_at).getTime(),
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [roomId, userId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // ── 세트 공유 추가 ──
  const addSharedSet = useCallback(async (setId: string, setTitle: string): Promise<{ ok: boolean; error?: string }> => {
    if (!roomId || !userId) return { ok: false };
    const { error } = await supabase
      .from('room_card_sets')
      .insert({ room_id: roomId, set_id: setId, added_by: userId, set_title: setTitle });
    if (error) {
      if (error.code === '23505') return { ok: false, error: '이미 공유된 세트입니다.' };
      return { ok: false, error: '세트 추가에 실패했습니다.' };
    }
    await fetchDetail();
    return { ok: true };
  }, [roomId, userId, fetchDetail]);

  // ── 세트 공유 제거 ──
  const removeSharedSet = useCallback(async (roomSetId: string): Promise<void> => {
    await supabase.from('room_card_sets').delete().eq('id', roomSetId);
    setSharedSets(prev => prev.filter(s => s.id !== roomSetId));
  }, []);

  // ── 멤버 강퇴 (방장만) ──
  const kickMember = useCallback(async (memberId: string): Promise<void> => {
    await supabase.from('room_members').delete().eq('id', memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);

  return { room, members, sharedSets, loading, addSharedSet, removeSharedSet, kickMember, refresh: fetchDetail };
}
