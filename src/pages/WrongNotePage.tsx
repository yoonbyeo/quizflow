import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, BookOpen, Brain, RotateCcw, Filter } from 'lucide-react';
import ImageZoom from '../components/ui/ImageZoom';
import InfoTooltip from '../components/ui/InfoTooltip';
import type { CardSet } from '../types';

interface WrongNotePageProps {
  cardSets: CardSet[];
}

interface WrongCard {
  setId: string;
  setTitle: string;
  cardId: string;
  term: string;
  definition: string;
  imageUrl?: string;
  incorrect: number;
  correct: number;
  streak: number;
  difficulty: string;
}

export default function WrongNotePage({ cardSets }: WrongNotePageProps) {
  const navigate = useNavigate();
  const [filterSetId, setFilterSetId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'incorrect' | 'ratio'>('incorrect');
  const [expanded, setExpanded] = useState<string | null>(null);

  // 오답이 있는 카드 수집
  const allWrongCards: WrongCard[] = [];
  for (const set of cardSets) {
    const stats = set.studyStats?.cardStats ?? {};
    for (const card of set.cards) {
      const stat = stats[card.id];
      if (stat && stat.incorrect > 0) {
        allWrongCards.push({
          setId: set.id,
          setTitle: set.title,
          cardId: card.id,
          term: card.term,
          definition: card.definition,
          imageUrl: card.imageUrl,
          incorrect: stat.incorrect,
          correct: stat.correct,
          streak: stat.streak,
          difficulty: stat.difficulty,
        });
      }
    }
  }

  const filtered = allWrongCards.filter(c => filterSetId === 'all' || c.setId === filterSetId);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'incorrect') return b.incorrect - a.incorrect;
    const ratioA = a.incorrect / Math.max(1, a.incorrect + a.correct);
    const ratioB = b.incorrect / Math.max(1, b.incorrect + b.correct);
    return ratioB - ratioA;
  });

  const setsWithErrors = cardSets.filter(s => {
    const stats = s.studyStats?.cardStats ?? {};
    return s.cards.some(c => stats[c.id]?.incorrect > 0);
  });

  const totalWrong = allWrongCards.length;
  const hardCards = allWrongCards.filter(c => c.incorrect >= 3).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <AlertCircle size={20} color="var(--red)" />
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>오답 노트</h1>
          <InfoTooltip
            text={'학습하기·테스트·쓰기 모드에서 한 번이라도 틀린 카드가 자동으로 기록됩니다.\n\n• 오답 횟수순 또는 오답률순으로 정렬할 수 있습니다.\n• 3회 이상 틀린 카드는 "집중 필요" 카드로 표시됩니다.\n• 카드를 클릭하면 정의를 바로 확인할 수 있습니다.'}
            position="right" width={270} />
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>자주 틀리는 카드를 모아 집중 학습하세요</p>
      </div>

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--red)', fontSize: 24 }}>{totalWrong}</div>
          <div className="stat-label">오답 카드</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--yellow)', fontSize: 24 }}>{hardCards}</div>
          <div className="stat-label">3회 이상 오답</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--blue)', fontSize: 24 }}>{setsWithErrors.length}</div>
          <div className="stat-label">관련 세트</div>
        </div>
      </div>

      {totalWrong === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ width: 72, height: 72, background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <RotateCcw size={28} color="var(--green)" />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>오답이 없습니다!</p>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>학습 모드에서 문제를 풀면 오답이 기록됩니다</p>
        </div>
      ) : (
        <>
          {/* 필터 & 정렬 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={14} color="var(--text-3)" />
            <select className="input" style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
              value={filterSetId} onChange={e => setFilterSetId(e.target.value)}>
              <option value="all">전체 세트</option>
              {setsWithErrors.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <select className="input" style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
              value={sortBy} onChange={e => setSortBy(e.target.value as 'incorrect' | 'ratio')}>
              <option value="incorrect">오답 횟수순</option>
              <option value="ratio">오답률순</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-2)' }}>{sorted.length}개</span>
          </div>

          {/* 카드 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map(c => {
              const total = c.incorrect + c.correct;
              const ratio = Math.round((c.incorrect / total) * 100);
              const isOpen = expanded === c.cardId;

              return (
                <div key={c.cardId} className="card" style={{ padding: 0, overflow: 'hidden', border: c.incorrect >= 3 ? '1px solid rgba(248,81,73,.25)' : '1px solid var(--border)' }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : c.cardId)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    {/* 오답 배지 */}
                    <div style={{ minWidth: 44, height: 44, borderRadius: 10, background: c.incorrect >= 3 ? 'var(--red-bg)' : 'var(--yellow-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: c.incorrect >= 3 ? 'var(--red)' : 'var(--yellow)', lineHeight: 1 }}>{c.incorrect}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>오답</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.term}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.setTitle}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: ratio >= 60 ? 'var(--red)' : 'var(--yellow)' }}>{ratio}%</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.correct}정 / {c.incorrect}오</span>
                    </div>
                    <ChevronRight size={14} color="var(--text-3)" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', background: 'var(--bg-2)' }}>
                      {c.imageUrl && (
                        <ImageZoom src={c.imageUrl} style={{ maxHeight: 120, borderRadius: 8, marginBottom: 12, objectFit: 'contain' }} />
                      )}
                      <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>정답 (정의)</div>
                        <p style={{ fontSize: 14, lineHeight: 1.5 }}>{c.definition}</p>
                      </div>
                      {/* 정답률 바 */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                          <span>정답률</span><span>{100 - ratio}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${100 - ratio}%`, background: 'linear-gradient(90deg, var(--green), var(--blue))', borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/learn/${c.setId}`)} style={{ gap: 4 }}>
                          <Brain size={12} /> 학습하기
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${c.setId}`)} style={{ gap: 4 }}>
                          <BookOpen size={12} /> 세트 보기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
