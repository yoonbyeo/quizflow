import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, LogIn, Copy, Check, Crown, BookOpen,
  X, ChevronRight, RefreshCw, Globe, Lock, Search,
} from 'lucide-react';
import { useStudyRooms } from '../hooks/useStudyRooms';
import type { StudyRoom } from '../hooks/useStudyRooms';
import type { User } from '@supabase/supabase-js';

interface StudyRoomsPageProps {
  user: User | null;
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function StudyRoomsPage({ user }: StudyRoomsPageProps) {
  const navigate = useNavigate();
  const {
    myRooms, publicRooms,
    loading, publicLoading,
    createRoom, joinRoom, leaveRoom,
    refreshPublic,
  } = useStudyRooms(user?.id);

  const [tab, setTab] = useState<'my' | 'public'>('my');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // 방 만들기 폼 상태
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCode, setNewCode] = useState(() => randomCode());
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // 참여 상태
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 공개 방 검색
  const [searchQuery, setSearchQuery] = useState('');

  // 공개 탭 진입 시 목록 로드
  useEffect(() => {
    if (tab === 'public') refreshPublic();
  }, [tab, refreshPublic]);

  const resetCreateForm = () => {
    setNewName(''); setNewDesc('');
    setNewCode(randomCode()); setUseCustomCode(false);
    setIsPublic(true); setError('');
  };

  const handleCreate = async () => {
    if (!newName.trim()) { setError('방 이름을 입력하세요.'); return; }
    if (useCustomCode && newCode.trim().length < 4) { setError('코드는 4자리 이상 입력하세요.'); return; }
    const codeToUse = useCustomCode ? newCode.trim() : undefined;
    setCreating(true); setError('');
    const { room, error: err } = await createRoom(newName.trim(), newDesc.trim() || undefined, codeToUse, isPublic);
    setCreating(false);
    if (room) {
      setShowCreate(false); resetCreateForm();
      navigate(`/rooms/${room.id}`);
    } else {
      setError(err ?? '방 만들기에 실패했습니다.');
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError('초대 코드를 입력하세요.'); return; }
    setJoining(true); setError('');
    const result = await joinRoom(joinCode);
    setJoining(false);
    if (result.ok && result.roomId) {
      setShowJoin(false); setJoinCode('');
      navigate(`/rooms/${result.roomId}`);
    } else {
      setError(result.error ?? '참여에 실패했습니다.');
    }
  };

  const handleJoinPublic = async (room: StudyRoom) => {
    if (room.isMember) { navigate(`/rooms/${room.id}`); return; }
    setJoining(true);
    const result = await joinRoom(room.code);
    setJoining(false);
    if (result.ok && result.roomId) navigate(`/rooms/${result.roomId}`);
  };

  const copyCode = (code: string, roomId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLeave = async (roomId: string, isHost: boolean) => {
    const msg = isHost
      ? '방을 닫으면 모든 멤버가 퇴장됩니다. 계속할까요?'
      : '이 방에서 나가시겠습니까?';
    if (!confirm(msg)) return;
    await leaveRoom(roomId);
  };

  const filteredPublic = publicRooms.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Spinner = () => (
    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>그룹 스터디룸</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>친구들과 카드 세트를 공유하고 함께 공부하세요. 최대 8명 참여 가능</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-md" onClick={() => { setShowJoin(v => !v); setShowCreate(false); setError(''); }}>
            <LogIn size={15} /> 코드로 참여
          </button>
          <button className="btn btn-primary btn-md" onClick={() => { setShowCreate(v => !v); setShowJoin(false); setError(''); }}>
            <Plus size={15} /> 방 만들기
          </button>
        </div>
      </div>

      {/* 방 만들기 폼 */}
      {showCreate && (
        <div className="card card-glow" style={{ padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>새 스터디룸 만들기</h2>
            <button onClick={() => { setShowCreate(false); resetCreateForm(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 방 이름 */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>방 이름 *</label>
              <input type="text" className="input" placeholder="예: 토익 900점 스터디" value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus />
            </div>

            {/* 설명 */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>설명 (선택)</label>
              <input type="text" className="input" placeholder="이 방에 대한 간단한 설명" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>

            {/* 초대 코드 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>초대 코드</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={useCustomCode} onChange={e => setUseCustomCode(e.target.checked)}
                    style={{ accentColor: 'var(--blue)', width: 14, height: 14 }} />
                  직접 설정
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" className="input"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  disabled={!useCustomCode} maxLength={8}
                  style={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: '0.25em', textAlign: 'center', fontWeight: 800, color: 'var(--blue)', opacity: useCustomCode ? 1 : 0.6 }} />
                {!useCustomCode && (
                  <button type="button" onClick={() => setNewCode(randomCode())} title="코드 재생성"
                    className="btn btn-secondary btn-sm" style={{ flexShrink: 0, padding: '0 10px', height: 38 }}>
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>
                {useCustomCode ? '4~8자리 영문/숫자로 직접 설정' : '🔀 버튼으로 재생성하거나 "직접 설정"으로 원하는 코드 입력'}
              </p>
            </div>

            {/* 공개/비공개 */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>공개 설정</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { value: true, icon: Globe, label: '공개', desc: '누구나 방 목록에서 발견하고 참여 가능' },
                  { value: false, icon: Lock, label: '비공개', desc: '초대 코드가 있어야만 참여 가능' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button key={String(value)} type="button"
                    onClick={() => setIsPublic(value)}
                    style={{
                      padding: '12px 14px', border: `2px solid ${isPublic === value ? 'var(--blue)' : 'var(--border)'}`,
                      borderRadius: 10, background: isPublic === value ? 'var(--blue-bg)' : 'var(--bg-2)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Icon size={14} color={isPublic === value ? 'var(--blue)' : 'var(--text-3)'} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: isPublic === value ? 'var(--blue)' : 'var(--text-1)' }}>{label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ fontSize: 13 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-md" onClick={() => { setShowCreate(false); resetCreateForm(); }}>취소</button>
              <button className="btn btn-primary btn-md" onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? <Spinner /> : <Plus size={15} />}
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 코드 참여 폼 */}
      {showJoin && (
        <div className="card card-glow" style={{ padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>초대 코드로 참여하기</h2>
            <button onClick={() => { setShowJoin(false); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>초대 코드 (4~8자리)</label>
              <input type="text" className="input" placeholder="예: ABC123" maxLength={8}
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.2em', textAlign: 'center' }} />
            </div>
            {error && <div className="alert alert-error" style={{ fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-md" onClick={() => { setShowJoin(false); setError(''); }}>취소</button>
              <button className="btn btn-primary btn-md" onClick={handleJoin} disabled={joining || joinCode.length < 4}>
                {joining ? <Spinner /> : <LogIn size={15} />}
                참여하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="tab-group" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
          내 스터디룸 {myRooms.length > 0 && `(${myRooms.length})`}
        </button>
        <button className={`tab-btn ${tab === 'public' ? 'active' : ''}`} onClick={() => setTab('public')}>
          <Globe size={13} /> 공개 방 탐색
        </button>
      </div>

      {/* 내 방 탭 */}
      {tab === 'my' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
          ) : myRooms.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Users size={28} color="var(--blue)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>참여 중인 스터디룸이 없습니다</h3>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.7 }}>
                새 방을 만들거나 친구에게 초대 코드를 받아 참여해보세요.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn btn-secondary btn-md" onClick={() => { setShowJoin(true); setError(''); }}>
                  <LogIn size={15} /> 코드로 참여
                </button>
                <button className="btn btn-primary btn-md" onClick={() => { setShowCreate(true); setError(''); }}>
                  <Plus size={15} /> 방 만들기
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  copiedId={copiedId}
                  onCopy={copyCode}
                  onEnter={() => navigate(`/rooms/${room.id}`)}
                  onLeave={() => handleLeave(room.id, room.isHost)}
                  showLeave
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* 공개 방 탭 */}
      {tab === 'public' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input type="text" className="input" placeholder="방 이름 또는 설명 검색..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }} />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={refreshPublic} title="새로고침">
              <RefreshCw size={14} />
            </button>
          </div>

          {publicLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
          ) : filteredPublic.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <Globe size={28} color="var(--text-3)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                {searchQuery ? '검색 결과가 없습니다' : '공개된 스터디룸이 없습니다'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {searchQuery ? '다른 검색어를 시도해보세요.' : '첫 번째 공개 스터디룸을 만들어보세요!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredPublic.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  copiedId={copiedId}
                  onCopy={copyCode}
                  onEnter={() => handleJoinPublic(room)}
                  joinLabel={room.isMember ? '입장' : '참여'}
                  joinDisabled={joining}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* 안내 카드 */}
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { step: '1', title: '방 만들기', desc: '공개 또는 비공개로 방을 만들면 6자리 초대 코드가 생성됩니다.' },
          { step: '2', title: '친구 초대', desc: '코드를 복사해 친구에게 공유하거나, 공개 방에서 바로 참여할 수 있습니다.' },
          { step: '3', title: '함께 공부', desc: '카드 세트를 공유하고 방 안에서 함께 플래시카드·테스트·학습을 진행하세요.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue)', color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{step}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 방 카드 컴포넌트 ──
function RoomCard({
  room, copiedId, onCopy, onEnter, onLeave, showLeave, joinLabel = '입장', joinDisabled,
}: {
  room: StudyRoom;
  copiedId: string | null;
  onCopy: (code: string, id: string) => void;
  onEnter: () => void;
  onLeave?: () => void;
  showLeave?: boolean;
  joinLabel?: string;
  joinDisabled?: boolean;
}) {
  return (
    <div className="card" style={{ padding: '18px 22px', transition: 'all .15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* 아이콘 */}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: room.isPublic ? 'var(--blue-bg)' : 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
          {room.isPublic ? <Globe size={22} color="var(--blue)" /> : <Lock size={20} color="var(--text-3)" />}
        </div>

        {/* 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</span>
            {room.isHost && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--yellow)', fontWeight: 600, flexShrink: 0 }}>
                <Crown size={11} fill="var(--yellow)" /> 방장
              </span>
            )}
            {room.isMember && !room.isHost && (
              <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, flexShrink: 0 }}>참여 중</span>
            )}
          </div>
          {room.description && (
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.description}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={11} /> {room.memberCount} / {room.maxMembers}명
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <BookOpen size={11} /> 세트 {room.sharedSetCount ?? 0}개
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {room.isPublic ? <Globe size={11} /> : <Lock size={11} />}
              {room.isPublic ? '공개' : '비공개'}
            </span>
          </div>
        </div>

        {/* 코드 + 액션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-2)', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--blue)' }}>{room.code}</span>
            <button onClick={() => onCopy(room.code, room.id)} title="코드 복사"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === room.id ? 'var(--green)' : 'var(--text-3)', padding: 2, display: 'flex' }}>
              {copiedId === room.id ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          <button onClick={onEnter} disabled={joinDisabled} className="btn btn-primary btn-sm">
            {joinLabel} <ChevronRight size={13} />
          </button>
          {showLeave && onLeave && (
            <button onClick={onLeave} title={room.isHost ? '방 닫기' : '방 나가기'}
              className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', fontSize: 12 }}>
              {room.isHost ? '닫기' : '나가기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
