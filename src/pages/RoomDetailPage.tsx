import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, Crown, Copy, Check, Plus, Trash2,
  BookOpen, Zap, PenLine, Brain, ChevronRight, ChevronLeft as ChevLeft,
  RotateCcw, X, Globe, Lock, RefreshCw,
} from 'lucide-react';
import { useRoomDetail } from '../hooks/useStudyRooms';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { CardSet, Card } from '../types';
import ImageZoom from '../components/ui/ImageZoom';

interface RoomDetailPageProps {
  user: User | null;
  cardSets: CardSet[];
}

// ── 다른 멤버 카드 fetch 훅 ──
function useSharedCards(setId: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!setId) { setCards([]); return; }
    setLoading(true);
    supabase
      .from('cards')
      .select('*')
      .eq('set_id', setId)
      .order('position')
      .then(({ data }) => {
        setCards((data ?? []).map((c: any) => ({
          id: c.id,
          term: c.term,
          definition: c.definition,
          hint: c.hint ?? undefined,
          imageUrl: c.image_url ?? undefined,
          createdAt: c.created_at ? new Date(c.created_at).getTime() : 0,
          updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : 0,
        })));
        setLoading(false);
      });
  }, [setId]);

  return { cards, loading };
}

// ── 인라인 플래시카드 ──
function SharedFlashcard({ cards, title, loading }: { cards: Card[]; title: string; loading?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { setIdx(0); setFlipped(false); }, [cards]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '30px 0' }}><div className="spinner" /></div>
  );
  if (cards.length === 0) return (
    <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>카드가 없거나 불러올 수 없습니다.</p>
  );

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

// ── 카드 목록 보기 ──
function CardListView({ cards, loading }: { cards: Card[]; loading?: boolean }) {
  if (loading) return <div style={{ textAlign: 'center', padding: '20px 0' }}><div className="spinner" /></div>;
  if (cards.length === 0) return <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>카드가 없습니다.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
      {cards.map((card, i) => (
        <div key={card.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text-3)', minWidth: 22, flexShrink: 0 }}>{i + 1}</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{card.term}</span>
          <span style={{ flex: 1, color: 'var(--text-2)' }}>{card.definition}</span>
        </div>
      ))}
    </div>
  );
}

export default function RoomDetailPage({ user, cardSets }: RoomDetailPageProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, members, sharedSets, loading, addSharedSet, removeSharedSet, kickMember, refresh } = useRoomDetail(roomId, user?.id);

  const [showAddSet, setShowAddSet] = useState(false);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  // 현재 펼쳐진 세트 및 뷰 모드
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flashcard' | 'list'>('flashcard');

  // 다른 멤버 세트 카드 fetch
  const { cards: fetchedCards, loading: cardsLoading } = useSharedCards(activeSetId);

  // 현재 활성 세트 카드: 내 세트면 prop에서, 아니면 fetch 결과
  const getCardsForSet = useCallback((setId: string): { cards: Card[]; loading: boolean } => {
    const mySet = cardSets.find(s => s.id === setId);
    if (mySet) return { cards: mySet.cards, loading: false };
    if (activeSetId === setId) return { cards: fetchedCards, loading: cardsLoading };
    return { cards: [], loading: false };
  }, [cardSets, activeSetId, fetchedCards, cardsLoading]);

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddSet = async (setId: string, setTitle: string) => {
    setAdding(true); setAddError('');
    const result = await addSharedSet(setId, setTitle);
    setAdding(false);
    if (result.ok) { setShowAddSet(false); }
    else { setAddError(result.error ?? '추가 실패'); }
  };

  const sharedSetIds = new Set(sharedSets.map(s => s.setId));
  const availableSets = cardSets.filter(s => !sharedSetIds.has(s.id));

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
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px' }}>
                {room.isPublic ? <><Globe size={10} /> 공개</> : <><Lock size={10} /> 비공개</>}
              </span>
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

          {/* 초대 코드 + 새로고침 */}
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
            <button className="btn btn-ghost btn-sm" onClick={refresh} style={{ marginTop: 8, width: '100%', justifyContent: 'center', fontSize: 11 }}>
              <RefreshCw size={12} /> 새로고침
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* ── 왼쪽: 공유 세트 ── */}
        <div>
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
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>추가할 수 있는 세트가 없습니다.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {availableSets.map(set => (
                    <div key={set.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{set.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{set.cards.length}개 카드</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddSet(set.id, set.title)} disabled={adding}>
                        <Plus size={13} /> 추가
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {addError && <div className="alert alert-error" style={{ fontSize: 12, marginTop: 10 }}>{addError}</div>}
            </div>
          )}

          {/* 공유 세트 목록 */}
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
                const isActive = activeSetId === s.setId;
                const { cards: setCards, loading: setLoading } = isActive ? getCardsForSet(s.setId) : { cards: [], loading: false };
                const addedByMe = s.addedBy === user?.id;

                return (
                  <div key={s.id} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={20} color="var(--blue)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {s.cardCount}개 카드 · 공유: {s.addedByName}
                          {addedByMe && <span style={{ color: 'var(--blue)', marginLeft: 4 }}>(나)</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {/* 학습 모드 바로가기 */}
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/flashcard/${s.setId}`)} title="플래시카드">
                          <Zap size={13} /> 플래시카드
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/test/${s.setId}`)} title="테스트">
                          <PenLine size={13} /> 테스트
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/learn/${s.setId}`)} title="학습하기">
                          <Brain size={13} /> 학습
                        </button>
                        {/* 미리보기 토글 */}
                        <button
                          className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            setActiveSetId(isActive ? null : s.setId);
                            setViewMode('flashcard');
                          }}>
                          {isActive ? '닫기' : '미리보기'}
                        </button>
                        {(room.isHost || addedByMe) && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                            onClick={() => { if (confirm('이 세트를 방에서 제거할까요?')) removeSharedSet(s.id); }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 펼침: 미리보기 */}
                    {isActive && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 20px 24px' }}>
                        {/* 뷰 모드 탭 */}
                        <div className="tab-group" style={{ marginBottom: 16 }}>
                          <button className={`tab-btn ${viewMode === 'flashcard' ? 'active' : ''}`} onClick={() => setViewMode('flashcard')}>
                            <Zap size={12} /> 플래시카드
                          </button>
                          <button className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                            <BookOpen size={12} /> 카드 목록
                          </button>
                        </div>
                        {viewMode === 'flashcard' ? (
                          <SharedFlashcard cards={setCards} title={s.title} loading={setLoading} />
                        ) : (
                          <CardListView cards={setCards} loading={setLoading} />
                        )}
                        {/* 전체 화면 학습 링크 */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                          {[
                            { label: '플래시카드 학습', icon: Zap, path: `/flashcard/${s.setId}` },
                            { label: '테스트', icon: PenLine, path: `/test/${s.setId}` },
                            { label: '학습하기', icon: Brain, path: `/learn/${s.setId}` },
                          ].map(({ label, icon: Icon, path }) => (
                            <button key={label} className="btn btn-secondary btn-sm" onClick={() => navigate(path)}>
                              <Icon size={13} /> {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 오른쪽: 멤버 목록 ── */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>멤버 ({members.length}명)</h2>
          <div className="card" style={{ padding: '10px 12px' }}>
            {members.map((member, i) => (
              <div key={member.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="avatar" style={{ width: 34, height: 34, fontSize: 14, flexShrink: 0 }}>
                  {(member.nickname[0] ?? '?').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.userId === user?.id ? `${member.nickname} (나)` : member.nickname}
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
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4, display: 'flex', opacity: 0.5, transition: 'opacity .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 초대 코드 */}
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

          {/* 방 설정 정보 */}
          <div className="card" style={{ padding: '14px 16px', marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>공개 설정</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-1)', fontWeight: 600 }}>
                  {room.isPublic ? <><Globe size={12} /> 공개</> : <><Lock size={12} /> 비공개</>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>최대 인원</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{room.maxMembers}명</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>생성일</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>
                  {new Date(room.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
