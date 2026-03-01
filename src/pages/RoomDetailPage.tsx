import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, Crown, Copy, Check, Plus, Trash2,
  BookOpen, Zap, PenLine, Brain, ChevronRight, ChevronLeft as ChevLeft, RotateCcw, X
} from 'lucide-react';
import { useRoomDetail } from '../hooks/useStudyRooms';
import type { User } from '@supabase/supabase-js';
import type { CardSet } from '../types';
import ImageZoom from '../components/ui/ImageZoom';

interface RoomDetailPageProps {
  user: User | null;
  cardSets: CardSet[];
}

// ── 인라인 플래시카드 (공유 세트용) ──
function SharedFlashcard({ cards, title }: { cards: CardSet['cards']; title: string }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (cards.length === 0) return <p style={{ fontSize: 13, color: 'var(--text-3)' }}>카드가 없습니다.</p>;
  const card = cards[idx];
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>{title} · {cards.length}개</div>
      <div className="flip-card" style={{ height: card.imageUrl ? 300 : 220, cursor: 'pointer', marginBottom: 12 }}
        onClick={() => setFlipped(f => !f)}>
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-front">
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>용어</div>
            {card.imageUrl && !flipped && (
              <ImageZoom src={card.imageUrl} style={{ maxHeight: 120, maxWidth: '80%', borderRadius: 8, objectFit: 'contain', marginBottom: 10, border: '1px solid var(--border)' }} />
            )}
            <p style={{ fontSize: 20, fontWeight: 700 }}>{card.term}</p>
            {card.hint && !flipped && <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>힌트: {card.hint}</p>}
            {!flipped && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>클릭하여 뒤집기</p>}
          </div>
          <div className="flip-back">
            <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>정의</div>
            <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>{card.definition}</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={idx === 0} className="btn btn-secondary btn-sm"><ChevLeft size={15} /></button>
        <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 60, textAlign: 'center' }}>{idx + 1} / {cards.length}</span>
        <button onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} disabled={idx === cards.length - 1} className="btn btn-secondary btn-sm"><ChevronRight size={15} /></button>
        <button onClick={() => { setIdx(0); setFlipped(false); }} className="btn btn-ghost btn-sm"><RotateCcw size={13} /></button>
      </div>
    </div>
  );
}

export default function RoomDetailPage({ user, cardSets }: RoomDetailPageProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, members, sharedSets, loading, addSharedSet, removeSharedSet, kickMember } = useRoomDetail(roomId, user?.id);

  const [showAddSet, setShowAddSet] = useState(false);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSetId, setActiveSetId] = useState<string | null>(null); // 학습 중인 세트

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddSet = async (setId: string) => {
    setAdding(true); setAddError('');
    const result = await addSharedSet(setId);
    setAdding(false);
    if (result.ok) { setShowAddSet(false); }
    else { setAddError(result.error ?? '추가 실패'); }
  };

  // 이미 공유된 세트 ID 목록
  const sharedSetIds = new Set(sharedSets.map(s => s.setId));
  // 내가 추가할 수 있는 세트 (내 세트 중 아직 공유 안된 것)
  const availableSets = cardSets.filter(s => !sharedSetIds.has(s.id));

  // 현재 학습 중인 공유 세트의 카드 데이터
  const activeSharedSet = activeSetId ? sharedSets.find(s => s.setId === activeSetId) : null;
  const activeCardSet = activeSetId ? cardSets.find(s => s.id === activeSetId) : null;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>스터디룸을 찾을 수 없습니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate('/rooms')}>돌아가기</button>
      </div>
    );
  }

  if (!room.isMember) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>이 방의 멤버가 아닙니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate('/rooms')}>돌아가기</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/rooms')} style={{ marginBottom: 20, gap: 4 }}>
        <ChevronLeft size={15} /> 스터디룸 목록
      </button>

      {/* ── 방 헤더 ── */}
      <div className="card card-glow" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{room.name}</h1>
              {room.isHost && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--yellow)', fontWeight: 700 }}>
                  <Crown size={13} fill="var(--yellow)" /> 방장
                </span>
              )}
            </div>
            {room.description && <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 10 }}>{room.description}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={13} /> {room.memberCount} / {room.maxMembers}명
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <BookOpen size={13} /> 공유 세트 {sharedSets.length}개
              </span>
            </div>
          </div>
          {/* 초대 코드 */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>초대 코드</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-2)', border: '2px solid var(--border)', borderRadius: 12, padding: '10px 16px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 900, letterSpacing: '0.2em', color: 'var(--blue)' }}>{room.code}</span>
              <button onClick={copyCode} title="코드 복사"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--green)' : 'var(--text-3)', padding: 4, display: 'flex' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>친구에게 공유하세요</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* ── 왼쪽: 공유 세트 + 학습 ── */}
        <div>
          {/* 공유된 세트 목록 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>공유된 카드 세트 ({sharedSets.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAddSet(v => !v); setAddError(''); }}>
              <Plus size={14} /> 세트 추가
            </button>
          </div>

          {/* 세트 추가 패널 */}
          {showAddSet && (
            <div className="card" style={{ padding: '18px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>내 세트에서 추가</span>
                <button onClick={() => setShowAddSet(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={15} /></button>
              </div>
              {availableSets.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>추가할 수 있는 세트가 없습니다. (모두 공유되었거나 세트가 없습니다.)</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {availableSets.map(set => (
                    <div key={set.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{set.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{set.cards.length}개 카드</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddSet(set.id)} disabled={adding}>
                        <Plus size={13} /> 추가
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {addError && <div className="alert alert-error" style={{ fontSize: 12, marginTop: 10 }}>{addError}</div>}
            </div>
          )}

          {/* 공유 세트 카드들 */}
          {sharedSets.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <BookOpen size={28} color="var(--text-3)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>아직 공유된 카드 세트가 없습니다.</p>
              <button className="btn btn-primary btn-md" onClick={() => setShowAddSet(true)}>
                <Plus size={15} /> 내 세트 공유하기
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sharedSets.map(s => {
                const cs = cardSets.find(c => c.id === s.setId);
                const isStudying = activeSetId === s.setId;
                return (
                  <div key={s.id} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={20} color="var(--blue)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.cardCount}개 카드</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {cs && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/flashcard/${s.setId}`)}>
                              <Zap size={13} /> 플래시카드
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/test/${s.setId}`)}>
                              <PenLine size={13} /> 테스트
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/learn/${s.setId}`)}>
                              <Brain size={13} /> 학습
                            </button>
                          </>
                        )}
                        <button
                          className={`btn btn-sm ${isStudying ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setActiveSetId(isStudying ? null : s.setId)}>
                          {isStudying ? '닫기' : '미리보기'}
                        </button>
                        {(room.isHost || s.addedBy === user?.id) && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                            onClick={() => { if (confirm('이 세트를 방에서 제거할까요?')) removeSharedSet(s.id); }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 카드 미리보기 */}
                    {isStudying && cs && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 20px 24px' }}>
                        <SharedFlashcard cards={cs.cards} title={s.title} />
                      </div>
                    )}

                    {/* 세트가 없을 때 (다른 멤버의 세트) */}
                    {isStudying && !cs && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>이 세트는 다른 멤버의 세트입니다.</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                          <button className="btn btn-primary btn-md" onClick={() => navigate(`/flashcard/${s.setId}`)}>
                            <Zap size={15} /> 플래시카드로 학습
                          </button>
                          <button className="btn btn-secondary btn-md" onClick={() => navigate(`/test/${s.setId}`)}>
                            <PenLine size={15} /> 테스트
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 학습 모드 바로가기 (공유 세트가 있을 때) */}
          {activeSharedSet && activeCardSet && (
            <div className="card" style={{ padding: '18px 20px', marginTop: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>"{activeSharedSet.title}" 학습 모드</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: '플래시카드', icon: Zap, path: `/flashcard/${activeSetId}` },
                  { label: '테스트', icon: PenLine, path: `/test/${activeSetId}` },
                  { label: '학습하기', icon: Brain, path: `/learn/${activeSetId}` },
                ].map(({ label, icon: Icon, path }) => (
                  <button key={label} className="btn btn-secondary btn-md" onClick={() => navigate(path)}>
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 오른쪽: 멤버 목록 ── */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>멤버 ({members.length}명)</h2>
          <div className="card" style={{ padding: '10px 12px' }}>
            {members.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: '1px solid var(--border)' }}
                className="card-row-hover">
                <div className="avatar" style={{ width: 34, height: 34, fontSize: 14, flexShrink: 0 }}>
                  {member.nickname[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.userId === user?.id ? '나' : member.nickname}
                    {member.isHost && (
                      <Crown size={11} fill="var(--yellow)" color="var(--yellow)" style={{ marginLeft: 5, display: 'inline', verticalAlign: 'middle' }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {member.isHost ? '방장' : '멤버'} · {new Date(member.joinedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 참여
                  </div>
                </div>
                {room.isHost && member.userId !== user?.id && (
                  <button
                    onClick={() => { if (confirm(`${member.nickname}님을 강퇴하시겠습니까?`)) kickMember(member.id); }}
                    title="강퇴"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4, display: 'flex', opacity: 0.6 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 초대 안내 */}
          <div className="card" style={{ padding: '16px', marginTop: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.6 }}>
              아래 코드를 공유해 친구를 초대하세요
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, letterSpacing: '0.2em', color: 'var(--blue)', marginBottom: 10 }}>
              {room.code}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={copyCode} style={{ width: '100%', justifyContent: 'center' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '복사됨!' : '코드 복사'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
