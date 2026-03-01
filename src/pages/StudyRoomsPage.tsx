import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LogIn, Copy, Check, Crown, BookOpen, X, ChevronRight } from 'lucide-react';
import { useStudyRooms } from '../hooks/useStudyRooms';
import type { User } from '@supabase/supabase-js';

interface StudyRoomsPageProps {
  user: User | null;
}

export default function StudyRoomsPage({ user }: StudyRoomsPageProps) {
  const navigate = useNavigate();
  const { myRooms, loading, createRoom, joinRoom, leaveRoom } = useStudyRooms(user?.id);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) { setError('방 이름을 입력하세요.'); return; }
    setCreating(true); setError('');
    const room = await createRoom(newName.trim(), newDesc.trim() || undefined);
    setCreating(false);
    if (room) {
      setShowCreate(false); setNewName(''); setNewDesc('');
      navigate(`/rooms/${room.id}`);
    } else {
      setError('방 만들기에 실패했습니다.');
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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>그룹 스터디룸</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>친구들과 카드 세트를 공유하고 함께 공부하세요. 최대 8명 참여 가능</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-md" onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}>
            <LogIn size={15} /> 코드로 참여
          </button>
          <button className="btn btn-primary btn-md" onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}>
            <Plus size={15} /> 방 만들기
          </button>
        </div>
      </div>

      {/* 방 만들기 폼 */}
      {showCreate && (
        <div className="card card-glow" style={{ padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>새 스터디룸 만들기</h2>
            <button onClick={() => { setShowCreate(false); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>방 이름 *</label>
              <input type="text" className="input" placeholder="예: 토익 900점 스터디" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>설명 (선택)</label>
              <input type="text" className="input" placeholder="이 방에 대한 간단한 설명" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
            {error && <div className="alert alert-error" style={{ fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-md" onClick={() => { setShowCreate(false); setError(''); }}>취소</button>
              <button className="btn btn-primary btn-md" onClick={handleCreate} disabled={creating}>
                {creating ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} /> : <Plus size={15} />}
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
            <button onClick={() => { setShowJoin(false); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>초대 코드 (6자리)</label>
              <input type="text" className="input" placeholder="예: ABC123" maxLength={6}
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.2em', textAlign: 'center' }} />
            </div>
            {error && <div className="alert alert-error" style={{ fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-md" onClick={() => { setShowJoin(false); setError(''); }}>취소</button>
              <button className="btn btn-primary btn-md" onClick={handleJoin} disabled={joining || joinCode.length < 6}>
                {joining ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} /> : <LogIn size={15} />}
                참여하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 방 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myRooms.map(room => (
            <div key={room.id} className="card" style={{ padding: '18px 22px', cursor: 'pointer', transition: 'all .15s' }}
              onClick={() => navigate(`/rooms/${room.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* 아이콘 */}
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={22} color="var(--blue)" />
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
                  </div>
                  {room.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.description}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={11} /> {room.memberCount} / {room.maxMembers}명
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={11} /> 공유 세트 있음
                    </span>
                  </div>
                </div>

                {/* 초대 코드 + 액션 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-2)', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--blue)' }}>{room.code}</span>
                    <button
                      onClick={() => copyCode(room.code, room.id)}
                      title="코드 복사"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === room.id ? 'var(--green)' : 'var(--text-3)', padding: 2, display: 'flex' }}>
                      {copiedId === room.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleLeave(room.id, room.isHost)}
                    title={room.isHost ? '방 닫기' : '방 나가기'}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--red)', fontSize: 12 }}>
                    {room.isHost ? '닫기' : '나가기'}
                  </button>
                  <ChevronRight size={16} color="var(--text-3)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 안내 */}
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { step: '1', title: '방 만들기', desc: '방 이름을 입력하면 6자리 초대 코드가 자동 생성됩니다.' },
          { step: '2', title: '친구 초대', desc: '초대 코드를 복사해 친구들에게 공유하세요. 최대 8명까지 참여 가능합니다.' },
          { step: '3', title: '함께 공부', desc: '카드 세트를 방에 공유하고, 멤버들과 함께 학습하세요.' },
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
