import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, Save } from 'lucide-react';
import type { CardSet } from '../types';

interface EditSetPageProps {
  cardSets: CardSet[];
  onUpdateSet: (id: string, updates: { title?: string; description?: string; category?: string }) => Promise<void>;
  onAddCard: (setId: string, term: string, definition: string, hint?: string) => Promise<void>;
  onUpdateCard: (setId: string, cardId: string, updates: { term?: string; definition?: string; hint?: string }) => Promise<void>;
  onDeleteCard: (setId: string, cardId: string) => Promise<void>;
  onSaveCards: (setId: string, cards: { id?: string; term: string; definition: string; hint?: string; isNew?: boolean }[]) => Promise<void>;
}

interface DraftCard {
  id?: string;
  term: string;
  definition: string;
  hint: string;
  isNew?: boolean;
}

export default function EditSetPage({ cardSets, onUpdateSet, onSaveCards }: EditSetPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  const [title, setTitle] = useState(set?.title ?? '');
  const [description, setDescription] = useState(set?.description ?? '');
  const [category, setCategory] = useState(set?.category ?? '');
  const [cards, setCards] = useState<DraftCard[]>(
    set?.cards.map(c => ({ id: c.id, term: c.term, definition: c.definition, hint: c.hint ?? '' })) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!set) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>세트를 찾을 수 없습니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  const addCard = () => setCards(c => [...c, { term: '', definition: '', hint: '', isNew: true }]);
  const removeCard = (i: number) => setCards(c => c.filter((_, idx) => idx !== i));
  const updateCard = (i: number, field: keyof DraftCard, value: string) =>
    setCards(c => c.map((card, idx) => idx === i ? { ...card, [field]: value } : card));

  const handleSave = async () => {
    if (!title.trim()) { setError('제목을 입력하세요.'); return; }
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length === 0) { setError('카드를 최소 1개 이상 추가하세요.'); return; }
    setLoading(true); setError('');
    try {
      await onUpdateSet(id!, { title: title.trim(), description: description.trim() || undefined, category: category.trim() || undefined });
      await onSaveCards(id!, validCards.map(c => ({ id: c.id, term: c.term.trim(), definition: c.definition.trim(), hint: c.hint.trim() || undefined, isNew: c.isNew })));
      navigate(`/set/${id}`);
    } catch {
      setError('저장에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> 뒤로
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>세트 편집</h1>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
          {loading ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} /> : <Save size={14} />}
          저장
        </button>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>제목 *</label>
            <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>카테고리</label>
              <input type="text" className="input" placeholder="카테고리" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>설명</label>
              <input type="text" className="input" placeholder="설명" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {cards.map((card, i) => (
          <div key={i} className="card-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>카드 {i + 1}</span>
              <button type="button" onClick={() => removeCard(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>용어</label>
                <input type="text" className="input" value={card.term} onChange={e => updateCard(i, 'term', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>정의</label>
                <input type="text" className="input" value={card.definition} onChange={e => updateCard(i, 'definition', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>힌트</label>
              <input type="text" className="input" placeholder="힌트 (선택)" value={card.hint} onChange={e => updateCard(i, 'hint', e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-secondary btn-md" onClick={addCard}>
        <Plus size={15} /> 카드 추가
      </button>
    </div>
  );
}
