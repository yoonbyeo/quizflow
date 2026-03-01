import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, RotateCcw, Timer } from 'lucide-react';
import { shuffleArray } from '../utils';
import type { CardSet } from '../types';

interface MatchPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

interface MatchItem {
  id: string;
  cardId: string;
  text: string;
  type: 'term' | 'definition';
  matched: boolean;
}

export default function MatchPage({ cardSets, onUpdateStat }: MatchPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  const initItems = useMemo<MatchItem[]>(() => {
    if (!set) return [];
    const cards = set.cards.slice(0, 8);
    const terms: MatchItem[] = cards.map(c => ({ id: `t-${c.id}`, cardId: c.id, text: c.term, type: 'term', matched: false }));
    const defs: MatchItem[] = cards.map(c => ({ id: `d-${c.id}`, cardId: c.id, text: c.definition, type: 'definition', matched: false }));
    return shuffleArray([...terms, ...defs]);
  }, [set]);

  const [items, setItems] = useState<MatchItem[]>(initItems);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const handleSelect = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.matched) return;

    if (!selected) {
      setSelected(itemId);
      return;
    }
    if (selected === itemId) { setSelected(null); return; }

    const prev = items.find(i => i.id === selected)!;
    if (prev.cardId === item.cardId && prev.type !== item.type) {
      const next = items.map(i => i.id === selected || i.id === itemId ? { ...i, matched: true } : i);
      setItems(next);
      setSelected(null);
      await onUpdateStat(item.cardId, true);
      if (next.every(i => i.matched)) {
        setElapsed(Date.now() - startTime);
        setFinished(true);
      }
    } else {
      setWrong([selected, itemId]);
      await onUpdateStat(item.cardId, false);
      setTimeout(() => { setWrong([]); setSelected(null); }, 800);
    }
  };

  const restart = () => {
    setItems(shuffleArray(initItems.map(i => ({ ...i, matched: false }))));
    setSelected(null);
    setWrong([]);
    setFinished(false);
  };

  if (!set || set.cards.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>카드가 2개 이상 필요합니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  if (finished) {
    const sec = Math.round(elapsed / 1000);
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trophy size={32} color="var(--green)" />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>완료!</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>모든 카드를 매칭했습니다</p>
        <div className="stat-card" style={{ marginBottom: 24 }}>
          <div className="stat-value" style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Timer size={24} /> {sec}초
          </div>
          <div className="stat-label">완료 시간</div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={restart}><RotateCcw size={15} /> 다시</button>
          <button className="btn btn-primary btn-md" onClick={() => navigate(`/set/${id}`)}>세트로</button>
        </div>
      </div>
    );
  }

  const matched = items.filter(i => i.matched).length / 2;
  const total = items.length / 2;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> {set.title}
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{matched} / {total} 매칭</span>
      </div>

      <div className="progress-track" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${(matched / total) * 100}%` }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={`match-btn ${item.matched ? 'matched' : wrong.includes(item.id) ? 'wrong' : selected === item.id ? 'selected' : ''}`}
          >
            {item.text}
          </button>
        ))}
      </div>
    </div>
  );
}
