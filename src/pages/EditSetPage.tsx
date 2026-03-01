import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, Save, Image, X, FileUp } from 'lucide-react';
import { parseCSV } from '../utils/csv';
import type { CardSet, Folder } from '../types';

interface EditSetPageProps {
  cardSets: CardSet[];
  folders: Folder[];
  onUpdateSet: (id: string, updates: { title?: string; description?: string; category?: string; folderId?: string | null }) => Promise<void>;
  onAddCard: (setId: string, term: string, definition: string, hint?: string) => Promise<void>;
  onUpdateCard: (setId: string, cardId: string, updates: { term?: string; definition?: string; hint?: string; imageUrl?: string }) => Promise<void>;
  onDeleteCard: (setId: string, cardId: string) => Promise<void>;
  onSaveCards: (setId: string, cards: { id?: string; term: string; definition: string; hint?: string; imageUrl?: string; isNew?: boolean }[]) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
}

interface DraftCard {
  id?: string;
  term: string;
  definition: string;
  hint: string;
  imageUrl?: string;
  isNew?: boolean;
  uploading?: boolean;
}

export default function EditSetPage({ cardSets, folders, onUpdateSet, onSaveCards, onUploadImage }: EditSetPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const csvRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(set?.title ?? '');
  const [description, setDescription] = useState(set?.description ?? '');
  const [category, setCategory] = useState(set?.category ?? '');
  const [folderId, setFolderId] = useState<string>(set?.folderId ?? '');
  const [cards, setCards] = useState<DraftCard[]>(
    set?.cards.map(c => ({ id: c.id, term: c.term, definition: c.definition, hint: c.hint ?? '', imageUrl: c.imageUrl })) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvInfo, setCsvInfo] = useState('');

  const handleCsvImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) { setError('CSV에서 카드를 읽을 수 없습니다.'); return; }
      const newCards: DraftCard[] = parsed.map(c => ({ term: c.term, definition: c.definition, hint: c.hint ?? '', isNew: true }));
      setCards(prev => [...prev, ...newCards]);
      setCsvInfo(`CSV에서 ${parsed.length}개 카드를 추가했습니다.`);
      setTimeout(() => setCsvInfo(''), 3000);
    };
    reader.readAsText(file, 'utf-8');
  };

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

  const handleImageUpload = async (i: number, file: File) => {
    setCards(c => c.map((card, idx) => idx === i ? { ...card, uploading: true } : card));
    const url = await onUploadImage(file);
    setCards(c => c.map((card, idx) => idx === i ? { ...card, imageUrl: url ?? undefined, uploading: false } : card));
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('제목을 입력하세요.'); return; }
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length === 0) { setError('카드를 최소 1개 이상 추가하세요.'); return; }
    setLoading(true); setError('');
    try {
      await onUpdateSet(id!, { title: title.trim(), description: description.trim() || undefined, category: category.trim() || undefined, folderId: folderId || null });
      await onSaveCards(id!, validCards.map(c => ({ id: c.id, term: c.term.trim(), definition: c.definition.trim(), hint: c.hint.trim() || undefined, imageUrl: c.imageUrl, isNew: c.isNew })));
      navigate(`/set/${id}`);
    } catch {
      setError('저장에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
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

      {/* Set info */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>제목 *</label>
            <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>카테고리</label>
              <input type="text" className="input" placeholder="카테고리" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>설명</label>
              <input type="text" className="input" placeholder="설명" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>폴더</label>
              <select className="input" value={folderId} onChange={e => setFolderId(e.target.value)}
                style={{ cursor: 'pointer' }}>
                <option value="">폴더 없음</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {cards.map((card, i) => (
          <div key={i} className="card-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>카드 {i + 1}</span>
              <button type="button" onClick={() => removeCard(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>힌트 (선택)</label>
                <input type="text" className="input" placeholder="힌트..." value={card.hint} onChange={e => updateCard(i, 'hint', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>이미지</label>
                {card.imageUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={card.imageUrl} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                    <button onClick={() => setCards(c => c.map((ca, idx) => idx === i ? { ...ca, imageUrl: undefined } : ca))}
                      style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: 'var(--red)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={10} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      ref={el => { fileRefs.current[i] = el; }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(i, f); }} />
                    <button type="button" className="btn btn-secondary btn-sm"
                      onClick={() => fileRefs.current[i]?.click()}
                      disabled={card.uploading}
                      style={{ height: 56, width: 56, padding: 0, flexDirection: 'column', gap: 2, fontSize: 10 }}>
                      {card.uploading ? <span style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                        : <><Image size={16} /><span>추가</span></>}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {csvInfo && <div className="alert alert-success" style={{ marginBottom: 12, fontSize: 13 }}>{csvInfo}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-secondary btn-md" onClick={addCard}>
          <Plus size={15} /> 카드 추가
        </button>
        <input type="file" accept=".csv,.tsv,.txt" style={{ display: 'none' }} ref={csvRef}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvImport(f); e.target.value = ''; }} />
        <button type="button" className="btn btn-secondary btn-md" onClick={() => csvRef.current?.click()}
          title="CSV 파일에서 카드 가져오기">
          <FileUp size={15} /> CSV 가져오기
        </button>
      </div>
    </div>
  );
}
